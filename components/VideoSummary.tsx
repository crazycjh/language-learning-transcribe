'use client';

import { FileText } from "lucide-react";
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
}

export function VideoSummary({ 
  summary, 
  availableLanguages,
  selectedLanguage,
  onLanguageChange
}: VideoSummaryProps) {
  const t = useTranslations("videoPlayer");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1 md:gap-2 px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded transition-colors text-sm md:text-base">
          <FileText className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden md:inline">{t("summary")}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-slate-800 border-slate-700 gap-0">
        <SheetHeader className="space-y-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-slate-100">{t("summary")}</SheetTitle>
            
            {/* 語言選擇器 */}
            {availableLanguages.length > 0 && (
              <Select value={selectedLanguage} onValueChange={onLanguageChange}>
                <SelectTrigger className="w-auto h-7 text-xs md:text-sm border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-300 px-2">
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
        </SheetHeader>
        
        <div className="mt-1 p-4 m-3 pb-8 bg-slate-900 rounded-lg text-slate-100 text-sm md:text-base leading-relaxed max-h-[60vh] overflow-y-auto">
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
