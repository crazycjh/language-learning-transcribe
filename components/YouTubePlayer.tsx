'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface YouTubePlayerInterface {
  destroy: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  width?: number;
  height?: number;
  onPlayerReady?: (player: YouTubePlayerInterface) => void;
  autoPlay?: boolean;
}

export function YouTubePlayer({
  videoId,
  onTimeUpdate,
  width,
  height,
  onPlayerReady,
  autoPlay = true
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
            // 跳轉到指定時間
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [seconds, true]
              }),
              '*'
            );
            // 如果 autoPlay 為 true，則自動播放
            if (autoPlay) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                  event: 'command',
                  func: 'playVideo',
                  args: []
                }),
                '*'
              );
            }
          } catch {
            console.log('無法控制iframe播放器時間');
          }
        }
      },
      playVideo: () => {
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'playVideo',
                args: []
              }),
              '*'
            );
          } catch {
            console.log('無法控制iframe播放器播放');
          }
        }
      },
      pauseVideo: () => {
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'pauseVideo',
                args: []
              }),
              '*'
            );
          } catch {
            console.log('無法控制iframe播放器暫停');
          }
        }
      }
    };
  }, [cleanupResources, autoPlay]);

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

    const container = containerRef.current;

    // 檢查是否需要重新創建播放器
    const prevProps = prevPropsRef.current;
    const needsRecreate = videoId !== prevProps.videoId ||
                          (width && height && (width !== prevProps.width || height !== prevProps.height)) ||
                          !iframeRef.current;

    // 更新參考值
    prevPropsRef.current = { videoId, width, height };

    // 如果不需要重新創建，則退出
    if (!needsRecreate) return;

    // 清理現有資源
    cleanupResources();
    // 清除容器內容
    container.innerHTML = '';

    // 創建新的iframe元素
    const iframe = document.createElement('iframe');
    
    // 如果有指定寬高，使用固定尺寸，否則使用響應式設計
    if (width && height) {
      iframe.width = `${width}px`;
      iframe.height = `${height}px`;
    } else {
      // 響應式設計：使用 100% 寬度和 16:9 比例
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.aspectRatio = "16 / 9";
    }
    
    iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&controls=1&rel=0&modestbranding=1&iv_load_policy=3`;
    iframe.style.border = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;

    // 添加到DOM
    container.appendChild(iframe);
    iframeRef.current = iframe;

    // 添加消息事件監聽
    window.addEventListener('message', handleMessage);

    // 新增：每500ms查詢一次真實播放時間
    // 這裡會定期向 YouTube iframe 發送 getCurrentTime 指令，取得實際播放時間
    let ytTimer: number | null = null;
    function postGetCurrentTime() {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'listening',
            id: 1,
            channel: 'widget',
            func: 'getCurrentTime'
          }),
          '*'
        );
      }
    }
    ytTimer = window.setInterval(postGetCurrentTime, 500);

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
      if (ytTimer) window.clearInterval(ytTimer);
      const container = containerRef.current;
      if (container) {
        container.innerHTML = '';
      }
      iframeRef.current = null;
    };
  }, [videoId, width, height, onPlayerReady, handleMessage, cleanupResources, createPlayerInterface]);

  // 處理 YouTube iframe 回傳播放時間，並呼叫 onTimeUpdate
  useEffect(() => {
    function ytTimeListener(event: MessageEvent) {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'infoDelivery' && data.info && typeof data.info.currentTime === 'number') {
          currentTimeRef.current = data.info.currentTime;
          if (typeof onTimeUpdate === 'function') {
            onTimeUpdate(data.info.currentTime);
          }
        }
      } catch {}
    }
    window.addEventListener('message', ytTimeListener);
    return () => {
      window.removeEventListener('message', ytTimeListener);
    };
  }, [onTimeUpdate]);

  return (
    <div 
      className={`youtube-player-container ${!width && !height ? 'w-full' : ''}`}
      ref={containerRef}
      style={!width && !height ? { aspectRatio: '16 / 9' } : undefined}
    ></div>
  );
}
