import React from 'react';
import { Drawer, Button, Row, Col, Card, Avatar, Descriptions } from 'antd';
import { EyeOutlined, DisconnectOutlined, SwapOutlined } from '@ant-design/icons';
import type { IdentityConflictItem } from '../../types';

interface CompareConflictDrawerProps {
  open: boolean;
  selectedConflict: IdentityConflictItem | null;
  onClose: () => void;
  onResolveSeparate: (conflict: IdentityConflictItem) => void;
  onOpenMerge: (conflict: IdentityConflictItem) => void;
}

export const CompareConflictDrawer: React.FC<CompareConflictDrawerProps> = ({
  open,
  selectedConflict,
  onClose,
  onResolveSeparate,
  onOpenMerge,
}) => {
  if (!selectedConflict) return null;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EyeOutlined style={{ color: '#2563EB' }} />
          <span style={{ fontWeight: 800 }}>Đối chiếu Chi tiết Hai Hồ sơ Xung đột</span>
        </div>
      }
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button danger icon={<DisconnectOutlined />} onClick={() => onResolveSeparate(selectedConflict)}>
            Xác nhận là 2 người khác nhau
          </Button>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => onOpenMerge(selectedConflict)}
            style={{ background: '#2563EB', fontWeight: 700, borderRadius: 6 }}
          >
            Tiến hành Hợp nhất
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Top Match Score Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
            padding: '16px 20px',
            borderRadius: 12,
            border: '1px solid #BFDBFE',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1E40AF' }}>
              {selectedConflict.conflictLabel}
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>
              {Math.round(selectedConflict.matchScore * 100)}% Match
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
            {selectedConflict.detectedReason}
          </div>
        </div>

        {/* Side-by-side Profiles */}
        <Row gutter={16}>
          {/* Profile A */}
          <Col span={12}>
            <Card
              title={
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Hồ sơ A ({selectedConflict.profileA.platform.toUpperCase()})
                </span>
              }
              size="small"
              bordered
              style={{ borderRadius: 10, borderColor: '#CBD5E1' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <Avatar size={64} src={selectedConflict.profileA.avatarUrl} style={{ border: '2px solid #E2E8F0' }} />
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginTop: 8 }}>
                  {selectedConflict.profileA.displayName}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>@{selectedConflict.profileA.userName}</div>
              </div>

              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Followers">
                  <strong>{(selectedConflict.profileA.followers / 1000).toLocaleString()}K</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Engagement Rate">
                  {(selectedConflict.profileA.engagementRate * 100).toFixed(1)}%
                </Descriptions.Item>
                <Descriptions.Item label="Ngành">
                  {selectedConflict.profileA.niche}
                </Descriptions.Item>
                <Descriptions.Item label="Bio Contact">
                  {selectedConflict.profileA.bioContact || 'Chưa có'}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 12, background: '#F8FAFC', padding: '10px', borderRadius: 8, fontSize: 12, color: '#475569' }}>
                <strong>Mô tả Bio:</strong>
                <div style={{ marginTop: 4 }}>{selectedConflict.profileA.bioSummary}</div>
              </div>
            </Card>
          </Col>

          {/* Profile B */}
          <Col span={12}>
            <Card
              title={
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Hồ sơ B ({selectedConflict.profileB.platform.toUpperCase()})
                </span>
              }
              size="small"
              bordered
              style={{ borderRadius: 10, borderColor: '#CBD5E1' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <Avatar size={64} src={selectedConflict.profileB.avatarUrl} style={{ border: '2px solid #E2E8F0' }} />
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginTop: 8 }}>
                  {selectedConflict.profileB.displayName}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>@{selectedConflict.profileB.userName}</div>
              </div>

              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Followers">
                  <strong>{(selectedConflict.profileB.followers / 1000).toLocaleString()}K</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Engagement Rate">
                  {(selectedConflict.profileB.engagementRate * 100).toFixed(1)}%
                </Descriptions.Item>
                <Descriptions.Item label="Ngành">
                  {selectedConflict.profileB.niche}
                </Descriptions.Item>
                <Descriptions.Item label="Bio Contact">
                  {selectedConflict.profileB.bioContact || 'Chưa có'}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 12, background: '#F8FAFC', padding: '10px', borderRadius: 8, fontSize: 12, color: '#475569' }}>
                <strong>Mô tả Bio:</strong>
                <div style={{ marginTop: 4 }}>{selectedConflict.profileB.bioSummary}</div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Drawer>
  );
};

export default CompareConflictDrawer;

