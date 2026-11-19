/** Accept progressive retrieval only when expanded candidates are labelled explicitly. */
export function assertContextFilteredDiscovery(payload: unknown): void {
  const page = payload as { content?: Array<{ aiScoreAvailable?: boolean; discoveryPolicyVersion?: string; isSimilarFallback?: boolean; expansionReasons?: string[] }> } | null;
  if (!page || !Array.isArray(page.content)) {
    throw new Error('Dữ liệu khám phá creator không đúng định dạng.');
  }
  if (page.content.some(row => !row || row.aiScoreAvailable !== false
      || !['context-db-v2', 'progressive-v3'].includes(row.discoveryPolicyVersion || '')
      || (row.isSimilarFallback === true && (row.discoveryPolicyVersion !== 'progressive-v3'
        || !Array.isArray(row.expansionReasons) || row.expansionReasons.length === 0)))) {
    throw new Error('Chưa nhận được danh sách đã lọc đúng theo tiêu chí chiến dịch. Vui lòng tải lại sau khi hệ thống cập nhật.');
  }
}
