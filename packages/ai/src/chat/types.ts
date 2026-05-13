/**
 * Chat Types
 */

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    sources?: Array<{
      id: string;
      content: string;
      score: number;
    }>;
  };
}

export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatConfig {
  systemPrompt?: string;
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  maxMessages?: number; // Context window limit
}

export interface SendMessageOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}
