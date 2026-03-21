import type { ReactNode } from 'react';
import { locales, type Locale } from '@/shared/i18n/config';
import { getDictionary } from '@/shared/i18n/dictionaries';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { PreloadSmartRouter } from '@/features/search';

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <title>{dict.meta.title}</title>
        <meta name="description" content={dict.meta.description} />
      </head>
      <body className="min-h-screen flex flex-col">
        <PreloadSmartRouter />
        <Header lang={lang} dict={dict} />
        <main className="flex-1">{children}</main>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
