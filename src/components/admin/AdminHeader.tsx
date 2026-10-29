import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Badge, Tooltip, Drawer, List, Typography, Tag, Empty, Button } from 'antd';
import {
  BellOutlined,
  HomeOutlined,
  RightOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { adminAuthService } from '../../services/api/adminAuthService';
import type { AdminNotification } from '../../types/api/admin.types';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { authService } from '../../services/api/authService';

const { Header } = Layout;
const { Text } = Typography;

const NOTIF_ICON: Record<string, React.ReactNode> = {
  error:   <CloseCircleOutlined  style={{ color: '#EF4444' }} />,
  warning: <WarningOutlined      style={{ color: '#F59E0B' }} />,
  info:    <InfoCircleOutlined   style={{ color: '#6366F1' }} />,
  success: <CheckCircleOutlined  style={{ color: '#10B981' }} />,
};

interface AdminHeaderProps {
  title?: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const currentUser: any = adminAuthService.getCurrentUser() || { fullName: 'Quản trị viên', role: 'ADMIN' };
  const isManager = authService.isManager() || currentUser?.role === 'DATA_MANAGER' || currentUser?.role === 'manager';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  // Dynamic Breadcrumb Computation matching Brand Header
  const getPageInfo = () => {
    const p = location.pathname;
    if (title) {
      return { sub: isManager ? 'Vận hành' : 'Quản trị', current: title };
    }
    if (p.includes('/admin/data-sources')) {
      return { sub: 'Thu thập dữ liệu', current: 'Nguồn dữ liệu & API' };
    }
    if (p.includes('/admin/jobs')) {
      return { sub: 'Thu thập dữ liệu', current: 'Tiến trình thu thập' };
    }
    if (p.includes('/admin/data-quality')) {
      return { sub: 'Thu thập dữ liệu', current: 'Kiểm định chất lượng' };
    }
    if (p.includes('/admin/scoring')) {
      return { sub: 'Thu thập dữ liệu', current: 'Cấu hình tính điểm' };
    }
    if (p.includes('/admin/creator-claims')) {
      return { sub: 'Danh mục & Xác thực', current: 'Duyệt hồ sơ xác minh' };
    }
    if (p.includes('/admin/creators')) {
      return { sub: 'Danh mục & Xác thực', current: 'Danh mục Nhà sáng tạo' };
    }
    if (p.includes('/admin/accounts')) {
      return { sub: 'Quản trị hệ thống', current: 'Tài khoản người dùng' };
    }
    if (p.includes('/admin/subscriptions')) {
      return { sub: 'Quản trị hệ thống', current: 'Gói đăng ký dịch vụ' };
    }
    if (p.includes('/admin/payments')) {
      return { sub: 'Quản trị hệ thống', current: 'Giao dịch & Thanh toán' };
    }
    if (p.includes('/admin/audit')) {
      return { sub: 'Quản trị hệ thống', current: 'Nhật ký hoạt động' };
    }
    return { sub: undefined, current: isManager ? 'Tổng quan vận hành' : 'Tổng quan hệ thống' };
  };

  const pageInfo = getPageInfo();

  return (
    <>
      <Header className="app-header">
        <div className="app-header-inner" style={{ maxWidth: '100%' }}>
          {/* Left: Breadcrumbs matching Brand layout */}
          <div className="header-breadcrumbs">
            <span
              className="header-bc-root"
              onClick={() => navigate(ADMIN_ROUTES.DASHBOARD)}
            >
              <HomeOutlined style={{ marginRight: 4, fontSize: 12 }} />
              Trang chủ
            </span>
            <RightOutlined style={{ fontSize: 9, color: '#94A3B8' }} />

            {pageInfo.sub && (
              <>
                <span className="header-bc-root">{pageInfo.sub}</span>
                <RightOutlined style={{ fontSize: 9, color: '#94A3B8' }} />
              </>
            )}

            <span className="header-bc-current">{pageInfo.current}</span>
          </div>

          {/* Right: Standalone Notification Action Bell */}
          <Tooltip title="Thông báo hệ thống">
            <Badge count={unreadCount} overflowCount={99} size="small" style={{ backgroundColor: '#EF4444' }}>
              <button
                type="button"
                className="standalone-action-btn"
                onClick={() => setNotifOpen(true)}
                aria-label="Thông báo hệ thống"
              >
                <BellOutlined style={{ fontSize: 16 }} />
              </button>
            </Badge>
          </Tooltip>
        </div>
      </Header>

      {/* Notification Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BellOutlined style={{ color: '#6366F1', fontSize: 17 }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>Thông báo hệ thống</span>
              {unreadCount > 0 && (
                <Badge count={unreadCount} style={{ backgroundColor: '#EF4444' }} />
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={markAllRead}
                style={{ fontSize: 12, padding: 0, color: '#6366F1', fontWeight: 600 }}
              >
                Đánh dấu đã đọc
              </Button>
            )}
          </div>
        }
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        width={380}
        styles={{ body: { padding: 0 } }}
      >
        {notifications.length === 0 ? (
          <Empty description="Không có thông báo mới" style={{ marginTop: 60 }} />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                  );
                }}
                style={{
                  padding: '12px 18px',
                  background: item.read ? '#FFFFFF' : '#F5F3FF',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <List.Item.Meta
                  avatar={<div style={{ marginTop: 2, fontSize: 18 }}>{NOTIF_ICON[item.type]}</div>}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Text strong style={{ fontSize: 13, color: '#0F172A' }}>
                        {item.title}
                      </Text>
                      {!item.read && (
                        <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px', borderRadius: 4 }}>
                          Mới
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#475569', fontSize: 12, lineHeight: 1.4, marginTop: 2 }}>
                        {item.body}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>
                        {item.time}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
}
