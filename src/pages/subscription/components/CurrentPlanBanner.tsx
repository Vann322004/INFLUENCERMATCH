import React from 'react';
import { Row, Col, Button, Progress, Spin } from 'antd';
import { CrownOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

export interface SubInfoData {
  currentPlanName: string;
  renewalDate: string;
  startDate?: string;
  totalDays?: number;
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
  const totalDays = subInfo.totalDays || 30;
  const daysRemaining = Math.max(0, subInfo.daysRemaining);
  const daysUsed = Math.max(0, totalDays - daysRemaining);

  // Thanh tiến trình thể hiện thời lượng CÒN LẠI của chu kỳ gói:
  // Ví dụ: Còn 25 ngày trong chu kỳ 30 ngày -> thanh đầy 83.3%
  const percentRemaining = subInfo.isActive && totalDays > 0
    ? Math.max(3, Math.min(100, Math.round((daysRemaining / totalDays) * 100)))
    : 0;

  return (
    <div className="sub-current-card">
      {loading ? (
        <div className="sub-current-card-loading">
          <Spin tip="Đang tải thông tin gói dịch vụ..." />
        </div>
      ) : (
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} md={15}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {/* Icon khối gói dịch vụ */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: subInfo.isActive ? '#EFF6FF' : '#F1F5F9',
                  color: subInfo.isActive ? '#1D4ED8' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                  border: `1px solid ${subInfo.isActive ? '#DBEAFE' : '#E2E8F0'}`,
                }}
              >
                <CrownOutlined />
              </div>

              {/* Thông tin gói & Ngày gia hạn */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      background: subInfo.isActive ? '#ECFDF5' : '#F1F5F9',
                      color: subInfo.isActive ? '#047857' : '#64748B',
                      border: `1px solid ${subInfo.isActive ? '#A7F3D0' : '#E2E8F0'}`,
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: subInfo.isActive ? '#10B981' : '#94A3B8',
                        display: 'inline-block',
                      }}
                    />
                    {subInfo.isActive ? 'Gói Đang Kích Hoạt' : 'Chưa Kích Hoạt Gói'}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      padding: '3px 12px',
                      borderRadius: 999,
                      fontSize: 12.5,
                      color: '#475569',
                    }}
                  >
                    <CalendarOutlined style={{ color: '#2563EB', fontSize: 12 }} />
                    {subInfo.isActive ? (
                      <span>
                        Tự động gia hạn vào <strong style={{ color: '#0F172A' }}>{subInfo.renewalDate}</strong>
                      </span>
                    ) : (
                      'Chưa đăng ký gói dịch vụ nào'
                    )}
                  </span>
                </div>

                {/* Tiêu đề gói */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: -0.4 }}>
                    {subInfo.isActive ? `Gói ${subInfo.currentPlanName}` : 'Tài khoản chưa kích hoạt gói'}
                  </h2>
                </div>

                {/* Mô tả tính năng */}
                <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.55, maxWidth: 580 }}>
                  {subInfo.isActive
                    ? 'Bạn đang được tiếp cận đầy đủ các tính năng phân tích dữ liệu chuyên sâu, mở rộng chiến dịch và khám phá Nhà sáng tạo.'
                    : 'Bạn chưa kích hoạt gói dịch vụ nào. Hãy đăng ký gói dùng thử hoặc nâng cấp lên các gói trả phí bên dưới để kích hoạt hạn mức chiến dịch.'}
                </div>
              </div>
            </div>
          </Col>

          {/* Right Panel: Chu kỳ & Thao tác */}
          <Col xs={24} md={9} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div className="sub-cycle-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClockCircleOutlined style={{ color: '#2563EB' }} />
                  Thời hạn chu kỳ:
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: '#1D4ED8',
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    padding: '2px 10px',
                    borderRadius: 999,
                  }}
                >
                  {subInfo.isActive ? `Còn ${daysRemaining} ngày` : 'Chưa kích hoạt'}
                </span>
              </div>

              {/* Progress Bar */}
              <Progress
                percent={percentRemaining}
                strokeColor={{
                  '0%': '#2563EB',
                  '100%': '#1D4ED8',
                }}
                trailColor="#F1F5F9"
                showInfo={false}
                size="small"
                style={{ margin: '6px 0 4px 0' }}
              />

              {/* Helper text under bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B', marginBottom: 14 }}>
                <span>Đã dùng: <strong>{daysUsed}/{totalDays}</strong> ngày</span>
                {subInfo.isActive && subInfo.renewalDate && (
                  <span>
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
                    fontSize: 13,
                    boxShadow: '0 2px 4px rgba(29, 78, 216, 0.2)',
                  }}
                  onClick={onGoToPlans}
                >
                  {subInfo.isActive ? 'Nâng cấp gói' : 'Đăng ký ngay'}
                </Button>
                <Button
                  style={{
                    borderRadius: 8,
                    height: 36,
                    fontSize: 13,
                    color: '#334155',
                    borderColor: '#CBD5E1',
                    background: '#FFFFFF',
                    fontWeight: 600,
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
