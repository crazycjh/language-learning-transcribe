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
      ? `${workerUrl}/api/video/${videoId}/summary?lang=${lang}`
      : `${workerUrl}/api/video/${videoId}/summary`;

    console.log('Fetching summary for videoId:', videoId, 'lang:', lang || 'default');

    const resp = await fetch(workerApiUrl);
    
    if (!resp.ok) {
      return new Response("Summary not found", { status: 404 });
    }

    const data = await resp.json();
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    return new Response("Failed to fetch summary", { status: 500 });
  }
}
