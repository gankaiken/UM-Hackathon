import { loadEnvConfig } from '@next/env';
import { runZhipuHealthCheck } from '../lib/zhipuHealth';

async function main() {
  loadEnvConfig(process.cwd());

  console.log('Running Z.ai / Zhipu health check...');
  const result = await runZhipuHealthCheck();

  console.log(`Endpoint: ${result.endpoint}`);
  console.log(`Model: ${result.model}`);
  console.log(`Key Source: ${result.keySource ?? 'NONE'}`);
  console.log(`Latency: ${result.latencyMs}ms`);
  console.log(`Success: ${result.ok ? 'YES' : 'NO'}`);
  console.log(`HTTP Status: ${result.status ?? 'NETWORK_FAILURE'}`);
  console.log(`Response Text: ${result.responseText || '(empty)'}`);

  if (!result.ok) {
    console.error(`Error: ${result.error || 'Unknown error'}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Unexpected health check failure: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
