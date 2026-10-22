import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Input,
  Button,
  Avatar,
  Badge,
  Dropdown,
  Tooltip,
  Space,
  Card,
  message
} from 'antd';
import {
  AppstoreOutlined,
  NotificationOutlined,
  TeamOutlined,
  CompassOutlined,
  BarChartOutlined,
  MessageOutlined,
  SettingOutlined,
  SearchOutlined,
  BellOutlined,
  SunOutlined,
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
  RightOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';
import { ROUTES } from '../../constants/routes';
import './DashboardLayout.css';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const handleLogout = () => {
    authService.logout();
    message.success('Đã đăng xuất thành công!');
    navigate(ROUTES.AUTH.LOGIN);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin tài khoản',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt hệ thống',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <AppstoreOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'campaigns',
      icon: <NotificationOutlined />,
      label: 'Chiến dịch',
    },
    {
      key: 'creators',
      icon: <TeamOutlined />,
      label: 'Creator',
    },
    {
      key: 'explore',
      icon: <CompassOutlined />,
      label: 'Khám phá',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Tin nhắn</span>
          <Badge
            count={currentUser.unreadMessages || 3}
            style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      {/* SIDER WITH LIGHT LINEAR GRADIENT */}
      <Sider
        width={250}
        theme="light"
        className="antd-custom-sider"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 40%, #EEF2FF 75%, #E0E7FF 100%)',
          borderRight: '1px solid #E2E8F0',
          height: '100vh',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div
          onClick={() => navigate(ROUTES.DASHBOARD)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 10px 18px 10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="InfluencerMatch"
            style={{
              width: 40,
              height: 40,
              objectFit: 'contain',
              flexShrink: 0,
              filter: 'drop-shadow(0 2px 8px rgba(37, 244, 238, 0.35)) drop-shadow(0 2px 8px rgba(254, 44, 85, 0.35))',
              transition: 'transform 0.25s ease',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span
              style={{
                color: '#0F172A',
                fontWeight: 900,
                fontSize: 13.8,
                letterSpacing: 0.3,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                textShadow: '-1.2px -0.6px 0 #25F4EE, 1.2px 0.6px 0 #FE2C55',
                userSelect: 'none',
              }}
            >
              INFLUENCERMATCH
            </span>
          </div>
        </div>

        {/* Ant Design Menu */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="antd-sider-menu-wrapper">
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            onClick={({ key }) => setActiveMenu(key)}
            items={menuItems}
            style={{
              background: 'transparent',
              border: 'none',
              fontWeight: 600,
            }}
            className="antd-sider-menu"
          />
        </div>

        {/* AI Promo Card using Ant Design Card */}
        <div style={{ flexShrink: 0, margin: '8px 2px' }}>
          <Card
            size="small"
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, #F5F3FF 60%, #EEF2FF 100%)',
              border: '1px solid #DDD6FE',
              borderRadius: 16,
              textAlign: 'center',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.08)',
            }}
            bodyStyle={{ padding: '10px 8px' }}
          >
            <div style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A', lineHeight: 1.35, marginBottom: 6 }}>
              AI giúp bạn tìm đúng influencer phù hợp nhất
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <Avatar
                size={38}
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                style={{ border: '2px solid #8B5CF6' }}
              />
            </div>
            <div style={{ fontSize: 9.5, color: '#64748B', marginBottom: 8 }}>
              Nhanh hơn • Chính xác hơn • Hiệu quả hơn
            </div>
            <Button
              type="primary"
              shape="round"
              size="small"
              block
              icon={<ArrowRightOutlined />}
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                fontWeight: 700,
                fontSize: 11,
                height: 26,
              }}
            >
              Khám phá ngay
            </Button>
          </Card>
        </div>
      </Sider>

      {/* MAIN LAYOUT */}
      <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <Header
          style={{
            background: 'transparent',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 28px 4px 28px',
            height: 'auto',
            minHeight: 52,
            lineHeight: 'normal',
            zIndex: 10,
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Tooltip title="Thông báo">
              <Badge dot color="#F59E0B">
                <Button
                  shape="circle"
                  icon={<BellOutlined />}
                  style={{ border: '1px solid #E2E8F0', color: '#64748B' }}
                />
              </Badge>
            </Tooltip>

            <Tooltip title="Chế độ giao diện">
              <Button
                shape="circle"
                icon={<SunOutlined />}
                style={{ border: '1px solid #E2E8F0', color: '#64748B' }}
              />
            </Tooltip>

            {/* User Dropdown in Header */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 8,
                  lineHeight: 'normal',
                }}
                className="antd-header-profile-hover"
              >
                <Avatar size={36} style={{ border: '1.5px solid #E2E8F0', flexShrink: 0, backgroundColor: '#8B5CF6' }}>
                  {(currentUser?.fullName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    {currentUser?.fullName || currentUser?.email || 'Người dùng'}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    {currentUser?.role || 'User'}
                  </span>
                </div>
                <DownOutlined style={{ fontSize: 10, color: '#94A3B8', marginLeft: 2 }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* SCROLLABLE CONTENT BODY */}
        <Content
          style={{
            background: '#F8FAFC',
            overflowY: 'auto',
            padding: '24px 28px 40px 28px',
            boxSizing: 'border-box',
            flex: 1,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
