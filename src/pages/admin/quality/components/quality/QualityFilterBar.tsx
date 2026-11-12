import React from 'react';
import { Space, Input, Select, Button, Popconfirm } from 'antd';
import { SearchOutlined, CheckOutlined } from '@ant-design/icons';

interface QualityFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  platformFilter: string;
  onPlatformChange: (value: string) => void;
  confidenceFilter: string;
  onConfidenceChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  highConfidenceCount: number;
  onBatchApproveHighConfidence: () => void;
  batchApproving: boolean;
}

export const QualityFilterBar: React.FC<QualityFilterBarProps> = ({
  search,
  onSearchChange,
  platformFilter,
  onPlatformChange,
  confidenceFilter,
  onConfidenceChange,
  filteredCount,
  totalCount,
  highConfidenceCount,
  onBatchApproveHighConfidence,
  batchApproving,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <Space size={10} wrap>
        <Input
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          placeholder="Tìm theo tên, @username, bio..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 250, borderRadius: 8 }}
          allowClear
        />

        <Select
          value={platformFilter}
          onChange={onPlatformChange}
          style={{ width: 145 }}
          options={[
            { value: 'all', label: 'Tất cả nền tảng' },
            { value: 'tiktok', label: 'TikTok' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'youtube', label: 'YouTube' },
          ]}
        />

        <Select
          value={confidenceFilter}
          onChange={onConfidenceChange}
          style={{ width: 165 }}
          options={[
            { value: 'all', label: 'Tất cả độ tin cậy' },
            { value: 'high', label: 'Tin cậy cao (≥ 70%)' },
            { value: 'medium', label: 'Trung bình (50-70%)' },
            { value: 'low', label: 'Cần xem lại (< 50%)' },
          ]}
        />
      </Space>

      <Space size={12} wrap>
        {totalCount > 0 && (
          <span style={{ fontSize: 13, color: '#64748B' }}>
            Hiển thị <strong>{filteredCount}</strong> / {totalCount} hồ sơ
          </span>
        )}

        {highConfidenceCount > 0 && (
          <Popconfirm
            title={`Phê duyệt ${highConfidenceCount} hồ sơ đạt chuẩn?`}
            description="Các hồ sơ này sẽ được xác nhận theo ngành hàng gợi ý và nạp vào danh mục KOC."
            onConfirm={onBatchApproveHighConfidence}
            okText="Duyệt tất cả"
            cancelText="Hủy"
          >
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={batchApproving}
              style={{
                background: '#10B981',
                borderColor: '#10B981',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Duyệt nhanh ({highConfidenceCount})
            </Button>
          </Popconfirm>
        )}
      </Space>
    </div>
  );
};

export default QualityFilterBar;
