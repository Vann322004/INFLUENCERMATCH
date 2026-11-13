import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../../services/api/campaignService';
import { getErrorMessage } from '../../../services/apiClient';
import type { CampaignObjective, CampaignPlatform } from '../../../types/api/campaign.types';

interface UseCreateCampaignFormProps {
  resolvedCampaignId: string | null;
  isEditMode: boolean;
  locationState: any;
}

export function useCreateCampaignForm({
  resolvedCampaignId,
  isEditMode,
  locationState,
}: UseCreateCampaignFormProps) {
  const navigate = useNavigate();

  // Wizard Step State (1: Thông tin chiến dịch, 2: Yêu cầu creator, 3: Chỉ số & ngân sách)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Trạng thái chiến dịch (DRAFT, READY_FOR_DISCOVERY, ACTIVE, COMPLETED, ARCHIVED)
  const [campaignStatus, setCampaignStatus] = useState<string>('DRAFT');
  const [campaignRevision, setCampaignRevision] = useState<number | null>(null);
  const [savedStartDate, setSavedStartDate] = useState<string>('');
  const [isLoadingCampaign, setIsLoadingCampaign] = useState<boolean>(false);

  // ================= Step 1 State =================
  const [campaignName, setCampaignName] = useState('');
  const [product, setProduct] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiAutofilled, setIsAiAutofilled] = useState<boolean>(false);

  // ================= Step 2 State =================
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
      setIsLoadingCampaign(true);
      try {
        const applyCampaignData = (camp: any) => {
          if (!camp) return;
          if (camp.status) setCampaignStatus(camp.status);
          if (camp.campaignRevision != null) setCampaignRevision(Number(camp.campaignRevision));
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
              .filter((p: string) => ['tiktok', 'instagram', 'facebook'].includes(p));
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

        const passedCamp =
          locationState?.campaign || locationState?.campaignData;
        if (passedCamp) {
          applyCampaignData(passedCamp);
        }

        const remoteData = await campaignService.getCampaignById(resolvedCampaignId);
        if (isMounted && remoteData) {
          applyCampaignData(remoteData);
        }
      } catch (err) {
        console.warn('Lỗi khi tải thông tin chiến dịch để chỉnh sửa:', err);
      } finally {
        if (isMounted) setIsLoadingCampaign(false);
      }
    };

    loadCampaignDetail();
    return () => {
      isMounted = false;
    };
  }, [isEditMode, resolvedCampaignId, locationState]);

  const toggleObjective = (id: string) => {
    setSelectedObjectives([id]);
  };

  const toggleAge = (age: string) => {
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  };

  const togglePlatform = (p: string) => {
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
    const promptToUse = (typeof overridePrompt === 'string' ? overridePrompt : aiPrompt).trim();
    if (!promptToUse || promptToUse.length < 10) {
      message.warning('Vui lòng nhập mô tả mục tiêu chi tiết hơn (tối thiểu 10 ký tự) để AI gợi ý!');
      return;
    }
    setIsAiLoading(true);
    try {
      message.loading({ content: 'Trợ lý AI đang phân tích và tạo cấu trúc brief chiến dịch...', key: 'ai_suggest' });
      const result = await campaignService.autofillCampaign(promptToUse);
      if (result) {
        if (result.name || result.campaignName) setCampaignName(result.name || result.campaignName || '');
        if (result.productService) setProduct(result.productService);

        if (result.objective) {
          const objLower = String(result.objective).toLowerCase();
          if (objLower.includes('conversion') || objLower.includes('sales')) setSelectedObjectives(['sales']);
          else if (objLower.includes('engagement')) setSelectedObjectives(['engagement']);
          else if (objLower.includes('traffic')) setSelectedObjectives(['traffic']);
          else setSelectedObjectives(['awareness']);
        } else {
          setSelectedObjectives(['awareness']);
        }

        const platformSource = result.platforms || result.preferredPlatforms || [];
        if (Array.isArray(platformSource) && platformSource.length > 0) {
          const cleanP = platformSource
            .map((p) => p.toLowerCase())
            .filter((p) => ['tiktok', 'instagram', 'facebook'].includes(p));
          if (cleanP.length > 0) setSelectedPlatforms(cleanP);
        } else {
          setSelectedPlatforms(['tiktok', 'instagram']);
        }

        if (result.targetAudiences && Array.isArray(result.targetAudiences) && result.targetAudiences.length > 0) {
          setSelectedAges(result.targetAudiences);
        } else {
          setSelectedAges(['18-24']);
        }

        if (result.niches && Array.isArray(result.niches) && result.niches.length > 0) {
          setInterests(result.niches.join(', '));
        } else if (result.niche) {
          setInterests(result.niche);
        }

        if (result.locations && Array.isArray(result.locations) && result.locations.length > 0) {
          setFormLocation(result.locations[0]);
        } else {
          setFormLocation('nationwide');
        }
        setSelectedGender('all');

        if (result.targetCreatorCount) {
          setCreatorQuantity(result.targetCreatorCount);
        } else if (result.creatorQuantity) {
          setCreatorQuantity(result.creatorQuantity);
        } else {
          setCreatorQuantity(1);
        }

        if (result.followerMin || result.followerMax) {
          const fMin = result.followerMin ? Number(result.followerMin) : undefined;
          if (fMin && fMin >= 500000) {
            setCreatorTier('mega');
            setMinFollowers('500k');
          } else if (fMin && fMin >= 100000) {
            setCreatorTier('macro');
            setMinFollowers('100k');
          } else if (fMin && fMin >= 50000) {
            setCreatorTier('micro');
            setMinFollowers('50k');
          } else if (fMin && fMin >= 10000) {
            setCreatorTier('nano');
            setMinFollowers('10k');
          }
        } else {
          setCreatorTier('micro');
          setMinFollowers('50k');
        }

        if (result.totalBudget != null) {
          setBudgetTotal(Number(result.totalBudget));
        } else if (result.budgetMax) {
          setBudgetTotal(result.budgetMax);
        } else if (result.budgetMin) {
          setBudgetTotal(result.budgetMin);
        } else {
          setBudgetTotal(18000000);
        }

        if (result.campaignDuration) {
          setCampaignDuration(result.campaignDuration);
        } else {
          setCampaignDuration('4_weeks');
        }

        if (result.brief) {
          setCreatorBrief(result.brief);
        } else if (result.creatorBrief) {
          setCreatorBrief(result.creatorBrief);
        } else if (result.keyMessage || result.dosAndDonts || (result as any).contentType) {
          const parts: string[] = [];
          if (result.keyMessage) parts.push(`Thông điệp chính:\n${result.keyMessage}`);
          if ((result as any).contentType) parts.push(`Định dạng nội dung:\n${(result as any).contentType}`);
          if (result.dosAndDonts) parts.push(result.dosAndDonts);
          setCreatorBrief(parts.join('\n\n'));
        } else {
          setCreatorBrief(`Thông điệp chính: Quảng bá ${result.productService || product || 'sản phẩm'} với góc nhìn trải nghiệm thực tế, nâng cao nhận diện và thúc đẩy chuyển đổi.\n\nDo's:\n- Quay video cận cảnh chất lượng, trải nghiệm sử dụng thực tế.\n- Kèm hashtag chiến dịch và đường link mua hàng.\n\nDon'ts:\n- Không phóng đại hoặc quảng cáo sai công dụng.\n- Tránh so sánh ác ý hoặc nhắc tên nhãn hàng đối thủ.`);
        }

        if (result.aiExplanation) {
          setAiExplanation(result.aiExplanation);
        } else {
          setAiExplanation(`Trợ lý AI InfluencerMatch đã phân tích mô tả của bạn và tự động điền các thông tin gợi ý về mục tiêu, nền tảng, đối tượng khán giả, ngân sách và cấu trúc Brief. Hãy rà soát và điều chỉnh các trường trước khi tiến hành lưu chiến dịch.`);
        }

        setIsAiAutofilled(true);
        message.success({ content: 'Trợ lý AI đã tự động điền cấu trúc Brief chiến dịch thành công!', key: 'ai_suggest', duration: 3 });
      }
    } catch (error) {
      console.error('Error autofilling campaign with AI:', error);
      message.error({ content: getErrorMessage(error) || 'Không thể kết nối đến Trợ lý AI lúc này.', key: 'ai_suggest' });
    } finally {
      setIsAiLoading(false);
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
      facebook: 'FACEBOOK',
    };
    const mappedPlatforms = selectedPlatforms
      .map((p) => platformMap[p.toLowerCase()])
      .filter((p) => p === 'TIKTOK' || p === 'INSTAGRAM') as CampaignPlatform[];

    const minFollowersMap: Record<string, number> = {
      '10k': 10000,
      '50k': 50000,
      '100k': 100000,
      '500k': 500000,
    };
    const parsedMinFollowers = minFollowers ? minFollowersMap[minFollowers.toLowerCase()] : undefined;

    let finalFollowerMin: number = 50000;
    let finalFollowerMax: number | undefined = 200000;

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

    const primaryObj = selectedObjectives[0] || 'awareness';
    const niches = interests
      ? interests.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Làm đẹp & Mỹ phẩm', 'Chăm sóc da'];
    const locations = formLocation && formLocation !== 'nationwide' ? [formLocation] : ['Toàn quốc'];

    const audiences = [...selectedAges];
    if (selectedGender === 'female') audiences.push('Khán giả: Nữ');
    else if (selectedGender === 'male') audiences.push('Khán giả: Nam');

    const today = savedStartDate || new Date().toISOString().slice(0, 10);
    const durationDays = campaignDuration === '2_weeks' ? 14 : campaignDuration === '8_weeks' ? 56 : 28;
    const endDefault = new Date(Date.parse(today) + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      name: campaignName.trim(),
      productService: product.trim() || 'Sản phẩm mới',
      brief: creatorBrief.trim() || undefined,
      objective: objectiveMap[primaryObj] || 'AWARENESS',
      platforms: mappedPlatforms.length > 0 ? mappedPlatforms : ['TIKTOK', 'INSTAGRAM'],
      startDate: today,
      endDate: endDefault,
      totalBudget: budgetTotal > 0 ? budgetTotal : undefined,
      currency: 'VND',
      targetCreatorCount: creatorQuantity > 0 ? creatorQuantity : undefined,
      creatorMode: creatorQuantity > 0 ? (creatorQuantity === 1 ? 'SINGLE' : 'MULTI') : undefined,
      followerMin: finalFollowerMin,
      followerMax: finalFollowerMax,
      niches,
      locations,
      targetAudiences: audiences.length > 0 ? audiences : ['18-24', '25-34'],
    };
  };

  const isProductLocked = isEditMode && campaignStatus !== 'DRAFT';
  const isPlatformLocked = isEditMode && (campaignStatus === 'ACTIVE' || campaignStatus === 'COMPLETED');

  const handleUpdateCampaign = async () => {
    if (!campaignName.trim()) {
      message.warning('Vui lòng nhập tên chiến dịch!');
      return;
    }
    if (!product.trim()) {
      message.warning('Vui lòng nhập sản phẩm / dịch vụ quảng bá!');
      return;
    }
    if (!interests.trim()) {
      message.warning('Vui lòng nhập ngành hàng & sở thích liên quan!');
      return;
    }
    if (selectedObjectives.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 mục tiêu chiến dịch!');
      return;
    }
    if (selectedPlatforms.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 nền tảng quảng bá!');
      return;
    }
    if (!creatorQuantity || creatorQuantity < 1) {
      message.warning('Vui lòng nhập số lượng Creator cần tuyển (tối thiểu 1)!');
      return;
    }
    if (!minFollowers) {
      message.warning('Vui lòng chọn lượng Follower tối thiểu!');
      return;
    }
    if (!formLocation) {
      message.warning('Vui lòng chọn khu vực / tỉnh thành ưu tiên!');
      return;
    }
    if (selectedAges.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 nhóm độ tuổi người theo dõi mục tiêu!');
      return;
    }
    if (!creatorBrief.trim()) {
      message.warning('Vui lòng nhập tóm tắt yêu cầu sáng tạo (Creator Brief)!');
      return;
    }
    if (!budgetTotal || budgetTotal <= 0) {
      message.warning('Vui lòng nhập tổng ngân sách hợp lệ cho chiến dịch!');
      return;
    }
    if (!campaignDuration) {
      message.warning('Vui lòng chọn thời lượng chiến dịch!');
      return;
    }

    setIsSubmitting(true);
    try {
      message.loading({ content: 'Đang lưu cập nhật thông tin chiến dịch...', key: 'update_camp' });
      const payload = buildCampaignPayload();

      const updated = await campaignService.updateCampaign(resolvedCampaignId!, payload, campaignRevision);
      if (updated?.campaignRevision != null) {
        setCampaignRevision(updated.campaignRevision);
      }

      try {
        const cachedRaw = sessionStorage.getItem('current_campaign_data');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          sessionStorage.setItem(
            'current_campaign_data',
            JSON.stringify({
              ...parsed,
              ...payload,
              id: resolvedCampaignId,
            })
          );
        }
      } catch {}

      message.success({ content: 'Cập nhật thông tin chiến dịch thành công!', key: 'update_camp', duration: 2 });
      navigate(`/campaigns/${resolvedCampaignId}`);
    } catch (err) {
      console.error('Lỗi cập nhật chiến dịch:', err);
      message.error({ content: getErrorMessage(err, 'Không thể cập nhật chiến dịch lúc này.'), key: 'update_camp' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!campaignName.trim()) {
      message.warning('Vui lòng nhập tên chiến dịch trước khi lưu bản nháp!');
      return;
    }

    setIsSavingDraft(true);
    try {
      message.loading({ content: 'Đang lưu chiến dịch vào danh sách bản nháp...', key: 'save_draft' });
      const payload = buildCampaignPayload();

      const createdCampaign = await campaignService.createCampaign(payload);
      if (!createdCampaign?.id) throw new Error('Server did not return a saved campaign ID.');
      const targetCampaignId = createdCampaign.id;
      try {
        localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', targetCampaignId);
      } catch {}

      message.success({ content: 'Chiến dịch đã được lưu bản nháp thành công!', key: 'save_draft', duration: 2 });
      navigate('/campaign-management?tab=draft');
    } catch (err) {
      console.error('Lỗi khi lưu bản nháp:', err);
      message.error({ content: getErrorMessage(err, 'Không thể lưu bản nháp lúc này.'), key: 'save_draft' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!campaignName.trim()) {
        message.warning('Vui lòng nhập tên chiến dịch!');
        return;
      }
      if (!product.trim()) {
        message.warning('Vui lòng nhập sản phẩm / dịch vụ quảng bá!');
        return;
      }
      if (!interests.trim()) {
        message.warning('Vui lòng nhập ngành hàng & sở thích liên quan!');
        return;
      }
      if (selectedObjectives.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 mục tiêu chiến dịch!');
        return;
      }
      setCurrentStep(2);
      scrollToTop();
      message.success('Đã chuyển sang Bước 2: Yêu cầu creator!');
    } else if (currentStep === 2) {
      if (selectedPlatforms.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 nền tảng quảng bá (TikTok, Instagram hoặc Facebook)!');
        return;
      }
      if (!creatorQuantity || creatorQuantity < 1) {
        message.warning('Vui lòng nhập số lượng Creator cần tuyển (tối thiểu 1)!');
        return;
      }
      if (!minFollowers) {
        message.warning('Vui lòng chọn lượng Follower tối thiểu!');
        return;
      }
      if (!formLocation) {
        message.warning('Vui lòng chọn khu vực / tỉnh thành ưu tiên!');
        return;
      }
      if (selectedAges.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 nhóm độ tuổi người theo dõi mục tiêu!');
        return;
      }
      if (!selectedGender) {
        message.warning('Vui lòng chọn giới tính khán giả!');
        return;
      }
      if (!creatorBrief.trim()) {
        message.warning('Vui lòng nhập tóm tắt yêu cầu sáng tạo (Creator Brief)!');
        return;
      }
      setCurrentStep(3);
      scrollToTop();
      message.success('Đã chuyển sang Bước 3: Chỉ số & ngân sách!');
    } else if (currentStep === 3) {
      if (!budgetTotal || budgetTotal <= 0) {
        message.warning('Vui lòng nhập tổng ngân sách hợp lệ cho chiến dịch!');
        return;
      }
      if (!campaignDuration) {
        message.warning('Vui lòng chọn thời lượng chiến dịch!');
        return;
      }

      setIsSubmitting(true);
      try {
        message.loading({ content: 'Đang khởi tạo chiến dịch & chuẩn bị đề xuất...', key: 'create_camp' });
        const payload = buildCampaignPayload();

        const createdCampaign = await campaignService.createCampaign(payload);
        if (!createdCampaign?.id) throw new Error('Server did not return a saved campaign ID.');
        const targetCampaignId = createdCampaign.id;

        try {
          localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', targetCampaignId);
          localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify({
            targetCreatorCount: creatorQuantity,
            id: targetCampaignId,
            name: createdCampaign?.name || campaignName.trim() || 'Chiến dịch mới',
            budget: budgetTotal ? `${(budgetTotal / 1_000_000).toFixed(0)} Triệu VND` : '25.0M VND',
            targetAudience: payload.targetAudiences?.join(', '),
            category: payload.niches?.[0] || 'Làm đẹp & Mỹ phẩm',
            channels: payload.platforms?.map((p: string) => p.toLowerCase()) || ['tiktok'],
            status: createdCampaign.status || 'DRAFT',
            requirements: creatorBrief || product,
            followerMin: payload.followerMin,
            followerMax: payload.followerMax,
          }));
        } catch (storageErr) {
          console.warn('Cannot write to localStorage:', storageErr);
        }

        message.success({ content: 'Chiến dịch đã khởi tạo thành công! Đang kích hoạt Trợ lý Đề xuất Creator...', key: 'create_camp', duration: 2 });
        navigate('/creators?autoRun=true', {
          state: {
            campaignId: targetCampaignId,
            createdCampaign: {
              ...(createdCampaign || {}),
              followerMin: payload.followerMin,
              followerMax: payload.followerMax,
            },
          },
        });
      } catch (err) {
        message.error({ content: getErrorMessage(err, 'Không thể tạo chiến dịch.'), key: 'create_camp' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      scrollToTop();
    }
  };

  return {
    currentStep,
    setCurrentStep,
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
    setCampaignDuration,
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

