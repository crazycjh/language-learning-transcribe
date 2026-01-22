import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import type { VideoListEntry } from '@/lib/types';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; videoId: string }>
}): Promise<Metadata> {
  const { locale, videoId } = await params;
  const t = await getTranslations('metadata');
  // 只在開發環境允許 localhost fallback，Production 必須設定環境變數
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3500'
      : (() => { throw new Error('NEXT_PUBLIC_SITE_URL must be set in production') })()
    );
  const workerUrl = process.env.WORKER_URL;

  // 嘗試獲取影片資訊
  let videoTitle = '影片播放';
  let videoDescription = '觀看並學習影片內容';
  let thumbnailUrl = `${siteUrl}/icon-512x512.png`;

  try {
    if (workerUrl) {
      // 使用新的 RESTful API
      const response = await fetch(`${workerUrl}/api/videolist`, {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const video = data.videos?.find((v: VideoListEntry) => v.videoId === videoId);

        if (video) {
          videoTitle = video.title || videoTitle;
          videoDescription = video.description || videoDescription;

          // 使用新的 thumbnail API（不需要副檔名）
          thumbnailUrl = `${siteUrl}/api/thumbnail/${videoId}`;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error);
  }

  const title = `${videoTitle} | ${t('title')}`;
  const canonicalUrl = `${siteUrl}/${locale}/vp/${videoId}`;

  return {
    title,
    description: videoDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh-TW': `${siteUrl}/zh-TW/vp/${videoId}`,
        'en': `${siteUrl}/en/vp/${videoId}`,
        'ja': `${siteUrl}/ja/vp/${videoId}`,
      },
    },
    openGraph: {
      title,
      description: videoDescription,
      url: canonicalUrl,
      type: 'video.other',
      images: [
        {
          url: thumbnailUrl,
          width: 1280,
          height: 720,
          alt: videoTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: videoDescription,
      images: [thumbnailUrl],
    },
  };
}

export default function VideoPlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
