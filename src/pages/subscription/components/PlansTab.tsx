import React from 'react';
import { Button, Tag, Tooltip, Spin } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { SubscriptionPlan } from '../../../types/api/subscription.types';

interface PlansTabProps {
  plans: SubscriptionPlan[];
  loading: boolean;
  hasUsedTrial: boolean;
  isPaidSubscriber: boolean;
  currentPlanName: string;
  onUpgrade: (plan: SubscriptionPlan) => void;
}

export default function PlansTab({
  plans,
  loading,
  hasUsedTrial,
  isPaidSubscriber,
  currentPlanName,
  onUpgrade,
}: PlansTabProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Đang tải danh sách gói dịch vụ..." />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
        Chưa có dữ liệu gói dịch vụ.
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.isCurrent);
  const currentPlanPrice = currentPlan ? currentPlan.priceMonthly : 0;

  return (
    <div style={{ marginTop: 16 }}>
      <div className="subscription-catalog-grid">
        {plans.map((plan) => {
          const isCurrent = plan.isCurrent;
          const isFree = plan.name === 'FREE';
          const isTrial = plan.name === 'TRIAL';
          const isDowngrade = !isCurrent && currentPlanPrice > 0 && plan.priceMonthly < currentPlanPrice;
          const isTrialExpiredOrUsed = isTrial && hasUsedTrial && !isCurrent;

          let buttonDisabled = false;
          let buttonText = `Nâng cấp lên ${plan.name}`;
          let buttonTooltip = '';
          let statusTag = null;

          if (isCurrent) {
            buttonDisabled = true;
            buttonText = 'Gói hiện tại của bạn';
            statusTag = (
              <Tag color="#2563EB" style={{ borderRadius: 999, fontWeight: 700, margin: 0 }}>
                {isTrial ? 'Đang dùng thử' : 'Đang dùng'}
              </Tag>
            );
          } else if ((isFree || isTrial) && isPaidSubscriber) {
            buttonDisabled = true;
            buttonText = 'Không thể hạ cấp';
            buttonTooltip = `Bạn đang sử dụng gói ${currentPlanName}. Không thể chuyển về gói cơ bản/dùng thử.`;
            statusTag = (
              <Tag color="default" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                Không khả dụng
              </Tag>
            );
          } else if (isTrialExpiredOrUsed) {
            buttonDisabled = true;
            buttonText = 'Đã hết lượt dùng thử (Chỉ 1 lần)';
            buttonTooltip = 'Mỗi tài khoản Brand chỉ được đăng ký gói dùng thử 1 lần duy nhất.';
            statusTag = (
              <Tag color="default" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                Đã sử dụng
              </Tag>
            );
          } else if (isDowngrade) {
            buttonDisabled = true;
            buttonText = 'Gói cấp thấp hơn';
            buttonTooltip = `Gói này thấp hơn gói hiện tại của bạn (${currentPlanName}).`;
            statusTag = (
              <Tag color="default" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                Không khả dụng
              </Tag>
            );
          } else if (isTrial) {
            buttonDisabled = false;
            buttonText = 'Kích hoạt Dùng thử (7 ngày)';
            statusTag = (
              <Tag color="cyan" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                Dùng thử 7 ngày
              </Tag>
            );
          } else if (isFree) {
            buttonDisabled = true;
            buttonText = 'Gói cơ bản mặc định';
          } else {
            buttonDisabled = false;
            buttonText = `Nâng cấp lên ${plan.name}`;
          }

          return (
            <div className="subscription-catalog-item" key={plan.id}>
              <div className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.badge && <div className="popular-badge">{plan.badge}</div>}

                <div className="pricing-card-header">
                  <h3 className="pricing-plan-title">
                    {plan.name}
                  </h3>
                  <div className="pricing-tag-wrapper">
                    {statusTag}
                  </div>
                </div>

                <div className="pricing-subtitle-wrapper">
                  <p className="pricing-subtitle-text">
                    {plan.subtitle}
                  </p>
                </div>

                <div className="price-wrapper">
                  <span className="price-amount">
                    {plan.priceMonthly.toLocaleString('vi-VN')}
                    <span className="price-currency">₫</span>
                  </span>
                  <span className="price-cycle">
                    {plan.priceMonthly <= 0 ? '(Miễn phí)' : '/ chu kỳ'}
                  </span>
                </div>

                <div className="pricing-action-wrapper">
                  <Tooltip title={buttonTooltip}>
                    <div style={{ width: '100%' }}>
                      <Button
                        type={isCurrent ? 'default' : (plan.popular || isTrial) && !buttonDisabled ? 'primary' : 'default'}
                        size="large"
                        block
                        disabled={buttonDisabled}
                        onClick={() => onUpgrade(plan)}
                        style={{
                          height: 42,
                          borderRadius: 10,
                          fontWeight: 700,
                          background: buttonDisabled
                            ? '#F1F5F9'
                            : isTrial && !buttonDisabled
                              ? '#059669'
                              : plan.popular
                                ? '#2563EB'
                                : '#FFFFFF',
                          borderColor: buttonDisabled
                            ? '#E2E8F0'
                            : isTrial && !buttonDisabled
                              ? '#059669'
                              : plan.popular
                                ? '#2563EB'
                                : '#CBD5E1',
                          color: buttonDisabled
                            ? '#94A3B8'
                            : isTrial || plan.popular
                              ? '#FFFFFF'
                              : '#1E293B',
                        }}
                      >
                        {buttonText}
                      </Button>
                    </div>
                  </Tooltip>
                </div>

                <div className="pricing-features-section">
                  <div className="pricing-features-heading">
                    Tính năng bao gồm:
                  </div>
                  <div className="pricing-features-list">
                    {plan.features.map((feat, idx) => (
                      <div className="feature-row" key={idx}>
                        {feat.included ? (
                          <CheckCircleFilled
                            style={{
                              color: feat.highlight ? '#2563EB' : '#10B981',
                              fontSize: 15,
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <CloseCircleFilled
                            style={{ color: '#CBD5E1', fontSize: 15, marginTop: 2, flexShrink: 0 }}
                          />
                        )}
                        <span
                          style={{
                            color: feat.included ? (feat.highlight ? '#1E40AF' : '#334155') : '#94A3B8',
                            fontWeight: feat.highlight ? 700 : 400,
                            textDecoration: feat.included ? 'none' : 'line-through',
                          }}
                        >
                          {feat.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
