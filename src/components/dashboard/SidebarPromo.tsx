import React, { useState, useEffect } from 'react';
import { Button, Progress } from 'antd';
import { CrownFilled, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { brandService } from '../../services/api/brandService';
import { subscriptionService } from '../../services/api/subscriptionService';
import { campaignService } from '../../services/api/campaignService';
import type { SubscriptionResponse } from '../../types/api/subscription.types';

export default function SidebarPromo() {
  const navigate = useNavigate();
  const [subInfo, setSubInfo] = useState({
    planName: 'Professional',
    daysRemaining: 18,
    usedCampaigns: 0,
    totalCampaigns: 15,
    usedRefresh: 0,
    totalRefresh: 50,
    percent: 30,
    isPro: true,
    hasActiveSub: true,
  });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [brand, campaigns] = await Promise.all([
          brandService.getMyBrand().catch(() => null),
          campaignService.getCampaigns(0, 100).catch(() => []),
        ]);

        let activeSub: SubscriptionResponse | null = null;
        if (brand?.id) {
          const subs = await subscriptionService.getBrandSubscriptions(brand.id);
          activeSub = subs.find((s) => s.status === 'ACTIVE') || (subs.length > 0 ? subs[0] : null);
        }

        if (isMounted) {
          if (activeSub) {
            const planName = activeSub.plan?.planName?.replace(/-[0-9]+$/, '') || 'Professional';
            const expTime = new Date(activeSub.expirationDate).getTime();
            const daysRemaining = Math.max(0, Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24)));
            const totalCamp = activeSub.plan?.campaignQuota || 15;
            const usedCamp = activeSub.usedCampaignQuota || campaigns.length || 0;
            const totalRef = activeSub.plan?.refreshQuota || 50;
            const usedRef = activeSub.usedRefreshQuota || 0;
            const pct = Math.min(100, Math.round((usedCamp / (totalCamp || 1)) * 100));

            setSubInfo({
              planName,
              daysRemaining,
              usedCampaigns: usedCamp,
              totalCampaigns: totalCamp,
              usedRefresh: usedRef,
              totalRefresh: totalRef,
              percent: pct,
              isPro: !planName.toLowerCase().includes('free'),
              hasActiveSub: true,
            });
          } else {
            // Free / Trial account
            const usedCamp = campaigns.length;
            setSubInfo({
              planName: 'Trải Nghiệm',
              daysRemaining: 0,
              usedCampaigns: usedCamp,
              totalCampaigns: 3,
              usedRefresh: 0,
              totalRefresh: 5,
              percent: Math.min(100, Math.round((usedCamp / 3) * 100)),
              isPro: false,
              hasActiveSub: false,
            });
          }
        }
      } catch (err) {
        console.error('[SidebarPromo] Error loading subscription data:', err);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      onClick={() => navigate('/subscription')}
      style={{
        background: 'linear-gradient(145deg, #FAF5FF 0%, #F5F3FF 50%, #EEF2FF 100%)',
        border: '1px solid #DDD6FE',
        borderRadius: 14,
        padding: '13px 12px 12px 12px',
        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
      }}
      className="sidebar-subscription-card"
    >
      {/* Decorative ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 70,
          height: 70,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header: Crown Icon + Plan Title + Pro Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(124, 58, 237, 0.35)',
            flexShrink: 0,
          }}
        >
          <CrownFilled style={{ color: '#FDE047', fontSize: 16 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 12.5,
                color: '#0F172A',
                letterSpacing: -0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Gói {subInfo.planName}
            </span>
            <span
              style={{
                background: subInfo.isPro
                  ? 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)'
                  : '#CBD5E1',
                color: subInfo.isPro ? '#78350F' : '#334155',
                fontWeight: 800,
                fontSize: 9,
                padding: '1.5px 5px',
                borderRadius: 4,
                letterSpacing: 0.5,
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              {subInfo.isPro ? 'PRO' : 'FREE'}
            </span>
          </div>

          <div
            style={{
              fontSize: 10.5,
              color: '#6366F1',
              fontWeight: 600,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subInfo.hasActiveSub
              ? `Còn ${subInfo.daysRemaining} ngày chu kỳ`
              : 'Chưa kích hoạt gói'}
          </div>
        </div>
      </div>

      {/* Progress Quota Section */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10.5,
            color: '#64748B',
            fontWeight: 600,
            marginBottom: 3,
          }}
        >
          <span>Dung lượng sử dụng</span>
          <span style={{ color: '#4F46E5', fontWeight: 700 }}>{subInfo.percent}%</span>
        </div>

        <Progress
          percent={subInfo.percent}
          size="small"
          showInfo={false}
          strokeColor={{
            '0%': '#6366F1',
            '100%': '#8B5CF6',
          }}
          railColor="#E2E8F0"
          style={{ margin: 0, height: 6 }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: '#94A3B8',
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          <span>{subInfo.usedCampaigns}/{subInfo.totalCampaigns} chiến dịch</span>
          <span>{subInfo.usedRefresh}/{subInfo.totalRefresh} refresh</span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        type="primary"
        size="small"
        block
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 11,
          height: 28,
          marginTop: 9,
          boxShadow: '0 3px 10px rgba(99, 102, 241, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigate('/subscription');
        }}
      >
        <span>{subInfo.hasActiveSub ? 'Quản lý & Hạn mức' : 'Nâng cấp gói ngay'}</span>
        <ArrowRightOutlined style={{ fontSize: 9.5 }} />
      </Button>
    </div>
  );
}
