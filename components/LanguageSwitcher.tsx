'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

const languageNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
};

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale(); // 從 URL 取得當前語言
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: string) => {
    // 使用 i18n-aware router 切換語言
    // router.push 會自動處理語言路徑
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <span className="text-xs md:text-sm text-slate-400 hidden sm:inline">{t('language')}:</span>
      <select
        value={locale}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-slate-800 text-slate-100 border border-slate-700 rounded px-2 py-1 text-xs md:text-sm cursor-pointer hover:bg-slate-700 transition-colors"
        aria-label={t('language')}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {languageNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
