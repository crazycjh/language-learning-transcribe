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
  
  return {
    measurementId: isDevEnvironment
      ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_DEV || ''
      : process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_PROD || '',
    enabled: process.env.NEXT_PUBLIC_GA_ENABLED === 'true',
    debugMode: isDevEnvironment,
    environment: isDevEnvironment ? 'development' : 'production'
  };
}

// 導出配置
export const GA_CONFIG = getGAConfig();