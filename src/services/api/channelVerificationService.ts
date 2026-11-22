import apiClient from '../apiClient';

export type MetaPlatform = 'FACEBOOK' | 'INSTAGRAM';
export type OAuthPlatform = MetaPlatform | 'TIKTOK';
export type OAuthFlow = 'FACEBOOK_LOGIN' | 'INSTAGRAM_LOGIN' | 'TIKTOK_LOGIN';

export interface ConnectionOption {
  environment?: string;
  requirements?: string[];
  platform: OAuthPlatform;
  oauthFlow: OAuthFlow;
  supported: boolean;
  available: boolean;
  unavailableReason?: string | null;
}

export interface LinkedChannel {
  verification?: { status: 'VERIFIED' | 'UNVERIFIED' | 'LEGACY_UNVERIFIED' | 'SIMULATED';
    method: string | null; verifiedAt: string | null; evidenceSource: string; environment: string | null };
  id: string;
  platform: string;
  externalId: string;
  userName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  profileUrl?: string | null;
  verifiedByInfluencerMatch: boolean;
}

export interface OAuthAccount {
  accountId: string;
  name?: string | null;
  username?: string | null;
  matchStatus: 'AVAILABLE' | 'ALREADY_LINKED' | 'UNMATCHED' | 'UNAVAILABLE' | 'INSUFFICIENT_EVIDENCE';
}

export interface OAuthSession {
  sessionId: string;
  platform: OAuthPlatform;
  status: 'NEW' | 'EXCHANGING' | 'READY' | 'FAILED' | 'EXPIRED' | 'COMPLETED';
  accounts: OAuthAccount[];
  account?: { username?: string | null; displayName?: string | null; matchStatus?: string | null };
  creatorId?: string;
}

export interface OAuthStartContext {
  creatorId?: string;
  cooperationInvitationToken?: string;
}

const portal = '/creators/portal/accounts';
const meta = portal + '/connect/meta';
const sessionPath = (id: string) => meta + '/sessions/' + encodeURIComponent(id);

export const channelVerificationService = {
  async listLinked(signal?: AbortSignal): Promise<LinkedChannel[]> {
    const { data } = await apiClient.get(portal, { signal });
    if (!Array.isArray(data?.data)) throw new Error('Danh sách kênh đã liên kết không hợp lệ.');
    return data.data;
  },
  async options(signal?: AbortSignal): Promise<ConnectionOption[]> {
    const { data } = await apiClient.get(portal + '/connection-options', { signal });
    if (!Array.isArray(data?.data)) throw new Error('Danh sách phương thức xác minh không hợp lệ.');
    return data.data.filter((option: ConnectionOption) => option.supported && (
      (option.oauthFlow === 'FACEBOOK_LOGIN' && ['FACEBOOK', 'INSTAGRAM'].includes(option.platform))
      || (option.oauthFlow === 'INSTAGRAM_LOGIN' && option.platform === 'INSTAGRAM')
      || (option.oauthFlow === 'TIKTOK_LOGIN' && option.platform === 'TIKTOK')
    ));
  },
  async start(option: ConnectionOption, context: OAuthStartContext = {}): Promise<{ sessionId: string; authorizationUrl: string; expiresAt: string }> {
    const directInstagram = option.oauthFlow === 'INSTAGRAM_LOGIN';
    const path = option.oauthFlow === 'TIKTOK_LOGIN' ? portal + '/connect/tiktok/start'
      : directInstagram ? portal + '/connect/instagram/start' : meta + '/start';
    const body = option.oauthFlow === 'FACEBOOK_LOGIN'
      ? { platform: option.platform, ...context } : context;
    const { data } = await apiClient.post(path, body);
    return data.data;
  },
  async readSession(id: string, flow: OAuthFlow, signal?: AbortSignal): Promise<OAuthSession> {
    const tiktok = flow === 'TIKTOK_LOGIN';
    const path = tiktok ? portal + '/connect/tiktok/sessions/' + encodeURIComponent(id) : sessionPath(id);
    const { data } = await apiClient.get(path, { signal });
    const session = data?.data;
    if (session?.sessionId !== id
        || (tiktok ? session.platform !== 'TIKTOK' : !Array.isArray(session.accounts))) {
      throw new Error('Phiên xác minh không hợp lệ.');
    }
    return tiktok ? { ...session, accounts: [] } : session;
  },
  async confirm(id: string, accountId: string): Promise<string> {
    const { data } = await apiClient.post(sessionPath(id) + '/confirm', { accountId });
    if (data?.data?.sessionId !== id || data?.data?.status !== 'AUTHORIZED' || !data?.data?.creatorId) {
      throw new Error('Chưa xác nhận được kết quả liên kết.');
    }
    return data.data.creatorId;
  },
  async cancel(id: string, flow: OAuthFlow): Promise<OAuthSession> {
    const path = flow === 'TIKTOK_LOGIN'
      ? portal + '/connect/tiktok/sessions/' + encodeURIComponent(id) : sessionPath(id);
    const { data } = await apiClient.post(path + '/cancel');
    if (data?.data?.sessionId !== id || !['FAILED', 'EXPIRED', 'COMPLETED'].includes(data?.data?.status)) {
      throw new Error('Chưa xác nhận được việc hủy phiên. Hãy kiểm tra lại.');
    }
    return data.data;
  },
};
