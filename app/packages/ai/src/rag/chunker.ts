/**
 * Text Chunker
 *
 * Splits documents into chunks for embedding.
 */

import type { ChunkOptions, Document } from "./types.js";

// Re-export for convenience
export type { ChunkOptions };

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

/**
 * Split text into chunks with overlap.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
    separator = "\n\n",
  } = options;

  // First, try to split by separator
  const segments = text.split(separator);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const segment of segments) {
    if (currentChunk.length + segment.length + separator.length <= chunkSize) {
      currentChunk += (currentChunk ? separator : "") + segment;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // If segment is larger than chunk size, split it further
      if (segment.length > chunkSize) {
        const words = segment.split(" ");
        currentChunk = "";

        for (const word of words) {
          if (currentChunk.length + word.length + 1 <= chunkSize) {
            currentChunk += (currentChunk ? " " : "") + word;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = word;
          }
        }
      } else {
        currentChunk = segment;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Add overlap between chunks
  if (chunkOverlap > 0 && chunks.length > 1) {
    const overlappedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        overlappedChunks.push(chunks[i]!);
      } else {
        // Get overlap from previous chunk
        const prevChunk = chunks[i - 1]!;
        const overlapText = prevChunk.slice(-chunkOverlap);
        overlappedChunks.push(overlapText + " " + chunks[i]!);
      }
    }

    return overlappedChunks;
  }

  return chunks;
}

/**
 * Chunk a document into multiple documents.
 */
export function chunkDocument(doc: Document, options: ChunkOptions = {}): Document[] {
  const chunks = chunkText(doc.content, options);

  return chunks.map((chunk, index) => ({
    id: `${doc.id}-chunk-${index}`,
    content: chunk,
    metadata: {
      ...doc.metadata,
      parentId: doc.id,
      chunkIndex: index,
      totalChunks: chunks.length,
    },
  }));
}

/**
 * Chunk multiple documents.
 */
export function chunkDocuments(docs: Document[], options: ChunkOptions = {}): Document[] {
  return docs.flatMap((doc) => chunkDocument(doc, options));
}
