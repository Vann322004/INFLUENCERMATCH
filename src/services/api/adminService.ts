// =============================================
// ADMIN SERVICE - InfluencerMatch
// Covers: /admin/users, /admin/audit-logs,
//         /admin/data-quality, /admin/subscriptions
// =============================================

import apiClient from '../apiClient';
import type {
  AdminUser,
  AdminUsersResponse,
  UpdateStatusPayload,
  UpdateRolePayload,
  AuditLogsResponse,
  PendingQualityClaim,
  ApproveClaimPayload,
  AdminSubscription,
  AdminUsersParams,
  AuditLogsParams,
} from '../../types/api/admin.types';

// -- User Management -------------------------

/** GET /admin/users — paginated user list */
const getUsers = async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== 'all') cleaned[k] = v;
    });
  }
  const response = await apiClient.get<AdminUsersResponse>('/admin/users', { params: cleaned });
  return response.data;
};

/** GET /admin/users/{id} — single user detail */
const getUserById = async (id: string): Promise<AdminUser> => {
  const response = await apiClient.get<AdminUser>(`/admin/users/${id}`);
  return response.data;
};

/** PATCH /admin/users/{id}/status — lock / unlock / activate */
const updateUserStatus = async (id: string, payload: UpdateStatusPayload): Promise<AdminUser> => {
  const response = await apiClient.patch<AdminUser>(`/admin/users/${id}/status`, payload);
  return response.data;
};

/** PATCH /admin/users/{id}/role — change user role */
const updateUserRole = async (id: string, payload: UpdateRolePayload): Promise<AdminUser> => {
  const response = await apiClient.patch<AdminUser>(`/admin/users/${id}/role`, payload);
  return response.data;
};

// -- Data Quality / Claims -------------------

/** GET /admin/data-quality/pending — list pending claims */
const getPendingClaims = async (): Promise<PendingQualityClaim[]> => {
  const response = await apiClient.get<PendingQualityClaim[]>('/admin/data-quality/pending');
  return response.data;
};

/** POST /admin/data-quality/{id}/approve — approve or reject a pending claim */
const approveClaim = async (id: string, payload: ApproveClaimPayload): Promise<void> => {
  await apiClient.post(`/admin/data-quality/${id}/approve`, payload);
};

// -- Audit Logs ------------------------------

/** GET /admin/audit-logs — paginated audit log */
const getAuditLogs = async (params?: AuditLogsParams): Promise<AuditLogsResponse> => {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== 'all') cleaned[k] = v;
    });
  }
  const response = await apiClient.get<AuditLogsResponse>('/admin/audit-logs', { params: cleaned });
  return response.data;
};

// -- Admin Subscriptions ---------------------

/** GET /admin/subscriptions — all subscriptions for admin view */
const getAdminSubscriptions = async (): Promise<AdminSubscription[]> => {
  const response = await apiClient.get<AdminSubscription[]>('/admin/subscriptions');
  return response.data;
};

export const adminService = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getPendingClaims,
  approveClaim,
  getAuditLogs,
  getAdminSubscriptions,
};
