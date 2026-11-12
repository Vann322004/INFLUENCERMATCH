import React from 'react';
import { Button, Tag, Select } from 'antd';
import { RobotOutlined, CompassOutlined } from '@ant-design/icons';
import type { BrandCampaignItem } from './types';

interface CampaignMatchBannerProps {
  matchedCampaign: BrandCampaignItem | null;
  filteredCount: number;
  campaignsList: BrandCampaignItem[];
  selectedCampaignId: string | null;
  onClearMatch: () => void;
  onSelectCampaign: (campaignId: string) => void;
}

export const CampaignMatchBanner: React.FC<CampaignMatchBannerProps> = ({
  matchedCampaign,
  filteredCount,
  campaignsList,
  selectedCampaignId,
  onClearMatch,
  onSelectCampaign,
}) => {
  if (matchedCampaign) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
          border: '1.5px solid #C7D2FE',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#4F46E5',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <RobotOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Đang gợi ý KOC cho chiến dịch: <strong>{matchedCampaign.name}</strong></span>
              <Tag color="purple" style={{ borderRadius: 12, fontWeight: 700, margin: 0 }}>Đề xuất AI</Tag>
            </div>
            <div style={{ fontSize: 12.5, color: '#4338CA', marginTop: 2 }}>
              AI đã chọn lọc <strong>Top {filteredCount} KOC phù hợp nhất</strong> với ngành hàng & mục tiêu. Bấm <strong>"+ Lưu vào danh sách"</strong> để đưa KOC vào bước 3 (Danh sách chọn).
            </div>
          </div>
        </div>
        <Button
          size="small"
          onClick={onClearMatch}
          style={{ borderRadius: 8, fontWeight: 600, borderColor: '#A5B4FC', color: '#4338CA' }}
        >
          ✕ Thoát gợi ý (Xem toàn bộ KOC)
        </Button>
      </div>
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
          <strong>Chế độ Khám phá tự do:</strong> Đang hiển thị toàn bộ <strong>{filteredCount.toLocaleString('vi-VN')} KOC</strong> hệ thống. Bạn có thể chọn một chiến dịch để AI tự động lọc Top KOC tương thích nhất.
        </div>
      </div>
      {campaignsList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>Gợi ý theo chiến dịch:</span>
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

