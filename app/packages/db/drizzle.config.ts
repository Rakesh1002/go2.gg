import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    // For local development, use a local SQLite file
    // For production D1, use wrangler commands
    url: process.env.LOCAL_DB_PATH ?? "./local.db",
  },
});
