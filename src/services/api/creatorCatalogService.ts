import apiClient from '../apiClient';
import { readPage } from './pageResponse';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'LEGACY_UNVERIFIED' | 'SIMULATED';
export interface CatalogMaster {
  id: string; userId: string | null; canonicalName: string | null; status: string;
  createdAt: string | null; accountCount: number; verificationCounts: Partial<Record<VerificationStatus, number>>;
}
export interface CatalogAccount {
  creatorId: string; masterId: string | null; platform: string; externalId: string | null;
  userName: string | null; displayName: string | null; sourceType: string | null;
  isStableId: boolean; createdAt: string | null;
  verification: { status: VerificationStatus; method: string | null; verifiedAt: string | null;
    evidenceSource: string | null; environment: string | null } | null;
}
export interface IdentityEvent {
  sourceId: string; source: string; eventType: string; occurredAt: string | null;
  actorId: string | null; creatorId: string | null; masterId: string | null;
  claimId: string | null; status: string | null; reasonCode: string | null;
}
export interface CatalogSummary {
  totalMasters: number; claimedChannelsCount: number; unclaimedChannelsCount: number; duplicateCandidatesCount: number;
}
export interface CatalogFilters {
  page: number; size: number; q?: string; status?: string; platform?: string;
  verificationStatus?: string; sourceType?: string; isStableId?: boolean;
}
export interface HistoryFilters {
  page: number; size: number; masterId?: string; creatorId?: string; claimId?: string;
  actorId?: string; eventType?: string; from?: string; to?: string;
}
function master(value: CatalogMaster) {
  if (!value || typeof value.id !== 'string' || !Number.isSafeInteger(value.accountCount) || value.accountCount < 0
    || !value.verificationCounts || Object.values(value.verificationCounts).some(n => !Number.isSafeInteger(n) || n! < 0)) {
    throw new Error('Dữ liệu hồ sơ định danh không hợp lệ.');
  }
  return value;
}
function account(value: CatalogAccount) {
  if (!value || typeof value.creatorId !== 'string' || typeof value.platform !== 'string'
    || typeof value.isStableId !== 'boolean') throw new Error('Dữ liệu kênh liên kết không hợp lệ.');
  return value;
}
async function page<T>(url: string, params: object, validate: (row: T) => T) {
  const cleaned = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const response = await apiClient.get(url, { params: cleaned });
  const result = readPage<T>(response.data);
  return { ...result, items: result.items.map(validate) };
}
export const creatorCatalogService = {
  masters: (params: CatalogFilters) => page<CatalogMaster>('/data/creator-masters', params, master),
  async master(id: string) {
    const response = await apiClient.get('/data/creator-masters/' + encodeURIComponent(id));
    if (response.data?.success === false) throw new Error('Không tải được hồ sơ định danh.');
    return master(response.data?.data ?? response.data);
  },
  accounts: (id: string, params: { page: number; size: number }) =>
    page<CatalogAccount>('/data/creator-masters/' + encodeURIComponent(id) + '/accounts', params, account),
  unclaimed: (params: CatalogFilters) => page<CatalogAccount>('/data/creator-accounts/unclaimed', params, account),
  events: (params: HistoryFilters) => page<IdentityEvent>('/data/creator-identity-events', params, row => {
    if (!row || typeof row.sourceId !== 'string' || typeof row.source !== 'string' || typeof row.eventType !== 'string') {
      throw new Error('Dữ liệu lịch sử định danh không hợp lệ.');
    }
    return row;
  }),
  async summary(): Promise<CatalogSummary> {
    const response = await apiClient.get('/data/creator-masters/summary');
    const data = response.data?.data ?? response.data;
    const fields = ['totalMasters', 'claimedChannelsCount', 'unclaimedChannelsCount', 'duplicateCandidatesCount'] as const;
    if (response.data?.success === false || fields.some(key => !Number.isSafeInteger(data?.[key]) || data[key] < 0)) {
      throw new Error('Số liệu định danh không hợp lệ.');
    }
    return Object.fromEntries(fields.map(key => [key, data[key]])) as unknown as CatalogSummary;
  },
};
