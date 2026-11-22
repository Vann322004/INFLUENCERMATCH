export type CollectionOutcome = 'accepted' | 'rejected' | 'review' | 'pending';

export function collectionNeedsComparison(result: {
  status?: string; decision?: string; primary_type?: string; database_synced?: boolean;
}) {
  if (result.status !== 'success') return false;
  const decision = (result.decision || '').toUpperCase();
  return collectionOutcome(decision, result.primary_type) === 'review'
    || ['SKIP_INSUFFICIENT', 'RETRY_PREFLIGHT'].includes(decision)
    || (!result.database_synced && (!decision || decision === 'UNKNOWN'));
}

// A crawl completing is not an approval. Classification alone is not an approval either.
export function collectionOutcome(decision?: string, primaryType?: string): CollectionOutcome {
  const value = (decision || '').toUpperCase();
  if (['SKIP_INSUFFICIENT', 'AUTO_REJECT', 'REJECTED', 'MANAGER_REJECTED'].includes(value)) return 'rejected';
  if (['NEEDS_MANAGER_REVIEW', 'REVIEW', 'VERIFY', 'VERIFICATION', 'NEEDS_VERIFICATION'].includes(value)) return 'review';
  if (['AUTO_ACCEPT_KOC', 'AUTO_ACCEPT_KOL', 'ACCEPTED', 'PASS', 'MANAGER_APPROVED'].includes(value)) {
    return ['KOC', 'KOL'].includes((primaryType || '').toUpperCase()) || value.startsWith('AUTO_ACCEPT_')
      ? 'accepted' : 'review';
  }
  return 'pending';
}

export function collectionOutcomeLabel(outcome: CollectionOutcome) {
  return { accepted: 'Đã chấp nhận', rejected: 'Từ chối', review: 'Chờ kiểm định phân loại / ngành', pending: 'Chưa có kết quả đánh giá' }[outcome];
}

// Queueing requests processing; it does not approve a profile or bypass classification.
export function canQueueCollectionResult(result?: {
  status?: string; platform?: string; username?: string; decision?: string; primary_type?: string;
} | null): boolean {
  return Boolean(result
    && result.status === 'success'
    && result.username?.trim().replace(/^@+/, '').trim()
    && ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'YOUTUBE'].includes((result.platform || '').toUpperCase())
    && collectionOutcome(result.decision, result.primary_type) !== 'rejected');
}
