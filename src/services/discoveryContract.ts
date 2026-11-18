/** Never present legacy broad/AI fallback results as context-filtered discovery. */
export function assertContextFilteredDiscovery(payload: unknown): void {
  const page = payload as { content?: Array<{ aiScoreAvailable?: boolean; discoveryPolicyVersion?: string }> } | null;
  if (!page || !Array.isArray(page.content)) {
    throw new Error('Dữ liệu khám phá creator không đúng định dạng.');
  }
  if (page.content.some(row => !row || row.aiScoreAvailable !== false || row.discoveryPolicyVersion !== 'context-db-v2')) {
    throw new Error('Chưa nhận được danh sách đã lọc đúng theo tiêu chí chiến dịch. Vui lòng tải lại sau khi hệ thống cập nhật.');
  }
}
