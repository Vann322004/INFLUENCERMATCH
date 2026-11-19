import { useState, useEffect, useRef } from 'react';
import { rememberCampaign, campaignEditor } from '../../../services/campaignContext';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../../services/api/campaignService';
import { getErrorMessage } from '../../../services/apiClient';
import type { CampaignObjective, CampaignPlatform, CampaignPlanningFields, CampaignResponse } from '../../../types/api/campaign.types';

interface UseCreateCampaignFormProps {
  resolvedCampaignId: string | null;
  isEditMode: boolean;
}

export function useCreateCampaignForm({
  resolvedCampaignId,
  isEditMode,
}: UseCreateCampaignFormProps) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const navigateToEditor = (id: string, step: number) => {
    const target = campaignEditor(id, step);
    navigate(target.path, { replace: true, state: target.state });
  };

  // Wizard Step State (1: Thông tin chiến dịch, 2: Yêu cầu creator, 3: Chỉ số & ngân sách)
  const [currentStep, setCurrentStep] = useState<number>(() => Math.max(1, Math.min(3, Number(new URLSearchParams(window.location.search).get('step')) || 1)));
  const savedId = useRef(resolvedCampaignId);
  const original = useRef<CampaignResponse | null>(null);
  const draftRequest = useRef<Promise<any> | null>(null);
  const saving = useRef(false);
  const savedFollowerRange = useRef<{ min?: number; max?: number; tier: string; selection: string } | null>(null);
  const [deliverables, setDeliverables] = useState<NonNullable<CampaignPlanningFields['deliverables']>>([]);
  const [savedEndDate, setSavedEndDate] = useState('');
  const [creatorFeeMin, setCreatorFeeMin] = useState<number>();
  const [creatorFeeMax, setCreatorFeeMax] = useState<number>();
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Trạng thái chiến dịch (DRAFT, READY_FOR_DISCOVERY, ACTIVE, COMPLETED, ARCHIVED)
  const [campaignStatus, setCampaignStatus] = useState<string>('DRAFT');
  const [campaignRevision, setCampaignRevision] = useState<number | null>(null);
  const [savedStartDate, setSavedStartDate] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState<boolean>(false);

  // ================= Step 1 State =================
  const [campaignName, setCampaignName] = useState('');
  const [product, setProduct] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      aiRequest.current?.abort();
    };
  }, [resolvedCampaignId]);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiAutofilled, setIsAiAutofilled] = useState<boolean>(false);

  // ================= Step 2 State =================
  const [creatorMode, setCreatorMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [creatorQuantity, setCreatorQuantity] = useState<number>(1);
  const [creatorTier, setCreatorTier] = useState<string>('');
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [interests, setInterests] = useState<string>('');
  const [creatorBrief, setCreatorBrief] = useState<string>('');

  // ================= Step 3 State =================
  const [budgetTotal, setBudgetTotal] = useState<number>(0);
  const [campaignDuration, setCampaignDuration] = useState<string>('');

  // Provinces API State
  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([
    { value: 'nationwide', label: 'Toàn quốc' },
    { value: 'Thành phố Hà Nội', label: 'Thành phố Hà Nội' },
    { value: 'Thành phố Hồ Chí Minh', label: 'Thành phố Hồ Chí Minh' },
    { value: 'Thành phố Đà Nẵng', label: 'Thành phố Đà Nẵng' },
    { value: 'Thành phố Hải Phòng', label: 'Thành phố Hải Phòng' },
    { value: 'Thành phố Cần Thơ', label: 'Thành phố Cần Thơ' },
  ]);
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            const list = [
              { value: 'nationwide', label: 'Toàn quốc' },
              ...data.map((item: { name: string; code: number }) => ({
                value: item.name,
                label: item.name,
              })),
            ];
            setProvinceOptions(list);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách tỉnh thành:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load campaign detail when in Edit Mode
  useEffect(() => {
    if (!isEditMode || !resolvedCampaignId) return;

    let isMounted = true;
    const loadCampaignDetail = async () => {
      setIsLoadingCampaign(true); setLoadError(null);
      setCampaignName(''); setProduct(''); setSelectedObjectives([]); setSelectedPlatforms([]); setSelectedAges([]); setSelectedGender(''); setFormLocation(''); setInterests(''); setCreatorBrief(''); setBudgetTotal(0); setCampaignDuration(''); setSavedStartDate(''); setCampaignRevision(null);
      try {
        const applyCampaignData = (camp: any) => {
          if (!camp) return;
          if (camp.status) setCampaignStatus(camp.status);
          setDeliverables(camp.deliverables ?? []);
          setCreatorFeeMin(camp.creatorFeeMin ?? undefined); setCreatorFeeMax(camp.creatorFeeMax ?? undefined);
          setSavedEndDate(camp.endDate ?? '');
          if (camp.campaignRevision != null) setCampaignRevision(Number(camp.campaignRevision));
          if (camp.creatorMode === 'SINGLE' || camp.creatorMode === 'MULTI') {
            setCreatorMode(camp.creatorMode);
          } else if (camp.targetCreatorCount && camp.targetCreatorCount >= 2) {
            setCreatorMode('MULTI');
          } else {
            setCreatorMode('SINGLE');
          }
          if (camp.targetCreatorCount) setCreatorQuantity(camp.targetCreatorCount);
          if (camp.startDate) setSavedStartDate(camp.startDate);
          if (camp.startDate && camp.endDate) {
            const days = Math.round((Date.parse(camp.endDate) - Date.parse(camp.startDate)) / 86400000);
            if (days === 14) setCampaignDuration('2_weeks');
            else if (days === 28) setCampaignDuration('4_weeks');
            else if (days === 56) setCampaignDuration('8_weeks');
          }
          if (camp.name) setCampaignName(camp.name);
          if (camp.productService) setProduct(camp.productService);
          if (camp.brief || camp.description) setCreatorBrief(camp.brief || camp.description);

          // Mục tiêu chiến dịch
          if (camp.objective) {
            const obj = String(camp.objective).toUpperCase();
            if (obj === 'CONVERSION' || obj === 'SALES') setSelectedObjectives(['sales']);
            else if (obj === 'ENGAGEMENT') setSelectedObjectives(['engagement']);
            else if (obj === 'TRAFFIC') setSelectedObjectives(['traffic']);
            else setSelectedObjectives(['awareness']);
          }

          // Nền tảng
          if (camp.platforms && Array.isArray(camp.platforms) && camp.platforms.length > 0) {
            const cleanP = camp.platforms
              .map((p: string) => String(p).toLowerCase())
              .filter((p: string) => ['tiktok', 'instagram', 'youtube'].includes(p));
            if (cleanP.length > 0) setSelectedPlatforms(cleanP);
          }

          // Ngân sách
          if (camp.totalBudget != null) setBudgetTotal(Number(camp.totalBudget));
          else if (camp.budgetMax) setBudgetTotal(camp.budgetMax);
          else if (camp.budgetMin) setBudgetTotal(camp.budgetMin);

          // Ngành hàng / Niches
          if (camp.niches && Array.isArray(camp.niches)) {
            setInterests(camp.niches.join(', '));
          }

          // Địa điểm
          if (camp.locations && Array.isArray(camp.locations) && camp.locations.length > 0) {
            setFormLocation(camp.locations[0]);
          }

          // Đối tượng người xem (Target audiences)
          if (camp.targetAudiences && Array.isArray(camp.targetAudiences)) {
            const ages = camp.targetAudiences.filter((a: string) =>
              ['13-17', '18-24', '25-34', '35-44', '45+'].includes(a)
            );
            if (ages.length > 0) setSelectedAges(ages);
            if (
              camp.targetAudiences.some((a: string) =>
                a.toLowerCase().includes('nữ') || a.toLowerCase().includes('female')
              )
            ) {
              setSelectedGender('female');
            } else if (
              camp.targetAudiences.some((a: string) =>
                a.toLowerCase().includes('nam') || a.toLowerCase().includes('male')
              )
            ) {
              setSelectedGender('male');
            }
          }

          // Phân khúc Creator (Follower range)
          if (camp.followerMin !== undefined || camp.followerMax !== undefined) {
            const minF = camp.followerMin ? Number(camp.followerMin) : undefined;
            const maxF = camp.followerMax ? Number(camp.followerMax) : undefined;
            if (minF && minF >= 500000) {
              setCreatorTier('mega');
              setMinFollowers('500k');
            } else if (minF && minF >= 100000) {
              setCreatorTier('macro');
              setMinFollowers('100k');
            } else if (minF && minF >= 50000) {
              setCreatorTier('micro');
              setMinFollowers('50k');
            } else if (minF && minF >= 10000) {
              setCreatorTier('nano');
              setMinFollowers('10k');
            } else if (maxF) {
              if (maxF <= 50000) {
                setCreatorTier('nano');
                setMinFollowers('10k');
              } else if (maxF <= 200000) {
                setCreatorTier('micro');
                setMinFollowers('50k');
              } else if (maxF <= 500000) {
                setCreatorTier('macro');
                setMinFollowers('100k');
              } else {
                setCreatorTier('mega');
                setMinFollowers('500k');
              }
            }
          }
        };

        const remoteData = await campaignService.getCampaignById(resolvedCampaignId);
        if (isMounted && remoteData) {
          original.current = remoteData;
          applyCampaignData(remoteData);
          const min = remoteData.followerMin, max = remoteData.followerMax;
          const tier = min != null && min >= 500000 ? 'mega' : min != null && min >= 100000 ? 'macro' : min != null && min >= 50000 ? 'micro' : min != null && min >= 10000 ? 'nano' : '';
          const selection = ({ mega: '500k', macro: '100k', micro: '50k', nano: '10k' } as Record<string, string>)[tier] || '';
          setCreatorTier(tier); setMinFollowers(selection); savedFollowerRange.current = { min, max, tier, selection };
        }
      } catch (err) {
        if (isMounted) setLoadError(getErrorMessage(err));
        console.warn('Lỗi khi tải thông tin chiến dịch để chỉnh sửa:', err);
      } finally {
        if (isMounted) setIsLoadingCampaign(false);
      }
    };

    loadCampaignDetail();
    return () => {
      isMounted = false;
    };
  }, [isEditMode, resolvedCampaignId]);

  const toggleObjective = (id: string) => {
    if (isEditMode && campaignStatus !== 'DRAFT') return;
    setSelectedObjectives([id]);
  };

  const toggleAge = (age: string) => {
    if (isEditMode && campaignStatus !== 'DRAFT') return;
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  };

  const togglePlatform = (p: string) => {
    if (isEditMode && campaignStatus !== 'DRAFT') return;
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]
    );
  };

  const handleMinFollowersChange = (val: string) => {
    setMinFollowers(val);
    if (val === '10k') setCreatorTier('nano');
    else if (val === '50k') setCreatorTier('micro');
    else if (val === '100k') setCreatorTier('macro');
    else if (val === '500k') setCreatorTier('mega');
  };

  const scrollToTop = () => {
    const mainContent = document.querySelector('main.ant-layout-content') || document.querySelector('.ant-layout-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAiSuggest = async (overridePrompt?: string) => {
    if (aiRequest.current || isAiLoading || isLoadingCampaign || loadError || (isEditMode && campaignStatus !== 'DRAFT')) return;
    const prompt = (typeof overridePrompt === 'string' ? overridePrompt : aiPrompt).trim();
    if (prompt.length < 10) { message.warning('Nhập mô tả tối thiểu 10 ký tự.'); return; }
    const controller = new AbortController();
    aiRequest.current = controller;
    setIsAiLoading(true);
    try {
      const result = await campaignService.autofillCampaign(prompt, controller.signal);
      if (controller.signal.aborted) return;
      if (result.name != null) setCampaignName(result.name);
      if (result.productService != null) setProduct(result.productService);
      if (result.objective) setSelectedObjectives([({ CONVERSION: 'sales', ENGAGEMENT: 'engagement', TRAFFIC: 'traffic', AWARENESS: 'awareness' } as Record<string, string>)[result.objective]]);
      if (result.platforms) setSelectedPlatforms(result.platforms.map(value => value.toLowerCase()).filter(value => ['tiktok', 'instagram', 'youtube'].includes(value)));
      if (result.targetAudiences) { setSelectedAges(result.targetAudiences.filter(value => ['13-17','18-24','25-34','35-44','45+'].includes(value))); }
      if (result.niches) setInterests(result.niches.join(', '));
      if (result.locations) setFormLocation(result.locations[0] ?? '');
      if (result.targetCreatorCount != null) setCreatorQuantity(result.targetCreatorCount);
      if (result.followerMin != null || result.followerMax != null) {
        const min = result.followerMin, max = result.followerMax;
        const tier = min != null && min >= 500000 ? 'mega' : min != null && min >= 100000 ? 'macro' : min != null && min >= 50000 ? 'micro' : min != null && min >= 10000 ? 'nano' : '';
        const selection = ({ mega: '500k', macro: '100k', micro: '50k', nano: '10k' } as Record<string, string>)[tier] || '';
        setCreatorTier(tier); setMinFollowers(selection); savedFollowerRange.current = { min, max, tier, selection };
      }
      const budget = result.totalBudget ?? result.budgetMax ?? result.budgetMin;
      if (budget != null) setBudgetTotal(budget);
      if (result.startDate) setSavedStartDate(result.startDate);
      if (result.endDate) { setSavedEndDate(result.endDate); setCampaignDuration(''); }
      if (result.brief != null) setCreatorBrief(result.brief);
      if (result.deliverables) setDeliverables(result.deliverables);
      if (result.creatorFeeMin != null) setCreatorFeeMin(result.creatorFeeMin);
      if (result.creatorFeeMax != null) setCreatorFeeMax(result.creatorFeeMax);
      setAiExplanation(result.aiExplanation ?? null); setIsAiAutofilled(true);
      message.info('Đã nhận gợi ý. Rà soát nội dung và lưu bản nháp để ghi nhận thay đổi.');
    } catch (error) {
      if (controller.signal.aborted) return;
      const code = (error as { code?: string })?.code;
      message.error(code === 'ECONNABORTED' || code === 'ETIMEDOUT'
        ? 'AI phản hồi quá lâu. Bạn có thể tiếp tục điền thủ công hoặc thử lại sau.'
        : getErrorMessage(error));
    } finally {
      if (aiRequest.current === controller) {
        aiRequest.current = null;
        setIsAiLoading(false);
      }
    }
  };

  const buildCampaignPayload = (): any => {
    const objectiveMap: Record<string, CampaignObjective> = {
      sales: 'CONVERSION',
      awareness: 'AWARENESS',
      engagement: 'ENGAGEMENT',
      traffic: 'TRAFFIC',
    };
    const platformMap: Record<string, CampaignPlatform> = {
      tiktok: 'TIKTOK',
      instagram: 'INSTAGRAM',
      youtube: 'YOUTUBE',
    };
    const mappedPlatforms = selectedPlatforms
      .map((p) => platformMap[p.toLowerCase()])
      .filter(Boolean) as CampaignPlatform[];

    const minFollowersMap: Record<string, number> = {
      '10k': 10000,
      '50k': 50000,
      '100k': 100000,
      '500k': 500000,
    };
    const parsedMinFollowers = minFollowers ? minFollowersMap[minFollowers.toLowerCase()] : undefined;

    let finalFollowerMin: number | undefined;
    let finalFollowerMax: number | undefined;

    if (minFollowers === '500k' || creatorTier === 'mega') {
      finalFollowerMin = 500000;
      finalFollowerMax = undefined;
    } else if (minFollowers === '100k' || creatorTier === 'macro') {
      finalFollowerMin = 100000;
      finalFollowerMax = 1000000;
    } else if (minFollowers === '50k' || creatorTier === 'micro') {
      finalFollowerMin = 50000;
      finalFollowerMax = 200000;
    } else if (minFollowers === '10k' || creatorTier === 'nano') {
      finalFollowerMin = 10000;
      finalFollowerMax = 50000;
    } else if (parsedMinFollowers) {
      finalFollowerMin = parsedMinFollowers;
      finalFollowerMax = parsedMinFollowers >= 500000 ? undefined : parsedMinFollowers * 5;
    }

    // An explicit minimum is a lower bound, not a creator-tier range.
    if (parsedMinFollowers !== undefined) {
      finalFollowerMin = parsedMinFollowers;
      finalFollowerMax = undefined;
    }

    if (savedFollowerRange.current && savedFollowerRange.current.tier === creatorTier && savedFollowerRange.current.selection === minFollowers) { finalFollowerMin = savedFollowerRange.current.min; finalFollowerMax = savedFollowerRange.current.max; }
    const primaryObj = selectedObjectives[0];
    const niches = interests
      ? interests.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const locations = original.current?.locations?.[0] === formLocation ? original.current.locations : formLocation ? [formLocation === 'nationwide' ? 'Toàn quốc' : formLocation] : [];

    const extraAudiences = original.current?.targetAudiences?.filter(value => !['13-17','18-24','25-34','35-44','45+'].includes(value) && !/^(Khán giả:\s*)?(Nữ|Nam|Female|Male|Tất cả|All)$/i.test(value)) ?? [];
    const audiences = [...extraAudiences, ...selectedAges];
    if (selectedGender === 'female') audiences.push('Khán giả: Nữ');
    else if (selectedGender === 'male') audiences.push('Khán giả: Nam');

    const today = savedStartDate || new Date().toISOString().slice(0, 10);
    const durationDays = campaignDuration === '2_weeks' ? 14 : campaignDuration === '8_weeks' ? 56 : 28;
    const endDefault = new Date(Date.parse(today) + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      name: campaignName.trim(),
      productService: product.trim() || undefined,
      brief: creatorBrief.trim() || undefined,
      objective: objectiveMap[primaryObj],
      platforms: mappedPlatforms,
      startDate: today,
      endDate: savedEndDate || (campaignDuration ? endDefault : undefined),
      deliverables, creatorFeeMin, creatorFeeMax, contentType: original.current?.contentType,
      totalBudget: budgetTotal > 0 ? budgetTotal : undefined,
      currency: 'VND',
      targetCreatorCount: creatorMode === 'SINGLE' ? 1 : Math.max(2, creatorQuantity),
      creatorMode: creatorMode,
      followerMin: finalFollowerMin,
      followerMax: finalFollowerMax,
      niches,
      locations,
      targetAudiences: audiences,
    };
  };

  const isProductLocked = isEditMode && campaignStatus !== 'DRAFT';
  const isPlatformLocked = isEditMode && campaignStatus !== 'DRAFT';

  const writeDraft = async () => {
    if (loadError || isLoadingCampaign) throw new Error('Please reload campaign data before saving.');
    if (campaignStatus !== 'DRAFT') throw new Error('Chỉ có thể sửa bản nháp.');
    if (!campaignName.trim()) throw new Error('Vui lòng nhập tên chiến dịch.');
    const payload = buildCampaignPayload();
    if (payload.deliverables.some((item: any) => !item.contentType.trim() || !item.platform || !Number.isInteger(item.quantity) || item.quantity < 1 || !payload.platforms.includes(item.platform))) throw new Error('Kiểm tra nền tảng, loại nội dung và số lượng ấn phẩm.');
    const result = savedId.current ? await campaignService.updateCampaign(savedId.current, payload, campaignRevision) : await campaignService.createCampaign(payload);
    if (!result?.id) throw new Error('Máy chủ chưa xác nhận lưu chiến dịch.');
    rememberCampaign(result.id); savedId.current = result.id; setCampaignRevision(result.campaignRevision ?? null); setCampaignStatus(result.status);
    return result;
  };
  const persistDraft = () => { if (!draftRequest.current) { setIsSavingDraft(true); draftRequest.current = writeDraft().finally(() => { draftRequest.current = null; setIsSavingDraft(false); }); } return draftRequest.current; };
  const saveDraft = async () => {
    if (saving.current) return; saving.current = true; setIsSavingDraft(true);
    try { const result = await persistDraft(); message.success('Đã lưu bản nháp.'); navigateToEditor(result.id, currentStep); }
    catch (error) { message.error(getErrorMessage(error, 'Không thể lưu bản nháp.')); }
    finally { saving.current = false; setIsSavingDraft(false); }
  };
  const handleUpdateCampaign = saveDraft;
  const handleSaveDraft = saveDraft;

  const handleNextStep = async () => {
    if (isLoadingCampaign || loadError || draftRequest.current || saving.current) return;
    if (currentStep === 1) {
      if (!campaignName.trim()) {
        message.warning('Vui lòng nhập tên chiến dịch!');
        return;
      }
      if (!product.trim()) {
        message.warning('Vui lòng nhập sản phẩm / dịch vụ quảng bá!');
        return;
      }

      if (selectedObjectives.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 mục tiêu chiến dịch!');
        return;
      }
      try { const result = await persistDraft(); navigateToEditor(result.id, 2); setCurrentStep(2); } catch (error) { message.error(getErrorMessage(error, 'Không thể lưu bước này.')); return; }
      scrollToTop();
      message.success('Đã chuyển sang Bước 2: Yêu cầu creator!');
    } else if (currentStep === 2) {
      if (selectedPlatforms.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 nền tảng quảng bá (TikTok, Instagram hoặc YouTube)!');
        return;
      }
      if (!creatorQuantity || creatorQuantity < 1) {
        message.warning('Vui lòng nhập số lượng Creator cần tuyển (tối thiểu 1)!');
        return;
      }
      if (creatorMode === 'MULTI' && creatorQuantity < 2) {
        message.warning('Chiến dịch Đa Creator (MULTI) yêu cầu tuyển tối thiểu 2 Creator!');
        return;
      }




      if (!creatorBrief.trim()) {
        message.warning('Vui lòng nhập tóm tắt yêu cầu sáng tạo (Creator Brief)!');
        return;
      }
      try { const result = await persistDraft(); navigateToEditor(result.id, 3); setCurrentStep(3); } catch (error) { message.error(getErrorMessage(error, 'Không thể lưu bước này.')); return; }
      scrollToTop();
      message.success('Đã chuyển sang Bước 3: Chỉ số & ngân sách!');
    } else if (currentStep === 3) {
      if (!budgetTotal || budgetTotal <= 0) {
        message.warning('Vui lòng nhập tổng ngân sách hợp lệ cho chiến dịch!');
        return;
      }
      if (!campaignDuration && !savedEndDate) {
        message.warning('Vui lòng chọn thời lượng chiến dịch!');
        return;
      }

      if (!deliverables.length) { message.warning('Thêm ít nhất một ấn phẩm ở bước 2.'); return; }
      if (saving.current) return; saving.current = true; setIsSubmitting(true);
      try {
        const saved = await persistDraft();
        const ready = await campaignService.updateStatus(saved.id, 'READY_FOR_DISCOVERY', saved.campaignRevision);
        setCampaignStatus(ready.status); setCampaignRevision(ready.campaignRevision ?? null);
        message.success('Đã chuyển chiến dịch sang sẵn sàng khám phá.');
        navigate('/creators?campaignId=' + saved.id);
      } catch (error) { message.error(getErrorMessage(error, 'Không thể chuẩn bị chiến dịch. Vui lòng kiểm tra các trường bắt buộc.')); }
      finally { saving.current = false; setIsSubmitting(false); }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (savedId.current) navigateToEditor(savedId.current, currentStep - 1);
      scrollToTop();
    }
  };

  return {
    currentStep,
    setCurrentStep,
    loadError, deliverables, setDeliverables, savedEndDate, setSavedEndDate, setSavedStartDate, creatorFeeMin, setCreatorFeeMin, creatorFeeMax, setCreatorFeeMax,
    isSavingDraft,
    isSubmitting,
    campaignStatus,
    campaignRevision,
    savedStartDate,
    isLoadingCampaign,
    campaignName,
    setCampaignName,
    product,
    setProduct,
    selectedObjectives,
    setSelectedObjectives,
    aiPrompt,
    setAiPrompt,
    isAiLoading,
    aiExplanation,
    setAiExplanation,
    isAiAutofilled,
    creatorMode,
    setCreatorMode,
    creatorQuantity,
    setCreatorQuantity,
    creatorTier,
    setCreatorTier,
    minFollowers,
    setMinFollowers,
    selectedPlatforms,
    setSelectedPlatforms,
    selectedAges,
    setSelectedAges,
    selectedGender,
    setSelectedGender,
    formLocation,
    setFormLocation,
    interests,
    setInterests,
    creatorBrief,
    setCreatorBrief,
    budgetTotal,
    setBudgetTotal,
    campaignDuration,
    setCampaignDuration: (value: string) => { setCampaignDuration(value); setSavedEndDate(''); },
    provinceOptions,
    loadingProvinces,
    isProductLocked,
    isPlatformLocked,
    toggleObjective,
    toggleAge,
    togglePlatform,
    handleMinFollowersChange,
    handleAiSuggest,
    handleUpdateCampaign,
    handleSaveDraft,
    handleNextStep,
    handlePrevStep,
    scrollToTop,
  };
}

export default useCreateCampaignForm;

