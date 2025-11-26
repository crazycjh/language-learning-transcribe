'use client';

import { ChevronLeft, ChevronRight, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const t = useTranslations("practice");
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
          <h3 className="text-xl mb-2">{t("allComplete")}</h3>
          <p>{t("congratulations")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {/* 進度指示 */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400 text-sm">
          {t("practiceProgress")}: {currentSegmentIndex + 1} / {segments.length}
        </span>
        <span className="text-slate-400 text-sm">
          {Math.round(segmentProgress)}% {t("played")}
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
              <span className="text-xs text-slate-600 group-hover:text-slate-400">{t("previousSentence")}</span>
              <p className="opacity-70 group-hover:opacity-90 mt-1 line-clamp-2">{previousSegment.text}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-2 flex-shrink-0" />
          </div>
        </button>
      )}
      
      {/* 當前句子 */}
      <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-blue-600">
        <div className="mb-2">
          <span className="text-xs text-blue-400 font-medium">{t("currentSentence")}</span>
        </div>
        <div className="relative mb-3">
          <div className="text-slate-100 text-base leading-relaxed">
            {showFeedback ? (
              currentSegment.text
            ) : (
              <span className="text-slate-400 italic flex items-center gap-2">
                <span>{t("listenAndType")}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0 pointer-events-auto">
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      align="start"
                      hideArrow
                      className="bg-slate-700 text-slate-100 border-slate-600 max-w-xs"
                    >
                      <p className="text-sm">{currentSegment.text}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            )}
          </div>
        </div>
        
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
              {segmentProgress === 100 ? `✓ ${t("completed")}` : t("playing")}
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
              <span className="text-xs text-slate-600 group-hover:text-slate-400">{t("nextSentence")}</span>
              <p className="opacity-70 group-hover:opacity-90 mt-1 line-clamp-2">{nextSegment.text}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-2 flex-shrink-0" />
          </div>
        </button>
      )}
    </div>
  );
}