import React from 'react';
import type { CampaignResponse } from '../../../../types/api/campaign.types';

import type { CampaignCreatorRow, CampaignDetailTabKey } from './campaignDetailTypes';
export type { CampaignCreatorRow, CampaignDetailTabKey };


interface CampaignMetricCardsProps {
  campaignBudgetFormatted: string;
  allocatedBudget: number | null;
  progressPercent: number | null;
  rawCampaign: CampaignResponse | null;
  participatingCreators: CampaignCreatorRow[];
  confirmedCreatorCount?: number | null;
  targetCreatorCount?: number | null;
  shortlistCount?: number | null;
  isOverTarget?: boolean;
  setActiveTab: (tab: CampaignDetailTabKey) => void;
}

export const CampaignMetricCards: React.FC<CampaignMetricCardsProps> = ({
  campaignBudgetFormatted,
  allocatedBudget,
  progressPercent,
  rawCampaign,
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
              <div className="cdetail-metric-progress-fill" style={{ width: `${progressPercent ?? 0}%` }} />
            </div>
            <span className="cdetail-metric-progress-label">{progressPercent == null ? 'Chưa có dữ liệu' : `${progressPercent}%`}</span>
          </div>
        </div>
        <div className="cdetail-metric-footer">
          <span>Đã cam kết: {allocatedBudget != null ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : 'Chưa có dữ liệu'}</span>
        </div>
      </div>

      {/* Card 2: Lượng người theo dõi mục tiêu */}
      <div className="cdetail-metric-card">
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Người theo dõi tối thiểu</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">
            {rawCampaign?.followerMin != null ? rawCampaign.followerMin.toLocaleString('vi-VN') : 'Chưa thiết lập'}
          </div>
        </div>
        <div className="cdetail-metric-footer">
          <span>{rawCampaign?.followerMax != null ? `Tối đa: ${rawCampaign.followerMax.toLocaleString('vi-VN')}` : 'Chưa thiết lập mức tối đa'}</span>
        </div>
      </div>

      {/* Card 3: Kênh Shortlist & Mô hình */}
      <div className="cdetail-metric-card">
        <div className="cdetail-metric-top">
          <span className="cdetail-metric-title">Kênh trong Shortlist</span>
        </div>
        <div className="cdetail-metric-mid-row">
          <div className="cdetail-metric-value">{shortlistCount == null ? 'Chưa có dữ liệu' : `${shortlistCount} kênh`}</div>
        </div>
        <div className="cdetail-metric-footer">
          <span>{rawCampaign?.creatorMode === 'MULTI' ? 'Mô hình: Nhiều nhà sáng tạo' : rawCampaign?.creatorMode === 'SINGLE' ? 'Mô hình: Một nhà sáng tạo' : 'Chưa thiết lập mô hình'}</span>
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
            {confirmedCreatorCount ?? '—'} / {targetCreatorCount ?? '—'} Creator
          </div>
        </div>
        <div className="cdetail-metric-footer">
          {isOverTarget ? (
            <span style={{ color: '#D97706', fontWeight: 600 }}>⚠️ Vượt mục tiêu ({confirmedCreatorCount} &gt; {targetCreatorCount})</span>
          ) : (
            <span>{confirmedCreatorCount == null ? 'Chưa tải được số lượng đã chốt' : `${confirmedCreatorCount} nhà sáng tạo đã chốt`}</span>
          )}
        </div>
      </div>
    </div>
  );
};
