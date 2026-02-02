import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/providers/index.ts",
    "src/rag/index.ts",
    "src/chat/index.ts",
    "src/agents/index.ts",
  ],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["ai", "@ai-sdk/openai", "@ai-sdk/anthropic", "@ai-sdk/google", "@repo/config"],
});
