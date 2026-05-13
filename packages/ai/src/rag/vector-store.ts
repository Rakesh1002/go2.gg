/**
 * Vector Store Implementations
 */

import type { Document, SearchResult, VectorStore, VectorStoreConfig } from "./types.js";

/**
 * Calculate cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-memory vector store for development and testing.
 */
export class MemoryVectorStore implements VectorStore {
  private documents: Map<string, Document> = new Map();

  async add(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      if (!doc.embedding) {
        throw new Error(`Document ${doc.id} is missing embedding`);
      }
      this.documents.set(doc.id, doc);
    }
  }

  async search(query: number[], topK = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;

      const score = cosineSimilarity(query, doc.embedding);
      results.push({ document: doc, score });
    }

    // Sort by score (descending) and take top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.documents.delete(id);
    }
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  // Helper method to get all documents
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }
}

/**
 * Cloudflare Vectorize store adapter.
 * Requires a Vectorize index binding.
 */
export class CloudflareVectorStore implements VectorStore {
  private vectorize: VectorizeIndex;
  private namespace: string;

  constructor(vectorize: VectorizeIndex, namespace = "default") {
    this.vectorize = vectorize;
    this.namespace = namespace;
  }

  async add(documents: Document[]): Promise<void> {
    const vectors = documents.map((doc) => ({
      id: doc.id,
      values: doc.embedding!,
      metadata: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    await this.vectorize.upsert(vectors);
  }

  async search(query: number[], topK = 5): Promise<SearchResult[]> {
    const results = await this.vectorize.query(query, {
      topK,
      returnMetadata: "all",
    });

    return results.matches.map((match) => ({
      document: {
        id: match.id,
        content: (match.metadata?.content as string) || "",
        metadata: match.metadata,
        embedding: match.values,
      },
      score: match.score,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    await this.vectorize.deleteByIds(ids);
  }

  async clear(): Promise<void> {
    // Vectorize doesn't have a clear all method
    // You would need to delete by namespace or recreate the index
    console.warn("Clear not fully implemented for Cloudflare Vectorize");
  }
}

/**
 * Create a vector store based on configuration.
 */
export function createVectorStore(config: VectorStoreConfig): VectorStore {
  switch (config.type) {
    case "memory":
      return new MemoryVectorStore();
    case "cloudflare-vectorize":
      throw new Error(
        "Cloudflare Vectorize requires a binding - use CloudflareVectorStore directly"
      );
    case "pinecone":
      throw new Error("Pinecone not yet implemented");
    default:
      return new MemoryVectorStore();
  }
}

// TypeScript interface for Cloudflare Vectorize
interface VectorizeIndex {
  upsert(
    vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>
  ): Promise<void>;
  query(
    vector: number[],
    options: { topK: number; returnMetadata?: "all" | "indexed" | "none" }
  ): Promise<{
    matches: Array<{
      id: string;
      score: number;
      values?: number[];
      metadata?: Record<string, unknown>;
    }>;
  }>;
  deleteByIds(ids: string[]): Promise<void>;
}
