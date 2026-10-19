import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Space, Typography, Tooltip, message, Spin } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  CrownOutlined,
  TeamOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import type { SubscriptionPlan, PlanStatus } from '../../../mock/adminData';
import { subscriptionService } from '../../../services/api/subscriptionService';
import type { PlanResponse } from '../../../types/api/subscription.types';
import CreateEditPlanForm from './components/CreateEditPlanForm';
import ActivateStopToggle from './components/ActivateStopToggle';

const { Text } = Typography;

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data: PlanResponse[] = await subscriptionService.getPlans();
      const mapped: SubscriptionPlan[] = data.map((p) => ({
        id: p.id,
        name: p.planName.replace(/-[0-9]+$/, ''),
        description: p.description || 'Gói dịch vụ InfluencerMatch',
        priceMonth: p.price,
        priceYear: p.price * 10,
        billingCycle: 'monthly',
        status: (p.status === 'ACTIVE' ? 'active' : 'paused') as PlanStatus,
        activeUsers: 0,
        quotaSearch: p.recommendationQuota || 50,
        quotaCreators: p.refreshQuota || 20,
        quotaCampaigns: p.campaignQuota || 5,
        features: [
          `Tối đa ${p.campaignQuota} chiến dịch hoạt động`,
          `Khám phá ${p.recommendationQuota} lượt AI Match`,
          `Làm mới ${p.refreshQuota} Creator / tháng`,
          'Hỗ trợ thanh toán VNPAY trực tuyến',
        ],
      }));
      setPlans(mapped);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const totalUsers = plans.reduce((acc, p) => acc + p.activeUsers, 0);
  const totalMRR = plans.reduce((acc, p) => acc + p.priceMonth * p.activeUsers, 0);

  const handleStatusChange = async (planId: string, newStatus: PlanStatus) => {
    try {
      const target = plans.find((p) => p.id === planId);
      if (target) {
        await subscriptionService.updatePlan(planId, {
          planName: target.name,
          price: target.priceMonth,
          currency: 'VND',
          durationDays: 30,
          campaignQuota: target.quotaCampaigns,
          recommendationQuota: target.quotaSearch,
          refreshQuota: target.quotaCreators,
          description: target.description,
          status: newStatus === 'active' ? 'ACTIVE' : 'INACTIVE',
        });
      }
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p)));
      message.success('Đã cập nhật trạng thái gói trên máy chủ!');
    } catch {
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p)));
    }
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const handleSavePlan = async (savedPlan: SubscriptionPlan) => {
    try {
      const idx = plans.findIndex((p) => p.id === savedPlan.id);
      if (idx >= 0) {
        await subscriptionService.updatePlan(savedPlan.id, {
          planName: savedPlan.name,
          price: savedPlan.priceMonth,
          currency: 'VND',
          durationDays: 30,
          campaignQuota: savedPlan.quotaCampaigns,
          recommendationQuota: savedPlan.quotaSearch,
          refreshQuota: savedPlan.quotaCreators,
          description: savedPlan.description,
          status: savedPlan.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        });
        message.success(`Đã cập nhật gói ${savedPlan.name} lên máy chủ!`);
      } else {
        await subscriptionService.createPlan({
          planName: savedPlan.name,
          price: savedPlan.priceMonth,
          currency: 'VND',
          durationDays: 30,
          campaignQuota: savedPlan.quotaCampaigns,
          recommendationQuota: savedPlan.quotaSearch,
          refreshQuota: savedPlan.quotaCreators,
          description: savedPlan.description,
        });
        message.success(`Đã tạo gói mới ${savedPlan.name} trên máy chủ!`);
      }
      fetchPlans();
    } catch {
      fetchPlans();
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Subscription Plans & Quota Management</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
            Quản trị các gói dịch vụ dành cho Brand, biểu phí, hạn mức sử dụng và tình trạng kích hoạt từ hệ thống API
          </div>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          Tạo Plan mới
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TỔNG GÓI DỊCH VỤ</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
              {plans.length} gói
            </div>
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>
              {plans.filter((p) => p.status === 'active').length} gói đang hoạt động
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TỔNG THUÊ BAO ĐANG DÙNG</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
              {totalUsers.toLocaleString()} Brands
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Khách hàng trả phí & dùng thử</div>
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>DOANH THU ĐỊNH KỲ THÁNG (MRR)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {(totalMRR / 1e6).toFixed(1)} triệu VND
            </div>
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>Ước tính theo chu kỳ tháng</div>
          </Card>
        </Col>
      </Row>

      {/* Plan Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" description="Đang nạp danh sách gói dịch vụ từ máy chủ..." />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {plans.map((plan) => {
            const isProOrEnt = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('enterprise');

            return (
              <Col xs={24} sm={12} lg={6} key={plan.id}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 14,
                    border: isProOrEnt ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                    boxShadow: isProOrEnt ? '0 4px 16px rgba(99,102,241,0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  styles={{ body: { padding: 20, display: 'flex', flexDirection: 'column', flex: 1 } }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 18, color: '#0F172A' }}>{plan.name}</span>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{plan.description}</div>
                    </div>
                    {plan.status === 'active' ? (
                      <Tag color="success" style={{ borderRadius: 6, fontWeight: 600 }}>Active</Tag>
                    ) : (
                      <Tag color="default" style={{ borderRadius: 6 }}>Paused</Tag>
                    )}
                  </div>

                  {/* Pricing */}
                  <div style={{ margin: '8px 0 16px' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                      {plan.priceMonth === 0 ? 'Miễn phí' : `${(plan.priceMonth / 1e3).toLocaleString()}k`}
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}> / tháng</span>
                    </div>
                    {plan.priceYear > 0 && (
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        hoặc {(plan.priceYear / 1e6).toFixed(1)} triệu / năm
                      </div>
                    )}
                  </div>

                  {/* Users Count */}
                  <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 12px', border: '1px solid #E2E8F0', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748B' }}>Đang sử dụng:</span>
                      <strong style={{ color: '#6366F1' }}>{plan.activeUsers} brands</strong>
                    </div>
                  </div>

                  {/* Quotas */}
                  <div style={{ fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    <div>🔍 Tìm kiếm: <strong>{plan.quotaSearch >= 999 ? 'Không giới hạn' : `${plan.quotaSearch} lượt/th`}</strong></div>
                    <div>👥 Creator/tìm kiếm: <strong>{plan.quotaCreators >= 999 ? 'Tất cả' : `${plan.quotaCreators} creator`}</strong></div>
                    <div>📊 Chiến dịch: <strong>{plan.quotaCampaigns >= 999 ? 'Không giới hạn' : `${plan.quotaCampaigns} chiến dịch`}</strong></div>
                  </div>

                  {/* Features List */}
                  <div style={{ flex: 1, borderTop: '1px solid #F1F5F9', paddingTop: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
                      Tính năng bao gồm:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                          <CheckOutlined style={{ color: '#10B981', fontSize: 11 }} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                    <ActivateStopToggle plan={plan} onStatusChange={handleStatusChange} />
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEdit(plan)}
                      style={{ borderRadius: 8 }}
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Form Drawer */}
      <CreateEditPlanForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        plan={editingPlan}
        onSave={handleSavePlan}
      />
    </div>
  );
}
