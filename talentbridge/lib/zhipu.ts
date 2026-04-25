// lib/zhipu.ts
// Z.AI / Zhipu GLM API client wrapper
// Supports both streaming (SSE) and non-streaming (JSON mode) calls.
// Docs: https://docs.z.ai/api-reference/llm/chat-completion

const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4';
const DEFAULT_MODEL = 'glm-4.5-flash';
const REQUEST_TIMEOUT_MS = 45_000;

function getApiKey(): string {
  const key = process.env.ZHIPU_API_KEY || process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY;
  if (!key) {
    throw new Error('ZHIPU_API_KEY or ZAI_API_KEY environment variable is not set');
  }
  return key.trim();
}

function getBaseUrl() {
  return (process.env.ZHIPU_BASE_URL || process.env.ZAI_BASE_URL || ZAI_BASE_URL).replace(/\/$/, '');
}

function getModel(model?: string) {
  return model || process.env.ZHIPU_MODEL || process.env.ZAI_MODEL || DEFAULT_MODEL;
}

interface ZhipuMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ZhipuCallOptions {
  model?: string;
  messages: ZhipuMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' } | { type: 'text' };
}

// ── Non-streaming call — returns full response text ───────────────────────────
export async function zhipuCall(options: ZhipuCallOptions): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: getModel(options.model),
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: false,
      response_format: options.response_format ?? { type: 'text' },
      thinking: { type: 'disabled' },
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ZhipuAI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── JSON-mode call — auto-parses response as JSON ────────────────────────────
export async function zhipuJson<T>(options: Omit<ZhipuCallOptions, 'stream' | 'response_format'>): Promise<T> {
  const text = await zhipuCall({
    ...options,
    response_format: { type: 'json_object' },
    temperature: options.temperature ?? 0.3, // Lower temp for structured JSON
  });

  // Strip markdown code fences if model wraps JSON in them
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse ZhipuAI JSON response: ${cleaned.slice(0, 200)}`);
  }
}

// ── Streaming call — returns a ReadableStream of text chunks ─────────────────
// Used by the Inquisitor to stream the interview question character-by-character.
export async function zhipuStream(options: Omit<ZhipuCallOptions, 'stream'>): Promise<ReadableStream<string>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: getModel(options.model),
      messages: options.messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.max_tokens ?? 256, // Inquisitor answers are short
      stream: true,
      thinking: { type: 'disabled' },
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok || !response.body) {
    const errText = await response.text();
    throw new Error(`ZhipuAI stream error ${response.status}: ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  // Transform the raw SSE stream into a stream of text chunks
  return new ReadableStream<string>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        // Parse SSE data lines: "data: {...}\n\n"
        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6); // Remove "data: " prefix
          if (jsonStr === '[DONE]') {
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed?.choices?.[0]?.delta?.content;
            if (chunk) {
              controller.enqueue(chunk);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
