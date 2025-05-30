# Quick Start 快速開始指南

## 1. 環境準備（5分鐘）

```bash
# 檢查環境
node -v  # >= v18.0.0
npm -v   # >= v9.0.0

# 克隆專案（替換為實際倉庫地址）
git clone <repository_url>
cd <project_directory>

# 安裝依賴
npm install
```

## 2. 設定環境變數（2分鐘）

1. 複製環境變數範本：
```bash
cp .env.example .env.local
```

2. 填入必要的環境變數：
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_ACCESS_KEY_SECRET=your_access_key_secret
R2_BUCKET_NAME=your_bucket_name
```

## 3. 開發伺服器（1分鐘）

```bash
# 啟動開發伺服器
npm run dev

# 訪問 http://localhost:3000
```

## 4. 核心功能開發流程

### 4.1 建立新的影片頁面（5分鐘）

1. 建立新的路由文件：
```typescript
// app/video-player/[videoId]/page.tsx
export default function VideoPlayerPage({ params }: { params: { videoId: string } }) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* YouTube播放器 */}
      <div className="w-1/2">
        <YouTubePlayer videoId={params.videoId} />
      </div>
      
      {/* 逐字稿顯示 */}
      <div className="w-1/2">
        <TranscriptDisplay videoId={params.videoId} />
      </div>
    </div>
  );
}
```

### 4.2 取得SRT文件（5分鐘）

1. 使用R2服務存取SRT：
```typescript
// 從 R2 獲取 SRT 文件
const srt = await getSRT(videoId);
```

2. 解析並顯示內容：
```typescript
const segments = parseSRT(srt);
```

### 4.3 實現互動功能（10分鐘）

添加時間軸控制：
```typescript
function handleTimeUpdate(time: number) {
  // 更新當前時間
  setCurrentTime(time);
  
  // 找到對應的字幕段落
  const activeSegment = findActiveSegment(time, segments);
  if (activeSegment) {
    setActiveSegmentId(activeSegment.id);
  }
}
```

## 5. 常見問題解決

### 5.1 YouTube API 相關

問題：YouTube IFrame API 未載入
解決：確保在組件掛載時載入API：
```typescript
useEffect(() => {
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }
}, []);
```

### 5.2 R2 存取問題

問題：無法訪問 R2 存儲
解決：檢查環境變數和權限設置：
```bash
# 驗證 R2 配置
echo $R2_ACCOUNT_ID
echo $R2_ACCESS_KEY_ID
```

## 6. 開發小貼士

1. **使用 React Developer Tools**
   - 安裝 Chrome 擴展
   - 監控組件重新渲染
   - 調試狀態變化

2. **利用 Network 面板**
   - 監控 API 請求
   - 檢查資源載入
   - 診斷效能問題

3. **善用 Console**
   ```typescript
   // 開發時的調試日誌
   if (process.env.NODE_ENV === 'development') {
     console.log('當前狀態:', { currentTime, activeSegment });
   }
   ```

## 7. 下一步

- 查看完整的[實作指南](./implementation-guide.md)
- 閱讀[架構設計文檔](./02-architecture-design.md)
- 參考[API文檔](./04-api-services.md)

## 8. 開發時間預估

| 任務 | 預估時間 |
|-----|----------|
| 環境設置 | 10分鐘 |
| 基礎頁面建立 | 15分鐘 |
| YouTube播放器整合 | 30分鐘 |
| 逐字稿功能實現 | 45分鐘 |
| R2整合 | 20分鐘 |
| 測試與調試 | 30分鐘 |
| **總計** | **2.5小時** |
