import apiClient from '../apiClient';

export type MetaPlatform = 'FACEBOOK' | 'INSTAGRAM';
type MetaFlow = 'FACEBOOK_LOGIN' | 'INSTAGRAM_LOGIN';

export interface ConnectionOption {
  platform: MetaPlatform;
  oauthFlow: MetaFlow;
  available: boolean;
}

export interface LinkedChannel {
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
  matchStatus: 'AVAILABLE' | 'ALREADY_LINKED' | 'UNMATCHED' | 'UNAVAILABLE';
}

export interface OAuthSession {
  sessionId: string;
  platform: MetaPlatform;
  status: 'NEW' | 'READY' | 'FAILED' | 'EXPIRED' | 'COMPLETED';
  accounts: OAuthAccount[];
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
    return data.data.filter((option: ConnectionOption) => option.available && (
      (option.oauthFlow === 'FACEBOOK_LOGIN' && ['FACEBOOK', 'INSTAGRAM'].includes(option.platform))
      || (option.oauthFlow === 'INSTAGRAM_LOGIN' && option.platform === 'INSTAGRAM')
    ));
  },
  async start(option: ConnectionOption): Promise<{ sessionId: string; authorizationUrl: string; expiresAt: string }> {
    const directInstagram = option.oauthFlow === 'INSTAGRAM_LOGIN';
    const path = directInstagram ? portal + '/connect/instagram/start' : meta + '/start';
    const { data } = await apiClient.post(path, directInstagram ? {} : { platform: option.platform });
    return data.data;
  },
  async readSession(id: string, signal?: AbortSignal): Promise<OAuthSession> {
    const { data } = await apiClient.get(sessionPath(id), { signal });
    if (data?.data?.sessionId !== id || !Array.isArray(data?.data?.accounts)) {
      throw new Error('Phiên xác minh không hợp lệ.');
    }
    return data.data;
  },
  async confirm(id: string, accountId: string): Promise<void> {
    const { data } = await apiClient.post(sessionPath(id) + '/confirm', { accountId });
    if (data?.data?.sessionId !== id || data?.data?.status !== 'AUTHORIZED' || !data?.data?.creatorId) {
      throw new Error('Chưa xác nhận được kết quả liên kết.');
    }
  },
};
