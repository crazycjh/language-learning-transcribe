'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface YouTubePlayerInterface {
  destroy: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  width?: number;
  height?: number;
  onPlayerReady?: (player: YouTubePlayerInterface) => void;
}

export function YouTubePlayer({
  videoId,
  onTimeUpdate,
  width = 640,
  height = 360,
  onPlayerReady
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  
  // 記錄上一次的屬性值，避免不必要的重新渲染
  const prevPropsRef = useRef({
    videoId,
    width,
    height
  });

  // 清理資源的函數
  const cleanupResources = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 創建播放器接口
  const createPlayerInterface = useCallback((): YouTubePlayerInterface => {
    return {
      destroy: () => {
        cleanupResources();
        iframeRef.current = null;
      },
      getCurrentTime: () => currentTimeRef.current,
      seekTo: (seconds: number) => {
        currentTimeRef.current = seconds;
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [seconds, true]
              }),
              '*'
            );
          } catch {
            console.log('無法控制iframe播放器時間');
          }
        }
      }
    };
  }, [cleanupResources]);

  // 處理來自YouTube iframe的消息
  const handleMessage = useCallback((event: MessageEvent) => {
    if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.event === 'infoDelivery' && data.info && data.info.currentTime) {
        currentTimeRef.current = data.info.currentTime;
      }
    } catch {
      // 忽略解析錯誤
    }
  }, []);

  // 主要的效果：創建和管理iframe
  useEffect(() => {
    // 僅客戶端執行
    if (typeof window === 'undefined' || !containerRef.current) return;
    
    // 檢查是否需要重新創建播放器
    const prevProps = prevPropsRef.current;
    const needsRecreate = videoId !== prevProps.videoId || 
                          width !== prevProps.width || 
                          height !== prevProps.height ||
                          !iframeRef.current;
    
    // 更新參考值
    prevPropsRef.current = { videoId, width, height };
    
    // 如果不需要重新創建，則退出
    if (!needsRecreate) return;
    
    // 清理現有資源
    cleanupResources();
    
    // 清除容器內容
    containerRef.current.innerHTML = '';
    
    // 創建新的iframe元素
    const iframe = document.createElement('iframe');
    iframe.width = `${width}px`;
    iframe.height = `${height}px`;
    iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&controls=1&rel=0&modestbranding=1`;
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    
    // 添加到DOM
    containerRef.current.appendChild(iframe);
    iframeRef.current = iframe;
    
    // 添加消息事件監聽
    window.addEventListener('message', handleMessage);
    
    
    // 通知播放器準備就緒
    const playerInterface = createPlayerInterface();
    iframe.onload = () => {
      if (onPlayerReady) {
        onPlayerReady(playerInterface);
      }
    };
    
    // 清理函數
    return () => {
      cleanupResources();
      window.removeEventListener('message', handleMessage);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      iframeRef.current = null;
    };
  }, [videoId, width, height, onPlayerReady, handleMessage, cleanupResources, createPlayerInterface]);

  return <div className="youtube-player-container" ref={containerRef}></div>;
}
