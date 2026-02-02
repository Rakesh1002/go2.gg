"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

interface ChatContainerProps {
  title?: string;
  placeholder?: string;
  systemPrompt?: string;
  className?: string;
  onSendMessage?: (message: string) => Promise<void>;
  apiEndpoint?: string;
}

export function ChatContainer({
  title = "AI Assistant",
  placeholder = "Type a message...",
  systemPrompt,
  className,
  onSendMessage,
  apiEndpoint = "/api/ai/chat",
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // If custom handler provided, use it
    if (onSendMessage) {
      setIsLoading(true);
      try {
        await onSendMessage(content);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Default: call API endpoint with streaming
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Not JSON, might be plain text
                fullContent += data;
                setStreamingContent(fullContent);
              }
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <Card className={cn("flex h-[600px] flex-col", className)}>
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isLoading={isLoading}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput placeholder={placeholder} onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </Card>
  );
}
