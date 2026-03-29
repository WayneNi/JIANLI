import type { Metadata } from "next";
import { Outfit, Sora, DM_Sans, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
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
    <html lang="zh-CN" className={`${outfit.variable} ${sora.variable} ${dmSans.variable} ${notoSansSC.variable}`}>
      <body
        className="antialiased font-sans"
      >
        {children}
      </body>
    </html>
  );
}
