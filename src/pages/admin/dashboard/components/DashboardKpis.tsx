import { Row, Col, Card, Tag, Skeleton } from 'antd';
import { SyncOutlined, UserOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';
import KpiCard, { type KpiCardProps } from './KpiCard';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'loading' | 'unavailable' | 'totalCandidates' | 'ingestedCount' | 'uningestedCount' | 'rateLimit429' | 'masterCreatorsCount' | 'claimedChannelsCount' | 'pendingClaimsCount' | 'oldestWaitTime' | 'acceptedKolKoc' | 'rejectedCount' | 'reviewPending'>;

export default function DashboardKpis({ loading, unavailable, totalCandidates, ingestedCount, uningestedCount, rateLimit429, masterCreatorsCount, claimedChannelsCount, pendingClaimsCount, oldestWaitTime, acceptedKolKoc, rejectedCount, reviewPending }: Props) {
  const kpiCards: KpiCardProps[] = [
    {
      icon: <SyncOutlined />,
      title: 'Tiến trình thu thập (DM-05)',
      value: ingestedCount > 0 ? ingestedCount.toLocaleString('vi-VN') : '0',
      unit: totalCandidates > 0 ? `/ ${totalCandidates.toLocaleString('vi-VN')} ứng viên` : 'ứng viên',
      badge: totalCandidates > 0 ? (
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>
          {((ingestedCount / totalCandidates) * 100).toFixed(1)}% đã nạp
        </Tag>
      ) : undefined,
      subText: (
        <div>
          <div>Đã nạp vào DB: <strong>{ingestedCount}</strong> • Chưa nạp/Chờ: <strong>{uningestedCount}</strong></div>
          <div style={{ color: rateLimit429 > 0 ? '#DC2626' : '#64748B', marginTop: 2 }}>
            HTTP 429 Rate Limit: <strong>{rateLimit429}</strong>
          </div>
        </div>
      ),
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      icon: <UserOutlined />,
      title: 'Định danh Master KOC (DM-01)',
      value: masterCreatorsCount > 0 ? masterCreatorsCount.toLocaleString('vi-VN') : '0',
      unit: 'hồ sơ Master',
      subText: (
        <div>
          <div>Kênh đã liên kết (Claimed): <strong>{unavailable.includes(6) ? 'Chưa tải được' : claimedChannelsCount}</strong></div>
          <div style={{ color: '#475569', marginTop: 2, fontSize: 11 }}>
            Quy tắc: <em>N(Master) ≠ N(Kênh)</em> • 1 Master có thể có nhiều kênh
          </div>
        </div>
      ),
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: 'Đơn nhận kênh chờ duyệt (DM-02)',
      value: pendingClaimsCount,
      unit: 'đơn chờ thẩm định',
      badge: pendingClaimsCount > 0 ? (
        <Tag color="warning" style={{ borderRadius: 6, fontWeight: 700 }}>
          {oldestWaitTime ? `Chờ tối đa ${oldestWaitTime}` : 'Cần xử lý'}
        </Tag>
      ) : (
        <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>0 tồn đọng</Tag>
      ),
      subText: (
        <div>
          <div>Đơn chờ thẩm định thủ công: <strong>{pendingClaimsCount}</strong></div>
          <div style={{ color: '#475569', marginTop: 2, fontSize: 11 }}>
            Xác minh quyền quản trị kênh, không đồng nghĩa xác nhận uy tín
          </div>
        </div>
      ),
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      icon: <CheckCircleOutlined />,
      title: 'Kiểm định Staging (DM-03)',
      value: acceptedKolKoc > 0 ? acceptedKolKoc.toLocaleString('vi-VN') : '0',
      unit: 'đạt KOC/KOL',
      subText: (
        <div>
          <div>Loại (Spam/Brand): <strong>{rejectedCount}</strong> • Chờ duyệt: <strong>{reviewPending}</strong></div>
          <div style={{ color: '#475569', marginTop: 2, fontSize: 11 }}>
            ACCEPTED xác nhận là KOC/KOL; chưa đại diện độ sẵn sàng gợi ý
          </div>
        </div>
      ),
      color: '#7C3AED',
      bg: '#FAF5FF',
    },
  ];
  return (
    <Row className="dm-kpi-grid" gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {kpiCards.map((card, i) => (
        <Col xs={24} sm={12} xl={6} key={i}>
          {loading ? <Card><Skeleton active paragraph={{ rows: 3 }} /></Card> :
            <KpiCard {...card} {...(unavailable.includes([0, 4, 1, 0][i]) ? {
              value: '—', unit: undefined, badge: <Tag color="warning">Chưa tải được</Tag>,
              subText: 'Nguồn dữ liệu chưa sẵn sàng. Làm mới để thử lại.',
            } : {})} />}
        </Col>
      ))}
    </Row>
  );
}
