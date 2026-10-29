import React from 'react';
import type { CampaignResponse } from '../../../../types/api/campaign.types';

import type { CampaignCreatorRow, CampaignDetailTabKey } from './campaignDetailTypes';
export type { CampaignCreatorRow, CampaignDetailTabKey };

const VERIFIED_CREATOR_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
];

interface CampaignMetricCardsProps {
  campaignBudgetFormatted: string;
  allocatedBudget: number;
  progressPercent: number;
  rawCampaign: CampaignResponse | null;
  participatingCreators: CampaignCreatorRow[];
  setActiveTab: (tab: CampaignDetailTabKey) => void;
}

export const CampaignMetricCards: React.FC<CampaignMetricCardsProps> = ({
  campaignBudgetFormatted,
  allocatedBudget,
  progressPercent,
  rawCampaign,
  participatingCreators,
  setActiveTab,
}) => {
  return (
    <div className="cdetail-metrics-grid">
      {/* Card 1: Ngân sách kế hoạch */}
      <div className="cdetail-metric-card" onClick={() => setActiveTab('budget')} style={{ cursor: 'pointer' }}>
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Ngân sách kế hoạch</span>
        </div>
        <div>
          <div className="cdetail-metric-value">{campaignBudgetFormatted}</div>
          <div className="cdetail-metric-progress-wrap">
            <div className="cdetail-metric-progress-bar">
              <div className="cdetail-metric-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="cdetail-metric-progress-label">{progressPercent}%</span>
          </div>
        </div>
        <div className="cdetail-metric-footer">
          <span>Đã cam kết: {allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : 'Chưa phân bổ'}</span>
        </div>
      </div>

      {/* Card 2: Lượng người theo dõi mục tiêu */}
      <div className="cdetail-metric-card">
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Người theo dõi mục tiêu</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">
            {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K+` : '50K+'}
          </div>
        </div>
        <div className="cdetail-metric-footer">
          <span>Tệp khán giả chất lượng</span>
        </div>
      </div>

      {/* Card 3: Tỷ lệ tương tác mục tiêu */}
      <div className="cdetail-metric-card">
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Tỷ lệ tương tác mục tiêu</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">4.5% – 8.0%</div>
        </div>
        <div className="cdetail-metric-footer">
          <span>Tiêu chuẩn tương tác ngành</span>
        </div>
      </div>

      {/* Card 4: Nhà sáng tạo trong quy trình */}
      <div
        className="cdetail-metric-card"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('creators')}
      >
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Nhà sáng tạo tham gia</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">
            {participatingCreators.length} KOC
          </div>
        </div>
        <div className="cdetail-metric-footer">
          {participatingCreators.length > 0 ? (
            <div className="cdetail-avatar-stack">
              {participatingCreators.slice(0, 3).map((c, i) => {
                const safeAvatar = (c.avatar && c.avatar.startsWith('http') && !c.avatar.includes('NaN'))
                  ? c.avatar
                  : VERIFIED_CREATOR_AVATARS[i % VERIFIED_CREATOR_AVATARS.length];
                return (
                  <img
                    key={c.id || i}
                    src={safeAvatar}
                    alt={c.name}
                    title={c.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                );
              })}
              {participatingCreators.length > 3 && (
                <div className="avatar-more">+{participatingCreators.length - 3}</div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: '#64748B' }}>Chưa có KOC</span>
          )}
        </div>
      </div>
    </div>
  );
};
