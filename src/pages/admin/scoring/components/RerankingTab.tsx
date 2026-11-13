import { Row, Col } from 'antd';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';
import { percentLabel, textLabel } from '../configDisplay';

export default function RerankingTab({ config }: { config: RecommendationConfigResponseDto }) {
  const diversity = config.diversityReranking;
  const status = diversity?.intraBucketMmrStatus;
  return <section className="dm-config-tab-panel">
    <h2>Đa dạng hóa danh sách gợi ý</h2>
    <p className="dm-config-muted">MMR cân bằng độ phù hợp và độ đa dạng của danh sách. Trạng thái dưới đây lấy từ cấu hình hệ thống.</p>
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12}><div className="dm-config-stat"><span>Trạng thái MMR</span><strong>{status === 'DISABLED_IN_MVP' ? 'Chưa kích hoạt' : textLabel(status)}</strong></div></Col>
      <Col xs={24} sm={12}><div className="dm-config-stat"><span>Hệ số ưu tiên độ phù hợp</span><strong>{percentLabel(diversity?.defaultMmrLambda)}</strong></div></Col>
    </Row>
    <details className="dm-config-details"><summary>Công thức MMR</summary>
      <div className="dm-formula" tabIndex={0} role="region" aria-label="Công thức MMR">{textLabel(diversity?.mmrFormula)}</div>
    </details>
  </section>;
}
