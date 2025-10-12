import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "語聽通",
  description: "透過影片逐句聽寫和口說練習,提升語言聽力與表達能力",
};

// Root layout - 包含 HTML 結構，locale layout 負責 i18n
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
