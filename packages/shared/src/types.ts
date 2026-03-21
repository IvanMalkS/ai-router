/**
 * A route discovered by the file scanner or provided manually.
 *
 * @example
 * ```ts
 * const route: ScannedRoute = {
 *   path: '/pricing',
 *   title: 'Pricing',
 *   description: 'Plans, billing, subscription cost',
 * };
 * ```
 */
export interface ScannedRoute {
  /** URL path of the route (e.g. `"/pricing"`). */
  path: string;

  /** Human-readable page title used for semantic matching. */
  title: string;

  /** Optional description with keywords/synonyms for better accuracy. */
  description?: string;
}

/**
 * Options for ai-router bundler plugins.
 *
 * @example
 * ```ts
 * // Auto-scan pages directory
 * const options: PluginOptions = {
 *   dirs: ['src/pages'],
 * };
 *
 * // Manual routes + auto-scan (manual routes take priority)
 * const options: PluginOptions = {
 *   dirs: ['src/pages'],
 *   routes: [
 *     { path: '/pricing', title: 'Pricing', description: 'custom description' },
 *   ],
 * };
 * ```
 */
export interface PluginOptions {
  /**
   * Directories to scan for page files (relative to project root).
   *
   * @example `['src/pages']` or `['app']`
   */
  dirs?: string[];

  /**
   * File extensions to consider as pages.
   * @default ['.tsx', '.jsx', '.vue', '.svelte', '.astro', '.md', '.mdx']
   */
  extensions?: string[];

  /**
   * Manual routes — merged with scanned routes.
   * If a manual route has the same `path` as a scanned one,
   * the manual route takes priority.
   */
  routes?: ScannedRoute[];

  /**
   * Substrings to exclude from scanning.
   * Matched against the full file path (normalized to forward slashes).
   *
   * @default ['_app', '_document', '_layout', 'layout', 'loading', 'error', 'not-found', '__tests__', '__test__', '.test.', '.spec.']
   */
  exclude?: string[];
}

/**
 * Virtual module ID used in `import { routes } from 'virtual:ai-router'`.
 * @internal
 */
export const VIRTUAL_MODULE_ID = 'virtual:ai-router';

/**
 * Resolved virtual module ID (with null byte prefix for Vite/Rollup convention).
 * @internal
 */
export const RESOLVED_VIRTUAL_MODULE_ID = '\0virtual:ai-router';

/** Default file extensions considered as page files. */
export const DEFAULT_EXTENSIONS = ['.tsx', '.jsx', '.vue', '.svelte', '.astro', '.md', '.mdx'];

/** Default exclusion patterns for framework internal files. */
export const DEFAULT_EXCLUDE = [
  '_app',
  '_document',
  '_layout',
  'layout',
  'loading',
  'error',
  'not-found',
  '__tests__',
  '__test__',
  '.test.',
  '.spec.',
];
