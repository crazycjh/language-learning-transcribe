import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import YoutubeTranscriptClient from "./youtube-client";
import AudioFileTranscriptClient from "./audio-client";
// const YoutubeTranscriptClient = dynamic(() => import("./youtube-client"), {
//   loading: () => <div>載入 YouTube 轉錄功能中...</div>
// });

// const AudioFileTranscriptClient = dynamic(() => import("./audio-client"), {
//   loading: () => <div>載入音訊轉錄功能中...</div>
// });

export const metadata = {
  title: '影片和音訊轉錄 | 轉錄工具',
  description: '將 YouTube 影片或音訊檔案轉換成文字稿。支援中文和英文的語音轉錄，並提供 SRT 字幕檔格式。',
  openGraph: {
    title: '影片和音訊轉錄工具',
    description: '快速準確的影片和音訊轉錄服務，支援多種格式輸出。'
  }
};

export default function VideoDownloadTranscript() {


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 dark:bg-gray-800 dark:text-white">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">影片和音訊轉錄</h1>
        <noscript>
          <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg mb-4">
            注意：此功能需要啟用 JavaScript 才能使用完整功能。
          </div>
        </noscript>
        <Suspense fallback={<div>載入中...</div>}>
          <Tabs defaultValue="youtube" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="youtube">Youtube 轉錄</TabsTrigger>
              <TabsTrigger value="audio">音訊檔案轉錄</TabsTrigger>
            </TabsList>
            <TabsContent value="youtube">
              <YoutubeTranscriptClient />
            </TabsContent>
            <TabsContent value="audio">
              <AudioFileTranscriptClient />
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </main>
  );
}
