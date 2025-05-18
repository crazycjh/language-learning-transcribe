"use client";

import { useState } from "react";
import { AudioFileTranscript } from "./AudioFileTranscript";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";

function AudioFileTranscriptClient() {
  const [transcript, setTranscript] = useState("");
  const [transcriptSRT, setTranscriptSRT] = useState("");
  const [transcriptProgress, setTranscriptProgress] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<string | undefined>(undefined);

  const handleTranscriptUpdate = (text: string, srt: string, audioFile?: File) => {
    setTranscript(text);
    setTranscriptSRT(srt);
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioBlob(url);
    }
  };

  const handleTranscriptProgress = (progress: number) => {
    // Handle progress update if needed
    setTranscriptProgress(progress)
  };

  return (
    <div className="space-y-4">
      <AudioFileTranscript 
        onTranscriptUpdate={handleTranscriptUpdate}
        onLoadingChange={() => {}}
        onTranscriptProgress={handleTranscriptProgress}
        onTimeUpdate={() => {}}
      />
      
      <TranscriptDisplay 
        transcript={transcript}
        transcriptSRT={transcriptSRT}
        transcriptProgress={transcriptProgress}
        audioUrl={audioBlob}
      />
    </div>
  );
}

export default AudioFileTranscriptClient;
