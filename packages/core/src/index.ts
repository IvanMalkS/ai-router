import type { RouteOptions, SearchResult, WorkerOutMessage } from './types';

export type { RouteConfig, RouteOptions, SearchResult } from './types';

// @ts-ignore — bundled at build time by tsup
import WorkerCode from './worker.ts?worker_code';

/** @internal */
const isBrowser = typeof Worker !== 'undefined' && typeof Blob !== 'undefined';

/**
 * Creates a Web Worker from an inline Blob.
 * Avoids `new URL(...)` issues on iOS Safari and restrictive CSP environments.
 * @internal
 */
function createBlobWorker(): Worker {
  const blob = new Blob([WorkerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url, { type: 'module' });
  URL.revokeObjectURL(url);
  return worker;
}

/**
 * AI-powered semantic search router.
 *
 * Runs a HuggingFace embedding model inside a Web Worker and uses
 * Orama's hybrid (text + vector) search to find the best matching
 * route for a natural-language query.
 *
 * **SSR-safe**: on the server (Node.js), the instance is created
 * without a worker. `ready` resolves immediately and `search()`
 * always returns `null`. The worker is only spawned in the browser.
 *
 * @example
 * ```ts
 * import { SmartRouter } from 'ai-router';
 *
 * const router = new SmartRouter({
 *   routes: [
 *     { path: '/pricing', title: 'Pricing', description: 'cost, plans, subscription' },
 *     { path: '/contact', title: 'Contact', description: 'support, phone, address' },
 *   ],
 *   // Start with a fast lightweight model, then upgrade to a better one in the background
 *   model: ['Xenova/all-MiniLM-L6-v2', 'Xenova/multilingual-e5-small'],
 *   threshold: 0.5,
 *   onModelUpgrade: (modelId) => console.log(`Upgraded to ${modelId}`),
 * });
 *
 * // Wait for the first (lightest) model to load — ready to search immediately
 * await router.ready;
 *
 * // Search by meaning — typos and synonyms work too
 * const result = await router.search('how much does it cost?');
 * // → { path: '/pricing', score: 0.87 }
 *
 * // Cleanup when done
 * router.destroy();
 * ```
 */
export class SmartRouter {
  private worker: Worker | null = null;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private rejectReady!: (error: Error) => void;
  private pendingSearches = new Map<
    string,
    { resolve: (result: SearchResult | null) => void; reject: (error: Error) => void }
  >();
  private destroyed = false;
  private readonly ssr: boolean;
  private onModelUpgrade?: (modelId: string) => void;

  /**
   * Creates a new SmartRouter instance.
   *
   * Spawns a Web Worker, downloads the embedding model, and indexes
   * all provided routes. The instance is usable after {@link ready} resolves.
   *
   * In a server environment (no `Worker` API), the instance is inert:
   * `ready` resolves immediately and `search()` returns `null`.
   *
   * @param options - Routes to index, model ID, and similarity threshold.
   */
  constructor(options: RouteOptions) {
    this.ssr = !isBrowser;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    if (this.ssr) {
      this.resolveReady();
      return;
    }

    this.onModelUpgrade = options.onModelUpgrade;
    this.initWorker(options);
  }

  /**
   * Promise that resolves when the model is loaded and routes are indexed.
   * Rejects if initialization fails (e.g. network error, invalid model).
   * Resolves immediately on the server.
   *
   * @example
   * ```ts
   * await router.ready;
   * console.log('Model loaded, ready to search');
   * ```
   */
  get ready(): Promise<void> {
    return this.readyPromise;
  }

  /** @internal Initializes the worker and sends the INIT message. */
  private initWorker(options: RouteOptions) {
    try {
      this.worker = createBlobWorker();
    } catch {
      this.rejectReady(new Error('Failed to create worker'));
      return;
    }

    this.worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      try {
        const msg = event.data;

        switch (msg.type) {
          case 'READY':
            this.resolveReady();
            break;

          case 'INIT_ERROR':
            this.rejectReady(new Error(msg.error));
            break;

          case 'MODEL_UPGRADED':
            this.onModelUpgrade?.(msg.model);
            break;

          case 'SEARCH_RESULT': {
            const pending = this.pendingSearches.get(msg.id);
            if (pending) {
              this.pendingSearches.delete(msg.id);
              pending.resolve(msg.result);
            }
            break;
          }

          case 'SEARCH_ERROR': {
            const pending = this.pendingSearches.get(msg.id);
            if (pending) {
              this.pendingSearches.delete(msg.id);
              pending.reject(new Error(msg.error));
            }
            break;
          }
        }
      } catch {
        // Never let message handler errors escape to DOM
      }
    };

    this.worker.onerror = (event) => {
      try {
        event.preventDefault();
        const error = new Error(event.message || 'Worker crashed');
        this.rejectReady(error);
        this.rejectAllPending(error);
      } catch {
        // Swallow — prevent DOM error propagation on iOS
      }
    };

    try {
      const models = Array.isArray(options.model)
        ? options.model
        : [options.model || 'Xenova/all-MiniLM-L6-v2'];

      this.worker.postMessage({
        type: 'INIT',
        routes: options.routes,
        models,
        threshold: options.threshold ?? 0.5,
      });
    } catch {
      this.rejectReady(new Error('Failed to send INIT message'));
    }
  }

  /**
   * Finds the best matching route for a natural-language query.
   *
   * Waits for {@link ready} automatically, so it's safe to call
   * right after construction — the first search will just take longer.
   *
   * Returns `null` during SSR (server-side rendering).
   *
   * @param query - Free-text search query (e.g. "how to contact support").
   * @returns The best matching route, or `null` if no route meets the threshold.
   * @throws If the router has been {@link destroy destroyed} or the worker crashes.
   *
   * @example
   * ```ts
   * const result = await router.search('where are your offices?');
   * if (result) {
   *   window.location.href = result.path; // "/contact"
   * }
   * ```
   */
  async search(query: string): Promise<SearchResult | null> {
    if (this.ssr) return null;

    if (this.destroyed) {
      throw new Error('SmartRouter has been destroyed');
    }

    await this.readyPromise;

    if (!this.worker) {
      throw new Error('Worker is not initialized');
    }

    return new Promise<SearchResult | null>((resolve, reject) => {
      const id = Math.random().toString(36).slice(2, 11);

      this.pendingSearches.set(id, { resolve, reject });

      try {
        this.worker!.postMessage({ type: 'SEARCH', id, query });
      } catch {
        this.pendingSearches.delete(id);
        reject(new Error('Failed to send SEARCH message'));
      }
    });
  }

  /**
   * Terminates the worker and rejects all pending searches.
   *
   * After calling `destroy()`, the instance is no longer usable.
   * Calling `destroy()` multiple times is safe (no-op after the first call).
   *
   * @example
   * ```ts
   * // In a SPA, destroy when navigating away
   * onUnmount(() => router.destroy());
   * ```
   */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.rejectAllPending(new Error('SmartRouter destroyed'));

    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'DESTROY' });
        this.worker.terminate();
      } catch {
        // Worker may already be dead — ignore
      }
      this.worker = null;
    }
  }

  /** @internal Rejects all pending search promises with the given error. */
  private rejectAllPending(error: Error) {
    for (const pending of this.pendingSearches.values()) {
      pending.reject(error);
    }
    this.pendingSearches.clear();
  }
}
