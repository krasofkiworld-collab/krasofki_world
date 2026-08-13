import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

const API_URL = "https://api.novaposhta.ua/v2.0/json/";

// Prep code for the Nova Poshta integration (task requested by the store
// owner) — the API key is entered by them in /admin/settings, not baked
// into env vars, since only they can generate it from their business
// cabinet. Nothing in the checkout flow calls this yet; these are the
// building blocks for when that's wired up.

async function getApiKey(): Promise<string | null> {
  const { data } = await supabaseServer.from("store_settings").select("nova_poshta_api_key").eq("id", true).single();
  return data?.nova_poshta_api_key ?? null;
}

class NovaPoshtaError extends Error {}

async function call<T>(modelName: string, calledMethod: string, methodProperties: Record<string, unknown> = {}): Promise<T> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new NovaPoshtaError("Ключ Нової пошти не налаштований (Адмінка → Налаштування)");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
  });

  const json = await res.json();
  if (!json.success) {
    throw new NovaPoshtaError(json.errors?.[0] ?? json.warnings?.[0] ?? "Nova Poshta API error");
  }
  return json.data as T;
}

export type NpSettlement = {
  Ref: string;
  Present: string;
  Region: string;
};

/** Address.searchSettlements — city/town autocomplete for the delivery form. */
export async function searchSettlements(query: string, limit = 10) {
  const data = await call<{ Addresses: NpSettlement[] }[]>("Address", "searchSettlements", {
    CityName: query,
    Limit: limit,
  });
  return data[0]?.Addresses ?? [];
}

export type NpWarehouse = {
  Ref: string;
  Description: string;
  Number: string;
  CityRef: string;
};

/** Address.getWarehouses — branch/parcel-locker list for a chosen city. */
export async function getWarehouses(settlementRef: string, limit = 50) {
  return call<NpWarehouse[]>("AddressGeneral", "getWarehouses", {
    SettlementRef: settlementRef,
    Limit: limit,
  });
}

export type NpCostEstimate = {
  Cost: number;
  CostRedelivery: number;
  TZoneInfo: unknown;
};

/** InternetDocument.getDocumentPrice — shipping cost estimate for checkout. */
export async function calculateDeliveryCost(params: {
  citySenderRef: string;
  cityRecipientRef: string;
  weightKg: number;
  cost: number;
  seatsAmount?: number;
}) {
  const [estimate] = await call<NpCostEstimate[]>("InternetDocument", "getDocumentPrice", {
    CitySender: params.citySenderRef,
    CityRecipient: params.cityRecipientRef,
    Weight: params.weightKg,
    ServiceType: "WarehouseWarehouse",
    Cost: params.cost,
    CargoType: "Cargo",
    SeatsAmount: params.seatsAmount ?? 1,
  });
  return estimate;
}

export type NpInvoiceResult = {
  Ref: string;
  CostOnSite: number;
  EstimatedDeliveryDate: string;
  IntDocNumber: string; // the TTN
};

/**
 * InternetDocument.save — generates a real waybill (ТТН). Needs full
 * sender/recipient details; left unwired until the store owner confirms
 * their sender profile (Counterparty) in the business cabinet.
 */
export async function createInvoice(params: {
  citySenderRef: string;
  senderRef: string;
  senderContactRef: string;
  senderAddressRef: string;
  senderPhone: string;
  cityRecipientRef: string;
  recipientWarehouseRef: string;
  recipientName: string;
  recipientPhone: string;
  weightKg: number;
  cost: number;
  seatsAmount?: number;
  description: string;
}) {
  const [result] = await call<NpInvoiceResult[]>("InternetDocument", "save", {
    PayerType: "Sender",
    PaymentMethod: "Cash",
    CargoType: "Cargo",
    Weight: params.weightKg,
    ServiceType: "WarehouseWarehouse",
    SeatsAmount: params.seatsAmount ?? 1,
    Description: params.description,
    Cost: params.cost,
    CitySender: params.citySenderRef,
    Sender: params.senderRef,
    ContactSender: params.senderContactRef,
    SendersPhone: params.senderPhone,
    SenderAddress: params.senderAddressRef,
    CityRecipient: params.cityRecipientRef,
    RecipientWarehouse: params.recipientWarehouseRef,
    RecipientName: params.recipientName,
    RecipientsPhone: params.recipientPhone,
  });
  return result;
}
