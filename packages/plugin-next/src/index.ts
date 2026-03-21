/**
 * Next.js plugin for ai-router.
 *
 * Wraps the webpack plugin with Next.js-specific defaults —
 * automatically scans `app/`, `pages/`, `src/app/`, and `src/pages/`
 * while excluding Next.js internal files (layouts, loading states, API routes, etc.).
 *
 * @example
 * ```js
 * // next.config.js
 * const { withAiRouter } = require('ai-router-plugin-next');
 *
 * module.exports = withAiRouter({
 *   // your Next.js config
 * });
 * ```
 *
 * ```ts
 * // app/providers.tsx
 * import { routes } from 'virtual:ai-router';
 * import { SmartRouter } from 'ai-router';
 *
 * const router = new SmartRouter({ routes });
 * ```
 *
 * @module
 */

import { AiRouterPlugin } from 'ai-router-plugin-webpack';
import type { PluginOptions } from '@ai-router/shared';

export type { PluginOptions } from '@ai-router/shared';

/** Minimal webpack config shape used by Next.js. */
interface WebpackConfig {
  plugins?: { apply(compiler: unknown): void }[];
  [key: string]: unknown;
}

/** Minimal Next.js `webpack()` context. */
interface WebpackContext {
  dev: boolean;
  isServer: boolean;
  [key: string]: unknown;
}

/**
 * Next.js configuration object.
 * Accepts any Next.js config property plus an optional `webpack` function.
 */
interface NextConfig {
  webpack?: (config: WebpackConfig, context: WebpackContext) => WebpackConfig;
  [key: string]: unknown;
}

/**
 * Wraps a Next.js config with ai-router route scanning.
 *
 * Injects the {@link AiRouterPlugin} into the webpack config with
 * sensible defaults for Next.js projects. Auto-detects standard
 * directory conventions (`app/`, `pages/`, `src/app/`, `src/pages/`)
 * and excludes framework internals.
 *
 * @param nextConfig - Your existing Next.js configuration.
 * @param options - Override scan directories, exclusions, or provide manual routes.
 *                  Defaults are merged, not replaced.
 * @returns A new Next.js config with the ai-router webpack plugin applied.
 *
 * @example
 * ```js
 * // Basic usage — auto-detects app/ and pages/ directories
 * module.exports = withAiRouter({});
 * ```
 *
 * @example
 * ```js
 * // With manual route overrides
 * module.exports = withAiRouter(nextConfig, {
 *   routes: [
 *     { path: '/pricing', title: 'Pricing', description: 'cost, plans, billing' },
 *   ],
 * });
 * ```
 *
 * @example
 * ```js
 * // Custom directories only
 * module.exports = withAiRouter(nextConfig, {
 *   dirs: ['src/app'],
 * });
 * ```
 */
export function withAiRouter(nextConfig: NextConfig = {}, options?: PluginOptions): NextConfig {
  const pluginOptions: PluginOptions = {
    dirs: ['app', 'pages', 'src/app', 'src/pages'],
    exclude: [
      // Next.js internal files
      '_app',
      '_document',
      '_error',
      'layout',
      'loading',
      'error',
      'not-found',
      'template',
      'default',
      'icon',
      'apple-icon',
      'opengraph-image',
      'twitter-image',
      'sitemap',
      'robots',
      'manifest',
      'middleware',
      'instrumentation',
      'global-error',
      'route',       // API routes
      '__tests__',
      '.test.',
      '.spec.',
      'api/',        // API directory
    ],
    ...options,
  };

  return {
    ...nextConfig,
    webpack(config: WebpackConfig, context: WebpackContext) {
      config.plugins = config.plugins || [];
      config.plugins.push(new AiRouterPlugin(pluginOptions));

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, context);
      }

      return config;
    },
  };
}
