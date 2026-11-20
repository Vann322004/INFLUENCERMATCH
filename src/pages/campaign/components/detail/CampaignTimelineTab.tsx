import React from 'react';
import { Timeline } from 'antd';
import type { CampaignResponse } from '../../../../types/api/campaign.types';

interface CampaignTimelineTabProps {
  rawCampaign: CampaignResponse | null;
}

export const CampaignTimelineTab: React.FC<CampaignTimelineTabProps> = ({ rawCampaign }) => {
  const startDateStr = rawCampaign?.startDate
    ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN')
    : 'Chưa thiết lập';
  const endDateStr = rawCampaign?.endDate
    ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN')
    : 'Chưa thiết lập';
  const createdAtStr = rawCampaign?.createdAt
    ? new Date(rawCampaign.createdAt).toLocaleDateString('vi-VN')
    : 'Chưa có dữ liệu';

  return (
    <div className="cdetail-card-modern">
      <div className="cdetail-card-header">
        <span className="cdetail-card-title">
          Lộ trình thời gian triển khai chiến dịch
        </span>
      </div>
      <div style={{ marginTop: 16, maxWidth: 640 }}>
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>Khởi tạo chiến dịch</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {createdAtStr}
                  </div>
                </div>
              ),
            },
            {
              color: 'blue',
              children: (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>Ngày bắt đầu kế hoạch</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {startDateStr}
                  </div>
                </div>
              ),
            },
            {
              color: 'gray',
              children: (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>Ngày kết thúc kế hoạch</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {endDateStr} • Không phải thời điểm nghiệm thu thực tế
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};
