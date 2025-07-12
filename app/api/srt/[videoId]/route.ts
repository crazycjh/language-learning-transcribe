import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params;
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    return new Response("WORKER_URL not configured", { status: 500 });
  }
// https://r2-deepsrt.chchen-zee.workers.dev/srt/4voKeMm3u1Y/default/4voKeMm3u1Y.srt
  try {
    console.log('Fetching SRT for videoId:', videoId);
    console.log('Worker URL:', workerUrl);
    const resp = await fetch(`${workerUrl}/srt/${videoId}/default/${videoId}.srt`);
    if (!resp.ok) {
      return new Response("SRT not found", { status: 404 });
    }
    const srtContent = await resp.text();
    return new Response(srtContent, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    return new Response("Failed to fetch SRT", { status: 500 });
  }
}
