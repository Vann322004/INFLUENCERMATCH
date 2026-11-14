import apiClient from '../apiClient';
import { createAdminQuery } from '../adminCache';
import type { CachedQuery } from '../dataManagerCache';

export interface SubscriptionSummary { total: number; pending: number; active: number; expired: number; cancelled: number }
export interface CampaignSummary { total: number; draft: number; readyForDiscovery: number; active: number; completed: number; archived: number }
export interface UserGrowth { months: number; data: { month: string; newUsers: number }[] }
export interface PlanRevenue { planId: string; planName: string; currency: string; paymentCount: number; revenue: number }

function payload(value: any): any {
  if (value?.success === false) throw new Error('Không thể tải thống kê.');
  return value?.data ?? value;
}
function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Số liệu thống kê không hợp lệ.');
  return value;
}
function counts<T>(data: any, fields: readonly string[]): T {
  const result = Object.fromEntries(fields.map(key => [key, count(data?.[key])]));
  return result as T;
}

const requests = {
  async getSubscriptionSummary(): Promise<SubscriptionSummary> {
    const response = await apiClient.get('/admin/subscriptions/summary');
    return counts(payload(response.data), ['total', 'pending', 'active', 'expired', 'cancelled']);
  },
  async getCampaignSummary(): Promise<CampaignSummary> {
    const response = await apiClient.get('/admin/campaigns/summary');
    return counts(payload(response.data), ['total', 'draft', 'readyForDiscovery', 'active', 'completed', 'archived']);
  },
  async getUserGrowth(months = 6): Promise<UserGrowth> {
    if (!Number.isInteger(months) || months < 1 || months > 60) throw new Error('Số tháng phải từ 1 đến 60.');
    const response = await apiClient.get('/admin/analytics/user-growth', { params: { months } });
    const data = payload(response.data);
    if (data?.months !== months || !Array.isArray(data.data) || (data.data.length !== 0 && data.data.length !== months)) {
      throw new Error('Dữ liệu tăng trưởng không hợp lệ.');
    }
    let previous: number | undefined;
    const rows = data.data.map((row: any) => {
      if (typeof row?.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.month)) throw new Error('Tháng thống kê không hợp lệ.');
      const [year, month] = row.month.split('-').map(Number);
      const index = year * 12 + month;
      if (previous !== undefined && index !== previous + 1) throw new Error('Tháng thống kê bị thiếu hoặc trùng.');
      previous = index;
      return { month: row.month, newUsers: count(row.newUsers) };
    });
    return { months, data: rows };
  },
  async getRevenueByPlan(): Promise<PlanRevenue[]> {
    const response = await apiClient.get('/admin/analytics/revenue-by-plan');
    const data = payload(response.data);
    if (!Array.isArray(data)) throw new Error('Dữ liệu doanh thu không hợp lệ.');
    const seen = new Set<string>();
    return data.map(row => {
      if (!row || typeof row.planId !== 'string' || !row.planId || typeof row.planName !== 'string' || !row.planName.trim()
        || typeof row.currency !== 'string' || !/^[A-Z]{3}$/.test(row.currency)
        || typeof row.revenue !== 'number' || !Number.isFinite(row.revenue) || row.revenue < 0) {
        throw new Error('Dữ liệu doanh thu hoặc tiền tệ không hợp lệ.');
      }
      const key = row.planId + ':' + row.currency;
      if (seen.has(key)) throw new Error('Doanh thu theo gói bị trùng.');
      seen.add(key);
      return { planId: row.planId, planName: row.planName, currency: row.currency,
        paymentCount: count(row.paymentCount), revenue: row.revenue };
    });
  },
};

const growthQueries = new Map<number, CachedQuery<UserGrowth>>();
function getUserGrowthQuery(months = 6): CachedQuery<UserGrowth> {
  if (!Number.isInteger(months) || months < 1 || months > 60) throw new Error('Số tháng phải từ 1 đến 60.');
  let query = growthQueries.get(months);
  if (!query) {
    query = createAdminQuery(`dashboard:user-growth:${months}`, () => requests.getUserGrowth(months), { tags: ['admin-users'] });
    growthQueries.set(months, query);
  }
  return query;
}
export const adminDashboardService = {
  getSubscriptionSummary: createAdminQuery('dashboard:subscriptions', requests.getSubscriptionSummary, { tags: ['admin-billing'] }),
  getCampaignSummary: createAdminQuery('dashboard:campaigns', requests.getCampaignSummary, { tags: ['admin-campaigns'] }),
  getRevenueByPlan: createAdminQuery('dashboard:revenue-by-plan', requests.getRevenueByPlan, { tags: ['admin-billing'] }),
  getUserGrowth: (months = 6) => getUserGrowthQuery(months)(),
  getUserGrowthQuery,
};
