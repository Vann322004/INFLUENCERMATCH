import { Card, Button, Result, Spin, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props { hasAccess: boolean; config: unknown; loading: boolean; error: string | null; fetchConfig: () => Promise<void>; }

export default function RecommendationConfigState({ hasAccess, config, loading, error, fetchConfig }: Props) {
  if (!hasAccess) {
    return (
      <div className="dm-config-state" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <Result
          status="403"
          title="403 - Quyền truy cập bị từ chối"
          subTitle="Chỉ tài khoản DATA_MANAGER có quyền MANAGE_RECOMMENDATION_CONFIG được tra cứu cấu hình này."
        />
      </div>
    );
  }

  // ── P0 Error State: Hiển thị lỗi rõ ràng và nút Retry, không che giấu lỗi bằng mock ──
  if (error && !loading && !config) {
    return (
      <div className="dm-config-state" style={{ maxWidth: 1200, margin: '40px auto', padding: '0 24px' }}>
        <Card
          bordered={false}
          style={{
            borderRadius: 14,
            border: '1px solid #FEE2E2',
            background: '#FFFFFF',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          }}
          styles={{ body: { padding: '40px 24px', textAlign: 'center' } }}
        >
          <Result
            status="error"
            title="Không thể tải cấu hình thuật toán từ Backend"
            subTitle={
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  Màn hình DM-04 hoạt động ở chế độ Single Source of Truth, không sử dụng dữ liệu giả lập dự phòng khi kết nối API thất bại.
                </Text>
                <div style={{ background: '#FEF2F2', padding: '8px 16px', borderRadius: 8, display: 'inline-block', color: '#991B1B', fontFamily: 'monospace', fontSize: 13 }}>
                  Lỗi: {error}
                </div>
              </div>
            }
            extra={[
              <Button
                key="retry"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchConfig}
                style={{
                  background: '#5B5BF0',
                  borderRadius: 10,
                  height: 38,
                  fontWeight: 600,
                }}
              >
                Thử lại (Retry)
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // ── Loading Spinner State ─────────────────────────────────────
  if (loading && !config) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Spin size="large" tip="Đang truy xuất siêu tham số từ Recommendation Engine..." />
      </div>
    );
  }

  return null;
}
