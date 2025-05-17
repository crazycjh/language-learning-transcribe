"use client";

import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download } from "lucide-react";

interface TranscriptDisplayProps {
  transcript: string;
  transcriptSRT: string;
  // isLoading: boolean;
  // elapsedTime: string;
  transcriptProgress?: number | null;
}

export function TranscriptDisplay({
  transcript,
  transcriptSRT,
  // isLoading,
  // elapsedTime,
  transcriptProgress = null,
}: TranscriptDisplayProps) {
  const textScrollRef = useRef<HTMLDivElement>(null);
  const srtScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (textScrollRef.current) {
        const viewport = textScrollRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    });
  }, [transcript]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (srtScrollRef.current) {
        const viewport = srtScrollRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    });
  }, [transcriptSRT]);

  //   if (isLoading) {
  //     return (
  //       <Card className="p-6 bg-slate-900 border-slate-800">
  //         <div className="flex flex-col items-center justify-center py-8">
  //           <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
  //           <p className="text-slate-300 text-center">
  //             處理中...<br/>
  //             <span className="text-sm text-slate-400">已耗時: {elapsedTime}</span>
  //           </p>
  //         </div>
  //       </Card>
  //     );
  //   }

  return (
    <Card className="p-6 bg-slate-900 border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <Label className="text-sm font-medium text-slate-300">逐字稿</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              const blob = new Blob([transcript], {
                type: "text/plain;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "transcript.txt";
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
              const blob = new Blob([transcriptSRT], {
                type: "text/plain;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "transcript.srt";
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
      <div>
        <div className="text-slate-400 text-sm mb-2">
          {`進度 ${transcriptProgress} %`}
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
            <ScrollArea
              className="h-[300px] w-full rounded-md border border-slate-800 bg-slate-950/50 p-4"
              ref={textScrollRef}
            >
              <div className="text-slate-200 whitespace-pre-wrap">
                {transcript}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="srt">
            <ScrollArea
              className="h-[300px] w-full rounded-md border border-slate-800 bg-slate-950/50 p-4"
              ref={srtScrollRef}
            >
              <div className="text-slate-200 whitespace-pre-wrap font-mono">
                {transcriptSRT}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
