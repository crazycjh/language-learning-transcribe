'use client';

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Loader2, Play, Languages, BookOpen } from "lucide-react";
import { parseSRT, type Segment } from "@/lib/srt-utils";
import { getSrtContent, getSegments, getSummary, type SummaryData, type SegmentsData } from "@/lib/video-service";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

interface SrtTranscriptViewerProps {
  srtContent: string;
  currentTime: number;
  onSegmentClick: (time: number) => void;
  videoId: string;
  availableLanguages: string[];
  summary?: SummaryData | null;
}

export function SrtTranscriptViewer({
  srtContent,
  currentTime,
  onSegmentClick,
  videoId,
  availableLanguages,
  summary
}: SrtTranscriptViewerProps) {
  const t = useTranslations("videoPlayer");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [copiedSegmentId, setCopiedSegmentId] = useState<number | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState<string>('zh');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [activeTabLanguage, setActiveTabLanguage] = useState<string>(availableLanguages[0]);
  const [loadedLanguages, setLoadedLanguages] = useState<Set<string>>(new Set([availableLanguages[0]]));
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // 獲取翻譯字幕
  const { data: translationContent = "" } = useQuery({
    queryKey: ["srt-translation", videoId, translationLanguage],
    queryFn: () => getSrtContent(videoId, translationLanguage),
    enabled: showTranslation && translationLanguage !== 'default',
  });

  // 獲取分段資訊（使用 default 語言）
  const { data: segmentsData } = useQuery({
    queryKey: ["segments", videoId, 'default'],
    queryFn: () => getSegments(videoId),
  });

  // 為每個語言創建條件查詢（只在需要時才啟用）
  const segmentSummaryQueries = availableLanguages.map(lang => ({
    segments: useQuery({
      queryKey: ["segments", videoId, lang],
      queryFn: () => getSegments(videoId, lang === 'default' ? undefined : lang),
      enabled: loadedLanguages.has(lang),
    }),
    summary: useQuery({
      queryKey: ["summary", videoId, lang],
      queryFn: () => getSummary(videoId, lang === 'default' ? undefined : lang),
      enabled: loadedLanguages.has(lang),
    })
  }));

  // 當切換 Tab 時，標記該語言為已載入
  const handleTabChange = (lang: string) => {
    setActiveTabLanguage(lang);
    if (!loadedLanguages.has(lang)) {
      setLoadedLanguages(prev => new Set([...prev, lang]));
    }
  };

  // Debug: 檢查 segments 資料
  useEffect(() => {
    if (segmentsData) {
      console.log('Segments data:', segmentsData);
      console.log('Total segments:', segments.length);
    }
  }, [segmentsData, segments.length]);

  // 解析翻譯字幕
  const [translationSegments, setTranslationSegments] = useState<Segment[]>([]);
  useEffect(() => {
    if (translationContent && showTranslation) {
      const parsed = parseSRT(translationContent);
      setTranslationSegments(parsed);
    } else {
      setTranslationSegments([]);
    }
  }, [translationContent, showTranslation]);
  
  // 解析 SRT 內容
  useEffect(() => {
    if (srtContent) {
      const parsed = parseSRT(srtContent);
      setSegments(parsed);
    }
  }, [srtContent]);

  // 獲取特定語言的分段數據
  const getSegmentsDataForLanguage = (lang: string): SegmentsData | null => {
    const index = availableLanguages.indexOf(lang);
    if (index === -1) return null;
    return segmentSummaryQueries[index]?.segments.data || null;
  };

  // 獲取特定語言的摘要數據
  const getSummaryDataForLanguage = (lang: string): SummaryData | null => {
    const index = availableLanguages.indexOf(lang);
    if (index === -1) return null;
    return segmentSummaryQueries[index]?.summary.data || null;
  };
  
  // 智慧滾動函數
  const scrollToSegment = (segmentId: number) => {
    const segmentElement = segmentRefs.current[segmentId];
    const container = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    
    if (!segmentElement || !container) return;
    
    const containerHeight = container.clientHeight;
    const elementTop = segmentElement.offsetTop;
    
    // 理想位置：小螢幕距頂部 80px，大螢幕距頂部 150px
    const isMobile = window.innerWidth < 768;
    const offset = isMobile ? 80 : 150;
    const idealScrollTop = elementTop - offset;
    
    // 最大可滾動距離
    const maxScroll = container.scrollHeight - containerHeight;
    
    // 限制在可滾動範圍內
    const finalScrollTop = Math.max(0, Math.min(idealScrollTop, maxScroll));
    
    container.scrollTo({ top: finalScrollTop, behavior: 'smooth' });
  };

  // 更新當前活動片段
  useEffect(() => {
    const activeSegment = segments.find(
      segment => currentTime >= segment.startTime && currentTime < segment.endTime
    );
    setActiveSegmentId(activeSegment?.id || null);
  }, [currentTime, segments]);

  // 當活動片段改變時自動滾動
  useEffect(() => {
    if (activeSegmentId !== null) {
      scrollToSegment(activeSegmentId);
    }
  }, [activeSegmentId]);

  // 點擊外部關閉語言選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (showLanguageMenu && !target.closest('.translation-language-menu')) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

  // 監聽滾動，關閉 Popover
  useEffect(() => {
    if (!openPopoverId) return;

    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setOpenPopoverId(null);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [openPopoverId]);
  
  // 載入狀態
  if (!srtContent || segments.length === 0) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <h3 className="text-lg">{t("loadingTranscript")}</h3>
        </div>
      </div>
    );
  }

  // 過濾掉 default，只顯示翻譯語言
  const translationLanguages = availableLanguages.filter(lang => lang !== 'default');

  return (
    <div className="transcript-container h-full bg-slate-900 flex flex-col">
      {/* 翻譯控制列 */}
      <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1.5 md:p-2 border-b border-slate-800 bg-slate-950/50">
        <label className="flex items-center gap-1.5 md:gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTranslation}
            onChange={(e) => setShowTranslation(e.target.checked)}
            className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
          />
          <span className="text-xs md:text-sm text-slate-300">{t("showTranslation")}</span>
        </label>
        
        {showTranslation && translationLanguages.length > 0 && (
          <div className="relative translation-language-menu ml-1 md:ml-2">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-0.5 md:gap-1 px-1.5 py-0.5 md:px-2 md:py-1 text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 rounded transition-colors"
            >
              <Languages className="w-3 h-3" />
              <span>{translationLanguage.toUpperCase()}</span>
            </button>
            {showLanguageMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-lg z-20 min-w-[80px]">
                {translationLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setTranslationLanguage(lang);
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 transition-colors ${
                      translationLanguage === lang ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 字幕列表 */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea ref={scrollAreaRef} className="h-full pt-2 md:pt-4 px-2 md:px-4 space-y-1 md:space-y-4 border border-slate-800 bg-slate-950/50 rounded-md p-2 md:p-4">
        {segments.map((segment) => {
          // 找到對應的翻譯
          const translation = translationSegments.find(t => t.id === segment.id);
          
          // 找到該字幕屬於哪個章節（segment.id 是 SRT 的序號，從 1 開始）
          const chapter = segmentsData?.segments.find(
            ch => segment.id >= ch.startIndex && segment.id <= ch.endIndex
          );
          const chapterIndex = segmentsData?.segments.findIndex(
            ch => segment.id >= ch.startIndex && segment.id <= ch.endIndex
          );
          
          // 是否是章節的第一句（使用 segment.id 而不是 array index）
          const isChapterStart = chapter && segment.id === chapter.startIndex;
          
          // 交替背景色 - 使用更明顯的對比
          const bgColor = chapterIndex !== undefined && chapterIndex >= 0
            ? (chapterIndex % 2 === 0 ? 'bg-blue-900/20' : 'bg-slate-800/30')
            : 'bg-slate-800/20';
          
          // 左側 bar 顏色（奇偶不同）
          const barColor = chapterIndex !== undefined && chapterIndex >= 0
            ? (chapterIndex % 2 === 0 ? 'bg-blue-500/60' : 'bg-cyan-500/60')
            : '';
          
          return (
          <div
            key={segment.id}
            ref={(el) => { segmentRefs.current[segment.id] = el; }}
            className={`segment p-1.5 md:p-2 rounded transition-colors relative
              ${activeSegmentId === segment.id 
                ? 'bg-yellow-900/30 border-l-2 border-yellow-500' 
                : `${bgColor} hover:bg-slate-700/50`}`}
          >
            {/* 章節左側 bar - 覆蓋整個章節 */}
            {chapter && (
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1 ${barColor} rounded-l`}
              >
                {/* 只在章節開始顯示圖示 */}
                {isChapterStart && (
                  <Popover 
                    open={openPopoverId === chapter.id}
                    onOpenChange={(open) => setOpenPopoverId(open ? chapter.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button className="absolute left-1 top-1/2 -translate-y-1/2 p-0 border-0 bg-transparent">
                        <BookOpen 
                          className="w-4 h-4 text-blue-400 cursor-pointer hover:text-blue-300 transition-colors" 
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      side="right" 
                      align="start"
                      className="w-96 p-0 bg-slate-900 border-slate-600"
                    >
                      <Tabs 
                        defaultValue={availableLanguages[0]} 
                        className="w-full"
                        onValueChange={handleTabChange}
                      >
                        <TabsList className="w-full justify-start rounded-none border-b border-slate-700 bg-slate-900 p-0">
                          {availableLanguages.map((lang) => (
                            <TabsTrigger 
                              key={lang}
                              value={lang}
                              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400 text-slate-400 hover:text-slate-200 px-4 py-2 text-xs font-medium"
                            >
                              {lang === 'default' ? t('original') : lang.toUpperCase()}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {availableLanguages.map((lang) => {
                          const langSegmentsData = getSegmentsDataForLanguage(lang);
                          const langSummaryData = getSummaryDataForLanguage(lang);
                          const langChapter = langSegmentsData?.segments.find(
                            ch => segment.id >= ch.startIndex && segment.id <= ch.endIndex
                          );
                          const langSegmentSummary = langSummaryData?.segmentSummaries?.find(
                            s => s.segmentId === langChapter?.id
                          );
                          
                          return (
                            <TabsContent key={lang} value={lang} className="p-4 m-0">
                              <div className="text-base font-semibold text-slate-200 mb-2">
                                {langChapter?.topic || chapter.topic}
                              </div>
                              <div className="text-sm text-slate-400 mb-3">
                                {langChapter?.timeStart || chapter.timeStart} - {langChapter?.timeEnd || chapter.timeEnd}
                              </div>
                              {langSegmentSummary && (
                                <div className="text-sm text-slate-300 leading-relaxed">
                                  {langSegmentSummary.summary}
                                </div>
                              )}
                              {!langSegmentSummary && (
                                <div className="text-sm text-slate-500 italic">
                                  {t('loadingSummary')}
                                </div>
                              )}
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
            <div className={`flex items-start justify-between gap-2 ${chapter ? 'pl-6' : ''}`}>
              <div className="flex-1 space-y-1">
                <div className="text-sm md:text-base select-text cursor-text text-slate-100">
                  {segment.text}
                </div>
                {showTranslation && translation && (
                  <div className="text-xs md:text-sm select-text cursor-text text-slate-400 italic">
                    {translation.text}
                  </div>
                )}
              </div>
              <div className="relative flex-shrink-0 flex items-center gap-1">
                {/* 播放按鈕 */}
                <button
                  className="p-1 rounded hover:bg-slate-700"
                  title={t("jumpToTime")}
                  onClick={() => onSegmentClick(segment.startTime)}
                  tabIndex={0}
                  type="button"
                >
                  <Play className="h-4 w-4 text-slate-400 hover:text-slate-100" />
                </button>
                {/* 複製按鈕 */}
                <button
                  className="p-1 rounded hover:bg-slate-700"
                  title={t("copy")}
                  onClick={async e => {
                    e.stopPropagation();
                    try {
                      const textToCopy = showTranslation && translation
                        ? `${segment.text}\n${translation.text}`
                        : segment.text;
                      await navigator.clipboard.writeText(textToCopy);
                      setCopiedSegmentId(segment.id);
                      setTimeout(() => setCopiedSegmentId(null), 2000);
                    } catch {
                      // 可選：處理複製失敗
                    }
                  }}
                  tabIndex={0}
                  type="button"
                >
                  {copiedSegmentId === segment.id ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400 hover:text-slate-100" />
                  )}
                </button>
                {copiedSegmentId === segment.id && (
                  <div className="absolute -top-7 right-0 bg-slate-700 text-slate-100 px-2 py-1 rounded text-xs whitespace-nowrap shadow z-10">
                    {t("copied")}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        })}
      </ScrollArea>
      </div>
    </div>
  );
}
