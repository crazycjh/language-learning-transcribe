export interface Segment {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

// 練習模式類型
export enum PracticeMode {
  DICTATION = 'dictation'    // 聽打練習模式
}

// 填空難度等級
export enum BlanksDifficulty {
  BEGINNER = 'beginner',       // 初級：首字母提示
  INTERMEDIATE = 'intermediate', // 中級：長度提示
  ADVANCED = 'advanced'        // 高級：完全空白
}

// 單個空格的數據結構
export interface BlankItem {
  id: string;
  word: string;           // 正確的詞
  userInput: string;      // 用戶輸入
  isCorrect: boolean;     // 是否正確
  hint?: string;          // 提示（初級模式使用）
  length: number;         // 詞長度
}

// 填空練習的句子結構
export interface BlanksSegment {
  id: number;
  startTime: number;
  endTime: number;
  text: string;           // 原始文本
  blanks: BlankItem[];    // 空格列表
  displayText: string;    // 顯示文本（包含空格）
}

export function parseSRT(srtContent: string): Segment[] {
  const segments: Segment[] = [];
  const blocks = srtContent.trim().split('\n\n');
  
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;
    
    const id = parseInt(lines[0]);
    const times = lines[1].split(' --> ');
    const text = lines.slice(2).join('\n');
    
    // 將時間字串 "00:00:00,000" 轉換為秒數
    const timeToSeconds = (timeStr: string) => {
      const [hours, minutes, seconds] = timeStr.split(':');
      const [secs, ms] = seconds.split(',');
      return parseInt(hours) * 3600 + 
             parseInt(minutes) * 60 + 
             parseInt(secs) +
             parseInt(ms) / 1000;
    };
    
    segments.push({
      id,
      startTime: timeToSeconds(times[0]),
      endTime: timeToSeconds(times[1]),
      text
    });
  }
  
  return segments;
}

// 常見功能詞列表（保留不填空）
const COMMON_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'can', 'may', 'might', 'must', 'shall', 'to', 'of', 'in',
  'on', 'at', 'by', 'for', 'with', 'from', 'up', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'and', 'or', 'but', 'if',
  'as', 'so', 'than', 'too', 'very', 'just', 'now', 'only', 'its', 'it',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their', 'this', 'that', 'these', 'those'
]);

// 生成單個空格項目
function createBlankItem(word: string, difficulty: BlanksDifficulty, segmentId: number, wordIndex: number): BlankItem {
  const cleanWord = word.toLowerCase();
  // 使用穩定的ID：segmentId-wordIndex-cleanWord，確保同一位置的詞匯在所有難度下都有相同ID
  const id = `${segmentId}-${wordIndex}-${cleanWord}`;
  
  let hint: string | undefined;
  if (difficulty === BlanksDifficulty.BEGINNER && cleanWord.length > 1) {
    hint = cleanWord.charAt(0) + '_'.repeat(cleanWord.length - 1);
  }
  
  return {
    id,
    word: cleanWord,
    userInput: '',
    isCorrect: false,
    hint,
    length: cleanWord.length
  };
}

// 將普通句子轉換為填空練習句子
export function convertToBlanksSegment(
  segment: Segment, 
  difficulty: BlanksDifficulty
): BlanksSegment {
  const words = segment.text.split(/\s+/);
  const blanks: BlankItem[] = [];
  const displayParts: string[] = [];
  
  words.forEach((word, index) => {
    // 移除標點符號來判斷是否為常見詞
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    
    // 跳過空詞或數字
    if (!cleanWord || /^\d+$/.test(cleanWord)) {
      displayParts.push(word);
      return;
    }
    
    // 判斷是否需要填空（非常見詞且長度大於2）
    const shouldBlank = !COMMON_WORDS.has(cleanWord) && cleanWord.length > 2;
    
    if (shouldBlank) {
      const blankItem = createBlankItem(cleanWord, difficulty, segment.id, index);
      blanks.push(blankItem);
      
      // 根據難度生成顯示內容
      let blankDisplay: string;
      switch (difficulty) {
        case BlanksDifficulty.BEGINNER:
          blankDisplay = `${blankItem.hint} `;
          break;
        case BlanksDifficulty.INTERMEDIATE:
          blankDisplay = `${'_'.repeat(blankItem.length)} `;
          break;
        case BlanksDifficulty.ADVANCED:
          blankDisplay = '_____ ';
          break;
      }
      displayParts.push(blankDisplay);
    } else {
      displayParts.push(word);
    }
    
    // 添加空格（除了最後一個詞）
    if (index < words.length - 1 && !shouldBlank) {
      displayParts.push(' ');
    }
  });
  
  return {
    id: segment.id,
    startTime: segment.startTime,
    endTime: segment.endTime,
    text: segment.text,
    blanks,
    displayText: displayParts.join('').trim()
  };
}

// 批量轉換所有句子為填空練習
export function convertSegmentsToBlanks(
  segments: Segment[], 
  difficulty: BlanksDifficulty
): BlanksSegment[] {
  return segments.map(segment => convertToBlanksSegment(segment, difficulty));
}

// 計算填空練習的準確度（基於所有空格，未填寫視為錯誤）
export function calculateBlanksAccuracy(blanks: BlankItem[]): number {
  if (blanks.length === 0) return 100;
  
  // 計算所有正確的空格（包括有輸入且正確的）
  const correctCount = blanks.filter(blank => blank.isCorrect).length;
  
  // 準確度 = 正確數量 / 總空格數量
  return Math.round((correctCount / blanks.length) * 100);
}

// 計算自由輸入的準確度（逐詞對位比較）
export function calculateFreeTypingAccuracy(userInput: string, correctText: string): number {
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