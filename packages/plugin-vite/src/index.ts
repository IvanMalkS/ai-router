/**
 * Vite plugin for ai-router.
 *
 * Scans page directories at build time and exposes a `virtual:ai-router`
 * module that exports the generated route config array.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { aiRouter } from 'ai-router-plugin-vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     aiRouter({ dirs: ['src/pages'] }),
 *   ],
 * });
 * ```
 *
 * ```ts
 * // app.ts
 * import { routes } from 'virtual:ai-router';
 * import { SmartRouter } from 'ai-router';
 *
 * const router = new SmartRouter({ routes });
 * ```
 *
 * @module
 */

import type { Plugin } from 'vite';
import {
  scanRoutes,
  generateRoutesModule,
  VIRTUAL_MODULE_ID,
  RESOLVED_VIRTUAL_MODULE_ID,
  type PluginOptions,
} from '@ai-router/shared';

export type { PluginOptions } from '@ai-router/shared';

/**
 * Creates a Vite plugin that generates route config from the file system.
 *
 * The plugin provides a virtual module `virtual:ai-router` that exports
 * a `routes` array compatible with {@link SmartRouter}.
 *
 * Supports HMR — routes are re-scanned when files in `dirs` change.
 *
 * @param options - Directories to scan, file extensions, exclusions, and manual routes.
 * @returns Vite plugin instance.
 *
 * @example
 * ```ts
 * // Auto-scan + manual overrides
 * aiRouter({
 *   dirs: ['src/pages'],
 *   routes: [
 *     { path: '/pricing', title: 'Pricing', description: 'cost, plans, billing' },
 *   ],
 * });
 * ```
 */
export function aiRouter(options: PluginOptions = {}): Plugin {
  let root = process.cwd();

  return {
    name: 'ai-router',

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const routes = scanRoutes(root, options);
        return generateRoutesModule(routes);
      }
    },

    handleHotUpdate({ file, server }) {
      if (options.dirs?.some((dir) => file.includes(dir))) {
        const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (module) {
          server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: 'full-reload' });
        }
      }
    },
  };
}
