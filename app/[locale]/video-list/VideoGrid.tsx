'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Eye, User, Headphones, Loader2 } from 'lucide-react';
import { VideoListEntry } from '@/lib/types';
import { formatDuration, formatViewCount, getSrtContent } from '@/lib/video-service';
import Image from 'next/image';

export function VideoGrid({ videos }: { videos: VideoListEntry[] }) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <>
      {isNavigating && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {videos.map((video) => (
          <VideoCard key={video.videoId} video={video} onNavigate={() => setIsNavigating(true)} />
        ))}
      </div>
    </>
  );
}

function VideoCard({ video, onNavigate }: { video: VideoListEntry; onNavigate: () => void }) {
  const t = useTranslations('videoList');
  const locale = useLocale();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();

  // 滑鼠移到卡片上時預載入 SRT
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['srt', video.videoId],
      queryFn: () => getSrtContent(video.videoId),
    });
  };

  // 從 thumbnail URL 提取副檔名
  const getThumbnailExt = () => {
    if (!video.thumbnail) return null;
    const match = video.thumbnail.match(/\.(\w+)$/);
    return match ? match[1] : null;
  };

  const ext = getThumbnailExt();
  // 使用 Next.js API route 代理圖片，如果有副檔名就傳遞
  const thumbnailUrl = ext
    ? `/api/thumbnail/${video.videoId}?ext=${ext}`
    : `/api/thumbnail/${video.videoId}`;

  return (
    <Card
      className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors"
      onMouseEnter={handleMouseEnter}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
          {imageError ? (
            // Fallback: 顯示漸層背景 + Headphones icon
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <Headphones className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
            </div>
          ) : (
            <Image
              src={thumbnailUrl}
              alt={video.title}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              onError={() => setImageError(true)}
            />
          )}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 md:p-4">
        <CardTitle className="text-slate-100 text-xs md:text-sm font-medium mb-1 md:mb-2 line-clamp-2">
          {video.title}
        </CardTitle>

        <CardDescription className="text-slate-400 text-[10px] md:text-xs mb-2 md:mb-3">
          <div className="flex items-center gap-1 mb-1">
            <User className="h-2.5 w-2.5 md:h-3 md:w-3" />
            <span className="truncate">{video.uploader || t('unknown')}</span>
          </div>

          {video.view_count && (
            <div className="flex items-center gap-1">
              <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span>{formatViewCount(video.view_count)}</span>
            </div>
          )}
        </CardDescription>

        <Button 
          className="w-full text-xs md:text-sm px-2 md:px-4" 
          size="sm"
          onClick={() => {
            onNavigate();
            router.push(`/${locale}/vp/${video.videoId}`);
          }}
        >
          <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">{t('startPractice')}</span>
          <span className="sm:hidden">{t('practice')}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
