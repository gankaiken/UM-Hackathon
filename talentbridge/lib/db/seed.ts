// lib/db/seed.ts
// Rich dummy data seeder — creates realistic candidate sessions for demo
// Called once on first DB bootstrap if tables are empty

import { db } from './index';
import { jdCache, sessions, transcripts, users } from './schema';
import { DEFAULT_SENTINEL_DATA, normalizeSentinelData } from '../sentinel';
import { eq } from 'drizzle-orm';
import { hashPassword, normalizeEmail } from '../hrAuth';

const SEED_JD_ID_1 = 'seed-jd-mktg-001';
const SEED_JD_ID_2 = 'seed-jd-tech-001';

const SEED_MARKETING_MAPPER_OUTPUT = {
  role_title: 'Junior Marketing Executive',
  core_dimensions: [
    'Sales & conversion logic',
    'Customer relationship',
    'Data awareness',
    'Adaptability',
    'Communication clarity',
  ],
  probe_targets: ['Google Analytics reporting', 'Social commerce conversion', 'Customer retention'],
  truncated_input: false,
};

const SEED_TECH_MAPPER_OUTPUT = {
  role_title: 'Senior Frontend Developer',
  core_dimensions: [
    'Technical breadth',
    'System design thinking',
    'Communication clarity',
    'Problem-solving approach',
    'Learning velocity',
  ],
  probe_targets: ['React architecture decisions', 'TypeScript quality', 'API integration tradeoffs'],
  truncated_input: false,
};

function seedSentinel(data: Partial<typeof DEFAULT_SENTINEL_DATA>) {
  return JSON.stringify(normalizeSentinelData({ ...DEFAULT_SENTINEL_DATA, ...data }));
}

const SEED_SESSIONS = [
  {
    id: 'seed-session-aisyah',
    jdId: SEED_JD_ID_1,
    candidateName: 'Aisyah Binti Razali',
    status: 'completed' as const,
    turnCount: 12,
    sentinelData: seedSentinel({ focus_loss_events: 1, total_away_duration_seconds: 8, paste_events: 0, tab_switches: 1, answer_timings_ms: [12000, 18000, 25000], last_answer_elapsed_ms: 25000 }),
    verdict: JSON.stringify({
      triage_result: 'AMBER',
      overall_score: 78,
      summary: 'Market instinct and executional ability above formal background. Strong social commerce track record with measurable customer retention outcomes. Probe for learning speed on analytics tooling — not tool familiarity per se. Auto-generated 3-week upskill path attached.',
      strengths: ['Social commerce', 'Customer retention', 'Community building', 'ROI instinct'],
      gaps: ['Google Analytics', 'Structured reporting'],
      dimension_scores: {
        'Sales & conversion logic':   { score: 88, label: 'Sales & conversion logic' },
        'Customer relationship':       { score: 82, label: 'Customer relationship' },
        'Data awareness':             { score: 41, label: 'Data awareness' },
        'Adaptability':               { score: 91, label: 'Adaptability' },
        'Communication clarity':      { score: 74, label: 'Communication clarity' },
      },
      authenticity_flag: false,
      human_review_required: false,
    }),
    verdictValid: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    completedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'seed-session-daniel',
    jdId: SEED_JD_ID_1,
    candidateName: 'Daniel Lim Jun Wei',
    status: 'completed' as const,
    turnCount: 10,
    sentinelData: seedSentinel({ answer_timings_ms: [10000, 14000, 19000], last_answer_elapsed_ms: 19000 }),
    verdict: JSON.stringify({
      triage_result: 'GREEN',
      overall_score: 84,
      summary: 'Strong match across all evaluated dimensions. Performance-oriented mindset with demonstrated measurability across campaign analytics and A/B testing. Recommend for final interview. Cultural fit signals are very high.',
      strengths: ['Campaign analytics', 'A/B testing', 'Meta Ads', 'Content strategy'],
      gaps: ['B2B experience'],
      dimension_scores: {
        'Sales & conversion logic':   { score: 79, label: 'Sales & conversion logic' },
        'Customer relationship':       { score: 72, label: 'Customer relationship' },
        'Data awareness':             { score: 86, label: 'Data awareness' },
        'Adaptability':               { score: 77, label: 'Adaptability' },
        'Communication clarity':      { score: 88, label: 'Communication clarity' },
      },
      authenticity_flag: false,
      human_review_required: false,
    }),
    verdictValid: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    completedAt: Date.now() - 1000 * 60 * 60 * 7,
  },
  {
    id: 'seed-session-anon',
    jdId: SEED_JD_ID_1,
    candidateName: 'Anonymous #3',
    status: 'completed' as const,
    turnCount: 4,
    sentinelData: seedSentinel({ focus_loss_events: 9, total_away_duration_seconds: 184, paste_events: 5, tab_switches: 8, answer_timings_ms: [9000, 15000, 145000], last_answer_elapsed_ms: 145000, timing_anomaly_count: 1, last_answer_timing_anomaly: true }),
    verdict: JSON.stringify({
      triage_result: 'RED',
      overall_score: 22,
      summary: 'Fundamental mismatch across evaluated dimensions. Significant anomaly flags detected during session — high paste frequency and repeated off-session periods suggest assisted responses. Requires HR review before any decision.',
      strengths: [],
      gaps: ['Communication clarity', 'Domain knowledge', 'Analytical thinking', 'Consistency'],
      dimension_scores: {
        'Sales & conversion logic':   { score: 18, label: 'Sales & conversion logic' },
        'Customer relationship':       { score: 24, label: 'Customer relationship' },
        'Data awareness':             { score: 29, label: 'Data awareness' },
        'Adaptability':               { score: 19, label: 'Adaptability' },
        'Communication clarity':      { score: 20, label: 'Communication clarity' },
      },
      authenticity_flag: true,
      human_review_required: true,
    }),
    verdictValid: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    completedAt: Date.now() - 1000 * 60 * 60 * 11,
  },
  {
    id: 'seed-session-siti',
    jdId: SEED_JD_ID_2,
    candidateName: 'Siti Norzahira Mohd',
    status: 'completed' as const,
    turnCount: 14,
    sentinelData: seedSentinel({ total_away_duration_seconds: 2, answer_timings_ms: [11000, 16000, 21000], last_answer_elapsed_ms: 21000 }),
    verdict: JSON.stringify({
      triage_result: 'GREEN',
      overall_score: 91,
      summary: 'Exceptional candidate. Demonstrates deep technical proficiency in React/TypeScript ecosystem with strong system design instincts. Communication is clear, precise, and confident. Highest-scoring candidate in this cohort. Fast-track recommended.',
      strengths: ['React ecosystem', 'TypeScript', 'System design', 'API architecture', 'Technical leadership'],
      gaps: ['Cloud infrastructure depth'],
      dimension_scores: {
        'Technical breadth':           { score: 93, label: 'Technical breadth' },
        'System design thinking':      { score: 88, label: 'System design thinking' },
        'Communication clarity':       { score: 94, label: 'Communication clarity' },
        'Problem-solving approach':    { score: 91, label: 'Problem-solving approach' },
        'Learning velocity':           { score: 89, label: 'Learning velocity' },
      },
      authenticity_flag: false,
      human_review_required: false,
    }),
    verdictValid: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    completedAt: Date.now() - 1000 * 60 * 60 * 23,
  },
  {
    id: 'seed-session-raj',
    jdId: SEED_JD_ID_2,
    candidateName: 'Raj Kumar Subramaniam',
    status: 'completed' as const,
    turnCount: 11,
    sentinelData: seedSentinel({ focus_loss_events: 2, total_away_duration_seconds: 15, paste_events: 1, tab_switches: 2, answer_timings_ms: [15000, 22000, 48000], last_answer_elapsed_ms: 48000 }),
    verdict: JSON.stringify({
      triage_result: 'AMBER',
      overall_score: 69,
      summary: 'Solid foundational skills with clear gaps in modern tooling and architecture patterns. Shows strong problem-solving instinct but struggles to articulate design tradeoffs clearly. Recommend a technical deep-dive interview focused on scalability scenarios before final decision.',
      strengths: ['Backend logic', 'Database design', 'Debugging instinct'],
      gaps: ['Modern React patterns', 'DevOps awareness', 'API design conventions'],
      dimension_scores: {
        'Technical breadth':           { score: 62, label: 'Technical breadth' },
        'System design thinking':      { score: 58, label: 'System design thinking' },
        'Communication clarity':       { score: 71, label: 'Communication clarity' },
        'Problem-solving approach':    { score: 80, label: 'Problem-solving approach' },
        'Learning velocity':           { score: 74, label: 'Learning velocity' },
      },
      authenticity_flag: false,
      human_review_required: false,
    }),
    verdictValid: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    completedAt: Date.now() - 1000 * 60 * 60 * 35,
  },
];

export async function seedIfEmpty() {
  try {
    await ensureDemoHrUsers();
    const existing = db.select().from(sessions).limit(1).all();
    if (existing.length > 0) {
      repairSeedMapperShapes();
      return; // Already seeded
    }

    // Insert JD records
    const now = Date.now();
    db.insert(jdCache).values([
      {
        id: SEED_JD_ID_1,
        employerId: 'nexus-digital',
        rawJd: 'Junior Marketing Executive at Nexus Digital Sdn Bhd, Kuala Lumpur. Focus on social commerce and digital campaigns.',
        roleTitle: 'Junior Marketing Executive',
        mapperOutput: JSON.stringify(SEED_MARKETING_MAPPER_OUTPUT),
        qaStatus: 'PASS',
        interviewLink: '/apply/seed-jd-mktg-001',
        createdAt: now - 1000 * 60 * 60 * 48,
      },
      {
        id: SEED_JD_ID_2,
        employerId: 'techcorp-my',
        rawJd: 'Senior Frontend Developer at TechCorp Malaysia. React, TypeScript, system design.',
        roleTitle: 'Senior Frontend Developer',
        mapperOutput: JSON.stringify(SEED_TECH_MAPPER_OUTPUT),
        qaStatus: 'PASS',
        interviewLink: '/apply/seed-jd-tech-001',
        createdAt: now - 1000 * 60 * 60 * 72,
      },
    ]).run();

    // Insert sessions
    for (const s of SEED_SESSIONS) {
      db.insert(sessions).values({ ...s, employerId: getEmployerForSeedSession(s.jdId) }).run();
    }

    // Add a few transcript rows for the first session
    db.insert(transcripts).values([
      {
        sessionId: 'seed-session-aisyah',
        turnNumber: 1,
        role: 'inquisitor',
        content: 'Hai Aisyah! Terima kasih kerana join sesi ni. Jangan risau — ni bukan exam, kita just nak tahu lebih dalam pasal pengalaman you. Boleh you cerita sikit pasal apa yang you buat sekarang, atau pengalaman kerja/bisnes you yang paling recent?',
        createdAt: now - 1000 * 60 * 60 * 5,
      },
      {
        sessionId: 'seed-session-aisyah',
        turnNumber: 2,
        role: 'candidate',
        content: 'Aku ada experience jual online, tapi takde degree lah. Sebelum ni kerja part-time jual baju kat TikTok Shop, boleh buat sampai RM8k sebulan.',
        createdAt: now - 1000 * 60 * 60 * 5 + 60000,
      },
    ]).run();

    console.log('[Seed] Seeded 2 JDs and 5 candidate sessions successfully.');
  } catch (err) {
    // Non-fatal — app continues without seed data
    console.error('[Seed] Could not seed data:', err);
  }
}

async function ensureDemoHrUsers() {
  const password = process.env.HR_DEMO_PASSWORD || 'TalentBridgeDemo123!';
  const demoUsers = [
    { id: 'default', email: process.env.HR_DEMO_EMAIL || 'admin@talentbridge.local' },
    { id: 'nexus-digital', email: 'nexus@talentbridge.local' },
    { id: 'techcorp-my', email: 'techcorp@talentbridge.local' },
  ];

  for (const demoUser of demoUsers) {
    const email = normalizeEmail(demoUser.email);
    const existingById = db.select().from(users).where(eq(users.id, demoUser.id)).get();
    if (existingById) continue;

    const existingByEmail = db.select().from(users).where(eq(users.email, email)).get();
    if (existingByEmail) continue;

    try {
      db.insert(users).values({
        id: demoUser.id,
        email,
        passwordHash: await hashPassword(password),
        createdAt: Date.now(),
      }).run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes('unique constraint')) {
        throw error;
      }
    }
  }
}

function getEmployerForSeedSession(jdId: string) {
  if (jdId === SEED_JD_ID_1) return 'nexus-digital';
  if (jdId === SEED_JD_ID_2) return 'techcorp-my';
  return 'default';
}

function repairSeedMapperShapes() {
  const seedJds = [
    { id: SEED_JD_ID_1, mapperOutput: SEED_MARKETING_MAPPER_OUTPUT },
    { id: SEED_JD_ID_2, mapperOutput: SEED_TECH_MAPPER_OUTPUT },
  ];

  for (const seedJd of seedJds) {
    const existingJd = db.select().from(jdCache).where(eq(jdCache.id, seedJd.id)).get();
    if (!existingJd) continue;

    try {
      const mapper = JSON.parse(existingJd.mapperOutput);
      if (Array.isArray(mapper.core_dimensions)) continue;
    } catch {
      // Repair malformed seed JSON below.
    }

    db.update(jdCache)
      .set({ mapperOutput: JSON.stringify(seedJd.mapperOutput) })
      .where(eq(jdCache.id, seedJd.id))
      .run();
  }

  db.update(sessions)
    .set({ employerId: 'nexus-digital' })
    .where(eq(sessions.jdId, SEED_JD_ID_1))
    .run();
  db.update(sessions)
    .set({ employerId: 'techcorp-my' })
    .where(eq(sessions.jdId, SEED_JD_ID_2))
    .run();
}
