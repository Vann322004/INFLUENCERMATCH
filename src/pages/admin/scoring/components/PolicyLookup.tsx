import { Row, Col, Select, InputNumber } from 'antd';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';
import { hasNumber, numberLabel, percentLabel } from '../configDisplay';

interface Props {
  config: RecommendationConfigResponseDto;
  selectedObjective: string;
  setSelectedObjective: (objective: string) => void;
  candidatePoolSize: number;
  setCandidatePoolSize: (size: number) => void;
}

const labels: Record<string, string> = {
  AWARENESS: 'Nhận diện thương hiệu', ENGAGEMENT: 'Tương tác', TRAFFIC: 'Lưu lượng truy cập', CONVERSION: 'Chuyển đổi',
};

export default function PolicyLookup({ config, selectedObjective, setSelectedObjective, candidatePoolSize, setCandidatePoolSize }: Props) {
  const weighting = config.dynamicWeighting;
  const weights = weighting?.canonicalObjectiveWeights?.[selectedObjective];
  const minimum = weighting?.minPoolSizeForCritic;
  const eligible = hasNumber(minimum) && candidatePoolSize >= minimum;
  const options = Object.keys(weighting?.canonicalObjectiveWeights ?? {}).map(objective => ({
    value: objective, label: objective + ' (' + (labels[objective] || objective) + ')',
  }));
  return <section className="dm-policy-lookup">
    <h2>Tra cứu cách áp dụng</h2>
    <p className="dm-config-muted">Chọn mục tiêu và nhập số ứng viên để xem quy tắc tương ứng. Các lựa chọn này không lưu và không thay đổi cấu hình hệ thống.</p>
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}><label htmlFor="policy-objective">Mục tiêu chiến dịch</label>
        <Select id="policy-objective" aria-label="Mục tiêu chiến dịch" value={options.some(option => option.value === selectedObjective) ? selectedObjective : undefined}
          onChange={setSelectedObjective} options={options} placeholder="Chọn mục tiêu" style={{ width: '100%' }} />
      </Col>
      <Col xs={24} md={12}><label htmlFor="policy-candidate-count">Số lượng ứng viên</label>
        <InputNumber id="policy-candidate-count" aria-label="Số lượng ứng viên" min={1} max={500} precision={0}
          value={candidatePoolSize} onChange={value => setCandidatePoolSize(value ?? 1)} style={{ width: '100%' }} />
      </Col>
    </Row>
    <Row gutter={[12, 12]} className="dm-policy-results">
      <Col xs={24} md={12}><div className="dm-config-policy"><h3>Trọng số theo mục tiêu đã chọn</h3>
        <div className="dm-policy-weights">{['M1', 'M2', 'M3', 'M4'].map((memory, index) => <div key={memory}><span>{memory}</span><strong>{percentLabel(weights?.[index])}</strong></div>)}</div>
      </div></Col>
      <Col xs={24} md={12}><div className="dm-config-policy"><h3>Quy tắc theo quy mô mẫu</h3>
        {!hasNumber(minimum) ? <p>Hệ thống chưa cung cấp ngưỡng kích hoạt CRITIC.</p> : eligible ? <>
          <strong>Điều kiện quy mô mẫu: ĐẠT ĐIỀU KIỆN CẦN</strong>
          <p>{candidatePoolSize} ứng viên đạt ngưỡng {minimum}. Engine còn kiểm tra độ biến thiên và lượng thông tin trước khi áp dụng CRITIC.</p>
          <p>Tỷ lệ CRITIC theo cấu hình: {percentLabel(weighting?.defaultLambda)}.</p>
        </> : <>
          <strong>Kích hoạt BUSINESS_FALLBACK</strong>
          <p>{candidatePoolSize} ứng viên thấp hơn ngưỡng {numberLabel(minimum, 0)}. Theo quy tắc quy mô mẫu, sử dụng trọng số cơ sở theo mục tiêu.</p>
        </>}
        <p className="dm-config-muted">Đây là giải thích chính sách, không phải kết quả chạy xếp hạng trên một tập ứng viên thực tế.</p>
      </div></Col>
    </Row>
  </section>;
}
