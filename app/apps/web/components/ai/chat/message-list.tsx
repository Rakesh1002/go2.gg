"use client";

import { User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { StreamingMessage } from "./streaming-message";
import type { Message } from "./chat-container";

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  isLoading?: boolean;
}

export function MessageList({ messages, streamingContent, isLoading }: MessageListProps) {
  if (messages.length === 0 && !streamingContent) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="font-medium">Start a conversation</h3>
        <p className="text-sm text-muted-foreground">
          Ask me anything and I'll do my best to help.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages
        .filter((m) => m.role !== "system")
        .map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

      {/* Streaming message */}
      {streamingContent && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <StreamingMessage content={streamingContent} />
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !streamingContent && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: "0.1s" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <span className="mt-1 block text-xs opacity-70">
          {message.createdAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
