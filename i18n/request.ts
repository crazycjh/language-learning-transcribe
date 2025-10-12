import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export const locales = ['zh-TW', 'en', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh-TW';

export default getRequestConfig(async ({ requestLocale }) => {
  // 從 URL 或 headers 獲取 locale
  let locale = await requestLocale;

  // 驗證 locale 是否有效，否則使用預設值
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // 確保 locale 不是 undefined
  const validLocale = locale || routing.defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});
