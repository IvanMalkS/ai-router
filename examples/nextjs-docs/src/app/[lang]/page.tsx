import Link from 'next/link';
import { Brain, Zap, Puzzle, Shield } from 'lucide-react';
import { getDictionary } from '@/shared/i18n/dictionaries';
import { type Locale } from '@/shared/i18n/config';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';

// @ai-route { "title": "Home", "description": "AI semantic search router documentation, main page, overview, features" }

const features = [
  { key: 'feature1', icon: Brain },
  { key: 'feature2', icon: Zap },
  { key: 'feature3', icon: Puzzle },
  { key: 'feature4', icon: Shield },
] as const;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const t = dict.home;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <section className="flex flex-col items-center text-center mb-20">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
          {t.hero}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground mb-8">
          {t.subtitle}
        </p>
        <div className="flex gap-4 mb-12">
          <Button size="lg" asChild>
            <Link href={`/${lang}/getting-started`}>{t.getStarted}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="https://github.com" target="_blank">{t.viewOnGithub}</Link>
          </Button>
        </div>

        <div className="w-full max-w-md">
          <p className="text-sm text-muted-foreground mb-2">{t.installTitle}</p>
          <pre className="text-left">
            <code>{t.installCode}</code>
          </pre>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {features.map(({ key, icon: Icon }) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  {t[`${key}Title` as keyof typeof t]}
                </CardTitle>
              </div>
              <CardDescription className="mt-2">
                {t[`${key}Desc` as keyof typeof t]}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
