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
    // 從 query parameter 取得語言參數
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang');

    // 建構新的 RESTful API URL
    const workerApiUrl = lang 
      ? `${workerUrl}/api/video/${videoId}/srt?lang=${lang}`
      : `${workerUrl}/api/video/${videoId}/srt`;

    console.log('Fetching SRT for videoId:', videoId, 'lang:', lang || 'default');
    console.log('Worker API URL:', workerApiUrl);

    const resp = await fetch(workerApiUrl);
    
    if (!resp.ok) {
      return new Response("SRT not found", { status: 404 });
    }

    // 檢查 worker 的快取狀態
    const cfCacheStatus = resp.headers.get('cf-cache-status');
    const xCacheStatus = resp.headers.get('x-cache-status');
    const cacheStatus = cfCacheStatus || xCacheStatus || 'UNKNOWN';

    console.log(`[SRT API] videoId: ${videoId}, lang: ${lang || 'default'}, cache: ${cacheStatus}`);

    // 從 worker response 讀取 cache-control，如果沒有則使用預設值
    const cacheControl = resp.headers.get('cache-control') || 'public, max-age=31536000';
    const srtContent = await resp.text();
    return new Response(srtContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': cacheControl,
        'X-Worker-Cache-Status': cacheStatus,
      },
    });
  } catch (err) {
    console.error('Error fetching SRT:', err);
    return new Response("Failed to fetch SRT", { status: 500 });
  }
}
