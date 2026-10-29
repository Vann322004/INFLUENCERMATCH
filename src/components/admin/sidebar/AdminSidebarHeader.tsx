import React from 'react';
import { SidebarToggleIcon, ChatGptTooltip } from './AdminSidebarTooltip';

interface AdminSidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebarHeader({ collapsed, onToggle }: AdminSidebarHeaderProps) {
  if (collapsed) {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 12 }}>
          <ChatGptTooltip title="Mở thanh bên" shortcut="Ctrl+Shift+S">
            <button
              type="button"
              className="sidebar-rail-logo-btn"
              onClick={onToggle}
              aria-label="Mở thanh bên"
            >
              <div className="sidebar-logo-icon-box">
                <img src="/logo.png" alt="InfluencerMatch Logo" className="sidebar-logo-img" />
                <span className="sidebar-toggle-glyph">
                  <SidebarToggleIcon size={20} />
                </span>
              </div>
            </button>
          </ChatGptTooltip>
        </div>

        {/* Subtle Divider */}
        <div
          style={{
            width: 32,
            height: 1,
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
            marginBottom: 8,
          }}
        />
      </div>
    );
  }

  return (
    <div className="sidebar-expanded-header">
      <ChatGptTooltip title="Thu gọn thanh bên" shortcut="Ctrl+Shift+S" placement="bottom">
        <div
          className="sidebar-brand-btn"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          aria-label="Thu gọn thanh bên"
        >
          <div className="sidebar-logo-icon-box">
            <img src="/logo.png" alt="InfluencerMatch Logo" className="sidebar-logo-img" />
            <span className="sidebar-toggle-glyph">
              <SidebarToggleIcon size={20} />
            </span>
          </div>
          <span className="sidebar-brand-name">InfluencerMatch</span>
        </div>
      </ChatGptTooltip>
    </div>
  );
}
