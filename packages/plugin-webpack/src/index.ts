/**
 * webpack plugin for ai-router.
 *
 * Scans page directories at build time and aliases `virtual:ai-router`
 * to a generated routes module in `node_modules/.cache/ai-router/`.
 *
 * @example
 * ```js
 * // webpack.config.js
 * const { AiRouterPlugin } = require('ai-router-plugin-webpack');
 *
 * module.exports = {
 *   plugins: [
 *     new AiRouterPlugin({ dirs: ['src/pages'] }),
 *   ],
 * };
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

import fs from 'fs';
import path from 'path';
import {
  scanRoutes,
  generateRoutesModule,
  VIRTUAL_MODULE_ID,
  type PluginOptions,
} from '@ai-router/shared';

export type { PluginOptions } from '@ai-router/shared';

/** @internal */
const PLUGIN_NAME = 'AiRouterPlugin';

/** Minimal webpack compiler interface — avoids a hard dependency on `@types/webpack`. */
interface WebpackCompiler {
  context: string;
  options: {
    resolve?: {
      alias?: Record<string, string>;
    };
  };
  hooks: {
    beforeCompile: { tap(name: string, fn: () => void): void };
    environment: { tap(name: string, fn: () => void): void };
    watchRun: { tap(name: string, fn: () => void): void };
    normalModuleFactory: {
      tap(name: string, fn: (factory: NormalModuleFactory) => void): void;
    };
  };
}

/** Minimal NormalModuleFactory interface for request rewriting. */
interface NormalModuleFactory {
  hooks: {
    beforeResolve: {
      tap(name: string, fn: (resolveData: { request: string }) => void): void;
    };
  };
}

/**
 * webpack plugin that generates route config from the file system.
 *
 * Writes a generated module to `node_modules/.cache/ai-router/routes.js`
 * and aliases `virtual:ai-router` to it. Re-generates on watch rebuilds.
 *
 * @example
 * ```js
 * // Auto-scan + manual overrides
 * new AiRouterPlugin({
 *   dirs: ['src/pages'],
 *   routes: [
 *     { path: '/pricing', title: 'Pricing', description: 'cost, plans' },
 *   ],
 * });
 * ```
 */
export class AiRouterPlugin {
  private options: PluginOptions;

  /**
   * @param options - Directories to scan, file extensions, exclusions, and manual routes.
   */
  constructor(options: PluginOptions = {}) {
    this.options = options;
  }

  /**
   * Called by webpack to apply the plugin to the compiler.
   * @param compiler - webpack compiler instance.
   */
  apply(compiler: WebpackCompiler) {
    const root: string = compiler.context;
    const cacheDir = path.join(root, 'node_modules', '.cache', 'ai-router');
    const generatedFile = path.join(cacheDir, 'routes.js');
    const generatedDts = path.join(cacheDir, 'routes.d.ts');

    const writeRoutes = () => {
      fs.mkdirSync(cacheDir, { recursive: true });

      const routes = scanRoutes(root, this.options);
      fs.writeFileSync(generatedFile, generateRoutesModule(routes), 'utf-8');
      fs.writeFileSync(
        generatedDts,
        'export declare const routes: Array<{ path: string; title: string; description?: string }>;\n',
        'utf-8',
      );
    };

    // Generate before compilation starts
    compiler.hooks.beforeCompile.tap(PLUGIN_NAME, () => {
      writeRoutes();
    });

    // Rewrite `virtual:ai-router` → generated file path before webpack
    // attempts to resolve or read it. This avoids the "UnhandledSchemeError"
    // that webpack 5 throws for the `virtual:` URI scheme.
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (factory) => {
      factory.hooks.beforeResolve.tap(PLUGIN_NAME, (resolveData) => {
        if (resolveData.request === VIRTUAL_MODULE_ID) {
          resolveData.request = generatedFile;
        }
      });
    });

    // Re-generate on watch rebuild
    if (this.options.dirs?.length) {
      compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
        writeRoutes();
      });
    }
  }
}

/**
 * Standalone helper to get routes without the webpack plugin.
 *
 * Useful for custom build scripts or SSR setups where you need
 * the route array directly.
 *
 * @param root - Absolute path to the project root.
 * @param options - Scanning configuration.
 * @returns Array of discovered routes.
 *
 * @example
 * ```ts
 * const routes = getRoutes(__dirname, { dirs: ['src/pages'] });
 * ```
 */
export function getRoutes(root: string, options: PluginOptions = {}) {
  return scanRoutes(root, options);
}
