import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Distinct from the body face so headings (store name, product name, page
// titles) read as a real hierarchy instead of just a bigger size of the
// same text.
const heading = Unbounded({
  variable: "--font-heading-family",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Krosofki World — взуття з доставкою по Україні", template: "%s — Krosofki World" },
  description: "Кросівки, шльопанці та аксесуари з доставкою Новою поштою по всій Україні. Замовляйте через Telegram або на сайті.",
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Krosofki World",
    title: "Krosofki World — взуття з доставкою по Україні",
    description: "Кросівки, шльопанці та аксесуари з доставкою Новою поштою по всій Україні.",
  },
  twitter: { card: "summary_large_image" },
  // Set once you verify the site in Google Search Console — paste the
  // content value of the meta tag GSC gives you into this env var.
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
