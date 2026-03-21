import { getDictionary } from '@/shared/i18n/dictionaries';
import { type Locale } from '@/shared/i18n/config';
import { LiveSearch } from './live-search';

// @ai-route { "title": "Examples", "description": "demo, live search, try, test, sample code, usage, playground" }

export default async function ExamplesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const t = dict.examples;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      <p className="text-muted-foreground mb-10">{t.intro}</p>

      <LiveSearch lang={lang} dict={t} />
    </div>
  );
}
