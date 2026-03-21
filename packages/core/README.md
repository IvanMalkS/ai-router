# @van1s1mys/ai-router

Semantic search routing for SPAs — find the best route by meaning, not keywords.

Runs a HuggingFace embedding model inside a **Web Worker** and uses [Orama](https://orama.com) hybrid (text + vector) search to match user queries by semantic similarity.

## Install

```bash
npm install @van1s1mys/ai-router
```

## Usage

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

## Multilingual support

The default model (`Xenova/all-MiniLM-L6-v2`) works best for English. For other languages, use the multilingual model:

```ts
const router = new SmartRouter({
  routes,
  model: 'Xenova/multilingual-e5-small',
});
```

## API

### `new SmartRouter(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `routes` | `RouteConfig[]` | required | Routes to index |
| `model` | `string` | `"Xenova/all-MiniLM-L6-v2"` | HuggingFace model ID (384-dim) |
| `threshold` | `number` | `0.5` | Minimum similarity score (0-1) |

### `router.ready: Promise<void>`

Resolves when the model is loaded and routes are indexed. Resolves immediately during SSR.

### `router.search(query): Promise<SearchResult | null>`

Returns `{ path, score }` or `null` if no route meets the threshold. Returns `null` during SSR.

### `router.destroy()`

Terminates the worker and cleans up resources. Safe to call multiple times.

## SSR

SSR-safe out of the box. On the server `ready` resolves immediately and `search()` returns `null`. The worker is only spawned in the browser.

## Framework plugins

Auto-scan your pages directory instead of listing routes manually:

- [`@van1s1mys/ai-router-plugin-vite`](https://www.npmjs.com/package/@van1s1mys/ai-router-plugin-vite)
- [`@van1s1mys/ai-router-plugin-next`](https://www.npmjs.com/package/@van1s1mys/ai-router-plugin-next)
- [`@van1s1mys/ai-router-plugin-webpack`](https://www.npmjs.com/package/@van1s1mys/ai-router-plugin-webpack)

## License

[MIT](../../LICENSE) &copy; [IvanMalkS](https://github.com/IvanMalkS)
