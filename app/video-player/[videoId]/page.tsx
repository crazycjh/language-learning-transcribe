
import VideoPlayerClient from './VideoPlayerClient';
import React from "react";

export default function VideoPlayerPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = React.use(params);
  return <VideoPlayerClient videoId={videoId} />;
}