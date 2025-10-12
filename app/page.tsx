import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from '@/i18n/request';

export default async function Home() {
  // 從 Cookie 或使用預設語言
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || defaultLocale;

  // 確保 locale 是有效的
  const validLocale = locales.includes(locale as Locale) ? locale : defaultLocale;

  redirect(`/${validLocale}/video-list`);
}
