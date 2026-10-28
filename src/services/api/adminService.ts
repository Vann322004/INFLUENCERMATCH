// =============================================
// ADMIN SERVICE - InfluencerMatch
// Comprehensive mapping for all Admin APIs:
// - /admin/users, /admin/users/{id}, /admin/users/{id}/status, /admin/users/{id}/role
// - /admin/audit-logs
// - /admin/data-quality/pending, /admin/data-quality/{id}/approve
// - /admin/role-permissions, /admin/role-permissions/{role}
// - /admin/subscriptions, /subscriptions
// Graceful fallback to verified structured mock datasets for seamless dev/demo experience.
// =============================================

import apiClient from '../apiClient';
import type {
  AdminUser,
  AdminUsersResponse,
  AdminUserRole,
  AdminUserStatus,
  UpdateStatusPayload,
  UpdateRolePayload,
  AuditLogsResponse,
  AuditLogItem,
  AuditAction,
  PendingQualityClaim,
  ApproveClaimPayload,
  AdminSubscription,
  AdminUsersParams,
  AuditLogsParams,
  RoleView,
  Transaction,
  TxnStatus,
} from '../../types/api/admin.types';

export interface PaymentStats {
  totalRevenue: number;
  totalRefunded: number;
  totalPending: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  failedCount: number;
  totalCount: number;
}

export interface GetTransactionsParams {
  search?: string;
  status?: string;
  gateway?: string;
  page?: number;
  size?: number;
}

export interface TransactionsResponse {
  items: Transaction[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ── Helpers & Normalizers ───────────────────────────────

const normalizeRole = (role?: string): AdminUserRole => {
  if (!role) return 'brand';
  const r = role.toLowerCase();
  if (r.includes('super')) return 'super_admin';
  if (r === 'manager' || r === 'data_manager') return 'manager';
  if (r === 'admin') return 'admin';
  if (r === 'creator') return 'creator';
  return 'brand';
};

const normalizeStatus = (status?: string): AdminUserStatus => {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (s === 'locked') return 'locked';
  if (s === 'disabled' || s === 'inactive') return 'inactive';
  if (s === 'pending') return 'pending';
  return 'active';
};

const toBackendStatus = (status: AdminUserStatus | string): 'ACTIVE' | 'LOCKED' | 'DISABLED' => {
  const s = String(status).toLowerCase();
  if (s === 'locked') return 'LOCKED';
  if (s === 'inactive' || s === 'disabled') return 'DISABLED';
  return 'ACTIVE';
};

const toBackendRole = (role: AdminUserRole | string): 'ADMIN' | 'DATA_MANAGER' | 'BRAND' | 'CREATOR' => {
  const r = String(role).toLowerCase();
  if (r === 'manager' || r === 'data_manager') return 'DATA_MANAGER';
  if (r === 'admin' || r === 'super_admin') return 'ADMIN';
  if (r === 'creator') return 'CREATOR';
  return 'BRAND';
};

const normalizeUser = (raw: any): AdminUser => {
  const role = normalizeRole(raw.role);
  const status = normalizeStatus(raw.status);
  const roleLabel =
    role === 'super_admin' ? 'Quản trị viên cấp cao' :
    role === 'admin' ? 'Quản trị viên' :
    role === 'manager' ? 'Quản lý' :
    role === 'brand' ? 'Doanh nghiệp' : 'Nhà sáng tạo';

  return {
    id: raw.id || `usr_${Date.now()}`,
    name: raw.fullName || raw.name || raw.displayName || (raw.email ? raw.email.split('@')[0] : 'User'),
    email: raw.email || '',
    role,
    roleLabel,
    status,
    avatar: raw.avatar || raw.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(raw.email || raw.id || 'admin')}`,
    lastLogin: raw.updatedAt ? new Date(raw.updatedAt).toLocaleString('vi-VN') : (raw.lastLogin || '—'),
    joinedAt: raw.createdAt ? new Date(raw.createdAt).toISOString().split('T')[0] : (raw.joinedAt || '—'),
    ip: raw.ip || raw.ipAddress || '—',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const normalizeAuditLog = (raw: any, index = 0): AuditLogItem => {
  return {
    id: raw.id || `al_${Date.now()}_${index}`,
    timestamp: raw.createdAt || raw.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
    actor: raw.actor || raw.userName || raw.userId || 'Hệ thống',
    actorEmail: raw.actorEmail || (raw.userId ? `user-${String(raw.userId).slice(0, 6)}@system.vn` : 'system@influencermatch.site'),
    action: (raw.action || 'UPDATE').toUpperCase() as AuditAction,
    resource: raw.resource || raw.entityType || 'Account',
    resourceId: raw.resourceId || raw.entityId || 'res_system',
    ip: raw.ip || raw.ipAddress || '—',
    oldValue: raw.oldValue,
    newValue: raw.newValue,
  };
};

// ── User Management -------------------------------------

/** GET /admin/users — paginated user list from real backend */
const getUsers = async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== 'all') cleaned[k] = v;
    });
  }

  const response = await apiClient.get<any>('/admin/users', { params: cleaned });
  const payload = response.data;
  
  const rawList =
    payload?.data?.items ??
    payload?.data?.content ??
    payload?.items ??
    payload?.content ??
    (Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);

  const items = (Array.isArray(rawList) ? rawList : []).map(normalizeUser);
  return {
    items,
    content: items,
    totalElements: payload?.data?.totalElements ?? payload?.totalElements ?? items.length,
    totalPages: payload?.data?.totalPages ?? payload?.totalPages ?? 1,
    number: payload?.data?.page ?? payload?.page ?? 0,
    page: payload?.data?.page ?? payload?.page ?? 0,
    size: payload?.data?.size ?? payload?.size ?? items.length,
  };
};

/** GET /admin/users/{id} — single user detail */
const getUserById = async (id: string): Promise<AdminUser> => {
  const response = await apiClient.get<any>(`/admin/users/${id}`);
  const raw = response.data?.data ?? response.data;
  if (raw && (raw.id || raw.email)) {
    return normalizeUser(raw);
  }
  throw new Error(`Không tìm thấy tài khoản ID: ${id}`);
};

/** PATCH /admin/users/{id}/status — lock / unlock / activate */
const updateUserStatus = async (id: string, payload: UpdateStatusPayload): Promise<AdminUser> => {
  const backendStatus = toBackendStatus(payload.status);
  const response = await apiClient.patch<any>(`/admin/users/${id}/status`, {
    status: backendStatus,
    reason: payload.reason || 'Admin cập nhật trạng thái',
  });
  const raw = response.data?.data ?? response.data;
  return normalizeUser(raw);
};

/** PATCH /admin/users/{id}/role — change user role */
const updateUserRole = async (id: string, payload: UpdateRolePayload): Promise<AdminUser> => {
  const backendRole = toBackendRole(payload.role);
  const response = await apiClient.patch<any>(`/admin/users/${id}/role`, {
    role: backendRole,
    reason: payload.reason || 'Admin phân quyền tài khoản',
  });
  const raw = response.data?.data ?? response.data;
  return normalizeUser(raw);
};

/** Create a new admin or invite */
const createAdmin = async (payload: { name: string; email: string; password?: string; role?: AdminUserRole }): Promise<AdminUser> => {
  const role = payload.role || 'admin';
  const response = await apiClient.post<any>('/auth/register', {
    email: payload.email,
    fullName: payload.name,
    password: payload.password || 'Admin@123456',
    role: role === 'manager' ? 'DATA_MANAGER' : 'ADMIN',
  });
  const raw = response.data?.data ?? response.data;
  return normalizeUser(raw || { email: payload.email, fullName: payload.name, role: payload.role });
};

// ── Data Quality / Claims -------------------------------

/** GET /admin/data-quality/pending — list pending claims */
const getPendingClaims = async (params?: { page?: number; size?: number }): Promise<PendingQualityClaim[]> => {
  try {
    const response = await apiClient.get<any>('/admin/data-quality/pending', { params });
    const payload = response.data;
    const rawList = payload?.data?.items ?? payload?.data?.content ?? payload?.items ?? payload?.content;
    if (Array.isArray(rawList)) {
      return rawList.map((q: any) => ({
        id: q.id || `dq_${Math.random()}`,
        creatorId: q.creatorId,
        creatorHandle: q.handle || q.creatorHandle || '@creator',
        claimedBy: q.claimantName || 'System',
        claimedByEmail: q.claimantEmail,
        submittedAt: q.createdAt || new Date().toISOString(),
        status: (q.status?.toLowerCase() as any) || 'pending',
        notes: q.notes || q.reason || 'KOC snapshot confidence below 0.7',
      }));
    }
  } catch (err) {
    console.warn('[adminService.getPendingClaims] Backend API error:', err);
  }
  return [];
};

/** PUT /admin/data-quality/{id}/approve — approve or reject a pending claim */
const approveClaim = async (id: string, payload: ApproveClaimPayload): Promise<void> => {
  await apiClient.put(`/admin/data-quality/${id}/approve`, payload);
};

// ── Audit Logs ------------------------------------------

/** GET /admin/audit-logs — paginated audit log */
const getAuditLogs = async (params?: AuditLogsParams): Promise<AuditLogsResponse> => {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== 'all') cleaned[k] = v;
    });
  }

  const response = await apiClient.get<any>('/admin/audit-logs', { params: cleaned });
  const payload = response.data;
  const rawList =
    payload?.data?.items ??
    payload?.data?.content ??
    payload?.items ??
    payload?.content ??
    (Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);

  const items = (Array.isArray(rawList) ? rawList : []).map(normalizeAuditLog);
  return {
    items,
    content: items,
    totalElements: payload?.data?.totalElements ?? payload?.totalElements ?? items.length,
    totalPages: payload?.data?.totalPages ?? payload?.totalPages ?? 1,
    number: payload?.data?.page ?? payload?.page ?? 0,
    page: payload?.data?.page ?? payload?.page ?? 0,
    size: payload?.data?.size ?? payload?.size ?? items.length,
  };
};

// ── Role Permissions ------------------------------------

/** GET /admin/role-permissions — View default and effective permissions for all roles */
const getRolePermissions = async (): Promise<RoleView[]> => {
  try {
    const response = await apiClient.get<any>('/admin/role-permissions');
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('[adminService.getRolePermissions] API error:', err);
  }
  return [];
};

/** PATCH /admin/role-permissions/{role} — Enable or disable role capabilities */
const updateRolePermissions = async (role: string, payload: any): Promise<void> => {
  await apiClient.patch(`/admin/role-permissions/${role}`, payload);
};

// ── Admin Subscriptions ---------------------------------

/** GET /admin/subscriptions from backend API */
const getAdminSubscriptions = async (): Promise<AdminSubscription[]> => {
  try {
    const response = await apiClient.get<any>('/admin/subscriptions');
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
  } catch {
    try {
      const alt = await apiClient.get<any>('/subscriptions');
      const d = alt.data?.data ?? alt.data;
      if (Array.isArray(d)) return d;
    } catch {}
  }
  return [];
};


// ── Admin Payments / Transactions ────────────────────────

const normalizeTxnStatus = (status?: string): TxnStatus => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'success') return 'paid';
  if (s === 'refunded') return 'refunded';
  if (s === 'failed' || s === 'error') return 'failed';
  return 'pending';
};

const formatTxnDate = (isoString?: string): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoString;
  }
};

/** GET /admin/payments — List transactions with backend API */
const getTransactions = async (params?: GetTransactionsParams): Promise<TransactionsResponse> => {
  const apiParams: Record<string, any> = {
    page: params?.page ?? 0,
    size: params?.size ?? 10,
  };
  if (params?.search?.trim()) apiParams.search = params.search.trim();
  if (params?.status && params.status !== 'all') apiParams.status = params.status.toUpperCase();
  if (params?.gateway && params.gateway !== 'all') apiParams.gateway = params.gateway;

  const response = await apiClient.get<any>('/admin/payments', { params: apiParams });
  const payload = response.data;
  const pageData = payload?.data ?? payload;
  const rawItems = pageData?.items ?? pageData?.content ?? [];

  const items: Transaction[] = Array.isArray(rawItems)
    ? rawItems.map((r: any) => ({
        id: r.id,
        ref: r.ref || r.transactionCode || r.id,
        userId: r.userId || '',
        userName: r.userName || r.brandName || 'Khách hàng',
        userEmail: r.userEmail || '',
        plan: r.plan || 'Gói dịch vụ',
        amount: Number(r.amount) || 0,
        gateway: r.gateway || 'VNPAY',
        status: normalizeTxnStatus(r.status),
        createdAt: formatTxnDate(r.createdAt),
        paidAt: r.paidAt ? formatTxnDate(r.paidAt) : '—',
      }))
    : [];

  return {
    items,
    totalElements: pageData?.totalElements ?? items.length,
    totalPages: pageData?.totalPages ?? 1,
    page: pageData?.page ?? 0,
    size: pageData?.size ?? items.length,
  };
};

/** GET /admin/payments/stats — Financial metrics */
const getTransactionStats = async (): Promise<PaymentStats> => {
  const response = await apiClient.get<any>('/admin/payments/stats');
  const d = response.data?.data ?? response.data;
  return {
    totalRevenue: Number(d?.totalRevenue) || 0,
    totalRefunded: Number(d?.totalRefunded) || 0,
    totalPending: Number(d?.totalPending) || 0,
    paidCount: Number(d?.paidCount) || 0,
    pendingCount: Number(d?.pendingCount) || 0,
    refundedCount: Number(d?.refundedCount) || 0,
    failedCount: Number(d?.failedCount) || 0,
    totalCount: Number(d?.totalCount) || 0,
  };
};

/** POST /admin/payments/{id}/refund — Refund transaction */
const refundTransaction = async (id: string, reason?: string): Promise<Transaction | null> => {
  const response = await apiClient.post<any>(`/admin/payments/${id}/refund`, { reason });
  const r = response.data?.data ?? response.data;
  if (!r) return null;
  return {
    id: r.id,
    ref: r.ref || r.transactionCode || r.id,
    userId: r.userId || '',
    userName: r.userName || r.brandName || 'Khách hàng',
    userEmail: r.userEmail || '',
    plan: r.plan || 'Gói dịch vụ',
    amount: Number(r.amount) || 0,
    gateway: r.gateway || 'VNPAY',
    status: 'refunded',
    createdAt: formatTxnDate(r.createdAt),
    paidAt: r.paidAt ? formatTxnDate(r.paidAt) : '—',
  };
};

export const adminService = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  createAdmin,
  getPendingClaims,
  approveClaim,
  getAuditLogs,
  getRolePermissions,
  updateRolePermissions,
  getAdminSubscriptions,
  getTransactions,
  getTransactionStats,
  refundTransaction,
};
