import React from 'react';
import { Row, Col, Button, Progress, Spin } from 'antd';
import { CrownOutlined } from '@ant-design/icons';

export interface SubInfoData {
  currentPlanName: string;
  renewalDate: string;
  daysRemaining: number;
  isActive: boolean;
  usedCampaigns: number;
  totalCampaigns: number;
  usedRefresh: number;
  totalRefresh: number;
}

interface CurrentPlanBannerProps {
  subInfo: SubInfoData;
  loading: boolean;
  onGoToPlans: () => void;
  onGoToQuota: () => void;
}

export default function CurrentPlanBanner({ subInfo, loading, onGoToPlans, onGoToQuota }: CurrentPlanBannerProps) {
  return (
    <div className="sub-current-card">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: '#FFFFFF' }}>
          <Spin size="large" tip="Đang tải thông tin gói dịch vụ..." />
        </div>
      ) : (
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={15}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <CrownOutlined style={{ color: '#FDE047' }} />{' '}
                {subInfo.isActive ? 'Gói Đang Kích Hoạt' : 'Chưa Kích Hoạt Gói'}
              </span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>
                • {subInfo.isActive ? (
                  <>Tự động gia hạn vào <strong>{subInfo.renewalDate}</strong></>
                ) : (
                  <strong>Chưa đăng ký gói dịch vụ nào</strong>
                )}
              </span>
            </div>

            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              {subInfo.isActive ? `Gói ${subInfo.currentPlanName}` : 'Tài khoản chưa kích hoạt gói'}
            </div>

            <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4, maxWidth: 560 }}>
              {subInfo.isActive
                ? 'Bạn đang được tiếp cận đầy đủ các tính năng phân tích AI thông minh, mở rộng chiến dịch và khám phá Creator không giới hạn.'
                : 'Bạn chưa kích hoạt gói dịch vụ nào. Hãy đăng ký gói Dùng thử hoặc nâng cấp lên các gói trả phí bên dưới để kích hoạt hạn mức chiến dịch và tìm kiếm Creator.'}
            </div>
          </Col>

          <Col xs={24} md={9} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                padding: '16px 20px',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                width: '100%',
                maxWidth: 320,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, opacity: 0.9 }}>Thời hạn chu kỳ:</span>
                <span style={{ fontWeight: 700, color: '#FDE047' }}>
                  {subInfo.isActive ? `Còn ${subInfo.daysRemaining} ngày` : 'Chưa kích hoạt'}
                </span>
              </div>
              <Progress
                percent={
                  subInfo.isActive
                    ? Math.max(5, Math.min(100, Math.round(((30 - subInfo.daysRemaining) / 30) * 100)))
                    : 0
                }
                strokeColor="#FDE047"
                railColor="rgba(255, 255, 255, 0.25)"
                showInfo={false}
                size="small"
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button
                  size="middle"
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    color: '#4338CA',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 8,
                  }}
                  onClick={onGoToPlans}
                >
                  {subInfo.isActive ? 'Nâng cấp gói' : 'Đăng ký gói ngay'}
                </Button>
                <Button
                  size="middle"
                  ghost
                  style={{
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: '#FFFFFF',
                    borderRadius: 8,
                  }}
                  onClick={onGoToQuota}
                >
                  Xem Quota
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
}
