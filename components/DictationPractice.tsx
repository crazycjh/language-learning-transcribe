'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, RotateCcw, Repeat, SkipBack, SkipForward } from "lucide-react";
import { type Segment } from "@/lib/srt-utils";

import { type YouTubePlayerInterface } from "@/components/YouTubePlayer";

interface DictationPracticeProps {
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
  isSegmentComplete: boolean;
  accuracy: number;
  attemptCount: number;
  attemptHistory: Array<{
    input: string;
    accuracy: number;
    timestamp: number;
  }>;
}

export function DictationPractice({
  segments,
  player,
  currentTime,
  currentSegmentIndex,
  showFeedback,
  onSegmentIndexChange,
  onFeedbackChange
}: DictationPracticeProps) {
  const [practiceState, setPracticeState] = useState<PracticeState>({
    userInput: '',
    isSegmentComplete: false,
    accuracy: 0,
    attemptCount: 0,
    attemptHistory: []
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarting, setIsStarting] = useState(false); // 新增：播放啟動中狀態
  const [pausedTime, setPausedTime] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false); // 新增：循環播放狀態
  const [isLoopWaiting, setIsLoopWaiting] = useState(false); // 新增：循環等待中狀態
  const [loopCountdown, setLoopCountdown] = useState(0); // 新增：循環倒數計時
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 新增：循環延遲的 timeout reference

  const currentSegment = segments[currentSegmentIndex];
  const previousSegment = currentSegmentIndex > 0 ? segments[currentSegmentIndex - 1] : null;
  const nextSegment = currentSegmentIndex < segments.length - 1 ? segments[currentSegmentIndex + 1] : null;

  // 計算當前句子播放百分比
  const calculateSegmentProgress = (): number => {
    if (!currentSegment) return 0;
    
    // 如果當前時間在句子範圍內
    if (currentTime >= currentSegment.startTime && currentTime <= currentSegment.endTime) {
      const progress = (currentTime - currentSegment.startTime) / (currentSegment.endTime - currentSegment.startTime);
      return Math.min(Math.max(progress * 100, 0), 100);
    }
    
    // 如果已播放完此句子
    if (currentTime > currentSegment.endTime) return 100;
    
    // 如果還未開始播放此句子
    return 0;
  };

  const segmentProgress = calculateSegmentProgress();

  // 播放當前句子
  const playCurrentSegment = useCallback(() => {
    if (player && currentSegment && !isStarting) {
      setIsStarting(true); // 設置啟動中狀態，防止重複點擊
      setPausedTime(null); // 清除暫停時間
      
      // 如果正在播放，先暫停再重新開始（循環模式會用到）
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      }
      
      player.seekTo(currentSegment.startTime);
      
      // 添加短暫延遲確保 seekTo 完成後再播放和設置狀態
      setTimeout(() => {
        if (player) {
          player.playVideo();
          setIsPlaying(true); // 移到真正播放時才設置狀態
          setIsStarting(false); // 清除啟動中狀態
        }
      }, 100); // 100ms 延遲
    }
  }, [player, currentSegment, isStarting, isPlaying]);

  // 繼續播放（從暫停位置）
  const resumePlayback = () => {
    if (player && currentSegment && pausedTime !== null && !isStarting && !isPlaying) {
      setIsStarting(true); // 設置啟動中狀態，防止重複點擊
      
      // 確保暫停時間在當前句子範圍內
      const resumeTime = Math.max(currentSegment.startTime, 
                          Math.min(pausedTime, currentSegment.endTime));
      player.seekTo(resumeTime);
      
      // 添加短暫延遲確保 seekTo 完成後再播放和設置狀態
      setTimeout(() => {
        if (player) {
          player.playVideo();
          setIsPlaying(true); // 移到真正播放時才設置狀態
          setIsStarting(false); // 清除啟動中狀態
        }
      }, 100); // 100ms 延遲
    }
  };

  // 智能播放：根據是否有暫停時間決定播放方式
  const smartPlay = () => {
    // 如果正在循環等待中，立即跳過等待開始播放
    if (isLoopWaiting) {
      clearLoopTimeout();
      playCurrentSegment();
      return;
    }
    
    // 檢查是否有有效的暫停時間（在當前句子範圍內）
    const hasValidPausedTime = pausedTime !== null && 
                               currentSegment && 
                               pausedTime >= currentSegment.startTime && 
                               pausedTime < currentSegment.endTime;
    
    if (hasValidPausedTime) {
      resumePlayback();
    } else {
      // 沒有有效暫停時間，從句子開頭播放
      playCurrentSegment();
    }
  };

  // 暫停播放
  const pauseSegment = useCallback(() => {
    if (player) {
      player.pauseVideo();
      setIsPlaying(false);
      // 保存當前播放時間
      setPausedTime(currentTime);
    }
  }, [player, currentTime]);

  // 重複播放當前句子
  const repeatSegment = () => {
    playCurrentSegment(); // playCurrentSegment 已經會清除 pausedTime
  };

  // 跳到上一句
  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      // 先暫停當前播放
      if (player && isPlaying) {
        player.pauseVideo();
      }
      
      onSegmentIndexChange(currentSegmentIndex - 1);
      onFeedbackChange(false);
      
      setPracticeState(prev => ({
        ...prev,
        userInput: '',
        isSegmentComplete: false,
        accuracy: 0,
        attemptCount: 0,
        attemptHistory: []
      }));
      
      // 重置所有播放相關狀態
      clearLoopTimeout(); // 清理循環延遲
      setPausedTime(null);
      setIsPlaying(false);
      setIsStarting(false);
      // 注意：不重置 isLooping，讓用戶可以在句子間保持循環設定
    }
  };

  // 跳到下一句
  const goToNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      // 先暫停當前播放
      if (player && isPlaying) {
        player.pauseVideo();
      }
      
      onSegmentIndexChange(currentSegmentIndex + 1);
      onFeedbackChange(false);
      
      setPracticeState(prev => ({
        ...prev,
        userInput: '',
        isSegmentComplete: false,
        accuracy: 0,
        attemptCount: 0,
        attemptHistory: []
      }));
      
      // 重置所有播放相關狀態
      clearLoopTimeout(); // 清理循環延遲
      setPausedTime(null);
      setIsPlaying(false);
      setIsStarting(false);
      // 注意：不重置 isLooping，讓用戶可以在句子間保持循環設定
    }
  };

  // 計算輸入準確度
  const calculateAccuracy = (userInput: string, correctText: string): number => {
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
  };

  // 提交輸入
  const submitInput = () => {
    if (!currentSegment) return;

    const accuracy = calculateAccuracy(practiceState.userInput, currentSegment.text);
    
    setPracticeState(prev => ({
      ...prev,
      isSegmentComplete: true,
      accuracy,
      attemptCount: prev.attemptCount + 1,
      attemptHistory: [
        ...prev.attemptHistory,
        {
          input: prev.userInput,
          accuracy,
          timestamp: Date.now()
        }
      ]
    }));

    onFeedbackChange(true);

    // 暫停播放並清除暫停時間（進入反饋模式）
    if (player && (isPlaying || isLoopWaiting)) {
      clearLoopTimeout(); // 清理循環延遲
      player.pauseVideo();
      setIsPlaying(false);
      setPausedTime(null); // 進入反饋模式時清除暫停狀態
      setIsStarting(false); // 清除啟動中狀態
      // 注意：進入反饋模式時保持循環設定，讓用戶可以在查看反饋後繼續循環練習
    }
  };

  // 重新嘗試當前句子
  const retryCurrentSegment = () => {
    setPracticeState(prev => ({
      ...prev,
      userInput: '',
      isSegmentComplete: false
      // 保留 attemptCount 和 attemptHistory，不重置
    }));
    
    onFeedbackChange(false);
    
    // 清理播放狀態，讓用戶重新開始
    clearLoopTimeout();
    setIsPlaying(false);
    setIsStarting(false);
    setPausedTime(null);
  };

  // 再聽一次（不清除反饋，只播放音頻）
  const listenAgain = () => {
    playCurrentSegment();
  };

  // 清理循環延遲的函數
  const clearLoopTimeout = useCallback(() => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    setIsLoopWaiting(false);
    setLoopCountdown(0);
  }, []);

  // 監聽播放時間，自動暫停在句子結尾或循環播放
  useEffect(() => {
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
  }, [currentTime, currentSegment, isPlaying, player, isLooping, isLoopWaiting, playCurrentSegment]);

  // 自動聚焦輸入框
  useEffect(() => {
    if (inputRef.current && !showFeedback) {
      inputRef.current.focus();
    }
  }, [currentSegmentIndex, showFeedback]);

  // 組件卸載時清理 timeout
  useEffect(() => {
    return () => {
      clearLoopTimeout();
    };
  }, [clearLoopTimeout]);

  if (!currentSegment) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <h3 className="text-xl mb-2">練習完成！</h3>
          <p>恭喜您完成了所有句子的練習</p>
        </div>
      </div>
    );
  }

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

        {/* 播放控制 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-slate-200 mb-3">播放控制：</h4>
          
          {/* 循環播放選項 */}
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
              onClick={isPlaying ? pauseSegment : smartPlay}
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
                    ? '跳過等待'
                    : isPlaying 
                      ? '暫停' 
                      : (pausedTime !== null ? '繼續' : '播放')
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

        {/* 輸入區域 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-slate-200 mb-3">您的輸入：</h4>
          <div className="px-1">

            <textarea
              ref={inputRef}
              value={practiceState.userInput}
              onChange={(e) => setPracticeState(prev => ({ ...prev, userInput: e.target.value }))}
              placeholder="請輸入您聽到的內容..."
              className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              disabled={showFeedback}
            />
          </div>
          
          {!showFeedback && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={submitInput}
                disabled={!practiceState.userInput.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                提交答案
              </button>
            </div>
          )}
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

              {/* 嘗試歷史（如果有多次嘗試） */}
              {practiceState.attemptHistory.length > 1 && (
                <div className="mb-3 p-3 bg-slate-700/50 rounded">
                  <p className="text-slate-400 text-sm mb-2">進步記錄：</p>
                  <div className="flex gap-2 flex-wrap">
                    {practiceState.attemptHistory.map((attempt, index) => (
                      <span 
                        key={index}
                        className={`px-2 py-1 rounded text-xs ${
                          attempt.accuracy >= 80 ? 'bg-green-600/20 text-green-400' : 
                          attempt.accuracy >= 60 ? 'bg-yellow-600/20 text-yellow-400' : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        第{index + 1}次: {attempt.accuracy}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <p className="text-slate-400 mb-2">您的輸入：</p>
                <p className="text-slate-300 bg-slate-700 p-3 rounded">{practiceState.userInput}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-slate-400 mb-2">正確答案：</p>
                <p className="text-slate-100 bg-slate-700 p-3 rounded">{currentSegment.text}</p>
              </div>

              {/* 智能建議 */}
              <div className="mb-4 p-3 bg-slate-700/30 rounded">
                <p className="text-slate-300 text-sm">
                  {practiceState.accuracy >= 90 
                    ? "🎉 很好！可以進入下一句了" 
                    : practiceState.accuracy >= 70 
                      ? "👍 接近了！要不要再試一次？" 
                      : "💪 建議再聽幾次後重新嘗試"
                  }
                </p>
              </div>

              {/* 操作按鈕 */}
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