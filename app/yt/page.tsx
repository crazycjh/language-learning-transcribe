import React from 'react';
import SimpleYouTubeEmbed from '@/components/SimpleYouTubeEmbed';

export default function YTPage() { 
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">YouTube 頁面</h1>
      <p className="text-gray-300">這是 YouTube 頁面的內容。</p>
        <SimpleYouTubeEmbed />
    </div>
  );
}