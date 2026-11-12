import React, { useState, useEffect } from 'react';
import { Drawer, Button, Row, Col, Card, Avatar, Tag, Descriptions, Radio, Popconfirm } from 'antd';
import { EyeOutlined, DisconnectOutlined, SwapOutlined, CheckCircleFilled } from '@ant-design/icons';
import type { IdentityConflictItem } from '../../types';
import { PLATFORM_COLOR_MAP } from '../../types';

interface CompareConflictDrawerProps {
  open: boolean;
  selectedConflict: IdentityConflictItem | null;
  onClose: () => void;
  onResolveSeparate: (conflict: IdentityConflictItem) => Promise<void>;
  onConfirmMerge: (conflict: IdentityConflictItem, masterProfileId: string) => Promise<void>;
}

export const CompareConflictDrawer: React.FC<CompareConflictDrawerProps> = ({
  open,
  selectedConflict,
  onClose,
  onResolveSeparate,
  onConfirmMerge,
}) => {
  const [masterProfileId, setMasterProfileId] = useState<string>('');
  const [merging, setMerging] = useState(false);
  const [separating, setSeparating] = useState(false);

  useEffect(() => {
    if (selectedConflict) {
      // Default master is the one with more followers
      const defaultMaster =
        selectedConflict.profileA.followers >= selectedConflict.profileB.followers
          ? selectedConflict.profileA.id
          : selectedConflict.profileB.id;
      setMasterProfileId(defaultMaster);
    }
  }, [selectedConflict]);

  if (!selectedConflict) return null;

  const handleMerge = async () => {
    setMerging(true);
    try {
      await onConfirmMerge(selectedConflict, masterProfileId);
      onClose();
    } finally {
      setMerging(false);
    }
  };

  const handleSeparate = async () => {
    setSeparating(true);
    try {
      await onResolveSeparate(selectedConflict);
      onClose();
    } finally {
      setSeparating(false);
    }
  };

  const totalFollowers = selectedConflict.profileA.followers + selectedConflict.profileB.followers;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EyeOutlined style={{ color: '#2563EB', fontSize: 18 }} />
          <span style={{ fontWeight: 800, fontSize: 16 }}>Đối chiếu & Hợp nhất Thực thể Creator</span>
        </div>
      }
      open={open}
      onClose={onClose}
      width={760}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <Popconfirm
            title="Xác nhận là 2 Creator riêng biệt?"
            description="Hệ thống sẽ giữ riêng biệt 2 hồ sơ này và không cảnh báo xung đột nữa."
            onConfirm={handleSeparate}
            okText="Xác nhận tách"
            cancelText="Hủy"
          >
            <Button danger icon={<DisconnectOutlined />} loading={separating} style={{ borderRadius: 8 }}>
              Xác nhận là 2 người khác nhau
            </Button>
          </Popconfirm>

          <Button
            type="primary"
            icon={<SwapOutlined />}
            loading={merging}
            onClick={handleMerge}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: 'none',
              fontWeight: 700,
              borderRadius: 8,
              fontSize: 13,
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            }}
          >
            Xác nhận Hợp nhất Hồ sơ
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14.5, color: '#1E40AF' }}>
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

        {/* Side-by-side Profiles Comparison */}
        <Row gutter={16}>
          {/* Profile A */}
          <Col span={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Hồ sơ A</span>
                  <Tag color={PLATFORM_COLOR_MAP[selectedConflict.profileA.platform.toLowerCase()] || 'default'}>
                    {selectedConflict.profileA.platform.toUpperCase()}
                  </Tag>
                </div>
              }
              size="small"
              bordered
              style={{
                borderRadius: 10,
                borderColor: masterProfileId === selectedConflict.profileA.id ? '#2563EB' : '#E2E8F0',
                background: masterProfileId === selectedConflict.profileA.id ? '#F8FAFC' : '#FFFFFF',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <Avatar size={60} src={selectedConflict.profileA.avatarUrl} style={{ border: '2px solid #E2E8F0' }}>
                  {selectedConflict.profileA.displayName.charAt(0)}
                </Avatar>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginTop: 8 }}>
                  {selectedConflict.profileA.displayName}
                </div>
                <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>@{selectedConflict.profileA.userName}</div>
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
                <Descriptions.Item label="Liên hệ Bio">
                  {selectedConflict.profileA.bioContact || 'Chưa có'}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 12, background: '#F8FAFC', padding: '10px', borderRadius: 8, fontSize: 12, color: '#475569' }}>
                <strong>Bio:</strong>
                <div style={{ marginTop: 4, lineHeight: 1.4 }}>{selectedConflict.profileA.bioSummary}</div>
              </div>
            </Card>
          </Col>

          {/* Profile B */}
          <Col span={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Hồ sơ B</span>
                  <Tag color={PLATFORM_COLOR_MAP[selectedConflict.profileB.platform.toLowerCase()] || 'default'}>
                    {selectedConflict.profileB.platform.toUpperCase()}
                  </Tag>
                </div>
              }
              size="small"
              bordered
              style={{
                borderRadius: 10,
                borderColor: masterProfileId === selectedConflict.profileB.id ? '#2563EB' : '#E2E8F0',
                background: masterProfileId === selectedConflict.profileB.id ? '#F8FAFC' : '#FFFFFF',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <Avatar size={60} src={selectedConflict.profileB.avatarUrl} style={{ border: '2px solid #E2E8F0' }}>
                  {selectedConflict.profileB.displayName.charAt(0)}
                </Avatar>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginTop: 8 }}>
                  {selectedConflict.profileB.displayName}
                </div>
                <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>@{selectedConflict.profileB.userName}</div>
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
                <Descriptions.Item label="Liên hệ Bio">
                  {selectedConflict.profileB.bioContact || 'Chưa có'}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 12, background: '#F8FAFC', padding: '10px', borderRadius: 8, fontSize: 12, color: '#475569' }}>
                <strong>Bio:</strong>
                <div style={{ marginTop: 4, lineHeight: 1.4 }}>{selectedConflict.profileB.bioSummary}</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Master Profile Selection */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '16px',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
            Chọn hồ sơ chính đại diện (Primary Master Profile):
          </div>
          <Radio.Group
            value={masterProfileId}
            onChange={(e) => setMasterProfileId(e.target.value)}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <Radio
              value={selectedConflict.profileA.id}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: masterProfileId === selectedConflict.profileA.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: masterProfileId === selectedConflict.profileA.id ? '#EFF6FF' : '#FFFFFF',
                width: '100%',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, verticalAlign: 'middle' }}>
                <Avatar size={32} src={selectedConflict.profileA.avatarUrl} />
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedConflict.profileA.displayName}</span>
                <Tag color={PLATFORM_COLOR_MAP[selectedConflict.profileA.platform.toLowerCase()] || 'default'}>
                  {selectedConflict.profileA.platform.toUpperCase()}
                </Tag>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  ({(selectedConflict.profileA.followers / 1000).toLocaleString()}K followers)
                </span>
                {masterProfileId === selectedConflict.profileA.id && (
                  <CheckCircleFilled style={{ color: '#2563EB', marginLeft: 'auto' }} />
                )}
              </div>
            </Radio>

            <Radio
              value={selectedConflict.profileB.id}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: masterProfileId === selectedConflict.profileB.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: masterProfileId === selectedConflict.profileB.id ? '#EFF6FF' : '#FFFFFF',
                width: '100%',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, verticalAlign: 'middle' }}>
                <Avatar size={32} src={selectedConflict.profileB.avatarUrl} />
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedConflict.profileB.displayName}</span>
                <Tag color={PLATFORM_COLOR_MAP[selectedConflict.profileB.platform.toLowerCase()] || 'default'}>
                  {selectedConflict.profileB.platform.toUpperCase()}
                </Tag>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  ({(selectedConflict.profileB.followers / 1000).toLocaleString()}K followers)
                </span>
                {masterProfileId === selectedConflict.profileB.id && (
                  <CheckCircleFilled style={{ color: '#2563EB', marginLeft: 'auto' }} />
                )}
              </div>
            </Radio>
          </Radio.Group>
        </div>

        {/* Unified Entity Preview */}
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 8 }}>
            Xem trước thực thể Creator sau khi hợp nhất:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={46}
              src={
                masterProfileId === selectedConflict.profileA.id
                  ? selectedConflict.profileA.avatarUrl
                  : selectedConflict.profileB.avatarUrl
              }
              style={{ border: '2px solid #16A34A' }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                {masterProfileId === selectedConflict.profileA.id
                  ? selectedConflict.profileA.displayName
                  : selectedConflict.profileB.displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>
                  Liên kết: {selectedConflict.profileA.platform.toUpperCase()} + {selectedConflict.profileB.platform.toUpperCase()}
                </Tag>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#15803D' }}>
                  Tổng: {(totalFollowers / 1000000).toFixed(2)}M Followers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default CompareConflictDrawer;
