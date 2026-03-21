'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { SearchDialog } from '@/features/search';
import { ThemeToggle } from '@/features/theme';
import { locales, localeNames, type Locale } from '@/shared/i18n/config';

interface HeaderProps {
  lang: string;
  dict: {
    nav: {
      home: string;
      gettingStarted: string;
      apiReference: string;
      plugins: string;
      examples: string;
      search: string;
      searchPlaceholder: string;
    };
    examples: {
      loading: string;
      noResult: string;
    };
  };
}

const navItems = [
  { key: 'gettingStarted', href: '/getting-started' },
  { key: 'apiReference', href: '/api-reference' },
  { key: 'plugins', href: '/plugins' },
  { key: 'examples', href: '/examples' },
] as const;

export function Header({ lang, dict }: HeaderProps) {
  const pathname = usePathname();

  const switchLocale = (locale: Locale) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    return segments.join('/') || `/${locale}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
        <Link href={`/${lang}`} className="mr-6 flex items-center space-x-2 font-bold">
          ai-router
        </Link>

        <nav className="hidden items-center space-x-4 text-sm font-medium md:flex">
          {navItems.map((item) => {
            const href = `/${lang}${item.href}`;
            const isActive = pathname === href;
            return (
              <Link
                key={item.key}
                href={href}
                className={`transition-colors hover:text-foreground ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {dict.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center space-x-2">
          <SearchDialog
            lang={lang}
            placeholder={dict.nav.searchPlaceholder}
            triggerText={dict.nav.search}
            loadingText={dict.examples.loading}
            noResultText={dict.examples.noResult}
          />

          <ThemeToggle />

          <div className="hidden items-center md:flex">
            {locales.map((locale) => (
              <Button
                key={locale}
                variant={locale === lang ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                className="h-8 px-2 text-xs"
              >
                <Link href={switchLocale(locale)}>
                  {localeNames[locale]}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href={switchLocale(locales[(locales.indexOf(lang as Locale) + 1) % locales.length])}>
                <Globe className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
