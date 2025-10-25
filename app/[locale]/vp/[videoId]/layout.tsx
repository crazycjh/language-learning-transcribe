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
      const response = await fetch(`${workerUrl}/videolist`, {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const video = data.videos?.find((v: VideoListEntry) => v.videoId === videoId);

        if (video) {
          videoTitle = video.title || videoTitle;
          videoDescription = video.description || videoDescription;

          // 使用影片的縮圖
          if (video.thumbnail) {
            const match = video.thumbnail.match(/\.(\w+)$/);
            const ext = match ? match[1] : null;
            thumbnailUrl = ext
              ? `${siteUrl}/api/thumbnail/${videoId}?ext=${ext}`
              : `${siteUrl}/api/thumbnail/${videoId}`;
          }
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

// 獲取影片資訊的輔助函數（與 generateMetadata 共用邏輯）
async function getVideoInfo(videoId: string) {
  const workerUrl = process.env.WORKER_URL;

  let videoTitle = '影片播放';
  let videoDescription = '觀看並學習影片內容';

  try {
    if (workerUrl) {
      const response = await fetch(`${workerUrl}/videolist`, {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const video = data.videos?.find((v: VideoListEntry) => v.videoId === videoId);

        if (video) {
          videoTitle = video.title || videoTitle;
          videoDescription = video.description || videoDescription;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching video info:', error);
  }

  return { videoTitle, videoDescription };
}

export default async function VideoPlayerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const { videoTitle } = await getVideoInfo(videoId);

  return (
    <>
      {/* SEO: H1 標題 - Server Component 渲染，對 SEO 最佳 */}
      <h1 className="sr-only">{videoTitle}</h1>
      {children}
    </>
  );
}
