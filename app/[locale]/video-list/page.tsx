import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { VideoListContent } from './VideoListContent';
import { VideoListSkeleton } from './VideoListSkeleton';

export default async function VideoListPage() {
  const t = await getTranslations('videoList');
  
  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-10 py-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-100">{t('title')}</h1>
      
      <Suspense fallback={<VideoListSkeleton />}>
        <VideoListContent />
      </Suspense>
    </div>
  );
}
