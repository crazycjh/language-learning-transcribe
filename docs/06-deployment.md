# 部署與配置

## 1. 環境要求

### 1.1 基本要求
- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0
- Git
- 支持 WebAssembly 的現代瀏覽器

### 1.2 服務要求
```bash
# 環境變量配置
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_ACCESS_KEY_SECRET=your_access_key_secret
R2_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_API_URL=your_api_url
```

### 1.3 雲服務配置
- Cloudflare R2 存儲服務
- Vercel/其他支持 Next.js 的部署平台
- （可選）CDN 服務

## 2. 開發環境設置

### 2.1 專案初始化
```bash
# 克隆專案
git clone <repository_url>
cd <project_directory>

# 安裝依賴
npm install

# 設置環境變量
cp .env.example .env.local
```

### 2.2 開發伺服器
```bash
# 啟動開發伺服器
npm run dev

# 構建生產版本
npm run build

# 啟動生產伺服器
npm start
```

## 3. 生產環境部署

### 3.1 Vercel 部署步驟
1. 在 Vercel 控制台創建新項目
2. 導入 Git 倉庫
3. 配置環境變量
4. 部署

```bash
# 使用 Vercel CLI 部署
npm i -g vercel
vercel login
vercel
```

### 3.2 Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 安裝依賴
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 構建應用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 生產環境
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
```

### 3.3 持續集成/持續部署 (CI/CD)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Vercel
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 4. 監控與維護

### 4.1 日誌配置
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});
```

### 4.2 監控配置
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function initializeMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}
```

## 5. 安全配置

### 5.1 安全標頭
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
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
```

### 5.2 環境變量驗證
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_ACCESS_KEY_SECRET: z.string(),
  R2_BUCKET_NAME: z.string(),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('環境變量驗證失敗:', error);
    process.exit(1);
  }
}
```

## 6. 備份與恢復

### 6.1 數據備份策略
```typescript
// scripts/backup.ts
import { r2Client } from '../lib/r2-client';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

async function backupSRTFiles() {
  const date = new Date().toISOString().split('T')[0];
  const backupDir = `backups/${date}`;
  
  const objects = await r2Client.listObjects({
    Bucket: process.env.R2_BUCKET_NAME!,
    Prefix: 'transcripts/',
  });

  for (const object of objects.Contents || []) {
    const response = await r2Client.getObject({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: object.Key!,
    });

    if (response.Body) {
      const filePath = `${backupDir}/${object.Key}`;
      await pipeline(
        response.Body as any,
        createWriteStream(filePath)
      );
    }
  }
}
```

### 6.2 系統還原流程
1. 備份檢查
2. 環境變量還原
3. 數據恢復
4. 系統驗證

## 7. 故障排除

### 7.1 常見問題解決
1. **構建失敗**
   - 檢查 Node.js 版本
   - 清除依賴緩存
   - 檢查環境變量

2. **運行時錯誤**
   - 檢查日誌
   - 驗證配置
   - 檢查網絡連接

3. **性能問題**
   - 檢查資源使用
   - 分析日誌
   - 監控指標

### 7.2 診斷工具
```bash
# 檢查依賴
npm audit

# 檢查構建
npm run build

# 檢查類型
npm run type-check

# 運行測試
npm test
```

## 8. 更新與維護

### 8.1 更新流程
1. 備份當前版本
2. 更新依賴
3. 測試新版本
4. 部署更新

### 8.2 維護檢查清單
- [ ] 檢查系統日誌
- [ ] 監控系統性能
- [ ] 更新安全補丁
- [ ] 備份數據
- [ ] 檢查 API 限制
- [ ] 更新文檔
