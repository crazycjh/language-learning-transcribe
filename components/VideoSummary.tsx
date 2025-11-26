'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { type SummaryData } from "@/lib/video-service";
import { useTranslations } from "next-intl";
import { getLanguageDisplayName } from "@/lib/utils";

interface VideoSummaryProps {
  summary: SummaryData | null | undefined;
  availableLanguages: string[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  buttonOnly?: boolean; // 只顯示按鈕（用於控制區域）
}

export function VideoSummary({ 
  summary, 
  availableLanguages,
  selectedLanguage,
  onLanguageChange,
  buttonOnly = false
}: VideoSummaryProps) {
  const t = useTranslations("videoPlayer");
  const [showSummary, setShowSummary] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const summaryContent = summary ? (
    <div className="text-slate-300 text-xs md:text-sm leading-relaxed">
      {summary.overallSummary}
    </div>
  ) : (
    <div className="text-slate-400 text-xs md:text-sm italic">
      {t("loadingSummary")}
    </div>
  );

  // 如果只需要按鈕，只返回 Sheet 按鈕
  if (buttonOnly) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button className="md:hidden flex items-center justify-center px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded transition-colors text-sm">
            <FileText className="w-3 h-3" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-slate-800 border-slate-700 gap-0">
          <SheetHeader className="space-y-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-slate-100">{t("summary")}</SheetTitle>
              
              {/* 語言選擇器 */}
              {availableLanguages.length > 0 && (
                <Select value={selectedLanguage} onValueChange={onLanguageChange}>
                  <SelectTrigger className="w-auto h-7 text-xs border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-300 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {availableLanguages.map((lang) => (
                      <SelectItem 
                        key={lang} 
                        value={lang} 
                        className="text-xs text-slate-300 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {getLanguageDisplayName(lang, t('original'))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </SheetHeader>
          
          <div className="mt-1 p-4 m-3 pb-8 bg-slate-900 rounded-lg text-slate-100 text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
            {summary ? (
              summary.overallSummary
            ) : (
              <span className="text-slate-400 italic">
                {t("loadingSummary")}
              </span>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // 完整版本：桌面版折疊區塊
  return (
    <div className="hidden md:block border border-slate-800 bg-slate-950/50 rounded-md overflow-hidden">
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
          {summaryContent}
        </div>
      )}
    </div>
  );
}
