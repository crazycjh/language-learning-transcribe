'use client';

import { useState, useEffect } from 'react';

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
      segment => currentTime >= segment.startTime && currentTime <= segment.endTime
    );
    setActiveSegmentId(activeSegment?.id || null);
  }, [currentTime, segments]);
  
  return (
    <div className="transcript-container h-full overflow-auto">
      <div className="transcript-content space-y-4 p-4">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`segment p-2 rounded cursor-pointer transition-colors
              ${activeSegmentId === segment.id 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => onSegmentClick(segment.startTime)}
          >
            {segment.text}
          </div>
        ))}
      </div>
    </div>
  );
}
