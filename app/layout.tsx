import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://equitykey.vercel.app"),
  title: { default: "EquityKey | Ownership, made programmable", template: "%s | EquityKey" },
  description: "Create and claim benefits tied to official Coinbase Tokenized Stock ownership on Base without giving up custody.",
  openGraph: { title: "EquityKey | Ownership, made programmable", description: "Prove ownership. Keep custody. Unlock utility on Base.", type: "website", images: [{ url: "/opengraph-image" }] },
  twitter: { card: "summary_large_image", title: "EquityKey", description: "Ownership, made programmable.", images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EquityKey",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: "Verify Coinbase Tokenized Stock ownership on Base and unlock non-custodial benefits.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return <html lang="en"><body className={`${geist.variable} ${mono.variable}`}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><Providers>{children}</Providers></body></html>;
}
