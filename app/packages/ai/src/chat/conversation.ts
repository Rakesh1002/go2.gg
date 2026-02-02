/**
 * Conversation Manager
 */

import type { AIRouter } from "../router.js";
import type { ChatMessage, CompletionOptions } from "../types.js";
import type { Message, Conversation, ChatConfig, SendMessageOptions } from "./types.js";

export class ConversationManager {
  private aiRouter: AIRouter;
  private config: ChatConfig;
  private conversations: Map<string, Conversation> = new Map();

  constructor(aiRouter: AIRouter, config: ChatConfig = {}) {
    this.aiRouter = aiRouter;
    this.config = {
      maxMessages: 50,
      temperature: 0.7,
      ...config,
    };
  }

  /**
   * Create a new conversation.
   */
  createConversation(id?: string, title?: string): Conversation {
    const conversation: Conversation = {
      id: id || crypto.randomUUID(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add system message if configured
    if (this.config.systemPrompt) {
      conversation.messages.push({
        id: crypto.randomUUID(),
        role: "system",
        content: this.config.systemPrompt,
        createdAt: new Date(),
      });
    }

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Get a conversation by ID.
   */
  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  /**
   * Send a message and get a response.
   */
  async sendMessage(
    conversationId: string,
    content: string,
    options: SendMessageOptions = {}
  ): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    conversation.messages.push(userMessage);

    // Prepare messages for AI
    const messages = this.prepareMessages(conversation);

    // Get completion
    const completionOptions: CompletionOptions = {
      model: this.config.model,
      provider: this.config.provider as any,
      temperature: options.temperature ?? this.config.temperature,
      maxTokens: options.maxTokens ?? this.config.maxTokens,
    };

    const result = await this.aiRouter.complete(messages, completionOptions);

    // Add assistant message
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.content,
      createdAt: new Date(),
      metadata: {
        model: result.model,
        provider: result.provider,
        tokens: result.usage?.totalTokens,
      },
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();

    // Trim messages if needed
    this.trimMessages(conversation);

    return assistantMessage;
  }

  /**
   * Stream a message response.
   */
  async *streamMessage(
    conversationId: string,
    content: string,
    options: SendMessageOptions = {}
  ): AsyncGenerator<{ chunk: string; done: boolean; message?: Message }> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    conversation.messages.push(userMessage);

    // Prepare messages for AI
    const messages = this.prepareMessages(conversation);

    // Get streaming completion
    const completionOptions: CompletionOptions = {
      model: this.config.model,
      provider: this.config.provider as any,
      temperature: options.temperature ?? this.config.temperature,
      maxTokens: options.maxTokens ?? this.config.maxTokens,
    };

    let fullContent = "";

    for await (const chunk of this.aiRouter.stream(messages, completionOptions)) {
      if (chunk.done) {
        // Add assistant message
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          createdAt: new Date(),
        };
        conversation.messages.push(assistantMessage);
        conversation.updatedAt = new Date();

        // Trim messages if needed
        this.trimMessages(conversation);

        yield { chunk: "", done: true, message: assistantMessage };
      } else {
        fullContent += chunk.content;
        yield { chunk: chunk.content, done: false };
      }
    }
  }

  /**
   * Delete a conversation.
   */
  deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
  }

  /**
   * Get all conversations.
   */
  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  private prepareMessages(conversation: Conversation): ChatMessage[] {
    return conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  private trimMessages(conversation: Conversation): void {
    const maxMessages = this.config.maxMessages ?? 50;

    if (conversation.messages.length > maxMessages) {
      // Keep system message if present
      const systemMessage = conversation.messages.find((m) => m.role === "system");
      const otherMessages = conversation.messages.filter((m) => m.role !== "system");

      // Keep the most recent messages
      const trimmedMessages = otherMessages.slice(-maxMessages + (systemMessage ? 1 : 0));

      conversation.messages = systemMessage ? [systemMessage, ...trimmedMessages] : trimmedMessages;
    }
  }
}

/**
 * Create a conversation manager.
 */
export function createConversationManager(
  aiRouter: AIRouter,
  config?: ChatConfig
): ConversationManager {
  return new ConversationManager(aiRouter, config);
}
