import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Button, Drawer } from 'antd';
import NotificationBell from '../layout/NotificationBell';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CalendarOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
  LineChartOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';
import '../../pages/creator/portal/CreatorPortalPage.css';

const { Header } = Layout;


interface CreatorHeaderProps {
  title?: string;
}

export default function CreatorHeader({ title }: CreatorHeaderProps) {
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };


  const userDropdown: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân & CCCD', onClick: () => navigate('/creator/verification') },
    { key: 'rate-card', icon: <DollarOutlined />, label: 'Quản lý Rate Card', onClick: () => navigate('/creator/rate-card') },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt liên kết kênh' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: handleLogout },
  ];

  return (
    <>
      <Header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="creator-mobile-hamburger"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Mở menu KOC"
          >
            <MenuOutlined />
          </button>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', letterSpacing: -0.2 }} className="creator-header-title">
            {title || 'Creator Portal — Không gian Sáng tạo & Booking'}
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NotificationBell />

          {/* User Profile */}
          <Dropdown menu={{ items: userDropdown }} placement="bottomRight" trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
              }}
            >
              <Avatar
                size={30}
                icon={<UserOutlined />}
                style={{ border: '1.5px solid #10B981' }}
              />
              <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                  {currentUser?.fullName || currentUser?.email || '—'}
                </div>
                <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>
                  Creator
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Mobile Navigation Drawer for KOC */}
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={290}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        className="creator-mobile-drawer"
      >
        {/* Drawer Header Brand */}
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
              CREATOR PORTAL
            </div>
            <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>
              InfluencerMatch KOC
            </div>
          </div>
        </div>

        {/* 4 Core KOC Navigation Links */}
        <div style={{ padding: '14px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { key: 'dashboard', label: 'Tổng quan', path: '/creator/dashboard', icon: <LineChartOutlined /> },
            { key: 'rate-card', label: 'Bảng giá Rate Card', path: '/creator/rate-card', icon: <DollarOutlined /> },
            { key: 'social-accounts', label: 'Kênh liên kết & Claim', path: '/creator/social-accounts', icon: <ApiOutlined /> },
            { key: 'bookings', label: 'Lời mời hợp tác', path: '/creator/bookings', icon: <CalendarOutlined /> },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => {
                navigate(item.path);
                setMobileDrawerOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: location.pathname.includes(item.key) ? '#1D4ED8' : '#334155',
                background: location.pathname.includes(item.key) ? '#EFF6FF' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 18, color: location.pathname.includes(item.key) ? '#2563EB' : '#64748B' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Drawer Footer User Profile */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar
              size={36}
              icon={<UserOutlined />}
              style={{ border: '2px solid #2563EB' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.fullName || currentUser?.email || '—'}
              </div>
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                Creator
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
