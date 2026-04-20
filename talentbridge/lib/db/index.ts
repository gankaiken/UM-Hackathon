// lib/db/index.ts
// SQLite database singleton using better-sqlite3 + Drizzle ORM
// better-sqlite3 is synchronous — perfect for Next.js serverless but we keep
// all DB access in server-only code (API routes, server components).
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// ── Database file location ────────────────────────────────────────────────────
// We store the SQLite file at the project root. Vercel deployments mount an
// ephemeral filesystem — for production persistence, swap to Turso / LibSQL.
// For hackathon local demo, this is perfectly fine.
const DB_PATH = path.resolve(process.cwd(), 'talentbridge.db');

// ── Singleton instance ────────────────────────────────────────────────────────
// In development (hot-reload), avoid opening multiple connections.
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle> | undefined;
}

function createDb() {
  const sqlite = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Auto-create tables if they don't exist (idempotent DDL)
  initSchema(sqlite);

  return drizzle(sqlite, { schema });
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────
// We push the schema directly without running migrations in dev mode.
// This keeps the hackathon setup to a single `npm run dev`.
function initSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jd_cache (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL DEFAULT 'default',
      raw_jd TEXT NOT NULL,
      role_title TEXT NOT NULL DEFAULT '',
      mapper_output TEXT NOT NULL,
      qa_status TEXT NOT NULL DEFAULT 'pending',
      qa_output TEXT,
      interview_link TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      jd_id TEXT NOT NULL,
      candidate_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      turn_count INTEGER NOT NULL DEFAULT 0,
      coverage_map TEXT NOT NULL DEFAULT '{}',
      sentinel_data TEXT NOT NULL DEFAULT '{"focus_loss_events":0,"total_away_duration_seconds":0,"paste_events":0,"tab_switches":0}',
      style_analysis TEXT,
      verdict TEXT,
      verdict_valid INTEGER,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      strategist_json TEXT,
      sentinel_snapshot TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts(session_id, turn_number);
    CREATE INDEX IF NOT EXISTS idx_sessions_jd ON sessions(jd_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  `);
}

export const db = global.__db ?? createDb();
if (process.env.NODE_ENV !== 'production') {
  global.__db = db;
}

// Auto-seed with demo data on boot (only if empty)
// Import lazily to avoid circular deps
import('./seed').then(({ seedIfEmpty }) => seedIfEmpty()).catch(() => {});
