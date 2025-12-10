# Google Analytics 4 設置指南

## 1. 創建 Google Analytics 4 屬性

1. 前往 [Google Analytics](https://analytics.google.com/)
2. 點擊「開始測量」或「創建帳戶」
3. 設置帳戶名稱（例如：LingoBitz）
4. 創建屬性：
   - 屬性名稱：LingoBitz
   - 報告時區：選擇你的時區
   - 貨幣：選擇適當的貨幣
5. 選擇業務資訊（教育類別）
6. 選擇業務目標（提升品牌知名度、檢查使用者行為）

## 2. 設置資料串流

1. 在屬性設置中，點擊「資料串流」
2. 選擇「網站」
3. 輸入網站 URL：
   - 開發環境：`http://localhost:3500`
   - 正式環境：你的網域名稱
4. 輸入串流名稱：LingoBitz Web
5. 點擊「建立串流」
6. **複製測量 ID**（格式：G-XXXXXXXXXX）

## 3. 設置環境變數

將測量 ID 加入到 `.env.local` 檔案：

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**注意：** 請將 `G-XXXXXXXXXX` 替換為你實際的測量 ID。

## 4. 部署到正式環境

在正式環境的環境變數中也要設置相同的 `NEXT_PUBLIC_GA_MEASUREMENT_ID`。

## 5. 驗證設置

1. 啟動開發伺服器：`npm run dev`
2. 在瀏覽器中開啟 `http://localhost:3500`
3. 在 Google Analytics 中查看「即時」報告
4. 你應該能看到即時使用者數據

## 6. 可追蹤的事件

系統會自動追蹤以下事件：

### 頁面瀏覽
- 自動追蹤所有頁面瀏覽

### 影片相關事件
- `video_play`: 影片播放
  - `video_id`: 影片 ID
  - `language`: 選擇的語言
- `language_switch`: 語言切換
  - `from_language`: 原語言
  - `to_language`: 新語言

### 練習相關事件
- `practice_start`: 開始練習
  - `video_id`: 影片 ID
  - `difficulty`: 難度等級
- `practice_complete`: 完成練習
  - `video_id`: 影片 ID
  - `difficulty`: 難度等級
  - `accuracy`: 準確度百分比

### 轉錄相關事件
- `transcription_start`: 開始轉錄
  - `source`: 來源類型（youtube 或 audio_file）
- `transcription_complete`: 完成轉錄
  - `source`: 來源類型
  - `duration`: 轉錄耗時（秒）

## 7. 查看分析數據

### 即時報告
- 即時使用者數量
- 即時頁面瀏覽
- 即時事件

### 標準報告
- 使用者：人口統計、技術、行為
- 生命週期：客戶開發、參與、營利、留存
- 事件：所有事件、轉換

### 自訂報告
你可以創建自訂報告來分析：
- 不同難度的練習完成率
- 各語言的使用情況
- 轉錄功能的使用頻率
- 使用者學習路徑

## 8. 隱私權考量

- GA4 已經內建隱私權保護功能
- 系統不會收集個人識別資訊
- 所有追蹤都是匿名的
- 符合 GDPR 和其他隱私權法規

## 9. 進階設置（可選）

### 設置轉換事件
在 GA4 中將重要事件標記為轉換：
1. 前往「事件」→「所有事件」
2. 找到 `practice_complete` 事件
3. 切換「標記為轉換」

### 設置目標對象
創建特定的使用者群組：
- 活躍學習者（完成多次練習）
- 不同語言的學習者
- 轉錄功能使用者

### 連結 Google Search Console
如果你有網站，可以連結 Search Console 來獲得更多 SEO 數據。

## 10. 疑難排解

### 看不到數據
1. 確認測量 ID 正確
2. 檢查瀏覽器是否阻擋追蹤
3. 確認環境變數已正確設置
4. 查看瀏覽器開發者工具的 Network 標籤，確認 GA 請求有發送

### 事件沒有出現
1. 事件可能需要幾分鐘才會出現在報告中
2. 檢查「即時」報告中的事件
3. 確認事件名稱和參數正確

### 開發環境數據
- 開發環境的數據會混入正式數據
- 建議為開發環境創建單獨的 GA4 屬性
- 或使用 GA4 的資料篩選器排除開發流量