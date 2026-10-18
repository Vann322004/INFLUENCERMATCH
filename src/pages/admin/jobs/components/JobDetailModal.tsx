import React from 'react';
import { Modal, Descriptions, Tag, Alert, Typography, Button, Divider, Timeline, message } from 'antd';
import {
  CopyOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { CollectionJob, JobStatus } from '../../../../mock/adminData';

const { Text, Paragraph } = Typography;

interface Props {
  job: CollectionJob | null;
  open: boolean;
  onClose: () => void;
  onRetry?: (job: CollectionJob) => void;
  onCancel?: (job: CollectionJob) => void;
}

const STATUS_MAP: Record<JobStatus, { color: string; label: string; icon: React.ReactNode }> = {
  running:   { color: 'processing', label: 'Đang chạy', icon: <SyncOutlined spin /> },
  done:      { color: 'success',    label: 'Thành công', icon: <CheckCircleOutlined /> },
  failed:    { color: 'error',      label: 'Thất bại',   icon: <CloseCircleOutlined /> },
  cancelled: { color: 'default',    label: 'Đã hủy',     icon: <StopOutlined /> },
  pending:   { color: 'warning',    label: 'Chờ xử lý',  icon: <ClockCircleOutlined /> },
};

export default function JobDetailModal({ job, open, onClose, onRetry, onCancel }: Props) {
  if (!job) return null;

  const st = STATUS_MAP[job.status] || STATUS_MAP.pending;

  const copyLogs = () => {
    const text = job.logs.join('\n');
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép toàn bộ logs vào clipboard!');
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Chi tiết Job #{job.id}</span>
          <Tag color={st.color} icon={st.icon} style={{ borderRadius: 6, fontWeight: 600 }}>
            {st.label}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={680}
      footer={[
        job.status === 'failed' && onRetry && (
          <Button key="retry" type="primary" onClick={() => onRetry(job)}>
            Thử lại (Retry)
          </Button>
        ),
        job.status === 'running' && onCancel && (
          <Button key="cancel" danger onClick={() => onCancel(job)}>
            Hủy Job
          </Button>
        ),
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <div style={{ marginTop: 12 }}>
        {/* Error notice if failed */}
        {job.errorMsg && (
          <Alert
            type="error"
            message="Lỗi thực thi (Execution Error)"
            description={job.errorMsg}
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* Job Metadata */}
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Loại công việc">{job.type}</Descriptions.Item>
          <Descriptions.Item label="Nguồn dữ liệu">{job.source}</Descriptions.Item>
          <Descriptions.Item label="Đối tượng mục tiêu">{job.target}</Descriptions.Item>
          <Descriptions.Item label="Thời lượng chạy">{job.duration}</Descriptions.Item>
          <Descriptions.Item label="Bắt đầu lúc" span={2}>{job.startedAt}</Descriptions.Item>
        </Descriptions>

        {/* Execution Logs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Execution Logs</Text>
          <Button size="small" icon={<CopyOutlined />} onClick={copyLogs}>
            Copy Logs
          </Button>
        </div>

        <div
          style={{
            background: '#0F172A',
            color: '#E2E8F0',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: 12,
            padding: '14px 16px',
            borderRadius: 10,
            maxHeight: 220,
            overflowY: 'auto',
            lineHeight: 1.6,
          }}
        >
          {job.logs.length > 0 ? (
            job.logs.map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: line.includes('ERROR') ? '#F87171' : line.includes('completed') || line.includes('successfully') ? '#34D399' : '#CBD5E1',
                }}
              >
                {line}
              </div>
            ))
          ) : (
            <div style={{ color: '#64748B', fontStyle: 'italic' }}>Chưa có log ghi nhận cho job này.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
