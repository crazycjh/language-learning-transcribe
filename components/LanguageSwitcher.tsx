'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const locales = ['zh-TW', 'en', 'ja'] as const;
type Locale = (typeof locales)[number];

const languageNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
};

// 從 Cookie 讀取當前語言
function getCurrentLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return 'en';

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('NEXT_LOCALE='));

  const locale = cookie?.split('=')[1] as Locale | undefined;
  return locale || 'en';
}

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');

  // 初始化時讀取 Cookie 中的語言設定
  useEffect(() => {
    setCurrentLocale(getCurrentLocaleFromCookie());
  }, []);

  const changeLanguage = async (locale: Locale) => {
    // 設置 Cookie (1年有效期)
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;

    // 更新 state (雖然馬上會 reload,但確保 UI 即時反應)
    setCurrentLocale(locale);

    // 重新載入頁面以套用新語言
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <span className="text-xs md:text-sm text-slate-400 hidden sm:inline">{t('language')}:</span>
      <select
        value={currentLocale}
        onChange={(e) => changeLanguage(e.target.value as Locale)}
        className="bg-slate-800 text-slate-100 border border-slate-700 rounded px-2 py-1 text-xs md:text-sm cursor-pointer hover:bg-slate-700 transition-colors"
        aria-label={t('language')}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {languageNames[locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
