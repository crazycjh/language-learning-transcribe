import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5566';

  return {
    title: '影片列表 | ' + t('title'),
    description: '瀏覽所有已轉錄的影片，開始您的語言學習之旅',
    openGraph: {
      title: '影片列表 | ' + t('title'),
      description: '瀏覽所有已轉錄的影片，開始您的語言學習之旅',
      url: `${siteUrl}/video-list`,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/icon-512x512.png`,
          width: 512,
          height: 512,
          alt: '影片列表',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: '影片列表 | ' + t('title'),
      description: '瀏覽所有已轉錄的影片，開始您的語言學習之旅',
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
