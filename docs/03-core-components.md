# 核心組件設計

## 1. YouTubePlayer 組件設計

### 1.1 組件定義和類型
```typescript
// components/YouTubePlayer.tsx
interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  width?: number;
  height?: number;
}

export function YouTubePlayer({
  videoId,
  onTimeUpdate,
  width = 640,
  height = 360
}: YouTubePlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);

  useEffect(() => {
    // 初始化 YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new YT.Player('youtube-player', {
        videoId,
        width,
        height,
        playerVars: {
          controls: 1,
          autoplay: 0,
          rel: 0
        },
        events: {
          onStateChange: (event) => {
            // 處理播放狀態變化
          },
          onReady: (event) => {
            // 播放器就緒
          }
        }
      });
    };

    // 清理函數
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, width, height]);

  return (
    <div className="youtube-player-container">
      <div id="youtube-player"></div>
    </div>
  );
}
```

### 1.2 播放控制方法
```typescript
// 播放器控制函數
const playerControls = {
  play: () => playerRef.current?.playVideo(),
  pause: () => playerRef.current?.pauseVideo(),
  seekTo: (time: number) => playerRef.current?.seekTo(time, true),
  getCurrentTime: () => playerRef.current?.getCurrentTime() || 0
};
```

## 2. TranscriptDisplay 組件設計

### 2.1 組件定義
```typescript
// components/TranscriptDisplay.tsx
interface TranscriptDisplayProps {
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

export function TranscriptDisplay({
  srtContent,
  currentTime,
  onSegmentClick
}: TranscriptDisplayProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  
  return (
    <div className="transcript-container">
      <div className="transcript-content">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`segment ${activeSegmentId === segment.id ? 'active' : ''}`}
            onClick={() => onSegmentClick(segment.startTime)}
          >
            {segment.text}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.2 SRT 解析功能
```typescript
function parseSRT(srtContent: string): Segment[] {
  const segments: Segment[] = [];
  const blocks = srtContent.trim().split('\n\n');
  
  for (const block of blocks) {
    const [idStr, timeStr, ...textLines] = block.split('\n');
    const timeMatch = timeStr.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    
    if (timeMatch) {
      segments.push({
        id: parseInt(idStr),
        startTime: timeToSeconds(timeMatch[1]),
        endTime: timeToSeconds(timeMatch[2]),
        text: textLines.join('\n')
      });
    }
  }
  
  return segments;
}

// 將時間字符串轉換為秒數
function timeToSeconds(timeStr: string): number {
  const [time, ms] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
}
```

## 3. VideoTranscriptPage 整合頁面

### 3.1 頁面結構
```typescript
// app/video-transcript/[videoId]/page.tsx
export default function VideoTranscriptPage({ params }: { params: { videoId: string } }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [srtContent, setSrtContent] = useState<string>('');
  
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  const handleSegmentClick = (time: number) => {
    // 控制影片跳轉到指定時間
  };
  
  return (
    <div className="flex flex-row gap-4 p-4">
      <div className="w-1/2">
        <YouTubePlayer
          videoId={params.videoId}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
      <div className="w-1/2">
        <TranscriptDisplay
          srtContent={srtContent}
          currentTime={currentTime}
          onSegmentClick={handleSegmentClick}
        />
      </div>
    </div>
  );
}
```

### 3.2 狀態處理
```typescript
// 使用 React Context 管理全局狀態
const TranscriptContext = createContext<{
  currentTime: number;
  segments: Segment[];
  activeSegmentId: number | null;
} | null>(null);

// Provider組件
function TranscriptProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(transcriptReducer, initialState);
  
  return (
    <TranscriptContext.Provider value={state}>
      {children}
    </TranscriptContext.Provider>
  );
}
```

## 4. 樣式設計

### 4.1 基本樣式
```css
/* styles/components.css */
.transcript-container {
  height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1rem;
}

.transcript-content .segment {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.transcript-content .segment:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.transcript-content .segment.active {
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
}
```

### 4.2 響應式設計
```typescript
// Tailwind CSS 類名
const containerClasses = `
  flex
  flex-col
  md:flex-row
  gap-4
  p-4
  max-w-7xl
  mx-auto
`;

const videoClasses = `
  w-full
  md:w-1/2
  aspect-video
  rounded-lg
  overflow-hidden
  shadow-lg
`;

const transcriptClasses = `
  w-full
  md:w-1/2
  bg-white
  rounded-lg
  shadow-lg
  overflow-hidden
`;
