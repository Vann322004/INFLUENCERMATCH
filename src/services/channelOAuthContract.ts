// Validation of the navigation contract only; ownership is always checked by BE.
export function consentUrl(raw: string, flow: string, origin: string): string {
  const direct = flow === 'INSTAGRAM_LOGIN';
  const unified = flow === 'INSTAGRAM_UNIFIED_LOGIN';
  const tiktok = flow === 'TIKTOK_LOGIN';
  if (!['INSTAGRAM_LOGIN', 'INSTAGRAM_UNIFIED_LOGIN', 'FACEBOOK_LOGIN', 'TIKTOK_LOGIN'].includes(flow)) {
    throw new Error('Phương thức xác minh không hợp lệ.');
  }
  const provider = tiktok ? 'https://www.tiktok.com' : direct ? 'https://www.instagram.com' : 'https://www.facebook.com';
  const callbackPath = '/api/v1/integrations/' + (tiktok ? 'tiktok' : direct ? 'instagram' : unified ? 'instagram-unified' : 'meta') + '/callback';
  const url = new URL(raw);
  const callback = new URL(url.searchParams.get('redirect_uri') ?? '');
  if (url.origin !== provider || url.username || url.password || url.hash
      || callback.href !== new URL(callbackPath, origin).href
      || unified && (!/^\/(?:v\d+\.\d+\/)?dialog\/oauth\/?$/.test(url.pathname)
        || url.searchParams.get('response_type') !== 'code'
        || !/^\d+$/.test(url.searchParams.get('client_id') ?? '')
        || !/^\d+$/.test(url.searchParams.get('config_id') ?? '')
        || !/^[a-f0-9]{64}$/.test(url.searchParams.get('state') ?? '')
        || url.searchParams.has('scope'))) {
    throw new Error('Địa chỉ chuyển hướng OAuth chưa khớp với trang hiện tại.');
  }
  return url.href;
}

export function matchesOAuthSession(session: unknown, id: string, flow: string): boolean {
  if (!session || typeof session !== 'object') return false;
  const value = session as Record<string, unknown>;
  if (value.sessionId !== id || !['NEW', 'EXCHANGING', 'READY', 'FAILED', 'EXPIRED', 'COMPLETED'].includes(String(value.status))) return false;
  if (flow === 'TIKTOK_LOGIN') return value.platform === 'TIKTOK';
  if (value.oauthFlow !== flow || !Array.isArray(value.accounts)) return false;
  if (flow === 'FACEBOOK_LOGIN' ? !['FACEBOOK', 'INSTAGRAM'].includes(String(value.platform)) : value.platform !== 'INSTAGRAM') return false;
  return value.accounts.every(account => account && typeof account.accountId === 'string'
    && account.accountId.length > 0
    && ['AVAILABLE', 'ALREADY_LINKED', 'UNMATCHED', 'UNAVAILABLE', 'INSUFFICIENT_EVIDENCE'].includes(account.matchStatus));
}
