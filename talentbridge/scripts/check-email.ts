import { loadEnvConfig } from '@next/env';

function hasValue(value: string | undefined | null) {
  return Boolean(value?.trim());
}

async function main() {
  loadEnvConfig(process.cwd());

  const email = process.env.EMAIL?.trim();
  const host = process.env.EMAIL_HOST?.trim();
  const port = process.env.EMAIL_PORT?.trim();
  const hasPassword = hasValue(process.env.EMAIL_PASSWORD);

  console.log('Running email integration health check...');
  console.log('Email Sending Mode: SMTP');
  console.log(`EMAIL: ${hasValue(email) ? 'SET' : 'MISSING'}`);
  console.log(`EMAIL_HOST: ${hasValue(host) ? 'SET' : 'MISSING'}`);
  console.log(`EMAIL_PORT: ${hasValue(port) ? 'SET' : 'MISSING'}`);
  console.log(`EMAIL_PASSWORD: ${hasPassword ? 'SET' : 'MISSING'}`);

  if (!email || !host || !port || !hasPassword) {
    console.log('SMTP Status: TRACE FALLBACK');
    process.exitCode = 1;
    return;
  }

  console.log('SMTP Status: CONFIGURED');
}

main().catch((error) => {
  console.error(`Unexpected email health check failure: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
