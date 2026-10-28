import React from 'react';
import { Modal, Input } from 'antd';

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
  cancelReason,
  setCancelReason,
  onConfirmCancel,
  onClose,
}) => {
  return (
    <Modal
      title={<span style={{ fontWeight: 700, color: '#EF4444' }}>Xác nhận hủy chiến dịch</span>}
      open={isOpen}
      onOk={onConfirmCancel}
      onCancel={onClose}
      okText="Xác nhận hủy"
      cancelText="Đóng"
      okButtonProps={{ danger: true }}
    >
      <div style={{ padding: '8px 0' }}>
        <p style={{ color: '#475569', fontSize: 13 }}>
          Bạn có chắc chắn muốn hủy chiến dịch <strong>{campaignTitle}</strong>? Thao tác này sẽ đóng băng mọi hoạt động hợp tác và lưu trữ chiến dịch.
        </p>
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: 4 }}>
            Lý do hủy chiến dịch:
          </span>
          <Input.TextArea
            rows={3}
            placeholder="Nhập lý do hủy chiến dịch..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};
