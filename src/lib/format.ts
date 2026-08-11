// Deliberately not using Intl.NumberFormat's `style: "currency"` for UAH —
// Node's and the browser's bundled ICU data disagree on the UAH symbol
// ("грн" vs "₴"), which causes a server/client hydration mismatch. Format
// the number with Intl (locale-consistent grouping) and append a fixed,
// environment-independent suffix instead.
const CURRENCY_SUFFIX: Record<string, string> = {
  UAH: "грн",
};

export function formatMoney(amount: number, currency = "UAH") {
  const formatted = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(amount);
  return `${formatted} ${CURRENCY_SUFFIX[currency] ?? currency}`;
}
