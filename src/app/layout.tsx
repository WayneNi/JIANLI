import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeCraft - AI 简历优化平台",
  description: "基于 STAR 法则，智能优化简历内容，提升面试机会",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${playfair.variable} ${sourceSans.variable} ${notoSansSC.variable} antialiased font-sans`}
        style={{ fontFamily: 'var(--font-noto-sans-sc), var(--font-source-sans), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
