// Google Analytics 工具函數
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  }
}

import { getGAConfig } from './ga-config';

// 使用統一的 GA 配置
const gaConfig = getGAConfig();
export const GA_MEASUREMENT_ID = gaConfig.measurementId;

// GA 啟用條件
export const GA_ENABLED = gaConfig.enabled;

// 頁面瀏覽事件
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID && GA_ENABLED) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// 環境資訊檢查
export const getEnvironmentInfo = () => ({
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  GA_ID: GA_MEASUREMENT_ID,
  GA_ENABLED: GA_ENABLED,
  environment: gaConfig.environment,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
});

// 自定義事件
export const event = (action: string, parameters?: Record<string, unknown>) => {
  // Debug 模式：顯示環境資訊
  if (gaConfig.debugMode) {
    console.log('[GA Debug]', {
      ...getEnvironmentInfo(),
      action,
      parameters
    });
  }

  if (typeof window !== 'undefined' && window.gtag && GA_ENABLED) {
    // 在開發環境為事件加上標記
    const enhancedParameters = process.env.NODE_ENV === 'development' 
      ? { ...parameters, environment: 'development' }
      : parameters;
      
    window.gtag('event', action, enhancedParameters);
  }
};

// 語言學習相關的事件追蹤
export const trackVideoPlay = (videoId: string, language: string) => {
  event('video_play', {
    video_id: videoId,
    language: language,
    category: 'engagement'
  });
};

export const trackPracticeStart = (videoId: string, difficulty: string) => {
  event('practice_start', {
    video_id: videoId,
    difficulty: difficulty,
    category: 'learning'
  });
};

export const trackPracticeComplete = (videoId: string, difficulty: string, accuracy: number) => {
  event('practice_complete', {
    video_id: videoId,
    difficulty: difficulty,
    accuracy: accuracy,
    category: 'learning'
  });
};

export const trackLanguageSwitch = (fromLanguage: string, toLanguage: string) => {
  event('language_switch', {
    from_language: fromLanguage,
    to_language: toLanguage,
    category: 'navigation'
  });
};

export const trackTranscriptionStart = (source: 'youtube' | 'audio_file') => {
  event('transcription_start', {
    source: source,
    category: 'feature_usage'
  });
};

export const trackTranscriptionComplete = (source: 'youtube' | 'audio_file', duration: number) => {
  event('transcription_complete', {
    source: source,
    duration: duration,
    category: 'feature_usage'
  });
};