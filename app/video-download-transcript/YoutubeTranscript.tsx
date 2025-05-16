"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, Youtube } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function YoutubeTranscript() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [transcriptSRT, setTranscriptSRT] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");

  // 更新計時器
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isLoading && startTime) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000); // 轉換為秒
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setElapsedTime(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else if (!startTime) {
      setElapsedTime("00:00");
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, startTime]);

  const handleProcessYoutube = async () => {
    // 首先清除現有的逐字稿
    setTranscript("");
    setTranscriptSRT("");
    
    setStartTime(Date.now());
    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);
    setConversionProgress(0);
    setTranscriptionProgress(0);

    try {
      // const eventSource = new EventSource(`/api/encode?url=${youtubeUrl}`);
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
        setTranscript(data.text);
        setTranscriptSRT(data.srt);
      });

      eventSource.addEventListener("error", () => {
        setError("處理過程中發生錯誤");
        setIsLoading(false);
        eventSource.close();
      });

      eventSource.addEventListener("complete", () => {
        setIsLoading(false);
        eventSource.close();
      });
    // Change type to unknown and add type check
    } catch (err: unknown) {
      console.error("處理 YouTube 影片失敗:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("發生未知錯誤");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <Card className="p-6 bg-slate-900 border-slate-800">
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor="youtubeUrl" className="text-sm font-medium text-slate-300">
          影片網址:
        </Label>
        {(isLoading || startTime) && (
          <span className="text-sm font-medium text-slate-300">
            總處理時間: {elapsedTime}
          </span>
        )}
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
          disabled={isLoading || !youtubeUrl} // Disable button when loading or URL is empty
          variant="default"
          className={`bg-blue-600 hover:bg-blue-700 text-white ${isLoading ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              處理中...
            </span>
          ) : (
            "開始處理"
          )}
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

      {/* Transcript Output */}
      {isLoading ? (
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-300 text-center">
              處理 YouTube 影片中...<br/>
              <span className="text-sm text-slate-400">已耗時: {elapsedTime}</span>
            </p>
          </div>
        </Card>
      ) : (transcript || transcriptSRT) ? (
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <Label className="text-sm font-medium text-slate-300">
              逐字稿
            </Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'transcript.txt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                TXT
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  const blob = new Blob([transcriptSRT], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'transcript.srt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                SRT
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-800">
              <TabsTrigger 
                value="text"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400"
              >
                純文字
              </TabsTrigger>
              <TabsTrigger 
                value="srt"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400"
              >
                SRT 格式
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <ScrollArea className="h-[300px] w-full rounded-md border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-slate-200 whitespace-pre-wrap">
                  {transcript}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="srt">
              <ScrollArea className="h-[300px] w-full rounded-md border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-slate-200 whitespace-pre-wrap font-mono">
                  {transcriptSRT}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex flex-col items-center justify-center py-8">
            <Youtube className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400 text-center text-sm">
              請輸入 YouTube 影片網址並點擊開始處理<br/>
              系統會自動生成影片的逐字稿<br/>
              <span className="text-slate-500 text-xs">
                支援純文字及 SRT 字幕格式輸出
              </span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default YoutubeTranscript;
