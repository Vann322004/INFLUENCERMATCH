import React from 'react';
import { Space, Select } from 'antd';

interface IdentityFilterBarProps {
  conflictFilter: string;
  onFilterChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const IdentityFilterBar: React.FC<IdentityFilterBarProps> = ({
  conflictFilter,
  onFilterChange,
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
        <Select
          value={conflictFilter}
          onChange={onFilterChange}
          style={{ width: 280 }}
          options={[
            { value: 'all', label: 'Tất cả loại xung đột' },
            { value: 'CROSS_PLATFORM_DUPLICATE', label: 'Trùng lặp đa nền tảng (Cùng người)' },
            { value: 'CONTACT_INFO_OVERLAP', label: 'Trùng thông tin liên hệ / Email' },
            { value: 'SIMILAR_HANDLE_SAME_NICHE', label: 'Trùng tên hiển thị trong cùng ngành' },
          ]}
        />
      </Space>

      <span style={{ fontSize: 12.5, color: '#64748B' }}>
        Hiển thị <strong>{filteredCount}</strong> / {totalCount} cặp xung đột cần giải quyết
      </span>
    </div>
  );
};

export default IdentityFilterBar;

