import { Row, Col } from 'antd';

// Explanatory labels, not measured data or substitute configuration values.
const dimensions = [
  {
    code: 'M1',
    name: 'Uy tín lịch sử',
    tech: 'Bayesian R · T · K',
    description: 'Tổng hợp đánh giá cuối (R), tỷ lệ đúng hạn (T) và mức đạt KPI (K) từ các hợp tác đã nghiệm thu.',
  },
  {
    code: 'M2',
    name: 'Hiệu suất công khai',
    tech: 'Velocity & Stability',
    description: 'Đo tốc độ tăng trưởng, tỷ lệ tương tác và độ ổn định hiệu suất nội dung công khai.',
  },
  {
    code: 'M3',
    name: 'Phù hợp nội dung',
    tech: 'Cosine Embedding',
    description: 'So khớp ngữ nghĩa giữa brief chiến dịch và lịch sử nội dung Creator bằng Vector Embedding.',
  },
  {
    code: 'M4',
    name: 'Phù hợp thương hiệu',
    tech: 'm4-evidence-v1',
    description: 'Học gu thương hiệu từ phản hồi/đánh giá hợp tác trước của Brand, kết hợp tiêu chí chiến dịch hiện tại.',
  },
];

export default function FourMemoryOverview() {
  return <section className="dm-memory-overview" aria-label="Bốn chiều đánh giá">
    <Row gutter={[12, 12]}>{dimensions.map(dimension => <Col xs={24} sm={12} lg={6} key={dimension.code}>
      <div className="dm-memory-item"><span className="dm-memory-code">{dimension.code}</span>
        <div>
          <div className="dm-memory-head">
            <h2>{dimension.name}</h2>
            <span className="dm-memory-tech">{dimension.tech}</span>
          </div>
          <p>{dimension.description}</p>
        </div>
      </div>
    </Col>)}</Row>
    <div className="dm-learning-flow">
      <strong>Vòng lặp Post-Campaign Learning:</strong> Hợp tác hoàn tất (Nghiệm thu + Đánh giá cuối) → Cập nhật bằng chứng <code>M1</code> (Bayesian Smoothing) &amp; hồ sơ sở thích Brand <code>M4</code> (<code>m4-evidence-v1</code>) → Tái xếp hạng lượt gợi ý tiếp theo qua <strong>TOPSIS</strong> &amp; đa dạng hóa <strong>MMR</strong>.
    </div>
  </section>;
}
