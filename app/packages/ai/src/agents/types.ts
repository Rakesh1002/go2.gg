/**
 * AI Agents Types
 */

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
        required?: boolean;
      }
    >;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<string>;
}

export interface AgentConfig {
  name: string;
  description?: string;
  systemPrompt?: string;
  tools?: Tool[];
  maxIterations?: number;
  temperature?: number;
}

export interface AgentStep {
  thought: string;
  action?: {
    tool: string;
    input: Record<string, unknown>;
  };
  observation?: string;
  isFinal?: boolean;
}

export interface AgentResult {
  answer: string;
  steps: AgentStep[];
  toolCalls: Array<{
    tool: string;
    input: Record<string, unknown>;
    output: string;
  }>;
}
