# 性能與優化

## 1. SRT 解析優化

### 1.1 Worker 線程處理
```typescript
// workers/srt-parser.worker.ts
self.onmessage = (e: MessageEvent<string>) => {
  const srtContent = e.data;
  const segments = parseSRT(srtContent);
  self.postMessage(segments);
};

function parseSRT(content: string) {
  // 使用 Worker 線程解析 SRT 文件
  // 避免阻塞主線程
  return content
    .trim()
    .split('\n\n')
    .map(parseBlock)
    .filter(Boolean);
}
```

### 1.2 分批處理大型文件
```typescript
// lib/batch-processor.ts
export async function processLargeFile<T>(
  items: T[],
  batchSize: number,
  processFn: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processFn(batch);
    // 允許其他任務執行
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

## 2. 影片載入優化

### 2.1 預加載策略
```typescript
// components/YouTubePlayer.tsx
function usePreloadYouTube(videoId: string) {
  useEffect(() => {
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://www.youtube.com';
    document.head.appendChild(preconnect);

    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://www.youtube.com';
    document.head.appendChild(dnsPrefetch);

    return () => {
      document.head.removeChild(preconnect);
      document.head.removeChild(dnsPrefetch);
    };
  }, []);
}
```

### 2.2 播放質量自適應
```typescript
// lib/youtube-quality.ts
interface QualityLevel {
  height: number;
  label: string;
}

function selectOptimalQuality(
  availableQualities: QualityLevel[],
  bandwidth: number,
  screenHeight: number
): QualityLevel {
  // 根據網絡情況和屏幕大小選擇最佳質量
  if (bandwidth < 1000) { // 低於 1Mbps
    return availableQualities.find(q => q.height <= 360) 
           || availableQualities[0];
  }
  
  // 選擇不超過屏幕高度的最高質量
  return availableQualities
    .filter(q => q.height <= screenHeight)
    .sort((a, b) => b.height - a.height)[0];
}
```

## 3. 前端性能優化

### 3.1 組件懶加載
```typescript
// app/video-player/page.tsx
import dynamic from 'next/dynamic';

const YouTubePlayer = dynamic(
  () => import('@/components/YouTubePlayer'),
  {
    loading: () => <div>載入播放器中...</div>,
    ssr: false
  }
);

const TranscriptPanel = dynamic(
  () => import('@/components/TranscriptPanel'),
  {
    loading: () => <div>載入逐字稿中...</div>
  }
);
```

### 3.2 虛擬滾動優化
```typescript
// components/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function VirtualList<T>({ items, renderItem }: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index])}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 4. 資源緩存策略

### 4.1 SRT 文件緩存
```typescript
// lib/srt-cache.ts
import { createClient } from '@vercel/kv';

const kv = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!
});

export async function cacheSRT(
  videoId: string,
  content: string,
  ttl = 60 * 60 * 24 // 24小時
) {
  await kv.set(`srt:${videoId}`, content, { ex: ttl });
}

export async function getCachedSRT(videoId: string): Promise<string | null> {
  return kv.get(`srt:${videoId}`);
}
```

### 4.2 API 響應緩存
```typescript
// middleware/cache.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CACHE_DURATION = 60 * 60; // 1小時

export function withCache(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    const response = await handler(req);
    
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`
    );
    
    return response;
  };
}
```

## 5. 監控與優化指標

### 5.1 性能指標監控
```typescript
// lib/performance-monitoring.ts
export function captureWebVitals() {
  const reportWebVital = (metric: any) => {
    console.log(metric);
    // 發送到分析服務
  };

  web_vitals.onFCP(reportWebVital);
  web_vitals.onLCP(reportWebVital);
  web_vitals.onCLS(reportWebVital);
  web_vitals.onFID(reportWebVital);
  web_vitals.onTTFB(reportWebVital);
}
```

### 5.2 性能優化建議
1. **代碼分割**
   - 使用動態導入
   - 路由級別分割
   - 組件級別分割

2. **資源優化**
   - 圖片懶加載
   - 字體優化
   - 腳本優化

3. **渲染優化**
   - 減少重渲染
   - 使用記憶化
   - 優化列表渲染

4. **網絡優化**
   - 啟用 HTTP/2
   - 使用 CDN
   - 實現智能預加載

## 6. 其他優化策略

### 6.1 字體優化
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 6.2 圖片優化
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['i.ytimg.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};
