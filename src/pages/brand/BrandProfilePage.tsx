import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Tag,
  Avatar,
  message,
  Space,
  Tooltip,
  Spin,
  Checkbox,
} from 'antd';
import {
  ShopOutlined,
  CheckCircleFilled,
  GlobalOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  AimOutlined,
  AppstoreOutlined,
  CameraOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { brandService } from '../../services/api/brandService';
import type { BrandRequest, BrandResponse } from '../../types/api/brand.types';
import { getErrorMessage } from '../../services/apiClient';
import './BrandProfilePage.css';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export interface BrandProfileState {
  brandName: string;
  description: string;
  logo: string;
  coverImage: string;
  website: string;
  location: string;
  industry: string;
  subCategories: string[];
  targetLocations: string[];
  targetAgeRange: string[];
  brandTone: string;
  preferredPlatforms: string[];
}

const EMPTY_BRAND_PROFILE: BrandProfileState = {
  brandName: '',
  description: '',
  logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80',
  coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
  website: '',
  location: '',
  industry: 'Mỹ phẩm & Chăm sóc cá nhân',
  subCategories: ['Chăm sóc da'],
  targetLocations: ['Toàn quốc'],
  targetAgeRange: ['18 - 24 tuổi', '25 - 34 tuổi'],
  brandTone: 'Thân thiện',
  preferredPlatforms: ['TIKTOK', 'INSTAGRAM', 'FACEBOOK'],
};

export default function BrandProfilePage() {
  const [profile, setProfile] = useState<BrandProfileState>(EMPTY_BRAND_PROFILE);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('general');

  // New tag inputs
  const [inputSubCat, setInputSubCat] = useState('');
  const [isAddingSubCat, setIsAddingSubCat] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchBrand = async () => {
      setLoading(true);
      try {
        const brand: BrandResponse | null = await brandService.getMyBrand();
        if (isMounted && brand) {
          setBrandId(brand.id);
          setProfile((prev) => ({
            ...prev,
            brandName: brand.businessName || '',
            description: brand.description || '',
            industry: brand.industry || prev.industry,
            subCategories:
              brand.productCategories && brand.productCategories.length > 0
                ? brand.productCategories
                : prev.subCategories,
            website: brand.website || '',
            location: brand.location || '',
            targetLocations:
              brand.targetMarkets && brand.targetMarkets.length > 0
                ? brand.targetMarkets
                : prev.targetLocations,
            targetAgeRange:
              brand.targetAudiences && brand.targetAudiences.length > 0
                ? brand.targetAudiences
                : prev.targetAgeRange,
            brandTone: brand.brandTone || prev.brandTone,
            preferredPlatforms:
              brand.preferredPlatforms && brand.preferredPlatforms.length > 0
                ? brand.preferredPlatforms
                : prev.preferredPlatforms,
          }));
        }
      } catch (err) {
        console.error('Failed to load brand profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBrand();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async () => {
    if (!profile.brandName.trim()) {
      message.error('Vui lòng nhập tên thương hiệu!');
      return;
    }

    setSaving(true);
    message.loading({ content: 'Đang lưu hồ sơ thương hiệu lên hệ thống...', key: 'save_profile' });

    const payload: BrandRequest = {
      businessName: profile.brandName.trim(),
      industry: profile.industry,
      productCategories: profile.subCategories,
      website: profile.website.trim(),
      location: profile.location.trim(),
      targetMarkets: profile.targetLocations,
      targetAudiences: profile.targetAgeRange,
      brandTone: profile.brandTone,
      description: profile.description.trim(),
      preferredPlatforms: profile.preferredPlatforms,
    };

    try {
      if (brandId) {
        await brandService.updateBrand(brandId, payload);
        message.success({ content: 'Đã cập nhật hồ sơ thương hiệu thành công!', key: 'save_profile' });
      } else {
        const created = await brandService.createBrand(payload);
        setBrandId(created.id);
        message.success({ content: 'Đã khởi tạo hồ sơ thương hiệu thành công!', key: 'save_profile' });
      }
    } catch (err) {
      message.error({ content: getErrorMessage(err, 'Lưu hồ sơ thất bại.'), key: 'save_profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubCategory = () => {
    if (inputSubCat.trim() && !profile.subCategories.includes(inputSubCat.trim())) {
      setProfile((prev) => ({
        ...prev,
        subCategories: [...prev.subCategories, inputSubCat.trim()],
      }));
      setInputSubCat('');
      setIsAddingSubCat(false);
    }
  };

  const handleRemoveSubCat = (tag: string) => {
    setProfile((prev) => ({
      ...prev,
      subCategories: prev.subCategories.filter((t) => t !== tag),
    }));
  };

  return (
    <div className="brand-profile-container">
      {/* 1. Header Section */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>
              Hồ sơ thương hiệu
            </Title>
            <Paragraph style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0 0' }}>
              Cung cấp thông tin chuẩn xác về thương hiệu, ngành hàng và khách hàng mục tiêu để AI gợi ý Creator chính xác nhất.
            </Paragraph>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveProfile}
              loading={saving}
              style={{
                background: '#5B5BF0',
                borderRadius: 10,
                fontWeight: 700,
                height: 40,
                padding: '0 20px',
                boxShadow: '0 4px 14px rgba(91, 91, 240, 0.3)',
              }}
            >
              Lưu thay đổi
            </Button>
          </Space>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" description="Đang tải dữ liệu hồ sơ thương hiệu từ máy chủ..." />
        </div>
      ) : (
        <>
          {/* 2. Cover Banner & Header Card */}
          <div className="brand-cover-wrapper">
            <img src={profile.coverImage} alt="Cover" className="brand-cover-img" />
            <Button
              size="small"
              icon={<CameraOutlined />}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'rgba(0,0,0,0.4)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
              }}
              onClick={() => message.info('Tính năng đổi ảnh bìa sẽ sớm ra mắt')}
            >
              Đổi ảnh bìa
            </Button>
          </div>

          <div className="brand-header-card">
            <Row gutter={[20, 16]} align="middle">
              <Col xs={24} sm="auto">
                <div style={{ position: 'relative', width: 84, height: 84 }}>
                  <Avatar
                    src={profile.logo}
                    size={84}
                    shape="square"
                    className="brand-logo-avatar"
                  />
                  <Tooltip title="Đổi logo">
                    <Button
                      size="small"
                      shape="circle"
                      icon={<CameraOutlined />}
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                      onClick={() => message.info('Tính năng cập nhật logo sẽ sớm ra mắt')}
                    />
                  </Tooltip>
                </div>
              </Col>

              <Col xs={24} sm={16} md={18}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: '#0F172A' }}>
                    {profile.brandName || 'Tên thương hiệu chưa đặt'}
                  </h2>
                  <Tag
                    color="success"
                    icon={<CheckCircleFilled />}
                    style={{ borderRadius: 999, fontWeight: 700 }}
                  >
                    Thương hiệu SME
                  </Tag>
                  <Tag color="purple" style={{ borderRadius: 999, fontWeight: 600 }}>
                    {profile.industry}
                  </Tag>
                </div>

                <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  {profile.description || 'Chưa có mô tả ngắn về thương hiệu'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    marginTop: 8,
                    flexWrap: 'wrap',
                    fontSize: 12,
                    color: '#475569',
                  }}
                >
                  {profile.website && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <GlobalOutlined style={{ color: '#5B5BF0' }} /> {profile.website}
                    </span>
                  )}
                  {profile.location && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <EnvironmentOutlined style={{ color: '#10B981' }} /> {profile.location}
                    </span>
                  )}
                  {profile.preferredPlatforms.length > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ShareAltOutlined style={{ color: '#EC4899' }} /> Nền tảng: {profile.preferredPlatforms.join(', ')}
                    </span>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          {/* 3. Form Content in Tabs */}
          <Card className="brand-form-card" styles={{ body: { padding: '8px 24px 24px 24px' } }}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              size="large"
              items={[
                {
                  key: 'general',
                  label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                      <ShopOutlined /> Thông tin thương hiệu
                    </span>
                  ),
                  children: (
                    <div style={{ marginTop: 16 }}>
                      <Form layout="vertical">
                        <Row gutter={[20, 16]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<strong>Tên thương hiệu hiển thị</strong>}
                              required
                              tooltip="Tên cửa hàng / nhãn hàng của bạn sẽ xuất hiện trên chiến dịch và khi gửi lời mời tới Creator"
                            >
                              <Input
                                value={profile.brandName}
                                onChange={(e) => setProfile({ ...profile, brandName: e.target.value })}
                                size="large"
                                placeholder="Nhập tên thương hiệu hoặc tên shop..."
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<strong>Website hoặc Gian hàng online</strong>}
                              tooltip="Đường link website, TikTok Shop, Shopee hoặc Fanpage chính thức của bạn"
                            >
                              <Input
                                prefix={<GlobalOutlined style={{ color: '#94A3B8' }} />}
                                value={profile.website}
                                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                size="large"
                                placeholder="https://..."
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={[20, 16]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<strong>Địa chỉ / Khu vực hoạt động chính</strong>}
                              tooltip="Thành phố hoặc địa chỉ cửa hàng/kho của bạn"
                            >
                              <Input
                                prefix={<EnvironmentOutlined style={{ color: '#94A3B8' }} />}
                                value={profile.location}
                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                size="large"
                                placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng..."
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<strong>Giọng điệu thương hiệu (Brand Tone)</strong>}
                              tooltip="Phong cách giao tiếp và truyền thông mong muốn khi Creator sáng tạo nội dung"
                            >
                              <Select
                                value={profile.brandTone}
                                onChange={(val) => setProfile({ ...profile, brandTone: val })}
                                size="large"
                                options={[
                                  { value: 'Thân thiện', label: 'Thân thiện, gần gũi' },
                                  { value: 'Trẻ trung', label: 'Trẻ trung, năng động' },
                                  { value: 'Chuyên nghiệp', label: 'Chuyên nghiệp, đáng tin cậy' },
                                  { value: 'Hài hước', label: 'Hài hước, bắt trend' },
                                  { value: 'Sang trọng', label: 'Sang trọng, tinh tế' },
                                  { value: 'Chân thật', label: 'Chân thật, mộc mạc' },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          label={<strong>Mô tả thương hiệu & định hướng</strong>}
                          tooltip="Giới thiệu câu chuyện thương hiệu, sản phẩm chính và thông điệp bạn muốn Creator hiểu rõ"
                        >
                          <TextArea
                            rows={4}
                            value={profile.description}
                            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                            style={{ borderRadius: 10 }}
                            placeholder="Mô tả ngắn gọn về thương hiệu, điểm mạnh của sản phẩm hoặc định hướng hợp tác cùng Creator..."
                          />
                        </Form.Item>
                      </Form>
                    </div>
                  ),
                },
                {
                  key: 'products',
                  label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                      <AppstoreOutlined /> Ngành hàng & Sản phẩm
                    </span>
                  ),
                  children: (
                    <div style={{ marginTop: 16 }}>
                      <Form layout="vertical">
                        <Form.Item
                          label={<strong>Ngành hàng kinh doanh chính</strong>}
                          required
                          tooltip="Lĩnh vực cốt lõi để AI lọc ra các Creator chuyên nghiệp trong ngành"
                        >
                          <Select
                            value={profile.industry}
                            onChange={(val) => setProfile({ ...profile, industry: val })}
                            size="large"
                            options={[
                              { value: 'Mỹ phẩm & Chăm sóc cá nhân', label: 'Mỹ phẩm & Chăm sóc cá nhân' },
                              { value: 'Thời trang & Phụ kiện', label: 'Thời trang & Phụ kiện' },
                              { value: 'Ẩm thực & Đồ uống', label: 'Ẩm thực & Đồ uống' },
                              { value: 'Công nghệ & Điện tử', label: 'Công nghệ & Điện tử' },
                              { value: 'Mẹ và Bé', label: 'Mẹ và Bé' },
                              { value: 'Sức khỏe & Thể hình', label: 'Sức khỏe & Thể hình' },
                              { value: 'Gia dụng & Đời sống', label: 'Gia dụng & Đời sống' },
                              { value: 'Du lịch & Trải nghiệm', label: 'Du lịch & Trải nghiệm' },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item
                          label={<strong>Danh mục sản phẩm / Dòng sản phẩm thế mạnh</strong>}
                          tooltip="Các sản phẩm cụ thể bạn thường xuyên triển khai chiến dịch với Creator"
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            {profile.subCategories.map((cat) => (
                              <Tag
                                key={cat}
                                closable
                                onClose={() => handleRemoveSubCat(cat)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 8,
                                  fontSize: 13,
                                  background: '#F1F5F9',
                                  borderColor: '#E2E8F0',
                                  color: '#1E293B',
                                }}
                              >
                                {cat}
                              </Tag>
                            ))}

                            {isAddingSubCat ? (
                              <Space.Compact>
                                <Input
                                  size="small"
                                  style={{ width: 160 }}
                                  value={inputSubCat}
                                  onChange={(e) => setInputSubCat(e.target.value)}
                                  onPressEnter={handleAddSubCategory}
                                  placeholder="Nhập tên sản phẩm..."
                                  autoFocus
                                />
                                <Button size="small" type="primary" onClick={handleAddSubCategory}>
                                  Thêm
                                </Button>
                              </Space.Compact>
                            ) : (
                              <Button
                                size="small"
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => setIsAddingSubCat(true)}
                              >
                                Thêm sản phẩm
                              </Button>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                            Hệ thống AI sẽ dựa trên danh mục sản phẩm này để gợi ý các Creator có nội dung chuyên môn tương đồng.
                          </div>
                        </Form.Item>
                      </Form>
                    </div>
                  ),
                },
                {
                  key: 'target',
                  label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                      <AimOutlined /> Khách hàng & Nền tảng
                    </span>
                  ),
                  children: (
                    <div style={{ marginTop: 16 }}>
                      <Form layout="vertical">
                        <Form.Item
                          label={<strong>Nền tảng mạng xã hội muốn ưu tiên hợp tác</strong>}
                          tooltip="Chọn các nền tảng bạn muốn Creator đăng tải video / bài viết quảng bá"
                        >
                          <Checkbox.Group
                            value={profile.preferredPlatforms}
                            onChange={(vals) =>
                              setProfile({ ...profile, preferredPlatforms: vals as string[] })
                            }
                            style={{ width: '100%' }}
                          >
                            <Row gutter={[16, 12]}>
                              {[
                                { value: 'TIKTOK', label: 'TikTok (Video ngắn / Livestream)' },
                                { value: 'INSTAGRAM', label: 'Instagram (Reels / Story / Post)' },
                                { value: 'FACEBOOK', label: 'Facebook (Reels / Post)' },
                                { value: 'YOUTUBE', label: 'YouTube (Shorts / Video dài)' },
                              ].map((item) => (
                                <Col xs={24} sm={12} key={item.value}>
                                  <div
                                    style={{
                                      padding: '12px 16px',
                                      borderRadius: 10,
                                      border: profile.preferredPlatforms.includes(item.value)
                                        ? '1.5px solid #5B5BF0'
                                        : '1px solid #E2E8F0',
                                      background: profile.preferredPlatforms.includes(item.value)
                                        ? '#EEF2FF'
                                        : '#FFFFFF',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    <Checkbox value={item.value} style={{ width: '100%', fontWeight: 600 }}>
                                      {item.label}
                                    </Checkbox>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </Checkbox.Group>
                        </Form.Item>

                        <Row gutter={[20, 16]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<strong>Thị trường mục tiêu (Khu vực)</strong>}
                              tooltip="Các tỉnh thành hoặc khu vực khách hàng tiềm năng của bạn"
                            >
                              <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                value={profile.targetLocations}
                                onChange={(vals) => setProfile({ ...profile, targetLocations: vals })}
                                size="large"
                                options={[
                                  { value: 'Toàn quốc', label: 'Toàn quốc' },
                                  { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
                                  { value: 'Hà Nội', label: 'Hà Nội' },
                                  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                                  { value: 'Cần Thơ', label: 'Cần Thơ' },
                                  { value: 'Hải Phòng', label: 'Hải Phòng' },
                                  { value: 'Miền Nam', label: 'Miền Nam' },
                                  { value: 'Miền Bắc', label: 'Miền Bắc' },
                                  { value: 'Miền Trung', label: 'Miền Trung' },
                                ]}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<strong>Độ tuổi khách hàng mục tiêu</strong>}
                              tooltip="AI sẽ ưu tiên Creator có tệp khán giả người theo dõi trong các độ tuổi này"
                            >
                              <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                value={profile.targetAgeRange}
                                onChange={(vals) => setProfile({ ...profile, targetAgeRange: vals })}
                                size="large"
                                options={[
                                  { value: 'Dưới 18 tuổi', label: 'Dưới 18 tuổi (Học sinh)' },
                                  { value: '18 - 24 tuổi', label: '18 - 24 tuổi (Sinh viên & Trẻ tuổi)' },
                                  { value: '25 - 34 tuổi', label: '25 - 34 tuổi (Người đi làm)' },
                                  { value: '35 - 44 tuổi', label: '35 - 44 tuổi (Gia đình)' },
                                  { value: 'Trên 45 tuổi', label: 'Trên 45 tuổi' },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Form>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
