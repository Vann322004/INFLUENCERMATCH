import React from 'react';
import { Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { EditOutlined, EllipsisOutlined } from '@ant-design/icons';
import type { CampaignResponse } from '../../../../types/api/campaign.types';
import type { CampaignStatusType } from './CampaignHeroBanner';
import type { CampaignCreatorRow } from './CampaignMetricCards';

interface CampaignOverviewTabProps {
  rawCampaign: CampaignResponse | null;
  currentStatus: CampaignStatusType;
  participatingCreators: CampaignCreatorRow[];
  handleNavigateToEdit: () => void;
  moreMenuItems: MenuProps['items'];
}

export const CampaignOverviewTab: React.FC<CampaignOverviewTabProps> = ({
  rawCampaign,
  currentStatus,
  participatingCreators,
  handleNavigateToEdit,
  moreMenuItems,
}) => {
  return (
    <div className="cdetail-overview-rows">
      {/* Row 1: Sản phẩm & Thông tin vận hành */}
      <div className="cdetail-overview-row">
        {/* Card 1: Sản phẩm & Nội dung chiến dịch */}
        <div className="cdetail-card-modern">
          <div className="cdetail-card-header">
            <span className="cdetail-card-title">
              Sản phẩm & Nội dung chiến dịch
            </span>
            <button
              type="button"
              className="cdetail-card-action-btn"
              onClick={handleNavigateToEdit}
            >
              <EditOutlined style={{ fontSize: 12 }} />
              Chỉnh sửa
            </button>
          </div>

          {/* Box sản phẩm */}
          <div className="cdetail-product-box">
            <div className="cdetail-product-info">
              <span className="cdetail-product-label">Sản phẩm / Dịch vụ trọng tâm</span>
              <span className="cdetail-product-name">
                {rawCampaign?.productService || 'Sản phẩm chưa cập nhật'}
              </span>
              <div className="cdetail-product-tags">
                {(rawCampaign?.niches && rawCampaign.niches.length > 0 ? rawCampaign.niches : ['Làm đẹp', 'Chăm sóc cá nhân']).map((n) => (
                  <span key={n} className="cdetail-product-tag">{n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Mô tả chiến dịch */}
          <div className="cdetail-brief-block">
            <span className="cdetail-brief-label">Mô tả chiến dịch</span>
            <p className="cdetail-brief-text">
              {rawCampaign?.description ||
                'Chiến dịch ra mắt sản phẩm và gia tăng nhận thức thương hiệu, tiếp cận tệp khách hàng tiềm năng qua các nền tảng mạng xã hội.'}
            </p>
          </div>

          {/* Định hướng nội dung cho KOC */}
          <div className="cdetail-brief-block">
            <span className="cdetail-brief-label">Định hướng hợp tác với KOC</span>
            <div className="cdetail-bullet-group">
              <div className="cdetail-bullet-item">
                <span className="cdetail-bullet-bullet">•</span>
                <div>Sản xuất video trải nghiệm thực tế, giới thiệu điểm nổi bật của sản phẩm.</div>
              </div>
              <div className="cdetail-bullet-item">
                <span className="cdetail-bullet-bullet">•</span>
                <div>Nội dung tự nhiên, chân thực, phù hợp phong cách cá nhân của nhà sáng tạo.</div>
              </div>
              <div className="cdetail-bullet-item">
                <span className="cdetail-bullet-bullet">•</span>
                <div>Gắn liên kết sản phẩm, sử dụng hashtag và xuất bản đúng lịch trình cam kết.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Thông tin vận hành & Quản trị */}
        <div className="cdetail-card-modern">
          <div className="cdetail-card-header">
            <span className="cdetail-card-title">
              Thông tin vận hành
            </span>
            <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
              <button type="button" className="cdetail-card-action-btn" title="Thao tác">
                <EllipsisOutlined />
              </button>
            </Dropdown>
          </div>

          <div className="cdetail-ops-list">
            <div className="cdetail-ops-row">
              <span className="cdetail-ops-label">Trạng thái vận hành</span>
              <span className="cdetail-ops-value">
                <span className="cdetail-status-dot" />
                {currentStatus === 'running'
                  ? 'Đang triển khai'
                  : currentStatus === 'completed'
                  ? 'Hoàn thành'
                  : currentStatus === 'cancelled'
                  ? 'Đã lưu trữ'
                  : 'Bản nháp'}
              </span>
            </div>

            <div className="cdetail-ops-row">
              <span className="cdetail-ops-label">Đội ngũ phụ trách</span>
              <span className="cdetail-ops-value">
                <Avatar
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80"
                  size={20}
                />
                Brand Marketing Team
              </span>
            </div>

            <div className="cdetail-ops-row">
              <span className="cdetail-ops-label">Khán giả mục tiêu</span>
              <span className="cdetail-ops-value">Nữ 18–28 (Trẻ, năng động)</span>
            </div>

            <div className="cdetail-ops-row">
              <span className="cdetail-ops-label">Khu vực ưu tiên</span>
              <span className="cdetail-ops-value">TP.HCM, Hà Nội & Toàn quốc</span>
            </div>

            <div className="cdetail-ops-row">
              <span className="cdetail-ops-label">Thời gian triển khai</span>
              <span className="cdetail-ops-value">
                {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : '26/10/2026'} – {rawCampaign?.endDate ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN') : '25/12/2026'}
              </span>
            </div>

            <div className="cdetail-ops-row">
              <span className="cdetail-ops-label">Ngày khởi tạo</span>
              <span className="cdetail-ops-value">
                {rawCampaign?.createdAt ? new Date(rawCampaign.createdAt).toLocaleDateString('vi-VN') : '15/10/2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Mục tiêu & Cột mốc thực hiện */}
      <div className="cdetail-overview-row">
        {/* Card 3: Mục tiêu & Kênh phân phối */}
        <div className="cdetail-card-modern">
          <div className="cdetail-card-header">
            <span className="cdetail-card-title">
              Mục tiêu & Kênh phân phối
            </span>
          </div>

          <div className="cdetail-bullet-group">
            <div className="cdetail-bullet-item">
              <span className="cdetail-bullet-bullet">•</span>
              <div><strong>Độ phủ truyền thông:</strong> Gia tăng nhận thức thương hiệu trên TikTok và Instagram</div>
            </div>
            <div className="cdetail-bullet-item">
              <span className="cdetail-bullet-bullet">•</span>
              <div><strong>Nội dung chân thực:</strong> Đánh giá trải nghiệm thực tế từ các nhà sáng tạo uy tín</div>
            </div>
            <div className="cdetail-bullet-item">
              <span className="cdetail-bullet-bullet">•</span>
              <div><strong>Thúc đẩy chuyển đổi:</strong> Điều hướng tương tác và gắn link mua hàng trực tiếp</div>
            </div>
          </div>

          <div className="cdetail-bullet-group" style={{ marginTop: 10 }}>
            <span className="cdetail-bullet-title">Kênh truyền thông ưu tiên</span>
            <div className="cdetail-platform-badges">
              <span className="cdetail-platform-badge tiktok">
                TikTok Video ngắn (60s)
              </span>
              <span className="cdetail-platform-badge instagram">
                Instagram Reels & Story
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Kế hoạch nội dung & Cột mốc thực hiện */}
        <div className="cdetail-card-modern">
          <div className="cdetail-card-header">
            <span className="cdetail-card-title">
              Kế hoạch nội dung & Bàn giao
            </span>
            <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600, background: '#EEF2FF', padding: '2px 8px', borderRadius: 6 }}>
              {participatingCreators.length} KOC tham gia
            </span>
          </div>

          <div className="cdetail-deliverables-list">
            <div className="cdetail-deliverable-item">
              <div className="cdetail-deliv-badge">Giai đoạn 1</div>
              <div className="cdetail-deliv-info">
                <div className="cdetail-deliv-title">Tuyển chọn và đàm phán hợp đồng</div>
                <div className="cdetail-deliv-sub">Chốt danh sách {participatingCreators.length > 0 ? participatingCreators.length : 3} KOC phù hợp với định vị sản phẩm</div>
              </div>
            </div>

            <div className="cdetail-deliverable-item">
              <div className="cdetail-deliv-badge">Giai đoạn 2</div>
              <div className="cdetail-deliv-info">
                <div className="cdetail-deliv-title">Gửi sản phẩm mẫu và duyệt kịch bản</div>
                <div className="cdetail-deliv-sub">KOC nhận mẫu thử và gửi kịch bản trước khi quay 3 ngày</div>
              </div>
            </div>

            <div className="cdetail-deliverable-item">
              <div className="cdetail-deliv-badge">Giai đoạn 3</div>
              <div className="cdetail-deliv-info">
                <div className="cdetail-deliv-title">Lên bài và nghiệm thu báo cáo</div>
                <div className="cdetail-deliv-sub">Đăng video đồng loạt theo lịch trình và đối soát số liệu KPI</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
