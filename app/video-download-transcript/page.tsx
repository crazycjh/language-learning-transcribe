import YoutubeTranscript from "@/app/video-download-transcript/YoutubeTranscript";
export default function videoDownloadTranscript() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 dark:bg-gray-800 dark:text-white">
      <YoutubeTranscript />
    </main>
  );
}