/** Validate that discovery payload contains a content array. */
export function assertContextFilteredDiscovery(payload: unknown): void {
  const page = payload as { content?: unknown[] } | null;
  if (!page || !Array.isArray(page.content)) {
    throw new Error('Dữ liệu khám phá creator không đúng định dạng.');
  }
}
