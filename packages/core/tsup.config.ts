import { defineConfig } from 'tsup';
import { build } from 'esbuild';
import { Plugin } from 'esbuild';
import path from 'path';

function inlineWorkerPlugin(): Plugin {
  return {
    name: 'inline-worker',
    setup(build_ctx) {
      build_ctx.onResolve({ filter: /\?worker_code$/ }, (args) => {
        const filePath = path.resolve(
          path.dirname(args.importer),
          args.path.replace('?worker_code', ''),
        );
        return { path: filePath, namespace: 'inline-worker' };
      });

      build_ctx.onLoad({ filter: /.*/, namespace: 'inline-worker' }, async (args) => {
        const result = await build({
          entryPoints: [args.path],
          bundle: true,
          format: 'esm',
          write: false,
          minify: true,
          target: 'es2020',
          // Dependencies must be bundled INTO the worker since it runs
          // as an inline Blob URL without access to node_modules.
        });

        const code = result.outputFiles[0].text;
        return {
          contents: `export default ${JSON.stringify(code)};`,
          loader: 'js',
        };
      });
    },
  };
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  esbuildPlugins: [inlineWorkerPlugin()],
});
