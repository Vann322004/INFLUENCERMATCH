import React from 'react';
import { Tooltip } from 'antd';

/** Sidebar toggle icon [ | ] (rounded rectangle with left panel dividing line) */
export const SidebarToggleIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

export interface ChatGptTooltipProps {
  title: string;
  shortcut?: string;
  placement?: 'right' | 'top' | 'bottom' | 'left';
  children: React.ReactElement;
  disabled?: boolean;
}

export function ChatGptTooltip({
  title,
  shortcut,
  placement = 'right',
  children,
  disabled = false,
}: ChatGptTooltipProps) {
  if (disabled) return children;

  return (
    <Tooltip
      placement={placement}
      arrow={false}
      mouseEnterDelay={0.12}
      mouseLeaveDelay={0.04}
      rootClassName="chatgpt-capsule-tooltip"
      title={
        <div className="chatgpt-tooltip-content">
          <span className="chatgpt-tooltip-text">{title}</span>
          {shortcut && <span className="chatgpt-tooltip-shortcut">{shortcut}</span>}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}
