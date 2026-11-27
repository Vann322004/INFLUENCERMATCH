import React from 'react';
import { Select, Tag } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import CampaignImage from '../../../../components/common/CampaignImage';
import type { BrandCampaignItem } from './types';

const platformLabels: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
  x: 'X',
};

interface CampaignMatchBannerProps {
  matchedCampaign: BrandCampaignItem | null;
  campaignsList: BrandCampaignItem[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
}

export const CampaignMatchBanner: React.FC<CampaignMatchBannerProps> = ({
  matchedCampaign,
  campaignsList,
  selectedCampaignId,
  onSelectCampaign,
}) => {
  if (matchedCampaign) {
    return (
      <section className="cdiscovery-campaign-summary">
        <div className="cdiscovery-campaign-summary-main">
          <CampaignImage src={matchedCampaign.imageUrl} className="cdiscovery-campaign-thumb" />
          <div className="cdiscovery-campaign-summary-copy">
            <div className="cdiscovery-campaign-eyebrow-row">
              <span className="cdiscovery-campaign-eyebrow">CHIẾN DỊCH ĐANG KHÁM PHÁ</span>
              {(matchedCampaign.channels ?? []).map((ch) => (
                <Tag key={ch} className="cdiscovery-campaign-chip">{platformLabels[ch] || ch}</Tag>
              ))}
              {matchedCampaign.tag && <Tag className="cdiscovery-campaign-chip is-muted">{matchedCampaign.tag}</Tag>}
            </div>
            <h2>{matchedCampaign.name}</h2>
            <p>{matchedCampaign.targetCreatorCount != null ? `Mục tiêu: ${matchedCampaign.targetCreatorCount} nhà sáng tạo. ` : ''}Khám phá và lưu kênh vào danh sách của chiến dịch này.</p>
          </div>
        </div>
        {campaignsList.length > 1 && (
          <div className="cdiscovery-campaign-switcher">
            <span>Đổi chiến dịch</span>
            <Select
              value={selectedCampaignId || undefined}
              onChange={onSelectCampaign}
              style={{ width: 230 }}
              options={campaignsList.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        )}
      </section>
    );
  }

  if (selectedCampaignId) return null;

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
        <CompassOutlined style={{ fontSize: 18, color: '#7C3AED' }} />
        <div style={{ fontSize: 13, color: '#475569' }}>
          Chọn chiến dịch để khám phá và lưu các kênh phù hợp với yêu cầu.
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

