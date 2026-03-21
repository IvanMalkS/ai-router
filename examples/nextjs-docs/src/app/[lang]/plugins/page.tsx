import { getDictionary } from '@/shared/i18n/dictionaries';
import { type Locale } from '@/shared/i18n/config';

// @ai-route { "title": "Plugins", "description": "vite, webpack, next.js, bundler, virtual module, auto-scan, plugin, configuration, setup" }

export default async function PluginsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const t = dict.plugins;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      <p className="text-muted-foreground mb-10">{t.intro}</p>

      <section className="space-y-10">
        <div>
          <h2 className="text-xl font-semibold mb-2">{t.viteTitle}</h2>
          <p className="text-muted-foreground mb-3">{t.viteDesc}</p>
          <pre><code>{`npm install ai-router-plugin-vite`}</code></pre>
          <pre className="mt-3"><code>{`// vite.config.ts
import { aiRouter } from 'ai-router-plugin-vite';

export default defineConfig({
  plugins: [
    aiRouter({ dirs: ['src/pages'] }),
  ],
});`}</code></pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t.webpackTitle}</h2>
          <p className="text-muted-foreground mb-3">{t.webpackDesc}</p>
          <pre><code>{`npm install ai-router-plugin-webpack`}</code></pre>
          <pre className="mt-3"><code>{`// webpack.config.js
const { AiRouterPlugin } = require('ai-router-plugin-webpack');

module.exports = {
  plugins: [
    new AiRouterPlugin({ dirs: ['src/pages'] }),
  ],
};`}</code></pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t.nextTitle}</h2>
          <p className="text-muted-foreground mb-3">{t.nextDesc}</p>
          <pre><code>{`npm install ai-router-plugin-next`}</code></pre>
          <pre className="mt-3"><code>{`// next.config.js
const { withAiRouter } = require('ai-router-plugin-next');

module.exports = withAiRouter({
  // your Next.js config
});`}</code></pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t.virtualModuleTitle}</h2>
          <p className="text-muted-foreground mb-3">{t.virtualModuleDesc}</p>
          <pre><code>{`import { routes } from 'virtual:ai-router';
import { SmartRouter } from 'ai-router';

const router = new SmartRouter({ routes });`}</code></pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t.annotationTitle}</h2>
          <p className="text-muted-foreground mb-3">{t.annotationDesc}</p>
          <pre><code>{`// @ai-route { "title": "Pricing", "description": "cost, plans, billing" }
export default function PricingPage() {
  return <div>...</div>;
}`}</code></pre>
        </div>
      </section>
    </div>
  );
}
