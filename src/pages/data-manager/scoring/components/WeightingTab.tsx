import { Row, Col, Table, Empty } from 'antd';
import type { TableColumnsType } from 'antd';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';
import { hasNumber, numberLabel, percentLabel, textLabel } from '../configDisplay';

const objectives: Record<string, string> = {
  AWARENESS: 'Nhận diện thương hiệu', ENGAGEMENT: 'Tương tác', TRAFFIC: 'Lưu lượng truy cập', CONVERSION: 'Chuyển đổi',
};

export default function WeightingTab({ config }: { config: RecommendationConfigResponseDto }) {
  const weighting = config.dynamicWeighting;
  const rows = Object.entries(weighting?.canonicalObjectiveWeights ?? {}).map(([objective, weights]) => ({
    key: objective, objective, weights: Array.isArray(weights) ? weights : [],
  }));
  const columns: TableColumnsType<typeof rows[number]> = [
    { title: 'Mục tiêu', dataIndex: 'objective', key: 'objective', width: 200,
      render: (objective: string) => <div><strong>{objectives[objective] || objective}</strong><div className="dm-config-muted">{objective}</div></div> },
    ...['M1 · Uy tín', 'M2 · Hiệu suất', 'M3 · Nội dung', 'M4 · Thương hiệu'].map((title, index) => ({
      title, key: String(index), align: 'center' as const, render: (_: unknown, row: typeof rows[number]) => percentLabel(row.weights[index]),
    })),
  ];
  return <section className="dm-config-tab-panel">
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12}><div className="dm-config-stat"><span>Tỷ lệ hòa trộn CRITIC</span><strong>{percentLabel(weighting?.defaultLambda)}</strong></div></Col>
      <Col xs={24} sm={12}><div className="dm-config-stat"><span>Quy mô mẫu tối thiểu</span><strong>{numberLabel(weighting?.minPoolSizeForCritic, 0)}{hasNumber(weighting?.minPoolSizeForCritic) ? ' ứng viên' : ''}</strong></div></Col>
    </Row>
    <h2>Trọng số theo mục tiêu</h2>
    {rows.length ? <Table columns={columns} dataSource={rows} pagination={false} scroll={{ x: 650 }} size="middle" /> :
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hệ thống chưa cung cấp ma trận trọng số" />}
    <details className="dm-config-details"><summary>Cách áp dụng trọng số</summary>
      <p>{textLabel(weighting?.interpretationPolicy)}</p>
      <h3>Công thức hòa trộn</h3><div className="dm-formula" tabIndex={0} role="region" aria-label="Công thức hòa trộn">{textLabel(weighting?.blendFormula)}</div>
      <h3>Điều kiện dùng trọng số cơ sở</h3><p>{textLabel(weighting?.fallbackMode)}</p>
    </details>
  </section>;
}
