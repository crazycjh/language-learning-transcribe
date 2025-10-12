import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // 從 URL 中提取當前語言
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = routing.locales.find(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // 如果 URL 包含語言，更新 Cookie 記住使用者偏好
  if (pathnameLocale && response) {
    response.cookies.set('NEXT_LOCALE', pathnameLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      path: '/',
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  // 匹配所有路徑（包含根路徑），除了 API routes、_next、static files 和 legacy routes
  matcher: ['/', '/((?!api|_next|_vercel|videotranscript|yt|test|.*\\..*).*)']
};
