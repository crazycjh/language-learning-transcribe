"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Socket } from "socket.io-client";
import SocketManager from "@/lib/socketManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Youtube } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface YoutubeTranscriptProps {
  onTranscriptUpdate: (text: string, srt: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onTimeUpdate: (time: string) => void;
  onProgressUpdate?: (progress: number) => void;
  onAudioReady?: (audioUrl: string) => void;
}

export function YoutubeTranscript({
  onTranscriptUpdate,
  onLoadingChange,
  onTimeUpdate,
  onProgressUpdate,
  onAudioReady,
}: YoutubeTranscriptProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [transcriptProgress, setTranscriptProgress] = useState<number>(0);
  const jobIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const transcriptRef = useRef("");
  const transcriptSRTRef = useRef("");
  const handleDownloadAudio = () => {
    if (!audioData) return;

    try {
      // 從 base64 字串創建 Blob
      const byteCharacters = atob(audioData);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "audio/wav" });

      // 創建下載連結
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "audio.wav");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("下載音檔失敗:", err);
      setError("下載音檔失敗");
    }
  };

  // 初始化 socket 連接
  useEffect(() => {
    socketRef.current = SocketManager.getSocket();
    return () => {
      // 清理所有相關的事件監聽器
      if (jobIdRef.current) {
        console.log("移除訂閱 jobId : ", jobIdRef.current);
        socketRef.current?.emit("unsubscribe-job", jobIdRef.current);
      }
      SocketManager.removeAllListeners("subscribed");
      SocketManager.removeAllListeners("message");
    };
  }, []);

  // 更新計時器
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isLoading && startTime) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        onTimeUpdate(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, startTime, onTimeUpdate]);

  // 更新進度
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(transcriptProgress);
    }
  }, [transcriptProgress, onProgressUpdate]);

  const handleProcessYoutube = async () => {
    setStartTime(Date.now());
    setIsLoading(true);
    onLoadingChange(true);
    setError(null);
    transcriptRef.current = "";
    transcriptSRTRef.current = "";
    onTranscriptUpdate("", "");
    setProgress(0);
    setTranscriptProgress(0);

    try {
      // 發送 HTTP 請求獲取 jobId
      const res = await axios.post(
        `http://localhost:8001/api/transcribe-youtube`,
        {
          url: youtubeUrl,
        }
      );
      
      socketRef.current?.on("subscribed", (data) => {
        console.log(`已訂閱任務: ${data.jobId}`); // 用來確認是否有訂閱成功
      });

      socketRef.current?.on("unsubscribe-job",(data) => {
        console.log(`已取消訂閱任務: ${data.jobId}`); // 用來確認是否有訂閱成功
      });

      socketRef.current?.on("message", (data) => {
        const parsedData = JSON.parse(data);
        console.log("接收到的訊息:", parsedData.event);
        switch (parsedData.event) {
          case "transcription-progress":
            // 處理轉錄進度
            console.log("轉錄進度:", parsedData.data.progress.totalProgress);
            if (parsedData.data && parsedData.data.progress.totalProgress) {
              setTranscriptProgress(Number(parsedData.data.progress.totalProgress));
            }
            break;
          case "youtube-download-start":
            break;
          case "youtube-download-progress":
            break;
          case "youtube-download-complete":
            break;
          case "youtube-audio-ready":
            console.log("音訊檔案準備完成");
            setAudioData(parsedData.data.audioData);
            setProgress(100); // 音頻準備完成

            // 創建可播放的音頻URL
            if (onAudioReady && parsedData.data.audioData) {
              try {
                const byteCharacters = atob(parsedData.data.audioData);
                const byteArray = new Uint8Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteArray[i] = byteCharacters.charCodeAt(i);
                }
                const blob = new Blob([byteArray], { type: "audio/wav" });
                const url = window.URL.createObjectURL(blob);
                onAudioReady(url);
              } catch (err) {
                console.error("音頻URL創建失敗:", err);
              }
            }
            break;
          case "transcription-segment":
            const newSegment = parsedData.data.segment.text;
            const srtTimestamp = parsedData.data.segment.srtTimestamp;
            const srtIndex = parsedData.data.segment.index;

            const currentText = transcriptRef.current;
            const currentSRT = transcriptSRTRef.current;
            const updated =
              currentText +
              (currentText ? "\n\n" : "") +
              newSegment.trimStart();
            const updatedSRT =
              currentSRT +
              (currentSRT ? "\n\n" : "") +
              `${srtIndex}\n${srtTimestamp}\n${newSegment.trimStart()}`;

            transcriptRef.current = updated;
            transcriptSRTRef.current = updatedSRT;
            onTranscriptUpdate(updated, updatedSRT);
            break;
          case "transcription-complete":
            // 最後確保最終的轉錄結果被傳遞
            onTranscriptUpdate(transcriptRef.current, transcriptSRTRef.current);
            setTranscriptProgress(100);
            setIsLoading(false);
            onLoadingChange(false);
            break;
          case "error":
            throw new Error(parsedData.data.error || "處理過程中發生錯誤");
        }
      });

      const newJobId = res.data.jobId;
      jobIdRef.current = newJobId;
      console.log("上傳回應:", newJobId, res.data.status);
      socketRef.current?.emit("subscribe-job", newJobId);

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
          <Label
            htmlFor="youtubeUrl"
            className="text-sm font-medium text-slate-300"
          >
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
              className={`flex-grow bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-100 selection:bg-blue-500/50 ${
                !youtubeUrl ? "pl-9" : ""
              }`}
              value={youtubeUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setYoutubeUrl(e.target.value)
              }
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleProcessYoutube}
              disabled={isLoading || !youtubeUrl}
              variant="default"
              className={`bg-blue-600 hover:bg-blue-700 text-white ${
                isLoading ? "cursor-default" : "cursor-pointer"
              }`}
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
            {audioData && (
              <Button
                onClick={handleDownloadAudio}
                variant="secondary"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                下載音檔
              </Button>
            )}
          </div>
        </div>

        {/* Status and Progress */}
        <div className="space-y-2">
          {isLoading && !error && (
            <div className="flex items-center text-sm gap-2 text-slate-300">
              {progress < 100 && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>下載 YouTube 影片中...</span>
                </>
              )}
            </div>
          )}

          {/* 下載進度條 */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>{progress === 100 ? "下載完成" : "下載處理中"}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/50 border-red-900"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}
