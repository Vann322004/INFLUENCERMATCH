import React from 'react';

interface CreateCampaignStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const CreateCampaignStepper: React.FC<CreateCampaignStepperProps> = ({
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="ccreate-stepper-card">
      <div className="ccreate-stepper-grid">
        {/* Step 1 */}
        <div
          className={`ccreate-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
          onClick={() => onStepClick(1)}
        >
          <div className="ccreate-step-num">1</div>
          <div className="ccreate-step-info">
            <span className="ccreate-step-title">Thông tin & Mục tiêu</span>
            <span className="ccreate-step-desc">Tên chiến dịch, sản phẩm</span>
          </div>
        </div>

        <div className={`ccreate-stepper-connector ${currentStep >= 2 ? 'active' : ''}`} />

        {/* Step 2 */}
        <div
          className={`ccreate-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
          onClick={() => onStepClick(2)}
        >
          <div className="ccreate-step-num">2</div>
          <div className="ccreate-step-info">
            <span className="ccreate-step-title">Yêu cầu Creator</span>
            <span className="ccreate-step-desc">Đối tượng, nội dung, tiêu chí</span>
          </div>
        </div>

        <div className={`ccreate-stepper-connector ${currentStep >= 3 ? 'active' : ''}`} />

        {/* Step 3 */}
        <div
          className={`ccreate-step-item ${currentStep === 3 ? 'active' : ''}`}
          onClick={() => onStepClick(3)}
        >
          <div className="ccreate-step-num">3</div>
          <div className="ccreate-step-info">
            <span className="ccreate-step-title">Chỉ số & Ngân sách</span>
            <span className="ccreate-step-desc">Ngân sách, thời gian</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignStepper;

