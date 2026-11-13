import React from 'react';
import { Row, Col, Alert, Tag } from 'antd';
import { useParams, useLocation } from 'react-router-dom';

import CreateCampaignHeader from './components/create/CreateCampaignHeader';
import CreateCampaignStepper from './components/create/CreateCampaignStepper';
import CreateCampaignAiHero from './components/create/CreateCampaignAiHero';
import CreateCampaignStep1 from './components/create/CreateCampaignStep1';
import CreateCampaignStep2 from './components/create/CreateCampaignStep2';
import CreateCampaignStep3 from './components/create/CreateCampaignStep3';
import CreateCampaignBottomBar from './components/create/CreateCampaignBottomBar';
import { getStatusBadge } from './components/create/createCampaignConstants';
import { useCreateCampaignForm } from './hooks/useCreateCampaignForm';

import './CreateCampaignPage.css';

export default function CreateCampaignPage() {
  const { id: paramId } = useParams<{ id?: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Nhận diện Edit Mode dựa trên URL param hoặc state
  const resolvedCampaignId =
    paramId ||
    searchParams.get('id') ||
    (location.state as any)?.campaignId ||
    (location.state as any)?.id ||
    null;
  const isEditMode = Boolean(resolvedCampaignId);

  const form = useCreateCampaignForm({
    resolvedCampaignId,
    isEditMode,
    locationState: location.state,
  });

  return (
    <div className="ccreate-container">
      {/* 1. Header Section */}
      <CreateCampaignHeader
        isEditMode={isEditMode}
        resolvedCampaignId={resolvedCampaignId}
        campaignStatus={form.campaignStatus}
        campaignName={form.campaignName}
      />

      {/* 2. Top Interactive Wizard Steps Bar */}
      <CreateCampaignStepper
        currentStep={form.currentStep}
        onStepClick={(step) => {
          form.setCurrentStep(step);
          form.scrollToTop();
        }}
      />

      {/* 3. Main Content: Dynamic Form Blocks */}
      <Row gutter={[20, 20]}>
        <Col xs={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Edit Mode Alert Banner */}
            {isEditMode && (
              <Alert
                message={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>
                      <strong>Chế độ chỉnh sửa chiến dịch: </strong>
                      <span>
                        {form.isProductLocked
                          ? `Chiến dịch đang ${getStatusBadge(form.campaignStatus).label}. Bạn có thể cập nhật tên chiến dịch, mô tả brief, ngân sách và tiêu chí KOC. Sản phẩm quảng bá được khóa để bảo vệ hợp đồng.`
                          : 'Bạn có thể tự do cập nhật mọi thông tin chiến lược, đối tượng và ngân sách của chiến dịch.'}
                      </span>
                    </div>
                    <Tag
                      style={{
                        backgroundColor: getStatusBadge(form.campaignStatus).bg,
                        borderColor: getStatusBadge(form.campaignStatus).border,
                        color: getStatusBadge(form.campaignStatus).color,
                        fontWeight: 700,
                        borderRadius: 6,
                        margin: 0,
                      }}
                    >
                      {getStatusBadge(form.campaignStatus).label}
                    </Tag>
                  </div>
                }
                type={form.isProductLocked ? 'warning' : 'info'}
                showIcon
                style={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
              />
            )}

            {/* AI Assistant Hero Card */}
            <CreateCampaignAiHero
              aiPrompt={form.aiPrompt}
              setAiPrompt={form.setAiPrompt}
              isAiLoading={form.isAiLoading}
              aiExplanation={form.aiExplanation}
              setAiExplanation={form.setAiExplanation}
              onAiSuggest={form.handleAiSuggest}
            />

            {/* Step 1: Thông tin & Mục tiêu */}
            {form.currentStep === 1 && (
              <CreateCampaignStep1
                campaignName={form.campaignName}
                setCampaignName={form.setCampaignName}
                product={form.product}
                setProduct={form.setProduct}
                isProductLocked={form.isProductLocked}
                interests={form.interests}
                setInterests={form.setInterests}
                selectedObjectives={form.selectedObjectives}
                toggleObjective={form.toggleObjective}
                isAiAutofilled={form.isAiAutofilled}
              />
            )}

            {/* Step 2: Yêu cầu Creator & Chân dung khán giả */}
            {form.currentStep === 2 && (
              <CreateCampaignStep2
                selectedPlatforms={form.selectedPlatforms}
                togglePlatform={form.togglePlatform}
                creatorQuantity={form.creatorQuantity}
                setCreatorQuantity={form.setCreatorQuantity}
                minFollowers={form.minFollowers}
                handleMinFollowersChange={form.handleMinFollowersChange}
                locationState={form.formLocation}
                setLocationState={form.setFormLocation}
                provinceOptions={form.provinceOptions}
                loadingProvinces={form.loadingProvinces}
                selectedAges={form.selectedAges}
                toggleAge={form.toggleAge}
                selectedGender={form.selectedGender}
                setSelectedGender={form.setSelectedGender}
                creatorBrief={form.creatorBrief}
                setCreatorBrief={form.setCreatorBrief}
                isAiAutofilled={form.isAiAutofilled}
              />
            )}

            {/* Step 3: Ngân sách & Thời gian thực thi */}
            {form.currentStep === 3 && (
              <CreateCampaignStep3
                budgetTotal={form.budgetTotal}
                setBudgetTotal={form.setBudgetTotal}
                campaignDuration={form.campaignDuration}
                setCampaignDuration={form.setCampaignDuration}
                campaignName={form.campaignName}
                product={form.product}
                selectedPlatforms={form.selectedPlatforms}
                creatorQuantity={form.creatorQuantity}
                creatorTier={form.creatorTier}
                selectedAges={form.selectedAges}
                selectedGender={form.selectedGender}
                locationState={form.formLocation}
                isAiAutofilled={form.isAiAutofilled}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* 4. Sticky Bottom Actions Bar */}
      <CreateCampaignBottomBar
        isEditMode={isEditMode}
        resolvedCampaignId={resolvedCampaignId}
        currentStep={form.currentStep}
        handlePrevStep={form.handlePrevStep}
        handleNextStep={form.handleNextStep}
        handleUpdateCampaign={form.handleUpdateCampaign}
        handleSaveDraft={form.handleSaveDraft}
        isSubmitting={form.isSubmitting}
        isSavingDraft={form.isSavingDraft}
      />
    </div>
  );
}
