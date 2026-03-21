/**
 * File-system route scanner.
 *
 * Walks directories, discovers page files, and converts them into
 * {@link ScannedRoute} objects for use with `ai-router`.
 *
 * Supports metadata extraction via `@ai-route` comment annotations:
 * ```ts
 * // @ai-route { "title": "Pricing", "description": "Plans, cost, billing" }
 * export default function PricingPage() { ... }
 * ```
 *
 * @module
 */

import fs from 'fs';
import path from 'path';
import type { ScannedRoute, PluginOptions } from './types';
import { DEFAULT_EXTENSIONS, DEFAULT_EXCLUDE } from './types';

/**
 * Converts a file path to a URL route path.
 *
 * @param filePath - Absolute path to the page file.
 * @param dir - Absolute path of the scanned directory.
 * @returns URL path string.
 *
 * @example
 * ```
 * fileToRoutePath("src/pages/pricing.tsx", "src/pages")     → "/pricing"
 * fileToRoutePath("src/pages/about/team.tsx", "src/pages")  → "/about/team"
 * fileToRoutePath("src/pages/index.tsx", "src/pages")       → "/"
 * fileToRoutePath("app/blog/[slug]/page.tsx", "app")        → "/blog/[slug]"
 * ```
 *
 * @internal
 */
function fileToRoutePath(filePath: string, dir: string): string {
  let relative = path.relative(dir, filePath);
  // normalize separators
  relative = relative.replace(/\\/g, '/');

  // remove extension
  const ext = path.extname(relative);
  relative = relative.slice(0, -ext.length);

  // remove trailing /index or /page (Next.js app dir convention)
  relative = relative.replace(/\/(index|page)$/, '');

  // handle root index/page
  if (relative === 'index' || relative === 'page') {
    return '/';
  }

  return '/' + relative;
}

/**
 * Converts a route path to a human-readable title.
 *
 * @param routePath - URL path string.
 * @returns Capitalized title derived from the last path segment.
 *
 * @example
 * ```
 * pathToTitle("/about/our-team") → "Our Team"
 * pathToTitle("/pricing")        → "Pricing"
 * pathToTitle("/")               → "Home"
 * ```
 *
 * @internal
 */
function pathToTitle(routePath: string): string {
  if (routePath === '/') return 'Home';

  const lastSegment = routePath.split('/').filter(Boolean).pop() || '';

  // skip dynamic segments
  if (lastSegment.startsWith('[')) return lastSegment;

  return lastSegment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extracts route metadata from a file's `@ai-route` comment annotation.
 *
 * Looks for a comment matching:
 * ```
 * // @ai-route { "title": "...", "description": "..." }
 * ```
 * or
 * ```
 * /* @ai-route { "title": "...", "description": "..." } *​/
 * ```
 *
 * @param filePath - Absolute path to the file.
 * @returns Extracted title and/or description, or `{}` if not found.
 * @internal
 */
function extractMeta(filePath: string): { title?: string; description?: string } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(
      /\/[/*]\s*@ai-route\s*(\{[^}]+\})/,
    );
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch {
    // file read or parse error — skip
  }
  return {};
}

/**
 * Checks whether a file path matches any exclusion pattern.
 * @internal
 */
function shouldExclude(filePath: string, exclude: string[]): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return exclude.some((pattern) => normalized.includes(pattern));
}

/**
 * Recursively walks a directory and returns matching file paths.
 * @internal
 */
function walkDir(dir: string, extensions: string[], exclude: string[]): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldExclude(fullPath, exclude)) continue;

    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, extensions, exclude));
    } else if (extensions.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Scans directories for page files and returns route configurations.
 *
 * For each discovered file:
 * 1. Converts the file path to a URL route path.
 * 2. Attempts to extract `title` and `description` from an `@ai-route` annotation.
 * 3. Falls back to generating a title from the file name.
 *
 * Manual routes (from `options.routes`) take priority over scanned ones
 * when paths collide.
 *
 * @param root - Absolute path to the project root.
 * @param options - Scanning configuration.
 * @returns Array of discovered + manual routes.
 *
 * @example
 * ```ts
 * const routes = scanRoutes('/path/to/project', {
 *   dirs: ['src/pages'],
 *   routes: [
 *     { path: '/pricing', title: 'Pricing', description: 'custom override' },
 *   ],
 * });
 * ```
 */
export function scanRoutes(root: string, options: PluginOptions): ScannedRoute[] {
  const dirs = options.dirs || [];
  const extensions = options.extensions || DEFAULT_EXTENSIONS;
  const exclude = options.exclude || DEFAULT_EXCLUDE;
  const manual = options.routes || [];

  const scanned: ScannedRoute[] = [];

  for (const dir of dirs) {
    const absDir = path.resolve(root, dir);
    const files = walkDir(absDir, extensions, exclude);

    for (const file of files) {
      const routePath = fileToRoutePath(file, absDir);
      const meta = extractMeta(file);

      scanned.push({
        path: routePath,
        title: meta.title || pathToTitle(routePath),
        description: meta.description,
      });
    }
  }

  // manual routes override scanned ones by path
  const manualPaths = new Set(manual.map((r) => r.path));
  const merged = scanned.filter((r) => !manualPaths.has(r.path));
  merged.push(...manual);

  return merged;
}

/**
 * Generates JavaScript module code that exports a `routes` array.
 *
 * Used by bundler plugins to create the `virtual:ai-router` module content.
 *
 * @param routes - Array of routes to serialize.
 * @returns ES module source code string.
 *
 * @example
 * ```ts
 * generateRoutesModule([{ path: '/', title: 'Home' }]);
 * // → 'export const routes = [\n  { "path": "/", "title": "Home" }\n];\n'
 * ```
 */
export function generateRoutesModule(routes: ScannedRoute[]): string {
  return `export const routes = ${JSON.stringify(routes, null, 2)};\n`;
}
