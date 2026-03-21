import { getDictionary } from '@/shared/i18n/dictionaries';
import { type Locale } from '@/shared/i18n/config';
import { Badge } from '@/shared/ui/badge';

// @ai-route { "title": "API Reference", "description": "SmartRouter, search, ready, destroy, methods, types, constructor, options, RouteOptions, SearchResult" }

export default async function ApiReferencePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const t = dict.apiReference;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            {t.smartRouterTitle}
            <Badge variant="secondary">class</Badge>
          </h2>
          <p className="text-muted-foreground mb-4">{t.smartRouterDesc}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            {t.constructorTitle}
            <Badge variant="outline">constructor</Badge>
          </h3>
          <p className="text-muted-foreground mb-3">{t.constructorDesc}</p>
          <pre><code>{`new SmartRouter(options: RouteOptions)`}</code></pre>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">{t.optionsTitle}</h3>
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <code className="text-sm font-semibold">routes: RouteConfig[]</code>
              <p className="text-sm text-muted-foreground mt-1">{t.routesDesc}</p>
            </div>
            <div className="rounded-lg border p-3">
              <code className="text-sm font-semibold">{"model?: string | string[]"}</code>
              <p className="text-sm text-muted-foreground mt-1">{t.modelDesc}</p>
            </div>
            <div className="rounded-lg border p-3">
              <code className="text-sm font-semibold">{"onModelUpgrade?: (modelId: string) => void"}</code>
              <p className="text-sm text-muted-foreground mt-1">{t.onModelUpgradeDesc}</p>
            </div>
            <div className="rounded-lg border p-3">
              <code className="text-sm font-semibold">threshold?: number</code>
              <p className="text-sm text-muted-foreground mt-1">{t.thresholdDesc}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <code className="text-base">{t.createTitle}</code>
            <Badge variant="outline">static</Badge>
          </h3>
          <p className="text-muted-foreground mb-3">{t.createDesc}</p>
          <pre><code>{`// Safe to call on every mount — returns the same instance
const router = SmartRouter.create({ routes, model: 'Xenova/all-MiniLM-L6-v2' });`}</code></pre>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <code className="text-base">{t.preloadTitle}</code>
            <Badge variant="outline">static</Badge>
          </h3>
          <p className="text-muted-foreground mb-3">{t.preloadDesc}</p>
          <pre><code>{`// At page load — fire and forget
SmartRouter.preload({
  routes,
  model: ['Xenova/all-MiniLM-L6-v2', 'Xenova/multilingual-e5-small'],
});`}</code></pre>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            {t.readyTitle}
            <Badge variant="outline">property</Badge>
          </h3>
          <p className="text-muted-foreground">{t.readyDesc}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <code className="text-base">{t.searchTitle}</code>
            <Badge variant="outline">method</Badge>
          </h3>
          <p className="text-muted-foreground">{t.searchDesc}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <code className="text-base">{t.destroyTitle}</code>
            <Badge variant="outline">method</Badge>
          </h3>
          <p className="text-muted-foreground">{t.destroyDesc}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            {t.searchResultTitle}
            <Badge variant="secondary">interface</Badge>
          </h3>
          <p className="text-muted-foreground mb-3">{t.searchResultDesc}</p>
          <pre><code>{`interface SearchResult {
  path: string;   // matched route URL
  score: number;  // similarity 0–1
}`}</code></pre>
        </div>
      </section>
    </div>
  );
}
