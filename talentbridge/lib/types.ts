// lib/types.ts
// Shared TypeScript types for the entire TalentBridge AI platform

// ─── Mapper Agent ─────────────────────────────────────────────────────────────
export interface MapperResult {
  role_title: string;
  core_dimensions: string[];          // Exactly 5 competency dimensions
  probe_targets: string[];            // 2–3 implied but unstated probes
  truncated_input: boolean;           // True if JD < 50 words
}

// ─── Dimension QA Agent ───────────────────────────────────────────────────────
export type QAStatus = 'PASS' | 'REVISE' | 'PASS_WITH_WARNING';

export interface DimensionQAResult {
  status: QAStatus;
  qa_feedback?: string[];             // Only present on REVISE
  warning_flag?: boolean;             // Only on PASS_WITH_WARNING
  warning_notes?: string[];           // Appended to probe_targets for Strategist
}

// ─── Strategist Agent  ────────────────────────────────────────────────────────
export type DimensionState = 'UNEXPLORED' | 'TOUCHED' | 'DEVELOPING' | 'SUFFICIENT';
export type NextAction =
  | 'reality_check'
  | 'resolve_contradiction'
  | 'probe_deeper'
  | 'change_dimension'
  | 'close_session';

export type CoverageMap = Record<string, DimensionState>;

export interface StrategistResult {
  turn_number: number;
  turns_since_last_reality_check: number;
  next_action: NextAction;
  target_dimension: string;
  probe_angle: string;                // The actual question guidance for Inquisitor
  contradiction_context: string | null;
  sentinel_override: boolean;
  coverage_map: CoverageMap;
  forced_close_log: string | null;
  reasoning: string;                  // The "debug panel" field ← judges love this
}

// ─── Sentinel (Pure JS — no AI) ──────────────────────────────────────────────
export interface SentinelData {
  focus_loss_events: number;
  total_away_duration_seconds: number;
  paste_events: number;
  tab_switches: number;
  current_question_focus_loss_seconds?: number;
  current_question_tab_switches?: number;
  integrity_stage?: SentinelStage;
  answer_timings_ms?: number[];
  last_answer_elapsed_ms?: number;
  timing_anomaly_count?: number;
  last_answer_timing_anomaly?: boolean;
  // Hard-coded AI detection: large paste (>150 chars) auto-flagged
  ai_paste_detected?: boolean;
  ai_paste_char_count?: number;
}

export type SentinelStage = 'clean' | 'stage_1_alert' | 'stage_2_alert';
export type HrResponse = 'offer' | 'hold' | 'reject';
export type DisputeResolution = 'upheld' | 'revised' | 'fresh_interview';

// ─── Language Style Analyzer ─────────────────────────────────────────────────
export interface StyleAnalysisResult {
  style_consistency_score: number;    // 0–100
  anomaly_detected: boolean;
  primary_anomaly_type: string | null;
  signal_breakdown: {
    scope_drift_penalty: number;
    response_length_shift_penalty: number;
    language_register_jump_penalty: number;
    personal_detail_density_drop_penalty: number;
    discourse_marker_emergence_penalty: number;
    sentence_uniformity_penalty: number;
    colloquial_marker_retention_penalty: number;
  };
  recommendation: 'CLEAN' | 'MINOR_VARIATION' | 'FLAG_TO_AUDITOR' | 'PASS_TO_AUDITOR_STRONG_FLAG';
}

// ─── Auditor Agent ────────────────────────────────────────────────────────────
export type TriageResult = 'GREEN' | 'AMBER' | 'RED';
export type AuthenticityStatus = 'clean' | 'flagged' | 'strong_flag';
export type Confidence = 'high' | 'medium' | 'low';

export interface DimensionScore {
  score: number;                      // 0–100
  confidence: Confidence;
  key_evidence: string;
}

export interface UpskillStep {
  week: number;
  topic: string;
  resource: string;
}

export interface VerdictResult {
  authenticity_status?: AuthenticityStatus;
  triage_result: TriageResult;
  dimension_scores: Record<string, DimensionScore | { score: number; label?: string; confidence?: Confidence; key_evidence?: string }>;
  verified_strengths?: string[];
  identified_gaps?: string[];
  // Shorthand aliases used by seeded demo data
  strengths?: string[];
  gaps?: string[];
  summary?: string;
  ai_summary?: string;
  overall_score?: number;
  upskill_path?: UpskillStep[] | null;
  career_orientation?: string | null;
  sentinel_metadata?: SentinelData;
  style_consistency_score?: number | null;
  authenticity_flag?: boolean;
  human_review_required: boolean;
  human_review_reason?: string | null;
}


// ─── Schema Validator ─────────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  retry_feedback?: string[];
}

// ─── Chat API ─────────────────────────────────────────────────────────────────
export interface ChatRequest {
  sessionId: string;
  candidateName: string;
  message: string;
  sentinelData: SentinelData;
}

// ─── Session API ─────────────────────────────────────────────────────────────
export interface SessionCreateRequest {
  jdId: string;
  candidateName: string;
}

export interface SessionState {
  sessionId: string;
  jdId: string;
  candidateName: string;
  roleTitle?: string | null;
  companyName?: string | null;
  hrResponse?: HrResponse | null;
  scheduledSlot?: string | null;
  status: string;
  foundJob?: boolean;
  foundJobAt?: number | null;
  interviewScheduledAt?: number | null;
  interviewMeetingLink?: string | null;
  interviewScheduleNote?: string | null;
  quizAnswers?: Array<{ question: string; answer: string }>;
  preScreeningContext?: Record<string, unknown> | null;
  disputeRequestedAt?: number | null;
  disputeReason?: string | null;
  disputeStatus?: string | null;
  moderationStatus?: string | null;
  moderationErrors?: string[] | null;
  moderationEscalatedAt?: number | null;
  sessionLifecycleStatus?: string | null;
  sessionExpiredAt?: number | null;
  partialProfileCreatedAt?: number | null;
  turnCount: number;
  coverageMap: CoverageMap;
  sentinelData: SentinelData;
  transcript: TranscriptEntry[];
  mapperResult: MapperResult;
}

export interface TranscriptEntry {
  role: 'inquisitor' | 'candidate';
  content: string;
  turnNumber: number;
  strategistJson?: StrategistResult;
  createdAt: number;
}

// ─── JD Upload ───────────────────────────────────────────────────────────────
export interface JdUploadResponse {
  jdId: string;
  roleTitle: string;
  mapperResult: MapperResult;
  qaStatus: QAStatus;
  interviewLink: string;
  warnings?: string[];
}
