import React from 'react';
import { Modal, Alert, Button, Divider, Space } from 'antd';
import {
  SafetyCertificateFilled,
  InfoCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  QrcodeOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { SubscriptionPlan } from '../../../data/mockData';
import { formatVND } from './HistoryTab';

interface UpgradeModalProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  paying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function UpgradeModal({
  open,
  plan,
  paying,
  onCancel,
  onConfirm,
}: UpgradeModalProps) {
  if (!plan) return null;

  const isFreeOrTrial = (plan.priceMonthly || 0) <= 0;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
          <SafetyCertificateFilled
            style={{ color: isFreeOrTrial ? '#6366F1' : '#10B981' }}
          />
          {isFreeOrTrial
            ? 'Kích hoạt Gói Dùng thử (Miễn phí 0 ₫)'
            : 'Xác nhận Nâng cấp Gói dịch vụ'}
        </div>
      }
      open={open}
      onCancel={() => !paying && onCancel()}
      footer={null}
      width={560}
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 12,
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                Gói {plan.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Chu kỳ: {plan.priceMonthly <= 0
                  ? 'Dùng thử trải nghiệm'
                  : 'Thanh toán trực tuyến theo chu kỳ gói'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#5B5BF0' }}>
                {formatVND(plan.priceMonthly)}
              </div>
            </div>
          </div>
        </div>

        {plan.priceMonthly <= 0 ? (
          <div>
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined style={{ color: '#2563EB', fontSize: 18 }} />}
              message="Chính sách dùng thử miễn phí"
              description="Mỗi tài khoản Brand chỉ được đăng ký gói dùng thử 1 lần duy nhất trong toàn bộ vòng đời tài khoản. Khi kích hoạt thành công, bạn sẽ nhận được đầy đủ hạn mức trải nghiệm của gói này."
              style={{ marginBottom: 20, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE' }}
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
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 10 }}>
              Phương thức thanh toán
            </div>
            <div
              style={{
                border: '1.5px solid #0284C7',
                borderRadius: 10,
                padding: '14px 18px',
                background: '#F0F9FF',
              }}
            >
              <Space align="center" size={14}>
                <QrcodeOutlined style={{ fontSize: 24, color: '#0284C7' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>
                    Cổng thanh toán trực tuyến VNPAY
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Hỗ trợ quét VNPAY-QR, VietQR, Thẻ ATM 40+ Ngân hàng và Thẻ quốc tế Visa/Mastercard
                  </div>
                </div>
              </Space>
            </div>
          </div>
        )}

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onCancel} disabled={paying}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            size="large"
            loading={paying}
            icon={<CheckOutlined />}
            style={{
              background:
                plan.priceMonthly <= 0
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              fontWeight: 700,
              borderRadius: 10,
              padding: '0 24px',
              border: 'none',
            }}
            onClick={onConfirm}
          >
            {plan.priceMonthly <= 0
              ? 'Kích hoạt Gói dùng thử ngay'
              : 'Thanh toán qua Cổng VNPAY'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
