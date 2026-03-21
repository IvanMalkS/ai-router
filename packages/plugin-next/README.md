# @van1s1mys/ai-router-plugin-next

Next.js plugin for [@van1s1mys/ai-router](https://www.npmjs.com/package/@van1s1mys/ai-router) — wraps the webpack plugin with Next.js-specific defaults.

Auto-scans `app/`, `pages/`, `src/app/`, `src/pages/` and excludes Next.js internals (layouts, loading states, API routes, etc.).

## Install

```bash
npm install @van1s1mys/ai-router @van1s1mys/ai-router-plugin-next
```

## Setup

```ts
// next.config.ts
import { withAiRouter } from '@van1s1mys/ai-router-plugin-next';

export default withAiRouter({
  // your Next.js config
});
```

```ts
// app/providers.tsx
import { SmartRouter } from '@van1s1mys/ai-router';
import { routes } from 'virtual:ai-router';

const router = new SmartRouter({ routes });
await router.ready;

const result = await router.search('how much does it cost?');
```

## Options

```ts
withAiRouter(nextConfig, {
  // Override scan directories
  dirs: ['src/app'],

  // Additional exclusions (merged with Next.js defaults)
  exclude: ['admin/'],

  // Manual routes merged with scanned ones
  routes: [
    { path: '/pricing', title: 'Pricing', description: 'cost, plans, billing' },
  ],
});
```

### Default exclusions

The plugin automatically excludes Next.js internal files:

`_app`, `_document`, `_error`, `layout`, `loading`, `error`, `not-found`, `template`, `default`, `icon`, `apple-icon`, `opengraph-image`, `twitter-image`, `sitemap`, `robots`, `manifest`, `middleware`, `instrumentation`, `global-error`, `route`, `__tests__`, `.test.`, `.spec.`, `api/`

## Route annotations

Add `@ai-route` comments to page files for richer metadata:

```tsx
// @ai-route title="Pricing" description="plans, cost, billing, subscription"

export default function PricingPage() { ... }
```

## License

[MIT](../../LICENSE) &copy; [IvanMalkS](https://github.com/IvanMalkS)
