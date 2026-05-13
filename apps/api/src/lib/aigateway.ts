/**
 * aigateway.sh client (OpenAI-compatible).
 *
 * Single-provider thin client used by the URL-shortener AI features.
 *
 * Default model: **`meta/llama-3.3-70b-instruct-fp8-fast`** — open-weight,
 * no reasoning overhead, fastest model that produced 5/5 valid slugs in
 * benchmarking ($0.29/M input, $0.60/M output, ~3.4s end-to-end from
 * laptop, expected sub-2s from a Worker).
 *
 * Considered + rejected:
 *   - `moonshot/kimi-k2.6` — reasoning-always, burns ~1k tokens before
 *     emitting any answer; high latency + high cost ($0.95/$4).
 *   - `openai/gpt-oss-120b` / `qwen/qwen3-30b-*` — also reason despite
 *     catalog flags claiming otherwise; truncate cleanly only with very
 *     large `max_tokens` budgets.
 *   - `meta/llama-3.1-8b` / `gemma-2b/7b` — fast but quality drops; emit
 *     preamble ("Here are 5 unique slugs:") that breaks parsing.
 *   - `google/gemini-3.1-flash-lite` — perfect quality, 5× cheaper, but
 *     ~6s latency (slower than llama-3.3-70b-fast); good fallback choice.
 *
 * Override via `AI_GATEWAY_MODEL` env var or per-call `options.model`.
 *
 * Why a hand-rolled fetch client instead of the openai SDK: zero deps, runs
 * on Workers without nodejs_compat, and the surface we need is tiny (chat
 * completions only). If we ever need streaming or tool use, swap in the SDK.
 */

export interface AIGatewayConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIGatewayChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

const DEFAULT_BASE_URL = "https://api.aigateway.sh";
const DEFAULT_MODEL = "meta/llama-3.3-70b-instruct-fp8-fast";

/**
 * Some models in the catalog are reasoning-always (`moonshot/kimi-k2.6`,
 * `openai/gpt-oss-120b`, `qwen/qwen3-*`) and silently emit `reasoning_content`
 * before the answer — meaning a small `max_tokens` budget gets fully consumed
 * by the hidden chain-of-thought, leaving `content` empty. For those models
 * we floor `max_tokens` at 4096 so the answer has room to land.
 *
 * The default model (llama-3.3-70b-fp8-fast) does not reason and ignores
 * this floor.
 */
const REASONING_MIN_MAX_TOKENS = 4096;
const REASONING_MODEL_PREFIXES = ["moonshot/kimi", "openai/gpt-oss", "qwen/qwen3"];

export class AIGatewayError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = "AIGatewayError";
  }
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { role: string; content: string | null };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Single chat completion. Returns the assistant message content as a string,
 * or empty string when the model returns no text (e.g. truncated reasoning).
 */
export async function chat(
  config: AIGatewayConfig,
  messages: AIChatMessage[],
  options: AIGatewayChatOptions = {},
): Promise<string> {
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = options.model ?? config.model ?? DEFAULT_MODEL;
  const isReasoningModel = REASONING_MODEL_PREFIXES.some((p) => model.startsWith(p));
  const requestedMaxTokens = options.maxTokens ?? 256;
  const maxTokens = isReasoningModel
    ? Math.max(requestedMaxTokens, REASONING_MIN_MAX_TOKENS)
    : requestedMaxTokens;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: options.temperature ?? 0.7,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AIGatewayError(
      `aigateway.sh ${response.status} ${response.statusText}`,
      response.status,
      body.slice(0, 500),
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * Convenience: single-prompt completion. Wraps `chat` with a single user
 * message. Returns "" on configuration miss so callers can fall back.
 */
export async function complete(
  config: Partial<AIGatewayConfig> | undefined,
  prompt: string,
  options: AIGatewayChatOptions = {},
): Promise<string> {
  if (!config?.apiKey) return "";
  return chat({ apiKey: config.apiKey, baseUrl: config.baseUrl, model: config.model }, [
    { role: "user", content: prompt },
  ], options);
}
