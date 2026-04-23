import { db } from '@/lib/db';
import { jdCache, sessions, transcripts } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import type { Confidence, VerdictResult } from '@/lib/types';
import { DEFAULT_SENTINEL_DATA, normalizeSentinelData } from '@/lib/sentinel';
import { requireHrUser } from '@/lib/hrAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    // 1. Create a dummy JD
    const jdId1 = uuid();
    await db.insert(jdCache).values({
      id: jdId1,
      employerId: user.id,
      rawJd: 'Senior Product Marketing Manager...',
      roleTitle: 'Senior Product Marketing Manager',
      mapperOutput: JSON.stringify({
        role_title: 'Senior Product Marketing Manager',
        core_dimensions: ['Go-to-Market Strategy', 'Cross-functional Leadership', 'Market Research', 'Content Creation'] // Array of strings
      }),
      qaStatus: 'PASS',
      qaOutput: '{}',
      interviewLink: `/interview/${jdId1}-demo`,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    });

    const jdId2 = uuid();
    await db.insert(jdCache).values({
      id: jdId2,
      employerId: user.id,
      rawJd: 'Junior Frontend Developer...',
      roleTitle: 'Junior Frontend Developer',
      mapperOutput: JSON.stringify({
        role_title: 'Junior Frontend Developer',
        core_dimensions: ['React & UI Execution', 'State Management', 'Problem Solving', 'Adaptability']
      }),
      qaStatus: 'PASS',
      qaOutput: '{}',
      interviewLink: `/interview/${jdId2}-demo`,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    });

    // 2. Create Dummy Sessions
    const dummyCandidates = [
      { name: 'Aisyah Razali', jd: jdId1, triage: 'AMBER', score: 78, strengths: ['Social commerce', 'Customer retention', 'ROI instinct'], gaps: ['Google Analytics', 'Structured reporting'] },
      { name: 'Daniel Lim Jun Wei', jd: jdId1, triage: 'GREEN', score: 88, strengths: ['Campaign analytics', 'A/B testing', 'Meta Ads'], gaps: ['B2B experience'] },
      { name: 'Siti Norzahira', jd: jdId2, triage: 'GREEN', score: 92, strengths: ['React Hooks', 'Zustand', 'Component Architecture'], gaps: [] },
      { name: 'Anonymous #42', jd: jdId2, triage: 'RED', score: 34, strengths: ['HTML/CSS basics'], gaps: ['No React experience', 'Copied answers'] },
      { name: 'Wei Ming', jd: jdId1, triage: 'GREEN', score: 85, strengths: ['Content Strategy', 'SEO optimization'], gaps: ['Video editing'] },
      { name: 'Sarah Tan', jd: jdId2, triage: 'AMBER', score: 65, strengths: ['UI Design', 'CSS animations'], gaps: ['Complex state management'] },
    ];

    for (const c of dummyCandidates) {
      const sId = uuid();
      const dims = c.jd === jdId1 
        ? ['Go-to-Market Strategy', 'Cross-functional Leadership', 'Market Research', 'Content Creation']
        : ['React & UI Execution', 'State Management', 'Problem Solving', 'Adaptability'];

      const dimScores: VerdictResult['dimension_scores'] = {};
      dims.forEach(d => {
        // Random score based on triage
        const base = c.triage === 'GREEN' ? 75 : c.triage === 'AMBER' ? 55 : 20;
        const s = Math.min(100, Math.max(0, base + Math.floor(Math.random() * 25)));
        dimScores[d] = {
          score: s,
          confidence: (s > 70 ? 'high' : 'medium') as Confidence,
          key_evidence: 'Demonstrated clear reasoning.'
        };
      });

      const sentinelData = c.triage === 'RED'
        ? normalizeSentinelData({ ...DEFAULT_SENTINEL_DATA, focus_loss_events: 5, total_away_duration_seconds: 40, paste_events: 3, tab_switches: 4, answer_timings_ms: [18000, 22000, 110000], last_answer_elapsed_ms: 110000, timing_anomaly_count: 1, last_answer_timing_anomaly: true })
        : DEFAULT_SENTINEL_DATA;

      await db.insert(sessions).values({
        id: sId,
        jdId: c.jd,
        employerId: user.id,
        candidateName: c.name,
        status: 'completed',
        turnCount: 8,
        coverageMap: '{}',
        sentinelData: JSON.stringify(sentinelData),
        verdict: JSON.stringify({
          authenticity_status: c.triage === 'RED' ? 'flagged' : 'clean',
          triage_result: c.triage,
          dimension_scores: dimScores,
          verified_strengths: c.strengths,
          identified_gaps: c.gaps,
          ai_summary: `${c.name} showed strong capabilities in ${c.strengths.join(', ')}.`,
          style_consistency_score: c.triage === 'RED' ? 30 : 90,
          human_review_required: c.triage === 'RED'
        }),
        verdictValid: true,
        createdAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 48), // random within last 48 hrs
        completedAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24),
      });

      // Insert fake active users
      for (let i = 0; i < 3; i++) {
        await db.insert(sessions).values({
          id: uuid(),
          jdId: jdId1,
          employerId: user.id,
          candidateName: `Active User ${i+1}`,
          status: 'active',
          turnCount: Math.floor(Math.random() * 5) + 1,
          coverageMap: '{}',
          sentinelData: JSON.stringify(DEFAULT_SENTINEL_DATA),
          createdAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60), // recently
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully with beautiful dummy data.' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
