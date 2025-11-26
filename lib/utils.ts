import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 語言代碼到本地化名稱的映射
 * 用於在 UI 中顯示語言的本地化名稱
 */
export const LANGUAGE_NAMES: { [key: string]: string } = {
  'default': 'Original', // 會被 i18n 覆蓋
  'zh': '繁體中文',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'ru': 'Русский',
  'ar': 'العربية',
  'hi': 'हिन्दी',
  'th': 'ไทย',
  'vi': 'Tiếng Việt',
};

/**
 * 獲取語言的本地化顯示名稱
 * @param langCode - 語言代碼 (如 'zh', 'en', 'ja')
 * @param originalText - 'default' 語言的翻譯文字 (可選)
 * @returns 本地化的語言名稱
 */
export function getLanguageDisplayName(langCode: string, originalText?: string): string {
  if (langCode === 'default' && originalText) {
    return originalText;
  }
  return LANGUAGE_NAMES[langCode] || langCode.toUpperCase();
}
