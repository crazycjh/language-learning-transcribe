'use client';

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, Loader2 } from "lucide-react";
import { parseSRT, type Segment } from "@/lib/srt-utils";

interface SrtTranscriptViewerProps {
  srtContent: string;
  currentTime: number;
  onSegmentClick: (time: number) => void;
}

export function SrtTranscriptViewer({
  srtContent,
  currentTime,
  onSegmentClick
}: SrtTranscriptViewerProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [copiedSegmentId, setCopiedSegmentId] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
  // 解析 SRT 內容
  useEffect(() => {
    if (srtContent) {
      const parsed = parseSRT(srtContent);
      setSegments(parsed);
    }
  }, [srtContent]);
  
  // 智慧滾動函數
  const scrollToSegment = (segmentId: number) => {
    const segmentElement = segmentRefs.current[segmentId];
    const container = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    
    if (!segmentElement || !container) return;
    
    const containerHeight = container.clientHeight;
    const elementTop = segmentElement.offsetTop;
    
    // 理想位置：距頂部100px
    const idealScrollTop = elementTop - 300;
    
    // 最大可滾動距離
    const maxScroll = container.scrollHeight - containerHeight;
    
    // 限制在可滾動範圍內
    const finalScrollTop = Math.max(0, Math.min(idealScrollTop, maxScroll));
    
    container.scrollTo({ top: finalScrollTop, behavior: 'smooth' });
  };

  // 更新當前活動片段
  useEffect(() => {
    const activeSegment = segments.find(
      segment => currentTime >= segment.startTime && currentTime < segment.endTime
    );
    setActiveSegmentId(activeSegment?.id || null);
  }, [currentTime, segments]);

  // 當活動片段改變時自動滾動
  useEffect(() => {
    if (activeSegmentId !== null) {
      scrollToSegment(activeSegmentId);
    }
  }, [activeSegmentId]);
  
  // 載入狀態
  if (!srtContent || segments.length === 0) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <h3 className="text-lg">載入逐字稿中...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-container h-full bg-slate-900">
      <ScrollArea ref={scrollAreaRef} className="h-full pt-4 px-4 space-y-4 border border-slate-800 bg-slate-950/50 rounded-md p-4">
        {segments.map((segment) => (
          <div
            key={segment.id}
            ref={(el) => { segmentRefs.current[segment.id] = el; }}
            className={`segment p-2 rounded cursor-pointer transition-colors flex items-center justify-between gap-2
              ${activeSegmentId === segment.id 
                ? 'bg-slate-800 dark:bg-slate-900' 
                : 'hover:bg-slate-800 hover:text-slate-100 dark:hover:bg-slate-800'}`}
            onClick={() => onSegmentClick(segment.startTime)}
          >
            <span className="flex-1">{segment.text}</span>
            <div className="relative flex-shrink-0">
              <button
                className="ml-2 p-1 rounded "
                title="複製"
                onClick={async e => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(segment.text);
                    setCopiedSegmentId(segment.id);
                    setTimeout(() => setCopiedSegmentId(null), 2000);
                  } catch {
                    // 可選：處理複製失敗
                  }
                }}
                tabIndex={0}
                type="button"
              >
                {copiedSegmentId === segment.id ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400 hover:text-slate-100" />
                )}
              </button>
              {copiedSegmentId === segment.id && (
                <div className="absolute -top-7 right-0 bg-slate-700 text-slate-100 px-2 py-1 rounded text-xs whitespace-nowrap shadow z-10">
                  已複製
                </div>
              )}
            </div>
          </div>
          
        ))}
      </ScrollArea>
    </div>
  );
}
