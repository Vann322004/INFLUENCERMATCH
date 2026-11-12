import React from 'react';
import { Table, Tag, Button, Progress, Avatar, Space, Popconfirm } from 'antd';
import type { TableColumnsType } from 'antd';
import { SwapOutlined, DisconnectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { IdentityConflictItem } from '../../types';
import { PLATFORM_COLOR_MAP } from '../../types';

interface IdentityTableProps {
  conflicts: IdentityConflictItem[];
  loading?: boolean;
  onOpenCompare: (conflict: IdentityConflictItem) => void;
  onResolveSeparate: (conflict: IdentityConflictItem) => void;
}

export const IdentityTable: React.FC<IdentityTableProps> = ({
  conflicts,
  loading,
  onOpenCompare,
  onResolveSeparate,
}) => {
  const columns: TableColumnsType<IdentityConflictItem> = [
    {
      title: 'Cặp tài khoản nghi vấn trùng',
      key: 'pair',
      width: 380,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Profile A */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#F8FAFC',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
            }}
          >
            <Avatar size={32} src={r.profileA.avatarUrl}>
              {r.profileA.displayName.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.profileA.displayName}</span>
                <Tag
                  color={PLATFORM_COLOR_MAP[r.profileA.platform.toLowerCase()] || 'default'}
                  style={{ fontSize: 9.5, padding: '0 4px', height: 16, lineHeight: '16px', borderRadius: 4 }}
                >
                  {r.profileA.platform.toUpperCase()}
                </Tag>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                @{r.profileA.userName} • {(r.profileA.followers / 1000).toLocaleString()}K flw
              </div>
            </div>
          </div>

          {/* Profile B */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#F8FAFC',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
            }}
          >
            <Avatar size={32} src={r.profileB.avatarUrl}>
              {r.profileB.displayName.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.profileB.displayName}</span>
                <Tag
                  color={PLATFORM_COLOR_MAP[r.profileB.platform.toLowerCase()] || 'default'}
                  style={{ fontSize: 9.5, padding: '0 4px', height: 16, lineHeight: '16px', borderRadius: 4 }}
                >
                  {r.profileB.platform.toUpperCase()}
                </Tag>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                @{r.profileB.userName} • {(r.profileB.followers / 1000).toLocaleString()}K flw
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Độ tương đồng',
      key: 'matchScore',
      width: 160,
      render: (_, r) => {
        const pct = Math.round(r.matchScore * 100);
        const color = pct >= 90 ? '#10B981' : pct >= 80 ? '#F59E0B' : '#6366F1';
        return (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>
              {pct}%
            </div>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
          </div>
        );
      },
    },
    {
      title: 'Cơ sở đối chiếu',
      key: 'evidence',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12.5, color: '#0F172A', marginBottom: 4 }}>
            {r.conflictLabel}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(r.evidenceTags || []).map((tag, i) => (
              <Tag key={i} color="blue" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      align: 'right',
      render: (_, r) => (
        <Space size={8} style={{ justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            size="middle"
            icon={<SwapOutlined />}
            onClick={() => onOpenCompare(r)}
            style={{
              background: '#2563EB',
              borderColor: '#2563EB',
              fontWeight: 600,
              fontSize: 12.5,
              borderRadius: 7,
            }}
          >
            Đối chiếu & Gộp
          </Button>

          <Popconfirm
            title="Xác nhận là 2 Creator khác nhau?"
            description="Hệ thống sẽ giữ riêng biệt 2 hồ sơ này và không cảnh báo trùng lặp nữa."
            onConfirm={() => onResolveSeparate(r)}
            okText="Xác nhận tách"
            cancelText="Hủy"
          >
            <Button size="middle" icon={<DisconnectOutlined />} danger style={{ fontSize: 12.5, borderRadius: 7 }}>
              Tách
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (conflicts.length === 0 && !loading) {
    return (
      <div
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          background: '#FAFAFD',
          borderRadius: 12,
          border: '1px dashed #CBD5E1',
          margin: '8px 0',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 14,
          }}
        >
          <CheckCircleOutlined />
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
          Không có hồ sơ nào nghi vấn trùng lặp
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, maxWidth: 460, margin: '6px auto', lineHeight: 1.5 }}>
          Các hồ sơ Creator đa nền tảng (TikTok, Facebook, Instagram, YouTube) đã được kiểm tra và không phát hiện trùng lặp danh tính.
        </div>
      </div>
    );
  }

  return (
    <Table
      dataSource={conflicts}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 6, showTotal: (t) => `Tổng số ${t} cặp xung đột` }}
      scroll={{ x: 1050 }}
    />
  );
};

export default IdentityTable;
