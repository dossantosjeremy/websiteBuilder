export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function trimToTokenLimit(obj: unknown, maxTokens: number): string {
  const json = JSON.stringify(obj);
  if (estimateTokens(json) <= maxTokens) return json;
  return json.slice(0, maxTokens * 4);
}
