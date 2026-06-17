import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { NavigationRepair } from "@/components/NavigationRepair";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bluesia Cinema",
  description: "Góc nhỏ của người đam mê phim",
  applicationName: "Bluesia Cinema",
  openGraph: {
    title: "Bluesia Cinema",
    description: "Góc nhỏ của người đam mê phim",
    siteName: "Bluesia Cinema",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Bluesia Cinema"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Bluesia Cinema",
    description: "Góc nhỏ của người đam mê phim",
    images: ["/icon-512.png"]
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"]
  },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07090f"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <main className="mx-auto min-h-screen w-full max-w-[720px] safe-bottom">
          {children}
        </main>
        <NavigationRepair />
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
