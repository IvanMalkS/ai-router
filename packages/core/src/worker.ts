/**
 * Web Worker for ai-router.
 *
 * Runs in a separate thread. Responsibilities:
 * 1. Loads a HuggingFace `feature-extraction` pipeline (ONNX model).
 * 2. Indexes provided routes into an Orama vector database.
 * 3. Handles hybrid (text + vector) search queries.
 *
 * All errors are caught — nothing escapes to the DOM.
 * @module
 * @internal
 */

import { pipeline, env, Tensor } from '@huggingface/transformers';
import { create, insert, search, AnyOrama } from '@orama/orama';
import type { WorkerInMessage, WorkerOutMessage } from './types';

env.allowLocalModels = false;

/** Callable returned by `pipeline('feature-extraction', ...)`. */
type FeatureExtractor = (text: string, options: { pooling: 'mean' | 'none' | 'cls'; normalize: boolean }) => Promise<Tensor>;

let db: AnyOrama;
let extractor: FeatureExtractor;
let threshold = 0.5;

/**
 * Safely posts a message back to the main thread.
 * Silently swallows errors if the worker context is already dead (e.g. iOS kill).
 */
function post(message: WorkerOutMessage) {
  try {
    self.postMessage(message);
  } catch {
    // postMessage failed (worker terminated / iOS killed context) — silently ignore
  }
}

/**
 * Generates a 384-dimensional embedding vector for the given text
 * using the loaded HuggingFace `feature-extraction` pipeline.
 *
 * @param text - Input text to embed.
 * @returns Normalized embedding vector.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  try {
    const msg = event.data;

    switch (msg.type) {
      case 'INIT': {
        try {
          threshold = msg.threshold;

          extractor = await pipeline('feature-extraction', msg.model) as unknown as FeatureExtractor;

          db = await create({
            schema: {
              path: 'string',
              title: 'string',
              description: 'string',
              embedding: 'vector[384]',
            },
          });

          for (const route of msg.routes) {
            const textToEmbed = `${route.title}. ${route.description || ''}`;
            const embedding = await generateEmbedding(textToEmbed);

            await insert(db, {
              path: route.path,
              title: route.title,
              description: route.description || '',
              embedding,
            });
          }

          post({ type: 'READY' });
        } catch (error: unknown) {
          post({ type: 'INIT_ERROR', error: error instanceof Error ? error.message : 'Unknown init error' });
        }
        break;
      }

      case 'SEARCH': {
        try {
          const queryEmbedding = await generateEmbedding(msg.query);

          const results = await search(db, {
            term: msg.query,
            mode: 'hybrid',
            vector: {
              value: queryEmbedding,
              property: 'embedding',
            },
            similarity: threshold,
            limit: 1,
          });

          let result = null;

          if (results.hits.length > 0) {
            const bestHit = results.hits[0];
            if (bestHit.score >= threshold) {
              result = {
                path: bestHit.document.path as string,
                score: bestHit.score,
              };
            }
          }

          post({ type: 'SEARCH_RESULT', id: msg.id, result });
        } catch (error: unknown) {
          post({ type: 'SEARCH_ERROR', id: msg.id, error: error instanceof Error ? error.message : 'Unknown search error' });
        }
        break;
      }

      case 'DESTROY': {
        try {
          self.close();
        } catch {
          // iOS may throw on self.close() — ignore
        }
        break;
      }
    }
  } catch {
    // Top-level guard: never let unhandled errors escape to DOM
  }
};
