"use client";

import { useState } from "react";
import { YoutubeTranscript } from "./YoutubeTranscript";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";

function YoutubeTranscriptClient() {
  const [transcript, setTranscript] = useState("");
  const [transcriptSRT, setTranscriptSRT] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00");

  const handleTranscriptUpdate = (text: string, srt: string) => {
    setTranscript(text);
    setTranscriptSRT(srt);
  };

  return (
    <div className="space-y-4">
      <YoutubeTranscript 
        onTranscriptUpdate={handleTranscriptUpdate}
        onLoadingChange={setIsLoading}
        onTimeUpdate={setElapsedTime}
      />
      
      <TranscriptDisplay 
        transcript={transcript}
        transcriptSRT={transcriptSRT}
        isLoading={isLoading}
        elapsedTime={elapsedTime}
      />
    </div>
  );
}

export default YoutubeTranscriptClient;
