"use client";

import { useEffect, useState } from "react";
import {
  YouTubePlayer,
  type YouTubePlayerInterface,
} from "@/components/YouTubePlayer";
import { SrtTranscriptViewer } from "@/components/SrtTranscriptViewer";
import { DictationPractice } from "@/components/DictationPractice";
import { getSRT } from "@/lib/r2-service";
import { parseSRT, type Segment } from "@/lib/srt-utils";

// 4voKeMm3u1Y
export default function VideoPlayerClient({ videoId }: { videoId: string }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [srtContent, setSrtContent] = useState("");
  const [player, setPlayer] = useState<YouTubePlayerInterface | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    async function loadSRT() {
      try {
        const response = await fetch(`/api/srt/${videoId}`);
        if (!response.ok) {
          throw new Error("無法取得 SRT");
        }
        const content = await response.text();
        setSrtContent(content);
        
        // 解析 SRT 並設置 segments
        const parsedSegments = parseSRT(content);
        setSegments(parsedSegments);
      } catch (error) {
        console.error("載入逐字稿失敗:", error);
      }
    }

    loadSRT();
  }, [videoId]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSegmentClick = (time: number) => {
    if (player) {
      player.seekTo(time);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-10 md:h-screen bg-slate-900">
      <div className="w-full md:w-1/2">
        <YouTubePlayer
          videoId={videoId}
          onTimeUpdate={handleTimeUpdate}
          onPlayerReady={setPlayer}
        />
        <div className="mt-4 flex items-center gap-4">
          <span className="text-slate-400">當前時間: {Math.round(currentTime)}s</span>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              isPracticeMode 
                ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={() => setIsPracticeMode(!isPracticeMode)}
          >
            {isPracticeMode ? '切換到觀看模式' : '切換到練習模式'}
          </button>
        </div>
      </div>
      <div className="w-full md:w-1/2">
        {isPracticeMode ? (
          <DictationPractice
            segments={segments}
            player={player}
            currentTime={currentTime}
          />
        ) : (
          <SrtTranscriptViewer
            srtContent={srtContent}
            currentTime={currentTime}
            onSegmentClick={handleSegmentClick}
          />
        )}
      </div>
    </div>
  );
}
