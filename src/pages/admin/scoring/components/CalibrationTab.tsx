import { Row, Col, Table, Empty } from 'antd';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';
import { numberLabel, percentLabel } from '../configDisplay';

const names: Record<string, string> = { TIKTOK: 'TikTok', INSTAGRAM: 'Instagram', FACEBOOK: 'Facebook' };

export default function CalibrationTab({ config }: { config: RecommendationConfigResponseDto }) {
  const saturation = config.halfSaturation;
  const platforms = [...new Set([
    ...Object.keys(saturation?.erViewsK ?? {}), ...Object.keys(saturation?.erFollowersK ?? {}), ...Object.keys(saturation?.vrK ?? {}),
  ])];
  const rows = platforms.map(platform => ({
    key: platform, platform: names[platform] || platform,
    views: saturation?.erViewsK?.[platform], followers: saturation?.erFollowersK?.[platform], vr: saturation?.vrK?.[platform],
  }));
  return <section className="dm-config-tab-panel">
    <h2>Chuẩn hóa chỉ số tương tác</h2>
    <p className="dm-config-muted">Các hằng số K dùng để đưa chỉ số tương tác về cùng thang đo. Dấu — là thông số chưa được cung cấp.</p>
    {rows.length ? <Table dataSource={rows} pagination={false} scroll={{ x: 600 }} columns={[
      { title: 'Nền tảng', dataIndex: 'platform', key: 'platform' },
      { title: 'K · ER theo lượt xem', dataIndex: 'views', key: 'views', render: percentLabel },
      { title: 'K · ER theo người theo dõi', dataIndex: 'followers', key: 'followers', render: percentLabel },
      { title: 'K · Tỷ lệ xem (VR)', dataIndex: 'vr', key: 'vr', render: percentLabel },
    ]} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hệ thống chưa cung cấp hằng số chuẩn hóa" />}
    <Row gutter={[12, 12]} className="dm-config-policy-grid">
      <Col xs={24} md={12}><div className="dm-config-policy"><h3>Sàn độ ổn định</h3>
        <strong>{numberLabel(config.stability?.stabMissingPolicyFloor)}</strong>
        {config.stability?.description && <p>{config.stability.description}</p>}
      </div></Col>
      <Col xs={24} md={12}><div className="dm-config-policy"><h3>Ngưỡng kiểm tra tương tác bất thường</h3>
        <strong>{percentLabel(config.outlierSanity?.erExtremeOutlierThreshold)}</strong>
        <p>Ngưỡng kiểm tra dữ liệu, không phải kết luận gian lận.</p>
      </div></Col>
    </Row>
    <details className="dm-config-details"><summary>Chi tiết chuẩn hóa</summary>
      <p>Công thức Michaelis–Menten:</p><div className="dm-formula" tabIndex={0} role="region" aria-label="Công thức chuẩn hóa">f(x) = x / (x + K)</div>
      <p>K dự phòng: {percentLabel(saturation?.defaultFallbackK)}</p>
      {config.outlierSanity?.description && <p>{config.outlierSanity.description}</p>}
    </details>
  </section>;
}
