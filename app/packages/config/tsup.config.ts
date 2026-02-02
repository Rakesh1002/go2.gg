import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/env.ts", "src/features.ts", "src/adapters.ts", "src/pricing.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
