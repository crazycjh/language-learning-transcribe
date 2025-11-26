import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const workerUrl = process.env.WORKER_URL;
  
  if (!workerUrl) {
    return new Response("WORKER_URL not configured", { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang');

    const workerApiUrl = lang 
      ? `${workerUrl}/api/video/${videoId}/segments?lang=${lang}`
      : `${workerUrl}/api/video/${videoId}/segments`;

    console.log('Fetching segments for videoId:', videoId, 'lang:', lang || 'default');

    const resp = await fetch(workerApiUrl);
    
    if (!resp.ok) {
      return new Response("Segments not found", { status: 404 });
    }

    const data = await resp.json();
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('Error fetching segments:', err);
    return new Response("Failed to fetch segments", { status: 500 });
  }
}
