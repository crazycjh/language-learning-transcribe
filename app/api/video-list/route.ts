export async function GET() {
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    return new Response("WORKER_URL not configured", { status: 500 });
  }

  try {
    const startTime = Date.now();
    console.log('🔍 [API] 開始 fetch videolist:', new Date().toISOString());

    // 使用新的 RESTful API
    const resp = await fetch(`${workerUrl}/api/videolist`, {
      cache: 'no-store'
    });

    const duration = Date.now() - startTime;
    console.log('🔍 [API] fetch 完成，耗時:', duration, 'ms');

    // 診斷：耗時判斷
    if (duration < 10) {
      console.log('⚠️  [API] 警告：耗時極短 (<10ms)，可能來自 Data Cache！');
    }

    if (!resp.ok) {
      return new Response("Failed to fetch video list", { status: resp.status });
    }

    // 讀取資料並記錄
    const data = await resp.json();
    console.log('🔍 [API] 影片數量:', data.videos?.length || 0);
    if (data.videos?.length > 0) {
      console.log('🔍 [API] 第一部影片:', data.videos[0].title);
    }

    // 直接轉發 worker 的 response，但過濾掉可能暴露 worker 資訊的 headers
    const headers = new Headers();
    const allowedHeaders = ['content-type', 'cache-control', 'etag', 'x-cache-status'];

    resp.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // 明確設定 no-cache headers
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // 加上診斷資訊
    headers.set('X-Fetch-Duration', duration.toString());
    headers.set('X-Fetch-Time', new Date().toISOString());

    return Response.json(data, {
      status: resp.status,
      headers,
    });
  } catch (err) {
    console.error('Error fetching video list:', err);
    return new Response("Failed to fetch video list", { status: 500 });
  }
}
