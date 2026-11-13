import { Card, Tag, Button, Space, Typography } from 'antd';
import { ReloadOutlined, LockOutlined } from '@ant-design/icons';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';

const { Title, Text } = Typography;

interface Props { config: RecommendationConfigResponseDto; loading: boolean; fetchConfig: () => Promise<void>; }

export default function RecommendationConfigHeader({ config: currentConfig, loading, fetchConfig }: Props) {
  return <>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <Title level={4} style={{ color: '#0F172A', margin: 0, fontWeight: 700, fontSize: 20 }}>
          Cấu hình thuật toán gợi ý Four-Memory
        </Title>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, display: 'block' }}>
          Tra cứu các tham số chuẩn hóa dữ liệu, chính sách trọng số và quy tắc xếp hạng của hệ thống.
        </Text>
      </div>

      <Space wrap>
        <Button
          type="default"
          icon={<ReloadOutlined spin={loading} />}
          onClick={fetchConfig}
          loading={loading}
          style={{ borderRadius: 10, fontWeight: 600, height: 36, borderColor: '#EEF0F6' }}
        >
          Làm mới dữ liệu
        </Button>
      </Space>
    </div>

    {/* Status Bar */}
    <Card
      bordered={false}
      style={{
        borderRadius: 14,
        marginBottom: 20,
        background: '#FFFFFF',
        border: '1px solid #EEF0F6',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
      }}
      styles={{ body: { padding: '14px 20px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <Space wrap size={[8, 8]}>
          <span style={{ fontSize: 12.5, color: '#64748B' }}>Phiên bản hiệu chuẩn:</span>
          <Tag style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: 600, borderRadius: 6 }}>
            {currentConfig.calibrationVersion || 'v1.0-mvp'}
          </Tag>
          <Tag style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: 600, borderRadius: 6 }}>
            {currentConfig.engineVersion || 'Four-Memory TOPSIS Engine v1.0'}
          </Tag>
          <Tag icon={<LockOutlined />} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontWeight: 600, borderRadius: 6 }}>
            Chế độ chỉ đọc (Read-Only)
          </Tag>
        </Space>

        <Text style={{ fontSize: 12, color: '#64748B' }}>
          API: <code>GET /admin/recommendation-config</code>
        </Text>
      </div>
    </Card>
  </>;
}
