import React from 'react';

export type CampaignDetailTabKey = 'overview' | 'creators' | 'budget' | 'timeline' | 'guidelines';

interface CampaignDetailNavTabsProps {
  activeTab: CampaignDetailTabKey;
  setActiveTab: (tab: CampaignDetailTabKey) => void;
  creatorsCount: number;
}

export const CampaignDetailNavTabs: React.FC<CampaignDetailNavTabsProps> = ({
  activeTab,
  setActiveTab,
  creatorsCount,
}) => {
  return (
    <div className="cdetail-nav-tabs-wrap">
      <div className="cdetail-segmented-tabs">
        <button
          type="button"
          className={`cdetail-seg-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan chiến dịch
        </button>
        <button
          type="button"
          className={`cdetail-seg-tab-btn ${activeTab === 'creators' ? 'active' : ''}`}
          onClick={() => setActiveTab('creators')}
        >
          Nhà sáng tạo tham gia ({creatorsCount})
        </button>
        <button
          type="button"
          className={`cdetail-seg-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          Ngân sách & Thanh toán
        </button>
        <button
          type="button"
          className={`cdetail-seg-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Lộ trình chiến dịch
        </button>
        <button
          type="button"
          className={`cdetail-seg-tab-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('guidelines')}
        >
          Hồ sơ & Yêu cầu nội dung
        </button>
      </div>
    </div>
  );
};
