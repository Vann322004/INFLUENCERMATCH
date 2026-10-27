import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Badge, Avatar, Dropdown, Button, Tooltip, Drawer, List, Typography, Tag, Empty } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CalendarOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';

const { Header } = Layout;
const { Text } = Typography;

interface CreatorHeaderProps {
  title?: string;
}

export default function CreatorHeader({ title }: CreatorHeaderProps) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'nt_1',
      title: 'Yêu cầu booking mới',
      content: "L'Oréal Paris Vietnam vừa gửi lời mời tham gia chiến dịch với ngân sách 35.000.000 ₫.",
      time: '15 phút trước',
      type: 'booking',
      read: false,
    },
    {
      id: 'nt_2',
      title: 'Hồ sơ Claim đã được duyệt',
      content: 'Data Manager đã phê duyệt quyền sở hữu kênh @chaubui_ trên Instagram.',
      time: '1 ngày trước',
      type: 'claim',
      read: false,
    },
    {
      id: 'nt_3',
      title: 'Cập nhật chỉ số Reach tuần',
      content: 'Lượt reach kênh TikTok của bạn tăng trưởng +14.8% trong 7 ngày qua.',
      time: '2 ngày trước',
      type: 'reach',
      read: true,
    },
  ]);

  const currentUser = authService.getCurrentUser() || {
    fullName: 'Châu Bùi (KOC / Creator)',
    email: 'creator@influencermatch.vn',
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

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
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', letterSpacing: -0.2 }}>
            {title || 'Creator Portal — Không gian Sáng tạo & Booking'}
          </div>
          <Tag color="green" style={{ fontWeight: 700, borderRadius: 20, padding: '1px 10px', fontSize: 11, border: 'none', background: '#ECFDF5', color: '#059669' }}>
            <CheckCircleFilled style={{ marginRight: 4 }} />
            VERIFIED CREATOR
          </Tag>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Notifications */}
          <Tooltip title="Thông báo Booking & Hệ thống">
            <Badge count={unreadCount} overflowCount={9} offset={[-3, 5]}>
              <div
                onClick={() => setNotifOpen(true)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <BellOutlined style={{ fontSize: 16 }} />
              </div>
            </Badge>
          </Tooltip>

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
                src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80"
                style={{ border: '1.5px solid #10B981' }}
              />
              <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                  {currentUser.fullName || 'Châu Bùi'}
                </div>
                <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>
                  KOC Level 5
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Notifications Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>Thông báo của bạn</span>
            {unreadCount > 0 && (
              <Button type="link" size="small" onClick={markAllRead} style={{ color: '#059669', padding: 0 }}>
                Đánh dấu đã đọc
              </Button>
            )}
          </div>
        }
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        width={380}
      >
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: item.read ? '#FFFFFF' : '#F0FDF4',
                marginBottom: 8,
                border: item.read ? '1px solid #F1F5F9' : '1px solid #BBF7D0',
                display: 'block',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{item.title}</span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{item.time}</span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>{item.content}</div>
            </List.Item>
          )}
        />
      </Drawer>
    </>
  );
}
