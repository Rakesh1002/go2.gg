/**
 * AI Agent
 *
 * Autonomous agent that can use tools to complete tasks.
 */

import type { AIRouter } from "../router.js";
import type { ChatMessage } from "../types.js";
import type { AgentConfig, AgentResult, AgentStep, Tool } from "./types.js";

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to tools.

When you need to use a tool, respond with a JSON block in this format:
\`\`\`json
{
  "thought": "Your reasoning about what to do next",
  "action": {
    "tool": "tool_name",
    "input": { "param": "value" }
  }
}
\`\`\`

When you have enough information to answer, respond with:
\`\`\`json
{
  "thought": "I now have enough information to answer",
  "answer": "Your final answer to the user"
}
\`\`\`

Available tools:
{{TOOLS}}

Always think step by step and use tools when needed.`;

export class Agent {
  private aiRouter: AIRouter;
  private config: AgentConfig;
  private tools: Map<string, Tool> = new Map();

  constructor(aiRouter: AIRouter, config: AgentConfig) {
    this.aiRouter = aiRouter;
    this.config = {
      maxIterations: 10,
      temperature: 0.7,
      ...config,
    };

    // Register tools
    for (const tool of config.tools || []) {
      this.tools.set(tool.name, tool);
    }
  }

  /**
   * Run the agent to complete a task.
   */
  async run(task: string): Promise<AgentResult> {
    const steps: AgentStep[] = [];
    const toolCalls: AgentResult["toolCalls"] = [];
    const messages: ChatMessage[] = [];

    // Build system prompt with tools
    const toolDescriptions = Array.from(this.tools.values())
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    const systemPrompt = (this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT).replace(
      "{{TOOLS}}",
      toolDescriptions
    );

    messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: task });

    let iterations = 0;
    const maxIterations = this.config.maxIterations || 10;

    while (iterations < maxIterations) {
      iterations++;

      // Get next action from AI
      const result = await this.aiRouter.complete(messages, {
        temperature: this.config.temperature,
      });

      // Parse response
      const step = this.parseResponse(result.content);
      steps.push(step);

      // Check if we have a final answer
      if (step.isFinal) {
        return {
          answer: step.thought,
          steps,
          toolCalls,
        };
      }

      // Execute tool if action specified
      if (step.action) {
        const tool = this.tools.get(step.action.tool);

        if (!tool) {
          step.observation = `Error: Tool '${step.action.tool}' not found`;
        } else {
          try {
            const output = await tool.execute(step.action.input);
            step.observation = output;
            toolCalls.push({
              tool: step.action.tool,
              input: step.action.input,
              output,
            });
          } catch (error) {
            step.observation = `Error executing tool: ${(error as Error).message}`;
          }
        }

        // Add observation to messages
        messages.push({
          role: "assistant",
          content: result.content,
        });
        messages.push({
          role: "user",
          content: `Observation: ${step.observation}`,
        });
      } else {
        // No action, treat as final answer
        return {
          answer: step.thought,
          steps,
          toolCalls,
        };
      }
    }

    // Max iterations reached
    return {
      answer: "I was unable to complete the task within the iteration limit.",
      steps,
      toolCalls,
    };
  }

  private parseResponse(content: string): AgentStep {
    // Try to extract JSON from response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]!);

        if (parsed.answer) {
          return {
            thought: parsed.thought || parsed.answer,
            isFinal: true,
          };
        }

        return {
          thought: parsed.thought || "",
          action: parsed.action,
        };
      } catch {
        // JSON parse failed, treat as plain text
      }
    }

    // Plain text response - treat as final answer
    return {
      thought: content,
      isFinal: true,
    };
  }

  /**
   * Add a tool to the agent.
   */
  addTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Remove a tool from the agent.
   */
  removeTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get all registered tools.
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

/**
 * Create an agent instance.
 */
export function createAgent(aiRouter: AIRouter, config: AgentConfig): Agent {
  return new Agent(aiRouter, config);
}
