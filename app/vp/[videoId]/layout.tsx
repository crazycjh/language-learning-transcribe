import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import type { VideoListEntry } from '@/lib/types';

export async function generateMetadata({
  params
}: {
  params: Promise<{ videoId: string }>
}): Promise<Metadata> {
  const { videoId } = await params;
  const t = await getTranslations('metadata');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5566';
  const workerUrl = process.env.WORKER_URL;

  // 嘗試獲取影片資訊
  let videoTitle = '影片播放';
  let videoDescription = '觀看並學習影片內容';
  let thumbnailUrl = `${siteUrl}/icon-512x512.png`;

  try {
    if (workerUrl) {
      const response = await fetch(`${workerUrl}/videolist`, {
        next: { revalidate: 3600 } // 快取 1 小時
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

  return {
    title,
    description: videoDescription,
    openGraph: {
      title,
      description: videoDescription,
      url: `${siteUrl}/vp/${videoId}`,
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
