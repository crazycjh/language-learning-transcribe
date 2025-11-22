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

export async function getSrtContent(videoId: string, lang?: string): Promise<string> {
  try {
    const url = lang ? `/api/srt/${videoId}?lang=${lang}` : `/api/srt/${videoId}`;
    const response = await fetch(url, {
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

export async function getAvailableLanguages(videoId: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/video/${videoId}/languages`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.status}`);
    }
    const data = await response.json();
    return data.languages || [];
  } catch (error) {
    console.error('Error fetching languages:', error);
    return ['default'];
  }
}

export interface SummaryData {
  videoId: string;
  language: string;
  overallSummary: string;
  segmentSummaries: Array<{
    segmentId: string;
    topic: string;
    summary: string;
  }>;
  metadata: {
    aiService: string;
    processingTime: number;
    createdAt: string;
    translatedFrom?: string;
  };
}

export interface SegmentsData {
  videoId: string;
  language: string;
  segments: Array<{
    id: string;
    topic: string;
    startIndex: number;
    endIndex: number;
    timeStart: string;
    timeEnd: string;
  }>;
  metadata: {
    totalSegments: number;
    totalEntries: number;
    averageSegmentLength: number;
    createdAt: string;
    translatedFrom?: string;
  };
}

export async function getSummary(videoId: string, lang?: string): Promise<SummaryData | null> {
  try {
    const url = lang 
      ? `/api/video/${videoId}/summary?lang=${lang}` 
      : `/api/video/${videoId}/summary`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching summary:', error);
    return null;
  }
}

export async function getSegments(videoId: string, lang?: string): Promise<SegmentsData | null> {
  try {
    const url = lang 
      ? `/api/video/${videoId}/segments?lang=${lang}` 
      : `/api/video/${videoId}/segments`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching segments:', error);
    return null;
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
