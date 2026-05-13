/**
 * Answer Engine
 *
 * RAG-based question answering with citations.
 */

import type { AIRouter } from "../router.js";
import type { ChatMessage, CompletionOptions } from "../types.js";
import type { Retriever } from "./retriever.js";
import type { AnswerResult, SearchResult } from "./types.js";

export interface AnswerEngineConfig {
  retriever: Retriever;
  aiRouter: AIRouter;
  systemPrompt?: string;
  includeSourcesInPrompt?: boolean;
  maxSources?: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided context.

Instructions:
- Only use information from the provided context to answer questions
- If the context doesn't contain enough information, say so
- Cite your sources by referring to the document numbers [1], [2], etc.
- Be concise and accurate
- If you're not sure, express uncertainty`;

export class AnswerEngine {
  private retriever: Retriever;
  private aiRouter: AIRouter;
  private systemPrompt: string;
  private includeSourcesInPrompt: boolean;
  private maxSources: number;

  constructor(config: AnswerEngineConfig) {
    this.retriever = config.retriever;
    this.aiRouter = config.aiRouter;
    this.systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    this.includeSourcesInPrompt = config.includeSourcesInPrompt ?? true;
    this.maxSources = config.maxSources ?? 5;
  }

  /**
   * Answer a question using RAG.
   */
  async answer(question: string, options: CompletionOptions = {}): Promise<AnswerResult> {
    // Retrieve relevant documents
    const sources = await this.retriever.retrieve(question);
    const topSources = sources.slice(0, this.maxSources);

    // Build context from sources
    const context = this.buildContext(topSources);

    // Generate answer
    const messages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
      {
        role: "user",
        content: this.buildPrompt(question, context),
      },
    ];

    const result = await this.aiRouter.complete(messages, options);

    // Calculate confidence based on source scores
    const confidence = this.calculateConfidence(topSources);

    return {
      answer: result.content,
      sources: topSources,
      confidence,
    };
  }

  /**
   * Stream an answer using RAG.
   */
  async *streamAnswer(
    question: string,
    options: CompletionOptions = {}
  ): AsyncGenerator<{
    chunk: string;
    done: boolean;
    sources?: SearchResult[];
    confidence?: number;
  }> {
    // Retrieve relevant documents
    const sources = await this.retriever.retrieve(question);
    const topSources = sources.slice(0, this.maxSources);

    // Build context from sources
    const context = this.buildContext(topSources);

    // Generate answer
    const messages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
      {
        role: "user",
        content: this.buildPrompt(question, context),
      },
    ];

    for await (const chunk of this.aiRouter.stream(messages, options)) {
      if (chunk.done) {
        const confidence = this.calculateConfidence(topSources);
        yield {
          chunk: "",
          done: true,
          sources: topSources,
          confidence,
        };
      } else {
        yield { chunk: chunk.content, done: false };
      }
    }
  }

  private buildContext(sources: SearchResult[]): string {
    if (sources.length === 0) {
      return "No relevant documents found.";
    }

    return sources
      .map((source, index) => {
        const metadata = source.document.metadata
          ? `\nMetadata: ${JSON.stringify(source.document.metadata)}`
          : "";
        return `[${index + 1}] ${source.document.content}${metadata}`;
      })
      .join("\n\n---\n\n");
  }

  private buildPrompt(question: string, context: string): string {
    if (this.includeSourcesInPrompt) {
      return `Context:
${context}

Question: ${question}

Please answer the question based on the context above. Cite your sources using [1], [2], etc.`;
    }

    return question;
  }

  private calculateConfidence(sources: SearchResult[]): number {
    if (sources.length === 0) return 0;

    // Average of top source scores
    const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;

    // Normalize to 0-1 range (assuming scores are already 0-1)
    return Math.min(Math.max(avgScore, 0), 1);
  }

  /**
   * Add documents to the knowledge base.
   */
  async addDocuments(
    documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
  ): Promise<void> {
    await this.retriever.addDocuments(documents);
  }
}

/**
 * Create an answer engine instance.
 */
export function createAnswerEngine(config: AnswerEngineConfig): AnswerEngine {
  return new AnswerEngine(config);
}
