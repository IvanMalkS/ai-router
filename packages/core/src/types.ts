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
   * HuggingFace model ID (or an ordered array of IDs) for generating embeddings.
   * Must produce 384-dimensional vectors.
   *
   * When an array is provided, the first model is loaded and used immediately.
   * Heavier models are downloaded in the background; once ready, the router
   * hot-swaps to the next model and re-indexes all routes automatically.
   *
   * @default "Xenova/all-MiniLM-L6-v2"
   *
   * @example
   * ```ts
   * // Start fast with a light model, upgrade to a better one in the background
   * model: ['Xenova/all-MiniLM-L6-v2', 'Xenova/multilingual-e5-small']
   * ```
   */
  model?: string | string[];

  /**
   * Called each time the router upgrades to the next model in the chain.
   * Only relevant when {@link model} is an array with more than one entry.
   *
   * @param modelId - The HuggingFace model ID that just became active.
   */
  onModelUpgrade?: (modelId: string) => void;

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
      models: string[];
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
      type: 'MODEL_UPGRADED';
      model: string;
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
