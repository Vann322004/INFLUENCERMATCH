import React, { useState } from 'react';
import { Switch, Modal, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { PlanResponse } from '../../../../types/api/subscription.types';

interface Props {
  plan: PlanResponse;
  onStatusChange: (planId: string, newStatus: 'ACTIVE' | 'INACTIVE') => void;
  loading?: boolean;
}

export default function ActivateStopToggle({ plan, onStatusChange, loading = false }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = plan.status === 'ACTIVE';

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      // Khi tạm dừng gói, hiển thị modal xác nhận tiếng Việt
      setConfirmOpen(true);
    } else {
      onStatusChange(plan.id, 'ACTIVE');
    }
  };

  const handleConfirmStop = () => {
    onStatusChange(plan.id, 'INACTIVE');
    setConfirmOpen(false);
  };

  return (
    <>
      <Tooltip title={isActive ? 'Nhấn để tạm dừng mở bán gói này' : 'Nhấn để kích hoạt mở bán gói này'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            checked={isActive}
            loading={loading}
            onChange={handleToggle}
            style={{ background: isActive ? '#10B981' : undefined }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#059669' : '#64748B' }}>
            {isActive ? 'Đang mở bán' : 'Tạm dừng'}
          </span>
        </div>
      </Tooltip>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D97706', fontSize: 16 }}>
            <ExclamationCircleOutlined />
            <span>Xác nhận tạm dừng gói "{plan.planName}"</span>
          </div>
        }
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleConfirmStop}
        okText="Tạm dừng gói"
        okButtonProps={{ danger: true }}
        cancelText="Hủy bỏ"
      >
        <p style={{ marginTop: 12, color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
          Khi tạm dừng, nhãn hàng mới sẽ không thể nhìn thấy hoặc đăng ký gói dịch vụ này nữa.
          Các tài khoản đã đăng ký trước đó vẫn duy trì quyền lợi cho đến hết thời hạn chu kỳ.
        </p>
      </Modal>
    </>
  );
}
