import apiClient from '../apiClient';
import type { QualityItem } from '../../pages/admin/quality/types';

export interface QualityPage {
  items: QualityItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const dataQualityService = {
  async pending(page = 0, size = 10): Promise<QualityPage> {
    const response = await apiClient.get('/data/quality/pending', { params: { page, size } });
    const result = response.data?.data;
    if (!Array.isArray(result?.items) || typeof result?.totalElements !== 'number') {
      throw new Error('Dữ liệu kiểm định trả về không đúng định dạng.');
    }
    return result;
  },
  async approve(metricId: string, niche: string): Promise<QualityItem> {
    const response = await apiClient.put(`/data/quality/${encodeURIComponent(metricId)}/approve`, { niche: niche.trim() });
    return response.data.data;
  },
  async reject(metricId: string, reason: string, reclassifiedType: string): Promise<QualityItem> {
    const response = await apiClient.put(`/data/quality/${encodeURIComponent(metricId)}/reject`, { reason: reason.trim(), reclassifiedType });
    return response.data.data;
  },
};
