# TypeScript 類型定義參考

## 核心類型定義

### 1. SRT 相關類型

```typescript
// 逐字稿段落
interface SRTSegment {
  id: number;
  startTime: number;  // 以秒為單位
  endTime: number;    // 以秒為單位
  text: string;
  translation?: string;
}

// SRT 時間戳
interface SRTTimestamp {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

// 解析後的 SRT 文件
interface ParsedSRT {
  segments: SRTSegment[];
  metadata?: {
    title?: string;
    language?: string;
    created?: Date;
  };
}
```

### 2. YouTube 播放器相關類型

```typescript
// YouTube 播放器屬性
interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  onStateChange?: (state: PlayerState) => void;
  width?: number;
  height?: number;
  autoplay?: boolean;
}

// 播放器狀態
enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5
}

// 播放器控制接口
interface PlayerControls {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}
```

### 3. 逐字稿顯示相關類型

```typescript
// 逐字稿顯示屬性
interface TranscriptDisplayProps {
  srtContent: string;
  currentTime: number;
  onSegmentClick: (time: number) => void;
  showTranslation?: boolean;
  highlightActive?: boolean;
  autoScroll?: boolean;
}

// 逐字稿段落樣式
interface SegmentStyle {
  isActive: boolean;
  isHovered: boolean;
  fontSize?: string;
  lineHeight?: string;
}

// 虛擬滾動配置
interface VirtualScrollConfig {
  itemHeight: number;
  overscan: number;
  containerHeight: number;
}
```

### 4. API 相關類型

```typescript
// API 響應基礎類型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 錯誤響應
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

// API 請求配置
interface ApiConfig {
  baseUrl: string;
  headers: Record<string, string>;
  timeout: number;
}
```

### 5. R2 存儲相關類型

```typescript
// R2 配置
interface R2Config {
  accountId: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucketName: string;
}

// R2 服務接口
interface R2Service {
  getSRT(videoId: string): Promise<string>;
  getTranslation(videoId: string, language: string): Promise<string>;
  uploadSRT(videoId: string, content: string): Promise<void>;
}
```

## 工具類型

### 1. 通用工具類型

```typescript
// 可選屬性轉必需
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 所有屬性轉可選
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 只讀類型
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 選取特定鍵
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### 2. 自定義工具類型

```typescript
// 深度部分可選
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 排除 null 和 undefined
type NonNullable<T> = T extends null | undefined ? never : T;

// 函數參數類型
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// 函數返回值類型
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```

## 狀態管理類型

### 1. Context 相關類型

```typescript
// 播放器上下文
interface PlayerContext {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  volume: number;
  controls: PlayerControls;
}

// 逐字稿上下文
interface TranscriptContext {
  segments: SRTSegment[];
  activeSegmentId: number | null;
  isAutoScrolling: boolean;
  showTranslation: boolean;
}

// 應用狀態
interface AppState {
  player: PlayerContext;
  transcript: TranscriptContext;
  settings: UserSettings;
}
```

### 2. Action 類型

```typescript
// 播放器動作
type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'UPDATE_TIME'; payload: number };

// 逐字稿動作
type TranscriptAction =
  | { type: 'SET_SEGMENTS'; payload: SRTSegment[] }
  | { type: 'SET_ACTIVE_SEGMENT'; payload: number }
  | { type: 'TOGGLE_AUTO_SCROLL' }
  | { type: 'TOGGLE_TRANSLATION' };
```

## 使用範例

### 1. 組件類型應用

```typescript
// YouTube 播放器組件
const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onTimeUpdate,
  onStateChange,
  width = 640,
  height = 360
}) => {
  // 組件實現
};

// 逐字稿顯示組件
const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  srtContent,
  currentTime,
  onSegmentClick
}) => {
  // 組件實現
};
```

### 2. Hook 類型應用

```typescript
// 使用播放器 Hook
function usePlayer(videoId: string): PlayerControls {
  // Hook 實現
}

// 使用逐字稿 Hook
function useTranscript(srtContent: string): {
  segments: SRTSegment[];
  activeSegment: SRTSegment | null;
} {
  // Hook 實現
}
```

### 3. 工具函數類型應用

```typescript
// SRT 解析函數
function parseSRT(content: string): ParsedSRT {
  // 函數實現
}

// 時間格式化函數
function formatTime(seconds: number): string {
  // 函數實現
}
