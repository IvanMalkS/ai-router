/**
 * Configuration for a single route entry.
 *
 * @example
 * ```ts
 * const route: RouteConfig = {
 *   path: '/pricing',
 *   title: 'Pricing',
 *   description: 'Plans, pricing, billing, subscription',
 * };
 * ```
 */
export interface RouteConfig {
  /** URL path of the route (e.g. `"/pricing"`, `"/about/team"`). */
  path: string;

  /** Human-readable title used for semantic matching. */
  title: string;

  /**
   * Optional description with keywords/synonyms to improve search accuracy.
   * The more context you provide, the better the matching quality.
   */
  description?: string;
}

/**
 * Options for creating a {@link SmartRouter} instance.
 *
 * @example
 * ```ts
 * const options: RouteOptions = {
 *   routes: [
 *     { path: '/pricing', title: 'Pricing', description: 'cost, plans' },
 *     { path: '/contact', title: 'Contact', description: 'support, phone' },
 *   ],
 *   model: 'Xenova/all-MiniLM-L6-v2',
 *   threshold: 0.5,
 * };
 * ```
 */
export interface RouteOptions {
  /** Array of routes to index for semantic search. */
  routes: RouteConfig[];

  /**
   * HuggingFace model ID for generating embeddings.
   * Must produce 384-dimensional vectors.
   * @default "Xenova/all-MiniLM-L6-v2"
   */
  model?: string;

  /**
   * Minimum similarity score (0–1) for a result to be returned.
   * Results below this threshold are discarded.
   * @default 0.5
   */
  threshold?: number;
}

/**
 * Result returned by {@link SmartRouter.search}.
 * Contains the best matching route path and its similarity score.
 */
export interface SearchResult {
  /** URL path of the matched route. */
  path: string;

  /** Similarity score between 0 and 1 (higher = better match). */
  score: number;
}

// ──────────────────────────────────────────────
// Worker message protocol (internal)
// ──────────────────────────────────────────────

/** @internal Messages sent from main thread to worker. */
export type WorkerInMessage =
  | {
      type: 'INIT';
      routes: RouteConfig[];
      model: string;
      threshold: number;
    }
  | {
      type: 'SEARCH';
      id: string;
      query: string;
    }
  | {
      type: 'DESTROY';
    };

/** @internal Messages sent from worker to main thread. */
export type WorkerOutMessage =
  | {
      type: 'READY';
    }
  | {
      type: 'INIT_ERROR';
      error: string;
    }
  | {
      type: 'SEARCH_RESULT';
      id: string;
      result: SearchResult | null;
    }
  | {
      type: 'SEARCH_ERROR';
      id: string;
      error: string;
    };
