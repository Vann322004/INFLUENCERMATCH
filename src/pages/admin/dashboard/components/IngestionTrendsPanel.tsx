import { Card, Tag, Button } from 'antd';
import { ArrowRightOutlined, CompassOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';

export default function IngestionTrendsPanel() {
  const navigate = useNavigate();
  return (
    <Card
      bordered={false}
      style={{ borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', height: '100%' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
            Xu hướng thu thập dữ liệu đa nền tảng (DM-05)
          </span>
          <Tag color="default" style={{ borderRadius: 8, fontSize: 11 }}>
            Khuyến nghị API Backend
          </Tag>
        </div>
      }
    >
      <div style={{ padding: '20px 10px', textAlign: 'center' }}>
        <CompassOutlined style={{ fontSize: 36, color: '#94A3B8', marginBottom: 12 }} />
        <div style={{ fontWeight: 700, fontSize: 14, color: '#334155', marginBottom: 6 }}>
          Chưa có API tổng hợp chuỗi thời gian (Time-series Aggregation API)
        </div>
        <div style={{ fontSize: 12.5, color: '#64748B', maxWidth: 540, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
          Đã loại bỏ dữ liệu biểu đồ giả lập trước đây để đảm bảo tính trung thực kỹ thuật. Để hiển thị biểu đồ xu hướng 7 ngày / 30 ngày, Backend cần bổ sung endpoint tổng hợp dữ liệu crawler.
        </div>

        <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, display: 'inline-block', border: '1px solid #E2E8F0', fontSize: 12, fontFamily: 'monospace', color: '#1E293B', marginBottom: 16 }}>
          Đề xuất API: GET /data/crawler/trends?days=7&amp;split=new_vs_refreshed
        </div>

        <div>
          <Button
            type="primary"
            ghost
            size="small"
            onClick={() => navigate(DATA_MANAGER_ROUTES.JOBS)}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            Xem chi tiết tiến trình cào tại Quản lý Jobs <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </Card>
  );
}
