import fs from 'fs';
import path from 'path';
import { withAiRouter } from 'ai-router-plugin-next';

const nextConfig = {
  output: 'export' as const,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
  images: { unoptimized: true },
};

// Map page key in i18n JSON → route path
const routeMap: Record<string, { path: string; keys: string[] }> = {
  home:           { path: '/',                keys: ['hero', 'subtitle'] },
  gettingStarted: { path: '/getting-started', keys: ['title', 'intro'] },
  apiReference:   { path: '/api-reference',   keys: ['title', 'smartRouterDesc', 'searchDesc'] },
  plugins:        { path: '/plugins',         keys: ['title', 'intro', 'viteTitle', 'webpackTitle', 'nextTitle'] },
  examples:       { path: '/examples',        keys: ['title', 'intro', 'liveSearchTitle'] },
};

// Read all locale JSONs and merge descriptions per route
function buildRoutes() {
  const localesDir = path.join(__dirname, 'src/shared/i18n/locales');
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));

  const descriptions = new Map<string, string[]>();

  for (const file of files) {
    const dict = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));

    for (const [section, { path: routePath, keys }] of Object.entries(routeMap)) {
      const sectionData = dict[section];
      if (!sectionData) continue;

      const texts = keys
        .map((k) => sectionData[k])
        .filter(Boolean);

      if (texts.length) {
        const existing = descriptions.get(routePath) || [];
        existing.push(...texts);
        descriptions.set(routePath, existing);
      }
    }
  }

  return Array.from(descriptions.entries()).map(([routePath, texts]) => ({
    path: routePath,
    title: texts[0],
    description: texts.join(', '),
  }));
}

export default withAiRouter(nextConfig, {
  routes: buildRoutes(),
});
