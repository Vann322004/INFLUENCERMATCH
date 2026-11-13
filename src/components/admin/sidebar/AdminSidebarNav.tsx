import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChatGptTooltip } from './AdminSidebarTooltip';
import {
  ADMIN_MENU_GROUPS,
  DATA_MANAGER_MENU_GROUPS,
  AdminMenuGroup,
  AdminMenuItem,
} from './adminSidebarItems';
import './AdminSidebarNav.css';

interface AdminSidebarNavProps {
  collapsed: boolean;
  activeKey: string;
  isManager: boolean;
  onNavigate: (path: string) => void;
}

export default function AdminSidebarNav({
  collapsed,
  activeKey,
  isManager,
  onNavigate,
}: AdminSidebarNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentSearch = location.search;

  // Chọn bộ Menu phẳng (Level 1 duy nhất, không có sub-menu)
  const menuGroups: AdminMenuGroup[] = isManager
    ? DATA_MANAGER_MENU_GROUPS
    : ADMIN_MENU_GROUPS;

  const isItemActive = (item: AdminMenuItem) => {
    if (item.key === 'dashboard') {
      return currentPath === item.path || activeKey === 'dashboard';
    }
    if (item.key === 'roles-permissions') {
      return currentPath.includes('/admin/accounts') && currentSearch.includes('permissions');
    }
    if (item.key === 'user-management') {
      return (
        (currentPath.includes('/admin/accounts') && !currentSearch.includes('permissions')) ||
        activeKey === 'user-management'
      );
    }
    return (
      item.key === activeKey ||
      currentPath.startsWith(item.path.split('?')[0])
    );
  };

  /* ──────────────────────────────────────────────────────────────────
     1. CHẾ ĐỘ THU GỌN (COLLAPSED RAIL MODE - Rộng 62px)
     ────────────────────────────────────────────────────────────────── */
  if (collapsed) {
    return (
      <div className="admin-nav-rail-container">
        {menuGroups.map((group, gIdx) => (
          <React.Fragment key={group.groupKey}>
            {gIdx > 0 && <div className="admin-rail-divider" />}
            {group.items.map((item) => {
              const active = isItemActive(item);
              return (
                <ChatGptTooltip key={item.key} title={item.label}>
                  <button
                    type="button"
                    className={`sidebar-rail-btn ${active ? 'active' : ''}`}
                    onClick={() => onNavigate(item.path)}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </button>
                </ChatGptTooltip>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────────
     2. CHẾ ĐỘ MỞ RỘNG (EXPANDED MODE - 100% MENU PHẲNG, CÓ DIVIDER NGĂN CÁCH)
     ────────────────────────────────────────────────────────────────── */
  return (
    <div className="admin-nav-fixed-wrapper">
      {menuGroups.map((group, groupIdx) => (
        <div key={group.groupKey} className="admin-menu-group-block">
          {/* Danh sách các Menu cấp 1 trực tiếp (Không có sub-menu) */}
          <div className="admin-nav-items-stack">
            {group.items.map((item: AdminMenuItem) => {
              const active = isItemActive(item);

              return (
                <div
                  key={item.key}
                  className={`admin-nav-item ${active ? 'active' : ''}`}
                  onClick={() => onNavigate(item.path)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-label">{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Đường kẻ phân cách giữa các nhóm (Thay cho tiêu đề chữ) */}
          {groupIdx < menuGroups.length - 1 && <div className="admin-nav-divider" />}
        </div>
      ))}
    </div>
  );
}
