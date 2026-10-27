import React from 'react';
import { Table, Tag, Button, Space, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HistoryOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { PaymentInvoice } from '../../../data/mockData';

const { Text } = Typography;

/** Format currency helper (sử dụng non-breaking space để chữ đ không bao giờ bị rớt dòng) */
export const formatVND = (val: number) => {
  return `${val.toLocaleString('vi-VN')}\u00A0₫`;
};

interface HistoryTabProps {
  invoices: PaymentInvoice[];
  loading: boolean;
  onViewInvoice: (invoice: PaymentInvoice) => void;
}

export default function HistoryTab({ invoices, loading, onViewInvoice }: HistoryTabProps) {
  const invoiceColumns: ColumnsType<PaymentInvoice> = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
          {code}
        </span>
      ),
    },
    {
      title: 'Gói dịch vụ',
      dataIndex: 'planName',
      key: 'planName',
      render: (name: string, record: PaymentInvoice) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1E293B' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{record.billingPeriod}</div>
        </div>
      ),
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <span style={{ color: '#475569' }}>{date}</span>,
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 500 }}>
          {method}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ fontWeight: 700, color: '#0F172A' }}>
          {formatVND(amount)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: PaymentInvoice) => (
        <Tag
          color={status === 'success' ? 'success' : status === 'pending' ? 'warning' : 'error'}
          style={{ borderRadius: 999, padding: '2px 10px', fontWeight: 600 }}
        >
          {record.statusText}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      render: (_, record: PaymentInvoice) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => onViewInvoice(record)}
          >
            Xem HĐ
          </Button>
          <Button
            size="small"
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => {
              message.success(`Đang tải hóa đơn ${record.code}.pdf về máy...`);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Hiển thị danh sách hóa đơn các kỳ gia hạn và nâng cấp gói dịch vụ của bạn.
        </Text>
      </div>

      <Table
        columns={invoiceColumns}
        dataSource={invoices}
        rowKey="id"
        loading={loading}
        pagination={false}
        className="styled-table"
        locale={{
          emptyText: (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748B' }}>
              <HistoryOutlined style={{ fontSize: 32, color: '#CBD5E1', marginBottom: 8 }} />
              <div style={{ fontWeight: 600, color: '#334155' }}>Chưa có giao dịch thanh toán nào phát sinh</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                Hóa đơn điện tử sẽ tự động tạo và lưu trữ tại đây ngay khi bạn thanh toán gói qua cổng VNPAY.
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
}
