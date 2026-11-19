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

export interface BrandPayment {
  id: string;
  transactionCode: string;
  planName: string;
  amount: number;
  currency: string;
  gateway: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  paidAt?: string;
  startDate?: string;
  expirationDate?: string;
  failureReason?: string;
}
export interface BrandPaymentPage {
  items: BrandPayment[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// UI Subscription Plan Types (used by Subscription Page)
export interface SubscriptionPlan {
  id: string;
  name: string;
  subtitle: string;
  priceMonthly: number;
  priceYearly: number;
  isCurrent?: boolean;
  popular?: boolean;
  badge?: string;
  features: { text: string; included: boolean; highlight?: boolean }[];
}

export interface QuotaMetric {
  id: string;
  title: string;
  used: number;
  total: number;
  unit: string;
  description: string;
  color: string;
  bgLight?: string;
}

export interface PaymentInvoice {
  id: string;
  code: string;
  date: string;
  planName: string;
  billingPeriod: string;
  amount: number;
  currency: string;
  method: string;
  status: 'success' | 'pending' | 'failed';
  statusText: string;
}
