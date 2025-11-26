// 支援的圖片格式及其 MIME 類型
const IMAGE_FORMATS = [
  { ext: 'webp', mimeType: 'image/webp' },
  { ext: 'jpg', mimeType: 'image/jpeg' },
  { ext: 'jpeg', mimeType: 'image/jpeg' },
  { ext: 'png', mimeType: 'image/png' },
] as const;

// 根據副檔名獲取 MIME 類型
function getMimeType(ext: string): string {
  const format = IMAGE_FORMATS.find(f => f.ext === ext.toLowerCase());
  return format?.mimeType || 'application/octet-stream';
}

export async function GET(
  req: Request,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = await params;
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    return new Response("WORKER_URL not configured", { status: 500 });
  }

  // 從 query parameter 取得指定的副檔名
  const url = new URL(req.url);
  const specifiedExt = url.searchParams.get('ext');
  
  // 使用新的 RESTful API
  try {
    const imageResponse = await fetch(`${workerUrl}/api/video/${videoId}/thumbnail`);

    // 檢查回應是否為有效圖片
    const contentType = imageResponse.headers.get('content-type');
    if (imageResponse.ok && contentType?.startsWith('image/')) {
      const imageBuffer = await imageResponse.arrayBuffer();

      // 檢查 worker 的快取狀態
      const cfCacheStatus = imageResponse.headers.get('cf-cache-status');
      const xCacheStatus = imageResponse.headers.get('x-cache-status');
      const cacheStatus = cfCacheStatus || xCacheStatus || 'UNKNOWN';

      console.log(`[Thumbnail API] videoId: ${videoId}, cache: ${cacheStatus}`);

      // 從 worker response 讀取 headers，如果有就用它
      const cacheControl = imageResponse.headers.get('cache-control') || 'public, max-age=31536000, immutable';

      // 使用 worker 回傳的 content-type，或根據指定的副檔名決定
      const finalContentType = contentType || (specifiedExt ? getMimeType(specifiedExt) : 'image/webp');

      return new Response(imageBuffer, {
        headers: {
          'Content-Type': finalContentType,
          'Cache-Control': cacheControl,
          'Access-Control-Allow-Origin': '*',
          'X-Worker-Cache-Status': cacheStatus,
        },
      });
    }
  } catch (err) {
    console.error(`Error fetching thumbnail:`, err);
  }

  // Fallback: 嘗試多種圖片格式
  // for (const format of IMAGE_FORMATS) {
  //   try {
  //     console.log(`Trying thumbnail format: ${format.ext} for videoId:`, videoId);
  //     const imageResponse = await fetch(`${workerUrl}/metadata/${videoId}/thumbnail.${format.ext}`);

  //     if (imageResponse.ok) {
  //       const imageBuffer = await imageResponse.arrayBuffer();
  //       return new Response("Thumbnail not found", { status: 404 });
  //       return new Response(imageBuffer, {
  //         headers: {
  //           'Content-Type': format.mimeType,
  //           'Cache-Control': 'public, max-age=31536000, immutable',
  //           'Access-Control-Allow-Origin': '*',
  //         },
  //       });
  //     }
  //   } catch (err) {
  //     console.error(`Error fetching ${format.ext} thumbnail:`, err);
  //     // 繼續嘗試下一個格式
  //   }
  // }

  // 所有格式都失敗，返回 404（讓前端處理 fallback）
  return new Response("Thumbnail not found", { status: 404 });
}