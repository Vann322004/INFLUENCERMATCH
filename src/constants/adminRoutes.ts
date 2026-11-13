// Admin Routes Constants
export const ADMIN_ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin/dashboard',
  ACCOUNTS: {
    LIST: '/admin/accounts',
    DETAIL: '/admin/accounts/:id',
  },
  CREATORS: '/admin/creators',
  CREATOR_CLAIMS: '/admin/creator-claims',
  DATA_SOURCES: '/admin/data-sources',
  JOBS: '/admin/jobs',
  DATA_QUALITY: '/admin/data-quality',
  SCORING: '/admin/scoring',
  SUBSCRIPTIONS: '/admin/subscriptions',
  PAYMENTS: '/admin/payments',
  AUDIT: '/admin/audit',
};

// Data Manager Routes Constants
export const DATA_MANAGER_ROUTES = {
  DASHBOARD: '/data-manager/dashboard',
  JOBS: '/data-manager/jobs',
  DATA_QUALITY: '/data-manager/data-quality',
  DATA_SOURCES: '/data-manager/data-sources',
  TAXONOMY: '/data-manager/taxonomy',
  SCORING: '/data-manager/scoring',
  CREATORS: '/data-manager/creators',
  CREATOR_CLAIMS: '/data-manager/creator-claims',
};
