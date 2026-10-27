import { apiClient } from '../apiClient';
import type { ApiResponse } from '../../types/api/common.types';
import type {
  PlanResponse,
  PlanCreateRequest,
  PlanUpdateRequest,
  SubscriptionResponse,
  PaymentResponse,
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

let cachedPlans: { data: PlanResponse[]; timestamp: number } | null = null;
let inFlightPlansPromise: Promise<PlanResponse[]> | null = null;
const PLANS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const subscriptionService = {
  /**
   * Get all active subscription plans (with 5-minute memory cache & deduplication).
   */
  async getPlans(page = 0, size = 20, forceRefresh = false): Promise<PlanResponse[]> {
    if (!forceRefresh && cachedPlans && Date.now() - cachedPlans.timestamp < PLANS_CACHE_TTL) {
      return cachedPlans.data;
    }

    if (inFlightPlansPromise) {
      return inFlightPlansPromise;
    }

    inFlightPlansPromise = (async () => {
      try {
        const response = await apiClient.get<ApiResponse<PageResponsePlan>>('/plans', {
          params: { page, size },
        });
        const list = response.data?.data?.content || [];
        if (list.length > 0) {
          cachedPlans = { data: list, timestamp: Date.now() };
        }
        return list;
      } finally {
        inFlightPlansPromise = null;
      }
    })();

    return inFlightPlansPromise;
  },

  /**
   * Clear in-memory plans cache when plans are updated or refreshed.
   */
  clearPlansCache() {
    cachedPlans = null;
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
    cachedPlans = null;
    const response = await apiClient.post<ApiResponse<PlanResponse>>('/plans', payload);
    return response.data.data;
  },

  /**
   * Update an existing plan (Admin).
   */
  async updatePlan(id: string, payload: PlanUpdateRequest): Promise<PlanResponse> {
    cachedPlans = null;
    const response = await apiClient.put<ApiResponse<PlanResponse>>(`/plans/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete a plan by ID (Admin).
   */
  async deletePlan(id: string): Promise<void> {
    cachedPlans = null;
    await apiClient.delete(`/plans/${id}`);
  },

  /**
   * Get current brand's active subscriptions.
   */
  async getBrandSubscriptions(brandId: string): Promise<SubscriptionResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<SubscriptionResponse[]>>(
        `/subscriptions/brand/${brandId}`
      );
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Subscribe brand to a free/trial plan (or administrative direct subscription)
   */
  async subscribeFreePlan(brandId: string, planId: string): Promise<SubscriptionResponse> {
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
    const response = await apiClient.post<ApiResponse<PaymentResponse>>('/billing/subscribe', {
      planId,
    });
    return response.data.data;
  },
};
