// =============================================
// ADMIN API TYPES - InfluencerMatch
// Maps to: GET /admin/users, PATCH /admin/users/{id}/status,
//          PATCH /admin/users/{id}/role, GET /admin/audit-logs,
//          GET /admin/data-quality/pending, POST /admin/data-quality/{id}/approve
// =============================================

// -- User / Account -------------------------
export type AdminUserStatus = 'active' | 'locked' | 'inactive' | 'pending';
export type AdminUserRole = 'super_admin' | 'admin' | 'manager' | 'brand' | 'creator';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  roleLabel?: string;
  status: AdminUserStatus;
  avatar?: string;
  lastLogin?: string;
  joinedAt?: string;
  ip?: string;
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
}

export interface AdminUsersResponse {
  items?: AdminUser[];
  content?: AdminUser[];
  totalElements: number;
  totalPages: number;
  number?: number;
  page?: number;
  size: number;
}

export interface UpdateStatusPayload {
  status: AdminUserStatus | 'ACTIVE' | 'LOCKED' | 'DISABLED';
  reason?: string;
}

export interface UpdateRolePayload {
  role: AdminUserRole | 'ADMIN' | 'MANAGER' | 'DATA_MANAGER' | 'BRAND' | 'CREATOR';
  reason?: string;
}

// -- Data Quality / Claims ------------------
export interface PendingQualityClaim {
  id: string;
  creatorId?: string;
  creatorHandle?: string;
  claimedBy?: string;
  claimedByEmail?: string;
  submittedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface ApproveClaimPayload {
  approved: boolean;
  reason?: string;
}

// -- Audit Log ------------------------------
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  actorEmail: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  ip: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export interface AuditLogsResponse {
  items?: AuditLogItem[];
  content?: AuditLogItem[];
  totalElements: number;
  totalPages: number;
  number?: number;
  page?: number;
  size: number;
}

// -- Role & Permissions ---------------------
export interface RoleCapability {
  name: string;
  enabled: boolean;
  description?: string;
}

export interface RoleView {
  role: 'ADMIN' | 'DATA_MANAGER' | 'BRAND' | 'CREATOR' | string;
  version?: number;
  permissions?: (string | RoleCapability)[];
}

// -- Admin Subscriptions --------------------
export interface AdminSubscription {
  id: string;
  brandId: string;
  brandName?: string;
  planId: string;
  planName?: string;
  status: 'active' | 'expired' | 'cancelled' | 'trialing';
  startDate?: string;
  endDate?: string;
  amount?: number;
}

// -- Query Params ---------------------------
export interface AdminUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: AdminUserRole | 'all';
  status?: AdminUserStatus | 'all';
  sort?: string;
}

export interface AuditLogsParams {
  page?: number;
  size?: number;
  search?: string;
  action?: AuditAction | 'all';
  resource?: string;
  actorId?: string;
  from?: string;
  to?: string;
}
