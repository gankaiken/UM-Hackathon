import { env } from './env';
import { runZhipuHealthCheck } from './zhipuHealth';

export type AiDisplayStatus = 'Live' | 'Fallback' | 'Invalid Key' | 'Failed';
export type ComponentMode = 'Live AI' | 'Fallback Mock' | 'Preset Demo Only' | 'Invalid Key' | 'Failed';

export interface AiRuntimeStatus {
  status: AiDisplayStatus;
  detail: string;
  components: Record<string, ComponentMode>;
}

export async function getAiRuntimeStatus(): Promise<AiRuntimeStatus> {
  const hasKey = Boolean(env.ZHIPU_API_KEY && env.ZHIPU_API_KEY !== 'your_zhipu_api_key_here');

  if (!hasKey) {
    return {
      status: 'Fallback',
      detail: 'No Zhipu key detected. Mock fallback protects demo flows.',
      components: buildComponentMap('Fallback Mock'),
    };
  }

  const health = await runZhipuHealthCheck();

  if (health.ok) {
    return {
      status: 'Live',
      detail: `Live Zhipu responding via ${health.model}.`,
      components: buildComponentMap('Live AI'),
    };
  }

  if (health.status === 401 || health.status === 403) {
    return {
      status: 'Invalid Key',
      detail: 'Configured Zhipu key was rejected by the API.',
      components: buildComponentMap('Invalid Key'),
    };
  }

  return {
    status: 'Failed',
    detail: health.error || 'Zhipu health check failed; runtime will fall back to mock responses.',
    components: buildComponentMap('Failed'),
  };
}

function buildComponentMap(mode: ComponentMode) {
  return {
    Mapper: mode,
    DimensionQA: mode,
    Strategist: mode,
    Inquisitor: mode,
    Auditor: mode,
    LanguageStyleAnalyzer: mode,
    ResultRoadmap: 'Preset Demo Only' as const,
  };
}
