import { loadEnvConfig } from '@next/env';

function hasValue(value: string | undefined | null) {
  return Boolean(value?.trim());
}

async function main() {
  loadEnvConfig(process.cwd());

  const [{ google }, { db }, { connections }, { and, eq }, { env }, { getAuthorizedGoogleClient }] = await Promise.all([
    import('googleapis'),
    import('../lib/db'),
    import('../lib/db/schema'),
    import('drizzle-orm'),
    import('../lib/env'),
    import('../lib/auth'),
  ]);

  const employerId = process.argv[2] || process.env.CHECK_EMPLOYER_ID || 'default';
  const redirectUri = env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`;

  console.log('Running Google integration health check...');
  console.log(`Employer: ${employerId}`);
  console.log(`GOOGLE_CLIENT_ID: ${hasValue(env.GOOGLE_CLIENT_ID) ? 'SET' : 'MISSING'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${hasValue(env.GOOGLE_CLIENT_SECRET) ? 'SET' : 'MISSING'}`);
  console.log(`GOOGLE_REDIRECT_URI: ${hasValue(env.GOOGLE_REDIRECT_URI) ? 'SET' : 'MISSING'}`);
  console.log(`NEXT_PUBLIC_APP_URL: ${hasValue(process.env.NEXT_PUBLIC_APP_URL) ? 'SET' : 'MISSING'}`);
  console.log(`Effective Redirect URI Source: ${hasValue(env.GOOGLE_REDIRECT_URI) ? 'GOOGLE_REDIRECT_URI' : 'NEXT_PUBLIC_APP_URL'}`);

  const connection = db.select().from(connections)
    .where(and(eq(connections.employerId, employerId), eq(connections.provider, 'google')))
    .get();

  if (!connection) {
    console.log('Connection Record: NOT FOUND');
    console.log('Calendar Status: LIVE BUT NEEDS USER CONNECTION');
    return;
  }

  console.log('Connection Record: FOUND');
  console.log(`Stored Refresh Token: ${connection.refreshToken ? 'YES' : 'NO'}`);
  console.log(`Stored Expiry: ${connection.expiresAt ? 'SET' : 'MISSING'}`);
  console.log(`Effective Redirect URI: ${redirectUri}`);

  const auth = await getAuthorizedGoogleClient(employerId);
  if (!auth) {
    console.log('Calendar Status: LIVE BUT NEEDS USER CONNECTION');
    console.log('Calendar Test: FAILED_TO_AUTHORIZE');
    process.exitCode = 1;
    return;
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const startedAt = Date.now();
    const response = await calendar.calendars.get({ calendarId: 'primary' });
    const latencyMs = Date.now() - startedAt;

    console.log('Calendar Status: LIVE');
    console.log(`Calendar Test: SUCCESS (${latencyMs}ms)`);
    console.log(`Primary Calendar Summary: ${response.data.summary || '(no summary)'}`);
    console.log(`Primary Calendar Time Zone: ${response.data.timeZone || '(no timezone)'}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('Calendar Status: LIVE BUT NEEDS USER CONNECTION');
    console.log(`Calendar Test: FAILED`);
    console.log(`Error: ${message}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Unexpected Google health check failure: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
