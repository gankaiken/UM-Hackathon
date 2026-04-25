export interface JobEditorFields {
  title: string;
  description: string;
  requirements: string;
}

export interface ScheduleSlotInput {
  start: string;
  end: string;
  available: boolean;
}

const TITLE_MARKER = 'Title:';
const DESCRIPTION_MARKER = 'Description:';
const REQUIREMENTS_MARKER = 'Requirements:';

export function buildStructuredJobText(fields: JobEditorFields) {
  const title = fields.title.trim();
  const description = fields.description.trim();
  const requirements = fields.requirements.trim();

  return [
    `${TITLE_MARKER}\n${title}`,
    `${DESCRIPTION_MARKER}\n${description}`,
    `${REQUIREMENTS_MARKER}\n${requirements}`,
  ].join('\n\n');
}

export function parseStructuredJobText(rawJd: string, fallbackTitle = ''): JobEditorFields {
  const titleMatch = rawJd.match(/Title:\s*\n([\s\S]*?)\n\nDescription:\s*\n/i);
  const descriptionMatch = rawJd.match(/Description:\s*\n([\s\S]*?)\n\nRequirements:\s*\n/i);
  const requirementsMatch = rawJd.match(/Requirements:\s*\n([\s\S]*)$/i);

  if (titleMatch && descriptionMatch && requirementsMatch) {
    return {
      title: titleMatch[1].trim(),
      description: descriptionMatch[1].trim(),
      requirements: requirementsMatch[1].trim(),
    };
  }

  return {
    title: fallbackTitle,
    description: rawJd.trim(),
    requirements: '',
  };
}

export function parseTimeslotsInput(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ScheduleSlotInput[];
  }

  return value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const slot = item as Record<string, unknown>;
      const start = typeof slot.start === 'string' ? slot.start : '';
      const end = typeof slot.end === 'string' ? slot.end : '';
      if (!start || !end) return null;

      return {
        start,
        end,
        available: slot.available !== false,
      };
    })
    .filter((slot): slot is ScheduleSlotInput => Boolean(slot));
}

export function serializeTimeslots(timeslots: ScheduleSlotInput[]) {
  return JSON.stringify(timeslots);
}
