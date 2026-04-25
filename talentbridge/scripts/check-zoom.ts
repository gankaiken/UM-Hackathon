import { loadEnvConfig } from '@next/env';

function hasValue(value: string | undefined | null) {
  return Boolean(value?.trim());
}

async function main() {
  loadEnvConfig(process.cwd());

  const [{ createZoomMeetingWithToken, deleteZoomMeetingWithToken, requestZoomAccessToken }] = await Promise.all([
    import('../lib/agents/externalTools'),
  ]);

  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  const shouldCreateMeeting = process.argv.includes('--meeting') || process.env.CHECK_ZOOM_MEETING === '1';

  console.log('Running Zoom integration health check...');
  console.log(`ZOOM_ACCOUNT_ID: ${hasValue(accountId) ? 'SET' : 'MISSING'}`);
  console.log(`ZOOM_CLIENT_ID: ${hasValue(clientId) ? 'SET' : 'MISSING'}`);
  console.log(`ZOOM_CLIENT_SECRET: ${hasValue(clientSecret) ? 'SET' : 'MISSING'}`);

  if (!accountId || !clientId || !clientSecret) {
    console.log('Zoom Status: TRACE MODE');
    console.log('Token Test: SKIPPED');
    process.exitCode = 1;
    return;
  }

  try {
    const startedAt = Date.now();
    const tokenResult = await requestZoomAccessToken();
    const latencyMs = Date.now() - startedAt;

    console.log(`Latency: ${latencyMs}ms`);

    if (!tokenResult.success) {
      console.log('Zoom Status: TRACE MODE');
      console.log(`Token Test: FAILED`);
      console.log(`Error: ${tokenResult.message}`);
      process.exitCode = 1;
      return;
    }

    console.log('Zoom Status: ENV VALID, TOKEN SUCCESS');
    console.log('Token Test: SUCCESS');

    if (!shouldCreateMeeting) {
      console.log('Meeting Test: SKIPPED');
      return;
    }

    const meetingStart = new Date(Date.now() + 30 * 60 * 1000);
    const meetingResult = await createZoomMeetingWithToken(
      tokenResult.accessToken,
      'TalentBridge Zoom Health Check',
      meetingStart.toISOString()
    );

    if (!meetingResult.success) {
      console.log('Meeting Test: FAILED');
      console.log(`Error: ${meetingResult.message}`);
      process.exitCode = 1;
      return;
    }

    const meetingId = meetingResult.meeting.id;
    console.log('Meeting Test: SUCCESS');
    console.log(`Meeting Id: ${meetingId ?? '(missing)'}`);
    console.log(`Join URL: ${meetingResult.meeting.join_url ? 'SET' : 'MISSING'}`);
    console.log(`Start URL: ${meetingResult.meeting.start_url ? 'SET' : 'MISSING'}`);

    if (meetingId) {
      const deleteResult = await deleteZoomMeetingWithToken(tokenResult.accessToken, meetingId);
      if (deleteResult.success) {
        console.log('Delete Test: SUCCESS');
      } else {
        console.log('Delete Test: FAILED');
        console.log(`Error: ${deleteResult.message}`);
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.log('Zoom Status: TRACE MODE');
    console.log('Token Test: FAILED');
    console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Unexpected Zoom health check failure: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
