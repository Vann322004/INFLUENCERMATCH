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
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  RightOutlined,
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
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function CreateCampaignPage() {
  const navigate = useNavigate();

  // Form State
  const [campaignName, setCampaignName] = useState('Summer Glow Skincare Launch 2025');
  const [product, setProduct] = useState('Serum dưỡng sáng da');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(['sales']);
  const [selectedAges, setSelectedAges] = useState<string[]>(['18-24', '25-34']);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [location, setLocation] = useState<string>('nationwide');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['short_video', 'image_post']);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);

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

  const handleAiSuggest = () => {
    if (!aiPrompt) {
      message.info('Vui lòng nhập mô tả mục tiêu để AI gợi ý!');
      return;
    }
    message.success('AI đang phân tích và tối ưu hóa thông tin chiến dịch cho bạn!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
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
              title: <span style={{ color: '#94A3B8' }}>Hướng dẫn tạo chiến dịch mới</span>,
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

      {/* 2. Top Wizard Steps Bar */}
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
          {/* Step 1: Active */}
          <Col xs={24} md={7}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                }}
              >
                1
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                  Thông tin chiến dịch
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  Tên, sản phẩm, mục tiêu
                </div>
              </div>
            </div>
          </Col>

          <Col xs={0} md={1} style={{ textAlign: 'center' }}>
            <RightOutlined style={{ color: '#CBD5E1', fontSize: 12 }} />
          </Col>

          {/* Step 2: Pending */}
          <Col xs={24} md={7}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#64748B' }}>
                  Yêu cầu creator
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  Đối tượng, nội dung, tiêu chí
                </div>
              </div>
            </div>
          </Col>

          <Col xs={0} md={1} style={{ textAlign: 'center' }}>
            <RightOutlined style={{ color: '#CBD5E1', fontSize: 12 }} />
          </Col>

          {/* Step 3: Pending */}
          <Col xs={24} md={7}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#64748B' }}>
                  Chỉ số & ngân sách
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  KPI, ngân sách, thời gian
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 3. Main Grid (Left 16 / Right 8) */}
      <Row gutter={[20, 20]}>
        {/* ===================== LEFT COLUMN ===================== */}
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
                  placeholder="Ví dụ: Quảng bá sản phẩm chăm sóc da cho nữ 18-35 tuổi, ưu tiên creator làm đ..."
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

            {/* Block 1: Thông tin chiến dịch & mục tiêu */}
            <Card
              bordered
              style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
              bodyStyle={{ padding: '22px' }}
            >
              {/* Header */}
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
                    placeholder="Nhập tên sản phẩm hoặc dịch vụ (ví dụ: Serum dưỡng sáng da, Khóa học Tiếng Anh...)"
                    style={{ borderRadius: 10, height: 40, fontSize: 13 }}
                    allowClear
                  />
                </Col>
              </Row>

              {/* Row 2: Objective Selection (Multi-select) */}
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

            {/* Block 2: Đối tượng mục tiêu */}
            <Card
              bordered
              style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
              bodyStyle={{ padding: '22px' }}
            >
              {/* Header */}
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
                    Đối tượng mục tiêu
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    Xác định chân dung khách hàng để AI tìm creator phù hợp nhất.
                  </div>
                </div>
              </div>

              {/* Age & Gender Row */}
              <Row gutter={[20, 16]} style={{ marginBottom: 18 }}>
                {/* Age */}
                <Col xs={24} md={12}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    Độ tuổi
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

                {/* Gender */}
                <Col xs={24} md={12}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    Giới tính
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
                    Khu vực
                  </div>
                  <Select
                    showSearch
                    loading={loadingProvinces}
                    value={location}
                    onChange={setLocation}
                    placeholder="Chọn hoặc tìm kiếm tỉnh thành..."
                    filterOption={(input, option) =>
                      (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: '100%', height: 40 }}
                    options={provinceOptions}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    Sở thích (tùy chọn)
                  </div>
                  <Input
                    prefix={<span style={{ marginRight: 4, color: '#94A3B8' }}>🔍</span>}
                    placeholder="Nhập sở thích, ví dụ: làm đẹp, thời trang..."
                    style={{ borderRadius: 10, height: 40, fontSize: 12.5 }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Block 3: Định dạng nội dung mong muốn */}
            <Card
              bordered
              style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
              bodyStyle={{ padding: '22px' }}
            >
              {/* Header */}
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
          </div>
        </Col>

        {/* ===================== RIGHT COLUMN (Summary & AI Cards) ===================== */}
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
                  percent={75}
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
                    Tốt lắm!
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                    Chiến dịch của bạn đã đầy đủ thông tin. Hãy hoàn thiện bước 2 để có kết quả tốt nhất.
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
                      Từ 15 – 25 triệu VND cho 20–30 creator
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
                      Lượt tiếp cận: 1.2M+ | Tương tác: 5%+ | Chuyển đổi: 2–5%
                    </div>
                  </div>
                  <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                </div>

                {/* Suggestion 4 */}
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
                    <ClockCircleOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                      Thời gian triển khai lý tưởng
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3 }}>
                      Từ 2 – 4 tuần để đạt hiệu quả tối ưu
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
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>1.2M – 2.5M</div>
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
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Ước tính chi phí</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>15M – 25M VNĐ</div>
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
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>2 – 4 tuần</div>
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
          <Button
            onClick={() => message.success('Đã lưu bản nháp thành công!')}
            style={{ fontWeight: 600, borderRadius: 8, height: 38 }}
          >
            Lưu bản nháp
          </Button>
          <Button
            type="primary"
            onClick={() => message.success('Chuyển sang Bước 2: Yêu cầu creator!')}
            style={{
              background: '#2563EB',
              fontWeight: 700,
              borderRadius: 8,
              height: 38,
              padding: '0 20px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            Tiếp theo →
          </Button>
        </Space>
      </div>
    </div>
  );
}
