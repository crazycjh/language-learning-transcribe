"use client";

import { useEffect, useState } from "react";
import {
  YouTubePlayer,
  type YouTubePlayerInterface,
} from "@/components/YouTubePlayer";
import { SrtTranscriptViewer } from "@/components/SrtTranscriptViewer";
import { BlanksFillPractice } from "@/components/BlanksFillPractice";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { parseSRT, type Segment } from "@/lib/srt-utils";

// 4voKeMm3u1Y
export default function VideoPlayerClient({ videoId }: { videoId: string }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [srtContent, setSrtContent] = useState("");
  const [player, setPlayer] = useState<YouTubePlayerInterface | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

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

  const handlePreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setShowFeedback(false);
    }
  };

  const handleNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setShowFeedback(false);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (player) {
      player.setPlaybackRate(rate);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 p-10 md:h-screen">
      <div className="w-full md:w-1/2">
        <YouTubePlayer
          videoId={videoId}
          onTimeUpdate={handleTimeUpdate}
          onPlayerReady={setPlayer}
        />
        <div className="mt-4 flex items-center gap-2 md:gap-4">
          {/* <span className="text-slate-400">當前時間: {Math.round(currentTime)}s</span> */}
          <div className="flex gap-1 md:gap-2">
            <button
              className={`px-2 py-1 md:px-4 md:py-2 text-sm md:text-base rounded transition-colors ${
                !isPracticeMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              onClick={() => setIsPracticeMode(false)}
            >
              觀看模式
            </button>
            <button
              className={`px-2 py-1 md:px-4 md:py-2 text-sm md:text-base rounded transition-colors ${
                isPracticeMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              onClick={() => setIsPracticeMode(true)}
            >
              聽打練習
            </button>
          </div>
          <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
            <span className="text-slate-400 text-xs md:text-base">播放速度:</span>
            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
              className="px-2 py-1 md:px-3 md:py-2 text-sm md:text-base rounded bg-slate-700 text-slate-100 border border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={0.8}>0.8x</option>
              <option value={0.85}>0.85x</option>
              <option value={0.9}>0.9x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={1.75}>1.75x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>

        {/* 練習模式下顯示句子信息（僅在電腦版左右分欄時） */}
        {isPracticeMode && segments.length > 0 && (
          <div className="hidden md:block">
            <SentenceDisplay
              segments={segments}
              currentSegmentIndex={currentSegmentIndex}
              currentTime={currentTime}
              showFeedback={showFeedback}
              onPreviousSegment={handlePreviousSegment}
              onNextSegment={handleNextSegment}
            />
          </div>
        )}
      </div>
      <div className="w-full md:w-1/2 h-[60vh] md:h-full">
        {isPracticeMode ? (
          <BlanksFillPractice
            segments={segments}
            player={player}
            currentTime={currentTime}
            currentSegmentIndex={currentSegmentIndex}
            showFeedback={showFeedback}
            onSegmentIndexChange={setCurrentSegmentIndex}
            onFeedbackChange={setShowFeedback}
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
    </div>
  );
}
