import React, { useState } from 'react';
import { Switch, Modal, Tooltip, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { SubscriptionPlan, PlanStatus } from '../../../../mock/adminData';

interface Props {
  plan: SubscriptionPlan;
  onStatusChange: (planId: string, newStatus: PlanStatus) => void;
}

export default function ActivateStopToggle({ plan, onStatusChange }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = plan.status === 'active';

  const handleToggle = (checked: boolean) => {
    if (!checked && plan.activeUsers > 0) {
      // Opening warning modal if users are currently subscribed
      setConfirmOpen(true);
    } else {
      const next: PlanStatus = checked ? 'active' : 'inactive';
      onStatusChange(plan.id, next);
      message.success(`Gói ${plan.name} đã chuyển sang ${checked ? 'Hoạt động' : 'Tạm dừng'}`);
    }
  };

  const handleConfirmStop = () => {
    onStatusChange(plan.id, 'inactive');
    setConfirmOpen(false);
    message.warning(`Đã tạm dừng gói ${plan.name}. Người dùng hiện tại vẫn giữ quyền lợi đến hết chu kỳ.`);
  };

  return (
    <>
      <Tooltip title={isActive ? 'Tạm dừng cung cấp gói' : 'Kích hoạt mở bán gói'}>
        <Switch
          checked={isActive}
          onChange={handleToggle}
          style={{ background: isActive ? '#6366F1' : undefined }}
        />
      </Tooltip>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D97706' }}>
            <ExclamationCircleOutlined />
            <span>Xác nhận tạm dừng gói "{plan.name}"</span>
          </div>
        }
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleConfirmStop}
        okText="Vẫn tạm dừng"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        <p style={{ marginTop: 12, color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
          Hiện có <strong>{plan.activeUsers} khách hàng</strong> đang sử dụng gói dịch vụ này.
          Khi tạm dừng, người dùng mới sẽ không thể đăng ký gói này nữa, nhưng người dùng hiện tại sẽ không bị ngắt quãng quyền lợi.
        </p>
      </Modal>
    </>
  );
}
