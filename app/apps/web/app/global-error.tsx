"use client";

/**
 * Global Error Boundary (Root Layout Level)
 *
 * This catches errors in the root layout and other top-level errors.
 * Unlike the regular error boundary, this must include its own html/body tags.
 */

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold text-red-600">Critical Error</h1>
            <p className="mt-4 text-gray-600">
              The application encountered a critical error and cannot continue.
            </p>
            {error.digest && <p className="mt-2 text-sm text-gray-400">Error ID: {error.digest}</p>}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Go home
            </button>
            <button
              onClick={reset}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
