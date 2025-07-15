'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Segment } from "@/lib/srt-utils";

interface SentenceDisplayProps {
  segments: Segment[];
  currentSegmentIndex: number;
  currentTime: number;
  showFeedback: boolean;
  onPreviousSegment: () => void;
  onNextSegment: () => void;
}

export function SentenceDisplay({
  segments,
  currentSegmentIndex,
  currentTime,
  showFeedback,
  onPreviousSegment,
  onNextSegment
}: SentenceDisplayProps) {
  const currentSegment = segments[currentSegmentIndex];
  const previousSegment = currentSegmentIndex > 0 ? segments[currentSegmentIndex - 1] : null;
  const nextSegment = currentSegmentIndex < segments.length - 1 ? segments[currentSegmentIndex + 1] : null;

  // 計算當前句子播放百分比
  const calculateSegmentProgress = (): number => {
    if (!currentSegment) return 0;
    
    if (currentTime >= currentSegment.startTime && currentTime <= currentSegment.endTime) {
      const progress = (currentTime - currentSegment.startTime) / (currentSegment.endTime - currentSegment.startTime);
      return Math.min(Math.max(progress * 100, 0), 100);
    }
    
    if (currentTime > currentSegment.endTime) return 100;
    return 0;
  };

  const segmentProgress = calculateSegmentProgress();

  if (!currentSegment) {
    return (
      <div className="mt-4 p-4 bg-slate-800 rounded-lg">
        <div className="text-slate-400 text-center">
          <h3 className="text-xl mb-2">練習完成！</h3>
          <p>恭喜您完成了所有句子的練習</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {/* 進度指示 */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400 text-sm">
          練習進度: {currentSegmentIndex + 1} / {segments.length}
        </span>
        <span className="text-slate-400 text-sm">
          {Math.round(segmentProgress)}% 已播放
        </span>
      </div>

      {/* 上一句預覽 */}
      {previousSegment && (
        <button
          onClick={onPreviousSegment}
          className="w-full p-3 bg-slate-900/50 hover:bg-slate-800/70 rounded text-sm text-slate-500 hover:text-slate-300 border-l-2 border-slate-700 hover:border-slate-500 transition-all duration-200 text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-xs text-slate-600 group-hover:text-slate-400">上一句：</span>
              <p className="opacity-70 group-hover:opacity-90 mt-1 line-clamp-2">{previousSegment.text}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-2 flex-shrink-0" />
          </div>
        </button>
      )}
      
      {/* 當前句子 */}
      <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-blue-600">
        <div className="mb-2">
          <span className="text-xs text-blue-400 font-medium">當前句子</span>
        </div>
        <p className="text-slate-100 text-base leading-relaxed mb-3">
          {showFeedback ? currentSegment.text : "請先聽音頻，然後在右側輸入您聽到的內容"}
        </p>
        
        {/* 播放進度條 */}
        <div className="space-y-1">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${segmentProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>
              {currentTime >= currentSegment.startTime && currentTime <= currentSegment.endTime 
                ? `${(currentTime - currentSegment.startTime).toFixed(1)}s` 
                : '0.0s'} 
              / {(currentSegment.endTime - currentSegment.startTime).toFixed(1)}s
            </span>
            <span className="text-blue-400">
              {segmentProgress === 100 ? '✓ 已完成' : '播放中'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 下一句預覽 */}
      {nextSegment && (
        <button
          onClick={onNextSegment}
          className="w-full p-3 bg-slate-900/50 hover:bg-slate-800/70 rounded text-sm text-slate-500 hover:text-slate-300 border-l-2 border-slate-700 hover:border-slate-500 transition-all duration-200 text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-xs text-slate-600 group-hover:text-slate-400">下一句：</span>
              <p className="opacity-70 group-hover:opacity-90 mt-1 line-clamp-2">{nextSegment.text}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-2 flex-shrink-0" />
          </div>
        </button>
      )}
    </div>
  );
}