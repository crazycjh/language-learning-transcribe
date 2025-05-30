'use client';

import { useEffect, useState } from 'react';
import { YouTubePlayer, type YouTubePlayerInterface } from '@/components/YouTubePlayer';
import { SrtTranscriptViewer } from '@/components/SrtTranscriptViewer';
import { getSRT } from '@/lib/r2-service';

export default function VideoPlayerClient({ videoId }: { videoId: string }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [srtContent, setSrtContent] = useState('');
  const [player, setPlayer] = useState<YouTubePlayerInterface | null>(null);
  
  // useEffect(() => {
  //   async function loadSRT() {
  //     try {
  //       const content = await getSRT(videoId);
  //       setSrtContent(content);
  //     } catch (error) {
  //       console.error('載入逐字稿失敗:', error);
  //     }
  //   }
    
  //   loadSRT();
  // }, [videoId]);
  
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  const handleSegmentClick = (time: number) => {
    if (player) {
      player.seekTo(time);
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <div className="w-full md:w-1/2">
        <YouTubePlayer
          videoId={videoId}
          onTimeUpdate={handleTimeUpdate}
          onPlayerReady={setPlayer}
        />
      </div>
      <div className="w-full md:w-1/2">
        {/* <SrtTranscriptViewer
          srtContent={srtContent}
          currentTime={currentTime}
          onSegmentClick={handleSegmentClick}
        /> */}
      </div>
    </div>
  );
}
