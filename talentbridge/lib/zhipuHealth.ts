import { getZhipuRuntimeConfig, resolveZhipuApiKey } from './zhipu';

export interface ZhipuHealthCheckResult {
  ok: boolean;
  status: number | null;
  responseText: string;
  latencyMs: number;
  endpoint: string;
  model: string;
  keySource: string | null;
  error?: string;
}

export async function runZhipuHealthCheck(): Promise<ZhipuHealthCheckResult> {
  const resolvedKey = resolveZhipuApiKey();
  if (!resolvedKey) {
    const { baseUrl, model } = getZhipuRuntimeConfig();
    return {
      ok: false,
      status: null,
      responseText: '',
      latencyMs: 0,
      endpoint: `${baseUrl}/chat/completions`,
      model,
      keySource: null,
      error: 'ZHIPU_API_KEY, ZAI_API_KEY, or Z_AI_API_KEY is missing',
    };
  }

  const { baseUrl, model, timeoutMs } = getZhipuRuntimeConfig();
  const endpoint = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedKey.value}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
        temperature: 0,
        max_tokens: 16,
        stream: false,
        response_format: { type: 'text' },
        thinking: { type: 'disabled' },
      }),
    });

    const latencyMs = Date.now() - startedAt;
    const rawText = await response.text();
    const responseText = extractResponseText(rawText);

    return {
      ok: response.ok,
      status: response.status,
      responseText,
      latencyMs,
      endpoint,
      model,
      keySource: resolvedKey.name,
      error: response.ok ? undefined : rawText,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      responseText: '',
      latencyMs: Date.now() - startedAt,
      endpoint,
      model,
      keySource: resolvedKey.name,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractResponseText(rawText: string) {
  try {
    const parsed = JSON.parse(rawText);
    return parsed?.choices?.[0]?.message?.content ?? rawText;
  } catch {
    return rawText;
  }
}
