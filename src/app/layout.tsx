import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import { ToastProvider } from "@/components/layout/toast-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://alphak.io";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0E11",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Alpha K — 한국 코인 시장 인텔리전스",
    template: "%s | Alpha K",
  },
  description:
    "업비트/빗썸 급등 레이더, 김치프리미엄, 신규 상장 알림. 한국 코인 시장이 움직이기 전에 알려준다.",
  keywords: [
    "김치프리미엄",
    "급등알림",
    "코인상장",
    "업비트",
    "빗썸",
    "크립토",
    "알파케이",
    "고래추적",
    "토큰언락",
    "DeFi",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Alpha K — 한국 코인 시장이 움직이기 전에 알려준다",
    description: "급등 레이더 · 김치프리미엄 · 상장 알림 · 고래 추적",
    locale: "ko_KR",
    type: "website",
    siteName: "Alpha K",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha K — 한국 코인 시장 인텔리전스",
    description: "급등 레이더 · 김치프리미엄 · 상장 알림 · 고래 추적",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <QueryProvider>
          {children}
          <ToastProvider />
        </QueryProvider>
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
