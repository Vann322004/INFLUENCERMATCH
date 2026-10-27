import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Typography, Card, Tabs, message } from 'antd';
import { CrownOutlined, PieChartOutlined, HistoryOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';

import type { SubscriptionPlan, QuotaMetric, PaymentInvoice } from '../../data/mockData';
import { subscriptionService } from '../../services/api/subscriptionService';
import { brandService } from '../../services/api/brandService';
import type { PlanResponse, SubscriptionResponse } from '../../types/api/subscription.types';
import type { BrandResponse } from '../../types/api/brand.types';
import { getErrorMessage, getAccessToken, getStoredUser } from '../../services/apiClient';

import CurrentPlanBanner, { SubInfoData } from './components/CurrentPlanBanner';
import PlansTab from './components/PlansTab';
import QuotaTab from './components/QuotaTab';
import HistoryTab from './components/HistoryTab';
import UpgradeModal from './components/UpgradeModal';
import InvoiceModal from './components/InvoiceModal';

import './SubscriptionPage.css';

const { Title, Paragraph } = Typography;

/**
 * Format raw plans from backend API into UI SubscriptionPlan items.
 */
const mapPlans = (rawList: PlanResponse[], activePlanId?: string): SubscriptionPlan[] => {
  return rawList
    .map((p) => {
      const finalName = p.planName.replace(/-[0-9]+$/, '').trim();
      const subtitle = p.description || '';
      const isPopular = finalName.toUpperCase().includes('PRO');

      return {
        id: p.id,
        name: finalName,
        subtitle,
        priceMonthly: p.price,
        priceYearly: p.price,
        isCurrent: Boolean(activePlanId && p.id === activePlanId),
        popular: isPopular,
        badge: isPopular ? 'Khuyên Dùng • Phổ Biến' : undefined,
        features: [
          { text: `Tối đa ${p.campaignQuota} chiến dịch hoạt động`, included: true },
          { text: `Khám phá ${p.recommendationQuota} Creator / tháng`, included: true },
          { text: `Làm mới số liệu (Refresh) ${p.refreshQuota} Creator / tháng`, included: true },
          { text: `Thời hạn chu kỳ: ${p.durationDays} ngày`, included: true },
        ],
      };
    })
    .sort((a, b) => {
      if (a.priceMonthly !== b.priceMonthly) {
        return a.priceMonthly - b.priceMonthly;
      }
      const zeroPriceOrder: Record<string, number> = { FREE: 1, TRIAL: 2 };
      return (zeroPriceOrder[a.name.toUpperCase()] || 99) - (zeroPriceOrder[b.name.toUpperCase()] || 99);
    });
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [loadingSubInfo, setLoadingSubInfo] = useState<boolean>(true);
  const activePlanIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('plans');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
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
  const [subInfo, setSubInfo] = useState<SubInfoData>({
    currentPlanName: '',
    renewalDate: '',
    daysRemaining: 0,
    isActive: false,
    usedCampaigns: 0,
    totalCampaigns: 0,
    usedRefresh: 0,
    totalRefresh: 0,
  });

  // Dynamic Quota State to allow interactive add-on quota buying
  const [quotas, setQuotas] = useState<QuotaMetric[]>([]);

  // Invoice state from API / Active Subscription
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [currentBrand, setCurrentBrand] = useState<BrandResponse | null>(null);
  const storedUser = useMemo(() => getStoredUser(), []);
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

    // 1. Pipeline A: Fetch plans immediately and independently
    subscriptionService
      .getPlans()
      .then((remotePlans) => {
        if (!isMounted) return;
        const rawList = Array.isArray(remotePlans) ? remotePlans : [];
        setPlans(mapPlans(rawList, activePlanIdRef.current || undefined));
        setLoadingPlans(false);
      })
      .catch((err) => {
        console.warn('[SubscriptionPage] Không thể lấy plans từ API:', err);
        if (isMounted) setLoadingPlans(false);
      });

    // 2. Pipeline B: Fetch brand & active subscription info concurrently
    const loadSubscriptionData = async () => {
      try {
        const cachedBrandId = (() => {
          try {
            return localStorage.getItem('influencermatch_brand_id');
          } catch {
            return null;
          }
        })();

        // Concurrently query brand profile & preloaded subscriptions if brandId is available
        const [brand, preloadedSubs] = await Promise.all([
          brandService.getMyBrand().catch(() => null),
          cachedBrandId
            ? subscriptionService.getBrandSubscriptions(cachedBrandId).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (brand && isMounted) {
          setCurrentBrand(brand);
        }

        let activeSub: SubscriptionResponse | null = null;
        let hadTrial = false;
        const effectiveBrandId = brand?.id || cachedBrandId;

        if (effectiveBrandId) {
          if (isMounted) setCurrentBrandId(effectiveBrandId);

          // Chỉ dùng preloadedSubs nếu cachedBrandId trùng khớp với brand.id của user hiện tại
          const isCacheConsistent = Boolean(brand?.id && cachedBrandId === brand.id);
          const subs =
            isCacheConsistent && preloadedSubs && preloadedSubs.length > 0
              ? preloadedSubs
              : await subscriptionService.getBrandSubscriptions(effectiveBrandId, !isCacheConsistent).catch(() => []);

          activeSub = (subs || []).find((s) => s.status === 'ACTIVE') || null;
          hadTrial = (subs || []).some((s) => {
            const p = s.plan;
            return p?.planName?.toLowerCase().includes('trial');
          });

          // Chuẩn hóa danh sách hóa đơn theo đúng các subscription của brand hiện tại
          const brandInvoices: PaymentInvoice[] = (subs || []).map((s) => {
            const pName = s.plan?.planName?.replace(/-[0-9]+$/, '').trim() || 'Gói dịch vụ';
            const sDate = s.startDate ? new Date(s.startDate).toLocaleDateString('vi-VN') : '';
            const eDate = s.expirationDate ? new Date(s.expirationDate).toLocaleDateString('vi-VN') : '';
            const isZeroPrice = !s.plan?.price || s.plan.price <= 0;
            return {
              id: s.id,
              code: `INV-${s.id.slice(0, 8).toUpperCase()}`,
              planName: `Gói ${pName}`,
              billingPeriod: sDate && eDate ? `${sDate} – ${eDate}` : 'Theo chu kỳ',
              date: sDate || 'Gần đây',
              amount: s.plan?.price || 0,
              method: isZeroPrice ? 'Kích hoạt hệ thống (Miễn phí / Dùng thử)' : 'Cổng VNPAY (QR / ATM / Visa)',
              status: s.status === 'ACTIVE' ? 'success' : s.status === 'EXPIRED' ? 'failed' : 'pending',
              statusText: s.status === 'ACTIVE' ? 'Đã kích hoạt' : s.status === 'EXPIRED' ? 'Đã hết hạn' : s.status,
            };
          });

          if (isMounted) setInvoices(brandInvoices);
        } else {
          if (isMounted) setInvoices([]);
        }

        if (!isMounted) return;
        setHasUsedTrial(hadTrial);

        if (activeSub) {
          const activePlanId = activeSub.plan?.id;
          activePlanIdRef.current = activePlanId || null;

          // Update current plan indicator on plans
          if (activePlanId) {
            setPlans((prev) =>
              prev.map((p) => ({
                ...p,
                isCurrent: p.id === activePlanId,
              }))
            );
          }

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
          const usedCamp = activeSub.usedCampaignQuota || 0;
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
          ]);
        } else {
          // Chưa có subscription hoạt động
          const usedCamp = 0;
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
          ]);
        }
      } catch (err) {
        console.error('Failed to load subscription data:', err);
      } finally {
        if (isMounted) setLoadingSubInfo(false);
      }
    };

    loadSubscriptionData();

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
      <CurrentPlanBanner
        subInfo={subInfo}
        loading={loadingSubInfo}
        onGoToPlans={() => setActiveTab('plans')}
        onGoToQuota={() => setActiveTab('quota')}
      />

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
                <PlansTab
                  plans={plans}
                  loading={loadingPlans}
                  hasUsedTrial={hasUsedTrial}
                  isPaidSubscriber={isPaidSubscriber}
                  currentPlanName={subInfo.currentPlanName}
                  onUpgrade={handleOpenUpgrade}
                />
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
                <QuotaTab
                  quotas={quotas}
                  subInfo={subInfo}
                  loading={loadingSubInfo}
                  onGoToPlans={() => setActiveTab('plans')}
                />
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
                <HistoryTab
                  invoices={invoices}
                  loading={loadingSubInfo}
                  onViewInvoice={(invoice) => {
                    setSelectedInvoice(invoice);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 4. Payment / Upgrade Modal */}
      <UpgradeModal
        open={isUpgradeModalOpen}
        plan={selectedPlanForUpgrade}
        paying={paying}
        onCancel={() => setIsUpgradeModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      {/* 5. Detailed Invoice Modal */}
      <InvoiceModal
        open={isInvoiceModalOpen}
        invoice={selectedInvoice}
        currentBrand={currentBrand}
        storedUser={storedUser}
        onCancel={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
}
