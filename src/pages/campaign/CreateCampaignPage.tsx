import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Progress,
  Space,
  Checkbox,
  InputNumber,
  Radio,
  DatePicker,
  Divider,
  message,
  Tooltip,
  Alert,
  Spin,
} from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import { getErrorMessage } from '../../services/apiClient';
import type { CampaignObjective, CampaignPlatform } from '../../types/api/campaign.types';
import './CreateCampaignPage.css';
import {
  RightOutlined,
  LeftOutlined,
  CompassOutlined,
  CheckOutlined,
  StarOutlined,
  ThunderboltOutlined,
  AimOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  SendOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  BarChartOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  RobotOutlined,
  UserOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  CheckCircleFilled,
  SaveOutlined,
  ThunderboltFilled,
  LockOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AI_SAMPLE_PROMPTS = [
  {
    label: '🧴 Kem dưỡng phục hồi da Gen-Z',
    prompt: 'Quảng bá dòng kem dưỡng phục hồi da dành cho giới trẻ 18-24 tuổi tại Hà Nội và TP.HCM, ngân sách tầm 25 triệu trên TikTok và Instagram',
  },
  {
    label: '⚡ Phụ kiện sạc nhanh công nghệ',
    prompt: 'Tìm kiếm creator công nghệ review phụ kiện sạc nhanh cho người trẻ 18-35 tuổi, ngân sách 30 triệu trên TikTok và Facebook',
  },
  {
    label: '👗 Thời trang dạo phố OOTD',
    prompt: 'Quảng bá BST thời trang dạo phố năng động cho nữ giới 18-24 tuổi tại TP.HCM, ngân sách 20 triệu trên Instagram và TikTok',
  },
];

export default function CreateCampaignPage() {
  const navigate = useNavigate();
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

  // Wizard Step State (1: Thông tin chiến dịch, 2: Yêu cầu creator, 3: Chỉ số & ngân sách)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Trạng thái chiến dịch (DRAFT, READY_FOR_DISCOVERY, ACTIVE, COMPLETED, ARCHIVED)
  const [campaignStatus, setCampaignStatus] = useState<string>('DRAFT');
  const [isLoadingCampaign, setIsLoadingCampaign] = useState<boolean>(false);

  // ================= Step 1 State =================
  const [campaignName, setCampaignName] = useState('');
  const [product, setProduct] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [draftDeadline, setDraftDeadline] = useState<string>('7 ngày sau khi Creator nhận sản phẩm');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // ================= Step 2 State =================
  const [creatorQuantity, setCreatorQuantity] = useState<number>(10);
  const [creatorTier, setCreatorTier] = useState<string>('micro');
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [minEngagement, setMinEngagement] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [locationState, setLocationState] = useState<string>('nationwide');
  const [interests, setInterests] = useState<string>('');
  const [creatorBrief, setCreatorBrief] = useState<string>('');

  // ================= Step 3 State =================
  const [budgetTotal, setBudgetTotal] = useState<number>(0);
  const [paymentModel, setPaymentModel] = useState<string>('cash');
  const [targetReach, setTargetReach] = useState<string>('');
  const [targetEngagementRate, setTargetEngagementRate] = useState<string>('');
  const [targetConversions, setTargetConversions] = useState<number>(0);
  const [campaignDuration, setCampaignDuration] = useState<string>('4_weeks');

  // Provinces API State
  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([
    { value: 'nationwide', label: '📍 Toàn quốc' },
    { value: 'Thành phố Hà Nội', label: '📍 Thành phố Hà Nội' },
    { value: 'Thành phố Hồ Chí Minh', label: '📍 Thành phố Hồ Chí Minh' },
    { value: 'Thành phố Đà Nẵng', label: '📍 Thành phố Đà Nẵng' },
    { value: 'Thành phố Hải Phòng', label: '📍 Thành phố Hải Phòng' },
    { value: 'Thành phố Cần Thơ', label: '📍 Thành phố Cần Thơ' },
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
              { value: 'nationwide', label: '📍 Toàn quốc' },
              ...data.map((item: { name: string; code: number }) => ({
                value: item.name,
                label: `📍 ${item.name}`,
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
          if (camp.name) setCampaignName(camp.name);
          if (camp.productService) setProduct(camp.productService);
          if (camp.description) setCreatorBrief(camp.description);

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
          if (camp.budgetMax) setBudgetTotal(camp.budgetMax);
          else if (camp.budgetMin) setBudgetTotal(camp.budgetMin);

          // Ngành hàng / Niches
          if (camp.niches && Array.isArray(camp.niches)) {
            setInterests(camp.niches.join(', '));
          }

          // Địa điểm
          if (camp.locations && Array.isArray(camp.locations) && camp.locations.length > 0) {
            setLocationState(camp.locations[0]);
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
            const maxF = camp.followerMax || 200000;
            if (maxF <= 50000) setCreatorTier('nano');
            else if (maxF <= 200000) setCreatorTier('micro');
            else if (maxF <= 1000000) setCreatorTier('macro');
            else setCreatorTier('mega');
          }
        };

        // Ưu tiên load ngay từ state passed nếu có
        const passedCamp =
          (location.state as any)?.campaign || (location.state as any)?.campaignData;
        if (passedCamp) {
          applyCampaignData(passedCamp);
        }

        // Tải dữ liệu mới nhất từ backend API GET /campaigns/{id}
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
  }, [isEditMode, resolvedCampaignId]);

  // Objectives List
  const objectives = [
    {
      id: 'awareness',
      title: 'Tăng nhận diện thương hiệu',
      subtitle: 'Tiếp cận nhiều người hơn',
      icon: <AimOutlined style={{ fontSize: 18 }} />,
    },
    {
      id: 'sales',
      title: 'Tăng doanh số',
      subtitle: 'Thúc đẩy chuyển đổi',
      icon: <ShoppingCartOutlined style={{ fontSize: 18 }} />,
    },
    {
      id: 'engagement',
      title: 'Tạo tương tác',
      subtitle: 'Tăng thích, bình luận, chia sẻ',
      icon: <MessageOutlined style={{ fontSize: 18 }} />,
    },
    {
      id: 'launch',
      title: 'Ra mắt sản phẩm mới',
      subtitle: 'Giới thiệu sản phẩm/dịch vụ',
      icon: <ThunderboltOutlined style={{ fontSize: 18 }} />,
    },
  ];

  // Age Groups
  const ageGroups = ['13-17', '18-24', '25-34', '35-44', '45+'];

  // Genders
  const genders = [
    { key: 'all', label: 'Tất cả' },
    { key: 'male', label: 'Nam' },
    { key: 'female', label: 'Nữ' },
    { key: 'other', label: 'Khác' },
  ];

  const toggleObjective = (id: string) => {
    setSelectedObjectives((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id]
    );
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

  const handleAiSuggest = async (overridePrompt?: string) => {
    const promptToUse = (typeof overridePrompt === 'string' ? overridePrompt : aiPrompt).trim();
    if (!promptToUse || promptToUse.length < 5) {
      message.warning('Vui lòng nhập mô tả mục tiêu chi tiết hơn (tối thiểu 5 ký tự) để AI gợi ý!');
      return;
    }
    setIsAiLoading(true);
    try {
      message.loading({ content: 'AI đang phân tích và tối ưu hóa thông tin chiến dịch...', key: 'ai_suggest' });
      const result = await campaignService.autofillCampaign(promptToUse);
      if (result) {
        if (result.name) setCampaignName(result.name);
        if (result.productService) setProduct(result.productService);
        if (result.objective) {
          const objLower = String(result.objective).toLowerCase();
          if (objLower.includes('conversion') || objLower.includes('sales')) setSelectedObjectives(['sales']);
          else if (objLower.includes('engagement')) setSelectedObjectives(['engagement']);
          else if (objLower.includes('traffic')) setSelectedObjectives(['traffic']);
          else setSelectedObjectives(['awareness']);
        }
        if (result.platforms && Array.isArray(result.platforms) && result.platforms.length > 0) {
          const cleanP = result.platforms
            .map((p) => p.toLowerCase())
            .filter((p) => ['tiktok', 'instagram', 'facebook'].includes(p));
          if (cleanP.length > 0) setSelectedPlatforms(cleanP);
        }
        if (result.targetAudiences && Array.isArray(result.targetAudiences) && result.targetAudiences.length > 0) {
          setSelectedAges(result.targetAudiences);
        }
        if (result.niches && Array.isArray(result.niches) && result.niches.length > 0) {
          setInterests(result.niches.join(', '));
        }
        if (result.locations && Array.isArray(result.locations) && result.locations.length > 0) {
          setLocationState(result.locations[0]);
        }
        if (result.budgetMax) {
          setBudgetTotal(result.budgetMax);
        } else if (result.budgetMin) {
          setBudgetTotal(result.budgetMin);
        }
        if (!minEngagement) setMinEngagement('5%');
        if (!minFollowers) setMinFollowers('50k');
        if (!targetReach) setTargetReach('250,000 lượt xem');
        if (!targetEngagementRate) setTargetEngagementRate('5.0%');
        if (!targetConversions || targetConversions <= 0) setTargetConversions(50);
        if (promptToUse) {
          setCreatorBrief(`Yêu cầu sáng tạo: Video review trải nghiệm thực tế ${result.productService || product}, nêu bật công dụng nổi bật và hướng dẫn sử dụng sản phẩm.`);
        }
        if (result.aiExplanation) {
          setAiExplanation(result.aiExplanation);
        }
        message.success({ content: '🎉 AI đã điền tự động các thông số chiến dịch thành công!', key: 'ai_suggest', duration: 3 });
      }
    } catch (error) {
      console.error('Error autofilling campaign with AI:', error);
      message.error({ content: getErrorMessage(error) || 'Không thể kết nối đến Trợ lý AI lúc này.', key: 'ai_suggest' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const scrollToTop = () => {
    const mainContent = document.querySelector('main.ant-layout-content') || document.querySelector('.ant-layout-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Build unified CampaignRequest payload
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
      youtube: 'YOUTUBE',
    };
    const mappedPlatforms = selectedPlatforms
      .map((p) => platformMap[p.toLowerCase()])
      .filter(Boolean) as CampaignPlatform[];

    // Map phân khúc creator sang followerMin / followerMax cho backend
    const tierFollowersMap: Record<string, { min: number; max: number }> = {
      nano: { min: 5000, max: 50000 },
      micro: { min: 50000, max: 200000 },
      macro: { min: 200000, max: 1000000 },
      mega: { min: 1000000, max: 10000000 },
    };
    const tierRange = tierFollowersMap[creatorTier] || { min: 50000, max: 200000 };

    const primaryObj = selectedObjectives[0] || 'awareness';
    const niches = interests
      ? interests.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Làm đẹp & Mỹ phẩm', 'Chăm sóc da'];
    const locations = locationState && locationState !== 'nationwide' ? [locationState] : ['Toàn quốc'];
    
    // Tích hợp độ tuổi và giới tính vào targetAudiences
    const audiences = [...selectedAges];
    if (selectedGender === 'female') audiences.push('Khán giả: Nữ');
    else if (selectedGender === 'male') audiences.push('Khán giả: Nam');

    return {
      name: campaignName.trim(),
      productService: product.trim() || 'Sản phẩm mới',
      description: creatorBrief.trim() || undefined,
      objective: objectiveMap[primaryObj] || 'AWARENESS',
      platforms: mappedPlatforms.length > 0 ? mappedPlatforms : ['TIKTOK', 'INSTAGRAM'],
      budgetMin: budgetTotal ? Math.round(budgetTotal * 0.8) : 10000000,
      budgetMax: budgetTotal || 25000000,
      followerMin: tierRange.min,
      followerMax: tierRange.max,
      niches,
      locations,
      targetAudiences: audiences.length > 0 ? audiences : ['18-24', '25-34'],
    };
  };

  // Helper hiển thị badge trạng thái
  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return { label: 'Đang triển khai', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: 'Chiến dịch đang chạy thực tế' };
      case 'READY_FOR_DISCOVERY':
        return { label: 'Sẵn sàng đề xuất', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', text: 'Đang tìm kiếm & kết nối KOC' };
      case 'COMPLETED':
        return { label: 'Đã hoàn thành', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', text: 'Chiến dịch đã kết thúc' };
      case 'ARCHIVED':
        return { label: 'Đã lưu trữ', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', text: 'Chiến dịch đã lưu trữ' };
      default:
        return { label: 'Bản nháp', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', text: 'Chưa khởi chạy chính thức' };
    }
  };

  // Khóa trường dữ liệu khi chiến dịch không còn là DRAFT
  // Cụ thể: Sản phẩm quảng bá không thể đổi vì đã brief / ký hợp đồng với KOC
  const isProductLocked = isEditMode && campaignStatus !== 'DRAFT';
  const isPlatformLocked = isEditMode && (campaignStatus === 'ACTIVE' || campaignStatus === 'COMPLETED');

  // Handler: Cập nhật thông tin chiến dịch (Update Mode)
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
    if (!creatorTier) {
      message.warning('Vui lòng chọn phân khúc Creator ưu tiên!');
      return;
    }
    if (!minEngagement) {
      message.warning('Vui lòng chọn tỷ lệ tương tác tối thiểu (ER)!');
      return;
    }
    if (!minFollowers) {
      message.warning('Vui lòng chọn lượng Follower tối thiểu!');
      return;
    }
    if (!locationState) {
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
    if (!paymentModel) {
      message.warning('Vui lòng chọn hình thức thù lao cho Creator!');
      return;
    }
    if (!campaignDuration) {
      message.warning('Vui lòng chọn thời lượng chiến dịch!');
      return;
    }
    if (!draftDeadline.trim()) {
      message.warning('Vui lòng nhập hạn chót duyệt kịch bản (Draft Deadline)!');
      return;
    }
    if (!targetReach.trim()) {
      message.warning('Vui lòng nhập lượt tiếp cận mục tiêu!');
      return;
    }
    if (!targetEngagementRate.trim()) {
      message.warning('Vui lòng nhập tỷ lệ tương tác kỳ vọng!');
      return;
    }
    if (targetConversions === undefined || targetConversions === null || Number(targetConversions) <= 0) {
      message.warning('Vui lòng nhập số lượng chuyển đổi đơn hàng ước tính (tối thiểu 1 đơn)!');
      return;
    }

    setIsSubmitting(true);
    try {
      message.loading({ content: 'Đang lưu cập nhật thông tin chiến dịch...', key: 'update_camp' });
      const payload = buildCampaignPayload();

      // Gọi API cập nhật thông tin chiến dịch chuẩn Swagger PUT /campaigns/{id}
      await campaignService.updateCampaign(resolvedCampaignId!, payload);

      // Cập nhật lại sessionStorage nếu có cache
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

      message.success({ content: '🎉 Cập nhật thông tin chiến dịch thành công!', key: 'update_camp', duration: 2 });
      navigate(`/campaigns/${resolvedCampaignId}`);
    } catch (err) {
      console.error('Lỗi cập nhật chiến dịch:', err);
      message.error({ content: getErrorMessage(err, 'Không thể cập nhật chiến dịch lúc này.'), key: 'update_camp' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Lưu bản nháp (Save Draft)
  const handleSaveDraft = async () => {
    if (!campaignName.trim()) {
      message.warning('Vui lòng nhập tên chiến dịch trước khi lưu bản nháp!');
      return;
    }

    setIsSavingDraft(true);
    try {
      message.loading({ content: 'Đang lưu chiến dịch vào danh sách bản nháp...', key: 'save_draft' });
      const payload = buildCampaignPayload();

      let createdCampaign: any = null;
      try {
        createdCampaign = await campaignService.createCampaign(payload);
      } catch (apiErr) {
        console.warn('API createCampaign error, falling back locally:', apiErr);
        createdCampaign = {
          id: `camp-draft-${Date.now()}`,
          ...payload,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
        };
      }

      const targetCampaignId = createdCampaign?.id || `camp-draft-${Date.now()}`;
      try {
        localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', targetCampaignId);
      } catch {}

      message.success({ content: ' Chiến dịch đã được lưu bản nháp thành công!', key: 'save_draft', duration: 2 });
      // Điều hướng trực tiếp về tab Bản nháp trên trang Quản lý Chiến dịch
      navigate('/campaign-management?tab=draft');
    } catch (err) {
      console.error('Lỗi khi lưu bản nháp:', err);
      message.error({ content: getErrorMessage(err, 'Không thể lưu bản nháp lúc này.'), key: 'save_draft' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Next step handler with validation and automatic READY_FOR_DISCOVERY transition
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
      if (!creatorTier) {
        message.warning('Vui lòng chọn phân khúc Creator ưu tiên!');
        return;
      }
      if (!minEngagement) {
        message.warning('Vui lòng chọn tỷ lệ tương tác tối thiểu (ER)!');
        return;
      }
      if (!minFollowers) {
        message.warning('Vui lòng chọn lượng Follower tối thiểu!');
        return;
      }
      if (!locationState) {
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
      if (!paymentModel) {
        message.warning('Vui lòng chọn hình thức thù lao cho Creator!');
        return;
      }
      if (!campaignDuration) {
        message.warning('Vui lòng chọn thời lượng chiến dịch!');
        return;
      }
      if (!draftDeadline.trim()) {
        message.warning('Vui lòng nhập hạn chót duyệt kịch bản (Draft Deadline)!');
        return;
      }
      if (!targetReach.trim()) {
        message.warning('Vui lòng nhập lượt tiếp cận mục tiêu kỳ vọng!');
        return;
      }
      if (!targetEngagementRate.trim()) {
        message.warning('Vui lòng nhập tỷ lệ tương tác kỳ vọng!');
        return;
      }
      if (targetConversions === undefined || targetConversions === null || Number(targetConversions) <= 0) {
        message.warning('Vui lòng nhập số lượng đơn hàng chuyển đổi ước tính (tối thiểu 1 đơn)!');
        return;
      }

      setIsSubmitting(true);
      try {
        message.loading({ content: 'Đang khởi tạo chiến dịch & chuẩn bị đề xuất...', key: 'create_camp' });
        const payload = buildCampaignPayload();

        let createdCampaign: any = null;
        try {
          createdCampaign = await campaignService.createCampaign(payload);
        } catch (apiErr) {
          console.warn('API createCampaign error, continuing with fallback object:', apiErr);
          createdCampaign = {
            id: `camp-${Date.now()}`,
            ...payload,
            status: 'READY_FOR_DISCOVERY',
          };
        }

        const targetCampaignId = createdCampaign?.id || `camp-${Date.now()}`;

        // Chuyển tiếp trạng thái chiến dịch sang READY_FOR_DISCOVERY theo quy chuẩn backend
        try {
          await campaignService.updateStatus(targetCampaignId, 'READY_FOR_DISCOVERY');
        } catch (statusErr) {
          console.warn('Backend updateStatus READY_FOR_DISCOVERY notice:', statusErr);
        }

        // Cache campaign details to localStorage so discovery page immediately selects and matches creators
        try {
          localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', targetCampaignId);
          localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify({
            id: targetCampaignId,
            name: createdCampaign?.name || campaignName.trim(),
            budget: budgetTotal ? `${(budgetTotal / 1_000_000).toFixed(0)} Triệu VND` : '25.0M VND',
            targetAudience: payload.targetAudiences?.join(', '),
            category: payload.niches?.[0] || 'Làm đẹp & Mỹ phẩm',
            channels: payload.platforms?.map((p: string) => p.toLowerCase()) || ['tiktok'],
            status: 'READY_FOR_DISCOVERY',
            requirements: creatorBrief || product,
          }));
        } catch (storageErr) {
          console.warn('Cannot write to localStorage:', storageErr);
        }

        message.success({ content: '🎉 Chiến dịch đã khởi tạo thành công! Đang kích hoạt Trợ lý Đề xuất Creator...', key: 'create_camp', duration: 2 });
        navigate('/creators?autoRun=true', {
          state: {
            campaignId: targetCampaignId,
            createdCampaign,
          },
        });
      } catch (err) {
        message.error({ content: getErrorMessage(err, 'Không thể tạo chiến dịch.'), key: 'create_camp' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Previous step handler
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      scrollToTop();
    }
  };

  // Readiness Score based on current step
  const readinessPercent = currentStep === 1 ? 65 : currentStep === 2 ? 85 : 100;

  return (
    <div className="ccreate-container">
      {/* 1. Header Section */}
      <div className="ccreate-header">
        <div className="ccreate-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            {isEditMode && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(resolvedCampaignId ? `/campaigns/${resolvedCampaignId}` : '/campaigns')}
                style={{ padding: '4px 8px', borderRadius: 8, color: '#4F46E5', fontWeight: 600, fontSize: 13 }}
              >
                Quay lại chi tiết
              </Button>
            )}
            <h1 style={{ margin: 0 }}>
              {isEditMode ? 'Chỉnh sửa thông tin chiến dịch' : 'Tạo chiến dịch mới'}
            </h1>
            {isEditMode && (
              <Tag
                style={{
                  backgroundColor: getStatusBadge(campaignStatus).bg,
                  borderColor: getStatusBadge(campaignStatus).border,
                  color: getStatusBadge(campaignStatus).color,
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '2px 10px',
                  borderRadius: 8,
                }}
              >
                {getStatusBadge(campaignStatus).label}
              </Tag>
            )}
          </div>
          <p>
            {isEditMode
              ? `Cập nhật thông số chiến lược, mục tiêu và ngân sách cho chiến dịch: ${campaignName}`
              : 'Thiết lập thông tin chiến dịch để AI gợi ý chiến lược, đối tượng và tối ưu hóa hiệu quả thực thi.'}
          </p>
        </div>

        {/* Executive Readiness Pill */}
        <div
          className="ccreate-readiness-pill"
          onClick={() => setIsAiSummaryOpen(!isAiSummaryOpen)}
          title="Xem đánh giá & Gợi ý từ AI"
        >
          <Progress
            type="circle"
            percent={readinessPercent}
            size={34}
            strokeWidth={8}
            strokeColor="#4F46E5"
            format={(pct) => (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5' }}>{pct}%</span>
            )}
          />
          <div className="ccreate-readiness-text">
            <span className="ccreate-readiness-label">Độ sẵn sàng: {readinessPercent}%</span>
            <span className="ccreate-readiness-sub">
              {isAiSummaryOpen ? 'Đóng gợi ý AI ▴' : 'Gợi ý từ AI ▸'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Interactive Wizard Steps Bar */}
      <div className="ccreate-stepper-card">
        <div className="ccreate-stepper-grid">
          {/* Step 1 */}
          <div
            className={`ccreate-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
            onClick={() => {
              setCurrentStep(1);
              scrollToTop();
            }}
          >
            <div className="ccreate-step-num">
              {currentStep > 1 ? <CheckOutlined /> : '1'}
            </div>
            <div className="ccreate-step-info">
              <span className="ccreate-step-title">Thông tin chiến dịch</span>
              <span className="ccreate-step-desc">Tên, sản phẩm, mục tiêu</span>
            </div>
          </div>

          <div className={`ccreate-stepper-connector ${currentStep >= 2 ? 'active' : ''}`} />

          {/* Step 2 */}
          <div
            className={`ccreate-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
            onClick={() => {
              setCurrentStep(2);
              scrollToTop();
            }}
          >
            <div className="ccreate-step-num">
              {currentStep > 2 ? <CheckOutlined /> : '2'}
            </div>
            <div className="ccreate-step-info">
              <span className="ccreate-step-title">Yêu cầu Creator</span>
              <span className="ccreate-step-desc">Đối tượng, nội dung, tiêu chí</span>
            </div>
          </div>

          <div className={`ccreate-stepper-connector ${currentStep >= 3 ? 'active' : ''}`} />

          {/* Step 3 */}
          <div
            className={`ccreate-step-item ${currentStep === 3 ? 'active' : ''}`}
            onClick={() => {
              setCurrentStep(3);
              scrollToTop();
            }}
          >
            <div className="ccreate-step-num">3</div>
            <div className="ccreate-step-info">
              <span className="ccreate-step-title">Chỉ số & Ngân sách</span>
              <span className="ccreate-step-desc">KPI, ngân sách, thời gian</span>
            </div>
          </div>
        </div>
      </div>

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
                        {isProductLocked
                          ? `Chiến dịch đang ${getStatusBadge(campaignStatus).label}. Bạn có thể cập nhật tên chiến dịch, mô tả brief, ngân sách và tiêu chí KOC. Sản phẩm quảng bá được khóa để bảo vệ hợp đồng.`
                          : 'Bạn có thể tự do cập nhật mọi thông tin chiến lược, đối tượng và ngân sách của chiến dịch.'}
                      </span>
                    </div>
                    <Tag
                      style={{
                        backgroundColor: getStatusBadge(campaignStatus).bg,
                        borderColor: getStatusBadge(campaignStatus).border,
                        color: getStatusBadge(campaignStatus).color,
                        fontWeight: 700,
                        borderRadius: 6,
                        margin: 0,
                      }}
                    >
                      {getStatusBadge(campaignStatus).label}
                    </Tag>
                  </div>
                }
                type={isProductLocked ? 'warning' : 'info'}
                showIcon
                style={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
              />
            )}

            {/* 3. AI Assistant Hero Card - Elegant & Pastel */}
            <div className="ccreate-ai-hero-card">
              <div className="ccreate-ai-hero-header">
                <div className="ccreate-ai-hero-title-group">
                  <div className="ccreate-ai-hero-icon">
                    <ThunderboltFilled />
                  </div>
                  <div>
                    <span className="ccreate-ai-hero-title">Trợ lý AI Chiến dịch</span>
                    <span className="ccreate-ai-hero-sub" style={{ marginLeft: 8 }}>
                      Tự động phân tích brief, trích xuất mục tiêu & đề xuất cấu hình phù hợp
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Input Row */}
              <div className="ccreate-ai-input-wrap">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ví dụ: Quảng bá dòng kem dưỡng phục hồi da dành cho giới trẻ 18-24 tuổi tại Hà Nội và TP.HCM, ngân sách tầm 25 triệu trên TikTok và Instagram..."
                  className="ccreate-ai-input-field"
                  onPressEnter={() => handleAiSuggest()}
                />
                <Button
                  type="primary"
                  icon={<ThunderboltFilled />}
                  loading={isAiLoading}
                  onClick={() => handleAiSuggest()}
                  className="ccreate-ai-action-btn"
                >
                  Phân tích bằng AI
                </Button>
              </div>

              {/* Sample Prompt Chips */}
              <div className="ccreate-ai-samples-strip">
                <span className="ccreate-ai-samples-label">Gợi ý mẫu:</span>
                {AI_SAMPLE_PROMPTS.map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className="ccreate-ai-sample-chip"
                    onClick={() => {
                      setAiPrompt(item.prompt);
                      handleAiSuggest(item.prompt);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* AI Processing Spin Indicator */}
              {isAiLoading && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(237, 233, 254, 0.7)',
                    border: '1px dashed #A78BFA',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Spin size="small" />
                  <span style={{ fontSize: 12.5, color: '#6D28D9', fontWeight: 600 }}>
                    Trợ lý AI đang phân tích yêu cầu và tự động điền các thông số vào từng bước...
                  </span>
                </div>
              )}

              {/* AI Explanation Alert nếu có */}
              {aiExplanation && !isAiLoading && (
                <Alert
                  style={{
                    borderRadius: 12,
                    border: '1px solid #C4B5FD',
                    background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 50%, #EDE9FE 100%)',
                    padding: '10px 16px',
                  }}
                  message={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#5B21B6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <RobotOutlined style={{ fontSize: 15, color: '#7C3AED' }} /> Chiến lược phân tích từ AI
                      </span>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setAiExplanation(null)}
                        style={{ color: '#7C3AED', fontWeight: 600, fontSize: 11.5 }}
                      >
                        Đóng
                      </Button>
                    </div>
                  }
                  description={
                    <div>
                      <p style={{ margin: '2px 0 8px 0', fontSize: 12.5, color: '#4C1D95', lineHeight: 1.5 }}>
                        {aiExplanation}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <Tag style={{ background: '#FFFFFF', borderColor: '#DDD6FE', color: '#6D28D9', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
                          ✓ Bước 1: Tên, Sản phẩm & Mục tiêu
                        </Tag>
                        <Tag style={{ background: '#FFFFFF', borderColor: '#DDD6FE', color: '#6D28D9', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
                          ✓ Bước 2: Nền tảng, Niche & Độ tuổi
                        </Tag>
                        <Tag style={{ background: '#FFFFFF', borderColor: '#DDD6FE', color: '#6D28D9', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
                          ✓ Bước 3: Ngân sách & KPI
                        </Tag>
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon={false}
                />
              )}
            </div>

            {/* ========================================================================= */}
            {/* ============================ BƯỚC 1 CONTENT ============================= */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="ccreate-card">
                <div className="ccreate-card-header">
                  <div className="ccreate-card-badge">1</div>
                  <div>
                    <div className="ccreate-card-title">Thông tin chiến dịch & Mục tiêu tiếp thị</div>
                    <div className="ccreate-card-subtitle">
                      Cung cấp các thông tin cơ bản về sản phẩm và định hướng mục tiêu để hệ thống tối ưu hóa đề xuất.
                    </div>
                  </div>
                </div>

                {/* Phần 1: Tên chiến dịch & Sản phẩm */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <div className="ccreate-field-label">
                      <span>Tên chiến dịch <span className="req">*</span></span>
                      <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>{campaignName.length}/100</span>
                    </div>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      maxLength={100}
                      placeholder="Ví dụ: Summer Glow Skincare Launch 2026"
                      style={{ borderRadius: 10, height: 40, fontSize: 13 }}
                    />
                  </Col>

                  <Col xs={24} md={12}>
                    <div className="ccreate-field-label">
                      <span>Sản phẩm / Dịch vụ được quảng bá <span className="req">*</span></span>
                      {isProductLocked && (
                        <Tooltip title="Chiến dịch đã khởi chạy hoặc chốt KOC. Tên sản phẩm được khóa để bảo vệ tính nhất quán của hợp đồng.">
                          <Tag color="orange" icon={<LockOutlined />} style={{ borderRadius: 6, fontSize: 11, cursor: 'help', margin: 0 }}>
                            Đã khóa
                          </Tag>
                        </Tooltip>
                      )}
                    </div>
                    <Input
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="Nhập tên sản phẩm hoặc dịch vụ (ví dụ: Serum dưỡng sáng da, Kem chống nắng...)"
                      style={{
                        borderRadius: 10,
                        height: 40,
                        fontSize: 13,
                        backgroundColor: isProductLocked ? '#F8FAFC' : undefined,
                        borderColor: isProductLocked ? '#E2E8F0' : undefined,
                      }}
                      disabled={isProductLocked}
                      suffix={isProductLocked ? <LockOutlined style={{ color: '#94A3B8' }} /> : undefined}
                      allowClear={!isProductLocked}
                    />
                    {isProductLocked && (
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        🔒 Tên sản phẩm cố định theo chiến dịch đã ký kết với creator.
                      </div>
                    )}
                  </Col>

                  <Col xs={24}>
                    <div className="ccreate-field-label">
                      <span>Ngành hàng & Sở thích liên quan <span className="req">*</span></span>
                    </div>
                    <Input
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="Ví dụ: Làm đẹp, Chăm sóc da, Skincare Routine, Thời trang công sở..."
                      style={{ borderRadius: 10, height: 40, fontSize: 13 }}
                    />
                  </Col>
                </Row>

                {/* Phần 2: Mục tiêu chiến dịch */}
                <div className="ccreate-sub-section">
                  <div className="ccreate-sub-title">
                    <span>Mục tiêu chiến dịch <span style={{ color: '#EF4444' }}>*</span></span>
                    <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>
                      Đã chọn {selectedObjectives.length} mục tiêu
                    </span>
                  </div>

                  <div className="ccreate-obj-grid">
                    {objectives.map((obj) => {
                      const isSelected = selectedObjectives.includes(obj.id);
                      return (
                        <div
                          key={obj.id}
                          className={`ccreate-obj-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleObjective(obj.id)}
                        >
                          <div className="ccreate-obj-top">
                            <div className="ccreate-obj-icon">
                              {obj.icon}
                            </div>
                            <Checkbox checked={isSelected} style={{ pointerEvents: 'none' }} />
                          </div>

                          <div>
                            <div className="ccreate-obj-name">{obj.title}</div>
                            <div className="ccreate-obj-desc">{obj.subtitle}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* ============================ BƯỚC 2 CONTENT ============================= */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="ccreate-card">
                <div className="ccreate-card-header">
                  <div className="ccreate-card-badge">2</div>
                  <div>
                    <div className="ccreate-card-title">Yêu cầu Creator & Chân dung khán giả</div>
                    <div className="ccreate-card-subtitle">
                      Thiết lập các tiêu chí tuyển chọn KOC/KOL và đặc điểm nhân khẩu học tệp người theo dõi.
                    </div>
                  </div>
                </div>

                {/* Phần 1: Nền tảng hoạt động */}
                <div className="ccreate-sub-section">
                  <div className="ccreate-field-label">
                    <span>Nền tảng ưu tiên quảng bá <span className="req">*</span></span>
                  </div>
                  <div className="ccreate-platform-strip">
                    {[
                      { key: 'tiktok', label: '🎵 TikTok Video & Live' },
                      { key: 'instagram', label: '📷 Instagram Reels & Story' },
                      { key: 'facebook', label: '👤 Facebook Post & Watch' },
                    ].map((p) => {
                      const isSelected = selectedPlatforms.includes(p.key);
                      return (
                        <button
                          key={p.key}
                          type="button"
                          className={`ccreate-platform-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => togglePlatform(p.key)}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Phần 2: Tiêu chí số lượng & phân khúc */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <div className="ccreate-field-label">
                      <span>Số lượng Creator cần tuyển <span className="req">*</span></span>
                    </div>
                    <InputNumber
                      min={1}
                      max={500}
                      value={creatorQuantity}
                      onChange={(val) => setCreatorQuantity(val || 1)}
                      style={{ width: '100%', borderRadius: 10, height: 40, lineHeight: '38px' }}
                      suffix={<span style={{ color: '#94A3B8', fontSize: 12 }}>Creator</span>}
                    />
                  </Col>

                  <Col xs={24} sm={8}>
                    <div className="ccreate-field-label">
                      <span>Phân khúc Creator ưu tiên <span className="req">*</span></span>
                    </div>
                    <Select
                      value={creatorTier}
                      onChange={setCreatorTier}
                      placeholder="Chọn phân khúc Creator"
                      style={{ width: '100%', height: 40 }}
                      options={[
                        { value: 'nano', label: '🌱 Nano Creator (5K - 50K)' },
                        { value: 'micro', label: '⭐ Micro Creator (50K - 200K)' },
                        { value: 'macro', label: '🔥 Macro Creator (200K - 1M)' },
                        { value: 'mega', label: '👑 Mega / Celeb (1M+)' },
                      ]}
                    />
                  </Col>

                  <Col xs={24} sm={8}>
                    <div className="ccreate-field-label">
                      <span>Tỷ lệ tương tác tối thiểu (ER) <span className="req">*</span></span>
                    </div>
                    <Select
                      value={minEngagement || undefined}
                      onChange={setMinEngagement}
                      placeholder="Chọn tỷ lệ tương tác (ER)"
                      style={{ width: '100%', height: 40 }}
                      options={[
                        { value: '3%', label: 'Từ 3% trở lên (Trung bình)' },
                        { value: '5%', label: 'Từ 5% trở lên (Khuyên dùng)' },
                        { value: '8%', label: 'Từ 8% trở lên (Tương tác cao)' },
                      ]}
                    />
                  </Col>

                  <Col xs={24} sm={12}>
                    <div className="ccreate-field-label">
                      <span>Lượng Follower tối thiểu <span className="req">*</span></span>
                    </div>
                    <Select
                      value={minFollowers || undefined}
                      onChange={setMinFollowers}
                      placeholder="Chọn lượng Follower tối thiểu"
                      style={{ width: '100%', height: 40 }}
                      options={[
                        { value: '10k', label: 'Từ 10.000 followers' },
                        { value: '50k', label: 'Từ 50.000 followers' },
                        { value: '100k', label: 'Từ 100.000 followers' },
                        { value: '500k', label: 'Từ 500.000 followers' },
                      ]}
                    />
                  </Col>

                  <Col xs={24} sm={12}>
                    <div className="ccreate-field-label">
                      <span>Khu vực / Tỉnh thành ưu tiên <span className="req">*</span></span>
                    </div>
                    <Select
                      showSearch
                      loading={loadingProvinces}
                      value={locationState}
                      onChange={setLocationState}
                      style={{ width: '100%', height: 40 }}
                      filterOption={(input, option) =>
                        (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                      }
                      options={provinceOptions}
                    />
                  </Col>
                </Row>

                {/* Phần 3: Chân dung tệp khán giả */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={14}>
                    <div className="ccreate-field-label">
                      <span>Độ tuổi người theo dõi mục tiêu <span className="req">*</span></span>
                      <span style={{ fontSize: 11.5, color: '#4F46E5', fontWeight: 600 }}>
                        {selectedAges.length > 0 ? `Đã chọn ${selectedAges.length} nhóm` : '(Bắt buộc)'}
                      </span>
                    </div>
                    <div className="ccreate-chips-group">
                      {ageGroups.map((age) => {
                        const isSelected = selectedAges.includes(age);
                        return (
                          <button
                            key={age}
                            type="button"
                            className={`ccreate-chip-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleAge(age)}
                          >
                            {age}
                          </button>
                        );
                      })}
                    </div>
                  </Col>

                  <Col xs={24} md={10}>
                    <div className="ccreate-field-label">
                      <span>Giới tính khán giả <span className="req">*</span></span>
                    </div>
                    <div className="ccreate-chips-group">
                      {genders.map((g) => {
                        const isSelected = selectedGender === g.key;
                        return (
                          <button
                            key={g.key}
                            type="button"
                            className={`ccreate-chip-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedGender(g.key)}
                          >
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </Col>
                </Row>

                {/* Phần 4: Creator Brief */}
                <div>
                  <div className="ccreate-field-label">
                    <span>Tóm tắt yêu cầu sáng tạo (Creator Brief) <span className="req">*</span></span>
                    <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
                      Kịch bản, thông điệp chính & quy định (Bắt buộc)
                    </span>
                  </div>
                  <TextArea
                    rows={3}
                    value={creatorBrief}
                    onChange={(e) => setCreatorBrief(e.target.value)}
                    placeholder="Mô tả thông điệp sản phẩm, key visual, hashtag bắt buộc, thời lượng video và quyền lợi dành cho Creator..."
                    style={{ borderRadius: 10, fontSize: 13, lineHeight: 1.5 }}
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ============================ BƯỚC 3 CONTENT ============================= */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="ccreate-card">
                <div className="ccreate-card-header">
                  <div className="ccreate-card-badge">3</div>
                  <div>
                    <div className="ccreate-card-title">Ngân sách, KPI & Thời gian thực thi</div>
                    <div className="ccreate-card-subtitle">
                      Xác định hạn mức tài chính, kỳ vọng chuyển đổi và lịch trình triển khai của chiến dịch.
                    </div>
                  </div>
                </div>

                {/* Phần 1: Ngân sách & Hình thức chi trả */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <div className="ccreate-field-label">
                      <span>Tổng ngân sách dự kiến (VND) <span className="req">*</span></span>
                      <Tag color="blue" style={{ borderRadius: 6, fontSize: 11.5, fontWeight: 700, margin: 0 }}>
                        {(budgetTotal / 1000000).toFixed(1)} Triệu VNĐ
                      </Tag>
                    </div>
                    <InputNumber
                      value={budgetTotal}
                      onChange={(val) => setBudgetTotal(val || 0)}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                      style={{ width: '100%', borderRadius: 10, height: 42, lineHeight: '40px', fontSize: 14, fontWeight: 700 }}
                      suffix={<span style={{ color: '#4F46E5', fontWeight: 700 }}>VNĐ</span>}
                    />
                  </Col>

                  <Col xs={24} md={12}>
                    <div className="ccreate-field-label">
                      <span>Hình thức thù lao cho Creator <span className="req">*</span></span>
                    </div>
                    <Select
                      value={paymentModel}
                      onChange={setPaymentModel}
                      style={{ width: '100%', height: 42 }}
                      options={[
                        { value: 'cash', label: '💵 Trả phí cố định (Fixed Fee / Video)' },
                        { value: 'product', label: '🎁 Đổi sản phẩm dùng thử (Gifting / Barter)' },
                        { value: 'hybrid', label: '💎 Kết hợp: Phí cố định + Tặng quà + Affiliate' },
                      ]}
                    />
                  </Col>

                  <Col xs={24} md={12}>
                    <div className="ccreate-field-label">
                      <span>Thời lượng chiến dịch <span className="req">*</span></span>
                    </div>
                    <Select
                      value={campaignDuration}
                      onChange={setCampaignDuration}
                      style={{ width: '100%', height: 40 }}
                      options={[
                        { value: '2_weeks', label: '⏱️ 2 tuần (Chiến dịch thần tốc / Flash campaign)' },
                        { value: '4_weeks', label: '⏱️ 4 tuần (Khuyên dùng cho ra mắt sản phẩm)' },
                        { value: '8_weeks', label: '⏱️ 8 tuần (Chiến dịch duy trì nhận diện dài hạn)' },
                      ]}
                    />
                  </Col>

                  <Col xs={24} md={12}>
                    <div className="ccreate-field-label">
                      <span>Hạn chót duyệt kịch bản (Draft Deadline) <span className="req">*</span></span>
                    </div>
                    <Input
                      value={draftDeadline}
                      onChange={(e) => setDraftDeadline(e.target.value)}
                      placeholder="Ví dụ: 7 ngày sau khi Creator nhận sản phẩm"
                      style={{ borderRadius: 10, height: 40, fontSize: 13 }}
                    />
                  </Col>
                </Row>

                {/* Phần 2: KPI Kỳ vọng */}
                <div className="ccreate-sub-section">
                  <div className="ccreate-sub-title">
                    <span>Chỉ số KPI cam kết kỳ vọng</span>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                      Mục tiêu định lượng để đo lường hiệu quả (Bắt buộc)
                    </span>
                  </div>

                  <Row gutter={[14, 14]}>
                    <Col xs={24} sm={8}>
                      <div className="ccreate-kpi-card">
                        <span className="ccreate-kpi-label">🎯 Lượt tiếp cận mục tiêu <span className="req" style={{ color: '#EF4444' }}>*</span></span>
                        <Input
                          value={targetReach}
                          onChange={(e) => setTargetReach(e.target.value)}
                          placeholder="Ví dụ: 250,000 lượt xem"
                          style={{ borderRadius: 8, height: 38, fontWeight: 700, fontSize: 13 }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="ccreate-kpi-card">
                        <span className="ccreate-kpi-label">📈 Tỷ lệ tương tác kỳ vọng <span className="req" style={{ color: '#EF4444' }}>*</span></span>
                        <Input
                          value={targetEngagementRate}
                          onChange={(e) => setTargetEngagementRate(e.target.value)}
                          placeholder="Ví dụ: 5.5%"
                          style={{ borderRadius: 8, height: 38, fontWeight: 700, fontSize: 13 }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="ccreate-kpi-card">
                        <span className="ccreate-kpi-label">🛒 Chuyển đổi đơn hàng ước tính <span className="req" style={{ color: '#EF4444' }}>*</span></span>
                        <InputNumber
                          value={targetConversions}
                          onChange={(val) => setTargetConversions(val || 0)}
                          placeholder="0"
                          style={{ width: '100%', borderRadius: 8, height: 38, lineHeight: '36px', fontWeight: 700, fontSize: 13 }}
                          suffix="đơn"
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Phần 3: Executive Overview Card */}
                <div className="ccreate-sub-section">
                  <div className="ccreate-sub-title">
                    <span>Tóm tắt tổng quan chiến dịch</span>
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                      ✓ Sẵn sàng khởi chạy
                    </span>
                  </div>

                  <div className="ccreate-overview-card">
                    <div className="ccreate-overview-item">
                      <span className="ccreate-overview-item-label">Tên & Sản phẩm</span>
                      <span className="ccreate-overview-item-val">{campaignName} — {product}</span>
                    </div>
                    <div className="ccreate-overview-item">
                      <span className="ccreate-overview-item-label">Ngân sách & Thời lượng</span>
                      <span className="ccreate-overview-item-val" style={{ color: '#4F46E5' }}>
                        {(budgetTotal / 1000000).toFixed(1)} Triệu VNĐ • {campaignDuration === '2_weeks' ? '2 tuần' : campaignDuration === '4_weeks' ? '4 tuần' : '8 tuần'}
                      </span>
                    </div>
                    <div className="ccreate-overview-item">
                      <span className="ccreate-overview-item-label">Nền tảng & Creator</span>
                      <span className="ccreate-overview-item-val">
                        {selectedPlatforms.map(p => p.toUpperCase()).join(', ')} • {creatorQuantity} {creatorTier.toUpperCase()}
                      </span>
                    </div>
                    <div className="ccreate-overview-item">
                      <span className="ccreate-overview-item-label">Khán giả & Khu vực</span>
                      <span className="ccreate-overview-item-val">
                        {selectedAges.join(', ')} • {selectedGender === 'all' ? 'Tất cả' : selectedGender === 'female' ? 'Nữ' : 'Nam'} • {locationState}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* 4. Slide-over AI Assessment Drawer */}
      {isAiSummaryOpen && (
        <div className="ccreate-ai-drawer-overlay" onClick={() => setIsAiSummaryOpen(false)}>
          <div className="ccreate-ai-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div
              style={{
                padding: '18px 22px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <RobotOutlined style={{ fontSize: 18, color: '#FFFFFF' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: '#FFFFFF' }}>
                    Đánh giá & Gợi ý từ AI
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.85)' }}>
                    Độ sẵn sàng: {readinessPercent}% • Cập nhật theo từng bước
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiSummaryOpen(false)}
                style={{
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <CloseOutlined style={{ fontSize: 14 }} />
              </button>
            </div>

          {/* Scrollable Content Container */}
          <div
            style={{
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: '#F8FAFC',
            }}
          >
            {/* Card 1: Độ sẵn sàng của chiến dịch */}
            <Card
              bordered
              style={{ borderRadius: 14, borderColor: '#EEF0F6', background: '#FFFFFF' }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ClockCircleOutlined style={{ color: '#2563EB', fontSize: 15 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                  Độ sẵn sàng của chiến dịch
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Progress
                  type="circle"
                  percent={readinessPercent}
                  size={64}
                  strokeColor="#2563EB"
                  strokeWidth={9}
                  format={(percent) => (
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                      {percent}%
                    </span>
                  )}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', marginBottom: 3 }}>
                    {currentStep === 3 ? 'Hoàn hảo!' : 'Tốt lắm!'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                    {currentStep === 1
                      ? 'Chiến dịch cơ bản đã xong. Hãy hoàn thiện bước 2 để tìm Creator.'
                      : currentStep === 2
                      ? 'Đã cấu hình tiêu chí Creator. Hãy xác nhận ngân sách ở bước 3.'
                      : 'Chiến dịch đã hoàn tất và sẵn sàng khởi tạo để AI ghép nối!'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Gợi ý từ AI */}
            <Card
              bordered
              style={{ borderRadius: 14, borderColor: '#EEF0F6', background: '#FFFFFF' }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                  Gợi ý từ AI
                </span>
                <Button type="link" size="small" style={{ color: '#2563EB', fontSize: 11.5, padding: 0, fontWeight: 600 }}>
                  Xem tất cả
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Suggestion 1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    <TeamOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>
                      Nhóm creator phù hợp
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3 }}>
                      Nữ 18–34 tuổi, chuyên về làm đẹp & phong cách sống
                    </div>
                  </div>
                  <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                </div>

                {/* Suggestion 2 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: '#F5F3FF',
                      color: '#8B5CF6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    <DollarOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>
                      Ngân sách đề xuất
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3 }}>
                      Từ {(budgetTotal / 1000000).toFixed(0)} triệu VND cho {creatorQuantity} creator
                    </div>
                  </div>
                  <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                </div>

                {/* Suggestion 3 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    <BarChartOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>
                      KPI gợi ý
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3 }}>
                      Lượt tiếp cận: {targetReach}+ | Tương tác: {targetEngagementRate}+
                    </div>
                  </div>
                  <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                </div>
              </div>
            </Card>

            {/* Card 3: Tăng hiệu quả chiến dịch cùng AI */}
            <Card
              bordered={false}
              style={{
                borderRadius: 14,
                background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                border: '1px solid #DDD6FE',
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                  Tăng hiệu quả chiến dịch cùng AI
                </span>
              </div>

              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4, marginBottom: 12 }}>
                AI sẽ phân tích xu hướng, hành vi người dùng và đề xuất creator phù hợp nhất với thương hiệu của bạn.
              </div>

              <Button
                type="primary"
                block
                style={{
                  background: '#5B5BF0',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 10,
                  height: 36,
                  boxShadow: '0 4px 14px rgba(91, 91, 240, 0.3)',
                }}
                icon={<RobotOutlined />}
                onClick={() => message.success('AI đã bật chế độ tự động tối ưu hóa chiến dịch!')}
              >
                Bật gợi ý AI
              </Button>
            </Card>

            {/* Card 4: Thông tin nhanh */}
            <Card
              bordered
              style={{ borderRadius: 14, borderColor: '#EEF0F6', background: '#FFFFFF' }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 12 }}>
                Thông tin nhanh
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#FEE2E2',
                      color: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    <AimOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Ước tính lượt tiếp cận</div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                      {targetReach} – 2.5M
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#E0F2FE',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    💰
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Tổng ngân sách</div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                      {(budgetTotal / 1000000).toFixed(0)} Triệu VNĐ
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#F3E8FF',
                      color: '#9333EA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    ⏱️
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Thời gian triển khai</div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                      {campaignDuration === '2_weeks' ? '2 tuần' : campaignDuration === '4_weeks' ? '4 tuần' : '8 tuần'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )}

      {/* 5. Sticky Bottom Actions Bar */}
      <div className="ccreate-bottom-actions">
        <Button
          type="text"
          onClick={() => navigate(isEditMode && resolvedCampaignId ? `/campaigns/${resolvedCampaignId}` : '/campaigns')}
          className="ccreate-btn-cancel"
        >
          {isEditMode ? '✕ Hủy & Quay lại' : '✕ Hủy'}
        </Button>

        <Space size={12}>
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
    </div>
  );
}
