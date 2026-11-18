import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { BrandCampaignItem } from './types';

interface DiscoveryHeaderProps {
  matchedCampaign: BrandCampaignItem | null;
}

export const DiscoveryHeader: React.FC<DiscoveryHeaderProps> = ({ matchedCampaign }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* 1. Breadcrumb */}
      <div className="cdiscovery-breadcrumb">
        <span className="cdiscovery-breadcrumb-link" onClick={() => navigate('/dashboard')}>
          Trang chủ
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-link" onClick={() => navigate('/campaigns')}>
          Chiến dịch
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-camp">
          {matchedCampaign?.name || 'Chiến dịch'}
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-current">Khám phá Nhà sáng tạo</span>
      </div>

      {/* 2. Tiêu đề trang */}
      <div className="cdiscovery-header-section">
        <h1 className="cdiscovery-header-title">Khám phá Nhà sáng tạo</h1>
        <p className="cdiscovery-header-sub">
          Tìm kiếm Nhà sáng tạo phù hợp theo tên, ngành hàng, tương tác và phong cách nội dung.
        </p>
      </div>
    </>
  );
};

export default DiscoveryHeader;

