import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sansFont = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
});

const APP_NAME = "Menu Intelligent";
const APP_DESCRIPTION =
  "Décidez avant d'y aller : carte, régimes, budget et total estimé pour Le Train Bleu, Brasserie Bordelaise et Histoire Ancienne.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: { default: APP_NAME, template: "%s" },
  description: APP_DESCRIPTION,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1712",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${displayFont.variable} ${sansFont.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
