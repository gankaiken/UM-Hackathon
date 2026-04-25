// lib/db/schema.ts
// Drizzle ORM schema for TalentBridge AI — SQLite tables
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ─── JD Cache ──────────────────────────────────────────────────────────────────
// One row per JD upload. Mapper + DimensionQA run once; output cached here.
export const jdCache = sqliteTable('jd_cache', {
  id: text('id').primaryKey(),                    // UUID
  employerId: text('employer_id').notNull().default('default'),
  rawJd: text('raw_jd').notNull(),                // Original JD text
  roleTitle: text('role_title').notNull().default(''),
  mapperOutput: text('mapper_output').notNull(),  // JSON: MapperResult
  qaStatus: text('qa_status').notNull().default('pending'), // 'PASS' | 'PASS_WITH_WARNING' | 'pending'
  qaOutput: text('qa_output'),                    // JSON: DimensionQAResult (nullable)
  interviewLink: text('interview_link').notNull().default(''),
  createdAt: integer('created_at').notNull(),
});

// ─── Sessions ──────────────────────────────────────────────────────────────────
// One row per candidate interview session.
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),                    // UUID — this IS the unique link token
  jdId: text('jd_id').notNull(),                  // FK → jd_cache.id
  candidateName: text('candidate_name').notNull().default(''),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'abandoned'
  turnCount: integer('turn_count').notNull().default(0),
  // Live state: Strategist coverage map, updated each turn
  coverageMap: text('coverage_map').notNull().default('{}'), // JSON
  // Sentinel aggregate state
  sentinelData: text('sentinel_data').notNull().default(
    '{"focus_loss_events":0,"total_away_duration_seconds":0,"paste_events":0,"tab_switches":0}'
  ), // JSON: SentinelData
  // Language Style Analyzer output — only set if Sentinel Stage 2 fires
  styleAnalysis: text('style_analysis'),          // JSON: StyleAnalysisResult | null
  // Final Auditor verdict — set when session completes
  verdict: text('verdict'),                       // JSON: VerdictResult | null
  verdictValid: integer('verdict_valid', { mode: 'boolean' }),
  createdAt: integer('created_at').notNull(),
  completedAt: integer('completed_at'),
});

// ─── Transcripts ───────────────────────────────────────────────────────────────
// One row per conversation turn (both candidate and Inquisitor messages).
export const transcripts = sqliteTable('transcripts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),        // FK → sessions.id
  turnNumber: integer('turn_number').notNull(),
  role: text('role').notNull(),                   // 'inquisitor' | 'candidate'
  content: text('content').notNull(),             // The actual message text
  // Full Strategist JSON for this turn (only set on candidate turns)
  strategistJson: text('strategist_json'),        // JSON: StrategistResult | null
  // Sentinel snapshot at the time this turn was submitted
  sentinelSnapshot: text('sentinel_snapshot'),    // JSON: SentinelData | null
  createdAt: integer('created_at').notNull(),
});

// Type exports for use throughout the app
export type JdCache = typeof jdCache.$inferSelect;
export type NewJdCache = typeof jdCache.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
