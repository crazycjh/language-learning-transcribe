'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslations } from 'next-intl';

export function Header() {
  const t = useTranslations('metadata');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-2">
        <Link
          href="/video-list"
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <Image
            src="/icon.png"
            alt={t('title')}
            width={32}
            height={32}
            className="w-8 h-8 md:w-10 md:h-10"
          />
        </Link>

        <div className="flex items-center flex-shrink-0">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
