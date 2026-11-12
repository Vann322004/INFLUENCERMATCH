import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckOutlined } from '@ant-design/icons';

interface WorkflowStepBarProps {
  selectedCampaignId: string | null;
}

export const WorkflowStepBar: React.FC<WorkflowStepBarProps> = ({ selectedCampaignId }) => {
  const navigate = useNavigate();

  return (
    <div className="cdiscovery-top-stepper">
      <div
        className="cdiscovery-step-item"
        onClick={() => navigate(`/campaigns/create${selectedCampaignId ? `?id=${selectedCampaignId}` : ''}`)}
      >
        <div className="cdiscovery-step-badge done">
          <CheckOutlined />
        </div>
        <span className="cdiscovery-step-title">Tạo brief</span>
      </div>
      <div className="cdiscovery-step-line done" />

      <div className="cdiscovery-step-item">
        <div className="cdiscovery-step-badge active">2</div>
        <span className="cdiscovery-step-title active">Khám phá KOC</span>
      </div>
      <div className="cdiscovery-step-line" />

      <div
        className="cdiscovery-step-item"
        onClick={() => {
          if (selectedCampaignId) {
            sessionStorage.setItem('current_campaign_id', selectedCampaignId);
            localStorage.setItem('last_active_campaign_id', selectedCampaignId);
          }
          navigate('/creators/shortlist');
        }}
      >
        <div className="cdiscovery-step-badge upcoming">3</div>
        <span className="cdiscovery-step-title">Danh sách chọn</span>
      </div>
      <div className="cdiscovery-step-line" />

      <div
        className="cdiscovery-step-item"
        onClick={() => {
          if (selectedCampaignId) {
            sessionStorage.setItem('current_campaign_id', selectedCampaignId);
            localStorage.setItem('last_active_campaign_id', selectedCampaignId);
          }
          navigate('/creators/recommendations');
        }}
      >
        <div className="cdiscovery-step-badge upcoming">4</div>
        <span className="cdiscovery-step-title">Gợi ý AI</span>
      </div>
      <div className="cdiscovery-step-line" />

      <div className="cdiscovery-step-item" onClick={() => navigate('/crm')}>
        <div className="cdiscovery-step-badge upcoming">5</div>
        <span className="cdiscovery-step-title">Hợp tác</span>
      </div>
    </div>
  );
};

export default WorkflowStepBar;

