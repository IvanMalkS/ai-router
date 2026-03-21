# @van1s1mys/ai-router-plugin-vite

Vite plugin for [@van1s1mys/ai-router](https://www.npmjs.com/package/@van1s1mys/ai-router) — auto-scans your pages directory and exposes routes via a virtual module.

## Install

```bash
npm install @van1s1mys/ai-router @van1s1mys/ai-router-plugin-vite
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from 'vite';
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
await router.ready;

const result = await router.search('how much does it cost?');
```

## Options

```ts
aiRouter({
  // Directories to scan (default: auto-detect)
  dirs: ['src/pages'],

  // File extensions to include
  extensions: ['.tsx', '.jsx', '.vue', '.svelte', '.astro', '.md', '.mdx'],

  // Patterns to exclude
  exclude: ['_layout', 'api/'],

  // Additional manual routes merged with scanned ones
  routes: [
    { path: '/pricing', title: 'Pricing', description: 'cost, plans' },
  ],
});
```

## Route annotations

Add `@ai-route` comments to page files for richer metadata:

```tsx
// @ai-route title="Pricing" description="plans, cost, billing, subscription"

export default function PricingPage() { ... }
```

## HMR

Routes are re-scanned automatically when files in the scanned directories change.

## License

[MIT](../../LICENSE) &copy; [IvanMalkS](https://github.com/IvanMalkS)
