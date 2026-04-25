// lib/db/schema.ts
// Drizzle ORM schema for TalentBridge AI — SQLite tables
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// HR users. The user id doubles as the employer ownership key.
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
});

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
  // Role lifecycle: HR marks role filled → notifies all pending candidates
  roleFilled: integer('role_filled', { mode: 'boolean' }).notNull().default(false),
  roleFilledAt: integer('role_filled_at'),
  timeslots: text('timeslots'),
  createdAt: integer('created_at').notNull(),
});

// ─── Sessions ──────────────────────────────────────────────────────────────────
// One row per candidate interview session.
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),                    // UUID — this IS the unique link token
  jdId: text('jd_id').notNull(),                  // FK → jd_cache.id
  employerId: text('employer_id').notNull().default('default'),
  candidateName: text('candidate_name').notNull().default(''),
  // Extended candidate profile (step 2 of apply form)
  candidateEmail: text('candidate_email').default(''),
  candidatePhone: text('candidate_phone').default(''),
  candidateLinkedin: text('candidate_linkedin').default(''),
  candidatePortfolio: text('candidate_portfolio').default(''),
  candidateBio: text('candidate_bio').default(''),
  resumeFileName: text('resume_file_name').default(''),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'abandoned'
  // Lifecycle status tracking
  foundJob: integer('found_job', { mode: 'boolean' }).notNull().default(false),
  foundJobAt: integer('found_job_at'),
  turnCount: integer('turn_count').notNull().default(0),
  // Live state: Strategist coverage map, updated each turn
  coverageMap: text('coverage_map').notNull().default('{}'), // JSON
  // Sentinel aggregate state
  sentinelData: text('sentinel_data').notNull().default(
    '{"focus_loss_events":0,"total_away_duration_seconds":0,"paste_events":0,"tab_switches":0,"current_question_focus_loss_seconds":0,"current_question_tab_switches":0,"integrity_stage":"clean","answer_timings_ms":[],"last_answer_elapsed_ms":0,"timing_anomaly_count":0,"last_answer_timing_anomaly":false,"ai_paste_detected":false,"ai_paste_char_count":0}'
  ), // JSON: SentinelData
  // Language Style Analyzer output — only set if Sentinel Stage 2 fires
  styleAnalysis: text('style_analysis'),          // JSON: StyleAnalysisResult | null
  // Final Auditor verdict — set when session completes
  verdict: text('verdict'),                       // JSON: VerdictResult | null
  verdictValid: integer('verdict_valid', { mode: 'boolean' }),
  createdAt: integer('created_at').notNull(),
  completedAt: integer('completed_at'),
  // HR response tracking (for Reputation Score + ghosting detection)
  hrRespondedAt: integer('hr_responded_at'),
  hrResponse: text('hr_response'),               // 'offer' | 'reject' | 'hold' | null
  interviewScheduledAt: integer('interview_scheduled_at'),
  interviewMeetingLink: text('interview_meeting_link'),
  interviewScheduleNote: text('interview_schedule_note'),
  disputeRequestedAt: integer('dispute_requested_at'),
  disputeReason: text('dispute_reason'),
  disputeStatus: text('dispute_status'),
  disputeResolvedAt: integer('dispute_resolved_at'),
  disputeResolution: text('dispute_resolution'), // 'upheld' | 'revised' | 'fresh_interview'
  disputeResolutionNotes: text('dispute_resolution_notes'),
  moderationStatus: text('moderation_status'),
  moderationErrors: text('moderation_errors'),
  moderationEscalatedAt: integer('moderation_escalated_at'),
  sessionLifecycleStatus: text('session_lifecycle_status'),
  sessionExpiredAt: integer('session_expired_at'),
  partialProfileCreatedAt: integer('partial_profile_created_at'),
  // Agent 8 Orchestration
  orchestrationState: text('orchestration_state'), // JSON: { mode, status, steps, lastError, updatedAt }
  // Phase 3: Finalized schedule selection
  // JSON: { start: string, end: string }
  scheduledSlot: text('scheduled_slot'),
});

// ─── Agent Logs ────────────────────────────────────────────────────────────────
// Debug trace for all AI agent calls
export const agentLogs = sqliteTable('agent_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id'),
  agentName: text('agent_name').notNull(),
  status: text('status').notNull(),                // 'success' | 'error' | 'retry'
  latency: integer('latency'),                    // ms
  inputSummary: text('input_summary'),            // Truncated/Summarized input
  outputSummary: text('output_summary'),          // Truncated/Summarized output
  tokens: integer('tokens'),                      // If available
  errorMessage: text('error_message'),
  createdAt: integer('created_at').notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actorType: text('actor_type').notNull(), // 'hr' | 'candidate' | 'system'
  actorId: text('actor_id'),
  action: text('action').notNull(),
  status: text('status').notNull(), // 'success' | 'failure' | 'blocked'
  ipAddress: text('ip_address'),
  targetType: text('target_type'),
  targetId: text('target_id'),
  details: text('details'),
  createdAt: integer('created_at').notNull(),
});

// ─── Employer Connections ──────────────────────────────────────────────────────
// Secure server-side storage for OAuth tokens
export const connections = sqliteTable('connections', {
  id: text('id').primaryKey(),                    // provider_employerId
  employerId: text('employer_id').notNull(),
  provider: text('provider').notNull(),           // 'google' | 'zoom'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),               // Timestamp
  scope: text('scope'),
  metadata: text('metadata'),                     // JSON
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
export type AgentLog = typeof agentLogs.$inferSelect;
export type NewAgentLog = typeof agentLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
