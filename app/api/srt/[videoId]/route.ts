import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = await params;
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    return new Response("WORKER_URL not configured", { status: 500 });
  }
  try {
    console.log('Fetching SRT for videoId:', videoId);
    console.log('Worker URL:', workerUrl);
    const resp = await fetch(`${workerUrl}/srt/${videoId}/default/${videoId}.srt`);
    if (!resp.ok) {
      return new Response("SRT not found", { status: 404 });
    }

    // 檢查 worker 的快取狀態
    const cfCacheStatus = resp.headers.get('cf-cache-status');
    const xCacheStatus = resp.headers.get('x-cache-status');
    const cacheStatus = cfCacheStatus || xCacheStatus || 'UNKNOWN';

    console.log(`[SRT API] videoId: ${videoId}, cache: ${cacheStatus}`);

    // 從 worker response 讀取 cache-control，如果沒有則使用預設值
    const cacheControl = resp.headers.get('cache-control') || 'public, max-age=31536000, immutable';

    const srtContent = await resp.text();
    return new Response(srtContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': cacheControl, // 轉發 worker 的快取設定
        'X-Worker-Cache-Status': cacheStatus, // 傳遞給前端
      },
    });
  } catch {
    return new Response("Failed to fetch SRT", { status: 500 });
  }
}
