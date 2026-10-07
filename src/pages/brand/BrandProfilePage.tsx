import React, { useState } from 'react';
import {
  Breadcrumb,
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
  Slider,
  message,
  Space,
  Divider,
  Upload,
  Tooltip,
} from 'antd';
import {
  ShopOutlined,
  CheckCircleFilled,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  TeamOutlined,
  AimOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  CameraOutlined,
  PlusOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { INITIAL_BRAND_PROFILE } from '../../data/mockData';
import type { BrandProfileData } from '../../data/mockData';
import './BrandProfilePage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function BrandProfilePage() {
  const [profile, setProfile] = useState<BrandProfileData>(INITIAL_BRAND_PROFILE);
  const [activeTab, setActiveTab] = useState('business');
  const [form] = Form.useForm();

  // New tag inputs
  const [inputSubCat, setInputSubCat] = useState('');
  const [isAddingSubCat, setIsAddingSubCat] = useState(false);

  const handleSaveProfile = () => {
    message.loading({ content: 'Đang lưu hồ sơ thương hiệu...', key: 'save_profile' });
    setTimeout(() => {
      message.success({
        content: 'Hồ sơ thương hiệu đã được cập nhật thành công!',
        key: 'save_profile',
        duration: 3,
      });
    }, 800);
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
      {/* 1. Breadcrumbs */}
      <div>
        <Breadcrumb
          separator="/"
          items={[
            { title: <span style={{ color: '#94A3B8' }}>Không gian làm việc</span> },
            { title: <span style={{ color: '#94A3B8' }}>Cài đặt</span> },
            { title: <span style={{ color: '#5B5BF0', fontWeight: 600 }}>Hồ sơ thương hiệu</span> },
          ]}
          style={{ marginBottom: 6, fontSize: 12.5 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>
              Hồ sơ thương hiệu (Brand Profile)
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
          onClick={() => message.info('Chọn ảnh bìa thương hiệu mới')}
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
                  onClick={() => message.info('Tải logo vuông mới lên')}
                />
              </Tooltip>
            </div>
          </Col>

          <Col xs={24} sm={16} md={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: '#0F172A' }}>
                {profile.brandName}
              </h2>
              <Tag
                color="success"
                icon={<CheckCircleFilled />}
                style={{ borderRadius: 999, fontWeight: 700 }}
              >
                Đã xác minh doanh nghiệp
              </Tag>
              <Tag color="purple" style={{ borderRadius: 999, fontWeight: 600 }}>
                {profile.industry}
              </Tag>
            </div>

            <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
              {profile.tagline}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', fontSize: 12, color: '#475569' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <GlobalOutlined style={{ color: '#5B5BF0' }} /> {profile.website}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <EnvironmentOutlined style={{ color: '#10B981' }} /> {profile.headquarters.split(',')[3] || 'TP. Hồ Chí Minh'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <TeamOutlined style={{ color: '#F59E0B' }} /> {profile.companySize}
              </span>
            </div>
          </Col>
        </Row>
      </div>

      {/* 3. Form Content in Tabs */}
      <Card className="brand-form-card" bodyStyle={{ padding: '8px 24px 24px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          size="large"
          items={[
            {
              key: 'business',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <ShopOutlined /> Thông tin doanh nghiệp
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  <Form layout="vertical">
                    <Row gutter={[20, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item label={<strong>Tên thương hiệu hiển thị (Brand Name)</strong>} required>
                          <Input
                            value={profile.brandName}
                            onChange={(e) => setProfile({ ...profile, brandName: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label={<strong>Khẩu hiệu / Slogan ngắn</strong>}>
                          <Input
                            value={profile.tagline}
                            onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[20, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item label={<strong>Tên pháp lý công ty (Theo ĐKKD)</strong>} required>
                          <Input
                            value={profile.legalName}
                            onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label={<strong>Mã số thuế doanh nghiệp (MST)</strong>} required>
                          <Input
                            value={profile.taxCode}
                            onChange={(e) => setProfile({ ...profile, taxCode: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[20, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item label={<strong>Website chính thức</strong>}>
                          <Input
                            prefix={<GlobalOutlined style={{ color: '#94A3B8' }} />}
                            value={profile.website}
                            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label={<strong>Email liên hệ chiến dịch</strong>} required>
                          <Input
                            prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
                            value={profile.contactEmail}
                            onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label={<strong>Hotline / Số điện thoại</strong>}>
                          <Input
                            prefix={<PhoneOutlined style={{ color: '#94A3B8' }} />}
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[20, 16]}>
                      <Col xs={24} md={16}>
                        <Form.Item label={<strong>Địa chỉ trụ sở chính</strong>}>
                          <Input
                            prefix={<EnvironmentOutlined style={{ color: '#94A3B8' }} />}
                            value={profile.headquarters}
                            onChange={(e) => setProfile({ ...profile, headquarters: e.target.value })}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label={<strong>Quy mô nhân sự</strong>}>
                          <Select
                            value={profile.companySize}
                            onChange={(val) => setProfile({ ...profile, companySize: val })}
                            size="large"
                            options={[
                              { value: 'Dưới 10 nhân viên', label: 'Dưới 10 nhân viên (Startup)' },
                              { value: '10 - 50 nhân viên', label: '10 - 50 nhân viên' },
                              { value: '50 - 200 nhân viên', label: '50 - 200 nhân viên' },
                              { value: 'Trên 200 nhân viên', label: 'Trên 200 nhân viên (Tập đoàn)' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '14px 0 20px 0' }} />

                    <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                      Kênh truyền thông & Gian hàng trực tuyến:
                    </div>
                    <Row gutter={[20, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Facebook Fanpage">
                          <Input
                            value={profile.socialLinks.facebook}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                socialLinks: { ...profile.socialLinks, facebook: e.target.value },
                              })
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Instagram">
                          <Input
                            value={profile.socialLinks.instagram}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                socialLinks: { ...profile.socialLinks, instagram: e.target.value },
                              })
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Kênh TikTok">
                          <Input
                            value={profile.socialLinks.tiktok}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                socialLinks: { ...profile.socialLinks, tiktok: e.target.value },
                              })
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Shopee Mall / Lazada">
                          <Input
                            value={profile.socialLinks.shopee}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                socialLinks: { ...profile.socialLinks, shopee: e.target.value },
                              })
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </div>
              ),
            },
            {
              key: 'industry',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <ShareAltOutlined /> Ngành hàng & Phân khúc
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  <Form layout="vertical">
                    <Row gutter={[20, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item label={<strong>Ngành hàng kinh doanh chính</strong>} required>
                          <Select
                            value={profile.industry}
                            onChange={(val) => setProfile({ ...profile, industry: val })}
                            size="large"
                            options={[
                              { value: 'Mỹ phẩm & Chăm sóc cá nhân', label: 'Mỹ phẩm & Chăm sóc cá nhân (Beauty & Care)' },
                              { value: 'Thời trang & Phụ kiện', label: 'Thời trang & Phụ kiện (Fashion)' },
                              { value: 'Ẩm thực & Đồ uống', label: 'Ẩm thực & Đồ uống (F&B)' },
                              { value: 'Công nghệ & Điện tử', label: 'Công nghệ & Điện tử (Tech)' },
                              { value: 'Mẹ và Bé', label: 'Mẹ và Bé (Mom & Baby)' },
                              { value: 'Sức khỏe & Thể hình', label: 'Sức khỏe & Thể hình (Fitness & Health)' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label={<strong>Phân khúc giá sản phẩm</strong>}>
                          <Select
                            value={profile.priceSegment}
                            onChange={(val) => setProfile({ ...profile, priceSegment: val })}
                            size="large"
                            options={[
                              { value: 'Bình dân / Học sinh sinh viên (Dưới 300.000 ₫)', label: 'Bình dân (Dưới 300.000 ₫)' },
                              { value: 'Tầm trung - Cận cao cấp (300.000 ₫ - 800.000 ₫)', label: 'Tầm trung - Cận cao cấp (300.000 ₫ - 800.000 ₫)' },
                              { value: 'Cao cấp (800.000 ₫ - 2.500.000 ₫)', label: 'Cao cấp (800.000 ₫ - 2.500.000 ₫)' },
                              { value: 'Xa xỉ / Luxury (Trên 2.500.000 ₫)', label: 'Xa xỉ / Luxury (Trên 2.500.000 ₫)' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label={<strong>Thẻ ngành phụ & Danh mục sản phẩm (Sub-categories)</strong>}>
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
                              placeholder="Nhập tên ngành..."
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
                            Thêm danh mục
                          </Button>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                        AI sẽ dựa trên các danh mục này để quét các Creator có nội dung chuyên sâu tương thích.
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
                  <AimOutlined /> Khách hàng mục tiêu (Target Persona)
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  <Row gutter={[24, 20]}>
                    <Col xs={24} md={12}>
                      <div className="persona-metric-box">
                        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                          Tỷ lệ giới tính khách hàng mục tiêu:
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                          <span style={{ color: '#EC4899' }}>Nữ: {profile.targetGender.female}%</span>
                          <span style={{ color: '#2563EB' }}>Nam: {profile.targetGender.male}%</span>
                        </div>
                        <Slider
                          value={profile.targetGender.female}
                          onChange={(val) =>
                            setProfile({
                              ...profile,
                              targetGender: { female: val, male: 100 - val },
                            })
                          }
                          trackStyle={{ backgroundColor: '#EC4899' }}
                          handleStyle={{ borderColor: '#EC4899' }}
                        />
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 6 }}>
                          Kéo thanh để điều chỉnh tỷ lệ chân dung người mua.
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="persona-metric-box">
                        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                          Nhóm tuổi khách hàng trọng tâm:
                        </div>
                        <Select
                          mode="multiple"
                          style={{ width: '100%' }}
                          value={profile.targetAgeRange}
                          onChange={(vals) => setProfile({ ...profile, targetAgeRange: vals })}
                          size="large"
                          options={[
                            { value: 'Dưới 18 tuổi', label: 'Dưới 18 tuổi (Gen Z nhỏ)' },
                            { value: '18 - 24 tuổi', label: '18 - 24 tuổi (Sinh viên & Mới đi làm)' },
                            { value: '25 - 34 tuổi', label: '25 - 34 tuổi (Dân văn phòng, Thu nhập ổn định)' },
                            { value: '35 - 44 tuổi', label: '35 - 44 tuổi (Gia đình, Trung niên)' },
                            { value: 'Trên 45 tuổi', label: 'Trên 45 tuổi' },
                          ]}
                        />
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 8 }}>
                          AI sẽ ưu tiên Creator có tệp người theo dõi thuộc các độ tuổi đã chọn.
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="persona-metric-box">
                        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                          Khu vực địa lý tập trung:
                        </div>
                        <Select
                          mode="multiple"
                          style={{ width: '100%' }}
                          value={profile.targetLocations}
                          onChange={(vals) => setProfile({ ...profile, targetLocations: vals })}
                          size="large"
                          options={[
                            { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
                            { value: 'Hà Nội', label: 'Hà Nội' },
                            { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                            { value: 'Cần Thơ', label: 'Cần Thơ' },
                            { value: 'Hải Phòng', label: 'Hải Phòng' },
                            { value: 'Toàn quốc', label: 'Toàn quốc' },
                          ]}
                        />
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="persona-metric-box">
                        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                          Mối quan tâm chính của khách hàng (Interests):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {profile.customerInterests.map((interest) => (
                            <Tag color="cyan" key={interest} style={{ borderRadius: 6, fontWeight: 500 }}>
                              {interest}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'assets',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <FileTextOutlined /> Hướng dẫn & Tài sản thương hiệu
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  <Form layout="vertical">
                    <Form.Item label={<strong>Tone of Voice (Giọng điệu thương hiệu khi Creator sáng tạo)</strong>}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {profile.toneOfVoice.map((tone) => (
                          <Tag color="geekblue" key={tone} style={{ padding: '4px 10px', fontSize: 13, borderRadius: 6 }}>
                            {tone}
                          </Tag>
                        ))}
                      </div>
                    </Form.Item>

                    <Form.Item label={<strong>Điểm bán hàng độc nhất (USPs - Unique Selling Points)</strong>}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {profile.usps.map((usp, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#F8FAFC',
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: '1px solid #E2E8F0',
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <CheckCircleFilled style={{ color: '#10B981' }} />
                            <span>{usp}</span>
                          </div>
                        ))}
                      </div>
                    </Form.Item>

                    <Form.Item label={<strong>Tóm tắt Brand Guidelines (Sẽ tự động đính kèm vào brief Creator)</strong>}>
                      <TextArea
                        rows={4}
                        value={profile.guidelinesSummary}
                        onChange={(e) => setProfile({ ...profile, guidelinesSummary: e.target.value })}
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>

                    <div style={{ marginTop: 16 }}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveProfile}
                        size="large"
                        style={{ background: '#5B5BF0', borderRadius: 10, fontWeight: 700 }}
                      >
                        Lưu toàn bộ hồ sơ
                      </Button>
                    </div>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
