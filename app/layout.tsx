import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import { getGAConfig } from '@/lib/ga-config';
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
  title: "LingoBitz",
  description: "Improve listening and speaking through video dictation and sentence practice",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

// Root layout - 包含 HTML 結構，locale layout 負責 i18n
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaConfig = getGAConfig();

  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100`}>
        {children}
        {gaConfig.measurementId && gaConfig.enabled && (
          <GoogleAnalytics gaId={gaConfig.measurementId} />
        )}
      </body>
    </html>
  );
}
