import { Row, Col, Card, Table } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';

export default function CalibrationTab({ config: currentConfig }: { config: RecommendationConfigResponseDto }) {
  const halfSat = currentConfig.halfSaturation || { erViewsK: {}, erFollowersK: {}, vrK: {}, defaultFallbackK: 0.05 };
  const kTableData = [
    {
      key: 'TIKTOK',
      platform: 'TikTok',
      er_views: halfSat.erViewsK?.TIKTOK ? (halfSat.erViewsK.TIKTOK * 100).toFixed(0) + '%' : '8%',
      er_followers: '— (Ưu tiên ERviews)',
      vr: halfSat.vrK?.TIKTOK ? (halfSat.vrK.TIKTOK * 100).toFixed(0) + '%' : '25%',
      notes: 'Thuật toán For You ưu tiên phân phối theo lượt xem video (ERviews = Total Engagements / Total Views)',
    },
    {
      key: 'INSTAGRAM',
      platform: 'Instagram',
      er_views: halfSat.erViewsK?.INSTAGRAM ? (halfSat.erViewsK.INSTAGRAM * 100).toFixed(0) + '%' : '5%',
      er_followers: halfSat.erFollowersK?.INSTAGRAM ? (halfSat.erFollowersK.INSTAGRAM * 100).toFixed(0) + '%' : '3%',
      vr: halfSat.vrK?.INSTAGRAM ? (halfSat.vrK.INSTAGRAM * 100).toFixed(0) + '%' : '20%',
      notes: 'Cân bằng giữa tỷ lệ tương tác theo follower và lượt xem Reels',
    },
    {
      key: 'FACEBOOK',
      platform: 'Facebook',
      er_views: halfSat.erViewsK?.FACEBOOK ? (halfSat.erViewsK.FACEBOOK * 100).toFixed(0) + '%' : '4%',
      er_followers: halfSat.erFollowersK?.FACEBOOK ? (halfSat.erFollowersK.FACEBOOK * 100).toFixed(0) + '%' : '2%',
      vr: halfSat.vrK?.FACEBOOK ? (halfSat.vrK.FACEBOOK * 100).toFixed(0) + '%' : '15%',
      notes: 'Thước đo dựa trên bài đăng Page/Profile và video Watch',
    },
  ];
  return (
    <div className="dm-config-tab-panel" style={{ padding: '20px' }}>
      {/* Formula banner */}
      <Card bordered={false} style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #EEF0F6', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
              Hàm chuẩn hóa bão hòa Michaelis-Menten (Phase 0 Normalization)
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
              Chuẩn hóa các chỉ số tương tác thô (Raw ER, VR) về thang điểm [0, 1] nhằm triệt tiêu hiệu ứng bùng nổ ngoại lai tuyến tính.
            </div>
          </div>
          <div className="dm-formula" role="region" aria-label="Công thức thuật toán, có thể cuộn ngang" tabIndex={0} style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, background: '#FFFFFF', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', color: '#0F172A' }}>
            f(x) = x / (x + K)
          </div>
        </div>
      </Card>

      {/* Half-Saturation K Table */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 8 }}>
          Hằng số nửa bão hòa (Half-Saturation Constant K) theo nền tảng
        </div>
        <Table
          scroll={{ x: 760 }}
          dataSource={kTableData}
          columns={[
            {
              title: 'Nền tảng',
              dataIndex: 'platform',
              key: 'platform',
              width: 140,
              render: (plat: string) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{plat}</span>,
            },
            {
              title: 'K (ERviews)',
              dataIndex: 'er_views',
              key: 'er_views',
              align: 'center',
              render: (v: string) => <strong>{v}</strong>,
            },
            {
              title: 'K (ERfollowers)',
              dataIndex: 'er_followers',
              key: 'er_followers',
              align: 'center',
              render: (v: string) => <span style={{ color: '#475569' }}>{v}</span>,
            },
            {
              title: 'K (View Rate - VR)',
              dataIndex: 'vr',
              key: 'vr',
              align: 'center',
              render: (v: string) => <strong>{v}</strong>,
            },
            {
              title: 'Nguyên lý hiệu chuẩn nền tảng',
              dataIndex: 'notes',
              key: 'notes',
              render: (n: string) => <span style={{ fontSize: 12, color: '#475569' }}>{n}</span>,
            },
          ]}
          pagination={false}
          bordered
          size="middle"
        />
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, fontStyle: 'italic' }}>
          * Hằng số Fallback mặc định khi thiếu cấu hình nền tảng: <strong>K = {halfSat.defaultFallbackK || 0.05} (5%)</strong>.
        </div>
      </div>

      {/* Outlier Sanity & Stability Policy */}
      <Row gutter={[14, 14]}>
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{ background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A', height: '100%' }}
            styles={{ body: { padding: '16px 18px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <WarningOutlined style={{ color: '#D97706', fontSize: 16 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#92400E' }}>
                Chính sách lọc dị thường cực trị (Sanity Guardrail)
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#78350F', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Toán tử kiểm tra:</strong> <code>er &gt; 10.0</code> (tương đương <strong>ER &gt; 1000%</strong>).
              </p>
              <p style={{ margin: 0 }}>
                <strong>Diễn giải nghiệp vụ:</strong> Đây là ngưỡng chốt chặn bảo vệ kỹ thuật để phát hiện dữ liệu lỗi hoặc số liệu crawler bị sai lệch; <em>không đồng nghĩa với việc xác nhận KOC có hành vi gian lận (Fraud)</em>.
              </p>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', height: '100%' }}
            styles={{ body: { padding: '16px 18px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>
                Chính sách độ ổn định (Stability Missing Floor)
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Sàn bảo thủ:</strong> <code>STAB = 0.00</code> khi số bài đăng của ứng viên <code>m &lt; 2</code>.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Diễn giải nghiệp vụ:</strong> Khi không đủ tối thiểu 2 bài đăng để đo lường độ phân tán phương sai, hệ thống gán sàn STAB bằng 0 để bảo toàn tính bảo thủ trong chấm điểm, tránh thổi phồng năng lực KOC mới.
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
