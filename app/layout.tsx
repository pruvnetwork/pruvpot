import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRUVPOT — Provably Fair on Solana",
  description: "Verifiable lottery powered by PRUV Protocol. No operator picks the winner; verify every round yourself.",
  metadataBase: new URL("https://pruvpot.vercel.app"),
  // Link previews (X, Telegram, Discord). public/og.png is 1200×630.
  openGraph: {
    title: "PRUVPOT — Provably Fair on Solana",
    description: "No operator picks the winner. Recompute every round yourself from chain data.",
    url: "/",
    siteName: "PRUVPOT",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PRUVPOT: no operator picks the winner" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRUVPOT — Provably Fair on Solana",
    description: "No operator picks the winner. Recompute every round yourself from chain data.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}})()` }} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
