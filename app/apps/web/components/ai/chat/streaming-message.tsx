"use client";

import { useState, useEffect } from "react";

interface StreamingMessageProps {
  content: string;
  showCursor?: boolean;
}

export function StreamingMessage({ content, showCursor = true }: StreamingMessageProps) {
  const [displayContent, setDisplayContent] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  // Update display content when content changes
  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  // Blinking cursor effect
  useEffect(() => {
    if (!showCursor) return;

    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);

    return () => clearInterval(interval);
  }, [showCursor]);

  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="whitespace-pre-wrap text-sm">
        {displayContent}
        {showCursor && (
          <span
            className={`inline-block h-4 w-[2px] bg-foreground transition-opacity ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </p>
    </div>
  );
}
