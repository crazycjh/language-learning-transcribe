# API 參考文件

## 概述

所有 API 路由都位於 `/api` 目錄下，使用 Next.js API Routes 實現。基礎 URL 為 `http://localhost:3000/api`（在開發環境中）。

## API 端點

### 1. 獲取逐字稿

獲取特定影片的 SRT 格式逐字稿。

```typescript
GET /api/transcript/{videoId}
```

#### 參數
| 名稱 | 類型 | 必須 | 描述 |
|------|------|------|------|
| videoId | string | 是 | YouTube 影片 ID |

#### 響應
```json
{
  "success": true,
  "data": "1\n00:00:00,000 --> 00:00:03,000\n字幕內容..."
}
```

#### 錯誤響應
```json
{
  "success": false,
  "error": "找不到逐字稿文件"
}
```

### 2. 獲取翻譯

獲取特定影片的翻譯文本。

```typescript
GET /api/translation/{videoId}?lang=zh-TW
```

#### 參數
| 名稱 | 類型 | 必須 | 描述 |
|------|------|------|------|
| videoId | string | 是 | YouTube 影片 ID |
| lang | string | 否 | 語言代碼（預設：zh-TW） |

#### 響應
```json
{
  "success": true,
  "data": "翻譯內容..."
}
```

### 3. 影片資訊

獲取 YouTube 影片的基本信息。

```typescript
GET /api/video/{videoId}/info
```

#### 參數
| 名稱 | 類型 | 必須 | 描述 |
|------|------|------|------|
| videoId | string | 是 | YouTube 影片 ID |

#### 響應
```json
{
  "success": true,
  "data": {
    "title": "影片標題",
    "duration": 360,
    "thumbnailUrl": "https://..."
  }
}
```

## API 實作範例

### 1. 獲取逐字稿

```typescript
// app/api/transcript/[videoId]/route.ts
import { NextRequest } from 'next/server';
import { getSRT } from '@/lib/r2-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const srtContent = await getSRT(params.videoId);
    
    return new Response(srtContent, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    return Response.json(
      { error: '無法獲取逐字稿' },
      { status: 500 }
    );
  }
}
```

### 2. 獲取翻譯

```typescript
// app/api/translation/[videoId]/route.ts
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'zh-TW';
    
    const translation = await getTranslation(params.videoId, lang);
    
    return Response.json({
      success: true,
      data: translation
    });
  } catch (error) {
    return Response.json(
      { error: '無法獲取翻譯' },
      { status: 500 }
    );
  }
}
```

## 前端使用範例

### 使用 fetch API

```typescript
// 獲取逐字稿
async function fetchTranscript(videoId: string) {
  const response = await fetch(`/api/transcript/${videoId}`);
  if (!response.ok) {
    throw new Error('獲取逐字稿失敗');
  }
  return response.text();
}

// 獲取翻譯
async function fetchTranslation(videoId: string, lang: string = 'zh-TW') {
  const response = await fetch(`/api/translation/${videoId}?lang=${lang}`);
  if (!response.ok) {
    throw new Error('獲取翻譯失敗');
  }
  const data = await response.json();
  return data.data;
}
```

### 使用 React Query

```typescript
// hooks/useTranscript.ts
import { useQuery } from 'react-query';

export function useTranscript(videoId: string) {
  return useQuery(['transcript', videoId], () => fetchTranscript(videoId), {
    staleTime: 1000 * 60 * 5, // 5分鐘
    cacheTime: 1000 * 60 * 30, // 30分鐘
  });
}

export function useTranslation(videoId: string, lang: string = 'zh-TW') {
  return useQuery(
    ['translation', videoId, lang],
    () => fetchTranslation(videoId, lang),
    {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
    }
  );
}
```

## 錯誤處理

所有 API 端點使用統一的錯誤響應格式：

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

常見錯誤代碼：

| 代碼 | 描述 |
|------|------|
| NOT_FOUND | 請求的資源不存在 |
| UNAUTHORIZED | 未經授權的訪問 |
| INVALID_PARAM | 無效的參數 |
| R2_ERROR | R2 存儲訪問錯誤 |
| INTERNAL_ERROR | 內部服務器錯誤 |

## 速率限制

- 每個 IP 每分鐘最多 60 個請求
- 每個 API Key 每分鐘最多 120 個請求
- 超過限制將返回 429 Too Many Requests 錯誤

## 安全考慮

1. **認證**
   - 使用 API Key 進行認證
   - 支持 Bearer Token 認證

2. **CORS**
   - 僅允許指定域名的跨域請求
   - 預設僅允許 GET 請求

3. **請求驗證**
   - 驗證必要參數
   - 驗證參數格式
   - 防止 SQL 注入和 XSS

## 最佳實踐

1. **使用適當的 HTTP 方法**
   - GET：讀取資源
   - POST：創建資源
   - PUT：更新資源
   - DELETE：刪除資源

2. **實現錯誤重試**
   ```typescript
   async function fetchWithRetry(url: string, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         const response = await fetch(url);
         if (response.ok) return response;
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
       }
     }
   }
   ```

3. **緩存策略**
   ```typescript
   // API 路由中設置緩存標頭
   response.headers.set(
     'Cache-Control',
     'public, s-maxage=60, stale-while-revalidate=600'
   );
