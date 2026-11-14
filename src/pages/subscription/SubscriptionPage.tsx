import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Typography, Card, Tabs, message, Alert, Button } from 'antd';
import { CrownOutlined, PieChartOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

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

import { quotaTotal, reconcilePayment, subscriptionIsActive } from './billingState';
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

  const navigate = useNavigate();
  const isMountedRef = useRef(true);

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
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');
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

  // 2. Fetch brand & active subscription info concurrently
  const loadSubscriptionData = useCallback(async (forceRefresh = false) => {
    try {
      setSubscriptionError('');
      // 1. Luôn truy vấn profile brand chính chủ của token hiện tại từ /brands/me
      let brand = await brandService.getMyBrand(true);

      // 2. Nếu tài khoản Brand mới chưa có hồ sơ profile (404), tự động tạo hồ sơ brand để có ID riêng
      if (!brand?.id) {
        const user = getStoredUser();
        if (user) {
          brand = await brandService.createBrand({
            businessName: user?.fullName ? `Thương hiệu của ${user.fullName}` : 'Thương hiệu của tôi',
            industry: 'E-commerce',
            website: 'https://influencermatch.vn',
            location: 'Việt Nam',
            targetMarkets: ['Vietnam'],
            targetAudiences: ['General Audience'],
            brandTone: 'Chuyên nghiệp',
            preferredPlatforms: ['TIKTOK', 'INSTAGRAM'],
            description: 'Thương hiệu đối tác trên hệ thống InfluencerMatch.',
          }).catch(() => null);
        }
      }

      if (brand?.id) {
        try {
          localStorage.setItem('influencermatch_brand_id', brand.id);
        } catch {}
      } else {
        try {
          localStorage.removeItem('influencermatch_brand_id');
        } catch {}
      }

      if (brand && isMountedRef.current) {
        setCurrentBrand(brand);
      }

      let activeSub: SubscriptionResponse | null = null;
      let hadTrial = false;
      const effectiveBrandId = brand?.id || null;

      if (effectiveBrandId) {
        if (isMountedRef.current) setCurrentBrandId(effectiveBrandId);

        const subs = await subscriptionService.getBrandSubscriptions(effectiveBrandId, forceRefresh);

        activeSub = (subs || []).find((s) => subscriptionIsActive(s.status, s.expirationDate)) || null;
        hadTrial = (subs || []).some((s) => {
          const p = s.plan;
          return p?.price === 0 || p?.planName?.toLowerCase().includes('trial') || p?.planName?.toLowerCase() === 'free';
        });

      }

      if (!isMountedRef.current) return;
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
        const totalCamp = quotaTotal(activeSub.plan?.campaignQuota, (activeSub as any).campaignQuota);
        const usedCamp = activeSub.usedCampaignQuota || 0;
        const totalReco = quotaTotal(activeSub.plan?.recommendationQuota, (activeSub as any).recommendationQuota);
        const usedReco = activeSub.usedRecommendationQuota || 0;
        const totalRef = quotaTotal(activeSub.plan?.refreshQuota, (activeSub as any).refreshQuota);
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
        activePlanIdRef.current = null;
        setPlans(previous => previous.map(plan => ({ ...plan, isCurrent: false })));
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
      if (isMountedRef.current) setSubscriptionError(getErrorMessage(err, 'Không tải được gói hiện tại. Vui lòng thử lại.'));
    } finally {
      if (isMountedRef.current) setLoadingSubInfo(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Pipeline A: Fetch plans immediately and independently
    subscriptionService
      .getPlans()
      .then((remotePlans) => {
        if (!isMountedRef.current) return;
        const rawList = Array.isArray(remotePlans) ? remotePlans : [];
        setPlans(mapPlans(rawList, activePlanIdRef.current || undefined));
        setLoadingPlans(false);
      })
      .catch((err) => {
        console.warn('[SubscriptionPage] Không thể lấy plans từ API:', err);
        if (isMountedRef.current) setLoadingPlans(false);
      });

    // 2. Load active subscription
    loadSubscriptionData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSubscriptionData]);

  // History comes from actual payment records, not subscription state or current plan price.
  useEffect(() => {
    if (activeTab !== 'history') return;
    const controller = new AbortController();
    setHistoryLoading(true);
    setHistoryError('');
    subscriptionService.getPaymentHistory(historyPage, 10, controller.signal).then(page => {
      if (controller.signal.aborted) return;
      const labels: Record<string, string> = { PAID: 'Đã thanh toán', PENDING: 'Đang chờ thanh toán', FAILED: 'Thanh toán thất bại', REFUNDED: 'Đã hoàn tiền' };
      setHistoryTotal(page.totalElements);
      setInvoices(page.items.map(payment => ({
        id: payment.id,
        code: payment.transactionCode || payment.id,
        planName: payment.planName,
        date: new Date(payment.paidAt || payment.createdAt).toLocaleString('vi-VN'),
        billingPeriod: payment.startDate && payment.expirationDate
          ? `${payment.startDate} – ${payment.expirationDate}` : '—',
        amount: Number(payment.amount), currency: payment.currency,
        method: payment.gateway,
        status: payment.status === 'PAID' ? 'success' : payment.status === 'PENDING' ? 'pending' : 'failed',
        statusText: labels[payment.status] || payment.status,
      })));
    }).catch(error => {
      if (!controller.signal.aborted) setHistoryError(getErrorMessage(error, 'Không tải được lịch sử thanh toán.'));
    }).finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [activeTab, historyPage, historyVersion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!['payment', 'vnp_ResponseCode', 'vnp_TransactionStatus', 'status'].some(key => params.has(key))) return;
    const reference = params.get('txnRef') || params.get('vnp_TxnRef');
    if (!reference) {
      message.warning('Chưa có mã giao dịch để xác minh thanh toán. Vui lòng kiểm tra lịch sử thanh toán.');
      return;
    }
    const controller = new AbortController();
    message.loading({ content: 'Đang xác minh thanh toán với máy chủ...', key: 'vnpay_payment_toast', duration: 0 });
    reconcilePayment(reference, (ref, signal) => subscriptionService.getPaymentStatus(ref, signal), controller.signal)
      .then(async payment => {
        if (controller.signal.aborted) return;
        if (payment.status === 'PAID') {
          message.success({ content: 'Máy chủ đã xác nhận thanh toán thành công.', key: 'vnpay_payment_toast' });
          subscriptionService.clearBrandSubsCache();
          await loadSubscriptionData(true);
          if (controller.signal.aborted) return;
          setActiveTab('quota');
        } else if (payment.status === 'PENDING') {
          message.info({ content: 'Giao dịch đang chờ xác nhận. Bạn có thể kiểm tra lại trong lịch sử thanh toán.', key: 'vnpay_payment_toast', duration: 6 });
          setActiveTab('history');
        } else {
          message.error({ content: payment.status === 'REFUNDED' ? 'Giao dịch đã được đánh dấu hoàn tiền.' : 'Máy chủ xác nhận giao dịch không thành công.', key: 'vnpay_payment_toast' });
          setActiveTab('history');
        }
        setHistoryVersion(value => value + 1);
        params.delete('payment'); params.delete('txnRef'); params.delete('vnp_TxnRef');
        params.delete('status'); params.delete('vnp_ResponseCode'); params.delete('vnp_TransactionStatus');
        window.history.replaceState({}, '', window.location.pathname + (params.size ? `?${params}` : ''));
      }).catch(error => {
        if (!controller.signal.aborted) message.error({ content: getErrorMessage(error, 'Chưa xác minh được giao dịch. Vui lòng kiểm tra lịch sử thanh toán.'), key: 'vnpay_payment_toast' });
      });
    return () => { controller.abort(); message.destroy('vnpay_payment_toast'); };
  }, [loadSubscriptionData]);

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
        let validBrandId = currentBrandId;
        if (!validBrandId) {
          const fresh = await brandService.getMyBrand(true);
          validBrandId = fresh?.id || null;
        }
        if (!validBrandId) {
          throw new Error('Không tìm thấy thông tin thương hiệu của bạn. Vui lòng thử tải lại trang.');
        }
        await subscriptionService.subscribeFreePlan(validBrandId, selectedPlanForUpgrade.id);
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
      {subscriptionError && <Alert type="error" showIcon title="Không tải được gói hiện tại" description={subscriptionError}
        action={<Button onClick={() => loadSubscriptionData(true)}>Thử lại</Button>} style={{ marginBottom: 16 }} />}
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
                  loading={historyLoading}
                  page={historyPage}
                  total={historyTotal}
                  error={historyError}
                  onRetry={() => setHistoryVersion(value => value + 1)}
                  onPageChange={setHistoryPage}
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
