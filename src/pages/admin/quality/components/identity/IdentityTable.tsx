import React from 'react';
import { Table, Tag, Button, Progress, Avatar, Space, Popconfirm, Empty } from 'antd';
import type { TableColumnsType } from 'antd';
import { EyeOutlined, SwapOutlined, DisconnectOutlined } from '@ant-design/icons';
import type { IdentityConflictItem } from '../../types';
import { PLATFORM_COLOR_MAP } from '../../types';

interface IdentityTableProps {
  conflicts: IdentityConflictItem[];
  loading?: boolean;
  onOpenCompare: (conflict: IdentityConflictItem) => void;
  onOpenMerge: (conflict: IdentityConflictItem) => void;
  onResolveSeparate: (conflict: IdentityConflictItem) => void;
}

export const IdentityTable: React.FC<IdentityTableProps> = ({
  conflicts,
  loading,
  onOpenCompare,
  onOpenMerge,
  onResolveSeparate,
}) => {
  const columns: TableColumnsType<IdentityConflictItem> = [
    {
      title: 'Cặp hồ sơ nghi vấn trùng lặp',
      key: 'pair',
      width: 380,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Profile A */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <Avatar size={34} src={r.profileA.avatarUrl}>
              {r.profileA.displayName.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.profileA.displayName}</span>
                <Tag color={PLATFORM_COLOR_MAP[r.profileA.platform.toLowerCase()] || 'default'} style={{ fontSize: 9.5, padding: '0 4px', height: 16, lineHeight: '16px', borderRadius: 4 }}>
                  {r.profileA.platform.toUpperCase()}
                </Tag>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                @{r.profileA.userName} • {(r.profileA.followers / 1000).toLocaleString()}K flw
              </div>
            </div>
          </div>

          {/* Profile B */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <Avatar size={34} src={r.profileB.avatarUrl}>
              {r.profileB.displayName.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.profileB.displayName}</span>
                <Tag color={PLATFORM_COLOR_MAP[r.profileB.platform.toLowerCase()] || 'default'} style={{ fontSize: 9.5, padding: '0 4px', height: 16, lineHeight: '16px', borderRadius: 4 }}>
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
      title: 'Độ tương đồng AI',
      key: 'matchScore',
      width: 170,
      render: (_, r) => {
        const pct = Math.round(r.matchScore * 100);
        const color = pct >= 90 ? '#10B981' : pct >= 80 ? '#F59E0B' : '#6366F1';
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 3 }}>
              <span style={{ color }}>{pct}% Tương đồng</span>
              <span style={{ fontSize: 10.5, color: '#64748B' }}>Khớp cao</span>
            </div>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>
              Phát hiện: {new Date(r.detectedAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Bằng chứng AI đối chiếu',
      key: 'evidence',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12.5, color: '#0F172A', marginBottom: 6 }}>
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
      title: 'Xử lý xung đột',
      key: 'action',
      width: 230,
      align: 'right',
      render: (_, r) => (
        <Space size={6} wrap style={{ justifyContent: 'flex-end' }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onOpenCompare(r)}
            style={{ fontSize: 12, borderRadius: 6 }}
          >
            So sánh
          </Button>

          <Button
            type="primary"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => onOpenMerge(r)}
            style={{ background: '#2563EB', borderColor: '#2563EB', fontWeight: 600, fontSize: 12, borderRadius: 6 }}
          >
            Hợp nhất
          </Button>

          <Popconfirm
            title="Xác nhận là 2 Creator khác nhau?"
            description="Hệ thống sẽ giữ riêng biệt 2 hồ sơ này và không cảnh báo xung đột nữa."
            onConfirm={() => onResolveSeparate(r)}
            okText="Xác nhận tách"
            cancelText="Hủy"
          >
            <Button size="small" icon={<DisconnectOutlined />} danger style={{ fontSize: 12, borderRadius: 6 }}>
              Tách biệt
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={conflicts}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 6, showTotal: (t) => `Tổng số ${t} cặp xung đột` }}
      scroll={{ x: 1050 }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                  Không có xung đột danh tính nào tồn đọng!
                </div>
                <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  Dữ liệu Creator Catalog đã được deduplicate đồng nhất 100%.
                </div>
              </div>
            }
          />
        ),
      }}
    />
  );
};

export default IdentityTable;

