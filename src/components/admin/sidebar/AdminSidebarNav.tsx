import React from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import { ChatGptTooltip } from './AdminSidebarTooltip';
import { PIPELINE_ITEMS, CATALOG_ITEMS, SYSTEM_ITEMS } from './adminSidebarItems';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';

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
  if (collapsed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {/* Dashboard Button */}
        <ChatGptTooltip title={isManager ? 'Tổng quan vận hành' : 'Tổng quan hệ thống'}>
          <button
            type="button"
            className={`sidebar-rail-btn ${activeKey === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate(ADMIN_ROUTES.DASHBOARD)}
            aria-label="Tổng quan"
          >
            <AppstoreOutlined style={{ fontSize: 18 }} />
          </button>
        </ChatGptTooltip>

        <div
          style={{
            width: 24,
            height: 1,
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            margin: '2px auto',
          }}
        />

        {/* Pipeline rail items */}
        {PIPELINE_ITEMS.map((item) => (
          <ChatGptTooltip key={item.key} title={item.label}>
            <button
              type="button"
              className={`sidebar-rail-btn ${activeKey === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.path)}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          </ChatGptTooltip>
        ))}

        <div
          style={{
            width: 24,
            height: 1,
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            margin: '2px auto',
          }}
        />

        {/* Catalog rail items */}
        {CATALOG_ITEMS.map((item) => (
          <ChatGptTooltip key={item.key} title={item.label}>
            <button
              type="button"
              className={`sidebar-rail-btn ${activeKey === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.path)}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          </ChatGptTooltip>
        ))}

        {/* System rail items (Super Admin only) */}
        {!isManager && (
          <>
            <div
              style={{
                width: 24,
                height: 1,
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                margin: '2px auto',
              }}
            />
            {SYSTEM_ITEMS.map((item) => (
              <ChatGptTooltip key={item.key} title={item.label}>
                <button
                  type="button"
                  className={`sidebar-rail-btn ${activeKey === item.key ? 'active' : ''}`}
                  onClick={() => onNavigate(item.path)}
                  aria-label={item.label}
                >
                  {item.icon}
                </button>
              </ChatGptTooltip>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="sidebar-menu-wrapper"
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        paddingRight: 2,
      }}
    >
      {/* Dashboard Item */}
      <div
        onClick={() => onNavigate(ADMIN_ROUTES.DASHBOARD)}
        className={`sidebar-nav-item ${activeKey === 'dashboard' ? 'active' : ''}`}
      >
        <span className="sidebar-nav-icon">
          <AppstoreOutlined style={{ fontSize: 18 }} />
        </span>
        <span className="sidebar-nav-label">
          {isManager ? 'Tổng quan vận hành' : 'Tổng quan hệ thống'}
        </span>
      </div>

      {/* Group: Thu thập & Xử lý dữ liệu */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#94A3B8',
          letterSpacing: 0.8,
          padding: '12px 14px 4px 14px',
          userSelect: 'none',
        }}
      >
        THU THẬP & XỬ LÝ DỮ LIỆU
      </div>
      {PIPELINE_ITEMS.map((item) => (
        <div
          key={item.key}
          onClick={() => onNavigate(item.path)}
          className={`sidebar-nav-item ${activeKey === item.key ? 'active' : ''}`}
        >
          <span className="sidebar-nav-icon">{item.icon}</span>
          <span className="sidebar-nav-label">{item.label}</span>
        </div>
      ))}

      {/* Group: Danh mục & Xác thực */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#94A3B8',
          letterSpacing: 0.8,
          padding: '12px 14px 4px 14px',
          userSelect: 'none',
        }}
      >
        DANH MỤC & XÁC THỰC
      </div>
      {CATALOG_ITEMS.map((item) => (
        <div
          key={item.key}
          onClick={() => onNavigate(item.path)}
          className={`sidebar-nav-item ${activeKey === item.key ? 'active' : ''}`}
        >
          <span className="sidebar-nav-icon">{item.icon}</span>
          <span className="sidebar-nav-label">{item.label}</span>
        </div>
      ))}

      {/* Group: Quản trị hệ thống (Super Admin only) */}
      {!isManager && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#94A3B8',
              letterSpacing: 0.8,
              padding: '12px 14px 4px 14px',
              userSelect: 'none',
            }}
          >
            QUẢN TRỊ HỆ THỐNG
          </div>
          {SYSTEM_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => onNavigate(item.path)}
              className={`sidebar-nav-item ${activeKey === item.key ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
