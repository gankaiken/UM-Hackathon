// lib/schemaValidator.ts
// Schema Validator — pure TypeScript, zero AI tokens.
// Validates Auditor output structural completeness before Verdict Card is released.

import type { VerdictResult, ValidationResult, MapperResult, SentinelData, StyleAnalysisResult } from './types';

export function validateAuditorOutput(
  verdict: VerdictResult,
  mapper: MapperResult,
  sentinelData: SentinelData,
  styleAnalysis: StyleAnalysisResult | null
): ValidationResult {
  const errors: string[] = [];

  // Rule 1: All Mapper dimensions must be scored
  for (const dim of mapper.core_dimensions) {
    if (!verdict.dimension_scores || !verdict.dimension_scores[dim]) {
      errors.push(`MISSING DIMENSION SCORE: "${dim}"`);
    }
  }

  // Rule 2: Score range validation
  for (const [dim, score] of Object.entries(verdict.dimension_scores ?? {})) {
    if (score.score < 0 || score.score > 100) {
      errors.push(`INVALID SCORE for "${dim}": ${score.score} (must be 0-100)`);
    }
    if (score.confidence && !['high', 'medium', 'low'].includes(score.confidence)) {
      errors.push(`INVALID CONFIDENCE for "${dim}": ${score.confidence}`);
    }
  }

  // Rule 3: AMBER must have upskill_path
  if (verdict.triage_result === 'AMBER') {
    if (!verdict.upskill_path || verdict.upskill_path.length === 0) {
      errors.push('AMBER verdict missing upskill_path');
    }
  }

  // Rule 4: RED must NOT have upskill_path
  if (verdict.triage_result === 'RED') {
    if (verdict.upskill_path && verdict.upskill_path.length > 0) {
      errors.push('RED verdict must not contain upskill_path');
    }
    if (!verdict.career_orientation) {
      errors.push('RED verdict missing career_orientation');
    }
  }

  // Rule 5: GREEN must not have career_orientation or upskill_path
  if (verdict.triage_result === 'GREEN') {
    if (verdict.career_orientation) {
      errors.push('GREEN verdict must not have career_orientation');
    }
  }

  // Rule 6: explicit Sentinel Stage 2 must trigger human review
  if (sentinelData.integrity_stage === 'stage_2_alert') {
    if (!verdict.human_review_required) {
      errors.push('Sentinel Stage 2 fired but human_review_required is false');
    }
  }

  // Rule 7: Style score must be present if Style Analyzer was triggered
  if (styleAnalysis !== null && verdict.style_consistency_score === null) {
    errors.push('Style Analyzer was triggered but style_consistency_score is null');
  }

  // Rule 8: style_consistency_score < 40 must trigger human review
  if (
    verdict.style_consistency_score !== null &&
    verdict.style_consistency_score !== undefined &&
    verdict.style_consistency_score < 40 &&
    !verdict.human_review_required
  ) {
    errors.push('style_consistency_score < 40 requires human_review_required: true');
  }

  // Rule 9: Required fields present
  if (!verdict.triage_result || !['GREEN', 'AMBER', 'RED'].includes(verdict.triage_result)) {
    errors.push(`Invalid triage_result: ${verdict.triage_result}`);
  }
  if (!verdict.ai_summary || verdict.ai_summary.trim().length < 10) {
    errors.push('ai_summary is missing or too short');
  }
  if (!verdict.verified_strengths || verdict.verified_strengths.length === 0) {
    errors.push('verified_strengths must contain at least 1 item');
  }

  if (errors.length > 0) {
    return { valid: false, retry_feedback: errors };
  }

  return { valid: true };
}
