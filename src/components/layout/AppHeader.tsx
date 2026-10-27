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

  // Dynamic Page Context & Breadcrumb (100% tiếng Việt, bỏ chữ "Dashboard")
  const getPageInfo = () => {
    const p = location.pathname;
    if (p.includes('/campaigns')) return { root: 'Trang chủ', sub: 'Chiến dịch' };
    if (p.includes('/creators')) return { root: 'Trang chủ', sub: 'Khám phá KOC' };
    if (p.includes('/crm')) return { root: 'Trang chủ', sub: 'Tiếp cận & Kết nối' };
    if (p.includes('/collaboration')) return { root: 'Trang chủ', sub: 'Hợp tác & Vận hành' };
    if (p.includes('/performance')) return { root: 'Trang chủ', sub: 'Báo cáo & Hiệu suất' };
    if (p.includes('/subscription')) return { root: 'Trang chủ', sub: 'Cài đặt hệ thống' };
    if (p.includes('/brand-profile')) return { root: 'Trang chủ', sub: 'Hồ sơ thương hiệu' };
    return { root: 'Trang chủ', sub: 'Tổng quan' };
  };

  const pageInfo = getPageInfo();

  return (
    <Header className="app-header">
      {/* Left: Breadcrumbs (Chỉ hiển thị Trang chủ > Tổng quan) */}
      <div className="header-breadcrumbs">
        <span className="header-bc-root" onClick={() => navigate('/dashboard')}>
          <HomeOutlined style={{ marginRight: 4, fontSize: 12 }} />
          {pageInfo.root}
        </span>
        <RightOutlined style={{ fontSize: 9, color: '#94A3B8' }} />
        <span className="header-bc-current">{pageInfo.sub}</span>
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
