import { getTranslations } from 'next-intl/server';
import { getVideoList } from '@/lib/video-service';
import { VideoGrid } from './VideoGrid';

export default async function VideoListPage() {
  const t = await getTranslations('videoList');
  
  // Server 端獲取資料，有 60 秒 cache
  const videoList = await getVideoList();

  if (!videoList || videoList.videos.length === 0) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 md:px-10 py-4">
        <h1 className="text-2xl font-bold mb-6 text-slate-100">{t('title')}</h1>
        <div className="text-center text-slate-400 p-8">
          <p>{t('noVideos')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-10 py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{t('title')}</h1>
        <div className="text-sm text-slate-400">
          {t('totalVideos', { count: videoList.total_count })}
        </div>
      </div>

      <VideoGrid videos={videoList.videos} />
    </div>
  );
}
