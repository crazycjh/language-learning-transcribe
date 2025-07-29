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
    console.log('Fetching thumbnail for videoId:', videoId);
    const imageResponse = await fetch(`${workerUrl}/metadata/${videoId}/thumbnail.webp`);
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch thumbnail:', imageResponse.status);
      return new Response("Thumbnail not found", { status: 404 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Error fetching thumbnail:', err);
    return new Response("Failed to fetch thumbnail", { status: 500 });
  }
}