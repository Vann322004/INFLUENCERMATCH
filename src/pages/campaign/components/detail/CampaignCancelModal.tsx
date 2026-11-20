import React from 'react';
import { Modal } from 'antd';

interface CampaignCancelModalProps {
  isOpen: boolean;
  campaignTitle: string;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  onConfirmCancel: () => void;
  onClose: () => void;
}

export const CampaignCancelModal: React.FC<CampaignCancelModalProps> = ({
  isOpen,
  campaignTitle,
  onConfirmCancel,
  onClose,
}) => {
  return (
    <Modal
      title={<span style={{ fontWeight: 700, color: '#EF4444' }}>Lưu trữ chiến dịch</span>}
      open={isOpen}
      onOk={onConfirmCancel}
      onCancel={onClose}
      okText="Lưu trữ"
      cancelText="Đóng"
      okButtonProps={{ danger: true }}
    >
      <div style={{ padding: '8px 0' }}>
        <p style={{ color: '#475569', fontSize: 13 }}>
          Bạn có chắc chắn muốn lưu trữ chiến dịch <strong>{campaignTitle}</strong>? Hệ thống sẽ kiểm tra điều kiện trước khi thực hiện.
        </p>
      </div>
    </Modal>
  );
};
