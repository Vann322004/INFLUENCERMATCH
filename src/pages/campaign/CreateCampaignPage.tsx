import React, { useEffect, useSyncExternalStore } from 'react';
import { campaignEditor } from '../../services/campaignContext';
import { getAuthSessionId, subscribeAuthSession } from '../../services/authSession';
import { Row, Col, Alert, Tag, Input, InputNumber, Button, ConfigProvider, Select } from 'antd';
import CampaignDeliverablesEditor from './components/create/CampaignDeliverablesEditor';
import '../../components/layout/CampaignWorkflow.css';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const context = location.state?.campaignEditContext;
  const legacyId = paramId || searchParams.get('id') || searchParams.get('campaignId')
    || (!context ? location.state?.campaignId || location.state?.id : null);
  const resolvedCampaignId = legacyId || (context?.sessionId === session ? context.campaignId : null);
  const step = Math.max(1, Math.min(3, Number(searchParams.get('step')) || 1));
  useEffect(() => {
    if (!legacyId) return;
    const target = campaignEditor(legacyId, step);
    navigate(target.path, { replace: true, state: target.state });
  }, [legacyId, step, navigate]);
  if (!resolvedCampaignId && location.pathname.includes('/edit')) return <Alert type="warning" title="Chưa chọn chiến dịch để chỉnh sửa" description="Mở chiến dịch từ danh sách để tiếp tục." action={<Button onClick={() => navigate('/campaigns')}>Danh sách chiến dịch</Button>} />;
  return <CampaignEditor key={session + ':' + (resolvedCampaignId || 'new')} resolvedCampaignId={resolvedCampaignId} />;
}

function CampaignEditor({ resolvedCampaignId }: { resolvedCampaignId: string | null }) {
  const navigate = useNavigate();
  const isEditMode = Boolean(resolvedCampaignId);

  const form = useCreateCampaignForm({
    resolvedCampaignId,
    isEditMode,
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
          if (step > form.currentStep && form.campaignStatus === 'DRAFT') { void form.handleNextStep(); return; }
          form.setCurrentStep(step);
          if (resolvedCampaignId) {
            const target = campaignEditor(resolvedCampaignId, step);
            navigate(target.path, { replace: true, state: target.state });
          }
          form.scrollToTop();
        }}
      />

      {/* 3. Main Content: Dynamic Form Blocks */}
      {form.loadError && <Alert type="error" title={form.loadError} action={<Button onClick={() => window.location.reload()}>Tải lại</Button>} />}
      <ConfigProvider componentDisabled={!!form.loadError || form.isLoadingCampaign || (isEditMode && form.campaignStatus !== 'DRAFT')}>
      <fieldset disabled={!!form.loadError || form.isLoadingCampaign || (isEditMode && form.campaignStatus !== 'DRAFT')} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <Row gutter={[20, 20]}>
        <Col xs={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Edit Mode Alert Banner */}
            {isEditMode && (
              <Alert
                className="ccreate-edit-notice"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>
                      <strong>Chế độ chỉnh sửa chiến dịch: </strong>
                      <span>
                        {form.isProductLocked
                          ? 'Chiến dịch đã rời bản nháp. Bạn chỉ có thể xem lại thông tin, không sửa brief hoặc ngân sách.'
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
            {form.currentStep === 1 && (!isEditMode || form.campaignStatus === 'DRAFT') && <CreateCampaignAiHero
              aiPrompt={form.aiPrompt}
              setAiPrompt={form.setAiPrompt}
              isAiLoading={form.isAiLoading}
              aiExplanation={form.aiExplanation}
              setAiExplanation={form.setAiExplanation}
              onAiSuggest={form.handleAiSuggest}
            />}
            {form.currentStep > 1 && form.isAiAutofilled && (
              <p className="ad-note" role="status">Có nội dung AI đề xuất. Vui lòng kiểm tra và chỉnh sửa trước khi lưu.</p>
            )}

            {/* Step 1: Thông tin & Mục tiêu */}
            {form.currentStep === 1 && (
              <>
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
              <section className="workflow-panel" style={{ marginTop: 16 }}>
                <label htmlFor="campaign-image-url">Ảnh chiến dịch (không bắt buộc)</label>
                <Input id="campaign-image-url" type="url" maxLength={2048} value={form.imageUrl}
                  onChange={event => form.setImageUrl(event.target.value)} placeholder="https://…"
                  style={{ marginTop: 8 }} />
              </section>
              </>
            )}

            {/* Step 2: Yêu cầu Creator & Chân dung khán giả */}
            {form.currentStep === 2 && (
              <>
              <CreateCampaignStep2
                creatorMode={form.creatorMode}
                setCreatorMode={form.setCreatorMode}
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
              <section className="ccreate-card ccreate-audience-description">
                <label htmlFor="campaign-audience-description">Mô tả khán giả mong muốn (tùy chọn)</label>
                <Input.TextArea id="campaign-audience-description" rows={3} value={form.audienceDescription}
                  onChange={event => form.setAudienceDescription(event.target.value)}
                  placeholder="Mỗi nhóm một dòng, ví dụ: Sinh viên quan tâm mỹ phẩm bình dân" />
              </section>
              <CampaignDeliverablesEditor value={form.deliverables} onChange={form.setDeliverables} platforms={form.selectedPlatforms} />
              </>
            )}

            {/* Step 3: Ngân sách & Thời gian thực thi */}
            {form.currentStep === 3 && (
              <>
              <CreateCampaignStep3
                budgetTotal={form.budgetTotal}
                setBudgetTotal={form.setBudgetTotal}
                campaignName={form.campaignName}
                product={form.product}
                selectedPlatforms={form.selectedPlatforms}
                creatorQuantity={form.creatorQuantity}
                creatorTier={form.creatorTier}
                selectedAges={form.selectedAges}
                selectedGender={form.selectedGender}
                locationState={form.formLocation}
                isAiAutofilled={form.isAiAutofilled}
                startDate={form.savedStartDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                endDate={form.savedEndDate}
                brief={form.creatorBrief}
                deliverables={form.deliverables}
              >
              <div className="workflow-fields" style={{ marginTop: 20 }}>
                <label>Ngày bắt đầu<Input type="date" value={form.savedStartDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`} onChange={e => form.setSavedStartDate(e.target.value)} /></label>
                <label>Ngày kết thúc<Input type="date" value={form.savedEndDate} onChange={e => form.setSavedEndDate(e.target.value)} /></label>
                <label>Chọn nhanh thời lượng (tùy chọn)<Select value={form.campaignDuration || undefined} placeholder="Chọn thời lượng" onChange={form.setCampaignDuration} options={[{ value: '2_weeks', label: '2 tuần' }, { value: '4_weeks', label: '4 tuần' }, { value: '8_weeks', label: '8 tuần' }]} /></label>
              </div>
              <div className="workflow-fields" style={{ marginTop: 20 }}>
                <label>Phí dự kiến / nhà sáng tạo — từ<InputNumber<number> min={0} precision={0} step={500000} controls={false}
                  value={form.creatorFeeMin} placeholder="Không bắt buộc" suffix="₫"
                  formatter={value => value == null ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={value => Number((value ?? '').replace(/\./g, ''))}
                  onChange={value => form.setCreatorFeeMin(value != null && value >= 0 && Number.isSafeInteger(value) ? value : undefined)} /></label>
                <label>Đến<InputNumber<number> min={0} precision={0} step={500000} controls={false}
                  value={form.creatorFeeMax} placeholder="Không bắt buộc" suffix="₫"
                  formatter={value => value == null ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={value => Number((value ?? '').replace(/\./g, ''))}
                  onChange={value => form.setCreatorFeeMax(value != null && value >= 0 && Number.isSafeInteger(value) ? value : undefined)} /></label>
              </div>
              <p className="ad-note">Khoảng phí cho một nhà sáng tạo, có thể để trống. Phí chính thức được chốt khi thỏa thuận.</p>
              </CreateCampaignStep3>
              </>
            )}
          </div>
        </Col>
      </Row>
      </fieldset>
      </ConfigProvider>

      {/* 4. Sticky Bottom Actions Bar */}
      {(!form.loadError && !form.isLoadingCampaign && (!isEditMode || form.campaignStatus === 'DRAFT')) ? <CreateCampaignBottomBar
        isEditMode={isEditMode}
        resolvedCampaignId={resolvedCampaignId}
        currentStep={form.currentStep}
        handlePrevStep={form.handlePrevStep}
        handleNextStep={form.handleNextStep}
        handleUpdateCampaign={form.handleUpdateCampaign}
        handleSaveDraft={form.handleSaveDraft}
        isSubmitting={form.isSubmitting}
        isSavingDraft={form.isSavingDraft}
      /> : <Button onClick={() => window.history.back()}>Quay lại</Button>}
    </div>
  );
}
