"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload } from "lucide-react";
import { Socket } from "socket.io-client";
import SocketManager from "@/lib/socketManager";

interface AudioFileTranscriptProps {
  onTranscriptUpdate: (text: string, srt: string, audioFile?: File) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onTimeUpdate: (time: string) => void;
  onTranscriptProgress: (progress: number) => void;
}

interface TranscribeResponse {
  /** 任務 ID */
  jobId: string;
  /** 任務狀態 */
  status: "processing";
  /** 錯誤訊息（如果有） */
  error?: string;
}

export function AudioFileTranscript({
  onTranscriptUpdate,
  onLoadingChange,
  onTimeUpdate,
  onTranscriptProgress,
}: AudioFileTranscriptProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const transcriptRef = useRef("");
  const transcriptSRTRef = useRef("");

  // 初始化 socket 連接
  React.useEffect(() => {
    socketRef.current = SocketManager.getSocket();
    console.log("socketRef.current audio : ", socketRef.current);
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
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isLoading && startTime) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
        onTimeUpdate(timeString);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, startTime, onTimeUpdate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "audio/wav") {
        setError("請上傳 WAV 格式的音訊檔案");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setStartTime(Date.now());
    setIsLoading(true);
    setError(null);
    setProgress(0);
    transcriptRef.current = ""; // 重置轉錄內容
    transcriptSRTRef.current = "";
    onLoadingChange(true);

    const formData = new FormData();
    formData.append("audio", file);

    try {
      // const eventSource = new EventSource(`http://localhost:8000/audio/sse?filename=${encodeURIComponent(file.name)}`);

      // eventSource.addEventListener("transcription", (event: MessageEvent) => {
      //   const data = JSON.parse(event.data);
      //   setProgress(data.progress);
      //   if (data.text) {
      //     onTranscriptUpdate(data.text, data.srt || "");
      //   }
      // });

      // eventSource.addEventListener("error", () => {
      //   setError("處理音訊檔案時發生錯誤");
      //   setIsLoading(false);
      //   onLoadingChange(false);
      //   eventSource.close();
      // });

      // eventSource.addEventListener("complete", () => {
      //   setIsLoading(false);
      //   onLoadingChange(false);
      //   eventSource.close();
      // });

      // 上傳檔案
      const res = await axios.post<TranscribeResponse>(
        "http://localhost:8001/api/transcribe",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("socket ==== ", socketRef.current);
      socketRef.current?.on("subscribed", (data) => {
        // 監聽 'subscribed' 事件
        console.log(`已訂閱任務: ${data.jobId}`);
      });

      socketRef.current?.on("unsubscribe-job",(data) => {
        console.log(`已取消訂閱任務: ${data.jobId}`); // 用來確認是否有訂閱成功
      });

      socketRef.current?.on("message", (data) => {
        if (JSON.parse(data).event === "transcription-segment") {
          const newSegment = JSON.parse(data).data.segment.text;
          const srtTimestamp = JSON.parse(data).data.segment.srtTimestamp;
          const srtIndex = JSON.parse(data).data.segment.index;

          const currentText = transcriptRef.current;
          const currentSRT = transcriptSRTRef.current;
          const updated =
            currentText + (currentText ? "\n\n" : "") + newSegment.trimStart();
          const updatedSRT =
            currentSRT +
            (currentSRT ? "\n\n" : "") +
            `${srtIndex}\n${srtTimestamp}\n${newSegment.trimStart()}`;
          transcriptRef.current = updated;
          transcriptSRTRef.current = updatedSRT;
          onTranscriptUpdate(updated, updatedSRT, file);
        } else if (JSON.parse(data).event === "transcription-progress") {
          // console.log("轉錄進度:", Number(JSON.parse(data).data.progress));
          onTranscriptProgress(Number(JSON.parse(data).data.progress));
        } else if (JSON.parse(data).event === "transcription-complete") {
          // 轉錄完成時再次傳遞檔案以確保音頻播放器可用
          onTranscriptUpdate(transcriptRef.current, transcriptSRTRef.current, file);
          setIsLoading(false);
        }
      });
      const newJobId = res.data.jobId;
      jobIdRef.current = newJobId;
      console.log("上傳回應:", newJobId, res.data.status);
      socketRef.current?.emit("subscribe-job", newJobId);
      // 處理回應

      console.log("上傳回應:", res.data.jobId, res.data.status);
      setIsLoading(true);
      // onTranscriptUpdate("測試123", "測試123.srt");
      onLoadingChange(false);
      // if (data.status === 'complete' && data.text) {
      //   onTranscriptUpdate(data.text, data.srt || "");
      //   setProgress(100);
      //   setIsLoading(false);
      //   onLoadingChange(false);
      // } else if (data.status === 'error') {
      //   throw new Error(data.error || "處理失敗");
      // }
    } catch (err) {
      console.error("處理音訊檔案失敗:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
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
            htmlFor="audioFile"
            className="text-sm font-medium text-slate-300"
          >
            音訊檔案:
          </Label>
        </div>
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <Input
              ref={fileInputRef}
              type="file"
              id="audioFile"
              accept=".wav"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="flex-grow bg-slate-800 border-slate-700 text-slate-100 file:text-slate-400 hover:bg-slate-500"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !file}
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
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                開始處理
              </span>
            )}
          </Button>
        </div>

        {/* Status and Progress */}
        <div className="space-y-4 mt-4">
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>{progress === 100 ? "轉錄完成" : "轉錄處理中"}</span>
                <span>{progress}%</span>
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
