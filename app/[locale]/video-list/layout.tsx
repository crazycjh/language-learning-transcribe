import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('metadata');
  const tVideoList = await getTranslations('videoList');
  // 只在開發環境允許 localhost fallback，Production 必須設定環境變數
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3500'
      : (() => { throw new Error('NEXT_PUBLIC_SITE_URL must be set in production') })()
    );

  const title = t('title');
  const description = tVideoList('pageDescription');
  const canonicalUrl = `${siteUrl}/${locale}/video-list`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh-TW': `${siteUrl}/zh-TW/video-list`,
        'en': `${siteUrl}/en/video-list`,
        'ja': `${siteUrl}/ja/video-list`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/icon-512x512.png`,
          width: 512,
          height: 512,
          alt: tVideoList('pageTitle'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/icon-512x512.png`],
    },
  };
}

export default function VideoListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
