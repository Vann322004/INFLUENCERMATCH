import React from 'react';
import { Row, Col, Button, Tag, Tooltip, Spin } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { SubscriptionPlan } from '../../../data/mockData';

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
      <Row gutter={[20, 20]} align="stretch" justify="center">
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
              <Tag color="#6366F1" style={{ borderRadius: 999, fontWeight: 700, margin: 0 }}>
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
            <Col xs={24} sm={12} lg={plans.length >= 4 ? 6 : plans.length === 3 ? 8 : 12} key={plan.id}>
              <div className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.badge && <div className="popular-badge">{plan.badge}</div>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {plan.name}
                  </h3>
                  {statusTag}
                </div>

                <p style={{ color: '#64748B', fontSize: 12.5, minHeight: 38, marginTop: 6, lineHeight: 1.4 }}>
                  {plan.subtitle}
                </p>

                <div className="price-wrapper">
                  <span className="price-amount">
                    {plan.priceMonthly.toLocaleString('vi-VN')}
                    <span className="price-currency">₫</span>
                  </span>
                  <span className="price-cycle">
                    {plan.priceMonthly <= 0 ? '(Miễn phí)' : '/ chu kỳ'}
                  </span>
                </div>

                <Tooltip title={buttonTooltip}>
                  <div>
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
                              ? '#6366F1'
                              : '#FFFFFF',
                        borderColor: buttonDisabled
                          ? '#E2E8F0'
                          : isTrial && !buttonDisabled
                            ? '#059669'
                            : plan.popular
                              ? '#6366F1'
                              : '#CBD5E1',
                        color: buttonDisabled
                          ? '#94A3B8'
                          : isTrial || plan.popular
                            ? '#FFFFFF'
                            : '#1E293B',
                        marginBottom: 20,
                      }}
                    >
                      {buttonText}
                    </Button>
                  </div>
                </Tooltip>

                <div style={{ borderTop: '1px solid #EEF0F6', paddingTop: 16, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Tính năng bao gồm:
                  </div>
                  {plan.features.map((feat, idx) => (
                    <div className="feature-row" key={idx}>
                      {feat.included ? (
                        <CheckCircleFilled
                          style={{
                            color: feat.highlight ? '#6366F1' : '#10B981',
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
                          color: feat.included ? (feat.highlight ? '#4338CA' : '#334155') : '#94A3B8',
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
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
