import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  const tVideoList = await getTranslations('videoList');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5566';

  const title = tVideoList('pageTitle') + ' | ' + t('title');
  const description = tVideoList('pageDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/video-list`,
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
