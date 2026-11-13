import { Row, Col } from 'antd';

// Explanatory labels, not measured data or substitute configuration values.
const dimensions = [
  { code: 'M1', name: 'Uy tín lịch sử', description: 'Độ tin cậy từ các chiến dịch đã thực hiện.' },
  { code: 'M2', name: 'Hiệu suất công khai', description: 'Chỉ số tương tác và độ ổn định nội dung.' },
  { code: 'M3', name: 'Phù hợp nội dung', description: 'Mức độ phù hợp với yêu cầu chiến dịch.' },
  { code: 'M4', name: 'Phù hợp thương hiệu', description: 'Ngành hàng, tệp khán giả và gu thương hiệu.' },
];

export default function FourMemoryOverview() {
  return <section className="dm-memory-overview" aria-label="Bốn chiều đánh giá">
    <Row gutter={[12, 12]}>{dimensions.map(dimension => <Col xs={24} sm={12} lg={6} key={dimension.code}>
      <div className="dm-memory-item"><span className="dm-memory-code">{dimension.code}</span>
        <div><h2>{dimension.name}</h2><p>{dimension.description}</p></div>
      </div>
    </Col>)}</Row>
  </section>;
}
