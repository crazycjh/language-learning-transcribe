// 'use client'; // 不需要 client directive，純嵌入

import React from "react";

interface SimpleYouTubeEmbedProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * 一個極簡的 YouTube 嵌入組件，使用固定的 YouTube 影片 ID。
 * 預設尺寸為 100% 寬度、315px 高度，可自訂。
 */
const YOUTUBE_ID = "dQw4w9WgXcQ"; // 可自行更換

export function SimpleYouTubeEmbed({
  width = "100%",
  height = 315,
}: SimpleYouTubeEmbedProps) {
  return (
    <div className="flex justify-center " style={{ width: typeof width === "number" ? `${width}px` : width }}>
      <iframe
        width="500px"
        height={height}
        src={`https://www.youtube.com/embed/${YOUTUBE_ID}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ display: "block" }}
      ></iframe>
    </div>
  );
}

export default SimpleYouTubeEmbed;
