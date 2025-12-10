// Google Analytics 環境配置

export interface GAConfig {
  measurementId: string;
  enabled: boolean;
  debugMode: boolean;
  environment: 'development' | 'staging' | 'production';
}

export function getGAConfig(): GAConfig {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const isDevEnvironment = appEnv === 'development';
  
  // 臨時調試：輸出所有相關環境變數
  const config = {
    measurementId: isDevEnvironment
      ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_DEV 
      : process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_PROD,
    enabled: process.env.NEXT_PUBLIC_GA_ENABLED === 'true',
    debugMode: isDevEnvironment,
    environment: (isDevEnvironment ? 'development' : 'production') as 'development' | 'production'
  };
  
  // 服務器端調試
  console.log('🔍 GA Config Debug:', {
    appEnv,
    isDevEnvironment,
    GA_ENABLED_RAW: process.env.NEXT_PUBLIC_GA_ENABLED,
    GA_ID_DEV: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_DEV,
    GA_ID_PROD: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_PROD,
    finalConfig: config
  });
  
  return config;
}

// 導出配置
export const GA_CONFIG = getGAConfig();