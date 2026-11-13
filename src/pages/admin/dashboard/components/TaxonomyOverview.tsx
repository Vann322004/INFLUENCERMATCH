import { Card, Tag, Button, Empty } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'niches' | 'loading' | 'unavailable'>;

export default function TaxonomyOverview({ niches, loading, unavailable }: Props) {
  const navigate = useNavigate();
  return (
    <Card
      bordered={false}
      style={{ borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', height: '100%' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
            Danh mục ngành hàng (DM-06)
          </span>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(DATA_MANAGER_ROUTES.TAXONOMY)}
            style={{ fontSize: 12, padding: 0 }}
          >
            Quản lý Taxonomy <ArrowRightOutlined />
          </Button>
        </div>
      }
    >
      {niches.length > 0 ? (
        <div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
            Danh mục ngành hàng đang kích hoạt trong hệ thống (GET /data/niches):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {niches.map((niche) => (
              <Tag key={niche.id} color="blue" style={{ borderRadius: 6, padding: '3px 8px', fontSize: 12 }}>
                {niche.name}
              </Tag>
            ))}
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11.5, color: '#475569' }}>
            * Thống kê số lượng KOC theo ngành hàng đang chờ Backend hoàn thiện endpoint tổng hợp <code>GET /data/niches/stats</code>.
          </div>
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? 'Đang tải danh mục ngành hàng…' : unavailable.includes(5) ? 'Không tải được danh mục ngành hàng. Làm mới để thử lại.' : 'Chưa có ngành hàng trong danh mục.'} />
      )}
    </Card>
  );
}
