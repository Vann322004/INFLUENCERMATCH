import React from 'react';
import { Drawer, Descriptions, Tag, Row, Col, Card, Typography, Divider } from 'antd';
import {
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { AuditLog, AuditAction } from '../../../../mock/adminData';

const { Text } = Typography;

interface Props {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'blue',
  UPDATE: 'orange',
  DELETE: 'red',
  LOGIN:  'green',
  LOGOUT: 'default',
};

export default function AuditDetailDrawer({ log, open, onClose }: Props) {
  if (!log) return null;

  const color = ACTION_COLORS[log.action] || 'default';

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>Chi tiết Audit Log #{log.id}</span>
          <Tag color={color} style={{ fontWeight: 700, borderRadius: 6 }}>
            {log.action}
          </Tag>
        </div>
      }
      open={open}
      onClose={onClose}
      width={640}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Actor & Context Information */}
        <Card size="small" bordered={false} style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Người thực hiện (Actor)">
              <strong style={{ color: '#0F172A' }}>{log.actor}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Email">{log.actorEmail}</Descriptions.Item>
            <Descriptions.Item label="Thời gian">{log.timestamp}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ IP">{log.ip}</Descriptions.Item>
            <Descriptions.Item label="Tài nguyên (Resource)">
              <Tag color="purple">{log.resource}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Resource ID">
              <code>{log.resourceId}</code>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Diff Inspection */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 10 }}>
            Biến động dữ liệu (Payload Diff)
          </div>

          <Row gutter={16}>
            {/* Old Value */}
            <Col span={12}>
              <Card
                size="small"
                title={<span style={{ color: '#EF4444', fontWeight: 700 }}>Giá trị trước (Old Value)</span>}
                bordered={false}
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 10,
                }}
              >
                <pre
                  style={{
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: 12,
                    margin: 0,
                    color: '#991B1B',
                    maxHeight: 260,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : '(Không có dữ liệu cũ - CREATE)'}
                </pre>
              </Card>
            </Col>

            {/* New Value */}
            <Col span={12}>
              <Card
                size="small"
                title={<span style={{ color: '#10B981', fontWeight: 700 }}>Giá trị sau (New Value)</span>}
                bordered={false}
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 10,
                }}
              >
                <pre
                  style={{
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: 12,
                    margin: 0,
                    color: '#065F46',
                    maxHeight: 260,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {log.newValue ? JSON.stringify(log.newValue, null, 2) : '(Đã bị xóa - DELETE)'}
                </pre>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </Drawer>
  );
}
