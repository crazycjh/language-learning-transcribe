export async function GET() {
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    return new Response("WORKER_URL not configured", { status: 500 });
  }

  try {
    console.log('Fetching video list from worker:', workerUrl);
    const resp = await fetch(`${workerUrl}/videolist`);
    console.log('url : ', `${workerUrl}/videolist`)

    if (!resp.ok) {
      return new Response("Failed to fetch video list", { status: resp.status });
    }

    // 直接轉發 worker 的 response，但過濾掉可能暴露 worker 資訊的 headers
    const headers = new Headers();
    const allowedHeaders = ['content-type', 'cache-control', 'etag', 'x-cache-status'];

    resp.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    return new Response(resp.body, {
      status: resp.status,
      headers,
    });
  } catch (err) {
    console.error('Error fetching video list:', err);
    return new Response("Failed to fetch video list", { status: 500 });
  }
}