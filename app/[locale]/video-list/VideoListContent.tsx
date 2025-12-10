import { getVideoList } from '@/lib/video-service';
import { VideoGrid } from './VideoGrid';
import { getTranslations } from 'next-intl/server';

export async function VideoListContent() {
  const t = await getTranslations('videoList');
  const videoList = await getVideoList(); // 這裡的 await 不會阻塞頁面渲染

  if (!videoList || videoList.videos.length === 0) {
    return (
      <div className="text-center text-slate-400 p-8">
        <p>{t('noVideos')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <div className="text-sm text-slate-400">
          {t('totalVideos', { count: videoList.total_count })}
        </div>
      </div>
      <VideoGrid videos={videoList.videos} />
    </>
  );
}