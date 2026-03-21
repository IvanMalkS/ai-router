# @van1s1mys/ai-router-plugin-webpack

webpack plugin for [@van1s1mys/ai-router](https://www.npmjs.com/package/@van1s1mys/ai-router) — auto-scans your pages directory and aliases `virtual:ai-router` to a generated routes module.

## Install

```bash
npm install @van1s1mys/ai-router @van1s1mys/ai-router-plugin-webpack
```

## Setup

```js
// webpack.config.js
const { AiRouterPlugin } = require('@van1s1mys/ai-router-plugin-webpack');

module.exports = {
  plugins: [
    new AiRouterPlugin(),
  ],
};
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

```js
new AiRouterPlugin({
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

## Standalone helper

Use `getRoutes()` outside of webpack (e.g. in custom build scripts or SSR):

```ts
import { getRoutes } from '@van1s1mys/ai-router-plugin-webpack';

const routes = getRoutes(__dirname, { dirs: ['src/pages'] });
```

## Route annotations

Add `@ai-route` comments to page files for richer metadata:

```tsx
// @ai-route title="Pricing" description="plans, cost, billing, subscription"

export default function PricingPage() { ... }
```

## How it works

The plugin writes a generated module to `node_modules/.cache/ai-router/routes.js` and rewrites `virtual:ai-router` imports to point to it. Routes are re-generated on watch rebuilds.

## License

[MIT](../../LICENSE) &copy; [IvanMalkS](https://github.com/IvanMalkS)
