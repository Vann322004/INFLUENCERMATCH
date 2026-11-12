import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Space, Badge, Tabs, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../../services/apiClient';
import type { QualityItem, IdentityConflictItem, QualityOverview } from './types';
import QualityReviewTab from './components/quality/QualityReviewTab';
import IdentityResolutionTab from './components/identity/IdentityResolutionTab';

export default function DataQualityPage() {
  const [activeTab, setActiveTab] = useState<'quality' | 'identity'>('quality');
  const [loading, setLoading] = useState(false);
  const [recrawlingId, setRecrawlingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Overview Stats (100% Real API)
  const [overview, setOverview] = useState<QualityOverview>({
    pendingCount: 0,
    accuracyRate: 0,
    standardizedTodayCount: 0,
  });

  // Tab 1 & Tab 2 Real State (Khởi tạo rỗng, hoàn toàn không dùng mock data)
  const [items, setItems] = useState<QualityItem[]>([]);
  const [conflicts, setConflicts] = useState<IdentityConflictItem[]>([]);

  // Fetch all real data from backend
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, pendingRes, conflictsRes] = await Promise.allSettled([
        apiClient.get('/quality/overview'),
        apiClient.get('/quality/pending', { params: { limit: 100 } }),
        apiClient.get('/quality/identity-conflicts', { params: { status: 'PENDING' } }),
      ]);

      if (overviewRes.status === 'fulfilled') {
        const d = overviewRes.value.data;
        if (d && typeof d === 'object') {
          setOverview({
            pendingCount: d.pendingCount ?? d.pending_count ?? 0,
            accuracyRate: d.accuracyRate ?? d.accuracy_rate ?? 0,
            standardizedTodayCount: d.standardizedTodayCount ?? d.standardized_today_count ?? 0,
          });
        }
      } else {
        setOverview({
          pendingCount: 0,
          accuracyRate: 0,
          standardizedTodayCount: 0,
        });
      }

      if (pendingRes.status === 'fulfilled') {
        const raw = pendingRes.value.data;
        const d = (raw as any)?.data ?? raw;
        const serverList = Array.isArray(d) ? d : d?.items || d?.content || [];
        setItems(serverList);
        setOverview((prev) => ({
          ...prev,
          pendingCount: serverList.length,
        }));
      } else {
        setItems([]);
        setOverview((prev) => ({
          ...prev,
          pendingCount: 0,
        }));
      }

      if (conflictsRes.status === 'fulfilled') {
        const raw = conflictsRes.value.data;
        const cList = Array.isArray(raw) ? raw : raw?.items || [];
        setConflicts(cList);
      } else {
        setConflicts([]);
      }
    } catch {
      setItems([]);
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Submit approve in Tab 1 (Real API)
  const handleApproveSubmit = async (
    item: QualityItem,
    values: { niche: string; primaryType: string; notes?: string }
  ) => {
    try {
      const targetId = item.creatorId || item.metricId;
      await apiClient.post(`/quality/${targetId}/standardize`, {
        niche: values.niche,
        primaryType: values.primaryType || 'KOC',
        note: values.notes || '',
      });

      message.success(`Đã chuẩn hóa ngành hàng "${values.niche}" và phê duyệt KOC @${item.userName}!`);
      setItems((prev) => prev.filter((i) => i.metricId !== item.metricId));
      setOverview((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
        standardizedTodayCount: prev.standardizedTodayCount + 1,
      }));
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Không thể hoàn tất chuẩn hóa.';
      message.error(errorMsg);
      throw err;
    }
  };

  // Reject candidate in Tab 1 (Real API)
  const handleReject = async (item: QualityItem) => {
    setRejectingId(item.metricId);
    try {
      const targetId = item.creatorId || item.metricId;
      await apiClient.post(`/quality/${targetId}/reject`);
      message.success(`Đã từ chối và loại bỏ hồ sơ @${item.userName} khỏi hàng đợi kiểm duyệt.`);
      setItems((prev) => prev.filter((i) => i.metricId !== item.metricId));
      setOverview((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
      }));
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Không thể từ chối hồ sơ.';
      message.error(errorMsg);
      throw err;
    } finally {
      setRejectingId(null);
    }
  };

  // Recrawl action in Tab 1 (Real API)
  const handleRecrawl = async (item: QualityItem) => {
    setRecrawlingId(item.metricId);
    message.loading({ content: `Đang gửi lệnh cào lại dữ liệu cho @${item.userName}...`, key: 'recrawl' });
    try {
      const targetId = item.creatorId || item.metricId;
      const res = await apiClient.post(`/quality/${targetId}/recrawl`);
      message.success({
        content: res.data?.message || `Đã hoàn tất cào lại dữ liệu cho @${item.userName}!`,
        key: 'recrawl',
      });
      setItems((prev) => prev.filter((i) => i.metricId !== item.metricId));
      setOverview((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
      }));
    } catch (err: any) {
      message.error({
        content: err?.response?.data?.detail || err?.message || `Lỗi khi cào lại @${item.userName}`,
        key: 'recrawl',
      });
    } finally {
      setRecrawlingId(null);
    }
  };

  // Confirm Merge in Tab 2 (Real API)
  const handleConfirmMerge = async (conflict: IdentityConflictItem, masterProfileId: string) => {
    try {
      const res = await apiClient.post(`/quality/identity-conflicts/${conflict.id}/resolve`, {
        action: 'MERGE',
        masterProfileId,
      });

      const masterName =
        masterProfileId === conflict.profileA.id
          ? conflict.profileA.displayName
          : conflict.profileB.displayName;

      message.success({
        content: res.data?.message || `Đã hợp nhất thành công hồ sơ đa kênh cho "${masterName}"!`,
        duration: 3,
      });

      setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.message || 'Lỗi khi hợp nhất hồ sơ.');
      throw err;
    }
  };

  // Confirm Separate Entities in Tab 2 (Real API)
  const handleResolveSeparate = async (conflict: IdentityConflictItem) => {
    try {
      const res = await apiClient.post(`/quality/identity-conflicts/${conflict.id}/resolve`, {
        action: 'SEPARATE',
      });
      message.info(
        res.data?.message || `Đã xác nhận @${conflict.profileA.userName} và @${conflict.profileB.userName} là 2 Creator riêng biệt.`
      );
      setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.message || 'Lỗi khi xác nhận tách hồ sơ.');
      throw err;
    }
  };

  return (
    <div>
      {/* 1. Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Kiểm định Chất lượng & Chuẩn hóa KOC</span>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
              Chuẩn hóa dữ liệu KOC
            </Tag>
          </div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
            Trung tâm xử lý dữ liệu cào: Chuẩn hóa ngách ngành hàng KOC và hợp nhất các hồ sơ trùng lặp đa nền tảng.
          </div>
        </div>

        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAllData}
            loading={loading}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Làm mới dữ liệu KOC
          </Button>
        </Space>
      </div>

      {/* 2. Main Navigation Tabs */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'quality' | 'identity')}
          size="middle"
          tabBarStyle={{
            padding: '0 20px',
            marginBottom: 0,
            borderBottom: '1px solid #EEF0F6',
            background: '#FAFAFD',
          }}
          items={[
            {
              key: 'quality',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, padding: '4px 0' }}>
                  <span>Duyệt ngành hàng KOC</span>
                  <Badge count={items.length} overflowCount={99} style={{ backgroundColor: items.length > 0 ? '#F59E0B' : '#94A3B8' }} />
                </span>
              ),
              children: (
                <QualityReviewTab
                  overview={overview}
                  items={items}
                  loading={loading}
                  recrawlingId={recrawlingId}
                  rejectingId={rejectingId}
                  onApproveSubmit={handleApproveSubmit}
                  onReject={handleReject}
                  onRecrawl={handleRecrawl}
                />
              ),
            },
            {
              key: 'identity',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, padding: '4px 0' }}>
                  <span>Hồ sơ trùng lặp đa kênh</span>
                  <Badge count={conflicts.length} overflowCount={99} style={{ backgroundColor: conflicts.length > 0 ? '#6366F1' : '#94A3B8' }} />
                </span>
              ),
              children: (
                <IdentityResolutionTab
                  conflicts={conflicts}
                  loading={loading}
                  onConfirmMerge={handleConfirmMerge}
                  onResolveSeparate={handleResolveSeparate}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
