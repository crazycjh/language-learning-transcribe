'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, RotateCcw, Repeat, SkipBack, SkipForward } from "lucide-react";
import { 
  type Segment, 
  type BlanksSegment, 
  type BlankItem, 
  BlanksDifficulty,
  convertToBlanksSegment,
  calculateBlanksAccuracy,
  calculateFreeTypingAccuracy
} from "@/lib/srt-utils";
import { type YouTubePlayerInterface } from "@/components/YouTubePlayer";

interface BlanksFillPracticeProps {
  segments: Segment[];
  player: YouTubePlayerInterface | null;
  currentTime: number;
  currentSegmentIndex: number;
  showFeedback: boolean;
  onSegmentIndexChange: (index: number) => void;
  onFeedbackChange: (show: boolean) => void;
}

interface PracticeState {
  userInput: string;
  freeTypingInput: string;  // 高級模式的自由輸入
  submittedBlanks?: BlankItem[];  // 提交時驗證後的空格狀態
  isSegmentComplete: boolean;
  accuracy: number;
  attemptCount: number;
  attemptHistory: Array<{
    blanks?: BlankItem[];      // 空格模式的歷史
    input?: string;            // 自由輸入模式的歷史
    accuracy: number;
    timestamp: number;
  }>;
}

// 每個難度級別的記憶狀態
interface DifficultyMemory {
  blanksInputs: Map<string, string>; // blankId -> userInput
  freeTypingInput: string;
  practiceState: PracticeState;
}

// 所有難度的記憶狀態
interface AllDifficultyMemory {
  [BlanksDifficulty.BEGINNER]: DifficultyMemory;
  [BlanksDifficulty.INTERMEDIATE]: DifficultyMemory;
  [BlanksDifficulty.ADVANCED]: DifficultyMemory;
}

export function BlanksFillPractice({
  segments,
  player,
  currentTime,
  currentSegmentIndex,
  showFeedback,
  onSegmentIndexChange,
  onFeedbackChange
}: BlanksFillPracticeProps) {
  const [difficulty, setDifficulty] = useState<BlanksDifficulty>(BlanksDifficulty.INTERMEDIATE);
  const [blanksSegments, setBlanksSegments] = useState<BlanksSegment[]>([]);
  const [practiceState, setPracticeState] = useState<PracticeState>({
    userInput: '',
    freeTypingInput: '',
    submittedBlanks: undefined,
    isSegmentComplete: false,
    accuracy: 0,
    attemptCount: 0,
    attemptHistory: []
  });

  // 創建初始記憶狀態的輔助函數
  const createInitialMemory = (): DifficultyMemory => ({
    blanksInputs: new Map<string, string>(),
    freeTypingInput: '',
    practiceState: {
      userInput: '',
      freeTypingInput: '',
      submittedBlanks: undefined,
      isSegmentComplete: false,
      accuracy: 0,
      attemptCount: 0,
      attemptHistory: []
    }
  });

  // 為每個難度級別保存的記憶狀態
  const [difficultyMemory, setDifficultyMemory] = useState<AllDifficultyMemory>({
    [BlanksDifficulty.BEGINNER]: createInitialMemory(),
    [BlanksDifficulty.INTERMEDIATE]: createInitialMemory(),
    [BlanksDifficulty.ADVANCED]: createInitialMemory()
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [pausedTime, setPausedTime] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoopWaiting, setIsLoopWaiting] = useState(false);
  const [loopCountdown, setLoopCountdown] = useState(0);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentBlanksSegment = blanksSegments[currentSegmentIndex];

  // 保存當前難度的狀態到記憶中
  const saveCurrentDifficultyState = useCallback((targetDifficulty: BlanksDifficulty) => {
    const currentMemory = { ...difficultyMemory };
    
    // 保存所有句子的空格輸入
    const blanksInputs = new Map<string, string>();
    blanksSegments.forEach(segment => {
      segment.blanks.forEach(blank => {
        if (blank.userInput) {
          blanksInputs.set(blank.id, blank.userInput);
        }
      });
    });
    
    // 保存當前狀態
    currentMemory[targetDifficulty] = {
      blanksInputs,
      freeTypingInput: practiceState.freeTypingInput,
      practiceState: { ...practiceState }
    };
    
    setDifficultyMemory(currentMemory);
  }, [difficultyMemory, blanksSegments, practiceState]);

  // 從記憶中恢復指定難度的狀態
  const restoreDifficultyState = useCallback((newDifficulty: BlanksDifficulty, newBlanksSegments: BlanksSegment[], shouldRestorePracticeState: boolean = true) => {
    const memory = difficultyMemory[newDifficulty];
    
    // 恢復空格輸入到新的 blanksSegments
    const restoredSegments = newBlanksSegments.map(segment => {
      const restoredBlanks = segment.blanks.map(blank => {
        const savedInput = memory.blanksInputs.get(blank.id) || '';
        const isCorrect = savedInput.toLowerCase().trim() === blank.word.toLowerCase();
        return {
          ...blank,
          userInput: savedInput,
          isCorrect
        };
      });
      return { ...segment, blanks: restoredBlanks };
    });
    
    // 只在不是反饋模式且明確要求時才恢復練習狀態
    if (shouldRestorePracticeState && !showFeedback) {
      setPracticeState({
        ...memory.practiceState,
        freeTypingInput: memory.freeTypingInput
      });
    }
    
    return restoredSegments;
  }, [difficultyMemory, showFeedback]);

  // 處理難度切換的函數
  const handleDifficultyChange = useCallback((newDifficulty: BlanksDifficulty) => {
    if (newDifficulty === difficulty) return; // 如果是相同難度，不需要切換
    
    // 先保存當前難度的狀態
    saveCurrentDifficultyState(difficulty);
    
    // 然後切換到新難度
    setDifficulty(newDifficulty);
  }, [difficulty, saveCurrentDifficultyState]);
  
  // 當難度改變時重新生成填空句子並處理狀態記憶
  useEffect(() => {
    // 生成新難度的空格句子
    const newBlanksSegments = segments.map(segment => 
      convertToBlanksSegment(segment, difficulty)
    );
    
    // 嘗試恢復新難度的狀態，但在反饋期間不恢復練習狀態
    const restoredSegments = restoreDifficultyState(difficulty, newBlanksSegments, !showFeedback);
    setBlanksSegments(restoredSegments);
  }, [segments, difficulty, restoreDifficultyState, showFeedback]);

  // 重置練習狀態當切換句子時
  useEffect(() => {
    setPracticeState({
      userInput: '',
      freeTypingInput: '',
      submittedBlanks: undefined,
      isSegmentComplete: false,
      accuracy: 0,
      attemptCount: 0,
      attemptHistory: []
    });
    onFeedbackChange(false);
  }, [currentSegmentIndex, onFeedbackChange]);

  // 播放控制相關函數（類似原來的 DictationPractice）
  const clearLoopTimeout = useCallback(() => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    setIsLoopWaiting(false);
    setLoopCountdown(0);
  }, []);

  const playCurrentSegment = useCallback(() => {
    const currentSegment = segments[currentSegmentIndex];
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
  }, [player, segments, currentSegmentIndex, isStarting, isPlaying]);

  const pauseSegment = useCallback(() => {
    if (player) {
      player.pauseVideo();
      setIsPlaying(false);
      setPausedTime(currentTime);
    }
  }, [player, currentTime]);

  const repeatSegment = () => {
    playCurrentSegment();
  };

  const skipLoopWait = () => {
    if (isLoopWaiting) {
      clearLoopTimeout();
      playCurrentSegment();
    }
  };

  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      if (player && isPlaying) {
        player.pauseVideo();
      }
      
      onSegmentIndexChange(currentSegmentIndex - 1);
      onFeedbackChange(false);
      
      clearLoopTimeout();
      setPausedTime(null);
      setIsPlaying(false);
      setIsStarting(false);
    }
  };

  const goToNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      if (player && isPlaying) {
        player.pauseVideo();
      }
      
      onSegmentIndexChange(currentSegmentIndex + 1);
      onFeedbackChange(false);
      
      clearLoopTimeout();
      setPausedTime(null);
      setIsPlaying(false);
      setIsStarting(false);
    }
  };

  // 監聽播放時間，自動暫停在句子結尾或循環播放
  useEffect(() => {
    const currentSegment = segments[currentSegmentIndex];
    if (currentSegment && isPlaying && currentTime >= currentSegment.endTime) {
      if (isLooping && !isLoopWaiting) {
        // 循環模式：先暫停，1秒後重新播放
        if (player) {
          player.pauseVideo();
          setIsPlaying(false);
          setIsLoopWaiting(true);
          setLoopCountdown(1);
          
          // 倒數計時效果
          const countdownInterval = setInterval(() => {
            setLoopCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          // 1秒後重新播放
          loopTimeoutRef.current = setTimeout(() => {
            playCurrentSegment();
            setIsLoopWaiting(false);
            setLoopCountdown(0);
            loopTimeoutRef.current = null;
          }, 1000);
        }
      } else {
        // 正常模式：句子播放完畢，自動暫停但清除 pausedTime（因為這不是用戶主動暫停）
        if (player) {
          player.pauseVideo();
          setIsPlaying(false);
          setPausedTime(null); // 清除暫停時間，表示句子已完成
          setIsStarting(false); // 清除啟動中狀態
        }
      }
    }
  }, [currentTime, currentSegmentIndex, segments, isPlaying, player, isLooping, isLoopWaiting, playCurrentSegment]);

  // 更新空格輸入
  const updateBlankInput = (blankId: string, value: string) => {
    if (!currentBlanksSegment) return;
    
    const updatedBlanks = currentBlanksSegment.blanks.map(blank => {
      if (blank.id === blankId) {
        const userInputCleaned = value.toLowerCase().trim();
        const correctWordCleaned = blank.word.toLowerCase();
        const isCorrect = userInputCleaned === correctWordCleaned;
        
        return { ...blank, userInput: value, isCorrect };
      }
      return blank;
    });
    
    // 更新 blanksSegments
    const updatedSegments = [...blanksSegments];
    updatedSegments[currentSegmentIndex] = {
      ...currentBlanksSegment,
      blanks: updatedBlanks
    };
    setBlanksSegments(updatedSegments);
  };

  // 提交答案
  const submitAnswer = () => {
    if (!currentBlanksSegment) return;

    let accuracy: number;
    let historyEntry: {
      blanks?: BlankItem[];
      input?: string;
      accuracy: number;
      timestamp: number;
    };

    let submittedBlanks: BlankItem[] | undefined = undefined;

    if (difficulty === BlanksDifficulty.ADVANCED) {
      // 高級模式：使用自由輸入評分
      accuracy = calculateFreeTypingAccuracy(practiceState.freeTypingInput, currentBlanksSegment.text);
      historyEntry = {
        input: practiceState.freeTypingInput,
        accuracy,
        timestamp: Date.now()
      };
    } else {
      // 初級中級模式：重新驗證所有空格並計算準確度
      const updatedBlanks = currentBlanksSegment.blanks.map(blank => {
        const userInputCleaned = blank.userInput.toLowerCase().trim();
        const correctWordCleaned = blank.word.toLowerCase();
        const isCorrect = userInputCleaned === correctWordCleaned;
        
        return { ...blank, isCorrect };
      });

      // 更新 blanksSegments 狀態中的正確性
      const updatedSegments = [...blanksSegments];
      updatedSegments[currentSegmentIndex] = {
        ...currentBlanksSegment,
        blanks: updatedBlanks
      };
      setBlanksSegments(updatedSegments);

      // 使用重新驗證後的空格計算準確度
      accuracy = calculateBlanksAccuracy(updatedBlanks);
      historyEntry = {
        blanks: [...updatedBlanks],
        accuracy,
        timestamp: Date.now()
      };
      
      // 保存驗證後的空格狀態
      submittedBlanks = updatedBlanks;
    }
    
    const newPracticeState = {
      ...practiceState,
      submittedBlanks,
      isSegmentComplete: true,
      accuracy,
      attemptCount: practiceState.attemptCount + 1,
      attemptHistory: [
        ...practiceState.attemptHistory,
        historyEntry
      ]
    };

    setPracticeState(newPracticeState);

    onFeedbackChange(true);

    if (player && (isPlaying || isLoopWaiting)) {
      clearLoopTimeout();
      player.pauseVideo();
      setIsPlaying(false);
      setPausedTime(null);
      setIsStarting(false);
    }

    // 立即保存更新後的狀態到記憶中，避免被其他 useEffect 覆蓋
    const currentMemory = { ...difficultyMemory };
    const blanksInputs = new Map<string, string>();
    blanksSegments.forEach(segment => {
      segment.blanks.forEach(blank => {
        if (blank.userInput) {
          blanksInputs.set(blank.id, blank.userInput);
        }
      });
    });
    
    currentMemory[difficulty] = {
      blanksInputs,
      freeTypingInput: newPracticeState.freeTypingInput,
      practiceState: newPracticeState
    };
    
    setDifficultyMemory(currentMemory);
  };

  // 重新嘗試
  const retryCurrentSegment = () => {
    if (!currentBlanksSegment) return;
    
    // 清空所有空格的用戶輸入
    const clearedBlanks = currentBlanksSegment.blanks.map(blank => ({
      ...blank,
      userInput: '',
      isCorrect: false
    }));
    
    const updatedSegments = [...blanksSegments];
    updatedSegments[currentSegmentIndex] = {
      ...currentBlanksSegment,
      blanks: clearedBlanks
    };
    setBlanksSegments(updatedSegments);
    
    setPracticeState(prev => ({
      ...prev,
      userInput: '',
      freeTypingInput: '',  // 同時清空自由輸入
      submittedBlanks: undefined,  // 清空提交的空格狀態
      isSegmentComplete: false
    }));
    
    onFeedbackChange(false);
    
    clearLoopTimeout();
    setIsPlaying(false);
    setIsStarting(false);
    setPausedTime(null);
  };

  // 再聽一次
  const listenAgain = () => {
    playCurrentSegment();
  };

  if (!currentBlanksSegment) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <h3 className="text-xl mb-2">練習完成！</h3>
          <p>恭喜您完成了所有句子的練習</p>
        </div>
      </div>
    );
  }

  // 提交條件判斷
  const hasFreeTypingInput = practiceState.freeTypingInput.trim() !== '';
  
  const canSubmit = difficulty === BlanksDifficulty.ADVANCED 
    ? hasFreeTypingInput  // 高級模式需要有自由輸入內容
    : true;               // 初級中級隨時可提交

  return (
    <div className="h-full bg-slate-900 flex flex-col">
      {/* 標題和進度 */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-slate-100">聽打練習模式</h2>
          <span className="text-slate-400">
            {currentSegmentIndex + 1} / {segments.length}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSegmentIndex + 1) / segments.length) * 100}%` }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* 難度選擇器 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-slate-200 mb-3">難度設定：</h4>
          <div className="flex gap-2">
            {Object.values(BlanksDifficulty).map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  difficulty === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {level === BlanksDifficulty.BEGINNER ? '初級' :
                 level === BlanksDifficulty.INTERMEDIATE ? '中級' : '高級'}
              </button>
            ))}
          </div>
        </div>

        {/* 播放控制 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-slate-200 mb-3">播放控制：</h4>
          
          <div className="mb-3 ml-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Repeat className={`w-4 h-4 ${isLooping ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className={`text-sm ${isLooping ? 'text-blue-400' : 'text-slate-400'}`}>
                循環播放當前句子
              </span>
            </label>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={isPlaying ? pauseSegment : (isLoopWaiting ? skipLoopWait : playCurrentSegment)}
              disabled={isStarting}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                isStarting 
                  ? 'bg-blue-500 cursor-not-allowed' 
                  : isLoopWaiting
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden lg:inline">
                {isStarting 
                  ? '啟動中...' 
                  : isLoopWaiting
                    ? `跳過等待 (${loopCountdown}s)`
                    : isPlaying 
                      ? '暫停' 
                      : '播放'
                }
              </span>
            </button>
            
            <button
              onClick={repeatSegment}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden lg:inline">重複</span>
            </button>

            <button
              onClick={goToPreviousSegment}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
              disabled={currentSegmentIndex <= 0}
            >
              <SkipBack className="w-4 h-4" />
              <span className="hidden lg:inline">上一句</span>
            </button>

            <button
              onClick={goToNextSegment}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
              disabled={currentSegmentIndex >= segments.length - 1}
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden lg:inline">下一句</span>
            </button>
          </div>
        </div>

        {/* 聽打區域 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-slate-200 mb-3">聽打練習：</h4>
          <div className="bg-slate-800 rounded-lg p-4">
            {difficulty === BlanksDifficulty.ADVANCED ? (
              /* 高級模式：自由聽打 */
              <div>
                <p className="text-slate-400 mb-3 text-sm">
                  請聽音頻後，在下方輸入您聽到的完整句子：
                </p>
                <textarea
                  value={practiceState.freeTypingInput}
                  onChange={(e) => setPracticeState(prev => ({ ...prev, freeTypingInput: e.target.value }))}
                  placeholder="請輸入您聽到的內容..."
                  className="w-full h-32 p-4 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  disabled={showFeedback}
                />
              </div>
            ) : (
              /* 初級中級模式：填空練習 */
              <div className="text-slate-100 text-lg leading-relaxed mb-4">
                {currentBlanksSegment.text.split(/\s+/).map((word, index) => {
                  const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
                  const shouldBlank = currentBlanksSegment.blanks.some(blank => blank.word === cleanWord);
                  
                  if (shouldBlank) {
                    const blank = currentBlanksSegment.blanks.find(blank => blank.word === cleanWord);
                    if (blank) {
                      return (
                        <span key={`${index}-${blank.id}`} className="inline-block mx-1">
                          <input
                            type="text"
                            value={blank.userInput}
                            onChange={(e) => updateBlankInput(blank.id, e.target.value)}
                            className={`inline-block px-2 py-1 border-b-2 bg-transparent text-center ${
                              blank.userInput === '' 
                                ? 'border-slate-500' 
                                : blank.isCorrect 
                                  ? 'border-green-500 text-green-400' 
                                  : 'border-red-500 text-red-400'
                            }`}
                            style={{ width: `${Math.max(blank.length * 0.8, 3)}rem` }}
                            placeholder={
                              difficulty === BlanksDifficulty.BEGINNER ? blank.hint :
                              difficulty === BlanksDifficulty.INTERMEDIATE ? '_'.repeat(blank.length) :
                              '_____'
                            }
                            disabled={showFeedback}
                          />
                        </span>
                      );
                    }
                  }
                  
                  return <span key={index} className="mx-1">{word}</span>;
                })}
              </div>
            )}
            
            {!showFeedback && (
              <div className="mt-4">
                <button
                  onClick={submitAnswer}
                  disabled={!canSubmit}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                >
                  提交答案
                </button>
                {difficulty === BlanksDifficulty.ADVANCED && !hasFreeTypingInput && (
                  <p className="text-slate-500 text-sm mt-2">
                    請輸入聽到的內容
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 反饋區域 */}
        {showFeedback && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-slate-200 mb-3">結果反饋：</h4>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">準確度：</span>
                  <span className={`ml-2 font-semibold text-lg ${
                    practiceState.accuracy >= 80 ? 'text-green-400' : 
                    practiceState.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {practiceState.accuracy}%
                  </span>
                </div>
                <div className="text-slate-500 text-sm">
                  第 {practiceState.attemptCount} 次嘗試
                </div>
              </div>

              <div className="mb-4">
                {difficulty === BlanksDifficulty.ADVANCED ? (
                  /* 高級模式：顯示用戶輸入 vs 正確答案 */
                  <div>
                    <div className="mb-3">
                      <p className="text-slate-400 mb-2">您的輸入：</p>
                      <p className="text-slate-300 bg-slate-700 p-3 rounded">{practiceState.freeTypingInput}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-2">正確答案：</p>
                      <p className="text-slate-100 bg-slate-700 p-3 rounded">{currentBlanksSegment.text}</p>
                    </div>
                  </div>
                ) : (
                  /* 初級中級模式：顯示空格檢查 */
                  <div>
                    <p className="text-slate-400 mb-2">答案檢查（正確數/總空格數）：</p>
                    <div className="flex flex-wrap gap-2">
                      {(practiceState.submittedBlanks || currentBlanksSegment.blanks).map((blank) => (
                        <div key={blank.id} className="flex items-center gap-2">
                          <span className="text-slate-300">{blank.word}:</span>
                          <span className={`px-2 py-1 rounded text-sm ${
                            blank.isCorrect 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-red-600/20 text-red-400'
                          }`}>
                            {blank.userInput || '(空白)'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      * 準確度計算：正確填寫的空格數 ÷ 總空格數 × 100%
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={retryCurrentSegment}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新嘗試
                </button>
                
                <button
                  onClick={listenAgain}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  再聽一次
                </button>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}