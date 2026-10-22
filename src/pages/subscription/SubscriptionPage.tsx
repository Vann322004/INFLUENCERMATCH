import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Tabs,
  Button,
  Tag,
  Progress,
  Table,
  Modal,
  Radio,
  Input,
  message,
  Divider,
  Space,
  Tooltip,
  Badge,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CrownOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ThunderboltFilled,
  SafetyCertificateFilled,
  CreditCardOutlined,
  HistoryOutlined,
  PieChartOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  QrcodeOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  SubscriptionPlan,
  QuotaMetric,
  PaymentInvoice,
} from '../../data/mockData';
import { subscriptionService } from '../../services/api/subscriptionService';
import { brandService } from '../../services/api/brandService';
import { campaignService } from '../../services/api/campaignService';
import type { PlanResponse, SubscriptionResponse } from '../../types/api/subscription.types';
import { getErrorMessage } from '../../services/apiClient';
import './SubscriptionPage.css';

const { Title, Text, Paragraph } = Typography;

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('plans');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'vnpay' | 'momo'>('vnpay');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [paying, setPaying] = useState<boolean>(false);

  // Active Subscription Info from API
  const [subInfo, setSubInfo] = useState({
    currentPlanName: 'Professional',
    renewalDate: '18 thg 10, 2026',
    daysRemaining: 18,
    isActive: true,
    usedCampaigns: 0,
    totalCampaigns: 15,
    usedRefresh: 0,
    totalRefresh: 50,
  });

  // Dynamic Quota State to allow interactive add-on quota buying
  const [quotas, setQuotas] = useState<QuotaMetric[]>([]);
  const [selectedAddon, setSelectedAddon] = useState<{ id: string; name: string; add: number; unit: string; price: number } | null>(null);

  // Invoice state from API / Active Subscription
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoadingPlans(true);
      try {
        const [remotePlans, brand, campaigns] = await Promise.all([
          subscriptionService.getPlans().catch(() => []),
          brandService.getMyBrand().catch(() => null),
          campaignService.getCampaigns(0, 100).catch(() => []),
        ]);

        let activeSub: SubscriptionResponse | null = null;
        if (brand?.id) {
          const subs = await subscriptionService.getBrandSubscriptions(brand.id);
          activeSub = subs.find((s) => s.status === 'ACTIVE') || (subs.length > 0 ? subs[0] : null);
        }

        if (isMounted) {
          const mapped: SubscriptionPlan[] = remotePlans.map((p, idx) => ({
            id: p.id,
            name: p.planName.replace(/-[0-9]+$/, ''),
            subtitle: p.description || 'Gói dịch vụ chuyên nghiệp dành cho doanh nghiệp',
            priceMonthly: p.price,
            priceYearly: p.price * 10,
            isCurrent: activeSub ? p.id === activeSub.plan?.id : idx === 0,
            popular: idx === 1 || p.planName.toLowerCase().includes('pro'),
            badge: idx === 1 ? 'Khuyên Dùng • Phổ Biến' : undefined,
            features: [
              { text: `Tối đa ${p.campaignQuota} chiến dịch hoạt động`, included: true },
              { text: `Khám phá ${p.recommendationQuota} Creator / tháng`, included: true },
              { text: `Làm mới số liệu (Refresh) ${p.refreshQuota} Creator / tháng`, included: true },
              { text: 'Bộ lọc cơ bản theo ngành hàng & nền tảng', included: true },
              { text: 'Thanh toán trực tuyến bảo mật qua VNPAY', included: true, highlight: true },
            ],
          }));
          setPlans(mapped);

          if (activeSub) {
            const planName = activeSub.plan?.planName?.replace(/-[0-9]+$/, '') || 'Professional';
            const expTime = new Date(activeSub.expirationDate).getTime();
            const daysRemaining = Math.max(0, Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24)));
            const renewalDate = new Date(activeSub.expirationDate).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const totalCamp = activeSub.plan?.campaignQuota || 15;
            const usedCamp = activeSub.usedCampaignQuota || campaigns.length || 0;
            const totalReco = activeSub.plan?.recommendationQuota || 500;
            const usedReco = activeSub.usedRecommendationQuota || 0;
            const totalRef = activeSub.plan?.refreshQuota || 50;
            const usedRef = activeSub.usedRefreshQuota || 0;

            setSubInfo({
              currentPlanName: planName,
              renewalDate,
              daysRemaining,
              isActive: activeSub.status === 'ACTIVE',
              usedCampaigns: usedCamp,
              totalCampaigns: totalCamp,
              usedRefresh: usedRef,
              totalRefresh: totalRef,
            });

            setQuotas([
              {
                id: 'q-campaigns',
                title: 'Chiến dịch hoạt động',
                used: usedCamp,
                total: totalCamp,
                unit: 'chiến dịch',
                color: '#6366F1',
                description: 'Số lượng chiến dịch Influencer marketing đang vận hành',
              },
              {
                id: 'q-discovery',
                title: 'Khám phá & AI Semantic Search',
                used: usedReco,
                total: totalReco,
                unit: 'lượt',
                color: '#3B82F6',
                description: 'Lượt gợi ý Creator phù hợp từ mô hình AI Search',
              },
              {
                id: 'q-refresh',
                title: 'Làm mới số liệu AI (Refresh)',
                used: usedRef,
                total: totalRef,
                unit: 'lượt',
                color: '#10B981',
                description: 'Lượt cập nhật trực tiếp tương tác, follower Creator từ MXH',
              },
              {
                id: 'q-seats',
                title: 'Thành viên & Phân quyền',
                used: 1,
                total: 5,
                unit: 'tài khoản',
                color: '#EC4899',
                description: 'Số lượng nhân sự cùng tham gia quản trị thương hiệu',
              },
            ]);

            setInvoices([
              {
                id: activeSub.id,
                code: `VNP-${activeSub.id.slice(0, 8).toUpperCase()}`,
                planName: `Gói ${planName}`,
                billingPeriod: `${new Date(activeSub.startDate).toLocaleDateString('vi-VN')} – ${renewalDate}`,
                date: new Date(activeSub.startDate).toLocaleDateString('vi-VN'),
                amount: activeSub.plan?.price || 0,
                method: 'Cổng VNPAY (QR / ATM / Visa)',
                status: activeSub.status === 'ACTIVE' ? 'success' : 'pending',
                statusText: activeSub.status === 'ACTIVE' ? 'Đã kích hoạt' : activeSub.status,
              },
            ]);
          } else {
            // Chưa có subscription -> Free trial
            const usedCamp = campaigns.length;
            setSubInfo({
              currentPlanName: 'Trải Nghiệm (Free Trial)',
              renewalDate: 'Chưa kích hoạt gói trả phí',
              daysRemaining: 0,
              isActive: false,
              usedCampaigns: usedCamp,
              totalCampaigns: 3,
              usedRefresh: 0,
              totalRefresh: 5,
            });

            setQuotas([
              {
                id: 'q-campaigns',
                title: 'Chiến dịch hoạt động',
                used: usedCamp,
                total: 3,
                unit: 'chiến dịch',
                color: '#6366F1',
                description: 'Số lượng chiến dịch Influencer marketing đang vận hành',
              },
              {
                id: 'q-discovery',
                title: 'Khám phá & AI Semantic Search',
                used: 0,
                total: 20,
                unit: 'lượt',
                color: '#3B82F6',
                description: 'Lượt gợi ý Creator phù hợp từ mô hình AI Search',
              },
              {
                id: 'q-refresh',
                title: 'Làm mới số liệu AI (Refresh)',
                used: 0,
                total: 5,
                unit: 'lượt',
                color: '#10B981',
                description: 'Lượt cập nhật trực tiếp tương tác, follower Creator từ MXH',
              },
              {
                id: 'q-seats',
                title: 'Thành viên & Phân quyền',
                used: 1,
                total: 1,
                unit: 'tài khoản',
                color: '#EC4899',
                description: 'Số lượng nhân sự cùng tham gia quản trị thương hiệu',
              },
            ]);

            setInvoices([]);
          }
        }
      } catch (err) {
        console.error('Failed to load subscription data:', err);
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle plan upgrade click
  const handleOpenUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlanForUpgrade(plan);
    setVoucherApplied(false);
    setVoucherCode('');
    setIsUpgradeModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlanForUpgrade) return;
    setPaying(true);
    message.loading({ content: 'Đang kết nối cổng thanh toán VNPay...', key: 'upgrade_msg' });
    try {
      const res = await subscriptionService.subscribeVNPay(selectedPlanForUpgrade.id);
      if (res?.paymentUrl) {
        message.success({ content: 'Đang chuyển hướng tới cổng thanh toán VNPay...', key: 'upgrade_msg' });
        window.location.href = res.paymentUrl;
      } else {
        message.error({ content: 'Không tìm thấy liên kết thanh toán.', key: 'upgrade_msg' });
      }
    } catch (err) {
      message.error({ content: getErrorMessage(err, 'Khởi tạo thanh toán VNPay thất bại.'), key: 'upgrade_msg' });
    } finally {
      setPaying(false);
    }
  };

  // Handle buy addon quota
  const handleBuyAddon = (addon: { id: string; name: string; add: number; unit: string; price: number }) => {
    setSelectedAddon(addon);
    Modal.confirm({
      title: `Xác nhận mua thêm gói mở rộng`,
      content: (
        <div>
          <p>Bạn sắp mua: <strong>{addon.name}</strong></p>
          <p>Giá: <strong style={{ color: '#5B5BF0', fontSize: 16 }}>{addon.price.toLocaleString('vi-VN')} ₫</strong></p>
          <p style={{ color: '#64748B', fontSize: 12 }}>Số lượng sẽ được cộng trực tiếp vào hạn mức hiện tại của chu kỳ này.</p>
        </div>
      ),
      okText: 'Xác nhận thanh toán',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#5B5BF0' } },
      onOk: () => {
        setQuotas((prev) =>
          prev.map((q) => {
            if (q.id === addon.id) {
              return { ...q, total: q.total + addon.add };
            }
            return q;
          })
        );
        message.success(`Đã cộng thêm +${addon.add} ${addon.unit} vào tài khoản!`);
      },
    });
  };

  // Format currency helper
  const formatVND = (val: number) => {
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  // Table Columns for Payment History
  const invoiceColumns: ColumnsType<PaymentInvoice> = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
          {code}
        </span>
      ),
    },
    {
      title: 'Gói dịch vụ',
      dataIndex: 'planName',
      key: 'planName',
      render: (name: string, record: PaymentInvoice) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1E293B' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{record.billingPeriod}</div>
        </div>
      ),
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <span style={{ color: '#475569' }}>{date}</span>,
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 500 }}>
          {method}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ fontWeight: 700, color: '#0F172A' }}>
          {formatVND(amount)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: PaymentInvoice) => (
        <Tag
          color={status === 'success' ? 'success' : status === 'pending' ? 'warning' : 'error'}
          style={{ borderRadius: 999, padding: '2px 10px', fontWeight: 600 }}
        >
          {record.statusText}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      render: (_, record: PaymentInvoice) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedInvoice(record);
              setIsInvoiceModalOpen(true);
            }}
          >
            Xem HĐ
          </Button>
          <Button
            size="small"
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => {
              message.success(`Đang tải hóa đơn ${record.code}.pdf về máy...`);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="subscription-container">
      {/* 1. Header Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>
              Gói dịch vụ & Hạn mức
            </Title>
            <Paragraph style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0 0' }}>
              Quản lý gói đăng ký nhãn hàng, kiểm tra dung lượng quota sử dụng và tra cứu lịch sử thanh toán hóa đơn.
            </Paragraph>
          </div>
        </div>
      </div>

      {/* 2. Current Subscription Highlight Card */}
      <div className="sub-current-card">
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={15}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <CrownOutlined style={{ color: '#FDE047' }} />{' '}
                {subInfo.isActive ? 'Gói Đang Kích Hoạt' : 'Gói Trải Nghiệm'}
              </span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>
                • {subInfo.isActive ? (
                  <>Tự động gia hạn vào <strong>{subInfo.renewalDate}</strong></>
                ) : (
                  <strong>Chưa kích hoạt gói dịch vụ trả phí</strong>
                )}
              </span>
            </div>

            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              Gói {subInfo.currentPlanName}
            </div>

            <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4, maxWidth: 560 }}>
              {subInfo.isActive
                ? 'Bạn đang được tiếp cận đầy đủ các tính năng phân tích AI thông minh, mở rộng chiến dịch và khám phá Creator không giới hạn.'
                : 'Bạn đang sử dụng phiên bản cơ bản. Nâng cấp ngay để mở khóa toàn bộ tính năng phân tích AI, mở rộng hạn mức chiến dịch và khám phá Creator không giới hạn.'}
            </div>
          </Col>

          <Col xs={24} md={9} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                padding: '16px 20px',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                width: '100%',
                maxWidth: 320,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, opacity: 0.9 }}>Thời hạn chu kỳ:</span>
                <span style={{ fontWeight: 700, color: '#FDE047' }}>
                  {subInfo.isActive ? `Còn ${subInfo.daysRemaining} ngày` : 'Chưa kích hoạt'}
                </span>
              </div>
              <Progress
                percent={
                  subInfo.isActive
                    ? Math.max(5, Math.min(100, Math.round(((30 - subInfo.daysRemaining) / 30) * 100)))
                    : 0
                }
                strokeColor="#FDE047"
                railColor="rgba(255, 255, 255, 0.25)"
                showInfo={false}
                size="small"
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button
                  size="middle"
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    color: '#4338CA',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 8,
                  }}
                  onClick={() => setActiveTab('plans')}
                >
                  {subInfo.isActive ? 'Nâng cấp gói' : 'Chọn gói ngay'}
                </Button>
                <Button
                  size="middle"
                  ghost
                  style={{
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: '#FFFFFF',
                    borderRadius: 8,
                  }}
                  onClick={() => setActiveTab('quota')}
                >
                  Xem Quota
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 3. Main Navigation Tabs */}
      <Card
        style={{ borderRadius: 16, borderColor: '#EEF0F6' }}
        bodyStyle={{ padding: '8px 24px 24px 24px' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          size="large"
          items={[
            {
              key: 'plans',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <CrownOutlined /> Gói dịch vụ & Nâng cấp (Plans)
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  {/* Monthly / Yearly Switcher */}
                  <div className="billing-switcher">
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: billingCycle === 'monthly' ? 700 : 500,
                        color: billingCycle === 'monthly' ? '#0F172A' : '#64748B',
                        cursor: 'pointer',
                      }}
                      onClick={() => setBillingCycle('monthly')}
                    >
                      Thanh toán theo tháng
                    </span>

                    <Radio.Group
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      buttonStyle="solid"
                      size="middle"
                    >
                      <Radio.Button value="monthly">Tháng</Radio.Button>
                      <Radio.Button value="yearly">Năm</Radio.Button>
                    </Radio.Group>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                      onClick={() => setBillingCycle('yearly')}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: billingCycle === 'yearly' ? 700 : 500,
                          color: billingCycle === 'yearly' ? '#0F172A' : '#64748B',
                        }}
                      >
                        Thanh toán theo năm
                      </span>
                      <Tag color="success" style={{ fontWeight: 700, borderRadius: 999, border: 'none' }}>
                        Tiết kiệm 20% 💰
                      </Tag>
                    </div>
                  </div>

                  {/* 3 Plans Grid */}
                  <Row gutter={[20, 20]} align="stretch">
                    {plans.map((plan) => {
                      const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
                      const isCurrent = plan.isCurrent;

                      return (
                        <Col xs={24} lg={8} key={plan.id}>
                          <div className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                            {plan.badge && <div className="popular-badge">{plan.badge}</div>}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                {plan.name}
                              </h3>
                              {isCurrent && (
                                <Tag color="#6366F1" style={{ borderRadius: 999, fontWeight: 700, margin: 0 }}>
                                  Đang dùng
                                </Tag>
                              )}
                            </div>

                            <p style={{ color: '#64748B', fontSize: 12.5, minHeight: 38, marginTop: 6, lineHeight: 1.4 }}>
                              {plan.subtitle}
                            </p>

                            <div className="price-tag">
                              {formatVND(price)}
                              <span className="price-cycle">/ tháng</span>
                            </div>
                            {billingCycle === 'yearly' && (
                              <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginBottom: 12 }}>
                                Thanh toán hàng năm {formatVND(plan.priceYearly)}
                              </div>
                            )}

                            <Button
                              type={isCurrent ? 'default' : plan.popular ? 'primary' : 'default'}
                              size="large"
                              block
                              disabled={isCurrent}
                              onClick={() => handleOpenUpgrade(plan)}
                              style={{
                                height: 42,
                                borderRadius: 10,
                                fontWeight: 700,
                                background: isCurrent ? '#F1F5F9' : plan.popular ? '#6366F1' : '#FFFFFF',
                                borderColor: plan.popular ? '#6366F1' : '#CBD5E1',
                                color: isCurrent ? '#94A3B8' : plan.popular ? '#FFFFFF' : '#1E293B',
                                marginBottom: 20,
                              }}
                            >
                              {isCurrent ? 'Gói hiện tại của bạn' : `Nâng cấp lên ${plan.name}`}
                            </Button>

                            <div style={{ borderTop: '1px solid #EEF0F6', paddingTop: 16, flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Tính năng bao gồm:
                              </div>
                              {plan.features.map((feat, idx) => (
                                <div className="feature-row" key={idx}>
                                  {feat.included ? (
                                    <CheckCircleFilled
                                      style={{
                                        color: feat.highlight ? '#6366F1' : '#10B981',
                                        fontSize: 15,
                                        marginTop: 2,
                                        flexShrink: 0,
                                      }}
                                    />
                                  ) : (
                                    <CloseCircleFilled
                                      style={{ color: '#CBD5E1', fontSize: 15, marginTop: 2, flexShrink: 0 }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      color: feat.included ? (feat.highlight ? '#4338CA' : '#334155') : '#94A3B8',
                                      fontWeight: feat.highlight ? 700 : 400,
                                      textDecoration: feat.included ? 'none' : 'line-through',
                                    }}
                                  >
                                    {feat.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ),
            },
            {
              key: 'quota',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <PieChartOutlined /> Quota còn lại (Hạn mức sử dụng)
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  {/* Quota overview alert */}
                  <div
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 12,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <InfoCircleOutlined style={{ fontSize: 20, color: '#2563EB' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#1E3A8A', fontSize: 13.5 }}>
                          {subInfo.isActive
                            ? `Chu kỳ hạn mức của bạn được làm mới vào ngày ${subInfo.renewalDate}`
                            : 'Bạn đang dùng gói trải nghiệm cơ bản, chưa kích hoạt chu kỳ trả phí'}
                        </div>
                        <div style={{ color: '#3B82F6', fontSize: 12 }}>
                          Các chỉ số chưa dùng hết trong tháng sẽ không được cộng dồn sang chu kỳ tiếp theo.
                        </div>
                      </div>
                    </div>
                    <Button
                      type="primary"
                      size="middle"
                      style={{ background: '#2563EB', fontWeight: 600, borderRadius: 8 }}
                      onClick={() => setActiveTab('plans')}
                    >
                      Nâng gói để tăng quota
                    </Button>
                  </div>

                  {/* 4 Quota Metrics Cards */}
                  <Row gutter={[18, 18]}>
                    {quotas.map((quota) => {
                      const percent = Math.round((quota.used / quota.total) * 100);
                      const isHighUsage = percent >= 80;

                      return (
                        <Col xs={24} sm={12} lg={6} key={quota.id}>
                          <div className="quota-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
                                {quota.title}
                              </span>
                              <Tag
                                color={isHighUsage ? 'error' : 'default'}
                                style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}
                              >
                                {percent}% đã dùng
                              </Tag>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '8px 0' }}>
                              <span style={{ fontSize: 26, fontWeight: 800, color: quota.color }}>
                                {quota.used}
                              </span>
                              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                / {quota.total} {quota.unit}
                              </span>
                            </div>

                            <Progress
                              percent={percent}
                              strokeColor={quota.color}
                              railColor="#F1F5F9"
                              showInfo={false}
                              style={{ marginBottom: 10 }}
                            />

                            <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                              {quota.description}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>

                  {/* Add-on Quota Packs */}
                  <div style={{ marginTop: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <ThunderboltFilled style={{ color: '#F59E0B', fontSize: 16 }} />
                      <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: 16 }}>
                        Mua thêm gói mở rộng (Add-on Quota Pack)
                      </Title>
                    </div>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <div className="addon-card">
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                              +50 Lượt AI Discovery
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              Tìm kiếm thông minh & phân tích hồ sơ
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#5B5BF0', marginTop: 6 }}>
                              199.000 ₫
                            </div>
                          </div>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ background: '#5B5BF0', borderRadius: 8, fontWeight: 600 }}
                            onClick={() =>
                              handleBuyAddon({
                                id: 'q-discovery',
                                name: '+50 Lượt AI Discovery',
                                add: 50,
                                unit: 'lượt',
                                price: 199000,
                              })
                            }
                          >
                            Mua ngay
                          </Button>
                        </div>
                      </Col>

                      <Col xs={24} md={8}>
                        <div className="addon-card">
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                              +20 Lượt Refresh Creator
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              Cập nhật chỉ số MXH mới nhất tức thì
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#10B981', marginTop: 6 }}>
                              149.000 ₫
                            </div>
                          </div>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ background: '#10B981', borderColor: '#10B981', borderRadius: 8, fontWeight: 600 }}
                            onClick={() =>
                              handleBuyAddon({
                                id: 'q-refresh',
                                name: '+20 Lượt Refresh Creator',
                                add: 20,
                                unit: 'lượt',
                                price: 149000,
                              })
                            }
                          >
                            Mua ngay
                          </Button>
                        </div>
                      </Col>

                      <Col xs={24} md={8}>
                        <div className="addon-card">
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                              +5 Chiến dịch hoạt động
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              Tạo thêm chiến dịch mà không cần hủy
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#6366F1', marginTop: 6 }}>
                              499.000 ₫
                            </div>
                          </div>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, fontWeight: 600 }}
                            onClick={() =>
                              handleBuyAddon({
                                id: 'q-campaigns',
                                name: '+5 Chiến dịch hoạt động',
                                add: 5,
                                unit: 'chiến dịch',
                                price: 499000,
                              })
                            }
                          >
                            Mua ngay
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              ),
            },
            {
              key: 'history',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <HistoryOutlined /> Lịch sử thanh toán (Payment History)
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Hiển thị danh sách hóa đơn các kỳ gia hạn và nâng cấp gói dịch vụ của bạn.
                    </Text>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => message.success('Đang kết xuất toàn bộ sao kê thanh toán ra Excel...')}
                    >
                      Xuất toàn bộ báo cáo
                    </Button>
                  </div>

                  <Table
                    columns={invoiceColumns}
                    dataSource={invoices}
                    rowKey="id"
                    pagination={false}
                    className="styled-table"
                    locale={{
                      emptyText: (
                        <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748B' }}>
                          <HistoryOutlined style={{ fontSize: 32, color: '#CBD5E1', marginBottom: 8 }} />
                          <div style={{ fontWeight: 600, color: '#334155' }}>Chưa có giao dịch thanh toán nào phát sinh</div>
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                            Hóa đơn điện tử sẽ tự động tạo và lưu trữ tại đây ngay khi bạn thanh toán gói qua cổng VNPAY.
                          </div>
                        </div>
                      ),
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 4. Payment / Upgrade Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
            <SafetyCertificateFilled style={{ color: '#10B981' }} />
            Xác nhận Nâng cấp Gói dịch vụ
          </div>
        }
        open={isUpgradeModalOpen}
        onCancel={() => setIsUpgradeModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedPlanForUpgrade && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: '16px 20px',
                border: '1px solid #E2E8F0',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                    Gói {selectedPlanForUpgrade.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Chu kỳ: {billingCycle === 'monthly' ? 'Thanh toán hàng tháng' : 'Thanh toán hàng năm (-20%)'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#5B5BF0' }}>
                    {formatVND(
                      billingCycle === 'monthly'
                        ? selectedPlanForUpgrade.priceMonthly
                        : selectedPlanForUpgrade.priceYearly
                    )}
                  </div>
                  {voucherApplied && (
                    <Tag color="success" style={{ margin: 0, fontSize: 10 }}>
                      Đã giảm 10%
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            {/* Voucher input */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Mã ưu đãi / Voucher khuyến mãi
              </div>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Nhập mã (ví dụ: SUMMER2026)"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                />
                <Button
                  type="primary"
                  style={{ background: '#5B5BF0' }}
                  onClick={() => {
                    if (voucherCode.trim()) {
                      setVoucherApplied(true);
                      message.success('Áp dụng mã giảm 10% thành công!');
                    } else {
                      message.warning('Vui lòng nhập mã giảm giá!');
                    }
                  }}
                >
                  Áp dụng
                </Button>
              </Space.Compact>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 10 }}>
                Chọn phương thức thanh toán
              </div>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <Radio
                  value="visa"
                  style={{
                    border: paymentMethod === 'visa' ? '1.5px solid #5B5BF0' : '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    width: '100%',
                    background: paymentMethod === 'visa' ? '#FAF5FF' : '#FFFFFF',
                  }}
                >
                  <Space align="center">
                    <CreditCardOutlined style={{ fontSize: 18, color: '#5B5BF0' }} />
                    <span style={{ fontWeight: 600 }}>Thẻ Tín dụng / Ghi nợ quốc tế (Visa, Mastercard, JCB)</span>
                  </Space>
                </Radio>

                <Radio
                  value="vnpay"
                  style={{
                    border: paymentMethod === 'vnpay' ? '1.5px solid #5B5BF0' : '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    width: '100%',
                    background: paymentMethod === 'vnpay' ? '#FAF5FF' : '#FFFFFF',
                  }}
                >
                  <Space align="center">
                    <QrcodeOutlined style={{ fontSize: 18, color: '#0284C7' }} />
                    <span style={{ fontWeight: 600 }}>Quét mã VNPAY-QR / VietQR (Mọi App ngân hàng)</span>
                  </Space>
                </Radio>

                <Radio
                  value="momo"
                  style={{
                    border: paymentMethod === 'momo' ? '1.5px solid #5B5BF0' : '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    width: '100%',
                    background: paymentMethod === 'momo' ? '#FAF5FF' : '#FFFFFF',
                  }}
                >
                  <Space align="center">
                    <span style={{ fontSize: 16, color: '#D946EF', fontWeight: 800 }}>M</span>
                    <span style={{ fontWeight: 600 }}>Ví điện tử MoMo</span>
                  </Space>
                </Radio>
              </Radio.Group>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setIsUpgradeModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '0 24px',
                }}
                onClick={handleConfirmPayment}
              >
                Xác nhận thanh toán
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Detailed Invoice Modal */}
      <Modal
        title="Hóa đơn điện tử VAT"
        open={isInvoiceModalOpen}
        onCancel={() => setIsInvoiceModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsInvoiceModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            style={{ background: '#5B5BF0' }}
            onClick={() => message.success('Đang tải hóa đơn PDF về máy...')}
          >
            Tải PDF
          </Button>,
        ]}
        width={580}
      >
        {selectedInvoice && (
          <div className="invoice-paper" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #EEF0F6', paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#5B5BF0' }}>INFLUENCERMATCH CORP</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Mã số thuế: 0109887766</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Tòa nhà TechHub, Q.1, TP. Hồ Chí Minh</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag color="success" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
                  ĐÃ THANH TOÁN
                </Tag>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569', marginTop: 4 }}>
                  {selectedInvoice.code}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid #EEF0F6' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Khách hàng:
                  </div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    Công ty Cổ phần Thương mại Beauty Glow
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>MST: 0317899881</div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Ngày phát hành:
                  </div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                    {selectedInvoice.date}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    PTTT: {selectedInvoice.method}
                  </div>
                </Col>
              </Row>
            </div>

            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 600, color: '#475569', fontSize: 12 }}>
                <span>Nội dung dịch vụ</span>
                <span>Thành tiền</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedInvoice.planName}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{selectedInvoice.billingPeriod}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>
                  {formatVND(selectedInvoice.amount)}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed #E2E8F0', paddingTop: 14, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Tổng cộng thanh toán (VAT 10%):</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#5B5BF0' }}>
                {formatVND(selectedInvoice.amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
