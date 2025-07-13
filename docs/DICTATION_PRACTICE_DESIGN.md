# 英文聽打練習系統設計文件

## 1. 系統概述

基於現有的 YouTube 播放器和 SRT 逐字稿功能，新增聽打練習模式，讓使用者能夠逐句練習英文聽力和打字。

## 2. 現有架構分析

### 現有組件
- `VideoPlayerClient`: 主要頁面組件，管理播放器和逐字稿
- `YouTubePlayer`: YouTube 嵌入播放器
- `SrtTranscriptViewer`: 逐字稿顯示組件

### 現有功能
- YouTube 影片播放
- SRT 逐字稿解析和顯示
- 時間同步（點擊逐字稿跳轉到對應時間）
- 自動滾動到當前播放片段

## 3. 新增功能規劃

### 3.1 聽打練習模式組件 (`DictationPractice`)

#### 主要功能
- 逐句練習模式
- 輸入框與即時比對
- 播放控制（重複、暫停、跳過）
- 進度追蹤

#### 組件結構
```typescript
interface DictationPracticeProps {
  segments: Segment[];
  player: YouTubePlayerInterface | null;
  currentSegmentIndex: number;
  onSegmentComplete: (index: number, accuracy: number) => void;
}
```

### 3.2 練習控制邏輯

#### 練習流程
1. 自動播放當前句子
2. 句子結束後暫停，等待使用者輸入
3. 使用者可重複播放或繼續輸入
4. 完成輸入後比對正確性
5. 顯示結果，自動進入下一句

#### 狀態管理
```typescript
interface PracticeState {
  mode: 'viewing' | 'practicing';
  currentSegmentIndex: number;
  userInput: string;
  isPlaying: boolean;
  showHints: boolean;
  practiceStats: PracticeStats;
}
```

### 3.3 輸入比對系統

#### 比對算法
- 基本字符比對
- 忽略大小寫和標點符號
- 計算相似度百分比
- 標示錯誤位置

#### 提示系統
- 顯示部分字母
- 英文/中文對照
- 錯誤單字建議

### 3.4 進度追蹤功能

#### 統計數據
```typescript
interface PracticeStats {
  totalSentences: number;
  completedSentences: number;
  averageAccuracy: number;
  totalTime: number;
  difficultSentences: number[];
}
```

#### 持久化存儲
- 使用 localStorage 保存練習記錄
- 記錄每個影片的練習進度
- 困難句子收藏功能

## 4. 實作計劃

### Phase 1: 基礎練習模式
- [ ] 建立 `DictationPractice` 組件
- [ ] 實作基本的逐句播放邏輯
- [ ] 加入練習模式切換按鈕

### Phase 2: 輸入和比對系統
- [ ] 建立輸入框組件
- [ ] 實作文字比對算法
- [ ] 顯示正確性反饋

### Phase 3: 控制功能
- [ ] 重複播放按鈕
- [ ] 播放速度調整
- [ ] 跳過功能

### Phase 4: 進階功能
- [ ] 提示系統
- [ ] 進度統計
- [ ] 困難句子管理

### Phase 5: 優化和整合
- [ ] 性能優化
- [ ] 用戶體驗改善
- [ ] 響應式設計

## 5. 技術實作細節

### 5.1 組件架構

```
VideoPlayerClient
├── YouTubePlayer
├── PracticeModeToggle
└── ConditionalRender
    ├── SrtTranscriptViewer (觀看模式)
    └── DictationPractice (練習模式)
        ├── PracticeControls
        ├── SentenceDisplay
        ├── InputArea
        └── ProgressDisplay
```

### 5.2 狀態管理

使用 React useState 和 useEffect 管理練習狀態：
- 當前練習句子索引
- 使用者輸入
- 播放狀態
- 練習統計

### 5.3 播放器控制

利用現有的 `YouTubePlayerInterface` 實作：
- `seekTo()`: 跳轉到句子開始時間
- `pauseVideo()`: 句子結束後暫停
- `playVideo()`: 重複播放

### 5.4 比對算法

```typescript
function calculateAccuracy(userInput: string, correctText: string): {
  accuracy: number;
  errors: Array<{position: number, expected: string, actual: string}>;
} {
  // 實作文字比對邏輯
}
```

## 6. 用戶界面設計

### 6.1 練習模式界面
- 上方：當前句子顯示區域
- 中間：使用者輸入框
- 下方：控制按鈕（重複、跳過、提示）
- 側邊：進度和統計

### 6.2 控制面板
- 模式切換按鈕（觀看/練習）
- 播放速度調整
- 提示開關
- 重置進度

### 6.3 反饋顯示
- 即時正確性指示
- 錯誤單字高亮
- 完成句子的成就感回饋

## 7. 數據流程

1. **初始化**: 載入 SRT 數據，解析成句子陣列
2. **開始練習**: 切換到練習模式，播放第一句
3. **句子循環**: 播放 → 暫停 → 輸入 → 比對 → 下一句
4. **統計更新**: 每完成一句更新統計數據
5. **進度保存**: 定期保存到 localStorage

## 8. 未來擴展

### 8.1 多語言支持
- 中文聽打練習
- 其他語言擴展

### 8.2 AI 輔助功能
- 智能錯誤分析
- 個性化練習建議
- 語音識別輔助

### 8.3 社交功能
- 練習記錄分享
- 多人競賽模式
- 社群挑戰

## 9. 技術考量

### 9.1 性能優化
- 大型 SRT 文件的分段載入
- 虛擬滾動優化
- 防抖輸入處理

### 9.2 可訪問性
- 鍵盤快捷鍵支持
- 螢幕閱讀器友好
- 高對比度模式

### 9.3 移動端適配
- 觸控操作優化
- 響應式布局
- 虛擬鍵盤適配