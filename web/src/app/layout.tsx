import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealGuard — Freeze the deal. Settle the truth.",
  description:
    "Agentic commerce escrow on GenLayer: freeze listing and delivery URLs, adjudicate frozen evidence with validator LLMs, prove drift with cross_check.",
  openGraph: {
    title: "DealGuard",
    description: "Agentic commerce infrastructure for the agentic economy.",
    images: ["/cover.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
