import React, { useState } from 'react';
import { Modal, Alert, Button, Divider, Space, Radio } from 'antd';
import {
  SafetyCertificateFilled,
  InfoCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CheckOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import type { SubscriptionPlan } from '../../../types/api/subscription.types';
import { formatVND } from './HistoryTab';

interface SubscriptionPlanModalProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  paying: boolean;
  onCancel: () => void;
  onConfirm: (gateway: 'VNPAY' | 'PAYOS') => void;
}

export default function SubscriptionPlanModal({
  open,
  plan,
  paying,
  onCancel,
  onConfirm,
}: SubscriptionPlanModalProps) {
  const [gateway, setGateway] = useState<'VNPAY' | 'PAYOS'>('VNPAY');
  const gatewayLabel = gateway === 'VNPAY' ? 'VNPAY' : 'PayOS';
  if (!plan) return null;

  const isFreeOrTrial = (plan.priceMonthly || 0) <= 0;

  return (
    <Modal
      className="subscription-plan-modal"
      title={
        <div className="subscription-plan-modal__title">
          <SafetyCertificateFilled
            className={`subscription-plan-modal__title-icon${isFreeOrTrial ? ' is-trial' : ''}`}
          />
          {isFreeOrTrial
            ? 'Kích hoạt gói dùng thử'
            : 'Xác nhận nâng cấp gói'}
        </div>
      }
      open={open}
      onCancel={() => !paying && onCancel()}
      footer={null}
      width={560}
      destroyOnClose
    >
      <div className="subscription-plan-modal__body">
        <div className="subscription-plan-modal__summary">
          <div className="subscription-plan-modal__details">
            <div className="subscription-plan-modal__name">Gói {plan.name}</div>
            <div className="subscription-plan-modal__cycle">
              Chu kỳ: {plan.priceMonthly <= 0
                ? 'Dùng thử trải nghiệm'
                : 'Thanh toán trực tuyến theo chu kỳ gói'}
            </div>
          </div>
          <div className="subscription-plan-modal__price">
            {formatVND(plan.priceMonthly)}
          </div>
        </div>

        {plan.priceMonthly <= 0 ? (
          <div>
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined style={{ color: '#7C3AED', fontSize: 18 }} />}
              message="Chính sách dùng thử miễn phí"
              description="Mỗi tài khoản Brand chỉ được đăng ký gói dùng thử 1 lần duy nhất trong toàn bộ vòng đời tài khoản. Khi kích hoạt thành công, bạn sẽ nhận được đầy đủ hạn mức trải nghiệm của gói này."
              style={{ marginBottom: 20, borderRadius: 10, background: '#F3E8FF', border: '1px solid #DDD6FE' }}
            />

            <div
              style={{
                background: '#FAFAFA',
                borderRadius: 10,
                padding: '14px 18px',
                border: '1px solid #F1F5F9',
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 10 }}>
                Tính năng bao gồm trong gói:
              </div>
              {plan.features.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: feat.included ? '#334155' : '#94A3B8',
                    marginBottom: 6,
                  }}
                >
                  {feat.included ? (
                    <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />
                  ) : (
                    <CloseCircleFilled style={{ color: '#CBD5E1', fontSize: 14 }} />
                  )}
                  <span style={{ textDecoration: feat.included ? 'none' : 'line-through' }}>
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="subscription-plan-modal__payment-section">
            <div className="subscription-plan-modal__section-heading">
              Phương thức thanh toán
            </div>
            <Radio.Group
              className="subscription-plan-modal__methods"
              value={gateway}
              onChange={event => setGateway(event.target.value)}
              disabled={paying}
              aria-label="Phương thức thanh toán"
            >
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                {(['VNPAY', 'PAYOS'] as const).map(method => (
                  <div
                    key={method}
                    className={`subscription-plan-modal__method${gateway === method ? ' is-selected' : ''}`}
                  >
                    <Radio value={method}>
                      <span className="subscription-plan-modal__method-icon">
                        {method === 'VNPAY' ? <CreditCardOutlined /> : <QrcodeOutlined />}
                      </span>
                      <span className="subscription-plan-modal__method-copy">
                        <span className="subscription-plan-modal__method-name">
                          {method === 'VNPAY' ? 'VNPAY' : 'PayOS'}
                        </span>
                        <span className="subscription-plan-modal__method-description">
                          {method === 'VNPAY'
                            ? 'Thanh toán trực tuyến qua cổng VNPAY'
                            : 'Quét mã QR bằng ứng dụng ngân hàng'}
                        </span>
                      </span>
                    </Radio>
                  </div>
                ))}
              </Space>
            </Radio.Group>
            {gateway === 'PAYOS' && (
              <Alert
                className="subscription-plan-modal__payos-warning"
                type="warning"
                showIcon
                message="PayOS sẽ trừ tiền thật"
                description={`Khi bạn xác nhận thanh toán trên PayOS hoặc ứng dụng ngân hàng, ${formatVND(plan.priceMonthly)} sẽ được trừ từ tài khoản của bạn. Vui lòng kiểm tra kỹ gói dịch vụ và số tiền trước khi xác nhận.`}
              />
            )}
          </div>
        )}

        <Divider className="subscription-plan-modal__divider" />

        <div className="subscription-plan-modal__actions">
          <Button className="subscription-plan-modal__cancel" onClick={onCancel} disabled={paying}>
            Hủy bỏ
          </Button>
          <Button
            className={`subscription-plan-modal__confirm${plan.priceMonthly <= 0 ? ' is-trial' : ''}`}
            type="primary"
            size="large"
            loading={paying}
            icon={<CheckOutlined />}
            onClick={() => onConfirm(gateway)}
          >
            {plan.priceMonthly <= 0
              ? 'Kích hoạt Gói dùng thử ngay'
              : `Thanh toán với ${gatewayLabel}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
