import React from 'react';
import { Modal, Descriptions, Tag, Timeline, Button, Divider, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import type { Transaction, TxnStatus } from '../../../../mock/adminData';

const { Text } = Typography;

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onOpenRefund: (txn: Transaction) => void;
}

const STATUS_CFG: Record<TxnStatus, { label: string; color: string; icon: React.ReactNode }> = {
  paid:     { label: 'Thành công',  color: 'success',    icon: <CheckCircleOutlined /> },
  pending:  { label: 'Đang xử lý',  color: 'processing', icon: <ClockCircleOutlined /> },
  refunded: { label: 'Đã hoàn tiền', color: 'default',    icon: <RollbackOutlined /> },
  failed:   { label: 'Thất bại',    color: 'error',      icon: <CloseCircleOutlined /> },
};

export default function TransactionDetailModal({ transaction, open, onClose, onOpenRefund }: Props) {
  if (!transaction) return null;

  const st = STATUS_CFG[transaction.status] || STATUS_CFG.pending;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Giao dịch #{transaction.ref}</span>
          <Tag color={st.color} icon={st.icon} style={{ borderRadius: 6, fontWeight: 600 }}>
            {st.label}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        transaction.status === 'paid' && (
          <Button
            key="refund"
            danger
            icon={<RollbackOutlined />}
            onClick={() => {
              onClose();
              onOpenRefund(transaction);
            }}
          >
            Hoàn tiền (Refund)
          </Button>
        ),
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <div style={{ marginTop: 12 }}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 20 }}>
          <Descriptions.Item label="Mã tham chiếu">{transaction.ref}</Descriptions.Item>
          <Descriptions.Item label="Cổng thanh toán">{transaction.gateway}</Descriptions.Item>
          <Descriptions.Item label="Khách hàng">{transaction.userName}</Descriptions.Item>
          <Descriptions.Item label="Email">{transaction.userEmail}</Descriptions.Item>
          <Descriptions.Item label="Gói đăng ký">{transaction.plan}</Descriptions.Item>
          <Descriptions.Item label="Số tiền thanh toán">
            <strong style={{ color: '#10B981', fontSize: 15 }}>
              {transaction.amount.toLocaleString()} VND
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian tạo">{transaction.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Thời gian hoàn tất">{transaction.paidAt}</Descriptions.Item>
        </Descriptions>

        <Divider titlePlacement="left" style={{ fontSize: 13, fontWeight: 700 }}>Tiến trình trạng thái giao dịch</Divider>

        <Timeline
          style={{ marginTop: 12 }}
          items={[
            {
              color: 'green',
              children: (
                <div>
                  <strong>Khởi tạo đơn hàng</strong>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{transaction.createdAt} - User chọn gói {transaction.plan}</div>
                </div>
              ),
            },
            {
              color: transaction.status === 'failed' ? 'red' : 'green',
              children: (
                <div>
                  <strong>Kết nối cổng {transaction.gateway}</strong>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Redirect qua cổng thanh toán đối tác</div>
                </div>
              ),
            },
            {
              color: transaction.status === 'paid' ? 'green' : transaction.status === 'refunded' ? 'gray' : transaction.status === 'failed' ? 'red' : 'blue',
              children: (
                <div>
                  <strong>{st.label}</strong>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{transaction.paidAt !== '—' ? transaction.paidAt : 'Chưa ghi nhận'}</div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
}
