// lib/db/index.ts
// SQLite database singleton using better-sqlite3 + Drizzle ORM
// better-sqlite3 is synchronous — perfect for Next.js serverless but we keep
// all DB access in server-only code (API routes, server components).
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// ── Database file location ────────────────────────────────────────────────────
// We store the SQLite file at the project root. Vercel deployments mount an
// ephemeral filesystem — for production persistence, swap to Turso / LibSQL.
// For hackathon local demo, this is perfectly fine.
const DB_PATH = path.resolve(process.cwd(), 'talentbridge.db');
const DEFAULT_SENTINEL_JSON = '{"focus_loss_events":0,"total_away_duration_seconds":0,"paste_events":0,"tab_switches":0,"current_question_focus_loss_seconds":0,"current_question_tab_switches":0,"integrity_stage":"clean","answer_timings_ms":[],"last_answer_elapsed_ms":0,"timing_anomaly_count":0,"last_answer_timing_anomaly":false,"ai_paste_detected":false,"ai_paste_char_count":0}';

// ── Singleton instance ────────────────────────────────────────────────────────
// In development (hot-reload), avoid opening multiple connections.
declare global {
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
      role_filled INTEGER NOT NULL DEFAULT 0,
      role_filled_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      jd_id TEXT NOT NULL,
      candidate_name TEXT NOT NULL DEFAULT '',
      candidate_email TEXT DEFAULT '',
      candidate_phone TEXT DEFAULT '',
      candidate_linkedin TEXT DEFAULT '',
      candidate_portfolio TEXT DEFAULT '',
      candidate_bio TEXT DEFAULT '',
      resume_file_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      found_job INTEGER NOT NULL DEFAULT 0,
      found_job_at INTEGER,
      turn_count INTEGER NOT NULL DEFAULT 0,
      coverage_map TEXT NOT NULL DEFAULT '{}',
      sentinel_data TEXT NOT NULL DEFAULT '${DEFAULT_SENTINEL_JSON}',
      style_analysis TEXT,
      verdict TEXT,
      verdict_valid INTEGER,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      hr_responded_at INTEGER,
      hr_response TEXT,
      interview_scheduled_at INTEGER,
      interview_meeting_link TEXT,
      interview_schedule_note TEXT,
      dispute_requested_at INTEGER,
      dispute_reason TEXT,
      dispute_status TEXT,
      dispute_resolved_at INTEGER,
      dispute_resolution TEXT,
      dispute_resolution_notes TEXT,
      moderation_status TEXT,
      moderation_errors TEXT,
      moderation_escalated_at INTEGER,
      session_lifecycle_status TEXT,
      session_expired_at INTEGER,
      partial_profile_created_at INTEGER
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

  ensureTableColumns(sqlite, 'jd_cache', [
    { name: 'role_filled', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'role_filled_at', definition: 'INTEGER' },
  ]);

  ensureTableColumns(sqlite, 'sessions', [
    { name: 'candidate_email', definition: "TEXT DEFAULT ''" },
    { name: 'candidate_phone', definition: "TEXT DEFAULT ''" },
    { name: 'candidate_linkedin', definition: "TEXT DEFAULT ''" },
    { name: 'candidate_portfolio', definition: "TEXT DEFAULT ''" },
    { name: 'candidate_bio', definition: "TEXT DEFAULT ''" },
    { name: 'resume_file_name', definition: "TEXT DEFAULT ''" },
    { name: 'found_job', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'found_job_at', definition: 'INTEGER' },
    { name: 'hr_responded_at', definition: 'INTEGER' },
    { name: 'hr_response', definition: 'TEXT' },
    { name: 'interview_scheduled_at', definition: 'INTEGER' },
    { name: 'interview_meeting_link', definition: "TEXT DEFAULT ''" },
    { name: 'interview_schedule_note', definition: "TEXT DEFAULT ''" },
    { name: 'dispute_requested_at', definition: 'INTEGER' },
    { name: 'dispute_reason', definition: "TEXT" },
    { name: 'dispute_status', definition: "TEXT" },
    { name: 'dispute_resolved_at', definition: 'INTEGER' },
    { name: 'dispute_resolution', definition: 'TEXT' },
    { name: 'dispute_resolution_notes', definition: 'TEXT' },
    { name: 'moderation_status', definition: "TEXT" },
    { name: 'moderation_errors', definition: "TEXT" },
    { name: 'moderation_escalated_at', definition: 'INTEGER' },
    { name: 'session_lifecycle_status', definition: 'TEXT' },
    { name: 'session_expired_at', definition: 'INTEGER' },
    { name: 'partial_profile_created_at', definition: 'INTEGER' },
  ]);
}

function ensureTableColumns(
  sqlite: Database.Database,
  tableName: string,
  requiredColumns: Array<{ name: string; definition: string }>
) {
  const existingColumns = new Set(
    sqlite
      .prepare(`PRAGMA table_info(${tableName})`)
      .all()
      .map((column) => (column as { name: string }).name)
  );

  for (const column of requiredColumns) {
    if (!existingColumns.has(column.name)) {
      sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.definition}`);
    }
  }
}

export const db = global.__db ?? createDb();
if (process.env.NODE_ENV !== 'production') {
  global.__db = db;
}

// Auto-seed with demo data on boot (only if empty)
// Import lazily to avoid circular deps
import('./seed').then(({ seedIfEmpty }) => seedIfEmpty()).catch(() => {});
