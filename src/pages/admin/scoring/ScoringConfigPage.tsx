import React, { useState } from 'react';
import { Card, Tabs, message } from 'antd';
import {
  SlidersOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { CURRENT_WEIGHTS, SCORING_VERSIONS, type ScoringVersion } from '../../../mock/adminData';
import WeightsEditorTab from './components/WeightsEditorTab';
import PreviewTab from './components/PreviewTab';
import VersionHistoryTab from './components/VersionHistoryTab';

export default function ScoringConfigPage() {
  const [weights, setWeights] = useState<Record<string, number>>(CURRENT_WEIGHTS);
  const [versions, setVersions] = useState<ScoringVersion[]>(SCORING_VERSIONS);
  const [activeTab, setActiveTab] = useState('editor');

  const handleSaveNewVersion = (newWeights: Record<string, number>, notes: string) => {
    const currentNum = versions.length > 0 ? parseFloat(versions[0].version.replace('v', '')) : 2.0;
    const nextVersionStr = `v${(currentNum + 0.1).toFixed(1)}`;

    const newVer: ScoringVersion = {
      id: `sv_${Date.now()}`,
      version: nextVersionStr,
      savedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      savedBy: 'Trần Minh Khoa (Admin)',
      notes,
      isCurrent: true,
      weights: newWeights,
    };

    setVersions(prev => [newVer, ...prev.map(v => ({ ...v, isCurrent: false }))]);
    setWeights(newWeights);
    message.success(`Đã lưu và triển khai thành công phiên bản ${nextVersionStr}!`);
  };

  const handleRollback = (ver: ScoringVersion, reason: string) => {
    setWeights(ver.weights);
    setVersions(prev =>
      prev.map(v => ({
        ...v,
        isCurrent: v.id === ver.id,
      }))
    );
    message.success(`Đã khôi phục thành công về phiên bản ${ver.version}!`);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Creator Scoring Algorithm Configuration</div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
          Hiệu chỉnh tỷ trọng các tiêu chí tính điểm Creator, kiểm thử tác động và quản lý lịch sử phiên bản thuật toán
        </div>
      </div>

      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          tabBarStyle={{ padding: '0 20px', marginBottom: 0, borderBottom: '1px solid #EEF0F6' }}
          items={[
            {
              key: 'editor',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <SlidersOutlined /> Hiệu chỉnh Trọng số (Weights Editor)
                </span>
              ),
              children: (
                <div style={{ padding: '24px 20px' }}>
                  <WeightsEditorTab
                    weights={weights}
                    onChange={setWeights}
                    onSaveNewVersion={handleSaveNewVersion}
                  />
                </div>
              ),
            },
            {
              key: 'preview',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <EyeOutlined /> Xem trước kết quả (Live Preview)
                </span>
              ),
              children: (
                <div style={{ padding: '24px 20px' }}>
                  <PreviewTab weights={weights} />
                </div>
              ),
            },
            {
              key: 'history',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <HistoryOutlined /> Lịch sử phiên bản ({versions.length})
                </span>
              ),
              children: (
                <div style={{ padding: '24px 20px' }}>
                  <VersionHistoryTab
                    versions={versions}
                    currentWeights={weights}
                    onRollback={handleRollback}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
