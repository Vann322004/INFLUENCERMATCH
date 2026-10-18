export interface PlanResponse {
  id: string;
  planName: string;
  price: number;
  currency: string;
  durationDays: number;
  campaignQuota: number;
  recommendationQuota: number;
  refreshQuota: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
}

export interface PlanCreateRequest {
  planName: string;
  price: number;
  currency: string;
  durationDays: number;
  campaignQuota: number;
  recommendationQuota: number;
  refreshQuota: number;
  description?: string;
}

export interface PlanUpdateRequest {
  planName: string;
  price: number;
  currency: string;
  durationDays: number;
  campaignQuota: number;
  recommendationQuota: number;
  refreshQuota: number;
  description?: string;
  status: string;
}

export interface SubscriptionResponse {
  id: string;
  brandId: string;
  plan: PlanResponse;
  startDate: string;
  expirationDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | string;
  usedCampaignQuota: number;
  usedRecommendationQuota: number;
  usedRefreshQuota: number;
}

export interface PaymentRequest {
  planId: string;
}

export interface PaymentResponse {
  paymentUrl: string;
  transactionCode: string;
}
