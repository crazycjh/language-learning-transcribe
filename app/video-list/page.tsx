'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Eye, User, Headphones } from 'lucide-react';
import { VideoList, VideoListEntry } from '@/lib/types';
import { getVideoList, formatDuration, formatViewCount } from '@/lib/video-service';
import Link from 'next/link';
import Image from 'next/image';

export default function VideoListPage() {
  const [videoList, setVideoList] = useState<VideoList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        const data = await getVideoList();
        setVideoList(data);
      } catch (err) {
        console.error('Failed to fetch videos:', err);
        setError('無法載入影片列表');
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-slate-100">影片列表</h1>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-400">載入中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-slate-100">影片列表</h1>
        <div className="text-center text-red-400 p-8">
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            重新載入
          </Button>
        </div>
      </div>
    );
  }

  if (!videoList || videoList.videos.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-slate-100">影片列表</h1>
        <div className="text-center text-slate-400 p-8">
          <p>目前沒有已轉錄的影片</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">影片列表</h1>
        <div className="text-sm text-slate-400">
          共 {videoList.total_count} 部影片
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videoList.videos.map((video) => (
          <VideoCard key={video.videoId} video={video} />
        ))}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: VideoListEntry }) {
  const [imageError, setImageError] = useState(false);

  // 從 thumbnail URL 提取副檔名
  const getThumbnailExt = () => {
    if (!video.thumbnail) return null;
    const match = video.thumbnail.match(/\.(\w+)$/);
    console.log('檔案類型 ： ',match ? match[1] : null)
    return match ? match[1] : null;
  };

  const ext = getThumbnailExt();
  // 使用 Next.js API route 代理圖片，如果有副檔名就傳遞
  const thumbnailUrl = ext
    ? `/api/thumbnail/${video.videoId}?ext=${ext}`
    : `/api/thumbnail/${video.videoId}`;
  console.log('圖片網址：', thumbnailUrl)
  return (
    <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
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
      
      <CardContent className="p-4">
        <CardTitle className="text-slate-100 text-sm font-medium mb-2 line-clamp-2">
          {video.title}
        </CardTitle>
        
        <CardDescription className="text-slate-400 text-xs mb-3">
          <div className="flex items-center gap-1 mb-1">
            <User className="h-3 w-3" />
            <span>{video.uploader || '未知'}</span>
          </div>
          
          {video.view_count && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{formatViewCount(video.view_count)}</span>
            </div>
          )}
        </CardDescription>

        <Link href={`/vp/${video.videoId}`}>
          <Button className="w-full" size="sm">
            <Play className="h-4 w-4 mr-2" />
            開始練習
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
