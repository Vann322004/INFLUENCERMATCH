import { Row, Col, Card, Tag } from 'antd';

interface MemoryDimension {
  id: string;
  code: string;
  name: string;
  roleDescription: string;
  metrics: string;
  evidenceSource: string;
}

const MEMORY_DIMENSIONS: MemoryDimension[] = [
  {
    id: 'M1',
    code: 'SM1',
    name: 'Historical Creator Reputation',
    roleDescription: 'Uy tín lịch sử & độ tin cậy bàn giao chiến dịch',
    metrics: 'Tỷ lệ hoàn thành KPI, bàn giao đúng hạn, độ tin cậy cập nhật theo mô hình Bayesian',
    evidenceSource: 'Dữ liệu nội bộ từ các chiến dịch đã kiểm chứng trên hệ thống',
  },
  {
    id: 'M2',
    code: 'SM2',
    name: 'Public Performance Metrics',
    roleDescription: 'Chỉ số hiệu suất tương tác công khai đa nền tảng',
    metrics: 'ERviews, ERfollowers, tỷ lệ xem VR, độ ổn định STAB (sàn 0.0 khi < 2 bài)',
    evidenceSource: 'Dữ liệu crawler công khai sau khi qua chuẩn hóa Michaelis-Menten',
  },
  {
    id: 'M3',
    code: 'SM3',
    name: 'Semantic Fit',
    roleDescription: 'Độ phù hợp ngữ nghĩa nội dung video với Campaign Brief',
    metrics: 'Cosine Similarity giữa text embedding của video Creator và Brief chiến dịch',
    evidenceSource: 'Mô hình Vector Embedding phân tích ngữ nghĩa nội dung thực tế',
  },
  {
    id: 'M4',
    code: 'SM4',
    name: 'Brand Taste / Affinity',
    roleDescription: 'Độ phù hợp gu thương hiệu, ngành hàng & tệp khán giả',
    metrics: 'Độ khớp phân cấp ngành hàng (Taxonomy), nhân khẩu học và tiền sử liên kết',
    evidenceSource: 'Danh mục ngành hàng phân cấp, hồ sơ thương hiệu và lịch sử nhãn hàng',
  },
];

export default function FourMemoryOverview() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 12 }}>
        Tổng quan 4 chiều bằng chứng Four-Memory
      </div>

      <Row gutter={[14, 14]}>
        {MEMORY_DIMENSIONS.map((dim) => (
          <Col xs={24} sm={12} lg={6} key={dim.id}>
            <Card
              bordered={false}
              style={{
                height: '100%',
                borderRadius: 14,
                border: '1px solid #EEF0F6',
                background: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { padding: '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                  {dim.id}
                </span>
                <Tag style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, margin: 0, borderRadius: 4, fontSize: 11 }}>
                  {dim.code}
                </Tag>
              </div>

              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A', marginBottom: 6 }}>
                {dim.name}
              </div>

              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
                {dim.roleDescription}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F1F5F9', fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                <div style={{ marginBottom: 4 }}>
                  <strong style={{ color: '#334155' }}>Tiêu chí:</strong> {dim.metrics}
                </div>
                <div>
                  <strong style={{ color: '#334155' }}>Nguồn bằng chứng:</strong> {dim.evidenceSource}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
