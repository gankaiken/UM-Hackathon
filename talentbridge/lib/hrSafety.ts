const BLOCKED_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'age', pattern: /\bage\b|years old|date of birth|dob\b/i },
  { label: 'race', pattern: /\brace\b/i },
  { label: 'ethnicity', pattern: /\bethnic(?:ity)?\b/i },
  { label: 'religion', pattern: /\brelig(?:ion|ious)\b/i },
  { label: 'gender', pattern: /\bgender\b|\bmale\b|\bfemale\b|\bsex\b/i },
  { label: 'marital status', pattern: /\bmarital status\b|\bmarried\b|\bsingle\b/i },
  { label: 'disability', pattern: /\bdisab(?:ility|led)\b|\bhandicap\b/i },
];

const NATIONALITY_PATTERN = /\bnationality\b|\bcitizen(ship)?\b|\bcountry of origin\b/i;
const MANDARIN_PATTERN = /\bmandarin\b|\bchinese speaking\b|\bchinese language\b/i;
const MBTI_PATTERN = /\bmbti\b|\bpersonality\b|\bpersonality test\b|\bpersonality type\b/i;

export interface HrSafetyValidationResult {
  customDimensions: string[];
  quizQuestions: string[];
  warnings: string[];
  blocked: string[];
}

export function validateHrInputs(input: {
  customDimensions?: unknown;
  quizQuestions?: unknown;
}): HrSafetyValidationResult {
  const warnings: string[] = [];
  const blocked: string[] = [];

  const customDimensions = sanitizeItems(input.customDimensions, 'Custom dimension', warnings, blocked);
  const quizQuestions = sanitizeItems(input.quizQuestions, 'Quiz question', warnings, blocked);

  return {
    customDimensions,
    quizQuestions,
    warnings: dedupeStrings(warnings),
    blocked: dedupeStrings(blocked),
  };
}

export function buildSafetyErrorMessage(blocked: string[]) {
  return blocked.length > 0
    ? `Unsafe or discriminatory hiring criteria detected: ${blocked.join(' ')}`
    : 'Unsafe or discriminatory hiring criteria detected.';
}

function sanitizeItems(
  value: unknown,
  label: string,
  warnings: string[],
  blocked: string[]
) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return dedupeStrings(
    value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .map(item => sanitizeItem(item, label, warnings, blocked))
      .filter(Boolean) as string[]
  );
}

function sanitizeItem(
  item: string,
  label: string,
  warnings: string[],
  blocked: string[]
) {
  for (const entry of BLOCKED_PATTERNS) {
    if (entry.pattern.test(item)) {
      blocked.push(`${label} "${item}" references ${entry.label}, which is not allowed.`);
      return null;
    }
  }

  if (NATIONALITY_PATTERN.test(item)) {
    warnings.push(`${label} "${item}" was reframed to legal work authorization.`);
    return 'Legal work authorization for the role location';
  }

  if (MANDARIN_PATTERN.test(item)) {
    warnings.push(`${label} "${item}" was reframed to role-based Mandarin proficiency.`);
    return 'Mandarin proficiency required for role communication';
  }

  if (MBTI_PATTERN.test(item)) {
    warnings.push(`${label} "${item}" is limited to optional context only and must not be used for scoring or rejection.`);
    return `${item} (optional context only - not used for scoring or rejection)`;
  }

  return item;
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}
