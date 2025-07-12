'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check } from "lucide-react";

interface SrtTranscriptViewerProps {
  srtContent: string;
  currentTime: number;
  onSegmentClick: (time: number) => void;
}

interface Segment {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

function parseSRT(srtContent: string): Segment[] {
  const segments: Segment[] = [];
  const blocks = srtContent.trim().split('\n\n');
  
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;
    
    const id = parseInt(lines[0]);
    const times = lines[1].split(' --> ');
    const text = lines.slice(2).join('\n');
    
    // 將時間字串 "00:00:00,000" 轉換為秒數
    const timeToSeconds = (timeStr: string) => {
      const [hours, minutes, seconds] = timeStr.split(':');
      const [secs, ms] = seconds.split(',');
      return parseInt(hours) * 3600 + 
             parseInt(minutes) * 60 + 
             parseInt(secs) +
             parseInt(ms) / 1000;
    };
    
    segments.push({
      id,
      startTime: timeToSeconds(times[0]),
      endTime: timeToSeconds(times[1]),
      text
    });
  }
  
  return segments;
}

export function SrtTranscriptViewer({
  srtContent,
  currentTime,
  onSegmentClick
}: SrtTranscriptViewerProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [copiedSegmentId, setCopiedSegmentId] = useState<number | null>(null);
  
  // 解析 SRT 內容
  useEffect(() => {
    if (srtContent) {
      const parsed = parseSRT(srtContent);
      setSegments(parsed);
    }
  }, [srtContent]);
  
  // 更新當前活動片段
  useEffect(() => {
    const activeSegment = segments.find(
      segment => currentTime >= segment.startTime && currentTime < segment.endTime
    );
    setActiveSegmentId(activeSegment?.id || null);
  }, [currentTime, segments]);
  
  return (
    <div className="transcript-container h-full bg-slate-900">
      <ScrollArea className="h-full pt-4 px-4 space-y-4 border border-slate-800 bg-slate-950/50 rounded-md p-4">
        {segments.map((segment) => (
          <div
            key={segment.id}
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
                  } catch (err) {
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
