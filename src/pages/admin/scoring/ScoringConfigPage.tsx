import React, { useState, useEffect } from 'react';
import { Card, Tabs, message, Tag, Alert, Spin, Descriptions, Row, Col, Statistic } from 'antd';
import {
  SlidersOutlined,
  EyeOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { CURRENT_WEIGHTS, SCORING_VERSIONS, type ScoringVersion } from '../../../mock/adminData';
import { adminService } from '../../../services/api/adminService';
import WeightsEditorTab from './components/WeightsEditorTab';
import PreviewTab from './components/PreviewTab';
import VersionHistoryTab from './components/VersionHistoryTab';

export default function ScoringConfigPage() {
  const [weights, setWeights] = useState<Record<string, number>>(CURRENT_WEIGHTS);
  const [versions, setVersions] = useState<ScoringVersion[]>(SCORING_VERSIONS);
  const [activeTab, setActiveTab] = useState('editor');
  const [engineConfig, setEngineConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const cfg = await adminService.getRecommendationConfig();
        if (isMounted && cfg) {
          setEngineConfig(cfg);
        }
      } catch (err) {
        console.warn('Không thể tải /admin/recommendation-config:', err);
      } finally {
        if (isMounted) setLoadingConfig(false);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

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
          Hiệu chỉnh tỷ trọng các tiêu chí tính điểm Creator, kiểm thử tác động và quản lý lịch sử phiên bản thuật toán (Luồng DM-04)
        </div>
      </div>

      {/* Live Engine Config from Backend (GET /admin/recommendation-config) */}
      <Spin spinning={loadingConfig}>
        {engineConfig && (
          <Card
            bordered={false}
            style={{
              marginBottom: 20,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
              border: '1px solid #C7D2FE',
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThunderboltOutlined style={{ color: '#4F46E5', fontSize: 18 }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>
                  Cấu hình Four-Memory Engine đang hoạt động (Backend Live)
                </span>
                <Tag color="blue" style={{ fontWeight: 600 }}>Engine {engineConfig.engineVersion || 'v1.0'}</Tag>
                <Tag color="purple" style={{ fontWeight: 600 }}>Calibration {engineConfig.calibrationVersion || 'v1.0'}</Tag>
              </div>
              <div>
                {engineConfig.dynamicallyMutable ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">Cho phép cập nhật động</Tag>
                ) : (
                  <Tag icon={<LockOutlined />} color="warning">Chế độ Calibrated Read-Only</Tag>
                )}
              </div>
            </div>

            <Row gutter={[16, 12]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, color: '#64748B' }}>Default Lambda (CRITIC Blend)</span>}
                  value={engineConfig.dynamicWeighting?.defaultLambda ?? '—'}
                  valueStyle={{ fontSize: 18, fontWeight: 700, color: '#4F46E5' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, color: '#64748B' }}>Min Pool Size for CRITIC</span>}
                  value={engineConfig.dynamicWeighting?.minPoolSizeForCritic ?? '—'}
                  valueStyle={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, color: '#64748B' }}>MMR Diversity Lambda</span>}
                  value={engineConfig.diversityReranking?.defaultMmrLambda ?? '—'}
                  valueStyle={{ fontSize: 18, fontWeight: 700, color: '#7C3AED' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<span style={{ fontSize: 12, color: '#64748B' }}>Stability Floor / Fallback K</span>}
                  value={`${engineConfig.stability?.stabMissingPolicyFloor ?? '—'} / ${engineConfig.halfSaturation?.defaultFallbackK ?? '—'}`}
                  valueStyle={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}
                />
              </Col>
            </Row>

            {engineConfig.dynamicWeighting?.canonicalObjectiveWeights && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E0E7FF' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', marginBottom: 6 }}>
                  Trọng số chuẩn theo Objective (SM1 · SM2 · SM3 · SM4):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(engineConfig.dynamicWeighting.canonicalObjectiveWeights).map(([obj, arr]: [string, any]) => (
                    <Tag key={obj} color="geekblue" style={{ padding: '2px 8px', borderRadius: 6 }}>
                      <strong>{obj}:</strong> [{Array.isArray(arr) ? arr.join(', ') : String(arr)}]
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </Spin>

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
