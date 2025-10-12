import { redirect } from 'next/navigation';

export default function LocaleHomePage() {
  // 使用相對路徑重定向，會自動保留當前 locale
  // 例如：/zh-TW → /zh-TW/video-list
  redirect('/video-list');
}
