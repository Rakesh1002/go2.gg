/**
 * RAG (Retrieval-Augmented Generation) Module
 */

export { chunkText, chunkDocument, chunkDocuments } from "./chunker.js";
export {
  MemoryVectorStore,
  CloudflareVectorStore,
  createVectorStore,
} from "./vector-store.js";
export { Retriever, createRetriever, type RetrieverConfig } from "./retriever.js";
export {
  AnswerEngine,
  createAnswerEngine,
  type AnswerEngineConfig,
} from "./answer-engine.js";
export type {
  Document,
  ChunkOptions,
  SearchResult,
  VectorStore,
  VectorStoreConfig,
  RAGConfig,
  AnswerResult,
} from "./types.js";
