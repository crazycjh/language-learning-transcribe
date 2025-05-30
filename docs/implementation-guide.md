# YouTube 影片與逐字稿互動系統實作指南

## 1. 前置準備

### 1.1 環境設置
```bash
# 確保已安裝所需版本
node -v  # 應為 v18.0.0 或以上
npm -v   # 應為 v9.0.0 或以上

# 建立專案結構
mkdir -p app/video-player/[videoId]
mkdir -p app/video-list/[category]
mkdir -p components
mkdir -p lib
```

### 1.2 安裝基礎依賴
```bash
# 初始化專案
npm init -y

# 安裝核心依賴
npm install next@latest react@latest react-dom@latest
npm install @aws-sdk/client-s3     # R2 存儲訪問
npm install zod                     # 環境變量驗證

# 安裝開發依賴
npm install -D typescript @types/react @types/node
npm install -D tailwindcss postcss autoprefixer
```

## 2. 實作步驟

### 步驟 1：建立基礎頁面結構

1. **建立 app/video-player/[videoId]/page.tsx**
```typescript
// app/video-player/[videoId]/page.tsx
export default function VideoPlayerPage({ params }: { params: { videoId: string } }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <div className="w-full md:w-1/2">
        {/* YouTube 播放器將放置於此 */}
      </div>
      <div className="w-full md:w-1/2">
        {/* 逐字稿將放置於此 */}
      </div>
    </div>
  );
}
```

2. **建立 app/video-list/page.tsx**
```typescript
// app/video-list/page.tsx
export default function VideoListPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">影片列表</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 影片卡片將放置於此 */}
      </div>
    </div>
  );
}
```

### 步驟 2：實現 YouTube 播放器組件

1. **建立 components/YouTubePlayer.tsx**
```typescript
// components/YouTubePlayer.tsx
import { useEffect, useRef } from 'react';

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
    // 載入 YouTube IFrame API
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
            console.log('播放器已就緒');
          }
        }
      });
    };

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

### 步驟 3：實現逐字稿顯示組件

1. **建立 components/TranscriptDisplay.tsx**
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
  
  // 解析 SRT 內容
  useEffect(() => {
    if (srtContent) {
      const parsed = parseSRT(srtContent);
      setSegments(parsed);
    }
  }, [srtContent]);
  
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

### 步驟 4：實現 R2 存取服務

1. **設定環境變數**
```bash
# .env.local
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_ACCESS_KEY_SECRET=your_access_key_secret
R2_BUCKET_NAME=your_bucket_name
```

2. **建立 lib/r2-service.ts**
```typescript
// lib/r2-service.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_ACCESS_KEY_SECRET!,
  },
});

export async function getSRT(videoId: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `transcripts/${videoId}.srt`,
  });

  const response = await r2Client.send(command);
  return await response.Body?.transformToString() || '';
}
```

### 步驟 5：整合組件

1. **更新 app/video-player/[videoId]/page.tsx**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { TranscriptDisplay } from '@/components/TranscriptDisplay';
import { getSRT } from '@/lib/r2-service';

export default function VideoPlayerPage({ params }: { params: { videoId: string } }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [srtContent, setSrtContent] = useState('');
  
  useEffect(() => {
    async function loadSRT() {
      try {
        const content = await getSRT(params.videoId);
        setSrtContent(content);
      } catch (error) {
        console.error('載入逐字稿失敗:', error);
      }
    }
    
    loadSRT();
  }, [params.videoId]);
  
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  const handleSegmentClick = (time: number) => {
    // 控制影片跳轉
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <div className="w-full md:w-1/2">
        <YouTubePlayer
          videoId={params.videoId}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
      <div className="w-full md:w-1/2">
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

## 3. 性能優化

### 3.1 增加虛擬滾動支援
```typescript
// 安裝依賴
npm install @tanstack/react-virtual

// 更新 TranscriptDisplay.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// 在 TranscriptDisplay 組件中實現虛擬滾動
const virtualizer = useVirtualizer({
  count: segments.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 50,
  overscan: 5
});
```

### 3.2 實現緩存策略
```typescript
// lib/cache.ts
export function withCache(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    const response = await handler(req);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    return response;
  };
}
```

## 4. 測試和部署

### 4.1 運行開發服務器
```bash
npm run dev
```

### 4.2 構建生產版本
```bash
npm run build
npm start
```

### 4.3 部署到 Vercel
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入並部署
vercel login
vercel
```

## 5. 後續優化建議

1. **效能監控**
   - 實現性能指標追蹤
   - 監控資源使用情況

2. **使用者體驗改進**
   - 添加載入狀態顯示
   - 實現錯誤處理和重試機制
   - 優化移動端體驗

3. **功能擴充**
   - 添加字幕搜索功能
   - 實現筆記和標記功能
   - 支持更多影片來源

4. **安全性增強**
   - 實現請求限制
   - 加強錯誤處理
   - 完善日誌記錄

持續根據用戶反饋和使用情況進行調整和優化。
