"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Youtube } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface YoutubeTranscriptProps {
  onTranscriptUpdate: (text: string, srt: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onTimeUpdate: (time: string) => void;
}

export function YoutubeTranscript({
  onTranscriptUpdate,
  onLoadingChange,
  onTimeUpdate
}: YoutubeTranscriptProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 更新計時器
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isLoading && startTime) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        onTimeUpdate(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, startTime, onTimeUpdate]);

  const handleProcessYoutube = async () => {
    setStartTime(Date.now());
    setIsLoading(true);
    onLoadingChange(true);
    setError(null);
    setDownloadProgress(0);
    setConversionProgress(0);
    setTranscriptionProgress(0);
    onTranscriptUpdate("", "");

    try {
      const eventSource = new EventSource(`http://localhost:8000/youtube/sse?link=${encodeURIComponent(youtubeUrl)}`);

      eventSource.addEventListener("download", (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('下載進度:', data.progress);
        setDownloadProgress(data.progress);
      });

      eventSource.addEventListener("conversion", (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setConversionProgress(data.progress);
      });

      eventSource.addEventListener("transcription", (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('逐字稿內容:', data.text);
        setTranscriptionProgress(data.progress);
        onTranscriptUpdate(data.text, data.srt || "");
      });

      eventSource.addEventListener("error", () => {
        setError("處理過程中發生錯誤");
        setIsLoading(false);
        onLoadingChange(false);
        eventSource.close();
      });

      eventSource.addEventListener("complete", () => {
        setIsLoading(false);
        onLoadingChange(false);
        eventSource.close();
      });

    } catch (err: unknown) {
      console.error("處理 YouTube 影片失敗:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("發生未知錯誤");
      }
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="youtubeUrl" className="text-sm font-medium text-slate-300">
            影片網址:
          </Label>
        </div>
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            {!youtubeUrl && (
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            )}
            <Input
              type="text"
              id="youtubeUrl"
              placeholder="請輸入 YouTube 影片網址"
              className={`flex-grow bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 ${!youtubeUrl ? 'pl-9' : ''}`}
              value={youtubeUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYoutubeUrl(e.target.value)}
            />
          </div>
          <Button
            onClick={handleProcessYoutube}
            disabled={isLoading || !youtubeUrl}
            variant="default"
            className={`bg-blue-600 hover:bg-blue-700 text-white ${isLoading ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                處理中...
              </span>
            ) : "開始處理"}
          </Button>
        </div>

        {/* Status and Progress */}
        <div className="space-y-4 mt-4">
          {downloadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>{downloadProgress === 100 ? '下載完成' : '下載中'}</span>
                <span>{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}

          {conversionProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>{conversionProgress === 100 ? '音檔轉換完成' : '轉換音檔格式中'}</span>
                <span>{conversionProgress}%</span>
              </div>
              <Progress value={conversionProgress} className="h-2" />
            </div>
          )}

          {transcriptionProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>{transcriptionProgress === 100 ? '逐字稿生成完成' : '生成逐字稿中'}</span>
                <span>{transcriptionProgress}%</span>
              </div>
              <Progress value={transcriptionProgress} className="h-2" />
            </div>
          )}

          {isLoading && !error && downloadProgress === 0 && conversionProgress === 0 && transcriptionProgress === 0 && (
            <div className="flex items-center gap-2 text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>準備開始處理...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-900">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}
