"use client";

import { useState } from "react";
import { YoutubeTranscript } from "./YoutubeTranscript";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";

function YoutubeTranscriptClient() {
  const [transcript, setTranscript] = useState("");
  const [transcriptSRT, setTranscriptSRT] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [elapsedTime, setElapsedTime] = useState("00:00");

  const handleTranscriptUpdate = (text: string, srt: string) => {
    setTranscript(text);
    setTranscriptSRT(srt);
  };
  
  // 處理載入狀態變化
  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
    if (!loading) {
      setTranscriptProgress(100); // 結束時為100
    }
  };

  // 處理進度更新
  const handleProgressUpdate = (progress: number) => {
    setTranscriptProgress(progress);
  };

  // 處理音頻準備完成
  const handleAudioReady = (url: string) => {
    setAudioUrl(url);
  };

  // 更新時間
  const handleTimeUpdate = (time: string) => {
    setElapsedTime(time);
  };

  return (
    <div className="space-y-4">
      {/* 顯示處理狀態 */}
      {isLoading && (
        <div className="p-2 bg-slate-800 rounded text-slate-300 text-sm">
          正在處理中... {transcriptProgress !== null ? `${transcriptProgress}%` : ''} 
          {elapsedTime && ` (已耗時 ${elapsedTime})`}
        </div>
      )}
      
      <YoutubeTranscript 
        onTranscriptUpdate={handleTranscriptUpdate}
        onLoadingChange={handleLoadingChange}
        onTimeUpdate={handleTimeUpdate}
        onProgressUpdate={handleProgressUpdate}
        onAudioReady={handleAudioReady}
      />
      
      <TranscriptDisplay 
        transcript={transcript}
        transcriptSRT={transcriptSRT}
        transcriptProgress={transcriptProgress}
        audioUrl={audioUrl}
      />
    </div>
  );
}

export default YoutubeTranscriptClient;
