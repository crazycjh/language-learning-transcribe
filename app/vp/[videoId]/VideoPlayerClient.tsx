"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  YouTubePlayer,
  type YouTubePlayerInterface,
} from "@/components/YouTubePlayer";
import { SrtTranscriptViewer } from "@/components/SrtTranscriptViewer";
import { BlanksFillPractice } from "@/components/BlanksFillPractice";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { parseSRT } from "@/lib/srt-utils";
import { getSrtContent } from "@/lib/video-service";
import { ArrowLeft, Loader2 } from "lucide-react";

// 4voKeMm3u1Y
export default function VideoPlayerClient({ videoId }: { videoId: string }) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState<YouTubePlayerInterface | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [externalPlayState, setExternalPlayState] = useState<boolean | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  // Wake Lock for keeping screen awake during playback
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // 使用 TanStack Query 抓取並快取 SRT 資料
  const { data: srtContent = "", isLoading } = useQuery({
    queryKey: ["srt", videoId],
    queryFn: () => getSrtContent(videoId),
  });

  // 從 srtContent 計算 segments
  const segments = useMemo(() => {
    if (!srtContent) return [];
    return parseSRT(srtContent);
  }, [srtContent]);

  // Wake Lock 管理函數
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        setWakeLockActive(true);
        console.log("Wake Lock activated");
      }
    } catch (err) {
      console.error("Wake Lock request failed:", err);
      setWakeLockActive(false);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setWakeLockActive(false);
        console.log("Wake Lock released");
      }
    } catch (err) {
      console.error("Wake Lock release failed:", err);
    }
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePlayerStateChange = useCallback((state: number) => {
    // YouTube 播放狀態: -1=未開始, 0=結束, 1=播放中, 2=暫停, 3=緩衝中, 5=已排隊
    const stateNames: Record<number, string> = {
      '-1': '未開始',
      0: '結束',
      1: '播放中',
      2: '暫停',
      3: '緩衝中',
      5: '已排隊'
    };

    console.log(`[Wake Lock] YouTube state: ${state} (${stateNames[state] || '未知'})`);

    if (state === 1) {
      console.log('[Wake Lock] → 設置 externalPlayState = true');
      setExternalPlayState(true);
      console.log('[Wake Lock] → 請求 Wake Lock');
      requestWakeLock(); // 播放時啟用 wake lock
    } else if (state === 2) {
      console.log('[Wake Lock] → 設置 externalPlayState = false');
      setExternalPlayState(false);
      console.log('[Wake Lock] → 釋放 Wake Lock');
      releaseWakeLock(); // 暫停時釋放 wake lock
    } else {
      console.log(`[Wake Lock] → 忽略狀態 ${state}`);
    }
  }, [requestWakeLock, releaseWakeLock]);

  const handleSegmentClick = useCallback((time: number) => {
    if (player) {
      player.seekTo(time);
    }
  }, [player]);

  const handlePreviousSegment = useCallback(() => {
    setCurrentSegmentIndex(prev => {
      if (prev > 0) {
        setShowFeedback(false);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleNextSegment = useCallback(() => {
    setCurrentSegmentIndex(prev => {
      const maxIndex = segments.length - 1;
      if (prev < maxIndex) {
        setShowFeedback(false);
        return prev + 1;
      }
      return prev;
    });
  }, [segments.length]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (player) {
      player.setPlaybackRate(rate);
    }
  }, [player]);

  // 檢測並記錄 Wake Lock 支援狀況
  useEffect(() => {
    const supported = 'wakeLock' in navigator;
    const userAgent = navigator.userAgent;

    // 解析瀏覽器資訊
    let browserInfo = '未知瀏覽器';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const version = userAgent.match(/Version\/([\d.]+)/)?.[1] || '?';
      browserInfo = `Safari ${version}`;
    } else if (userAgent.includes('Chrome')) {
      const version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || '?';
      if (userAgent.includes('Edg')) {
        browserInfo = `Edge ${version}`;
      } else {
        browserInfo = `Chrome ${version}`;
      }
    } else if (userAgent.includes('Firefox')) {
      const version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || '?';
      browserInfo = `Firefox ${version}`;
    }

    console.log('=== Wake Lock 支援檢測 ===');
    console.log('瀏覽器:', browserInfo);
    console.log('Wake Lock 支援:', supported ? '✅ 是' : '❌ 否');
    if (!supported) {
      console.log('建議: 使用 Chrome/Edge 84+ 或 Safari PWA 模式');
    }
  }, []);

  const checkWakeLockSupport = useCallback(() => {
    const supported = 'wakeLock' in navigator;
    const isActive = wakeLockRef.current !== null;
    const userAgent = navigator.userAgent;

    // 檢查是否為 PWA 模式
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    // 解析瀏覽器資訊
    let browserInfo = '未知瀏覽器';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const version = userAgent.match(/Version\/([\d.]+)/)?.[1] || '?';
      browserInfo = `Safari ${version}`;
    } else if (userAgent.includes('Chrome')) {
      const version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || '?';
      if (userAgent.includes('Edg')) {
        browserInfo = `Edge ${version}`;
      } else {
        browserInfo = `Chrome ${version}`;
      }
    } else if (userAgent.includes('Firefox')) {
      const version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || '?';
      browserInfo = `Firefox ${version}`;
    }

    let message = `📱 瀏覽器: ${browserInfo}\n`;
    message += `📦 模式: ${isPWA ? 'PWA (已安裝)' : '瀏覽器模式'}\n\n`;

    message += supported
      ? '✅ 支援 Wake Lock\n\n'
      : '❌ 不支援 Wake Lock\n\n';

    if (supported) {
      message += `目前狀態: ${isActive ? '🟢 已啟用（螢幕保持開啟）' : '⚪ 未啟用'}`;
    } else {
      if (browserInfo.includes('Safari') && !isPWA) {
        message += '💡 Safari 解決方法:\n1. 點擊「分享」按鈕\n2. 選擇「加入主畫面」\n3. 從主畫面打開 App';
      } else {
        message += '建議使用:\n• Chrome/Edge 84+\n• Safari PWA 模式';
      }
    }

    alert(message);
  }, []);

  // 使用 ref 追蹤最新的播放狀態，避免 useEffect 重新運行
  const externalPlayStateRef = useRef(externalPlayState);
  useEffect(() => {
    externalPlayStateRef.current = externalPlayState;
  }, [externalPlayState]);

  // 處理頁面可見性變化和組件卸載
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Wake Lock] 頁面隱藏，釋放 Wake Lock');
        // 頁面隱藏時釋放 wake lock
        releaseWakeLock();
      } else if (externalPlayStateRef.current === true) {
        console.log('[Wake Lock] 頁面重新可見且正在播放，請求 Wake Lock');
        // 頁面重新可見且正在播放時，重新請求 wake lock
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 組件卸載時釋放 wake lock
    return () => {
      console.log('[Wake Lock] 組件卸載，釋放 Wake Lock');
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, []); // 👈 空依賴項，只在 mount/unmount 時運行

  if (isLoading) {
    return (
      <div className="bg-slate-900 h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mr-2" />
        {/* <span className="text-slate-400 text-lg">載入字幕中...</span> */}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 h-screen flex flex-col">
      {/* 返回按鈕 */}
      <div className="flex-shrink-0 max-w-7xl w-full mx-auto px-4 md:px-10 pt-4 pb-2">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>返回</span>
          </button>
          <button
            onClick={checkWakeLockSupport}
            className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            🔋 Wake Lock 狀態
          </button>
          <div className={`flex items-center gap-2 px-3 py-2 text-sm md:text-base rounded-lg ${
            wakeLockActive
              ? 'bg-green-900/30 text-green-400'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              wakeLockActive ? 'bg-green-400 animate-pulse' : 'bg-slate-600'
            }`} />
            <span>{wakeLockActive ? '螢幕保持開啟' : '未啟用'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-4 px-4 md:px-10 pb-4 md:pb-10 overflow-y-auto scrollbar-hide">
        <div className="w-full md:w-1/2">
          <YouTubePlayer
            videoId={videoId}
            onTimeUpdate={handleTimeUpdate}
            onStateChange={handlePlayerStateChange}
            onPlayerReady={setPlayer}
          />
          <div className="mt-4 flex items-center gap-2 md:gap-4">
            {/* <span className="text-slate-400">當前時間: {Math.round(currentTime)}s</span> */}
            <div className="flex gap-1 md:gap-2">
              <button
                className={`px-2 py-1 md:px-4 md:py-2 text-sm md:text-base rounded transition-colors ${
                  !isPracticeMode
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                onClick={() => setIsPracticeMode(false)}
              >
                觀看模式
              </button>
              <button
                className={`px-2 py-1 md:px-4 md:py-2 text-sm md:text-base rounded transition-colors ${
                  isPracticeMode
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                onClick={() => setIsPracticeMode(true)}
              >
                聽打練習
              </button>
            </div>
            <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
              <span className="text-slate-400 text-xs md:text-base">
                播放速度:
              </span>
              <select
                value={playbackRate}
                onChange={(e) =>
                  handlePlaybackRateChange(Number(e.target.value))
                }
                className="px-2 py-1 md:px-3 md:py-2 text-sm md:text-base rounded bg-slate-700 text-slate-100 border border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={0.8}>0.8x</option>
                <option value={0.85}>0.85x</option>
                <option value={0.9}>0.9x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>

          {/* 練習模式下顯示句子信息（僅在電腦版左右分欄時） */}
          {isPracticeMode && segments.length > 0 && (
            <div className="hidden md:block">
              <SentenceDisplay
                segments={segments}
                currentSegmentIndex={currentSegmentIndex}
                currentTime={currentTime}
                showFeedback={showFeedback}
                onPreviousSegment={handlePreviousSegment}
                onNextSegment={handleNextSegment}
              />
            </div>
          )}
        </div>
        <div className="w-full md:w-1/2 h-[60vh] md:h-full">
          {isPracticeMode ? (
            <BlanksFillPractice
              segments={segments}
              player={player}
              currentTime={currentTime}
              currentSegmentIndex={currentSegmentIndex}
              showFeedback={showFeedback}
              onSegmentIndexChange={setCurrentSegmentIndex}
              onFeedbackChange={setShowFeedback}
              externalPlayState={externalPlayState}
            />
          ) : (
            <SrtTranscriptViewer
              srtContent={srtContent}
              currentTime={currentTime}
              onSegmentClick={handleSegmentClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
