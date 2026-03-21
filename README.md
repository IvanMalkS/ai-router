<p align="center">
  <img src="https://img.shields.io/npm/v/@van1s1mys/ai-router?color=blue&label=ai-router" alt="npm version" />
  <img src="https://img.shields.io/npm/v/@van1s1mys/ai-router-plugin-vite?color=blue&label=vite" alt="vite plugin" />
  <img src="https://img.shields.io/npm/v/@van1s1mys/ai-router-plugin-next?color=blue&label=next" alt="next plugin" />
  <img src="https://img.shields.io/npm/v/@van1s1mys/ai-router-plugin-webpack?color=blue&label=webpack" alt="webpack plugin" />
  <img src="https://img.shields.io/npm/l/@van1s1mys/ai-router" alt="license" />
  <img src="https://img.shields.io/bundlephobia/minzip/@van1s1mys/ai-router" alt="bundle size" />
</p>

<h1 align="center">ai-router</h1>

<p align="center">
  <strong>Semantic search routing for SPAs</strong><br/>
  Find the best route by meaning, not keywords. Powered by HuggingFace embeddings and Orama hybrid search.
</p>

---

## How it works

`ai-router` runs a lightweight AI embedding model inside a **Web Worker** so the main thread stays fast. It indexes your routes into a hybrid (text + vector) search engine and matches user queries by semantic similarity — typos, synonyms, and natural language all work out of the box.

```
User query: "how much does it cost?"
  --> SmartRouter --> { path: "/pricing", score: 0.87 }
```

## Features

- **Semantic matching** — understands meaning, not just keywords
- **Web Worker** — model runs off the main thread, zero UI jank
- **SSR-safe** — no-op on the server, works with Next.js/Nuxt/etc.
- **Tiny API** — `new SmartRouter()`, `.search()`, `.destroy()`
- **Progressive model loading** — start with a fast model, upgrade to a better one in the background
- **Instance caching** — `SmartRouter.create()` and `.preload()` reuse the same worker across mounts
- **Framework plugins** — auto-scan routes for Next.js, Vite, and webpack
- **Cached model** — ~22 MB on first load, then instant from browser cache

## Packages

| Package | Description |
|---|---|
| [`@van1s1mys/ai-router`](packages/core) | Core library — SmartRouter class |
| [`@van1s1mys/ai-router-plugin-vite`](packages/plugin-vite) | Vite plugin — auto-scan routes |
| [`@van1s1mys/ai-router-plugin-next`](packages/plugin-next) | Next.js plugin — wraps webpack with sensible defaults |
| [`@van1s1mys/ai-router-plugin-webpack`](packages/plugin-webpack) | webpack plugin — auto-scan routes |

## Quick start

```bash
npm install @van1s1mys/ai-router
```

```ts
import { SmartRouter } from '@van1s1mys/ai-router';

const router = new SmartRouter({
  routes: [
    { path: '/pricing', title: 'Pricing', description: 'cost, plans, subscription' },
    { path: '/contact', title: 'Contact', description: 'support, phone, address' },
    { path: '/docs',    title: 'Docs',    description: 'documentation, API, guides' },
  ],
  threshold: 0.5,
});

await router.ready; // model loads (~22 MB, cached after first run)

const result = await router.search('how to reach support?');
// { path: '/contact', score: 0.91 }

router.destroy(); // cleanup when done
```

## Using with framework plugins

Plugins auto-scan your pages directory and expose routes via a virtual module — no manual config needed.

### Vite

```bash
npm install @van1s1mys/ai-router ai-router-plugin-vite
```

```ts
// vite.config.ts
import { aiRouter } from '@van1s1mys/ai-router-plugin-vite';

export default defineConfig({
  plugins: [aiRouter()],
});
```

```ts
// app.ts
import { SmartRouter } from '@van1s1mys/ai-router';
import { routes } from 'virtual:ai-router';

const router = new SmartRouter({ routes });
```

### Next.js

```bash
npm install @van1s1mys/ai-router ai-router-plugin-next
```

```ts
// next.config.ts
import { withAiRouter } from '@van1s1mys/ai-router-plugin-next';

export default withAiRouter({
  /* your Next.js config */
});
```

### webpack

```bash
npm install @van1s1mys/ai-router ai-router-plugin-webpack
```

```ts
// webpack.config.ts
import { AiRouterPlugin } from '@van1s1mys/ai-router-plugin-webpack';

export default {
  plugins: [new AiRouterPlugin()],
};
```

## Progressive model loading

Start with a lightweight model for instant results, then seamlessly upgrade to a heavier one in the background:

```ts
const router = new SmartRouter({
  routes,
  model: ['Xenova/all-MiniLM-L6-v2', 'Xenova/multilingual-e5-small'],
  onModelUpgrade: (modelId) => console.log(`Upgraded to ${modelId}`),
});

await router.ready; // resolves when the first (fast) model is ready
```

The router re-indexes all routes automatically when each subsequent model finishes loading. Searches keep working during the upgrade — no downtime.

## Instance caching & preloading

`SmartRouter.create()` returns a cached instance — safe to call on every React mount without re-downloading the model:

```ts
// Returns the same instance for the same model config
const router = SmartRouter.create({ routes, model: 'Xenova/all-MiniLM-L6-v2' });
```

`SmartRouter.preload()` starts downloading the model at page load so it's already warm when the user needs it:

```ts
// At page load — fire and forget
SmartRouter.preload({ routes, model: ['Xenova/all-MiniLM-L6-v2', 'Xenova/multilingual-e5-small'] });

// Later, when the user opens search — instant
const router = SmartRouter.create({ routes, model: ['Xenova/all-MiniLM-L6-v2', 'Xenova/multilingual-e5-small'] });
await router.ready; // resolves immediately if preload finished
```

## Multilingual support

The default model (`Xenova/all-MiniLM-L6-v2`) works best for English. For other languages, use the multilingual model:

```ts
const router = new SmartRouter({
  routes,
  model: 'Xenova/multilingual-e5-small',
});
```

## Route annotations

Add `@ai-route` comments to your page files for richer metadata:

```tsx
// @ai-route title="Pricing" description="plans, cost, billing, subscription"

export default function PricingPage() { ... }
```

## API

### `new SmartRouter(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `routes` | `RouteConfig[]` | required | Routes to index |
| `model` | `string \| string[]` | `"Xenova/all-MiniLM-L6-v2"` | Model ID or ordered array for progressive loading |
| `threshold` | `number` | `0.5` | Minimum similarity score (0-1) |
| `onModelUpgrade` | `(modelId: string) => void` | — | Called when the router switches to the next model |

### `SmartRouter.create(options): SmartRouter`

Returns a cached instance for the given model config. Safe to call on every component mount.

### `SmartRouter.preload(options): SmartRouter`

Same as `create()`, but intended to be called at page load to pre-warm the model.

### `router.ready: Promise<void>`

Resolves when the first model is loaded and routes are indexed.

### `router.search(query): Promise<SearchResult | null>`

Returns `{ path, score }` or `null` if no route meets the threshold.

### `router.destroy()`

Terminates the worker and removes the instance from cache.

## Development

```bash
pnpm install
pnpm build        # build all packages
pnpm dev          # watch mode for all packages
```

## License

[MIT](LICENSE) &copy; [IvanMalkS](https://github.com/IvanMalkS)
