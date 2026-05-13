/**
 * RAG Types
 */

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

export interface SearchResult {
  document: Document;
  score: number;
  highlights?: string[];
}

export interface VectorStoreConfig {
  type: "memory" | "cloudflare-vectorize" | "pinecone";
  namespace?: string;
  dimensions?: number;
}

export interface VectorStore {
  add(documents: Document[]): Promise<void>;
  search(query: number[], topK?: number): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface RAGConfig {
  vectorStore: VectorStore;
  topK?: number;
  minScore?: number;
  systemPrompt?: string;
  includeMetadata?: boolean;
}

export interface AnswerResult {
  answer: string;
  sources: SearchResult[];
  confidence: number;
}
