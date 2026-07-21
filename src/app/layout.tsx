import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Scanner - Suivi Nutritionnel IA",
  description:
    "Scannez vos repas par photo avec l'IA et suivez votre deficit calorique",
  // Installation écran d'accueil iOS en plein écran (complète manifest.ts)
  appleWebApp: {
    capable: true,
    title: "FoodScanner",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <Navigation />
        <main className="flex-1 md:ml-0 pb-20 md:pb-0">{children}</main>
      </body>
    </html>
  );
}
