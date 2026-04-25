// lib/auth.ts
// Server-side OAuth logic for Google and provider connection management.

import { google } from 'googleapis';
import { db } from './db';
import { connections } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from './env';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar.events',
];

function getGoogleRedirectUri() {
  return env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`;
}

/**
 * Generates the Google OAuth URL for an employer.
 */
export function getGoogleAuthUrl(employerId: string) {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    getGoogleRedirectUri()
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: employerId, // Pass employerId as state
  });
}

/**
 * Exchanges OAuth code for tokens and stores them in DB.
 */
export async function handleGoogleCallback(code: string, employerId: string) {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    getGoogleRedirectUri()
  );

  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token) throw new Error('No access token returned');

  const connectionId = `google_${employerId}`;
  const now = Date.now();

  const data = {
    id: connectionId,
    employerId,
    provider: 'google',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null, // Might be null on re-connect without prompt=consent
    expiresAt: tokens.expiry_date || null,
    scope: tokens.scope || null,
    updatedAt: now,
  };

  // Upsert connection
  const existing = db.select().from(connections).where(eq(connections.id, connectionId)).get();
  
  if (existing) {
    // If we didn't get a new refresh token (user didn't re-consent), keep the old one
    if (!data.refreshToken) data.refreshToken = existing.refreshToken;
    
    await db.update(connections).set(data).where(eq(connections.id, connectionId)).run();
  } else {
    await db.insert(connections).values({ ...data, createdAt: now }).run();
  }

  return data;
}

/**
 * Gets an authorized Google OAuth2 client for an employer.
 * Handles token refresh automatically.
 */
export async function getAuthorizedGoogleClient(employerId: string) {
  const connection = db.select().from(connections)
    .where(and(eq(connections.employerId, employerId), eq(connections.provider, 'google')))
    .get();

  if (!connection) return null;

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    getGoogleRedirectUri()
  );

  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken || undefined,
    expiry_date: connection.expiresAt || undefined,
  });

  // Check if token needs refresh
  const isExpired = connection.expiresAt ? Date.now() >= connection.expiresAt - 60000 : false;
  
  if (isExpired && connection.refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update DB with new tokens
      await db.update(connections)
        .set({
          accessToken: credentials.access_token!,
          expiresAt: credentials.expiry_date || null,
          updatedAt: Date.now(),
        })
        .where(eq(connections.id, connection.id))
        .run();
        
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error(`[Auth] Failed to refresh token for ${employerId}:`, err);
      return null;
    }
  }

  return oauth2Client;
}

/**
 * Returns connection status for UI.
 */
export async function getConnectionStatus(employerId: string) {
  const googleConn = db.select().from(connections)
    .where(and(eq(connections.employerId, employerId), eq(connections.provider, 'google')))
    .get();

  return {
    google: googleConn ? {
      connected: true,
      updatedAt: googleConn.updatedAt,
      needsReconnect: !googleConn.refreshToken, // Basic check
    } : { connected: false }
  };
}
