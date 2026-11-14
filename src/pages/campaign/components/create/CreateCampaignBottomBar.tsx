import React from 'react';
import { Space, Button } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
  CompassOutlined,
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
        {isEditMode ? (
          <>
            {currentStep > 1 && (
              <Button
                icon={<LeftOutlined />}
                onClick={handlePrevStep}
                className="ccreate-btn-back"
              >
                Bước trước
              </Button>
            )}

            {currentStep < 3 && (
              <Button
                onClick={handleNextStep}
                className="ccreate-btn-next"
              >
                {currentStep === 1 ? 'Bước 2: Yêu cầu Creator' : 'Bước 3: Ngân sách'}
                <RightOutlined />
              </Button>
            )}

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleUpdateCampaign}
              loading={isSubmitting}
              className="ccreate-btn-next"
              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
            >
              Lưu thay đổi
            </Button>
          </>
        ) : (
          <>
            {/* Nút Lưu bản nháp (Save Draft) - Create Mode */}
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              loading={isSavingDraft}
              className="ccreate-btn-draft"
            >
              Lưu bản nháp
            </Button>

            {currentStep > 1 && (
              <Button
                icon={<LeftOutlined />}
                onClick={handlePrevStep}
                className="ccreate-btn-back"
              >
                Quay lại
              </Button>
            )}

            <Button
              type="primary"
              onClick={handleNextStep}
              loading={isSubmitting}
              className="ccreate-btn-next"
            >
              {currentStep === 1
                ? 'Tiếp theo (Bước 2)'
                : currentStep === 2
                ? 'Tiếp theo (Bước 3)'
                : 'Tiếp tục chạy đề xuất'}
              {currentStep === 3 ? <CompassOutlined /> : <RightOutlined />}
            </Button>
          </>
        )}
      </Space>
    </div>
  );
};

export default CreateCampaignBottomBar;

