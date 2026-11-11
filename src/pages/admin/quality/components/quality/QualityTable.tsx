import React from 'react';
import { Table, Tag, Button, Progress, Tooltip, Avatar, Space, Popconfirm, Empty } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { QualityItem } from '../../types';
import { PLATFORM_COLOR_MAP } from '../../types';

interface QualityTableProps {
  items: QualityItem[];
  loading: boolean;
  recrawlingId: string | null;
  onOpenApprove: (item: QualityItem) => void;
  onRecrawl: (item: QualityItem) => void;
}

export const QualityTable: React.FC<QualityTableProps> = ({
  items,
  loading,
  recrawlingId,
  onOpenApprove,
  onRecrawl,
}) => {
  const columns: TableColumnsType<QualityItem> = [
    {
      title: 'Hồ sơ KOC',
      key: 'creator',
      render: (_, r) => {
        const platColor = PLATFORM_COLOR_MAP[r.platform.toLowerCase()] || 'default';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={42} src={r.avatarUrl} style={{ border: '1px solid #E2E8F0', flexShrink: 0 }}>
              {r.displayName?.charAt(0) || r.userName?.charAt(0)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{r.displayName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                <span style={{ color: '#4F46E5', fontWeight: 600 }}>@{r.userName}</span>
                <span>•</span>
                <Tag
                  color={platColor}
                  style={{ fontSize: 10, margin: 0, padding: '0 6px', height: 18, lineHeight: '18px', fontWeight: 700, borderRadius: 4 }}
                >
                  {r.platform.toUpperCase()}
                </Tag>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Độ tin cậy AI',
      key: 'confidence',
      width: 170,
      render: (_, r) => {
        const pct = Math.round(r.dataConfidence * 100);
        const color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ color }}>{pct}% Match</span>
              <span style={{ fontSize: 10.5, color: '#94A3B8' }}>Ngưỡng: 70%</span>
            </div>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
          </div>
        );
      },
    },
    {
      title: 'Ngành hàng dự đoán',
      key: 'niche',
      width: 170,
      render: (_, r) => (
        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600, padding: '2px 8px' }}>
          {r.niche || 'Sản phẩm tiêu dùng'}
        </Tag>
      ),
    },
    {
      title: 'Tóm tắt nội dung cào',
      key: 'summary',
      render: (_, r) => (
        <Tooltip title={r.contentSummary}>
          <div
            style={{
              fontSize: 12.5,
              color: '#475569',
              maxWidth: 320,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {r.contentSummary}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 190,
      align: 'right',
      render: (_, r) => (
        <Space size={8}>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => onOpenApprove(r)}
            style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 600, borderRadius: 6 }}
          >
            Sửa & Duyệt
          </Button>
          <Popconfirm
            title="Quét lại bản ghi này?"
            description="Hệ thống crawler sẽ cào lại video & dữ liệu mới nhất của Creator."
            onConfirm={() => onRecrawl(r)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={recrawlingId === r.metricId}
              style={{ color: '#64748B', borderRadius: 6 }}
            >
              Cào lại
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="metricId"
      loading={loading}
      pagination={{ pageSize: 8, showTotal: (t) => `Tổng số ${t} hồ sơ` }}
      scroll={{ x: 1050 }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                  Toàn bộ dữ liệu KOC đã được chuẩn hóa!
                </div>
                <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  Không còn bản ghi nào có độ tin cậy dưới ngưỡng quy định cần duyệt.
                </div>
              </div>
            }
          />
        ),
      }}
    />
  );
};

export default QualityTable;

