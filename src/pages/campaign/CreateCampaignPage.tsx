import React, { useState, useEffect } from 'react';
import {
  Breadcrumb,
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
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  RightOutlined,
  LeftOutlined,
  CheckOutlined,
  StarOutlined,
  ThunderboltOutlined,
  AimOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  SendOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  PlaySquareOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
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
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CreateCampaignPage() {
  const navigate = useNavigate();

  // Wizard Step State (1: Thông tin chiến dịch, 2: Yêu cầu creator, 3: Chỉ số & ngân sách)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ================= Step 1 State =================
  const [campaignName, setCampaignName] = useState('Summer Glow Skincare Launch 2025');
  const [product, setProduct] = useState('Serum dưỡng sáng da');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(['sales', 'awareness']);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['short_video', 'image_post']);
  const [aiPrompt, setAiPrompt] = useState('');

  // ================= Step 2 State =================
  const [creatorQuantity, setCreatorQuantity] = useState<number>(20);
  const [creatorTier, setCreatorTier] = useState<string>('micro');
  const [minFollowers, setMinFollowers] = useState<string>('50k');
  const [minEngagement, setMinEngagement] = useState<string>('5%');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram']);
  const [selectedAges, setSelectedAges] = useState<string[]>(['18-24', '25-34']);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [location, setLocation] = useState<string>('nationwide');
  const [interests, setInterests] = useState<string>('Làm đẹp, chăm sóc da, phong cách sống');
  const [creatorBrief, setCreatorBrief] = useState<string>(
    'Yêu cầu video trải nghiệm thực tế sản phẩm từ 30s - 60s, quay rõ texture serum, nêu bật khả năng cấp ẩm và làm sáng da sau 7 ngày.'
  );

  // ================= Step 3 State =================
  const [budgetTotal, setBudgetTotal] = useState<number>(25000000); // 25,000,000 VND
  const [paymentModel, setPaymentModel] = useState<string>('hybrid'); // cash, product, hybrid
  const [targetReach, setTargetReach] = useState<string>('1.5M');
  const [targetEngagementRate, setTargetEngagementRate] = useState<string>('7.5%');
  const [targetConversions, setTargetConversions] = useState<number>(500);
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

  // Content Formats
  const contentFormats = [
    {
      id: 'short_video',
      title: 'Video ngắn',
      subtitle: 'TikTok, Reels, Shorts',
      icon: <VideoCameraOutlined style={{ color: '#fff', fontSize: 14 }} />,
      iconBg: '#0F172A',
    },
    {
      id: 'image_post',
      title: 'Bài đăng hình ảnh',
      subtitle: 'Instagram, Facebook',
      icon: <PictureOutlined style={{ color: '#fff', fontSize: 14 }} />,
      iconBg: '#3B82F6',
    },
    {
      id: 'long_video',
      title: 'Video dài',
      subtitle: 'YouTube, Facebook',
      icon: <PlaySquareOutlined style={{ color: '#fff', fontSize: 14 }} />,
      iconBg: '#EF4444',
    },
    {
      id: 'livestream',
      title: 'Livestream',
      subtitle: 'TikTok, Facebook, YouTube',
      icon: <CustomerServiceOutlined style={{ color: '#fff', fontSize: 14 }} />,
      iconBg: '#8B5CF6',
    },
    {
      id: 'blog',
      title: 'Blog / Bài viết',
      subtitle: 'Website, Blog',
      icon: <FileTextOutlined style={{ color: '#fff', fontSize: 14 }} />,
      iconBg: '#10B981',
    },
  ];

  // Handlers
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

  const toggleFormat = (id: string) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]
    );
  };

  const handleAiSuggest = () => {
    if (!aiPrompt) {
      message.info('Vui lòng nhập mô tả mục tiêu để AI gợi ý!');
      return;
    }
    message.success('AI đang phân tích và tối ưu hóa thông tin chiến dịch cho bạn!');
  };

  const scrollToTop = () => {
    const mainContent = document.querySelector('main.ant-layout-content') || document.querySelector('.ant-layout-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Next step handler with validation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!campaignName.trim()) {
        message.warning('Vui lòng nhập tên chiến dịch!');
        return;
      }
      if (!product.trim()) {
        message.warning('Vui lòng nhập sản phẩm / dịch vụ quảng bá!');
        return;
      }
      setCurrentStep(2);
      scrollToTop();
      message.success('Đã chuyển sang Bước 2: Yêu cầu creator!');
    } else if (currentStep === 2) {
      setCurrentStep(3);
      scrollToTop();
      message.success('Đã chuyển sang Bước 3: Chỉ số & ngân sách!');
    } else if (currentStep === 3) {
      message.success('🎉 Chiến dịch đã được khởi tạo thành công!');
      navigate('/campaigns');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>
      {/* 1. Header & Breadcrumb */}
      <div>
        <Breadcrumb
          separator=">"
          items={[
            {
              title: (
                <span
                  style={{ color: '#5B5BF0', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => navigate('/campaigns')}
                >
                  Chiến dịch
                </span>
              ),
            },
            {
              title: (
                <span style={{ color: '#94A3B8' }}>
                  {currentStep === 1
                    ? 'Bước 1: Thông tin chiến dịch'
                    : currentStep === 2
                    ? 'Bước 2: Yêu cầu creator'
                    : 'Bước 3: Chỉ số & ngân sách'}
                </span>
              ),
            },
          ]}
          style={{ marginBottom: 6, fontSize: 12.5 }}
        />
        <Title
          level={2}
          style={{
            fontWeight: 800,
            fontSize: 26,
            color: '#0F172A',
            margin: '0 0 4px 0',
            letterSpacing: -0.5,
          }}
        >
          Tạo chiến dịch mới
        </Title>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Thiết lập thông tin chiến dịch để AI giúp bạn tìm đúng creator, tối ưu hiệu quả và đạt mục tiêu thương hiệu.
        </Text>
      </div>

      {/* 2. Top Interactive Wizard Steps Bar */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#EEF0F6',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}
        bodyStyle={{ padding: '14px 24px' }}
      >
        <Row align="middle" justify="space-between">
          {/* Step 1 */}
          <Col
            xs={24}
            md={7}
            onClick={() => {
              setCurrentStep(1);
              scrollToTop();
            }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: currentStep >= 1 ? '#2563EB' : '#F1F5F9',
                  color: currentStep >= 1 ? '#FFFFFF' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: currentStep === 1 ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                {currentStep > 1 ? <CheckOutlined /> : '1'}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: currentStep === 1 ? '#2563EB' : '#0F172A',
                  }}
                >
                  Thông tin chiến dịch
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Tên, sản phẩm, mục tiêu</div>
              </div>
            </div>
          </Col>

          <Col xs={0} md={1} style={{ textAlign: 'center' }}>
            <RightOutlined style={{ color: currentStep >= 2 ? '#2563EB' : '#CBD5E1', fontSize: 12 }} />
          </Col>

          {/* Step 2 */}
          <Col
            xs={24}
            md={7}
            onClick={() => {
              setCurrentStep(2);
              scrollToTop();
            }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: currentStep >= 2 ? '#2563EB' : '#F1F5F9',
                  color: currentStep >= 2 ? '#FFFFFF' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: currentStep === 2 ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                {currentStep > 2 ? <CheckOutlined /> : '2'}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: currentStep >= 2 ? 700 : 600,
                    fontSize: 13,
                    color: currentStep === 2 ? '#2563EB' : currentStep > 2 ? '#0F172A' : '#64748B',
                  }}
                >
                  Yêu cầu creator
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Đối tượng, nội dung, tiêu chí</div>
              </div>
            </div>
          </Col>

          <Col xs={0} md={1} style={{ textAlign: 'center' }}>
            <RightOutlined style={{ color: currentStep >= 3 ? '#2563EB' : '#CBD5E1', fontSize: 12 }} />
          </Col>

          {/* Step 3 */}
          <Col
            xs={24}
            md={7}
            onClick={() => {
              setCurrentStep(3);
              scrollToTop();
            }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: currentStep === 3 ? '#2563EB' : '#F1F5F9',
                  color: currentStep === 3 ? '#FFFFFF' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: currentStep === 3 ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                3
              </div>
              <div>
                <div
                  style={{
                    fontWeight: currentStep === 3 ? 700 : 600,
                    fontSize: 13,
                    color: currentStep === 3 ? '#2563EB' : '#64748B',
                  }}
                >
                  Chỉ số & ngân sách
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>KPI, ngân sách, thời gian</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 3. Main Content: Left Dynamic Form / Right Sticky Summary */}
      <Row gutter={[20, 20]}>
        {/* ===================== LEFT COLUMN (FORM BLOCKS) ===================== */}
        <Col xs={24} xl={16}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* AI Assistant Banner Box */}
            <Card
              bordered
              style={{
                borderRadius: 16,
                background: 'linear-gradient(135deg, #F3E8FF 0%, #EEF2FF 100%)',
                borderColor: '#DDD6FE',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.08)',
              }}
              bodyStyle={{ padding: '18px 22px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#7C3AED',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    ✦
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                    Trợ lý AI Chiến dịch
                  </span>
                  <Tag
                    color="purple"
                    style={{
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '1px 8px',
                      background: '#EDE9FE',
                      borderColor: '#DDD6FE',
                      color: '#6D28D9',
                      margin: 0,
                    }}
                  >
                    ✨ Trợ lý AI
                  </Tag>
                </div>

                <div style={{ display: 'flex', gap: 6, opacity: 0.6, fontSize: 15 }}>
                  <span>💬</span>
                  <span>🎵</span>
                  <span>🤖</span>
                </div>
              </div>

              <Text style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 14 }}>
                Hãy mô tả ngắn gọn về mục tiêu của bạn, AI sẽ gợi ý chiến lược, đối tượng và creator phù hợp nhất.
              </Text>

              {/* AI Input Row */}
              <div style={{ display: 'flex', gap: 10 }}>
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ví dụ: Quảng bá sản phẩm chăm sóc da cho nữ 18-35 tuổi, ưu tiên creator làm đẹp..."
                  style={{
                    borderRadius: 10,
                    background: '#FFFFFF',
                    borderColor: '#DDD6FE',
                    height: 40,
                    fontSize: 12.5,
                  }}
                  onPressEnter={handleAiSuggest}
                />
                <Button
                  type="primary"
                  onClick={handleAiSuggest}
                  style={{
                    background: '#5B5BF0',
                    fontWeight: 700,
                    borderRadius: 10,
                    height: 40,
                    padding: '0 18px',
                    boxShadow: '0 4px 12px rgba(91, 91, 240, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  Gợi ý ngay →
                </Button>
              </div>
            </Card>

            {/* ========================================================================= */}
            {/* ============================ BƯỚC 1 CONTENT ============================= */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <>
                {/* Block 1: Thông tin chiến dịch & mục tiêu */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Thông tin chiến dịch & mục tiêu
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Cung cấp thông tin cơ bản để chúng tôi hiểu rõ về chiến dịch của bạn.
                      </div>
                    </div>
                  </div>

                  {/* Row 1: Name & Product */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Tên chiến dịch <span style={{ color: '#EF4444' }}>*</span>
                      </div>
                      <Input
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        maxLength={100}
                        suffix={<span style={{ color: '#94A3B8', fontSize: 11 }}>{campaignName.length}/100</span>}
                        style={{ borderRadius: 10, height: 40, fontSize: 13 }}
                      />
                    </Col>

                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Sản phẩm / Dịch vụ được quảng bá <span style={{ color: '#EF4444' }}>*</span>
                      </div>
                      <Input
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="Nhập tên sản phẩm hoặc dịch vụ (ví dụ: Serum dưỡng sáng da, Khóa học...)"
                        style={{ borderRadius: 10, height: 40, fontSize: 13 }}
                        allowClear
                      />
                    </Col>
                  </Row>

                  {/* Row 2: Objective Selection */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                        Mục tiêu chiến dịch <span style={{ color: '#EF4444' }}>*</span>
                        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748B', marginLeft: 8 }}>
                          (Có thể chọn nhiều mục tiêu)
                        </span>
                      </div>
                      <span style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 600 }}>
                        Đã chọn {selectedObjectives.length} mục tiêu
                      </span>
                    </div>

                    <Row gutter={[12, 12]}>
                      {objectives.map((obj) => {
                        const isSelected = selectedObjectives.includes(obj.id);
                        return (
                          <Col xs={24} sm={12} lg={6} key={obj.id}>
                            <div
                              onClick={() => toggleObjective(obj.id)}
                              style={{
                                border: isSelected ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                                borderRadius: 12,
                                padding: '14px 12px',
                                cursor: 'pointer',
                                background: isSelected ? '#F0F7FF' : '#FFFFFF',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                minHeight: 110,
                                height: '100%',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: isSelected ? '#2563EB' : '#F1F5F9',
                                    color: isSelected ? '#FFFFFF' : '#64748B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {obj.icon}
                                </div>
                                <Checkbox
                                  checked={isSelected}
                                  style={{ pointerEvents: 'none', transform: 'scale(1.05)' }}
                                />
                              </div>

                              <div style={{ marginTop: 10 }}>
                                <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A', lineHeight: 1.3 }}>
                                  {obj.title}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>
                                  {obj.subtitle}
                                </div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                </Card>

                {/* Block 2: Định dạng nội dung mong muốn */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Định dạng nội dung mong muốn
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Chọn các loại nội dung bạn muốn creator thực hiện.
                      </div>
                    </div>
                  </div>

                  {/* Formats Grid (5 equal cards) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {contentFormats.map((item) => {
                      const isChecked = selectedFormats.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleFormat(item.id)}
                          style={{
                            border: isChecked ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                            background: isChecked ? '#F0F7FF' : '#FFFFFF',
                            borderRadius: 12,
                            padding: '14px 12px',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            minHeight: 128,
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: isChecked ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                backgroundColor: item.iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {item.icon}
                            </div>
                            <Checkbox checked={isChecked} style={{ pointerEvents: 'none', transform: 'scale(1.05)' }} />
                          </div>

                          <div style={{ marginTop: 12 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 12.5,
                                color: '#0F172A',
                                lineHeight: 1.3,
                                minHeight: 34,
                                display: 'flex',
                                alignItems: 'flex-start',
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                fontSize: 10.5,
                                color: '#64748B',
                                marginTop: 2,
                                lineHeight: 1.3,
                                minHeight: 28,
                              }}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            )}

            {/* ========================================================================= */}
            {/* ============================ BƯỚC 2 CONTENT ============================= */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <>
                {/* Block 1: Chân dung & Tiêu chí Creator */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Tiêu chí lựa chọn Creator
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Xác định số lượng, quy mô và chất lượng creator bạn muốn hợp tác.
                      </div>
                    </div>
                  </div>

                  <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    {/* Số lượng creator */}
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Số lượng Creator cần tuyển <span style={{ color: '#EF4444' }}>*</span>
                      </div>
                      <InputNumber
                        min={1}
                        max={500}
                        value={creatorQuantity}
                        onChange={(val) => setCreatorQuantity(val || 1)}
                        style={{ width: '100%', borderRadius: 10, height: 40, lineHeight: '38px' }}
                        suffix={<span style={{ color: '#94A3B8' }}>Creator</span>}
                      />
                    </Col>

                    {/* Phân khúc creator */}
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Phân khúc Creator ưu tiên
                      </div>
                      <Select
                        value={creatorTier}
                        onChange={setCreatorTier}
                        style={{ width: '100%', height: 40 }}
                        options={[
                          { value: 'nano', label: '🌱 Nano Creator (5K - 50K followers)' },
                          { value: 'micro', label: '⭐ Micro Creator (50K - 200K followers)' },
                          { value: 'macro', label: '🔥 Macro Creator (200K - 1M followers)' },
                          { value: 'mega', label: '👑 Mega / Celeb (1M+ followers)' },
                        ]}
                      />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    {/* Nền tảng hoạt động */}
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                        Nền tảng ưu tiên
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { key: 'tiktok', label: '🎵 TikTok' },
                          { key: 'instagram', label: '📷 Instagram' },
                          { key: 'youtube', label: '▶️ YouTube' },
                          { key: 'facebook', label: '👤 Facebook' },
                        ].map((p) => {
                          const isSelected = selectedPlatforms.includes(p.key);
                          return (
                            <button
                              key={p.key}
                              type="button"
                              onClick={() => togglePlatform(p.key)}
                              style={{
                                border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                                background: isSelected ? '#EFF6FF' : '#FFFFFF',
                                color: isSelected ? '#1D4ED8' : '#475569',
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: 12,
                                padding: '6px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                              }}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </Col>

                    {/* Tỷ lệ tương tác tối thiểu */}
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Tỷ lệ tương tác tối thiểu (Engagement Rate)
                      </div>
                      <Select
                        value={minEngagement}
                        onChange={setMinEngagement}
                        style={{ width: '100%', height: 40 }}
                        options={[
                          { value: '3%', label: 'Từ 3% trở lên (Trung bình)' },
                          { value: '5%', label: 'Từ 5% trở lên (Khuyên dùng)' },
                          { value: '8%', label: 'Từ 8% trở lên (Tương tác cao)' },
                        ]}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Block 2: Đối tượng khán giả mục tiêu */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Đối tượng khán giả mục tiêu của Creator
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Xác định nhân khẩu học tệp người theo dõi để AI lọc đúng creator.
                      </div>
                    </div>
                  </div>

                  {/* Age & Gender */}
                  <Row gutter={[20, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                        Độ tuổi người theo dõi
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {ageGroups.map((age) => {
                          const isSelected = selectedAges.includes(age);
                          return (
                            <button
                              key={age}
                              type="button"
                              onClick={() => toggleAge(age)}
                              style={{
                                border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                                background: isSelected ? '#2563EB' : '#FFFFFF',
                                color: isSelected ? '#FFFFFF' : '#475569',
                                fontWeight: 700,
                                fontSize: 12,
                                padding: '6px 14px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {age}
                            </button>
                          );
                        })}
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                        Giới tính khán giả
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {genders.map((g) => {
                          const isSelected = selectedGender === g.key;
                          return (
                            <button
                              key={g.key}
                              type="button"
                              onClick={() => setSelectedGender(g.key)}
                              style={{
                                border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                                background: isSelected ? '#2563EB' : '#FFFFFF',
                                color: isSelected ? '#FFFFFF' : '#475569',
                                fontWeight: 700,
                                fontSize: 12,
                                padding: '6px 14px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </Col>
                  </Row>

                  {/* Location & Interests */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Khu vực / Tỉnh thành
                      </div>
                      <Select
                        showSearch
                        loading={loadingProvinces}
                        value={location}
                        onChange={setLocation}
                        style={{ width: '100%', height: 40 }}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                        }
                        options={provinceOptions}
                      />
                    </Col>

                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Sở thích & Lĩnh vực nội dung
                      </div>
                      <Input
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="Ví dụ: Skincare, Trang điểm, Thời trang, Du lịch..."
                        style={{ borderRadius: 10, height: 40, fontSize: 12.5 }}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Block 3: Yêu cầu Brief nội dung */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Tóm tắt yêu cầu sáng tạo (Creator Brief)
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Mô tả yêu cầu kịch bản, thông điệp chính và các quy định cần lưu ý cho Creator.
                      </div>
                    </div>
                  </div>

                  <TextArea
                    rows={4}
                    value={creatorBrief}
                    onChange={(e) => setCreatorBrief(e.target.value)}
                    placeholder="Mô tả thông điệp sản phẩm, key visual, hashtag bắt buộc, thời lượng video..."
                    style={{ borderRadius: 10, fontSize: 13 }}
                  />
                </Card>
              </>
            )}

            {/* ========================================================================= */}
            {/* ============================ BƯỚC 3 CONTENT ============================= */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <>
                {/* Block 1: Ngân sách chiến dịch */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Ngân sách & Hình thức chi trả
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Thiết lập tổng ngân sách phân bổ cho các creator trong chiến dịch.
                      </div>
                    </div>
                  </div>

                  <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Tổng ngân sách dự kiến (VND) <span style={{ color: '#EF4444' }}>*</span>
                      </div>
                      <InputNumber
                        value={budgetTotal}
                        onChange={(val) => setBudgetTotal(val || 0)}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                        style={{ width: '100%', borderRadius: 10, height: 40, lineHeight: '38px', fontSize: 14, fontWeight: 700 }}
                        suffix={<span style={{ color: '#2563EB', fontWeight: 600 }}>VNĐ</span>}
                      />
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        Ước tính khoảng: {(budgetTotal / 1000000).toFixed(1)} Triệu VNĐ
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Hình thức thù lao cho Creator
                      </div>
                      <Select
                        value={paymentModel}
                        onChange={setPaymentModel}
                        style={{ width: '100%', height: 40 }}
                        options={[
                          { value: 'cash', label: '💵 Trả phí cố định (Fixed Fee / Video)' },
                          { value: 'product', label: '🎁 Đổi sản phẩm dùng thử (Gifting / Barter)' },
                          { value: 'hybrid', label: '💎 Kết hợp: Phí cố định + Tặng sản phẩm + Affiliate' },
                        ]}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Block 2: KPI & Mục tiêu kỳ vọng */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Chỉ số KPI cam kết kỳ vọng
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Mục tiêu định lượng để đo lường mức độ thành công của chiến dịch.
                      </div>
                    </div>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 4 }}>🎯 Lượt tiếp cận mục tiêu</div>
                        <Input
                          value={targetReach}
                          onChange={(e) => setTargetReach(e.target.value)}
                          style={{ borderRadius: 8, height: 36, fontWeight: 700 }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 4 }}>📈 Tỷ lệ tương tác kỳ vọng</div>
                        <Input
                          value={targetEngagementRate}
                          onChange={(e) => setTargetEngagementRate(e.target.value)}
                          style={{ borderRadius: 8, height: 36, fontWeight: 700 }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 4 }}>🛒 Chuyển đổi đơn hàng ước tính</div>
                        <InputNumber
                          value={targetConversions}
                          onChange={(val) => setTargetConversions(val || 0)}
                          style={{ width: '100%', borderRadius: 8, height: 36, lineHeight: '34px', fontWeight: 700 }}
                          suffix="đơn"
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Block 3: Thời gian triển khai */}
                <Card
                  bordered
                  style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                        Thời gian triển khai chiến dịch
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Xác định khung thời gian chạy và hạn chót nộp nội dung.
                      </div>
                    </div>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Thời lượng chiến dịch
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
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Hạn chót duyệt kịch bản (Draft Deadline)
                      </div>
                      <Input
                        defaultValue="7 ngày sau khi Creator nhận sản phẩm"
                        style={{ borderRadius: 10, height: 40, fontSize: 13 }}
                      />
                    </Col>
                  </Row>
                </Card>
              </>
            )}
          </div>
        </Col>

        {/* ===================== RIGHT COLUMN (SUMMARY & AI CARDS) ===================== */}
        <Col xs={24} xl={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Card 1: Độ sẵn sàng của chiến dịch */}
            <Card
              bordered
              style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
              bodyStyle={{ padding: '18px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ClockCircleOutlined style={{ color: '#2563EB', fontSize: 15 }} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                  Độ sẵn sàng của chiến dịch
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Progress
                  type="circle"
                  percent={readinessPercent}
                  size={68}
                  strokeColor="#2563EB"
                  strokeWidth={9}
                  format={(percent) => (
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                      {percent}%
                    </span>
                  )}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 3 }}>
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
              style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
              bodyStyle={{ padding: '18px 20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Space size={6}>
                  <span style={{ color: '#7C3AED', fontWeight: 800 }}>✦</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                    Gợi ý từ AI
                  </span>
                </Space>
                <Button type="link" size="small" style={{ color: '#2563EB', fontSize: 11.5, padding: 0, fontWeight: 600 }}>
                  Xem tất cả →
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Suggestion 1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    <TeamOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
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
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#F5F3FF',
                      color: '#8B5CF6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    <DollarOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
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
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    <BarChartOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
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
                borderRadius: 16,
                background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                border: '1px solid #DDD6FE',
              }}
              bodyStyle={{ padding: '18px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#7C3AED', fontWeight: 800 }}>✦</span>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                  Tăng hiệu quả chiến dịch cùng AI
                </span>
              </div>

              <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.4, marginBottom: 14 }}>
                AI sẽ phân tích xu hướng, hành vi người dùng và đề xuất creator phù hợp nhất với thương hiệu của bạn.
              </div>

              <Button
                type="primary"
                block
                style={{
                  background: '#5B5BF0',
                  fontWeight: 700,
                  fontSize: 12.5,
                  borderRadius: 10,
                  height: 38,
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
              style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
              bodyStyle={{ padding: '18px 20px' }}
            >
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A', marginBottom: 14 }}>
                Thông tin nhanh
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                      fontSize: 13,
                    }}
                  >
                    🎯
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Ước tính lượt tiếp cận</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                      {targetReach} – 2.5M
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                      fontSize: 13,
                    }}
                  >
                    💰
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Tổng ngân sách</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                      {(budgetTotal / 1000000).toFixed(0)} Triệu VNĐ
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                      fontSize: 13,
                    }}
                  >
                    ⏱️
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Thời gian triển khai</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                      {campaignDuration === '2_weeks' ? '2 tuần' : campaignDuration === '4_weeks' ? '4 tuần' : '8 tuần'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* 4. Bottom Sticky Actions Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          left: 240, // offset from sidebar
          background: '#FFFFFF',
          borderTop: '1px solid #EEF0F6',
          padding: '12px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Button
          type="text"
          onClick={() => navigate('/campaigns')}
          style={{ color: '#64748B', fontWeight: 600, fontSize: 13 }}
        >
          ✕ Hủy
        </Button>

        <Space size={12}>
          {currentStep > 1 && (
            <Button
              icon={<LeftOutlined />}
              onClick={handlePrevStep}
              style={{ fontWeight: 600, borderRadius: 8, height: 38 }}
            >
              Quay lại
            </Button>
          )}

          <Button
            onClick={() => message.success('Đã lưu bản nháp chiến dịch!')}
            style={{ fontWeight: 600, borderRadius: 8, height: 38 }}
          >
            Lưu bản nháp
          </Button>

          <Button
            type="primary"
            onClick={handleNextStep}
            style={{
              background: currentStep === 3 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#2563EB',
              fontWeight: 700,
              borderRadius: 8,
              height: 38,
              padding: '0 22px',
              boxShadow: currentStep === 3 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(37, 99, 235, 0.3)',
              border: 'none',
            }}
          >
            {currentStep === 1
              ? 'Tiếp theo (Bước 2) →'
              : currentStep === 2
              ? 'Tiếp theo (Bước 3) →'
              : '🚀 Hoàn tất & Khởi tạo chiến dịch'}
          </Button>
        </Space>
      </div>
    </div>
  );
}
