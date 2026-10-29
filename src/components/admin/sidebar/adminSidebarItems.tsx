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
} from '@ant-design/icons';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';

export interface AdminNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const ROUTE_KEY_MAP: Record<string, string> = {
  '/admin/dashboard':      'dashboard',
  '/admin/data-sources':   'data-sources',
  '/admin/jobs':           'jobs',
  '/admin/data-quality':   'data-quality',
  '/admin/scoring':        'scoring',
  '/admin/creators':       'creators',
  '/admin/creator-claims': 'creator-claims',
  '/admin/accounts':       'accounts',
  '/admin/subscriptions':  'subscriptions',
  '/admin/payments':       'payments',
  '/admin/audit':          'audit',
};

export const PIPELINE_ITEMS: AdminNavItem[] = [
  {
    key: 'data-sources',
    label: 'Nguồn dữ liệu & API',
    icon: <ApiOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.DATA_SOURCES,
  },
  {
    key: 'jobs',
    label: 'Tiến trình thu thập',
    icon: <SyncOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.JOBS,
  },
  {
    key: 'data-quality',
    label: 'Kiểm định chất lượng',
    icon: <CheckCircleOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.DATA_QUALITY,
  },
  {
    key: 'scoring',
    label: 'Cấu hình tính điểm',
    icon: <ControlOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.SCORING,
  },
];

export const CATALOG_ITEMS: AdminNavItem[] = [
  {
    key: 'creators',
    label: 'Danh mục Nhà sáng tạo',
    icon: <UserOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.CREATORS,
  },
  {
    key: 'creator-claims',
    label: 'Duyệt hồ sơ xác minh',
    icon: <SafetyCertificateOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.CREATOR_CLAIMS,
  },
];

export const SYSTEM_ITEMS: AdminNavItem[] = [
  {
    key: 'accounts',
    label: 'Tài khoản người dùng',
    icon: <TeamOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.ACCOUNTS.LIST,
  },
  {
    key: 'subscriptions',
    label: 'Gói đăng ký dịch vụ',
    icon: <CrownOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.SUBSCRIPTIONS,
  },
  {
    key: 'payments',
    label: 'Giao dịch & Thanh toán',
    icon: <TransactionOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.PAYMENTS,
  },
  {
    key: 'audit',
    label: 'Nhật ký hoạt động',
    icon: <FileTextOutlined style={{ fontSize: 17 }} />,
    path: ADMIN_ROUTES.AUDIT,
  },
];
