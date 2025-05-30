# API 與數據服務

## 1. R2 存儲服務

### 1.1 配置設定
```typescript
// lib/r2-config.ts
interface R2Config {
  accountId: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucketName: string;
}

export const r2Config: R2Config = {
  accountId: process.env.R2_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  accessKeySecret: process.env.R2_ACCESS_KEY_SECRET!,
  bucketName: process.env.R2_BUCKET_NAME!
};
```

### 1.2 存取邏輯實現
```typescript
// lib/r2-client.ts
import { S3Client } from '@aws-sdk/client-s3';
import { r2Config } from './r2-config';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.accessKeySecret,
  },
});
```

## 2. API 端點設計

### 2.1 獲取逐字稿 API
```typescript
// app/api/transcript/[videoId]/route.ts
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2-client';

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const srtKey = `transcripts/${videoId}.srt`;
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: srtKey,
    });

    const response = await r2Client.send(command);
    const srtContent = await response.Body?.transformToString();

    if (!srtContent) {
      return Response.json(
        { error: '找不到逐字稿文件' },
        { status: 404 }
      );
    }

    return new Response(srtContent, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('獲取逐字稿失敗:', error);
    return Response.json(
      { error: '獲取逐字稿時發生錯誤' },
      { status: 500 }
    );
  }
}
```

### 2.2 獲取翻譯文本 API
```typescript
// app/api/translation/[videoId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'zh-TW';
    
    const translationKey = `translations/${videoId}_${language}.srt`;
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: translationKey,
    });

    const response = await r2Client.send(command);
    const translationContent = await response.Body?.transformToString();

    if (!translationContent) {
      return Response.json(
        { error: '找不到翻譯文件' },
        { status: 404 }
      );
    }

    return new Response(translationContent, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('獲取翻譯失敗:', error);
    return Response.json(
      { error: '獲取翻譯時發生錯誤' },
      { status: 500 }
    );
  }
}
```

## 3. 錯誤處理

### 3.1 錯誤類型定義
```typescript
// lib/errors.ts
export class R2Error extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'R2Error';
  }
}

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

### 3.2 錯誤處理中間件
```typescript
// middleware/error-handler.ts
import { NextResponse } from 'next/server';
import { R2Error, APIError } from '@/lib/errors';

export function errorHandler(error: unknown) {
  if (error instanceof R2Error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: '發生未知錯誤' },
    { status: 500 }
  );
}
```

## 4. 緩存策略

### 4.1 API 響應緩存
```typescript
// lib/cache.ts
import { NextResponse } from 'next/server';

export function withCache(
  response: Response,
  options: { maxAge: number; staleWhileRevalidate: number }
) {
  const { maxAge, staleWhileRevalidate } = options;
  
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  
  return response;
}
```

### 4.2 緩存實現
```typescript
// app/api/transcript/[videoId]/route.ts
import { withCache } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    // ... 獲取逐字稿邏輯 ...

    return withCache(
      new Response(srtContent, {
        headers: { 'Content-Type': 'text/plain' },
      }),
      {
        maxAge: 60 * 60, // 1小時
        staleWhileRevalidate: 60 * 60 * 24 // 24小時
      }
    );
  } catch (error) {
    // ... 錯誤處理 ...
  }
}
```

## 5. 安全性考慮

### 5.1 API 認證
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 驗證API金鑰
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return NextResponse.json(
      { error: '未授權的訪問' },
      { status: 401 }
    );
  }

  // 驗證請求來源
  const referer = request.headers.get('referer');
  if (!referer?.includes(process.env.ALLOWED_DOMAIN!)) {
    return NextResponse.json(
      { error: '無效的請求來源' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 5.2 安全標頭設置
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
