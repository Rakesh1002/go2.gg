import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { APIExplorerClient } from "./api-explorer-client";

export const metadata: Metadata = getMetadata({
  title: "API Explorer - Interactive API Testing",
  description:
    "Try the Go2 API directly in your browser. Interactive API explorer with live requests.",
});

export default function APIExplorerPage() {
  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Explorer</h1>
        <p className="text-muted-foreground mt-2">
          Try the Go2 API directly in your browser. Enter your API key to make live requests.
        </p>
      </div>
      <APIExplorerClient />
    </div>
  );
}
