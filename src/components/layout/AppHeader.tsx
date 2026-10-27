import React, { useState } from 'react';
import { Layout, Badge, Tooltip } from 'antd';
import { BellOutlined, HomeOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationDrawer from './NotificationDrawer';

const { Header } = Layout;

export default function AppHeader() {
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic Page Context & Breadcrumb (100% tiếng Việt, chuẩn hóa phân cấp điều hướng)
  const getPageInfo = () => {
    const p = location.pathname;
    if (
      p.includes('/campaigns/detail') ||
      p.includes('/campaign-detail') ||
      (p.startsWith('/campaigns/') && p !== '/campaigns' && p !== '/campaigns/create') ||
      p.includes('/campaign-management')
    ) {
      return { root: 'Trang chủ', sub: 'Chiến dịch', subLink: '/campaigns', current: 'Chi tiết chiến dịch' };
    }
    if (p === '/campaigns/create') {
      return { root: 'Trang chủ', sub: 'Chiến dịch', subLink: '/campaigns', current: 'Tạo chiến dịch mới' };
    }
    if (p.includes('/campaigns')) return { root: 'Trang chủ', current: 'Chiến dịch' };
    if (p.includes('/creators')) return { root: 'Trang chủ', current: 'Khám phá KOC' };
    if (p.includes('/crm')) return { root: 'Trang chủ', current: 'Tiếp cận & Kết nối' };
    if (p.includes('/collaboration')) return { root: 'Trang chủ', current: 'Hợp tác & Vận hành' };
    if (p.includes('/performance')) return { root: 'Trang chủ', current: 'Báo cáo & Hiệu suất' };
    if (p.includes('/subscription') || p.includes('/billing') || p.includes('/plans')) return { root: 'Trang chủ', current: 'Quản lý gói & Hạn mức' };
    if (p.includes('/brand-profile')) return { root: 'Trang chủ', current: 'Hồ sơ thương hiệu' };
    return { root: 'Trang chủ', current: 'Tổng quan' };
  };

  const pageInfo = getPageInfo();

  return (
    <Header className="app-header">
      {/* Left: Breadcrumbs */}
      <div className="header-breadcrumbs">
        <span className="header-bc-root" onClick={() => navigate('/dashboard')}>
          <HomeOutlined style={{ marginRight: 4, fontSize: 12 }} />
          {pageInfo.root}
        </span>
        <RightOutlined style={{ fontSize: 9, color: '#94A3B8' }} />
        {pageInfo.sub ? (
          <>
            <span
              className="header-bc-root"
              onClick={() => pageInfo.subLink && navigate(pageInfo.subLink)}
            >
              {pageInfo.sub}
            </span>
            <RightOutlined style={{ fontSize: 9, color: '#94A3B8' }} />
            <span className="header-bc-current">{pageInfo.current}</span>
          </>
        ) : (
          <span className="header-bc-current">{pageInfo.current}</span>
        )}
      </div>

      {/* Right: Chuông thông báo duy nhất */}
      <Tooltip title="Thông báo hệ thống">
        <Badge dot color="#EF4444" offset={[-2, 2]} style={{ boxShadow: '0 0 0 2px #FFFFFF' }}>
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

      {/* Notification Drawer Component */}
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </Header>
  );
}
