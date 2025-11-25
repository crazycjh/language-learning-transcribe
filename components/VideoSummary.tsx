'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type SummaryData } from "@/lib/video-service";
import { useTranslations } from "next-intl";
import { getLanguageDisplayName } from "@/lib/utils";

interface VideoSummaryProps {
  summary: SummaryData | null | undefined;
  availableLanguages: string[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function VideoSummary({ 
  summary, 
  availableLanguages,
  selectedLanguage,
  onLanguageChange
}: VideoSummaryProps) {
  const t = useTranslations("videoPlayer");
  const [showSummary, setShowSummary] = useState(true);

  return (
    <div className="border border-slate-800 bg-slate-950/50 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 md:p-3 border-b border-slate-800">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity"
        >
          <h3 className="text-xs md:text-lg font-semibold text-slate-200">{t("summary")}</h3>
          {showSummary ? (
            <ChevronUp className="w-3 h-3 md:w-5 md:h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 md:w-5 md:h-5 text-slate-400" />
          )}
        </button>
        
        {/* 語言選擇器 */}
        {availableLanguages.length > 0 && (
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-auto h-5 md:h-8 text-[10px] md:text-sm border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 md:px-3 py-0 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {availableLanguages.map((lang) => (
                <SelectItem 
                  key={lang} 
                  value={lang} 
                  className="text-xs md:text-sm text-slate-300 focus:bg-slate-700 focus:text-slate-100"
                >
                  {getLanguageDisplayName(lang, t('original'))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {showSummary && (
        <div className="p-3 md:p-4 max-h-32 md:max-h-96 overflow-y-auto">
          {summary ? (
            /* 整體摘要 */
            <div className="text-slate-300 text-xs md:text-sm leading-relaxed">
              {summary.overallSummary}
            </div>
          ) : (
            /* 載入中狀態 */
            <div className="text-slate-400 text-xs md:text-sm italic">
              {t("loadingSummary")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
