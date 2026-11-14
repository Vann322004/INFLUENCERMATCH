import React, { useState, useEffect } from 'react';
import {
  App,
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
  Space,
  Tooltip,
  Spin,
  Checkbox,
  Alert,
} from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { authService } from '../../services/api/authService';
import { deferBrandOnboarding, hasDeferredBrandOnboarding } from '../../services/brandOnboarding';
import type { BrandRequest, BrandResponse } from '../../types/api/brand.types';
import { getErrorMessage } from '../../services/apiClient';
import GoogleLinkModal from './GoogleLinkModal';
import './BrandProfilePage.css';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface BrandProfileState {
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
  phoneNumber: string;
}

const EMPTY_BRAND_PROFILE: BrandProfileState = {
  brandName: '',
  description: '',
  logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80',
  coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
  website: '',
  location: '',
  industry: '',
  subCategories: [],
  targetLocations: [],
  targetAgeRange: [],
  brandTone: '',
  preferredPlatforms: [],
  phoneNumber: '',
};

const requiredFields = [
  ['businessName', 'general', 'Nhập tên thương hiệu.'],
  ['phoneNumber', 'general', 'Nhập số điện thoại.'],
  ['brandTone', 'general', 'Chọn giọng điệu thương hiệu.'],
  ['industry', 'products', 'Chọn ngành hàng.'],
  ['productCategories', 'products', 'Thêm ít nhất một nhóm sản phẩm.'],
  ['targetAudiences', 'target', 'Chọn ít nhất một nhóm khách hàng.'],
  ['preferredPlatforms', 'target', 'Chọn ít nhất một nền tảng.'],
] as const;

function toForm(brand: BrandResponse | null): BrandProfileState {
  return {
    ...EMPTY_BRAND_PROFILE,
    brandName: brand?.businessName ?? '',
    description: brand?.description ?? '',
    industry: brand?.industry ?? '',
    subCategories: brand?.productCategories ?? [],
    website: brand?.website ?? '',
    location: brand?.location ?? '',
    targetLocations: brand?.targetMarkets ?? [],
    targetAgeRange: brand?.targetAudiences ?? [],
    brandTone: brand?.brandTone ?? '',
    preferredPlatforms: brand?.preferredPlatforms ?? [],
    phoneNumber: brand?.phoneNumber ?? '',
  };
}

export function BrandOnboardingPage() {
  const user = authService.getCurrentUser();
  if (!authService.isAuthenticated() || !user?.id) return <Navigate to="/login" replace />;
  if (authService.isCreator()) return <Navigate to="/creator/dashboard" replace />;
  if (authService.hasManagementAccess()) return <Navigate to="/admin/dashboard" replace />;
  if (user.role !== 'BRAND' || hasDeferredBrandOnboarding(user.id)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <BrandProfilePage key={user.id} onboardingUserId={user.id} />;
}

export default function BrandProfilePage({ onboardingUserId }: { onboardingUserId?: string }) {
  const isOnboarding = !!onboardingUserId;
  const { modal, message } = App.useApp();
  const [profile, setProfile] = useState<BrandProfileState>(EMPTY_BRAND_PROFILE);
  const [brand, setBrand] = useState<BrandResponse | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'save' | 'complete' | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('general');
  const [inputSubCat, setInputSubCat] = useState('');
  const [isAddingSubCat, setIsAddingSubCat] = useState(false);
  const [linkGoogleOpen, setLinkGoogleOpen] = useState(false);
  const navigate = useNavigate();
  const pending = brand?.onboardingStatus !== 'COMPLETED';
  const permissions = authService.getCurrentUser()?.permissions ?? [];
  const canEdit = permissions.includes(brand ? 'UPDATE_BRAND_PROFILE' : 'CREATE_BRAND_PROFILE');
  const canComplete = canEdit && permissions.includes('UPDATE_BRAND_PROFILE');
  const busy = loading || action !== null;
  const writeDisabled = busy || !!loadError || conflict || !canEdit || (!!brand && !etag);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError('');
    brandService.getMyBrandForEdit()
      .then((editable) => {
        if (!mounted) return;
        const loaded = editable?.brand ?? null;
        if (isOnboarding && loaded?.onboardingStatus === 'COMPLETED') {
          navigate('/dashboard', { replace: true });
          return;
        }
        setBrand(loaded);
        setProfile(toForm(loaded));
        setEtag(editable?.etag ?? null);
        setFieldErrors({});
        setConflict(false);
      })
      .catch((err) => {
        if (mounted) setLoadError(getErrorMessage(err, 'Không tải được hồ sơ. Vui lòng thử lại.'));
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [isOnboarding, loadAttempt, navigate]);

  function showFieldErrors(errors: Record<string, string>) {
    setFieldErrors(errors);
    const first = requiredFields.find(([name]) => errors[name]);
    if (first) setActiveTab(first[1]);
  }

  const feedback = (field: string) => ({
    validateStatus: fieldErrors[field] ? 'error' as const : undefined,
    help: fieldErrors[field],
  });

  const handleSaveProfile = async (complete: boolean) => {
    if (writeDisabled || (complete && !canComplete)) return;
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
      phoneNumber: profile.phoneNumber.trim() || null,
    };
    const errors: Record<string, string> = {};
    for (const [field, , hint] of requiredFields) {
      if (field !== 'businessName' && !complete && pending) continue;
      const value = payload[field];
      if (Array.isArray(value) ? value.length === 0 : !value?.trim()) errors[field] = hint;
    }
    if (payload.phoneNumber && !/^(?:0[0-9]{9,10}|\+[1-9][0-9]{7,14})$/.test(payload.phoneNumber.replace(/[\s().-]/g, ''))) {
      errors.phoneNumber = 'Nhập số điện thoại Việt Nam hoặc số quốc tế bắt đầu bằng +.';
    }
    if (profile.preferredPlatforms.length > 3) errors.preferredPlatforms = 'Chọn tối đa ba nền tảng.';
    showFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setAction(complete ? 'complete' : 'save');
    let savedProfile = false;
    try {
      const saved = await brandService.saveMyBrand(payload, etag);
      savedProfile = true;
      setBrand(saved.brand);
      setProfile(toForm(saved.brand));
      setEtag(saved.etag);
      if (!complete) {
        message.success('Đã lưu hồ sơ thương hiệu.');
        return;
      }
      if (!saved.etag) throw new Error('Hãy tải lại hồ sơ để lấy phiên bản vừa lưu.');
      const completed = await brandService.completeOnboarding(saved.etag);
      setBrand(completed.brand);
      setEtag(completed.etag);
      if (completed.brand.onboardingStatus !== 'COMPLETED') throw new Error('Hệ thống chưa xác nhận hoàn tất hồ sơ.');
      message.success('Đã hoàn tất hồ sơ thương hiệu.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const result = (err as { response?: { status?: number; data?: { fieldErrors?: Record<string, string[]> } } }).response;
      if (result?.status === 409) setConflict(true);
      if (result?.data?.fieldErrors) {
        showFieldErrors(Object.fromEntries(Object.entries(result.data.fieldErrors).map(([field, reasons]) => [
          field, requiredFields.find(([name]) => name === field)?.[2] ?? reasons.join(' '),
        ])));
      }
      const detail = getErrorMessage(err, err instanceof Error ? err.message : 'Vui lòng thử lại.');
      message.error(savedProfile ? 'Đã lưu hồ sơ. ' + detail : detail);
    } finally {
      setAction(null);
    }
  };

  function handleDefer() {
    if (!onboardingUserId || action) return;
    const leave = () => {
      deferBrandOnboarding(onboardingUserId);
      navigate('/dashboard', { replace: true });
    };
    if (JSON.stringify(profile) === JSON.stringify(toForm(brand)) && !inputSubCat.trim()) {
      leave();
      return;
    }
    modal.confirm({
      title: 'Để sau và bỏ thay đổi đang nhập?',
      content: 'Khi quay lại Hồ sơ thương hiệu, bạn sẽ tiếp tục từ bản đã lưu.',
      okText: 'Để sau',
      cancelText: 'Tiếp tục nhập',
      onOk: leave,
    });
  }

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
    <div className={isOnboarding ? 'brand-profile-container brand-onboarding' : 'brand-profile-container'}>
      {linkGoogleOpen && <GoogleLinkModal onClose={() => setLinkGoogleOpen(false)} />}
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
              {isOnboarding ? 'Thiết lập hồ sơ thương hiệu' : 'Hồ sơ thương hiệu'}
            </Title>
            <Paragraph style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0 0' }}>
              {isOnboarding
                ? 'Điền thông tin thương hiệu để chuẩn bị cho chiến dịch đầu tiên. Bạn có thể hoàn tất sau trong Hồ sơ thương hiệu.'
                : 'Quản lý thông tin thương hiệu, ngành hàng và khách hàng mục tiêu.'}
            </Paragraph>
          </div>

          <Space wrap className="brand-profile-actions">
            {!isOnboarding && authService.getCurrentUser()?.role === 'BRAND' &&
              <Button onClick={() => setLinkGoogleOpen(true)}>Liên kết Google</Button>}
            {isOnboarding ? (
              <Button onClick={handleDefer} disabled={action !== null}>Để sau</Button>
            ) : (
              <Button icon={<SaveOutlined />} type={pending ? 'default' : 'primary'}
                onClick={() => handleSaveProfile(false)} loading={action === 'save'} disabled={writeDisabled}>
                Lưu thay đổi
              </Button>
            )}
            {pending && canComplete && (
              <Button type="primary" onClick={() => handleSaveProfile(true)}
                loading={action === 'complete'} disabled={writeDisabled}>
                Hoàn tất hồ sơ
              </Button>
            )}
          </Space>
        </div>
      </div>

      {loadError && <Alert type="error" showIcon title="Không tải được hồ sơ" description={loadError}
        action={<Button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Thử lại</Button>} />}
      {conflict && <Alert type="warning" showIcon title="Hồ sơ đã thay đổi"
        description="Nội dung đang nhập vẫn ở trên màn hình. Hãy sao chép thay đổi cần giữ, rồi tải lại trang để đối chiếu với bản mới." />}
      {!isOnboarding && !loading && !loadError && (
        <Alert type={pending ? 'info' : 'success'} showIcon
          title={pending ? 'Hồ sơ chưa hoàn tất' : 'Hồ sơ đã hoàn tất'}
          description={pending ? 'Bạn có thể lưu dở và hoàn tất hồ sơ sau khi điền đủ thông tin bắt buộc.' : undefined} />
      )}
      <Spin spinning={loading} tip="Đang đồng bộ dữ liệu hồ sơ thương hiệu...">
        <div style={{ marginTop: 8 }}>
          {!isOnboarding && <>
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
                    <Tag color="blue" style={{ borderRadius: 999, fontWeight: 600 }}>
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
                        <GlobalOutlined style={{ color: '#2563EB' }} /> {profile.website}
                      </span>
                    )}
                    {profile.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <EnvironmentOutlined style={{ color: '#10B981' }} /> {profile.location}
                      </span>
                    )}
                    {profile.preferredPlatforms.length > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <ShareAltOutlined style={{ color: '#2563EB' }} /> Nền tảng: {profile.preferredPlatforms.join(', ')}
                      </span>
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          </>}

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
                      <Form layout="vertical" disabled={busy || !!loadError || !canEdit}>
                        <Row gutter={[20, 16]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label={<strong>Tên thương hiệu hiển thị</strong>}
                          {...feedback('businessName')}
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
                          {...feedback('website')}
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
                          {...feedback('brandTone')}
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

                        <Form.Item label={<strong>Số điện thoại</strong>} required {...feedback('phoneNumber')}>
                          <Input type="tel" autoComplete="tel" size="large" maxLength={30} value={profile.phoneNumber}
                            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })} />
                        </Form.Item>
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
                      <Form layout="vertical" disabled={busy || !!loadError || !canEdit}>
                        <Form.Item
                          label={<strong>Ngành hàng kinh doanh chính</strong>}
                          {...feedback('industry')}
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
                          {...feedback('productCategories')}
                          tooltip="Các sản phẩm cụ thể bạn thường xuyên triển khai chiến dịch với Creator"
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            {profile.subCategories.map((cat) => (
                              <Tag
                                key={cat}
                                closable
                                onClose={(event) => { event.preventDefault(); if (!busy && canEdit) handleRemoveSubCat(cat); }}
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
                      <Form layout="vertical" disabled={busy || !!loadError || !canEdit}>
                        <Form.Item
                          label={<strong>Nền tảng mạng xã hội muốn ưu tiên hợp tác</strong>}
                          {...feedback('preferredPlatforms')}
                          extra="Chọn tối đa ba nền tảng."
                          tooltip="Chọn các nền tảng bạn muốn Creator đăng tải video / bài viết quảng bá"
                        >
                          <Checkbox.Group
                            value={profile.preferredPlatforms}
                            onChange={(vals) =>
                              vals.length <= 3 && setProfile({ ...profile, preferredPlatforms: vals })
                            }
                            style={{ width: '100%' }}
                          >
                            <Row gutter={[16, 12]}>
                              {[
                                { value: 'TIKTOK', label: 'TikTok (Video ngắn / Livestream)' },
                                { value: 'INSTAGRAM', label: 'Instagram (Reels / Story / Post)' },
                                { value: 'YOUTUBE', label: 'YouTube (Shorts / Video dài)' },
                              ].map((item) => (
                                <Col xs={24} sm={12} key={item.value}>
                                  <div
                                    style={{
                                      padding: '12px 16px',
                                      borderRadius: 10,
                                      border: profile.preferredPlatforms.includes(item.value)
                                        ? '1.5px solid #2563EB'
                                        : '1px solid #E2E8F0',
                                      background: profile.preferredPlatforms.includes(item.value)
                                        ? '#EFF6FF'
                                        : '#FFFFFF',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    <Checkbox value={item.value}
                                      disabled={profile.preferredPlatforms.length >= 3 && !profile.preferredPlatforms.includes(item.value)}
                                      style={{ width: '100%', fontWeight: 600 }}>
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
                          {...feedback('targetAudiences')}
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
        </div>
      </Spin>
    </div>
  );
}
