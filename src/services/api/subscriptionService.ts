import { apiClient, getAuthSessionId } from '../apiClient';
import { readPage } from './pageResponse';
import type { PageResponse } from '../../types/api/common.types';
import type { ApiResponse } from '../../types/api/common.types';
import type {
  PlanResponse,
  PlanCreateRequest,
  PlanUpdateRequest,
  SubscriptionResponse,
  PaymentResponse,
  BrandPayment,
  BrandPaymentPage,
} from '../../types/api/subscription.types';

interface PageResponsePlan {
  content: PlanResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

const PLANS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const SUBS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const STORAGE_KEY_PLANS = 'im_cached_plans_v1';
const STORAGE_PREFIX_SUBS = 'im_cached_subs_';

let cachedPlans: { data: PlanResponse[]; timestamp: number; scope: string } | null = (() => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data) && Date.now() - parsed.timestamp < PLANS_CACHE_TTL) {
      return parsed;
    }
  } catch {}
  return null;
})();
let inFlightPlansPromise: Promise<PlanResponse[]> | null = null;
let inFlightPlansScope = '';

const brandSubsCache = new Map<string, { data: SubscriptionResponse[]; timestamp: number }>();
const subsInFlight = new Map<string, Promise<SubscriptionResponse[]>>();

export const subscriptionService = {
  async getPaymentHistory(page = 0, size = 10, signal?: AbortSignal): Promise<BrandPaymentPage> {
    const response = await apiClient.get<ApiResponse<BrandPaymentPage>>('/billing/payments', {
      params: { page, size }, signal,
    });
    return response.data.data;
  },
  async getPaymentStatus(reference: string, signal?: AbortSignal): Promise<BrandPayment> {
    const response = await apiClient.get<ApiResponse<BrandPayment>>(
      `/billing/payments/${encodeURIComponent(reference)}`, { signal });
    return response.data.data;
  },
  /** Paginated catalog with authoritative totals, separate from the storefront list cache. */
  async getPlansPage(page = 0, size = 1): Promise<PageResponse<PlanResponse>> {
    const response = await apiClient.get('/plans', { params: { page, size } });
    return readPage<PlanResponse>(response.data);
  },
  /**
   * Get all active subscription plans (with memory & sessionStorage cache & deduplication).
   */
  async getPlans(page = 0, size = 20, forceRefresh = false): Promise<PlanResponse[]> {
    const scope = `${getAuthSessionId()}:${page}:${size}`;
    if (!forceRefresh && cachedPlans?.scope === scope && Date.now() - cachedPlans.timestamp < PLANS_CACHE_TTL) {
      return cachedPlans.data;
    }

    if (inFlightPlansPromise && inFlightPlansScope === scope) {
      return inFlightPlansPromise;
    }
    inFlightPlansScope = scope;
    inFlightPlansPromise = (async () => {
      try {
        const response = await apiClient.get<ApiResponse<PageResponsePlan>>('/plans', {
          params: { page, size },
        });
        const raw = response.data?.data;
        let list: PlanResponse[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray((raw as any).content)) {
          list = (raw as any).content;
        } else if (Array.isArray((response.data as any)?.content)) {
          list = (response.data as any).content;
        }
        if (list.length > 0) {
          cachedPlans = { data: list, timestamp: Date.now(), scope };
          try {
            sessionStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(cachedPlans));
          } catch {}
        }
        return list;
      } finally {
        if (inFlightPlansScope === scope) inFlightPlansPromise = null;
      }
    })();

    return inFlightPlansPromise;
  },

  /**
   * Clear in-memory and storage plans cache when plans are updated or refreshed.
   */
  clearPlansCache() {
    cachedPlans = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY_PLANS);
    } catch {}
  },

  /**
   * Get detail of a specific plan by ID.
   */
  async getPlanById(id: string): Promise<PlanResponse> {
    const response = await apiClient.get<ApiResponse<PlanResponse>>(`/plans/${id}`);
    return response.data.data;
  },

  /**
   * Create a new plan (Admin).
   */
  async createPlan(payload: PlanCreateRequest): Promise<PlanResponse> {
    subscriptionService.clearPlansCache();
    const response = await apiClient.post<ApiResponse<PlanResponse>>('/plans', payload);
    return response.data.data;
  },

  /**
   * Update an existing plan (Admin).
   */
  async updatePlan(id: string, payload: PlanUpdateRequest): Promise<PlanResponse> {
    subscriptionService.clearPlansCache();
    const response = await apiClient.put<ApiResponse<PlanResponse>>(`/plans/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete a plan by ID (Admin).
   */
  async deletePlan(id: string): Promise<void> {
    subscriptionService.clearPlansCache();
    await apiClient.delete(`/plans/${id}`);
  },

  /**
   * Clear cached subscriptions for a specific brand or all brands.
   */
  clearBrandSubsCache(brandId?: string) {
    if (brandId) {
      brandSubsCache.delete(brandId);
      try {
        sessionStorage.removeItem(`${STORAGE_PREFIX_SUBS}${brandId}`);
      } catch {}
    } else {
      brandSubsCache.clear();
    }
  },

  /**
   * Get current brand's active subscriptions with memory & session cache and in-flight deduplication.
   */
  async getBrandSubscriptions(brandId: string, forceRefresh = false): Promise<SubscriptionResponse[]> {
    if (!brandId) return [];

    // Check memory cache
    if (!forceRefresh) {
      const cached = brandSubsCache.get(brandId);
      if (cached && Date.now() - cached.timestamp < SUBS_CACHE_TTL) {
        return cached.data;
      }

      // Check session storage cache
      try {
        const raw = sessionStorage.getItem(`${STORAGE_PREFIX_SUBS}${brandId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.data) && Date.now() - parsed.timestamp < SUBS_CACHE_TTL) {
            brandSubsCache.set(brandId, parsed);
            return parsed.data;
          }
        }
      } catch {}
    }

    // Check in-flight promise deduplication
    const existingPromise = subsInFlight.get(brandId);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async () => {
      try {
        const response = await apiClient.get<any>(
          `/subscriptions/brand/${brandId}`
        );
        const raw = response.data?.data ?? response.data;
        let list: SubscriptionResponse[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && typeof raw === 'object' && ('id' in raw || 'plan' in raw || 'status' in raw)) {
          list = [raw as SubscriptionResponse];
        }
        const entry = { data: list, timestamp: Date.now() };
        brandSubsCache.set(brandId, entry);
        try {
          sessionStorage.setItem(`${STORAGE_PREFIX_SUBS}${brandId}`, JSON.stringify(entry));
        } catch {}
        return list;
      } finally {
        subsInFlight.delete(brandId);
      }
    })();

    subsInFlight.set(brandId, fetchPromise);
    return fetchPromise;
  },

  /**
   * Subscribe brand to a free/trial plan (or administrative direct subscription)
   */
  async subscribeFreePlan(brandId: string, planId: string): Promise<SubscriptionResponse> {
    subscriptionService.clearBrandSubsCache(brandId);
    const response = await apiClient.post<ApiResponse<SubscriptionResponse>>('/subscriptions', {
      brandId,
      planId,
    });
    return response.data.data;
  },

  /**
   * Initiate VNPay subscription checkout for a plan.
   * Returns VNPay payment URL for direct redirect.
   */
  async subscribeVNPay(planId: string): Promise<PaymentResponse> {
    subscriptionService.clearBrandSubsCache();
    const response = await apiClient.post<any>('/billing/subscribe', {
      planId,
    });
    const resData = response.data?.data ?? response.data;
    return {
      paymentUrl: resData?.paymentUrl || resData?.url || '',
      transactionCode: resData?.transactionCode || resData?.txnRef || resData?.reference || '',
    };
  },

  /**
   * Admin: Directly assign a subscription to a brand (POST /admin/subscriptions).
   */
  async adminCreateSubscription(brandId: string, planId: string): Promise<SubscriptionResponse> {
    subscriptionService.clearBrandSubsCache(brandId);
    const response = await apiClient.post<ApiResponse<SubscriptionResponse>>('/admin/subscriptions', {
      brandId,
      planId,
    });
    return response.data.data;
  },

  /**
   * Admin: Get all subscriptions for a specific brand (GET /admin/subscriptions/brand/:brandId).
   */
  async adminGetBrandSubscriptions(brandId: string): Promise<SubscriptionResponse[]> {
    const response = await apiClient.get<ApiResponse<SubscriptionResponse[]>>(
      `/admin/subscriptions/brand/${brandId}`
    );
    return response.data?.data || [];
  },

  /**
   * Admin: Cancel a brand's subscription (DELETE /admin/subscriptions/:id).
   */
  async adminCancelSubscription(subscriptionId: string): Promise<void> {
    subscriptionService.clearBrandSubsCache();
    await apiClient.delete(`/admin/subscriptions/${subscriptionId}`);
  },
};
