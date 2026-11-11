import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Space, Badge, Tabs, message } from 'antd';
import { ReloadOutlined, ControlOutlined, BranchesOutlined } from '@ant-design/icons';
import apiClient from '../../../services/apiClient';
import type { QualityItem, IdentityConflictItem, QualityOverview } from './types';
import QualityReviewTab from './components/quality/QualityReviewTab';
import IdentityResolutionTab from './components/identity/IdentityResolutionTab';

export default function DataQualityPage() {
  const [activeTab, setActiveTab] = useState<'quality' | 'identity'>('quality');
  const [loading, setLoading] = useState(false);
  const [recrawlingId, setRecrawlingId] = useState<string | null>(null);

  // Overview Stats
  const [overview, setOverview] = useState<QualityOverview>({
    pendingCount: 0,
    accuracyRate: 92.4,
    standardizedTodayCount: 0,
  });

  // Tab 1 & Tab 2 Real State
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
            pendingCount: d.pendingCount ?? 0,
            accuracyRate: d.accuracyRate ?? 92.4,
            standardizedTodayCount: d.standardizedTodayCount ?? 0,
          });
        }
      }

      if (pendingRes.status === 'fulfilled') {
        const raw = pendingRes.value.data;
        const d = (raw as any)?.data ?? raw;
        const serverList = Array.isArray(d) ? d : d?.items || d?.content || [];
        setItems(serverList);
        if (serverList.length > 0) {
          setOverview((prev) => ({
            ...prev,
            pendingCount: Math.max(prev.pendingCount, serverList.length),
          }));
        }
      }

      if (conflictsRes.status === 'fulfilled') {
        const raw = conflictsRes.value.data;
        const cList = Array.isArray(raw) ? raw : raw?.items || [];
        setConflicts(cList);
      }
    } catch {
      message.error('Không thể đồng bộ dữ liệu kiểm định từ máy chủ crawler');
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
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4px 0 32px' }}>
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
            <span>Kiểm định Chất lượng & Xử lý Xung đột Danh tính</span>
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
            Làm mới dữ liệu
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
                  <ControlOutlined />
                  <span>1. Chuẩn hóa Ngách & Dữ liệu Cào</span>
                  <Badge count={items.length} overflowCount={99} style={{ backgroundColor: '#F59E0B' }} />
                </span>
              ),
              children: (
                <QualityReviewTab
                  overview={overview}
                  items={items}
                  loading={loading}
                  recrawlingId={recrawlingId}
                  onApproveSubmit={handleApproveSubmit}
                  onRecrawl={handleRecrawl}
                />
              ),
            },
            {
              key: 'identity',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, padding: '4px 0' }}>
                  <BranchesOutlined />
                  <span>2. Xử lý Xung đột Danh tính (Identity Resolution)</span>
                  <Badge count={conflicts.length} overflowCount={99} style={{ backgroundColor: '#2563EB' }} />
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
