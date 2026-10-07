import React from 'react';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { RedoOutlined, StopOutlined, EyeOutlined } from '@ant-design/icons';
import type { CollectionJob } from '../../../../mock/adminData';

interface Props {
  job: CollectionJob;
  onViewDetail: (job: CollectionJob) => void;
  onRetry: (job: CollectionJob) => void;
  onCancel: (job: CollectionJob) => void;
}

export default function RetryCancelActions({ job, onViewDetail, onRetry, onCancel }: Props) {
  const canRetry = job.status === 'failed' || job.status === 'cancelled';
  const canCancel = job.status === 'running' || job.status === 'pending';

  return (
    <Space size={6}>
      <Tooltip title="Xem chi tiết & Logs">
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewDetail(job)}
          style={{ borderRadius: 6 }}
        />
      </Tooltip>

      {canRetry && (
        <Popconfirm
          title="Chạy lại Job này?"
          description={`Bạn có chắc chắn muốn retry job #${job.id} không?`}
          onConfirm={() => onRetry(job)}
          okText="Retry"
          cancelText="Hủy"
        >
          <Tooltip title="Thử lại (Retry)">
            <Button
              size="small"
              icon={<RedoOutlined />}
              style={{ borderRadius: 6, color: '#6366F1', borderColor: '#C7D2FE' }}
            />
          </Tooltip>
        </Popconfirm>
      )}

      {canCancel && (
        <Popconfirm
          title="Hủy Job đang chạy?"
          description={`Tiến trình #${job.id} sẽ bị dừng ngay lập tức.`}
          onConfirm={() => onCancel(job)}
          okText="Dừng Job"
          cancelText="Không"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Hủy Job">
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
        </Popconfirm>
      )}
    </Space>
  );
}
