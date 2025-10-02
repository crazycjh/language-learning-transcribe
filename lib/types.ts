export interface VideoListEntry {
  /** 視頻 ID */
  videoId: string;
  /** 視頻標題 */
  title: string;
  /** 視頻描述 */
  description?: string;
  /** 視頻時長（秒） */
  duration: number;
  /** 上傳者 */
  uploader?: string;
  /** 觀看次數 */
  view_count?: number;
  /** 縮圖 URL */
  thumbnail?: string;
}

/** 完整的 VideoList 結構 */
export interface VideoList {
  /** 視頻清單 */
  videos: VideoListEntry[];
  /** 最後更新時間 */
  updated_at: string;
  /** 總數量 */
  total_count: number;
}