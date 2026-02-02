/**
 * RAG Retriever
 *
 * Retrieves relevant documents for a query.
 */

import type { AIRouter } from "../router.js";
import type { Document, SearchResult, VectorStore } from "./types.js";
import { chunkDocuments, type ChunkOptions } from "./chunker.js";

export interface RetrieverConfig {
  vectorStore: VectorStore;
  aiRouter: AIRouter;
  topK?: number;
  minScore?: number;
  chunkOptions?: ChunkOptions;
}

export class Retriever {
  private vectorStore: VectorStore;
  private aiRouter: AIRouter;
  private topK: number;
  private minScore: number;
  private chunkOptions: ChunkOptions;

  constructor(config: RetrieverConfig) {
    this.vectorStore = config.vectorStore;
    this.aiRouter = config.aiRouter;
    this.topK = config.topK ?? 5;
    this.minScore = config.minScore ?? 0.7;
    this.chunkOptions = config.chunkOptions ?? {};
  }

  /**
   * Add documents to the retriever.
   * Documents will be chunked and embedded.
   */
  async addDocuments(documents: Document[]): Promise<void> {
    // Chunk documents
    const chunks = chunkDocuments(documents, this.chunkOptions);

    // Generate embeddings for each chunk
    const embeddedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const result = await this.aiRouter.embed(chunk.content);
        return {
          ...chunk,
          embedding: result.embedding,
        };
      })
    );

    // Add to vector store
    await this.vectorStore.add(embeddedChunks);
  }

  /**
   * Retrieve relevant documents for a query.
   */
  async retrieve(query: string): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.aiRouter.embed(query);

    // Search vector store
    const results = await this.vectorStore.search(queryEmbedding.embedding, this.topK);

    // Filter by minimum score
    return results.filter((result) => result.score >= this.minScore);
  }

  /**
   * Delete documents by ID.
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.vectorStore.delete(ids);
  }

  /**
   * Clear all documents.
   */
  async clear(): Promise<void> {
    await this.vectorStore.clear();
  }
}

/**
 * Create a retriever instance.
 */
export function createRetriever(config: RetrieverConfig): Retriever {
  return new Retriever(config);
}
