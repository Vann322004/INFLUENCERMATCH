import React from 'react';
import { Timeline, Tag, Typography } from 'antd';
import {
  LoginOutlined, WarningOutlined, KeyOutlined, MobileOutlined,
} from '@ant-design/icons';
import { SECURITY_ACTIVITY } from '../../../../mock/adminData';

const { Text } = Typography;

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  'Đăng nhập thành công':              { icon: <LoginOutlined />, color: '#10B981' },
  'Đăng nhập thất bại (sai mật khẩu)': { icon: <WarningOutlined />, color: '#EF4444' },
  'Đổi mật khẩu':                      { icon: <KeyOutlined />, color: '#F59E0B' },
};

interface SecurityActivityPanelProps {
  userId?: string;
}

export default function SecurityActivityPanel({ userId }: SecurityActivityPanelProps) {
  // In a real app, filter by userId. Here we use all mock data.
  const activities = SECURITY_ACTIVITY;

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 14 }}>
        🔐 Lịch sử hoạt động bảo mật
      </div>
      {activities.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 13 }}>Không có dữ liệu.</Text>
      ) : (
        <Timeline
          items={activities.map(act => {
            const cfg = EVENT_CONFIG[act.event] ?? { icon: <LoginOutlined />, color: '#94A3B8' };
            return {
              color: cfg.color,
              dot: <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span>,
              children: (
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{act.event}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <Tag style={{ fontSize: 11, borderRadius: 6 }}>
                      <MobileOutlined style={{ marginRight: 4 }} />{act.device}
                    </Tag>
                    <Tag color="default" style={{ fontSize: 11, borderRadius: 6 }}>
                      IP: {act.ip}
                    </Tag>
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>{act.time}</div>
                </div>
              ),
            };
          })}
        />
      )}
    </div>
  );
}
