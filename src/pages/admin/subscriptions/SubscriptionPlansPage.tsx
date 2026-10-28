import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Spin, message, Popconfirm, Empty, Tooltip, Alert } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  AimOutlined,
  RobotOutlined,
  UsergroupAddOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { subscriptionService } from '../../../services/api/subscriptionService';
import { adminService } from '../../../services/api/adminService';
import type { PlanResponse, PlanCreateRequest, PlanUpdateRequest } from '../../../types/api/subscription.types';
import CreateEditPlanForm from './components/CreateEditPlanForm';
import ActivateStopToggle from './components/ActivateStopToggle';

const { Text, Title } = Typography;

interface PaymentStats {
  totalRevenue: number;
  paidCount: number;
  totalCount: number;
  totalPending?: number;
  totalRefunded?: number;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchPlansAndStats = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const [plansData, statsData] = await Promise.all([
        subscriptionService.getPlans(0, 50, true),
        adminService.getTransactionStats().catch((err: unknown) => {
          console.warn('[SubscriptionPlansPage] API /admin/payments/stats:', err);
          return null;
        }),
      ]);

      if (Array.isArray(plansData)) {
        setPlans(plansData);
      } else {
        setPlans([]);
      }

      if (statsData) {
        setStats({
          totalRevenue: Number(statsData.totalRevenue) || 0,
          paidCount: Number(statsData.paidCount) || 0,
          totalCount: Number(statsData.totalCount) || 0,
          totalPending: Number(statsData.totalPending) || 0,
          totalRefunded: Number(statsData.totalRefunded) || 0,
        });
      }
    } catch (err: any) {
      console.error('[SubscriptionPlansPage] Lỗi gọi API backend:', err);
      if (err?.response?.status === 401) {
        setAuthError('Yêu cầu xác thực (401 Unauthorized): Cần có token Admin hợp lệ để truy cập API máy chủ. Vui lòng đăng nhập lại tài khoản Admin.');
        message.error('Lỗi 401: Phiên đăng nhập chưa được xác thực hoặc token đã hết hạn!');
      } else {
        message.error(err?.response?.data?.message || err?.message || 'Không thể tải danh sách gói dịch vụ từ máy chủ.');
      }
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlansAndStats();
  }, [fetchPlansAndStats]);

  const activePlansCount = plans.filter((p) => p.status === 'ACTIVE').length;

  const handleStatusChange = async (planId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    const target = plans.find((p) => p.id === planId);
    if (!target) return;

    try {
      await subscriptionService.updatePlan(planId, {
        planName: target.planName,
        price: target.price,
        currency: target.currency || 'VND',
        durationDays: target.durationDays,
        campaignQuota: target.campaignQuota,
        recommendationQuota: target.recommendationQuota,
        refreshQuota: target.refreshQuota,
        description: target.description,
        status: newStatus,
      });

      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p))
      );
      message.success(
        newStatus === 'ACTIVE'
          ? `Đã kích hoạt mở bán gói "${target.planName}"!`
          : `Đã tạm dừng gói "${target.planName}".`
      );
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể cập nhật trạng thái gói.');
    }
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (plan: PlanResponse) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await subscriptionService.deletePlan(planId);
      message.success('Đã tạm dừng và cập nhật trạng thái gói dịch vụ!');
      fetchPlansAndStats();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi xóa gói dịch vụ.');
    }
  };

  const handleSavePlan = async (payload: PlanCreateRequest | PlanUpdateRequest, planId?: string) => {
    setSaving(true);
    try {
      if (planId) {
        await subscriptionService.updatePlan(planId, payload as PlanUpdateRequest);
        message.success(`Đã cập nhật thông tin gói "${payload.planName}" thành công!`);
      } else {
        await subscriptionService.createPlan(payload as PlanCreateRequest);
        message.success(`Đã tạo mới gói dịch vụ "${payload.planName}" thành công!`);
      }
      setFormOpen(false);
      fetchPlansAndStats();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể lưu gói dịch vụ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)} tỷ VNĐ`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} triệu VNĐ`;
    if (val > 0) return `${val.toLocaleString('vi-VN')} đ`;
    return '0 đ';
  };

  return (
    <div style={{ padding: '4px 0 24px' }}>
      {/* Tiêu đề trang & Nút thêm mới */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>
            Quản Lý Gói Dịch Vụ & Hạn Mức
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13, display: 'block', marginTop: 2 }}>
            Quản trị biểu phí, chu kỳ, hạn mức sử dụng (Quota) và trạng thái mở bán các gói thuê bao dành cho nhãn hàng (Brand).
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchPlansAndStats()}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            Làm mới
          </Button>
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
            Tạo gói mới
          </Button>
        </div>
      </div>

      {/* Thông báo lỗi xác thực nếu có */}
      {authError && (
        <Alert
          type="error"
          showIcon
          message="Yêu cầu đăng nhập xác thực (401 Unauthorized)"
          description={authError}
          style={{ marginBottom: 20, borderRadius: 10 }}
          action={
            <Button size="small" type="primary" danger onClick={() => { window.location.href = '/login'; }}>
              Đăng nhập tài khoản Admin
            </Button>
          }
        />
      )}

      {/* KPI Thống kê Tổng quan (dữ liệu thật từ backend API) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>
                TỔNG SỐ GÓI DỊCH VỤ
              </span>
              <AppstoreOutlined style={{ color: '#6366F1', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>
              {plans.length} gói
            </div>
            <div style={{ fontSize: 12, color: '#10B981', marginTop: 2, fontWeight: 600 }}>
              {activePlansCount} gói đang mở bán ({plans.length - activePlansCount} tạm dừng)
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>
                TỔNG DOANH THU THANH TOÁN
              </span>
              <DollarCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981', marginTop: 6 }}>
              {stats ? formatCurrency(stats.totalRevenue) : '0 đ'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Thu từ giao dịch thanh toán VNPAY thực tế
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>
                GIAO DỊCH THÀNH CÔNG
              </span>
              <CheckCircleOutlined style={{ color: '#6366F1', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#6366F1', marginTop: 6 }}>
              {stats ? `${stats.paidCount} giao dịch` : '0 giao dịch'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {stats?.totalCount ? `Trên tổng số ${stats.totalCount} lượt giao dịch phát sinh` : 'Chưa có giao dịch phát sinh'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Danh sách thẻ gói dịch vụ */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#64748B', fontSize: 13 }}>Đang tải danh mục gói dịch vụ từ máy chủ...</div>
        </div>
      ) : plans.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
          <Empty description="Chưa có gói dịch vụ nào trên hệ thống">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} style={{ borderRadius: 8 }}>
              Tạo gói dịch vụ đầu tiên
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {plans.map((plan) => {
            const isHighlight =
              plan.planName.toLowerCase().includes('pro') ||
              plan.planName.toLowerCase().includes('enterprise');
            const isActive = plan.status === 'ACTIVE';

            return (
              <Col xs={24} sm={12} lg={6} key={plan.id}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 14,
                    border: isHighlight ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                    boxShadow: isHighlight
                      ? '0 6px 20px rgba(99,102,241,0.12)'
                      : '0 2px 8px rgba(0,0,0,0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{
                    body: {
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    },
                  }}
                >
                  {/* Tiêu đề & Trạng thái */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 18,
                          color: '#0F172A',
                          display: 'block',
                          lineHeight: 1.3,
                        }}
                      >
                        {plan.planName}
                      </span>
                    </div>
                    {isActive ? (
                      <Tag
                        color="success"
                        style={{
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 11,
                          margin: 0,
                          padding: '2px 8px',
                        }}
                      >
                        Đang mở bán
                      </Tag>
                    ) : (
                      <Tag
                        color="default"
                        style={{
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: 11,
                          margin: 0,
                          padding: '2px 8px',
                        }}
                      >
                        Tạm dừng
                      </Tag>
                    )}
                  </div>

                  {/* Mô tả gói */}
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748B',
                      marginBottom: 14,
                      minHeight: 36,
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.description || 'Gói dịch vụ chính thức từ hệ thống InfluencerMatch'}
                  </div>

                  {/* Đơn giá & Chu kỳ */}
                  <div
                    style={{
                      marginBottom: 16,
                      padding: '12px',
                      borderRadius: 10,
                      background: isHighlight ? '#EEF2FF' : '#F8FAFC',
                      border: isHighlight ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                      {plan.price === 0 ? (
                        <span style={{ color: '#059669' }}>Miễn phí</span>
                      ) : (
                        `${plan.price.toLocaleString('vi-VN')} đ`
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Chu kỳ sử dụng: <strong>{plan.durationDays} ngày</strong>
                    </div>
                  </div>

                  {/* Hạn mức sử dụng (Quotas) */}
                  <div style={{ flex: 1, marginBottom: 16 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: 10,
                      }}
                    >
                      Hạn mức sử dụng (Quota):
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#334155',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AimOutlined style={{ color: '#6366F1' }} />
                          <span>Chiến dịch tối đa:</span>
                        </span>
                        <strong style={{ color: '#0F172A' }}>{plan.campaignQuota} chiến dịch</strong>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#334155',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RobotOutlined style={{ color: '#0EA5E9' }} />
                          <span>Gợi ý AI Match:</span>
                        </span>
                        <strong style={{ color: '#0F172A' }}>{plan.recommendationQuota} lượt</strong>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#334155',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UsergroupAddOutlined style={{ color: '#10B981' }} />
                          <span>Làm mới Creator:</span>
                        </span>
                        <strong style={{ color: '#0F172A' }}>{plan.refreshQuota} người/tháng</strong>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#334155',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ClockCircleOutlined style={{ color: '#F59E0B' }} />
                          <span>Thời hạn gói:</span>
                        </span>
                        <strong style={{ color: '#0F172A' }}>{plan.durationDays} ngày</strong>
                      </div>
                    </div>
                  </div>

                  {/* Hành động dưới chân thẻ */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid #F1F5F9',
                      gap: 8,
                    }}
                  >
                    <ActivateStopToggle plan={plan} onStatusChange={handleStatusChange} />

                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(plan)}
                        style={{ borderRadius: 6 }}
                      >
                        Sửa
                      </Button>
                      <Popconfirm
                        title="Tạm dừng gói dịch vụ này?"
                        description="Gói dịch vụ sẽ bị chuyển sang trạng thái tạm dừng mở bán."
                        onConfirm={() => handleDeletePlan(plan.id)}
                        okText="Tạm dừng"
                        cancelText="Hủy"
                      >
                        <Tooltip title="Ngưng mở bán">
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ borderRadius: 6 }}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Drawer Tạo / Chỉnh sửa Gói */}
      <CreateEditPlanForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        plan={editingPlan}
        onSave={handleSavePlan}
        saving={saving}
      />
    </div>
  );
}
