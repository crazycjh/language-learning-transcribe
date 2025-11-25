'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <Select value={locale} onValueChange={changeLanguage}>
        <SelectTrigger 
          className="w-auto h-8 md:h-9 text-xs md:text-sm border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100"
          aria-label={t('language')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {routing.locales.map((loc) => (
            <SelectItem 
              key={loc} 
              value={loc} 
              className="text-xs md:text-sm text-slate-100 focus:bg-slate-700 focus:text-slate-100"
            >
              {languageNames[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
