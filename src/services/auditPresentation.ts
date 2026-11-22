export function auditOutcome(item: { status?: string; decision?: string; creatorType?: string }) {
  if (['SKIP_INSUFFICIENT', 'NEEDS_MANAGER_REVIEW', 'RETRY_PREFLIGHT'].includes(item.decision || '')
      || item.status === 'NEEDS_REVIEW') return 'review';
  if (item.status === 'VALID_KOC' || item.status === 'VALID_KOL') return 'valid';
  if (item.status === 'JUNK_SHOP_CATALOG' && ['BRAND', 'SPAM', 'ORGANIZATION'].includes(item.creatorType || '')) return 'excluded';
  return 'review';
}

export function auditHttpUrl(value?: string) {
  try {
    const url = new URL(value || '');
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function auditProfileUrl(item?: { platform?: string; username?: string; profileUrl?: string } | null) {
  const saved = auditHttpUrl(item?.profileUrl);
  if (saved) return saved;
  const username = item?.username?.trim().replace(/^@+/, '');
  if (!username) return undefined;
  const handle = encodeURIComponent(username);
  switch (item?.platform?.toUpperCase()) {
    case 'TIKTOK': return `https://www.tiktok.com/@${handle}`;
    case 'INSTAGRAM': return `https://www.instagram.com/${handle}/`;
    case 'FACEBOOK': return /^\d+$/.test(username)
      ? `https://www.facebook.com/profile.php?id=${handle}` : `https://www.facebook.com/${handle}`;
    case 'YOUTUBE': return `https://www.youtube.com/@${handle}`;
    default: return undefined;
  }
}
