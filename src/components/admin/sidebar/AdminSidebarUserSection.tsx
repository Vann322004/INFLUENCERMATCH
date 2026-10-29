import React from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { ChatGptTooltip } from './AdminSidebarTooltip';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';

interface AdminSidebarUserSectionProps {
  collapsed: boolean;
  currentUser: any;
  isManager: boolean;
  onLogout: () => void;
  onActionClick: (path: string) => void;
}

export default function AdminSidebarUserSection({
  collapsed,
  currentUser,
  isManager,
  onLogout,
  onActionClick,
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
  const userName = currentUser?.name || currentUser?.fullName || (isManager ? 'Quản lý vận hành' : 'Quản trị viên');
  const roleLabel = currentUser?.roleLabel || (isManager ? 'Quản lý vận hành' : 'Quản trị viên cấp cao');

  const userDropdownItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: isManager ? 'Hồ sơ Quản lý' : 'Hồ sơ Quản trị viên' },
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
              <div
                className="sidebar-rail-avatar-btn"
                style={{
                  background: isManager ? '#0EA5E9' : '#7C3AED',
                  boxShadow: isManager
                    ? '0 2px 6px rgba(14, 165, 233, 0.35)'
                    : '0 2px 6px rgba(124, 58, 237, 0.35)',
                }}
              >
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
          <div
            className="sidebar-user-avatar"
            style={{
              background: isManager ? '#0EA5E9' : '#7C3AED',
              boxShadow: isManager
                ? '0 2px 6px rgba(14, 165, 233, 0.35)'
                : '0 2px 6px rgba(124, 58, 237, 0.35)',
            }}
          >
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
            <div
              className="sidebar-user-role"
              style={{ color: isManager ? '#0284C7' : '#7C3AED', fontWeight: 600 }}
            >
              {roleLabel}
            </div>
          </div>

          <SettingOutlined style={{ fontSize: 14, color: '#94A3B8', marginLeft: 'auto', flexShrink: 0 }} />
        </div>
      </Dropdown>

      {/* Quick Action Pill Button matching brand */}
      <button
        type="button"
        onClick={() => onActionClick(isManager ? ADMIN_ROUTES.DATA_QUALITY : ADMIN_ROUTES.AUDIT)}
        className="sidebar-claim-pill-btn"
      >
        {isManager ? (
          <>
            <CheckCircleOutlined style={{ fontSize: 13, color: '#0EA5E9' }} />
            <span>Kiểm định chất lượng</span>
          </>
        ) : (
          <>
            <FileTextOutlined style={{ fontSize: 13, color: '#7C3AED' }} />
            <span>Xem nhật ký hoạt động</span>
          </>
        )}
      </button>
    </div>
  );
}
