// lib/env.ts
// Centralized environment variable validation.

export const env = {
  ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY,
  
  // Google API Credentials (Optional - Agent 8 falls back to Trace Mode if missing)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  
  // Zoom API Credentials (Optional)
  ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
  
  isProduction: process.env.NODE_ENV === 'production',
};

/**
 * Validates that core interview engine requirements are met.
 * Missing orchestration credentials will NOT throw here.
 */
export function validateCoreEnv() {
  if (!env.ZHIPU_API_KEY || env.ZHIPU_API_KEY === 'your_zhipu_api_key_here') {
    if (env.isProduction) {
      throw new Error('CRITICAL: ZHIPU_API_KEY or ZAI_API_KEY is required in production mode.');
    } else {
      console.warn('[Env] WARNING: ZHIPU_API_KEY/ZAI_API_KEY is missing. Falling back to MOCK mode.');
    }
  }
}

/**
 * Checks if orchestration credentials (Gmail/Calendar) are available.
 */
export function hasOrchestrationCreds(): boolean {
  return !!(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REFRESH_TOKEN
  );
}

/**
 * Checks if Zoom credentials are available.
 */
export function hasZoomCreds(): boolean {
  return !!(
    env.ZOOM_ACCOUNT_ID &&
    env.ZOOM_CLIENT_ID &&
    env.ZOOM_CLIENT_SECRET
  );
}
