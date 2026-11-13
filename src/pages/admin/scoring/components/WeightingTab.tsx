import { Row, Col, Card, Tag, Alert, Table, Statistic, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';

const { Text } = Typography;

export default function WeightingTab({ config: currentConfig }: { config: RecommendationConfigResponseDto }) {
  const objectiveWeights = currentConfig.dynamicWeighting?.canonicalObjectiveWeights || {};

  const objectiveDescriptions: Record<string, { desc: string; focus: string }> = {
    AWARENESS: {
      desc: 'Tăng tối đa độ nhận diện thương hiệu và tiếp cận người xem mới',
      focus: 'M3 Semantic Fit (40%) và M2 Performance (35%) được ưu tiên cao nhất',
    },
    ENGAGEMENT: {
      desc: 'Tối ưu tương tác sâu (bình luận, chia sẻ, lưu bài đăng)',
      focus: 'Cân bằng giữa M2 Performance (35%) và M3 Semantic Fit (35%)',
    },
    TRAFFIC: {
      desc: 'Thúc đẩy lượt nhấp và lưu lượng truy cập tới kênh/sàn',
      focus: 'M2 Public Performance (35%) và M3 Semantic Fit (30%) dẫn dắt',
    },
    CONVERSION: {
      desc: 'Chuyển đổi mua hàng, tạo doanh thu và bảo đảm an toàn cam kết',
      focus: 'M1 Historical Creator Reputation (40%) chiếm tỷ trọng cao nhất; M3 Semantic (30%)',
    },
  };

  const objectiveTableData = Object.entries(objectiveWeights).map(([obj, weights]) => {
    const meta = objectiveDescriptions[obj] || { desc: '', focus: '' };
    const w = Array.isArray(weights) ? weights : [0, 0, 0, 0];
    return {
      key: obj,
      objective: obj,
      meta,
      m1: (w[0] * 100).toFixed(0) + '%',
      m2: (w[1] * 100).toFixed(0) + '%',
      m3: (w[2] * 100).toFixed(0) + '%',
      m4: (w[3] * 100).toFixed(0) + '%',
      rawWeights: w,
    };
  });

  const objectiveColumns: TableColumnsType<typeof objectiveTableData[0]> = [
    {
      title: 'Mục tiêu chiến dịch (Objective)',
      dataIndex: 'objective',
      key: 'objective',
      width: 200,
      render: (obj: string, record) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>{obj}</span>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{record.meta.desc}</div>
        </div>
      ),
    },
    {
      title: 'M1 (Uy tín lịch sử)',
      dataIndex: 'm1',
      key: 'm1',
      align: 'center',
      render: (val: string, record) => (
        <span style={{ fontWeight: record.objective === 'CONVERSION' ? 800 : 500, color: '#0F172A', fontSize: 13.5 }}>
          {val} {record.objective === 'CONVERSION' && <Tag style={{ fontSize: 10, marginLeft: 4, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A' }}>Cao nhất</Tag>}
        </span>
      ),
    },
    {
      title: 'M2 (Hiệu suất công khai)',
      dataIndex: 'm2',
      key: 'm2',
      align: 'center',
      render: (val: string) => <span style={{ color: '#0F172A', fontSize: 13.5 }}>{val}</span>,
    },
    {
      title: 'M3 (Độ khớp ngữ nghĩa)',
      dataIndex: 'm3',
      key: 'm3',
      align: 'center',
      render: (val: string, record) => (
        <span style={{ fontWeight: record.objective === 'AWARENESS' ? 800 : 500, color: '#0F172A', fontSize: 13.5 }}>
          {val} {record.objective === 'AWARENESS' && <Tag style={{ fontSize: 10, marginLeft: 4, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A' }}>Cao nhất</Tag>}
        </span>
      ),
    },
    {
      title: 'M4 (Gu thương hiệu)',
      dataIndex: 'm4',
      key: 'm4',
      align: 'center',
      render: (val: string) => <span style={{ color: '#0F172A', fontSize: 13.5 }}>{val}</span>,
    },
    {
      title: 'Đặc thù chiến lược & Thứ tự ưu tiên',
      key: 'focus',
      render: (_, record) => (
        <span style={{ fontSize: 12.5, color: '#475569' }}>
          {record.meta.focus}
        </span>
      ),
    },
  ];
  return (
    <div className="dm-config-tab-panel" style={{ padding: '20px' }}>
      {/* Stats Bar */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #EEF0F6' }} styles={{ body: { padding: '14px 16px' } }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748B' }}>Default Lambda (CRITIC Blend)</span>}
              value={currentConfig.dynamicWeighting?.defaultLambda ?? 0.30}
              precision={2}
              valueStyle={{ color: '#0F172A', fontWeight: 700, fontSize: 20 }}
              suffix={<span style={{ fontSize: 12, color: '#64748B' }}>(30% CRITIC)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #EEF0F6' }} styles={{ body: { padding: '14px 16px' } }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748B' }}>Min Pool Size for CRITIC</span>}
              value={currentConfig.dynamicWeighting?.minPoolSizeForCritic ?? 10}
              valueStyle={{ color: '#0F172A', fontWeight: 700, fontSize: 20 }}
              suffix={<span style={{ fontSize: 12, color: '#64748B' }}>ứng viên</span>}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card bordered={false} style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #EEF0F6' }} styles={{ body: { padding: '14px 16px' } }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Công thức hòa trộn (Blend Formula)</div>
            <div className="dm-formula" role="region" aria-label="Công thức thuật toán, có thể cuộn ngang" tabIndex={0} style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A', fontSize: 13, background: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
              {currentConfig.dynamicWeighting?.blendFormula || 'w_j = (1 - lambda) * b_g,j + lambda * q_j'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Objective Matrix Table */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            Ma trận 4 bộ trọng số chuẩn theo Objective (Business Prior: bg)
          </span>
          <Text style={{ fontSize: 12, color: '#64748B' }}>
            Nguồn: Single Source of Truth từ Engine
          </Text>
        </div>
        <Table
          scroll={{ x: 720 }}
          dataSource={objectiveTableData}
          columns={objectiveColumns}
          pagination={false}
          bordered
          size="middle"
        />
      </div>

      {/* Interpretation Policy Alert */}
      <Alert
        type="info"
        showIcon
        style={{ borderRadius: 10, marginBottom: 14, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
        message="Chính sách diễn giải trọng số mục tiêu (Interpretation Policy)"
        description={
          currentConfig.dynamicWeighting?.interpretationPolicy ||
          'Business Objective Weights thể hiện ưu tiên quyết định định sẵn trên 4 chiều bằng chứng [M1, M2, M3, M4]. Chúng không phải là dự báo trực tiếp kết quả traffic hay tỷ lệ chuyển đổi của một chiến dịch cụ thể.'
        }
      />

      {/* CRITIC Fallback Conditions Alert */}
      <Alert
        type="warning"
        showIcon
        style={{ borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}
        message="Quy tắc phân nhánh CRITIC & BUSINESS_FALLBACK"
        description={
          <div style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 4 }}>
            <div>
              <strong>Quy tắc kích hoạt:</strong> Số ứng viên trong Ranking Pool ≥ 10 chỉ là <em>điều kiện cần</em>. Hệ thống chuyển sang chế độ <code>BUSINESS_FALLBACK</code> (gán λ = 0, chỉ dùng 100% trọng số Business Prior) khi gặp bất kỳ điều kiện nào sau:
            </div>
            <ul style={{ paddingLeft: 18, margin: '6px 0 2px 0' }}>
              <li>Số lượng ứng viên đủ điều kiện tính điểm trong Ranking Pool &lt; 10.</li>
              <li>Tổng phương sai giữa các tiêu chí &lt; 10⁻⁶ (EPSILON).</li>
              <li>Số lượng tiêu chí có phương sai thông tin hữu hiệu &lt; 2.</li>
              <li>Tổng lượng thông tin xung đột C_total = 0 hoặc hệ số cấu hình λ = 0.</li>
            </ul>
            <div style={{ color: '#475569', fontStyle: 'italic', marginTop: 4 }}>
              * Ứng viên thiếu dữ liệu lịch sử (số bài đăng m &lt; 2) được áp sàn STAB = 0.0 và xếp vào Provisional Pool, không làm sai lệch ma trận hiệp phương sai của CRITIC.
            </div>
          </div>
        }
      />
    </div>
  );
}
