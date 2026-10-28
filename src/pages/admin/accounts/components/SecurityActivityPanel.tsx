import React, { useEffect, useState } from 'react';
import { Timeline, Tag, Typography, Spin } from 'antd';
import {
  LoginOutlined, WarningOutlined, KeyOutlined,
} from '@ant-design/icons';
import { adminService } from '../../../../services/api/adminService';
import type { AuditLogItem } from '../../../../types/api/admin.types';

const { Text } = Typography;

const ACTION_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  LOGIN:  { icon: <LoginOutlined />, color: '#10B981' },
  LOGOUT: { icon: <LoginOutlined />, color: '#64748B' },
  UPDATE: { icon: <KeyOutlined />,   color: '#F59E0B' },
  CREATE: { icon: <KeyOutlined />,   color: '#6366F1' },
  DELETE: { icon: <WarningOutlined />, color: '#EF4444' },
};

const ACTION_MAP: Record<string, string> = {
  LOGIN:  'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  UPDATE: 'Cập nhật',
  CREATE: 'Tạo mới',
  DELETE: 'Xóa',
};

const RESOURCE_MAP: Record<string, string> = {
  Auth: 'Hệ thống xác thực',
  Account: 'Tài khoản',
  ScoringConfig: 'Cấu hình tính điểm',
  SubscriptionPlan: 'Gói dịch vụ',
  Creator: 'Nhà sáng tạo',
  DataConnector: 'Nguồn kết nối dữ liệu',
};

interface SecurityActivityPanelProps {
  userId?: string;
}

export default function SecurityActivityPanel({ userId }: SecurityActivityPanelProps) {
  const [activities, setActivities] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminService.getAuditLogs({ actorId: userId, size: 10 })
      .then(res => {
        const list = res.items ?? res.content ?? (Array.isArray(res) ? res : []);
        setActivities(list);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 14 }}>
        Lịch sử hoạt động bảo mật
      </div>
      {loading ? (
        <Spin size="small" />
      ) : activities.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 13 }}>Không có dữ liệu hoạt động.</Text>
      ) : (
        <Timeline
          items={activities.map(act => {
            const cfg = ACTION_ICON[act.action] ?? { icon: <LoginOutlined />, color: '#94A3B8' };
            const actionText = ACTION_MAP[act.action] || act.action;
            const resourceText = RESOURCE_MAP[act.resource] || act.resource;
            return {
              color: cfg.color,
              dot: <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span>,
              children: (
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                    {actionText} • {resourceText}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <Tag color="default" style={{ fontSize: 11, borderRadius: 6 }}>
                      IP: {act.ip}
                    </Tag>
                    <Tag style={{ fontSize: 11, borderRadius: 6 }}>
                      ID: {act.resourceId}
                    </Tag>
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>{act.timestamp}</div>
                </div>
              ),
            };
          })}
        />
      )}
    </div>
  );
}
