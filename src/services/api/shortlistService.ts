import apiClient from '../apiClient';
import { readPage } from './pageResponse';
import type { PageResponse } from '../../types/api/common.types';
import type { AddShortlistItemPayload, ShortlistPriority } from '../../types/api/creator.types';
import type { ShortlistRecord, ShortlistStatus, Comparison, CompareItem, BatchAddResult, ContactReadiness, OutreachResult } from '../../types/api/shortlist.types';

const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
function id(value: string) { if (!uuid.test(value)) throw new Error('Mã chiến dịch hoặc kênh không hợp lệ.'); return value; }
function dataOf(payload: any): any { if (payload?.success === false) throw new Error('API không thực hiện được yêu cầu.'); return payload?.data ?? payload; }
function number(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Chỉ số Creator không hợp lệ.');
  return value;
}
function record(raw: any, campaignId: string): ShortlistRecord {
  if (!raw || !uuid.test(raw.id) || !uuid.test(raw.creatorId) || raw.campaignId !== campaignId
    || !['LOW','MEDIUM','HIGH'].includes(raw.priority) || !['SAVED','READY_TO_CONTACT','CONTACTED','REMOVED'].includes(raw.status)) throw new Error('Dữ liệu shortlist không hợp lệ.');
  return { ...raw, masterId: raw.masterId ?? null, note: raw.note ?? null, addedAt: raw.addedAt ?? null,
    followers: number(raw.followers), engagementRate: number(raw.engagementRate), dataConfidence: number(raw.dataConfidence),
    verification: raw.verification ?? null, declaredProfile: raw.declaredProfile ?? null };
}
const path = (campaignId: string) => `/campaigns/${id(campaignId)}/shortlist`;
const orderedDistinct = (values: string[], min: number, max: number) => {
  if (values.length < min || values.length > max || new Set(values).size !== values.length) throw new Error(`Cần chọn ${min}–${max} kênh khác nhau.`);
  values.forEach(id);
};

export const shortlistService = {
  async campaigns(): Promise<{ id: string; name: string; status: string }[]> {
    // Reading a shortlist never creates a placeholder Brand profile.
    const brand = dataOf((await apiClient.get('/brands/me')).data);
    if (!brand?.id || !uuid.test(brand.id)) throw new Error('Cần hồ sơ thương hiệu hợp lệ để xem chiến dịch.');
    const rows: { id: string; name: string; status: string }[] = [];
    let page = 0;
    while (true) {
      const response = await apiClient.get(`/brands/${brand.id}/campaigns`, { params: { page, size: 50 } });
      const result = readPage<any>(response.data);
      if (result.items.some(item => !uuid.test(item?.id) || typeof item.name !== 'string')) throw new Error('Danh sách chiến dịch không hợp lệ.');
      rows.push(...result.items);
      if (++page >= result.totalPages) break;
    }
    return rows;
  },
  async list(campaignId: string, params: { page?: number; size?: number; priority?: ShortlistPriority; status?: ShortlistStatus; platform?: string } = {}, signal?: AbortSignal): Promise<PageResponse<ShortlistRecord>> {
    const response = await apiClient.get(path(campaignId), { params: { page: 0, size: 20, ...params }, signal });
    const result = readPage<any>(response.data);
    return { ...result, items: result.items.map(item => record(item, campaignId)) };
  },
  async all(campaignId: string): Promise<ShortlistRecord[]> {
    const rows: ShortlistRecord[] = []; let page = 0;
    while (true) { const result = await this.list(campaignId, { page, size: 100 }); rows.push(...result.items);
      if (++page >= result.totalPages) return rows; }
  },
  async add(campaignId: string, payload: AddShortlistItemPayload): Promise<ShortlistRecord> {
    id(payload.creatorId);
    const response = await apiClient.post(path(campaignId), { creatorId: payload.creatorId, priority: payload.priority, note: payload.note });
    const item = record(dataOf(response.data), campaignId);
    if (item.creatorId !== payload.creatorId) throw new Error('API trả về sai kênh đã chọn.');
    if (!['ADDED','ALREADY_EXISTS','RESTORED'].includes(item.action ?? '')) throw new Error('API chưa xác nhận kết quả thêm shortlist.');
    return item;
  },
  async update(campaignId: string, itemId: string, payload: { priority?: ShortlistPriority; note?: string; status?: ShortlistStatus }): Promise<ShortlistRecord> {
    const response = await apiClient.patch(`${path(campaignId)}/${id(itemId)}`, payload);
    const item = record(dataOf(response.data), campaignId);
    if (item.id !== itemId) throw new Error('API trả về sai bản ghi đã sửa.');
    return item;
  },
  async remove(campaignId: string, itemId: string): Promise<void> {
    const response = await apiClient.delete(`${path(campaignId)}/${id(itemId)}`); dataOf(response.data);
  },
  async compare(campaignId: string, creatorIds: string[], signal?: AbortSignal): Promise<Comparison> {
    orderedDistinct(creatorIds, 2, 5);
    const response = await apiClient.post(`${path(campaignId)}/compare`, { creatorIds }, { signal });
    const data = dataOf(response.data);
    if (data?.campaignId !== campaignId || !Array.isArray(data.creators) || data.creators.length !== creatorIds.length) throw new Error('Phản hồi so sánh không hợp lệ.');
    const byId = new Map<string, CompareItem>();
    for (const row of data.creators) {
      if (!creatorIds.includes(row?.creatorId) || byId.has(row.creatorId) || typeof row.verifiedByInfluencerMatch !== 'boolean') throw new Error('Kênh so sánh không hợp lệ.');
      if (row.metrics != null) for (const key of ['followers','avgViews','avgLikes','avgComments','avgShares','engagementRate','dataConfidence']) number(row.metrics[key]);
      byId.set(row.creatorId, { ...row, metrics: row.metrics ?? null, verification: row.verification ?? null, declaredProfile: row.declaredProfile ?? null });
    }
    return { campaignId, creators: creatorIds.map(value => byId.get(value)!) };
  },
  async batchAdd(campaignId: string, creatorIds: string[], priority: ShortlistPriority, note?: string): Promise<BatchAddResult> {
    orderedDistinct(creatorIds, 1, 100);
    const response = await apiClient.post(`${path(campaignId)}/batch`, { creatorIds, priority, note });
    const result = dataOf(response.data);
    if (result?.campaignId !== campaignId || !Array.isArray(result.results) || result.results.length !== creatorIds.length) throw new Error('Kết quả thêm hàng loạt không hợp lệ.');
    const rows = new Map<string, any>();
    for (const row of result.results) {
      if (!creatorIds.includes(row.creatorId) || rows.has(row.creatorId) || !['ADDED','ALREADY_EXISTS','RESTORED','INVALID','FAILED'].includes(row.action)) throw new Error('Kết quả từng kênh không hợp lệ.');
      if (row.item) record(row.item, campaignId); rows.set(row.creatorId, row);
    }
    return { ...result, results: creatorIds.map(value => rows.get(value)) };
  },
  async batchStatus(campaignId: string, itemIds: string[], status: ShortlistStatus): Promise<ShortlistRecord[]> {
    orderedDistinct(itemIds, 1, 100);
    const response = await apiClient.patch(`${path(campaignId)}/batch-status`, { itemIds, status });
    const data = dataOf(response.data); if (!Array.isArray(data)) throw new Error('Kết quả cập nhật trạng thái không hợp lệ.');
    if (data.length !== itemIds.length || new Set(data.map(item => item.id)).size !== itemIds.length
      || data.some(item => !itemIds.includes(item.id) || item.status !== status)) throw new Error('API chưa xác nhận cập nhật đủ các kênh đã chọn.');
    return data.map(item => record(item, campaignId));
  },
  async readiness(campaignId: string, itemIds: string[]): Promise<ContactReadiness> {
    orderedDistinct(itemIds, 1, 100);
    const data = dataOf((await apiClient.post(`${path(campaignId)}/contact-readiness`, { itemIds })).data);
    if (!Array.isArray(data?.items) || data.items.length !== itemIds.length || new Set(data.items.map((item: any) => item.shortlistItemId)).size !== itemIds.length
      || data.items.some((item: any) => !itemIds.includes(item.shortlistItemId))) throw new Error('Dữ liệu liên hệ không hợp lệ.');
    return data;
  },
  async prepareOutreach(campaignId: string, itemIds: string[]): Promise<OutreachResult> {
    orderedDistinct(itemIds, 1, 100);
    // Intentionally draft-only: without fee/terms/deliverables BE does NOT send a proposal.
    const data = dataOf((await apiClient.post(`${path(campaignId)}/outreach`, { shortlistItemIds: itemIds })).data);
    if (data?.campaignId !== campaignId || !Array.isArray(data.items) || data.items.length !== itemIds.length
      || new Set(data.items.map((item: any) => item.shortlistItemId)).size !== itemIds.length
      || data.items.some((item: any) => !itemIds.includes(item.shortlistItemId))) throw new Error('Kết quả chuẩn bị CRM không hợp lệ.');
    return data;
  },
};
