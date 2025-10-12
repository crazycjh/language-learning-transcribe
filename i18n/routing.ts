import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh-TW', 'en', 'ja'],
  defaultLocale: 'zh-TW',
  localePrefix: 'always'
});

// 導出輕量級的 navigation utilities
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
