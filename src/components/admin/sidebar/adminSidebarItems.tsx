import React from 'react';
import {
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  ApiOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ControlOutlined,
  CrownOutlined,
  TransactionOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { ADMIN_ROUTES, DATA_MANAGER_ROUTES } from '../../../constants/adminRoutes';

export interface AdminMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  code?: string;
}

export interface AdminMenuGroup {
  groupKey: string;
  items: AdminMenuItem[];
}

export const ROUTE_KEY_MAP: Record<string, string> = {
  '/admin/dashboard':      'dashboard',
  '/admin/accounts':       'user-management',
  '/admin/subscriptions':  'subscription-management',
  '/admin/payments':       'transaction-management',
  '/admin/audit':          'audit-logs',
  '/admin/data-sources':   'system-monitoring',
  '/admin/jobs':           'system-monitoring',
  '/admin/data-quality':   'system-monitoring',
  '/admin/scoring':        'system-monitoring',
  '/admin/creators':       'user-management',
  '/admin/creator-claims': 'user-management',
  // Data Manager Route Key Map
  '/data-manager/dashboard':      'dashboard',
  '/data-manager/creators':       'creators',
  '/data-manager/creator-claims': 'creator-claims',
  '/data-manager/jobs':           'jobs',
  '/data-manager/data-quality':   'data-quality',
  '/data-manager/taxonomy':       'taxonomy',
  '/data-manager/data-sources':   'taxonomy',
  '/data-manager/scoring':        'scoring',
};

/**
 * 7 Nhóm chức năng chính thức của Admin Console (Menu Phẳng - Phân cách bằng Divider)
 */
export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  // 1. Tổng quan
  {
    groupKey: 'standalone',
    items: [
      {
        key: 'dashboard',
        label: 'Tổng quan',
        icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
        path: ADMIN_ROUTES.DASHBOARD,
        code: 'AD-DASH',
      },
    ],
  },
  // 2. Định danh & Quyền truy cập
  {
    groupKey: 'identity-access',
    items: [
      {
        key: 'user-management',
        label: 'Quản lý người dùng',
        icon: <TeamOutlined style={{ fontSize: 18 }} />,
        path: ADMIN_ROUTES.ACCOUNTS.LIST,
        code: 'AD-01',
      },
      {
        key: 'roles-permissions',
        label: 'Vai trò & Phân quyền',
        icon: <SafetyCertificateOutlined style={{ fontSize: 18 }} />,
        path: `${ADMIN_ROUTES.ACCOUNTS.LIST}?tab=permissions`,
        code: 'AD-05',
      },
    ],
  },
  // 3. Gói cước & Thương mại
  {
    groupKey: 'billing-commerce',
    items: [
      {
        key: 'subscription-management',
        label: 'Quản lý gói dịch vụ',
        icon: <CrownOutlined style={{ fontSize: 18 }} />,
        path: ADMIN_ROUTES.SUBSCRIPTIONS,
        code: 'AD-03',
      },
      {
        key: 'transaction-management',
        label: 'Quản lý giao dịch',
        icon: <TransactionOutlined style={{ fontSize: 18 }} />,
        path: ADMIN_ROUTES.PAYMENTS,
        code: 'AD-04',
      },
    ],
  },
  // 4. An ninh & Vận hành
  {
    groupKey: 'security-operations',
    items: [
      {
        key: 'audit-logs',
        label: 'Nhật ký kiểm toán',
        icon: <FileTextOutlined style={{ fontSize: 18 }} />,
        path: ADMIN_ROUTES.AUDIT,
        code: 'AD-02',
      },
      {
        key: 'system-monitoring',
        label: 'Giám sát hệ thống',
        icon: <LineChartOutlined style={{ fontSize: 18 }} />,
        path: ADMIN_ROUTES.DATA_SOURCES,
        code: 'AD-MON',
      },
    ],
  },
];

/**
 * Menu Groups dành riêng cho Data Manager Console (Chuẩn hóa DM-01 -> DM-06, Phân cách bằng Divider)
 */
export const DATA_MANAGER_MENU_GROUPS: AdminMenuGroup[] = [
  // 1. Tổng quan (DM-05 / KPI)
  {
    groupKey: 'manager-dashboard',
    items: [
      {
        key: 'dashboard',
        label: 'Tổng quan',
        icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
        path: DATA_MANAGER_ROUTES.DASHBOARD,
        code: 'DM-DASH',
      },
    ],
  },
  // 2. Định danh & Hồ sơ KOC (DM-01, DM-02)
  {
    groupKey: 'manager-identity',
    items: [
      {
        key: 'creators',
        label: 'Định danh Nhà sáng tạo',
        icon: <UserOutlined style={{ fontSize: 18 }} />,
        path: DATA_MANAGER_ROUTES.CREATORS,
        code: 'DM-01',
      },
      {
        key: 'creator-claims',
        label: 'Kiểm duyệt nhận kênh',
        icon: <SafetyCertificateOutlined style={{ fontSize: 18 }} />,
        path: DATA_MANAGER_ROUTES.CREATOR_CLAIMS,
        code: 'DM-02',
      },
    ],
  },
  // 3. Tiến trình thu thập, Kiểm định & Ngành hàng (DM-05, DM-03, DM-06)
  {
    groupKey: 'manager-pipeline',
    items: [
      {
        key: 'jobs',
        label: 'Tiến trình thu thập',
        icon: <SyncOutlined style={{ fontSize: 18 }} />,
        path: DATA_MANAGER_ROUTES.JOBS,
        code: 'DM-05',
      },
      {
        key: 'data-quality',
        label: 'Kiểm định chất lượng',
        icon: <CheckCircleOutlined style={{ fontSize: 18 }} />,
        path: DATA_MANAGER_ROUTES.DATA_QUALITY,
        code: 'DM-03',
      },
      {
        key: 'taxonomy',
        label: 'Danh mục ngành hàng',
        icon: <TagOutlined style={{ fontSize: 18 }} />,
        path: DATA_MANAGER_ROUTES.TAXONOMY,
        code: 'DM-06',
      },
    ],
  },
  // 4. Thuật toán gợi ý (DM-04)
  {
    groupKey: 'manager-algorithm',
    items: [
      {
        key: 'scoring',
        label: 'Cấu hình thuật toán',
        icon: <ControlOutlined style={{ fontSize: 18 }} />,
        path: DATA_MANAGER_ROUTES.SCORING,
        code: 'DM-04',
      },
    ],
  },
];
