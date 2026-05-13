/**
 * Built-in Tools
 */

import type { Tool } from "./types.js";

/**
 * Web search tool (placeholder - requires API integration)
 */
export const webSearchTool: Tool = {
  name: "web_search",
  description:
    "Search the web for current information. Use this when you need up-to-date information that might not be in your knowledge.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
    },
    required: ["query"],
  },
  execute: async (params) => {
    const query = params.query as string;
    // In production, integrate with a search API like Serper, Tavily, etc.
    return `[Web search results for "${query}" would appear here. Integrate with a search API.]`;
  },
};

/**
 * Calculator tool
 */
export const calculatorTool: Tool = {
  name: "calculator",
  description: "Perform mathematical calculations. Use this for any math operations.",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "The mathematical expression to evaluate (e.g., '2 + 2', '15 * 7')",
      },
    },
    required: ["expression"],
  },
  execute: async (params) => {
    const expression = params.expression as string;
    try {
      // Simple and safe eval for basic math
      const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
      // biome-ignore lint: This is intentionally using Function for math eval
      const result = new Function(`return ${sanitized}`)();
      return `Result: ${result}`;
    } catch (error) {
      return `Error evaluating expression: ${expression}`;
    }
  },
};

/**
 * Current date/time tool
 */
export const dateTimeTool: Tool = {
  name: "get_datetime",
  description:
    "Get the current date and time. Use this when asked about today's date or current time.",
  parameters: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "The timezone to use (e.g., 'America/New_York', 'UTC')",
      },
    },
  },
  execute: async (params) => {
    const timezone = (params.timezone as string) || "UTC";
    try {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", { timeZone: timezone });
      return `Current date and time (${timezone}): ${formatted}`;
    } catch {
      return `Current date and time (UTC): ${new Date().toISOString()}`;
    }
  },
};

/**
 * JSON formatter tool
 */
export const jsonFormatterTool: Tool = {
  name: "format_json",
  description: "Format and validate JSON data. Use this to pretty-print or validate JSON.",
  parameters: {
    type: "object",
    properties: {
      json: {
        type: "string",
        description: "The JSON string to format",
      },
    },
    required: ["json"],
  },
  execute: async (params) => {
    const json = params.json as string;
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return `Invalid JSON: ${(error as Error).message}`;
    }
  },
};

/**
 * Collection of all built-in tools
 */
export const builtInTools: Tool[] = [
  webSearchTool,
  calculatorTool,
  dateTimeTool,
  jsonFormatterTool,
];

/**
 * Create a custom tool
 */
export function createTool(config: Tool): Tool {
  return config;
}
