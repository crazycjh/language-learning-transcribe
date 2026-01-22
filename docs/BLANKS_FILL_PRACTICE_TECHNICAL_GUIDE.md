# BlanksFillPractice 技術文檔

聽打練習的核心組件，提供三種難度的練習模式。

## 核心資料結構

```typescript
// 練習狀態
interface PracticeState {
  freeTypingInput: string;        // 高級模式輸入
  submittedBlanks?: BlankItem[];  // 提交時的空格狀態
  isSegmentComplete: boolean;
  accuracy: number;
  attemptCount: number;
  attemptHistory: Array<{
    blanks?: BlankItem[];
    input?: string;
    accuracy: number;
    timestamp: number;
  }>;
}

// 難度記憶
interface DifficultyMemory {
  blanksInputs: Map<string, string>;  // blankId -> userInput
  freeTypingInput: string;
  practiceState: PracticeState;
}

// 空格項目
interface BlankItem {
  id: string;          // segmentId-wordIndex-cleanWord
  word: string;        // 正確答案
  userInput: string;
  isCorrect: boolean;
  hint?: string;       // 初級模式提示
  length: number;
}
```

## 三種難度

### 初級：首字母提示

```typescript
if (difficulty === BlanksDifficulty.BEGINNER && cleanWord.length > 1) {
  hint = cleanWord.charAt(0) + '_'.repeat(cleanWord.length - 1);
}
// "hello" -> "h____"
```

### 中級：長度提示

```typescript
placeholder={'_'.repeat(blank.length)}
// "hello" -> "_____"
```

### 高級：自由輸入

整句打在 textarea 裡，沒有任何提示。

### 哪些字會變空格

```typescript
const COMMON_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  // ...
]);

const shouldBlank = !COMMON_WORDS.has(cleanWord) && 
                   cleanWord.length > 2 && 
                   !/^\d+$/.test(cleanWord) && 
                   cleanWord !== '';
```

排除功能詞、太短的字、純數字。

## 記憶系統

### ID 穩定性

用 segmentId-wordIndex-cleanWord 當 ID，這樣同一個字在不同難度下 ID 一樣。

```typescript
const id = `${segmentId}-${wordIndex}-${cleanWord}`;
```

### 保存

```typescript
const saveCurrentDifficultyState = useCallback((targetDifficulty) => {
  const blanksInputs = new Map<string, string>();
  blanksSegments.forEach(segment => {
    segment.blanks.forEach(blank => {
      if (blank.userInput) {
        blanksInputs.set(blank.id, blank.userInput);
      }
    });
  });
  
  currentMemory[targetDifficulty] = {
    blanksInputs,
    freeTypingInput: practiceState.freeTypingInput,
    practiceState: { ...practiceState }
  };
  
  setDifficultyMemory(currentMemory);
}, []);
```

### 恢復

```typescript
const restoreDifficultyState = useCallback((newDifficulty, newBlanksSegments, shouldRestorePracticeState = true) => {
  const memory = difficultyMemory[newDifficulty];
  
  const restoredSegments = newBlanksSegments.map(segment => {
    const restoredBlanks = segment.blanks.map(blank => {
      const savedInput = memory.blanksInputs.get(blank.id) || '';
      const isCorrect = savedInput.toLowerCase().trim() === blank.word.toLowerCase();
      return { ...blank, userInput: savedInput, isCorrect };
    });
    return { ...segment, blanks: restoredBlanks };
  });
  
  // 反饋期間不恢復狀態，避免覆蓋準確度
  if (shouldRestorePracticeState && !showFeedback) {
    setPracticeState({
      ...memory.practiceState,
      freeTypingInput: memory.freeTypingInput
    });
  }
  
  return restoredSegments;
}, []);
```

### 注意事項

- 反饋期間不恢復狀態，避免覆蓋當前準確度
- 提交答案時立即保存，不要用 setTimeout
- 同時保存空格輸入和練習狀態

## 播放控制

### 狀態

```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [isStarting, setIsStarting] = useState(false);  // 防抖
const [pausedTime, setPausedTime] = useState<number | null>(null);
const [isLooping, setIsLooping] = useState(false);
const [isLoopWaiting, setIsLoopWaiting] = useState(false);
const [loopCountdown, setLoopCountdown] = useState(0);
```

### 播放

```typescript
const playCurrentSegment = useCallback(() => {
  if (player && currentSegment && !isStarting) {
    setIsStarting(true);
    setPausedTime(null);
    
    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    }
    
    player.seekTo(currentSegment.startTime);
    
    setTimeout(() => {
      if (player) {
        player.playVideo();
        setIsPlaying(true);
        setIsStarting(false);
      }
    }, 100);
  }
}, []);
```

### 自動暫停

```typescript
useEffect(() => {
  if (currentSegment && isPlaying && currentTime >= currentSegment.endTime) {
    if (isLooping && !isLoopWaiting) {
      // 循環模式：暫停 -> 等 1 秒 -> 重播
      player.pauseVideo();
      setIsPlaying(false);
      setIsLoopWaiting(true);
      setLoopCountdown(1);
      
      loopTimeoutRef.current = setTimeout(() => {
        playCurrentSegment();
        setIsLoopWaiting(false);
      }, 1000);
    } else {
      // 正常模式：直接暫停
      player.pauseVideo();
      setIsPlaying(false);
    }
  }
}, [currentTime, isPlaying, isLooping, isLoopWaiting]);
```

## 準確度計算

### 填空模式

```typescript
function calculateBlanksAccuracy(blanks: BlankItem[]): number {
  if (blanks.length === 0) return 100;
  const correctCount = blanks.filter(blank => blank.isCorrect).length;
  return Math.round((correctCount / blanks.length) * 100);
}
```

### 自由輸入

```typescript
function calculateFreeTypingAccuracy(userInput: string, correctText: string): number {
  const normalizeText = (text: string) => 
    text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const userNormalized = normalizeText(userInput);
  const correctNormalized = normalizeText(correctText);

  if (userNormalized === correctNormalized) return 100;

  const userWords = userNormalized.split(' ');
  const correctWords = correctNormalized.split(' ');
  
  let matches = 0;
  const maxLength = Math.max(userWords.length, correctWords.length);

  for (let i = 0; i < maxLength; i++) {
    if (userWords[i] === correctWords[i]) {
      matches++;
    }
  }

  return Math.round((matches / maxLength) * 100);
}
```

## 驗證邏輯

### 即時驗證（輸入時）

```typescript
const updateBlankInput = (blankId: string, value: string) => {
  const updatedBlanks = currentBlanksSegment.blanks.map(blank => {
    if (blank.id === blankId) {
      const isCorrect = value.toLowerCase().trim() === blank.word.toLowerCase();
      return { ...blank, userInput: value, isCorrect };
    }
    return blank;
  });
  // 更新狀態...
};
```

### 提交時驗證

```typescript
// 重新驗證所有空格，確保一致性
const updatedBlanks = currentBlanksSegment.blanks.map(blank => {
  const isCorrect = blank.userInput.toLowerCase().trim() === blank.word.toLowerCase();
  return { ...blank, isCorrect };
});
```

## 視覺反饋

### 空格顏色

```typescript
const getBlankStyle = (blank: BlankItem) => {
  if (blank.userInput === '') return 'border-slate-500';      // 未填：灰
  if (blank.isCorrect) return 'border-green-500 text-green-400';  // 對：綠
  return 'border-red-500 text-red-400';                       // 錯：紅
};
```

### 準確度顏色

```typescript
const getAccuracyStyle = (accuracy: number) => {
  if (accuracy >= 80) return 'text-green-400';
  if (accuracy >= 60) return 'text-yellow-400';
  return 'text-red-400';
};
```

## 清理

```typescript
useEffect(() => {
  return () => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
    }
  };
}, []);
```
