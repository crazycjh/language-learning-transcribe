"use client";

import { useState } from "react";
import { AudioFileTranscript } from "./AudioFileTranscript";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";

function AudioFileTranscriptClient() {
  const [transcript, setTranscript] = useState("");
  const [transcriptSRT, setTranscriptSRT] = useState("");
  const [transcriptProgress, setTranscriptProgress] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00");

  const handleTranscriptUpdate = (text: string, srt: string) => {
    setTranscript(text);
    setTranscriptSRT(srt);
  };

  const handleTranscriptProgress = (progress: number) => {
    // Handle progress update if needed
    setTranscriptProgress(progress)
  };

  return (
    <div className="space-y-4">
      <AudioFileTranscript 
        onTranscriptUpdate={handleTranscriptUpdate}
        onLoadingChange={setIsLoading}
        onTranscriptProgress={handleTranscriptProgress}
        onTimeUpdate={setElapsedTime}
      />
      
      <TranscriptDisplay 
        transcript={transcript}
        transcriptSRT={transcriptSRT}
        transcriptProgress={transcriptProgress}
        // isLoading={isLoading}
        // elapsedTime={elapsedTime}
      />
    </div>
  );
}

export default AudioFileTranscriptClient;
