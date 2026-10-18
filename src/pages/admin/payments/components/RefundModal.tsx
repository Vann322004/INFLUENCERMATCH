import React from 'react';
import { Modal, Form, Input, Alert, Descriptions, Typography, Tag } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { Transaction } from '../../../../mock/adminData';

const { Text } = Typography;

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onConfirmRefund: (txn: Transaction, reason: string) => void;
}

export default function RefundModal({ transaction, open, onClose, onConfirmRefund }: Props) {
  const [form] = Form.useForm();

  if (!transaction) return null;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onConfirmRefund(transaction, values.reason);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626' }}>
          <ExclamationCircleOutlined />
          <span>Hoàn tiền giao dịch #{transaction.ref}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận hoàn tiền"
      okButtonProps={{ danger: true }}
      cancelText="Hủy"
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <Alert
          type="error"
          showIcon
          message="Hành động không thể hoàn tác"
          description="Tiền sẽ được xử lý hoàn trả qua cổng thanh toán ban đầu. Tài khoản người dùng sẽ bị hạ cấp về gói Free tương ứng."
          style={{ marginBottom: 16, borderRadius: 10 }}
        />

        <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Khách hàng">{transaction.userName} ({transaction.userEmail})</Descriptions.Item>
          <Descriptions.Item label="Gói dịch vụ">{transaction.plan}</Descriptions.Item>
          <Descriptions.Item label="Số tiền hoàn lại">
            <strong style={{ color: '#DC2626', fontSize: 16 }}>
              {transaction.amount.toLocaleString()} VND
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Cổng thanh toán">{transaction.gateway}</Descriptions.Item>
        </Descriptions>

        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do hoàn tiền (Bắt buộc) *"
            rules={[{ required: true, message: 'Vui lòng cung cấp lý do hoàn tiền' }]}
          >
            <Input.TextArea
              placeholder="VD: Khách hàng không hài lòng trong chính sách 7 ngày dùng thử..."
              rows={3}
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
