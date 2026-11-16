import React from 'react';
import { Space, Button } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface CreateCampaignBottomBarProps {
  isEditMode: boolean;
  resolvedCampaignId: string | null;
  currentStep: number;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  handleUpdateCampaign: () => void;
  handleSaveDraft: () => void;
  isSubmitting: boolean;
  isSavingDraft: boolean;
}

export const CreateCampaignBottomBar: React.FC<CreateCampaignBottomBarProps> = ({
  isEditMode,
  resolvedCampaignId,
  currentStep,
  handlePrevStep,
  handleNextStep,
  handleUpdateCampaign,
  handleSaveDraft,
  isSubmitting,
  isSavingDraft,
}) => {
  const navigate = useNavigate();

  return (
    <div className="ccreate-bottom-actions">
      <Button
        type="text"
        onClick={() => navigate(isEditMode && resolvedCampaignId ? `/campaigns/${resolvedCampaignId}` : '/campaigns')}
        className="ccreate-btn-cancel"
      >
        {isEditMode ? '✕ Hủy & Quay lại' : '✕ Hủy'}
      </Button>

      <Space size={12} wrap>
        {/* Ở Edit Mode: Luôn có nút Lưu thay đổi tức thì */}
        <Button icon={<SaveOutlined />} onClick={isEditMode ? handleUpdateCampaign : handleSaveDraft} loading={isSavingDraft} disabled={isSubmitting}>Lưu bản nháp</Button>
        {currentStep > 1 && <Button icon={<LeftOutlined />} onClick={handlePrevStep}>Quay lại</Button>}
        <Button type="primary" className="ccreate-btn-next" onClick={handleNextStep} loading={isSubmitting} disabled={isSavingDraft}>
          {currentStep === 3 ? 'Sẵn sàng khám phá' : 'Lưu và tiếp tục'}<RightOutlined />
        </Button>
      </Space>
    </div>
  );
};

export default CreateCampaignBottomBar;

