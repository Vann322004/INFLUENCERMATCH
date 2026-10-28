import React from 'react';
import type { CampaignResponse } from '../../../../types/api/campaign.types';

interface CampaignGuidelinesTabProps {
  rawCampaign: CampaignResponse | null;
}

export const CampaignGuidelinesTab: React.FC<CampaignGuidelinesTabProps> = ({ rawCampaign }) => {
  return (
    <div className="cdetail-card-modern">
      <div className="cdetail-card-header">
        <span className="cdetail-card-title">
          Hồ sơ yêu cầu & Hướng dẫn sáng tạo (Brief)
        </span>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>Quy định gắn hashtag bắt buộc</div>
          <div style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, marginTop: 4 }}>
            {rawCampaign?.name
              ? `#${rawCampaign.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '')} #InfluencerMatch #Campaign`
              : '#InfluencerMatch #BrandCampaign #Campaign2026'}
          </div>
        </div>
        <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>Thông điệp then chốt (Key Messages)</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.6 }}>
            {rawCampaign?.description || 'Truyền tải thông điệp thương hiệu tự nhiên, chân thực và hướng đến đúng nhóm khách hàng mục tiêu.'}
          </div>
        </div>
        <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>Yêu cầu kiểm duyệt nội dung</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.6 }}>
            KOC cần gửi kịch bản trước khi quay 3 ngày và gửi video bản xem trước ít nhất 48 giờ trước thời điểm đăng tải để nhãn hàng duyệt.
          </div>
        </div>
      </div>
    </div>
  );
};
