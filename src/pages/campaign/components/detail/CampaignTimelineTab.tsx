import React from 'react';
import { Timeline } from 'antd';
import type { CampaignResponse } from '../../../../types/api/campaign.types';

interface CampaignTimelineTabProps {
  rawCampaign: CampaignResponse | null;
}

export const CampaignTimelineTab: React.FC<CampaignTimelineTabProps> = ({ rawCampaign }) => {
  const startDateStr = rawCampaign?.startDate
    ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN')
    : '26/10/2026';
  const endDateStr = rawCampaign?.endDate
    ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN')
    : '25/12/2026';
  const createdAtStr = rawCampaign?.createdAt
    ? new Date(rawCampaign.createdAt).toLocaleDateString('vi-VN')
    : '15/10/2026';

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
                    {createdAtStr} • Đã thiết lập thông số và tiêu chí ghép nối
                  </div>
                </div>
              ),
            },
            {
              color: 'blue',
              children: (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>Kích hoạt và kết nối KOC</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {startDateStr} • Đang triển khai gửi brief và đàm phán hợp đồng
                  </div>
                </div>
              ),
            },
            {
              color: 'gray',
              children: (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>Hoàn tất và nghiệm thu KPI</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {endDateStr} • Dự kiến đánh giá kết quả và tổng kết báo cáo
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
