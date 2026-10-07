import React, { useState } from 'react';
import { Card, Timeline, Tag, Button, Typography, Space } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ScoringVersion } from '../../../../mock/adminData';
import RollbackModal from './RollbackModal';

const { Text } = Typography;

interface Props {
  versions: ScoringVersion[];
  currentWeights: Record<string, number>;
  onRollback: (version: ScoringVersion, reason: string) => void;
}

export default function VersionHistoryTab({ versions, currentWeights, onRollback }: Props) {
  const [selectedVersion, setSelectedVersion] = useState<ScoringVersion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenRollback = (ver: ScoringVersion) => {
    setSelectedVersion(ver);
    setModalOpen(true);
  };

  const handleConfirm = (ver: ScoringVersion, reason: string) => {
    onRollback(ver, reason);
    setModalOpen(false);
  };

  return (
    <div>
      <Timeline
        mode="left"
        items={versions.map(ver => ({
          color: ver.isCurrent ? '#6366F1' : '#94A3B8',
          dot: ver.isCurrent ? <CheckCircleOutlined style={{ fontSize: 16, color: '#6366F1' }} /> : undefined,
          children: (
            <Card
              size="small"
              bordered={false}
              style={{
                borderRadius: 12,
                background: ver.isCurrent ? 'rgba(99, 102, 241, 0.04)' : '#F8FAFC',
                border: ver.isCurrent ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                      Phiên bản {ver.version}
                    </span>
                    {ver.isCurrent ? (
                      <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>
                        Đang áp dụng (Active)
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ borderRadius: 6 }}>
                        Đã lưu
                      </Tag>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span><ClockCircleOutlined /> {ver.savedAt}</span>
                    <span><UserOutlined /> {ver.savedBy}</span>
                  </div>
                </div>

                {!ver.isCurrent && (
                  <Button
                    size="small"
                    icon={<RollbackOutlined />}
                    onClick={() => handleOpenRollback(ver)}
                    style={{ borderRadius: 8, fontWeight: 600 }}
                  >
                    Khôi phục (Rollback)
                  </Button>
                )}
              </div>

              {/* Release Notes */}
              <div style={{ marginTop: 10, fontSize: 13, color: '#334155', background: '#FFFFFF', padding: '8px 12px', borderRadius: 8, border: '1px solid #EEF0F6' }}>
                <strong>Ghi chú:</strong> {ver.notes}
              </div>

              {/* Weight Tags */}
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(ver.weights).map(([k, v]) => (
                  <Tag key={k} style={{ borderRadius: 6, fontSize: 11, background: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                    <span style={{ textTransform: 'capitalize' }}>{k}</span>: <strong>{v}%</strong>
                  </Tag>
                ))}
              </div>
            </Card>
          ),
        }))}
      />

      <RollbackModal
        version={selectedVersion}
        currentWeights={currentWeights}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirmRollback={handleConfirm}
      />
    </div>
  );
}
