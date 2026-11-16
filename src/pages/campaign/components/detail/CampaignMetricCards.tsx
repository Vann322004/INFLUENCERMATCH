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
  confirmedCreatorCount?: number;
  targetCreatorCount?: number;
  shortlistCount?: number;
  isOverTarget?: boolean;
  setActiveTab: (tab: CampaignDetailTabKey) => void;
}

export const CampaignMetricCards: React.FC<CampaignMetricCardsProps> = ({
  campaignBudgetFormatted,
  allocatedBudget,
  progressPercent,
  rawCampaign,
  participatingCreators,
  confirmedCreatorCount = 0,
  targetCreatorCount = 1,
  shortlistCount = 0,
  isOverTarget = false,
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
          <span className="cdetail-metric-title">Người theo dõi tối thiểu</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">
            {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K+` : 'Chưa thiết lập'}
          </div>
        </div>
        <div className="cdetail-metric-footer">
          <span>{rawCampaign?.followerMax ? `Tối đa: ${(rawCampaign.followerMax / 1000).toFixed(0)}K` : 'Không giới hạn trần'}</span>
        </div>
      </div>

      {/* Card 3: Kênh Shortlist & Mô hình */}
      <div className="cdetail-metric-card">
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Kênh trong Shortlist</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">{shortlistCount} kênh</div>
        </div>
        <div className="cdetail-metric-footer">
          <span>{rawCampaign?.creatorMode === 'MULTI' ? 'Mô hình: Đa Creator (MULTI)' : 'Mô hình: Đơn Creator (SINGLE)'}</span>
        </div>
      </div>

      {/* Card 4: Creator đã chốt / Mục tiêu */}
      <div
        className="cdetail-metric-card"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('creators')}
      >
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Creator đã chốt / Mục tiêu</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">
            {confirmedCreatorCount} / {targetCreatorCount} Creator
          </div>
        </div>
        <div className="cdetail-metric-footer">
          {isOverTarget ? (
            <span style={{ color: '#D97706', fontWeight: 600 }}>⚠️ Vượt mục tiêu ({confirmedCreatorCount} &gt; {targetCreatorCount})</span>
          ) : (
            <span>{participatingCreators.length} hợp tác đã xác nhận</span>
          )}
        </div>
      </div>
    </div>
  );
};
