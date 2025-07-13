export interface Segment {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export function parseSRT(srtContent: string): Segment[] {
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