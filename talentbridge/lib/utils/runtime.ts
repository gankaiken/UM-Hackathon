export function getCurrentTimestamp(): number {
  return Date.now();
}

export function buildMessageId(prefix: string): string {
  return `${prefix}-${getCurrentTimestamp()}`;
}

export function hashStringToRange(input: string, min: number, max: number): number {
  if (max <= min) return min;

  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  const span = max - min;
  return min + (hash % (span + 1));
}
