import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/schema.ts", "src/adapters/d1/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
