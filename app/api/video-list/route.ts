export async function GET() {
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    return new Response("WORKER_URL not configured", { status: 500 });
  }

  try {
    console.log('Fetching video list from worker:', workerUrl);
    const resp = await fetch(`${workerUrl}/videolist`);
    
    if (!resp.ok) {
      return new Response("Failed to fetch video list", { status: 500 });
    }
    
    const videoList = await resp.json();
    
    return new Response(JSON.stringify(videoList), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('Error fetching video list:', err);
    return new Response("Failed to fetch video list", { status: 500 });
  }
}