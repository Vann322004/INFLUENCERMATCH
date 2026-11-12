import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Progress, Tooltip, Avatar, Space, Popconfirm, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { QualityItem } from '../../types';
import { PLATFORM_COLOR_MAP } from '../../types';
import { creatorService } from '../../../../../services/api/creatorService';

interface QualityRowDraft {
  niche: string;
  primaryType: 'KOC' | 'KOL';
}

interface QualityTableProps {
  items: QualityItem[];
  loading: boolean;
  recrawlingId: string | null;
  approvingId: string | null;
  rejectingId?: string | null;
  drafts: Record<string, QualityRowDraft>;
  onDraftChange: (metricId: string, updates: Partial<QualityRowDraft>) => void;
  onQuickApprove: (item: QualityItem) => Promise<void>;
  onReject: (item: QualityItem) => Promise<void>;
  onRecrawl: (item: QualityItem) => void;
}

export const QualityTable: React.FC<QualityTableProps> = ({
  items,
  loading,
  recrawlingId,
  approvingId,
  rejectingId,
  drafts,
  onDraftChange,
  onQuickApprove,
  onReject,
  onRecrawl,
}) => {
  const navigate = useNavigate();
  const [niches, setNiches] = useState<string[]>([]);
  const [nichesLoading, setNichesLoading] = useState(true);
  useEffect(() => {
    let active = true;
    creatorService.getNiches()
      .then(names => { if (active) setNiches(names); })
      .finally(() => { if (active) setNichesLoading(false); });
    return () => { active = false; };
  }, []);

  const columns: TableColumnsType<QualityItem> = [
    {
      title: 'Nhà sáng tạo',
      key: 'creator',
      width: 250,
      render: (_, r) => {
        const platColor = PLATFORM_COLOR_MAP[r.platform.toLowerCase()] || 'default';
        const isApproving = approvingId === r.metricId;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: isApproving ? 0.6 : 1 }}>
            <Avatar
              size={42}
              src={r.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.userName}`}
              style={{ border: '1.5px solid #E2E8F0', flexShrink: 0 }}
            >
              {r.displayName?.charAt(0) || r.userName?.charAt(0)}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 160,
                }}
              >
                {r.displayName || r.userName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 2 }}>
                <span style={{ color: '#4F46E5', fontWeight: 600 }}>@{r.userName}</span>
                <span>•</span>
                <Tag
                  color={platColor}
                  style={{
                    fontSize: 10,
                    margin: 0,
                    padding: '0 5px',
                    height: 18,
                    lineHeight: '18px',
                    fontWeight: 700,
                    borderRadius: 4,
                  }}
                >
                  {r.platform.toUpperCase()}
                </Tag>
              </div>
              {r.profileUrl && (
                <a
                  href={r.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: '#64748B', display: 'inline-block', marginTop: 1 }}
                >
                  Mở kênh ↗
                </a>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ngành hàng',
      key: 'niche',
      width: 230,
      render: (_, r) => {
        const currentNiche = drafts[r.metricId]?.niche ?? r.niche ?? 'Sản phẩm tiêu dùng';
        return (
          <div>
            <Select
              value={currentNiche}
              onChange={(val) => onDraftChange(r.metricId, { niche: val })}
              options={niches.map((n) => ({ value: n, label: n }))}
              loading={nichesLoading}
              notFoundContent="Chưa có ngành hàng đang sử dụng"
              style={{ width: '100%', fontSize: 13 }}
              size="middle"
              popupMatchSelectWidth={250}
            />
            {r.niche && r.niche !== currentNiche && (
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                Gợi ý gốc: {r.niche}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Độ tin cậy',
      key: 'confidence',
      width: 150,
      render: (_, r) => {
        const pct = Math.round(r.dataConfidence * 100);
        const color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
        return (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color, marginBottom: 2 }}>
              {pct}%
            </div>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
          </div>
        );
      },
    },
    {
      title: 'Phân loại',
      key: 'primaryType',
      width: 110,
      render: (_, r) => {
        const currentType = drafts[r.metricId]?.primaryType ?? 'KOC';
        return (
          <Select
            value={currentType}
            onChange={(val) => onDraftChange(r.metricId, { primaryType: val })}
            options={[
              { value: 'KOC', label: 'KOC' },
              { value: 'KOL', label: 'KOL' },
            ]}
            style={{ width: 85 }}
            size="middle"
          />
        );
      },
    },
    {
      title: 'Bio & Nội dung',
      key: 'summary',
      render: (_, r) => (
        <Tooltip title={r.contentSummary || 'Chưa có thông tin bio'}>
          <div
            style={{
              fontSize: 12.5,
              color: '#475569',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {r.contentSummary || '—'}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 230,
      align: 'right',
      render: (_, r) => {
        const isApproving = approvingId === r.metricId;
        const isRecrawling = recrawlingId === r.metricId;
        const isRejecting = rejectingId === r.metricId;
        const isBusy = isApproving || isRecrawling || isRejecting;

        return (
          <Space size={6} style={{ justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              size="middle"
              icon={<CheckOutlined />}
              loading={isApproving}
              disabled={isBusy && !isApproving}
              onClick={() => onQuickApprove(r)}
              style={{
                background: '#10B981',
                borderColor: '#10B981',
                fontWeight: 600,
                borderRadius: 7,
                fontSize: 12.5,
              }}
            >
              Duyệt
            </Button>

            <Popconfirm
              title="Quét lại tài khoản này?"
              description="Hệ thống sẽ lấy lại thông tin mới nhất từ kênh."
              onConfirm={() => onRecrawl(r)}
              okText="Cào lại"
              cancelText="Hủy"
            >
              <Button
                size="middle"
                icon={<ReloadOutlined />}
                loading={isRecrawling}
                disabled={isBusy && !isRecrawling}
                style={{ color: '#64748B', borderRadius: 7, fontSize: 12.5 }}
              >
                Cào lại
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Từ chối hồ sơ này?"
              description="KOC sẽ được đưa vào danh sách từ chối và loại khỏi bảng chờ."
              onConfirm={() => onReject(r)}
              okText="Từ chối"
              cancelText="Hủy"
            >
              <Button
                size="middle"
                danger
                loading={isRejecting}
                disabled={isBusy && !isRejecting}
                style={{ borderRadius: 7, fontSize: 12.5 }}
              >
                Từ chối
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  if (items.length === 0 && !loading) {
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
            background: '#ECFDF5',
            color: '#059669',
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
          Không có hồ sơ nào cần kiểm duyệt
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, maxWidth: 460, margin: '6px auto 18px', lineHeight: 1.5 }}>
          Dữ liệu thu thập từ các kênh đã được xử lý xong. Khi có đợt cào mới hoặc phát hiện KOC cần xác nhận, danh sách sẽ hiển thị tại đây.
        </div>
        <Button
          type="primary"
          onClick={() => navigate('/admin/jobs')}
          style={{
            background: '#4F46E5',
            borderRadius: 8,
            fontWeight: 600,
            height: 38,
            padding: '0 20px',
          }}
        >
          Mở trang Thu thập & Cào dữ liệu
        </Button>
      </div>
    );
  }

  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="metricId"
      loading={loading}
      pagination={{
        pageSize: 10,
        showTotal: (total) => `Tổng số ${total} hồ sơ`,
        showSizeChanger: false,
      }}
      scroll={{ x: 1050 }}
    />
  );
};

export default QualityTable;
