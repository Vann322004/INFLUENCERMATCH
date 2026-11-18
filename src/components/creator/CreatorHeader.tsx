import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Avatar, Button, Drawer } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
  LineChartOutlined,
  ApiOutlined,
  HomeOutlined,
  RightOutlined,
} from '@ant-design/icons';
import NotificationBell from '../layout/NotificationBell';
import { authService } from '../../services/api/authService';
import '../../pages/creator/portal/CreatorPortalPage.css';

const { Header } = Layout;

interface CreatorHeaderProps {
  title?: string;
}

export default function CreatorHeader({ title }: CreatorHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getCurrentBreadcrumb = () => {
    if (title) return title;
    const p = location.pathname;
    if (p.includes('/rate-card')) return 'Bảng giá Rate Card';
    if (p.includes('/social')) return 'Kênh liên kết & Claim Tích Xanh';
    if (p.includes('/booking')) return 'Quản lý Hợp tác & Booking';
    if (p.includes('/verification')) return 'Định danh Pháp lý (eKYC)';
    return 'Tổng quan Creator Studio';
  };

  return (
    <>
      <Header className="app-header">
        <div className="app-header-inner" style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button
              type="button"
              className="creator-mobile-hamburger"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Mở menu Nhà sáng tạo"
            >
              <MenuOutlined />
            </button>

            <nav className="header-breadcrumbs" aria-label="Đường dẫn">
              <Link className="header-bc-root" to="/creator/dashboard">
                <HomeOutlined style={{ marginRight: 4, fontSize: 12 }} />
                Creator Studio
              </Link>
              <RightOutlined style={{ fontSize: 9, color: '#94A3B8' }} />
              <span className="header-bc-current" aria-current="page">
                {getCurrentBreadcrumb()}
              </span>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="header-live-badge">
              <span className="header-live-pulse" />
              <span>Đồng bộ số liệu Nhà sáng tạo</span>
            </div>
            <NotificationBell />
          </div>
        </div>
      </Header>

      {/* Mobile Navigation Drawer for KOC */}
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={280}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        className="creator-mobile-drawer"
      >
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 18,
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', lineHeight: 1.2 }}>
              InfluencerMatch
            </div>
            <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>
              Creator Studio
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { key: 'dashboard', label: 'Tổng quan', path: '/creator/dashboard', icon: <LineChartOutlined /> },
            { key: 'rate-card', label: 'Bảng giá Rate Card', path: '/creator/rate-card', icon: <DollarOutlined /> },
            { key: 'social-accounts', label: 'Kênh liên kết', path: '/creator/social-accounts', icon: <ApiOutlined /> },
            { key: 'bookings', label: 'Hợp tác', path: '/creator/bookings', icon: <CalendarOutlined /> },
          ].map((item) => {
            const active = location.pathname.includes(item.key);
            return (
              <div
                key={item.key}
                onClick={() => {
                  navigate(item.path);
                  setMobileDrawerOpen(false);
                }}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '14px 16px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar
              size={36}
              icon={<UserOutlined />}
              style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.fullName || currentUser?.email || 'Nhà sáng tạo'}
              </div>
              <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>
                Nhà sáng tạo (Creator)
              </div>
            </div>
          </div>

          <Button
            danger
            block
            icon={<LogoutOutlined />}
            onClick={() => {
              setMobileDrawerOpen(false);
              handleLogout();
            }}
            style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
          >
            Đăng xuất
          </Button>
        </div>
      </Drawer>
    </>
  );
}
