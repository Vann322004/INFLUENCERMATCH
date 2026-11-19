import React from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { ChatGptTooltip } from './AdminSidebarTooltip';

interface AdminSidebarUserSectionProps {
  collapsed: boolean;
  currentUser: any;
  isManager: boolean;
  onLogout: () => void;
}

export default function AdminSidebarUserSection({
  collapsed,
  currentUser,
  isManager,
  onLogout,
}: AdminSidebarUserSectionProps) {
  const getInitials = () => {
    const name = currentUser?.name || currentUser?.fullName;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return isManager ? 'QL' : 'QT';
  };

  const initials = getInitials();
  const userName = currentUser?.name || currentUser?.fullName || (isManager ? 'Quản lý dữ liệu' : 'Quản trị viên');
  const roleLabel = currentUser?.roleLabel || (isManager ? 'Quản lý dữ liệu' : 'Quản trị viên cấp cao');

  const userDropdownItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: isManager ? 'Hồ sơ Quản lý dữ liệu' : 'Hồ sơ Quản trị viên' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt hệ thống' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: onLogout },
  ];

  if (collapsed) {
    return (
      <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Dropdown menu={{ items: userDropdownItems }} placement="topRight" trigger={['click']}>
          <div>
            <ChatGptTooltip title={`${userName} (${roleLabel})`}>
              <div className="sidebar-rail-avatar-btn">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 12 }}>
                    {initials}
                  </span>
                )}
              </div>
            </ChatGptTooltip>
          </div>
        </Dropdown>
      </div>
    );
  }

  return (
    <div className="sidebar-bottom-user-section">
      <Dropdown menu={{ items: userDropdownItems }} placement="topRight" trigger={['click']}>
        <div className="sidebar-user-info-row" style={{ cursor: 'pointer' }}>
          <div className="sidebar-user-avatar">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>

          <div className="sidebar-user-details" style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">
              {userName}
            </div>
            <div className="sidebar-user-role">
              {roleLabel}
            </div>
          </div>

          <SettingOutlined style={{ fontSize: 14, color: '#94A3B8', marginLeft: 'auto', flexShrink: 0 }} />
        </div>
      </Dropdown>
    </div>
  );
}
