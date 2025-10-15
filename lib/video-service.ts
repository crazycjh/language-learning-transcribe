import { VideoList } from './types';

export async function getVideoList(): Promise<VideoList> {
  try {
    const response = await fetch('/api/video-list', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch video list: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching video list:', error);
    throw error;
  }
}

export async function getSrtContent(videoId: string): Promise<string> {
  try {
    const response = await fetch(`/api/srt/${videoId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch SRT: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching SRT:', error);
    throw error;
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M 次觀看`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K 次觀看`;
  }
  return `${count} 次觀看`;
}