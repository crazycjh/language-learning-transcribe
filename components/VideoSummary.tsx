'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { type SummaryData } from "@/lib/video-service";
import { useTranslations } from "next-intl";

interface VideoSummaryProps {
  summary: SummaryData | null | undefined;
}

export function VideoSummary({ summary }: VideoSummaryProps) {
  const t = useTranslations("videoPlayer");
  const [showSummary, setShowSummary] = useState(true);

  return (
    <div className="border border-slate-800 bg-slate-950/50 rounded-md overflow-hidden">
      <button
        onClick={() => setShowSummary(!showSummary)}
        className="w-full flex items-center justify-between px-2 py-1.5 md:p-3 hover:bg-slate-800/50 transition-colors"
      >
        <h3 className="text-xs md:text-lg font-semibold text-slate-200">{t("summary")}</h3>
        {showSummary ? (
          <ChevronUp className="w-3.5 h-3.5 md:w-5 md:h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 md:w-5 md:h-5 text-slate-400" />
        )}
      </button>
      {showSummary && (
        <div className="p-3 pt-0 md:p-4 md:pt-0 max-h-32 md:max-h-96 overflow-y-auto">
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
