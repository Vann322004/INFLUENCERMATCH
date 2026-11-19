import React from 'react';
import { Button, Progress, Spin } from 'antd';

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
  const totalDays = Math.max(1, subInfo.totalDays || 30);
  const daysRemaining = Math.max(0, subInfo.daysRemaining);
  const daysUsed = Math.max(0, Math.min(totalDays, totalDays - daysRemaining));
  const percentUsed = subInfo.isActive ? Math.round((daysUsed / totalDays) * 100) : 0;

  return (
    <section className="sub-current-card" aria-label="Gói dịch vụ hiện tại">
      {loading ? (
        <div className="sub-current-card-loading"><Spin tip="Đang tải thông tin gói dịch vụ..." /></div>
      ) : (
        <div className="sub-plan-overview">
          <div className="sub-plan-summary">
            <div className="sub-plan-eyebrow">GÓI HIỆN TẠI</div>
            <div className="sub-plan-heading">
              <h2>{subInfo.isActive ? `Gói ${subInfo.currentPlanName}` : 'Chưa đăng ký gói'}</h2>
              <span className={`sub-plan-status${subInfo.isActive ? ' is-active' : ''}`}>
                <span aria-hidden="true" />
                {subInfo.isActive ? 'Đang sử dụng' : 'Chưa kích hoạt'}
              </span>
            </div>
            <p className="sub-plan-description">
              {subInfo.isActive
                ? 'Quản lý chiến dịch, khám phá nhà sáng tạo và theo dõi hạn mức của bạn.'
                : 'Chọn gói dịch vụ phù hợp để bắt đầu sử dụng các tính năng của InfluencerMatch.'}
            </p>
            <div className="sub-plan-actions">
              <Button type="primary" onClick={onGoToPlans}>
                {subInfo.isActive ? 'Nâng cấp gói' : 'Xem các gói dịch vụ'}
              </Button>
              <Button type="text" onClick={onGoToQuota}>Xem hạn mức <span aria-hidden="true">→</span></Button>
            </div>
          </div>
          <div className="sub-plan-cycle">
            <div className="sub-plan-cycle-heading">
              <span>Chu kỳ sử dụng</span>
              <strong>{subInfo.isActive ? `Còn ${daysRemaining} ngày` : 'Chưa bắt đầu'}</strong>
            </div>
            {subInfo.isActive ? (
              <>
                <Progress percent={percentUsed} strokeColor="#64748B" trailColor="#EDF0F3" showInfo={false} size="small" />
                <div className="sub-plan-cycle-meta">
                  <span>Đã dùng {daysUsed}/{totalDays} ngày</span>
                  {subInfo.renewalDate && <span>Hết hạn <strong>{subInfo.renewalDate}</strong></span>}
                </div>
              </>
            ) : (
              <p className="sub-plan-cycle-empty">Thời hạn sử dụng sẽ hiển thị sau khi kích hoạt gói.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
