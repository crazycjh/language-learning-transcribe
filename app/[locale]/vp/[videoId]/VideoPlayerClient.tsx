"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  YouTubePlayer,
  type YouTubePlayerInterface,
} from "@/components/YouTubePlayer";
import { SrtTranscriptViewer } from "@/components/SrtTranscriptViewer";
import { BlanksFillPractice } from "@/components/BlanksFillPractice";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { parseSRT } from "@/lib/srt-utils";
import { getSrtContent, getAvailableLanguages, getSummary } from "@/lib/video-service";
import { ArrowLeft, Loader2, Share, Languages } from "lucide-react";
import { VideoSummary } from "@/components/VideoSummary";

// 4voKeMm3u1Y
export default function VideoPlayerClient({ videoId }: { videoId: string }) {
  const t = useTranslations("videoPlayer");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 從 URL 參數讀取初始狀態
  const initialMode = searchParams.get("mode") === "practice";
  const initialSegment = searchParams.get("segment")
    ? parseInt(searchParams.get("segment")!)
    : 0;
  const initialTime = searchParams.get("time")
    ? parseFloat(searchParams.get("time")!)
    : 0;

  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState<YouTubePlayerInterface | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(initialMode);
  const [currentSegmentIndex, setCurrentSegmentIndex] =
    useState(initialSegment);
  const [showFeedback, setShowFeedback] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [externalPlayState, setExternalPlayState] = useState<boolean | null>(
    null
  );
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('default');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Wake Lock for keeping screen awake during playback
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // 使用 TanStack Query 抓取可用語言
  const { data: availableLanguages = ['default'] } = useQuery({
    queryKey: ["languages", videoId],
    queryFn: () => getAvailableLanguages(videoId),
  });

  // 使用 TanStack Query 抓取並快取 SRT 資料（永遠使用 default）
  const { data: srtContent = "", isLoading } = useQuery({
    queryKey: ["srt", videoId],
    queryFn: () => getSrtContent(videoId),
  });

  // 使用 TanStack Query 抓取摘要資料（根據選擇的語言）
  const { data: summary } = useQuery({
    queryKey: ["summary", videoId, selectedLanguage],
    queryFn: () => getSummary(videoId, selectedLanguage === 'default' ? undefined : selectedLanguage),
    enabled: !isPracticeMode, // 只在 watch mode 載入摘要
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
        const wakeLock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = wakeLock;

        // 監聽系統釋放事件（電池低、低電量模式等）
        wakeLock.addEventListener("release", () => {
          wakeLockRef.current = null;

          // 如果仍在播放，嘗試重新請求（延遲避免立即失敗）
          setTimeout(() => {
            if (externalPlayStateRef.current === true) {
              requestWakeLock();
            }
          }, 1000);
        });
      }
    } catch (err) {
      console.error("Wake Lock request failed:", err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (err) {
      console.error("Wake Lock release failed:", err);
    }
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePlayerStateChange = useCallback(
    (state: number) => {
      // YouTube 播放狀態: -1=未開始, 0=結束, 1=播放中, 2=暫停, 3=緩衝中, 5=已排隊
      if (state === 1) {
        setExternalPlayState(true);
        requestWakeLock(); // 播放時啟用 wake lock
      } else if (state === 2) {
        setExternalPlayState(false);
        releaseWakeLock(); // 暫停時釋放 wake lock
      }
    },
    [requestWakeLock, releaseWakeLock]
  );

  const handleSegmentClick = useCallback(
    (time: number) => {
      if (player) {
        player.seekTo(time);
      }
    },
    [player]
  );

  const handlePreviousSegment = useCallback(() => {
    setCurrentSegmentIndex((prev) => {
      if (prev > 0) {
        setShowFeedback(false);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleNextSegment = useCallback(() => {
    setCurrentSegmentIndex((prev) => {
      const maxIndex = segments.length - 1;
      if (prev < maxIndex) {
        setShowFeedback(false);
        return prev + 1;
      }
      return prev;
    });
  }, [segments.length]);

  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      setPlaybackRate(rate);
      if (player) {
        player.setPlaybackRate(rate);
      }
    },
    [player]
  );

  // 生成分享連結
  const generateShareUrl = useCallback(() => {
    const baseUrl = `${window.location.origin}/${locale}/vp/${videoId}`;
    const params = new URLSearchParams();

    if (isPracticeMode) {
      params.append("mode", "practice");
      params.append("segment", currentSegmentIndex.toString());
    } else {
      params.append("mode", "watch");
      params.append("time", Math.round(currentTime).toString());
    }

    return `${baseUrl}?${params.toString()}`;
  }, [locale, videoId, isPracticeMode, currentSegmentIndex, currentTime]);

  // 複製分享連結到剪貼簿
  const handleShare = useCallback(async () => {
    const shareUrl = generateShareUrl();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopiedMessage(true);

      // 3秒後隱藏提示
      setTimeout(() => {
        setShowCopiedMessage(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, [generateShareUrl]);

  // 使用 ref 追蹤最新的播放狀態，避免 useEffect 重新運行
  const externalPlayStateRef = useRef(externalPlayState);
  useEffect(() => {
    externalPlayStateRef.current = externalPlayState;
  }, [externalPlayState]);

  // 從 URL 參數初始化播放位置（僅執行一次）
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (player && segments.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;

      const hasParams = initialTime > 0 || initialSegment > 0 || initialMode;

      if (initialTime > 0) {
        // 如果有指定時間，跳轉到該時間
        player.seekTo(initialTime, false);
      } else if (initialSegment > 0 && segments[initialSegment]) {
        // 如果有指定句子索引，跳轉到該句子的開始時間
        player.seekTo(segments[initialSegment].startTime, false);
      }

      // 如果有 URL 參數，處理完後清空參數（使用 replace 避免影響瀏覽器歷史）
      if (hasParams) {
        router.replace(`/${locale}/vp/${videoId}`, { scroll: false });
      }
    }
  }, [
    player,
    segments,
    initialTime,
    initialSegment,
    initialMode,
    router,
    videoId,
    locale,
  ]);

  // 處理頁面可見性變化和組件卸載
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 頁面隱藏時釋放 wake lock
        releaseWakeLock();
      } else if (externalPlayStateRef.current === true) {
        // 頁面重新可見且正在播放時，重新請求 wake lock
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 組件卸載時釋放 wake lock
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

  // 點擊外部關閉語言選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.language-menu-container')) {
          setShowLanguageMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

  if (isLoading) {
    return (
      <div className="bg-slate-900 h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mr-2" />
        {/* <span className="text-slate-400 text-lg">{t('loadingSubtitles')}</span> */}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 h-[calc(100vh-3.5rem)] flex flex-col">
      {/* 返回按鈕 */}
      <div className="flex-shrink-0 max-w-7xl w-full mx-auto px-2 md:px-10 pt-2 md:pt-4 pb-1 md:pb-2">
        <button
          onClick={() => router.push(`/${locale}`)}
          className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 text-xs md:text-base text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3 h-3 md:w-5 md:h-5" />
          <span>{tCommon("back")}</span>
        </button>
      </div>

      <div
        className={`flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-2 md:gap-4 px-2 md:px-10 pb-2 md:pb-10 ${
          isPracticeMode ? "overflow-auto" : "overflow-hidden"
        }`}
      >
        <div className={`w-full md:w-1/2 ${!isPracticeMode ? "md:overflow-y-auto scrollbar-hide" : ""}`}>
          <YouTubePlayer
            videoId={videoId}
            onTimeUpdate={handleTimeUpdate}
            onStateChange={handlePlayerStateChange}
            onPlayerReady={setPlayer}
          />
          <div className="mt-4 flex items-center gap-2 md:gap-4 flex-wrap">
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
                {t("watchMode")}
              </button>
              <button
                className={`px-2 py-1 md:px-4 md:py-2 text-sm md:text-base rounded transition-colors ${
                  isPracticeMode
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                onClick={() => {
                  setIsPracticeMode(true);
                  // 根據當前時間計算對應的句子索引
                  const newIndex = segments.findIndex(
                    (segment) =>
                      currentTime >= segment.startTime &&
                      currentTime < segment.endTime
                  );
                  if (newIndex !== -1) {
                    setCurrentSegmentIndex(newIndex);
                  }
                }}
              >
                {t("practiceMode")}
              </button>
            </div>
            {/* 語言選擇器 */}
            <div className="relative language-menu-container">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 text-sm md:text-base bg-slate-700 text-slate-300 hover:bg-slate-600 rounded transition-colors"
                title="選擇語言"
              >
                <Languages className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">
                  {selectedLanguage === 'default' ? '原文' : selectedLanguage.toUpperCase()}
                </span>
              </button>
              {showLanguageMenu && (
                <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded shadow-lg z-20 min-w-[120px]">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${
                        selectedLanguage === lang ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                      }`}
                    >
                      {lang === 'default' ? '原文' : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 分享按鈕 */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 text-sm md:text-base bg-slate-700 text-slate-300 hover:bg-slate-600 rounded transition-colors"
                title={t("shareTitle")}
              >
                <Share className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">{t("share")}</span>
              </button>
              {showCopiedMessage && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-blue-600 text-white text-xs md:text-sm rounded whitespace-nowrap z-10">
                  {t("linkCopied")}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
              <span className="text-slate-400 text-xs md:text-base">
                {t("playbackSpeed")}:
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

          {/* 摘要顯示在播放器下方（只在 watch mode） */}
          {!isPracticeMode && (
            <div className="mt-4">
              <VideoSummary summary={summary} />
            </div>
          )}

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
        <div className="w-full md:w-1/2 min-h-0 flex-1">
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
              videoId={videoId}
              availableLanguages={availableLanguages}
              summary={summary}
            />
          )}
        </div>
      </div>
    </div>
  );
}
