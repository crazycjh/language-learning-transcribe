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
    const workerApiUrl = `${workerUrl}/api/video/${videoId}/languages`;
    const resp = await fetch(workerApiUrl);
    
    if (!resp.ok) {
      return new Response("Languages not found", { status: 404 });
    }

    const data = await resp.json();
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Error fetching languages:', err);
    return new Response("Failed to fetch languages", { status: 500 });
  }
}
