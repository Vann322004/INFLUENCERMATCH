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

export const subscriptionService = {
  /**
   * Get all active subscription plans.
   */
  async getPlans(page = 0, size = 20): Promise<PlanResponse[]> {
    const response = await apiClient.get<ApiResponse<PageResponsePlan>>('/plans', {
      params: { page, size },
    });
    return response.data?.data?.content || [];
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
    const response = await apiClient.post<ApiResponse<PlanResponse>>('/plans', payload);
    return response.data.data;
  },

  /**
   * Update an existing plan (Admin).
   */
  async updatePlan(id: string, payload: PlanUpdateRequest): Promise<PlanResponse> {
    const response = await apiClient.put<ApiResponse<PlanResponse>>(`/plans/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete a plan by ID (Admin).
   */
  async deletePlan(id: string): Promise<void> {
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
