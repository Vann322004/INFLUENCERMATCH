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
        styles={{
          header: {
            background: '#231433',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          },
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'linear-gradient(180deg, #231433 0%, #341E4E 54%, #492A6D 100%)',
          },
        }}
        closeIcon={<span style={{ color: '#E2E8F0', fontSize: 16 }}>✕</span>}
        className="creator-mobile-drawer"
      >
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
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
            <div style={{ fontWeight: 800, fontSize: 14, color: '#FFFFFF', lineHeight: 1.2 }}>
              InfluencerMatch
            </div>
            <div style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600 }}>
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
            { key: 'profile', label: 'Thông tin cá nhân', path: '/creator/profile', icon: <UserOutlined /> },
          ].map((item) => {
            const active = location.pathname.includes(item.key);
            return (
              <div
                key={item.key}
                onClick={() => {
                  navigate(item.path);
                  setMobileDrawerOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                  background: active
                    ? 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)'
                    : 'transparent',
                  boxShadow: active ? '0 6px 16px rgba(109, 40, 217, 0.35)' : 'none',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <span style={{ fontSize: 16, display: 'inline-flex', alignItems: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(15, 10, 26, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar
              size={36}
              icon={<UserOutlined />}
              style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.fullName || currentUser?.email || 'Nhà sáng tạo'}
              </div>
              <div style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600 }}>
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
