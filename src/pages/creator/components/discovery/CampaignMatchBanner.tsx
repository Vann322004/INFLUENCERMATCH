import React from 'react';
import { Button, Select } from 'antd';
import { RobotOutlined, CompassOutlined } from '@ant-design/icons';
import type { BrandCampaignItem } from './types';

interface CampaignMatchBannerProps {
  matchedCampaign: BrandCampaignItem | null;
  filteredCount: number;
  campaignsList: BrandCampaignItem[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
  onClearMatch?: () => void;
}

export const CampaignMatchBanner: React.FC<CampaignMatchBannerProps> = ({
  matchedCampaign,
  filteredCount,
  campaignsList,
  selectedCampaignId,
  onSelectCampaign,
  onClearMatch,
}) => {
  if (matchedCampaign) {
    return (
      <section className="cdiscovery-campaign-summary">
        <div className="cdiscovery-campaign-summary-icon"><RobotOutlined /></div>
        <div className="cdiscovery-campaign-summary-copy">
          <span className="cdiscovery-campaign-eyebrow">GỢI Ý CREATOR · BƯỚC 2</span>
          <h2>{matchedCampaign.name}</h2>
          <p>Cần tuyển <strong>{matchedCampaign.targetCreatorCount || 1} Creator</strong>
            <span className="cdiscovery-summary-dot">·</span>
            Top 50 gợi ý ({filteredCount} hồ sơ hiện có). Chọn Creator phù hợp để đưa vào shortlist.</p>
        </div>
        <div className="cdiscovery-campaign-summary-actions">
          {campaignsList.length > 1 && <Select aria-label="Đổi chiến dịch" style={{ width: 200 }}
            value={selectedCampaignId || undefined} onChange={onSelectCampaign}
            options={campaignsList.map(c => ({ value: c.id, label: c.name }))} />}
          {onClearMatch && <Button onClick={onClearMatch}>Bỏ chọn chiến dịch</Button>}
        </div>
      </section>
    );
  }

  return (
    <div
      style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '12px 18px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CompassOutlined style={{ fontSize: 18, color: '#6366F1' }} />
        <div style={{ fontSize: 13, color: '#475569' }}>
          <strong>Gợi ý thông minh theo Chiến dịch:</strong> Vui lòng chọn chiến dịch mục tiêu để AI xếp hạng Top KOC phù hợp nhất.
        </div>
      </div>
      {campaignsList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Chiến dịch mục tiêu:</span>
          <Select
            placeholder="Chọn chiến dịch..."
            style={{ width: 230 }}
            value={selectedCampaignId || undefined}
            onChange={onSelectCampaign}
            options={campaignsList.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      )}
    </div>
  );
};

export default CampaignMatchBanner;

