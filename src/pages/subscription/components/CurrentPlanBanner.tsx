import React from 'react';
import { Row, Col, Button, Progress, Spin } from 'antd';
import { CrownOutlined, CalendarOutlined } from '@ant-design/icons';

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
  const percentElapsed = subInfo.isActive
    ? Math.max(5, Math.min(100, Math.round(((30 - Math.min(30, Math.max(0, subInfo.daysRemaining))) / 30) * 100)))
    : 0;

  return (
    <div className="sub-current-card">
      {loading ? (
        <div className="sub-current-card-loading">
          <Spin size="default" tip="Đang tải thông tin gói dịch vụ..." />
        </div>
      ) : (
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} md={15}>
            {/* Meta Tags Row */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  background: subInfo.isActive ? '#ECFDF5' : '#F1F5F9',
                  color: subInfo.isActive ? '#047857' : '#64748B',
                  border: `1px solid ${subInfo.isActive ? '#A7F3D0' : '#E2E8F0'}`,
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CrownOutlined style={{ color: subInfo.isActive ? '#059669' : '#94A3B8' }} />
                {subInfo.isActive ? 'Gói Đang Kích Hoạt' : 'Chưa Kích Hoạt Gói'}
              </span>

              {/* Ngày gia hạn rõ ràng */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12.5,
                  color: '#475569',
                }}
              >
                <CalendarOutlined style={{ color: '#2563EB' }} />
                {subInfo.isActive ? (
                  <span>
                    Tự động gia hạn vào <strong style={{ color: '#0F172A' }}>{subInfo.renewalDate}</strong>
                  </span>
                ) : (
                  <strong style={{ color: '#64748B' }}>Chưa đăng ký gói dịch vụ</strong>
                )}
              </span>
            </div>

            {/* Plan Title */}
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3, marginBottom: 6 }}>
              {subInfo.isActive ? `Gói ${subInfo.currentPlanName}` : 'Tài khoản chưa kích hoạt gói'}
            </div>

            {/* Subtitle */}
            <div style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, maxWidth: 580 }}>
              {subInfo.isActive
                ? 'Bạn đang được tiếp cận đầy đủ các tính năng phân tích dữ liệu chuyên sâu, mở rộng chiến dịch và khám phá Nhà sáng tạo không giới hạn.'
                : 'Bạn chưa kích hoạt gói dịch vụ nào. Hãy đăng ký gói dùng thử hoặc nâng cấp lên các gói trả phí bên dưới để kích hoạt hạn mức chiến dịch và tìm kiếm Nhà sáng tạo.'}
            </div>
          </Col>

          {/* Right Panel: Chu kỳ & Thao tác */}
          <Col xs={24} md={9} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div className="sub-cycle-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Thời hạn chu kỳ:</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13.5,
                    color: subInfo.isActive ? (subInfo.daysRemaining <= 5 ? '#DC2626' : '#1D4ED8') : '#64748B',
                    background: subInfo.isActive ? (subInfo.daysRemaining <= 5 ? '#FEF2F2' : '#EFF6FF') : '#F1F5F9',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {subInfo.isActive ? `Còn ${subInfo.daysRemaining} ngày` : 'Chưa kích hoạt'}
                </span>
              </div>

              <Progress
                percent={percentElapsed}
                strokeColor="#2563EB"
                trailColor="#E2E8F0"
                showInfo={false}
                size="small"
                style={{ margin: '6px 0 4px 0' }}
              />

              {/* Sub-label hiển thị ngày hết hạn chu kỳ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94A3B8', marginBottom: 14 }}>
                <span>Chu kỳ 30 ngày</span>
                {subInfo.isActive && subInfo.renewalDate && (
                  <span style={{ color: '#64748B' }}>
                    Hết hạn: <strong style={{ color: '#0F172A' }}>{subInfo.renewalDate}</strong>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  style={{
                    flex: 1,
                    background: '#1D4ED8',
                    fontWeight: 600,
                    borderRadius: 8,
                    height: 36,
                    boxShadow: 'none',
                  }}
                  onClick={onGoToPlans}
                >
                  {subInfo.isActive ? 'Nâng cấp gói' : 'Đăng ký ngay'}
                </Button>
                <Button
                  style={{
                    background: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    color: '#334155',
                    fontWeight: 600,
                    borderRadius: 8,
                    height: 36,
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
