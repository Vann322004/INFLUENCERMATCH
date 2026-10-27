import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
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
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getErrorMessage, getAccessToken } from '../../services/apiClient';
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

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Bắt kết quả giao dịch chuyển hướng về từ VNPay
  useEffect(() => {
    const vnpResponse = searchParams.get('vnp_ResponseCode');
    if (vnpResponse === '00') {
      message.success('Thanh toán qua VNPAY thành công! Gói dịch vụ của bạn đã được kích hoạt.');
      setActiveTab('quota');
    } else if (vnpResponse && vnpResponse !== '00') {
      message.error(`Giao dịch VNPAY không thành công hoặc đã bị hủy (Mã phản hồi: ${vnpResponse}).`);
    }
  }, [searchParams]);

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

  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean>(false);

  // Kiểm tra xem Brand hiện tại có đang sử dụng gói trả phí (PRO / ENTERPRISE) hay không
  const isPaidSubscriber = useMemo(() => {
    if (!subInfo.isActive) return false;
    const name = (subInfo.currentPlanName || '').toLowerCase();
    return !name.includes('free') && !name.includes('trải nghiệm') && !name.includes('trial');
  }, [subInfo.isActive, subInfo.currentPlanName]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoadingPlans(true);
      try {
        const [remotePlans, brand, campaigns] = await Promise.all([
          subscriptionService.getPlans().catch((err) => {
            console.warn('[SubscriptionPage] Không thể lấy plans từ API:', err);
            return [];
          }),
          brandService.getMyBrand().catch(() => null),
          campaignService.getCampaigns(0, 100).catch(() => []),
        ]);

        let activeSub: SubscriptionResponse | null = null;
        let hadTrial = false;
        if (brand?.id) {
          setCurrentBrandId(brand.id);
          const subs = await subscriptionService.getBrandSubscriptions(brand.id);
          activeSub = (subs || []).find((s) => s.status === 'ACTIVE') || null;
          hadTrial = (subs || []).some((s) => {
            const p = s.plan;
            return p?.planName?.toLowerCase().includes('trial');
          });
        }
        setHasUsedTrial(hadTrial);

        if (isMounted) {
          const rawList = Array.isArray(remotePlans) ? remotePlans : [];
          // Giữ đúng tên của từng gói từ backend: FREE, TRIAL, PRO, ENTERPRISE
          const mapped: SubscriptionPlan[] = rawList
            .map((p) => {
              const rawName = p.planName.replace(/-[0-9]+$/, '').trim().toUpperCase();
              let finalName = rawName;
              let subtitle = p.description || 'Gói dịch vụ dành cho doanh nghiệp';

              if (rawName === 'FREE') {
                finalName = 'FREE';
                subtitle = 'Gói trải nghiệm cơ bản miễn phí dành cho Brand mới làm quen hệ thống';
              } else if (rawName.includes('TRIAL')) {
                finalName = 'TRIAL';
                subtitle = 'Gói dùng thử miễn phí 7 ngày với đầy đủ tính năng nâng cao';
              } else if (rawName.includes('PRO')) {
                finalName = 'PRO';
                subtitle = 'Gói chuyên nghiệp cho doanh nghiệp vừa và nhỏ (SME) đẩy mạnh chiến dịch';
              } else if (rawName.includes('ENTERPRISE')) {
                finalName = 'ENTERPRISE';
                subtitle = 'Gói mở rộng không giới hạn cho Brand lớn và Marketing Agency';
              }

              const isPopular = finalName === 'PRO';

              return {
                id: p.id,
                name: finalName,
                subtitle,
                priceMonthly: p.price,
                priceYearly: p.price * 10,
                isCurrent: activeSub ? p.id === activeSub.plan?.id : false,
                popular: isPopular,
                badge: isPopular ? 'Khuyên Dùng • Phổ Biến' : undefined,
                features: [
                  { text: `Tối đa ${p.campaignQuota} chiến dịch hoạt động`, included: true },
                  { text: `Khám phá ${p.recommendationQuota} Creator / tháng`, included: true },
                  { text: `Làm mới số liệu (Refresh) ${p.refreshQuota} Creator / tháng`, included: true },
                  { text: 'Bộ lọc cơ bản theo ngành hàng & nền tảng', included: true },
                  { text: 'Thanh toán trực tuyến bảo mật qua VNPAY', included: p.price > 0, highlight: p.price > 0 },
                ],
              };
            })
            // Sắp xếp tự động: theo giá tăng dần (0đ -> cao dần), nếu cùng 0đ thì FREE xếp trước TRIAL
            .sort((a, b) => {
              if (a.priceMonthly !== b.priceMonthly) {
                return a.priceMonthly - b.priceMonthly;
              }
              const zeroPriceOrder: Record<string, number> = { FREE: 1, TRIAL: 2 };
              return (zeroPriceOrder[a.name] || 99) - (zeroPriceOrder[b.name] || 99);
            });

          setPlans(mapped);

          if (activeSub) {
            const rawActiveName = activeSub.plan?.planName?.replace(/-[0-9]+$/, '').trim() || 'Professional';
            const isTrialActive =
              activeSub.plan?.price === 0 ||
              rawActiveName.toUpperCase() === 'FREE' ||
              rawActiveName.toLowerCase().includes('trial');
            const planName = isTrialActive ? 'Dùng Thử (Trial)' : rawActiveName;
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
                title: 'Khám phá',
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
            // Chưa có subscription hoạt động
            const usedCamp = campaigns.length;
            setSubInfo({
              currentPlanName: hadTrial ? 'Đã hết hạn dùng thử' : 'Chưa kích hoạt',
              renewalDate: 'Chưa kích hoạt',
              daysRemaining: 0,
              isActive: false,
              usedCampaigns: usedCamp,
              totalCampaigns: 0,
              usedRefresh: 0,
              totalRefresh: 0,
            });

            setQuotas([
              {
                id: 'q-campaigns',
                title: 'Chiến dịch hoạt động',
                used: usedCamp,
                total: 0,
                unit: 'chiến dịch',
                color: '#6366F1',
                description: 'Đăng ký gói dịch vụ để bắt đầu tạo chiến dịch',
              },
              {
                id: 'q-discovery',
                title: 'Khám phá & AI Semantic Search',
                used: 0,
                total: 0,
                unit: 'lượt',
                color: '#3B82F6',
                description: 'Đăng ký gói dịch vụ để mở khóa tìm kiếm Creator',
              },
              {
                id: 'q-refresh',
                title: 'Làm mới số liệu AI (Refresh)',
                used: 0,
                total: 0,
                unit: 'lượt',
                color: '#10B981',
                description: 'Đăng ký gói dịch vụ để cập nhật số liệu Creator',
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

  // Lắng nghe kết quả redirect từ cổng thanh toán VNPAY
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      message.success({
        content: 'Chúc mừng! Thanh toán nâng cấp gói dịch vụ qua VNPAY thành công. Hạn mức đã được kích hoạt!',
        duration: 6,
        key: 'vnpay_payment_toast',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'failed') {
      message.error({
        content: 'Giao dịch thanh toán VNPAY không thành công hoặc đã bị hủy.',
        duration: 5,
        key: 'vnpay_payment_toast',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
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
    if (!getAccessToken()) {
      message.warning('Vui lòng đăng nhập tài khoản Brand để thực hiện thao tác.');
      navigate('/login');
      return;
    }

    setPaying(true);

    // Xử lý gói Dùng thử / Miễn phí 0đ
    if (selectedPlanForUpgrade.priceMonthly <= 0) {
      if (hasUsedTrial || isPaidSubscriber) {
        message.error('Tài khoản của bạn đang dùng gói trả phí hoặc đã từng dùng thử. Không thể chuyển về gói dùng thử.');
        setIsUpgradeModalOpen(false);
        setPaying(false);
        return;
      }

      message.loading({ content: 'Đang kích hoạt gói dùng thử...', key: 'upgrade_msg' });
      try {
        if (!currentBrandId) {
          throw new Error('Không tìm thấy thông tin thương hiệu.');
        }
        await subscriptionService.subscribeFreePlan(currentBrandId, selectedPlanForUpgrade.id);
        message.success({ content: 'Kích hoạt gói dùng thử thành công!', key: 'upgrade_msg' });
        setIsUpgradeModalOpen(false);
        // Tải lại thông tin gói sau khi kích hoạt
        window.location.reload();
      } catch (err) {
        message.error({ content: getErrorMessage(err, 'Không thể kích hoạt gói dùng thử.'), key: 'upgrade_msg' });
      } finally {
        setPaying(false);
      }
      return;
    }

    // Xử lý gói Trả phí qua VNPAY
    message.loading({ content: 'Đang kết nối cổng thanh toán VNPAY...', key: 'upgrade_msg' });
    try {
      const res = await subscriptionService.subscribeVNPay(selectedPlanForUpgrade.id);
      if (res?.paymentUrl) {
        message.success({ content: 'Đang chuyển hướng tới cổng thanh toán VNPAY...', key: 'upgrade_msg' });
        window.location.href = res.paymentUrl;
      } else {
        message.error({ content: 'Không tìm thấy liên kết thanh toán.', key: 'upgrade_msg' });
      }
    } catch (err) {
      message.error({ content: getErrorMessage(err, 'Khởi tạo thanh toán VNPAY thất bại.'), key: 'upgrade_msg' });
    } finally {
      setPaying(false);
    }
  };

  // Handle buy addon quota
  const handleBuyAddon = (addon: { id: string; name: string; add: number; unit: string; price: number }) => {
    if (!isPaidSubscriber) {
      message.warning('Tính năng mua thêm Quota (Add-on) chỉ dành cho gói trả phí. Vui lòng nâng cấp gói.');
      return;
    }
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
                {subInfo.isActive ? 'Gói Đang Kích Hoạt' : 'Chưa Kích Hoạt Gói'}
              </span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>
                • {subInfo.isActive ? (
                  <>Tự động gia hạn vào <strong>{subInfo.renewalDate}</strong></>
                ) : (
                  <strong>Chưa đăng ký gói dịch vụ nào</strong>
                )}
              </span>
            </div>

            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              {subInfo.isActive ? `Gói ${subInfo.currentPlanName}` : 'Tài khoản chưa kích hoạt gói'}
            </div>

            <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4, maxWidth: 560 }}>
              {subInfo.isActive
                ? 'Bạn đang được tiếp cận đầy đủ các tính năng phân tích AI thông minh, mở rộng chiến dịch và khám phá Creator không giới hạn.'
                : 'Bạn chưa kích hoạt gói dịch vụ nào. Hãy đăng ký gói Dùng thử hoặc nâng cấp lên các gói trả phí bên dưới để kích hoạt hạn mức chiến dịch và tìm kiếm Creator.'}
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
                  {subInfo.isActive ? 'Nâng cấp gói' : 'Đăng ký gói ngay'}
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
                  <CrownOutlined /> Gói dịch vụ & Nâng cấp
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  {/* Monthly / Yearly Switcher */}
                  <div className="billing-switcher-wrapper">
                    <div className="billing-switcher-pill">
                      <button
                        type="button"
                        className={`switcher-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('monthly')}
                      >
                        Thanh toán theo tháng
                      </button>

                      <button
                        type="button"
                        className={`switcher-option ${billingCycle === 'yearly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('yearly')}
                      >
                        <span>Thanh toán theo năm</span>
                        <span className="savings-badge-clean">Tiết kiệm 20%</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Plans Grid */}
                  {loadingPlans ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Spin size="large" tip="Đang tải danh sách gói dịch vụ..." />
                    </div>
                  ) : plans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                      Chưa có dữ liệu gói dịch vụ.
                    </div>
                  ) : (
                    <Row gutter={[20, 20]} align="stretch" justify="center">
                      {(() => {
                        const currentPlan = plans.find((p) => p.isCurrent);
                        const currentPlanPrice = currentPlan ? currentPlan.priceMonthly : 0;

                        return plans.map((plan) => {
                          const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
                          const isCurrent = plan.isCurrent;
                          const isFree = plan.name === 'FREE';
                          const isTrial = plan.name === 'TRIAL';
                          const isDowngrade = !isCurrent && currentPlanPrice > 0 && plan.priceMonthly < currentPlanPrice;
                          const isTrialExpiredOrUsed = isTrial && hasUsedTrial && !isCurrent;

                          let buttonDisabled = false;
                          let buttonText = `Nâng cấp lên ${plan.name}`;
                          let buttonTooltip = '';
                          let statusTag = null;

                          if (isCurrent) {
                            buttonDisabled = true;
                            buttonText = 'Gói hiện tại của bạn';
                            statusTag = (
                              <Tag color="#6366F1" style={{ borderRadius: 999, fontWeight: 700, margin: 0 }}>
                                {isTrial ? 'Đang dùng thử' : 'Đang dùng'}
                              </Tag>
                            );
                          } else if ((isFree || isTrial) && isPaidSubscriber) {
                            buttonDisabled = true;
                            buttonText = 'Không thể hạ cấp';
                            buttonTooltip = `Bạn đang sử dụng gói ${subInfo.currentPlanName}. Không thể chuyển về gói cơ bản/dùng thử.`;
                            statusTag = (
                              <Tag color="default" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                                Không khả dụng
                              </Tag>
                            );
                          } else if (isTrialExpiredOrUsed) {
                            buttonDisabled = true;
                            buttonText = 'Đã hết lượt dùng thử (Chỉ 1 lần)';
                            buttonTooltip = 'Mỗi tài khoản Brand chỉ được đăng ký gói dùng thử 1 lần duy nhất.';
                            statusTag = (
                              <Tag color="default" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                                Đã sử dụng
                              </Tag>
                            );
                          } else if (isDowngrade) {
                            buttonDisabled = true;
                            buttonText = 'Gói cấp thấp hơn';
                            buttonTooltip = `Gói này thấp hơn gói hiện tại của bạn (${subInfo.currentPlanName}).`;
                            statusTag = (
                              <Tag color="default" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                                Không khả dụng
                              </Tag>
                            );
                          } else if (isTrial) {
                            buttonDisabled = false;
                            buttonText = 'Kích hoạt Dùng thử (7 ngày)';
                            statusTag = (
                              <Tag color="cyan" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                                Dùng thử 7 ngày
                              </Tag>
                            );
                          } else if (isFree) {
                            buttonDisabled = true;
                            buttonText = 'Gói cơ bản mặc định';
                          } else {
                            buttonDisabled = false;
                            buttonText = `Nâng cấp lên ${plan.name}`;
                          }

                          return (
                            <Col xs={24} sm={12} lg={plans.length >= 4 ? 6 : plans.length === 3 ? 8 : 12} key={plan.id}>
                              <div className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                                {plan.badge && <div className="popular-badge">{plan.badge}</div>}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                    {plan.name}
                                  </h3>
                                  {statusTag}
                                </div>

                                <p style={{ color: '#64748B', fontSize: 12.5, minHeight: 38, marginTop: 6, lineHeight: 1.4 }}>
                                  {plan.subtitle}
                                </p>

                                <div style={{ margin: '12px 0 8px 0', minHeight: 70 }}>
                                  {billingCycle === 'yearly' && plan.priceMonthly > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                      <span style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                                        {formatVND(plan.priceMonthly)}/tháng
                                      </span>
                                      <span className="discount-chip">-20%</span>
                                    </div>
                                  ) : null}

                                  <div className="price-tag" style={{ margin: 0 }}>
                                    {formatVND(price)}
                                    <span className="price-cycle">/ tháng</span>
                                  </div>

                                  {billingCycle === 'yearly' && plan.priceMonthly > 0 ? (
                                    <div className="yearly-save-text">
                                      <CheckCircleFilled style={{ fontSize: 13, color: '#10B981' }} />
                                      <span>Tiết kiệm <strong>{formatVND(plan.priceMonthly * 12 - plan.priceYearly)}</strong>/năm</span>
                                    </div>
                                  ) : plan.priceMonthly > 0 ? (
                                    <div
                                      className="switch-to-yearly-hint"
                                      onClick={() => setBillingCycle('yearly')}
                                    >
                                      <span>Tiết kiệm 20% khi thanh toán theo năm</span>
                                    </div>
                                  ) : (
                                    <div style={{ height: 26, margin: '6px 0' }} />
                                  )}
                                </div>

                                {billingCycle === 'yearly' && plan.priceMonthly > 0 && (
                                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 12 }}>
                                    Thanh toán hàng năm: <strong style={{ color: '#0F172A' }}>{formatVND(plan.priceYearly)}</strong>
                                  </div>
                                )}

                                <Tooltip title={buttonTooltip}>
                                  <div>
                                    <Button
                                      type={isCurrent ? 'default' : (plan.popular || isTrial) && !buttonDisabled ? 'primary' : 'default'}
                                      size="large"
                                      block
                                      disabled={buttonDisabled}
                                      onClick={() => handleOpenUpgrade(plan)}
                                      style={{
                                        height: 42,
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        background: buttonDisabled
                                          ? '#F1F5F9'
                                          : isTrial && !buttonDisabled
                                            ? '#059669'
                                            : plan.popular
                                              ? '#6366F1'
                                              : '#FFFFFF',
                                        borderColor: buttonDisabled
                                          ? '#E2E8F0'
                                          : isTrial && !buttonDisabled
                                            ? '#059669'
                                            : plan.popular
                                              ? '#6366F1'
                                              : '#CBD5E1',
                                        color: buttonDisabled
                                          ? '#94A3B8'
                                          : isTrial || plan.popular
                                            ? '#FFFFFF'
                                            : '#1E293B',
                                        marginBottom: 20,
                                      }}
                                    >
                                      {buttonText}
                                    </Button>
                                  </div>
                                </Tooltip>

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
                        });
                      })()}
                    </Row>
                  )}
                </div>
              ),
            },
            {
              key: 'quota',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <PieChartOutlined /> Hạn mức sử dụng
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

                    {!isPaidSubscriber && (
                      <Alert
                        type="warning"
                        showIcon
                        icon={<SafetyCertificateFilled style={{ color: '#F59E0B', fontSize: 18 }} />}
                        message="Khóa mở rộng Quota: Đặc quyền dành riêng cho Gói PRO & ENTERPRISE"
                        description={
                          <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                            Tài khoản dùng thử / miễn phí không hỗ trợ mua thêm Quota lẻ. Vui lòng nâng cấp lên gói <strong>PRO</strong> hoặc <strong>ENTERPRISE</strong> để mở khóa tính năng mua gói mở rộng khi cần đẩy mạnh chiến dịch cao điểm.
                            <Button
                              type="link"
                              onClick={() => setActiveTab('plans')}
                              style={{ paddingLeft: 6, fontWeight: 700, color: '#4F46E5' }}
                            >
                              Nâng cấp gói ngay →
                            </Button>
                          </div>
                        }
                        style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #FDE68A', background: '#FFFBEB' }}
                      />
                    )}

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <div className="addon-card" style={{ opacity: isPaidSubscriber ? 1 : 0.65 }}>
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
                          <Tooltip title={!isPaidSubscriber ? 'Yêu cầu gói PRO hoặc ENTERPRISE để mở khóa' : ''}>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              disabled={!isPaidSubscriber}
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
                          </Tooltip>
                        </div>
                      </Col>

                      <Col xs={24} md={8}>
                        <div className="addon-card" style={{ opacity: isPaidSubscriber ? 1 : 0.65 }}>
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
                          <Tooltip title={!isPaidSubscriber ? 'Yêu cầu gói PRO hoặc ENTERPRISE để mở khóa' : ''}>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              disabled={!isPaidSubscriber}
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
                          </Tooltip>
                        </div>
                      </Col>

                      <Col xs={24} md={8}>
                        <div className="addon-card" style={{ opacity: isPaidSubscriber ? 1 : 0.65 }}>
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
                          <Tooltip title={!isPaidSubscriber ? 'Yêu cầu gói PRO hoặc ENTERPRISE để mở khóa' : ''}>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              disabled={!isPaidSubscriber}
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
                          </Tooltip>
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
                  <HistoryOutlined /> Lịch sử thanh toán
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
            <SafetyCertificateFilled
              style={{ color: (selectedPlanForUpgrade?.priceMonthly || 0) <= 0 ? '#6366F1' : '#10B981' }}
            />
            {(selectedPlanForUpgrade?.priceMonthly || 0) <= 0
              ? 'Kích hoạt Gói Dùng thử (Miễn phí 0 ₫)'
              : 'Xác nhận Nâng cấp Gói dịch vụ'}
          </div>
        }
        open={isUpgradeModalOpen}
        onCancel={() => !paying && setIsUpgradeModalOpen(false)}
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
                    Chu kỳ: {selectedPlanForUpgrade.priceMonthly <= 0
                      ? 'Dùng thử trải nghiệm'
                      : billingCycle === 'monthly'
                        ? 'Thanh toán hàng tháng'
                        : 'Thanh toán hàng năm (-20%)'}
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
                  {voucherApplied && selectedPlanForUpgrade.priceMonthly > 0 && (
                    <Tag color="success" style={{ margin: 0, fontSize: 10 }}>
                      Đã giảm 10%
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            {selectedPlanForUpgrade.priceMonthly <= 0 ? (
              <div>
                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined style={{ color: '#2563EB', fontSize: 18 }} />}
                  message="Chính sách dùng thử miễn phí"
                  description="Mỗi tài khoản Brand chỉ được đăng ký gói dùng thử 1 lần duy nhất trong toàn bộ vòng đời tài khoản. Khi kích hoạt thành công, bạn sẽ nhận được đầy đủ hạn mức trải nghiệm của gói này."
                  style={{ marginBottom: 20, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                />

                <div
                  style={{
                    background: '#FAFAFA',
                    borderRadius: 10,
                    padding: '14px 18px',
                    border: '1px solid #F1F5F9',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 10 }}>
                    Tính năng bao gồm trong gói:
                  </div>
                  {selectedPlanForUpgrade.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: feat.included ? '#334155' : '#94A3B8',
                        marginBottom: 6,
                      }}
                    >
                      {feat.included ? (
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />
                      ) : (
                        <CloseCircleFilled style={{ color: '#CBD5E1', fontSize: 14 }} />
                      )}
                      <span style={{ textDecoration: feat.included ? 'none' : 'line-through' }}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
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
                    Phương thức thanh toán trực tuyến
                  </div>
                  <Radio.Group
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <Radio
                      value="vnpay"
                      style={{
                        border: '1.5px solid #0284C7',
                        borderRadius: 10,
                        padding: '12px 16px',
                        width: '100%',
                        background: '#F0F9FF',
                      }}
                    >
                      <Space align="center">
                        <QrcodeOutlined style={{ fontSize: 20, color: '#0284C7' }} />
                        <div>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>
                            Cổng thanh toán VNPAY
                          </span>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>
                            Hỗ trợ quét VNPAY-QR, VietQR, Thẻ ATM 40+ Ngân hàng và Thẻ Visa/Mastercard
                          </div>
                        </div>
                      </Space>
                    </Radio>
                  </Radio.Group>
                </div>
              </>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setIsUpgradeModalOpen(false)} disabled={paying}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                size="large"
                loading={paying}
                icon={<CheckOutlined />}
                style={{
                  background:
                    selectedPlanForUpgrade.priceMonthly <= 0
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '0 24px',
                  border: 'none',
                }}
                onClick={handleConfirmPayment}
              >
                {selectedPlanForUpgrade.priceMonthly <= 0
                  ? 'Kích hoạt Gói dùng thử ngay'
                  : 'Thanh toán qua Cổng VNPAY'}
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
