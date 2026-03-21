import { getDictionary } from '@/shared/i18n/dictionaries';
import { type Locale } from '@/shared/i18n/config';

// @ai-route { "title": "Getting Started", "description": "install, setup, quick start, tutorial, first steps, begin" }

export default async function GettingStartedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const t = dict.gettingStarted;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      <p className="text-muted-foreground mb-10">{t.intro}</p>

      <section className="space-y-10">
        <div>
          <h2 className="text-xl font-semibold mb-2">{t.step1Title}</h2>
          <p className="text-muted-foreground mb-3">{t.step1Desc}</p>
          <pre><code>{`npm install ai-router
# with a plugin:
npm install ai-router ai-router-plugin-vite`}</code></pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t.step2Title}</h2>
          <p className="text-muted-foreground mb-3">{t.step2Desc}</p>
          <pre><code>{`import { SmartRouter } from 'ai-router';

const router = SmartRouter.create({
  routes: [
    { path: '/pricing', title: 'Pricing',
      description: 'cost, plans, subscription' },
    { path: '/contact', title: 'Contact',
      description: 'support, phone, address' },
  ],
  // Light model first, then upgrade in the background
  model: ['Xenova/all-MiniLM-L6-v2', 'Xenova/multilingual-e5-small'],
  threshold: 0.5,
});`}</code></pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t.step3Title}</h2>
          <p className="text-muted-foreground mb-3">{t.step3Desc}</p>
          <pre><code>{`await router.ready; // first model ready — search works immediately

const result = await router.search('how much does it cost?');
// → { path: '/pricing', score: 0.87 }`}</code></pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t.step4Title}</h2>
          <p className="text-muted-foreground mb-3">{t.step4Desc}</p>
          <pre><code>{`router.destroy();`}</code></pre>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
          {t.note}
        </div>
      </section>
    </div>
  );
}
