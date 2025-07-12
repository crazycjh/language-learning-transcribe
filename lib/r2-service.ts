export async function getSRT(videoId: string): Promise<string> {
  try {
    const response = await fetch(`/api/srt/${videoId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch SRT: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching SRT from API:', error);
    throw error;
  }
}
