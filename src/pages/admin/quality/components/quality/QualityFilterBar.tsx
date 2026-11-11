import React from 'react';
import { Space, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface QualityFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  platformFilter: string;
  onPlatformChange: (value: string) => void;
  confidenceFilter: string;
  onConfidenceChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
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
          placeholder="Tìm kiếm KOC, username, nội dung..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 260, borderRadius: 8 }}
          allowClear
        />

        <Select
          value={platformFilter}
          onChange={onPlatformChange}
          style={{ width: 150 }}
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
          style={{ width: 170 }}
          options={[
            { value: 'all', label: 'Tất cả độ tin cậy' },
            { value: 'high', label: '≥ 70% (Chuẩn cao)' },
            { value: 'medium', label: '50% - 70% (Trung bình)' },
            { value: 'low', label: '< 50% (Rất thấp)' },
          ]}
        />
      </Space>

      <span style={{ fontSize: 12.5, color: '#64748B' }}>
        Hiển thị <strong>{filteredCount}</strong> / {totalCount} bản ghi cần kiểm duyệt
      </span>
    </div>
  );
};

export default QualityFilterBar;

