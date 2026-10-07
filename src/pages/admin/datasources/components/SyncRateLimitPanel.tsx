import React, { useState } from 'react';
import { Card, Row, Col, Progress, Table, Button, Slider, InputNumber, Alert, Space, Typography, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { DataConnector } from '../../../../mock/adminData';

const { Text, Title } = Typography;

interface Props {
  connectors: DataConnector[];
  onUpdateConnector: (updated: DataConnector) => void;
}

export default function SyncRateLimitPanel({ connectors, onUpdateConnector }: Props) {
  const [testingId, setTestingId] = useState<string | null>(null);

  const totalSuccess = connectors.reduce((acc, c) => acc + c.successCount, 0);
  const totalFail = connectors.reduce((acc, c) => acc + c.failCount, 0);
  const totalReq = totalSuccess + totalFail;
  const overallSuccessRate = totalReq > 0 ? ((totalSuccess / totalReq) * 100).toFixed(1) : '100';

  const handleTestConnection = async (id: string, name: string) => {
    setTestingId(id);
    await new Promise(r => setTimeout(r, 1200));
    setTestingId(null);
    message.success(`Kiểm tra ping tới API [${name}] thành công! Phản hồi 142ms.`);
  };

  const handleRateLimitChange = (id: string, newRate: number) => {
    const target = connectors.find(c => c.id === id);
    if (target) {
      onUpdateConnector({ ...target, rateLimit: newRate });
    }
  };

  const columns: TableColumnsType<DataConnector> = [
    {
      title: 'Connector',
      key: 'name',
      render: (_, r) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0F172A' }}>{r.name}</span>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.platform}</div>
        </div>
      ),
    },
    {
      title: 'Success / Fail',
      key: 'stats',
      render: (_, r) => {
        const sum = r.successCount + r.failCount;
        const rate = sum > 0 ? Math.round((r.successCount / sum) * 100) : 100;
        return (
          <div style={{ minWidth: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span style={{ color: '#10B981', fontWeight: 600 }}>{r.successCount.toLocaleString()}</span>
              <span style={{ color: '#EF4444', fontWeight: 600 }}>{r.failCount.toLocaleString()}</span>
            </div>
            <Progress percent={rate} size="small" strokeColor={rate > 90 ? '#10B981' : '#EF4444'} showInfo={false} />
          </div>
        );
      },
    },
    {
      title: 'Rate-Limit (req/min)',
      key: 'rateLimit',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
          <Slider
            min={10}
            max={500}
            step={10}
            value={r.rateLimit}
            onChange={(val) => handleRateLimitChange(r.id, val)}
            style={{ flex: 1 }}
          />
          <InputNumber
            min={10}
            max={500}
            value={r.rateLimit}
            onChange={(val) => val && handleRateLimitChange(r.id, val)}
            style={{ width: 70 }}
          />
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<ExperimentOutlined />}
            loading={testingId === r.id}
            onClick={() => handleTestConnection(r.id, r.name)}
          >
            Test Ping
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>TỔNG REQUESTS HÔM NAY</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
              {totalReq.toLocaleString()}
            </div>
            <div style={{ color: '#10B981', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
              ✓ Đạt 94.2% quota tối đa cho phép
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>TỶ LỆ THÀNH CÔNG CHUNG</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {overallSuccessRate}%
            </div>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
              Thành công: <strong>{totalSuccess.toLocaleString()}</strong> | Lỗi: <strong style={{ color: '#EF4444' }}>{totalFail.toLocaleString()}</strong>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>TÌNH TRẠNG RATE-LIMIT</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
              Ổn định
            </div>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
              Không có nguồn nào bị throttle trong 24h qua
            </div>
          </Card>
        </Col>
      </Row>

      {/* Info alert */}
      <Alert
        message="Quản lý băng thông & điều tiết request"
        description="Khi hệ thống đạt 80% ngưỡng rate-limit của nhà cung cấp, cơ chế backoff lũy thừa (Exponential Backoff) sẽ tự động kích hoạt để tránh bị khóa API key."
        type="info"
        showIcon
        style={{ borderRadius: 10 }}
      />

      {/* Detail Table */}
      <Card
        bordered={false}
        title={<span style={{ fontWeight: 700, fontSize: 15 }}>Cấu hình ngưỡng giới hạn theo API</span>}
        extra={
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => message.success('Đã làm mới thông số rate-limit')}
          >
            Làm mới bộ đếm
          </Button>
        }
        style={{ borderRadius: 14, border: '1px solid #EEF0F6' }}
      >
        <Table
          columns={columns}
          dataSource={connectors}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
