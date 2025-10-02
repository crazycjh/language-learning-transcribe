'use client';

import { useTranslations } from 'next-intl';
import { locales, type Locale } from '@/i18n/request';

const languageNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
};

export function LanguageSwitcher() {
  const t = useTranslations('common');

  const changeLanguage = async (locale: Locale) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">{t('language')}:</span>
      <select
        onChange={(e) => changeLanguage(e.target.value as Locale)}
        className="bg-slate-800 text-slate-100 border border-slate-700 rounded px-2 py-1 text-sm"
        defaultValue={
          typeof document !== 'undefined'
            ? document.cookie
                .split('; ')
                .find(row => row.startsWith('NEXT_LOCALE='))
                ?.split('=')[1] || 'zh-TW'
            : 'zh-TW'
        }
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
