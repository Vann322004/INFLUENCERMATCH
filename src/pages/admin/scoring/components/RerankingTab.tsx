import { Row, Col, Card, Tag, Alert } from 'antd';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';

export default function RerankingTab({ config: currentConfig }: { config: RecommendationConfigResponseDto }) {
  return (
    <div className="dm-config-tab-panel" style={{ padding: '20px' }}>
      {/* MMR Configuration Block */}
      <Card
        bordered={false}
        style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #EEF0F6', marginBottom: 20 }}
        styles={{ body: { padding: 18 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0F172A' }}>
              Maximal Marginal Relevance (MMR Diversity Reranking)
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
              Thuật toán cân bằng giữa độ phù hợp điểm số (Relevance) và độ phân tán đa dạng nội dung danh sách gợi ý.
            </div>
          </div>
          <Tag style={{ fontWeight: 600, borderRadius: 4, fontSize: 11.5, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
            Trạng thái: {currentConfig.diversityReranking?.intraBucketMmrStatus || 'DISABLED_IN_MVP'}
          </Tag>
        </div>

        <Row gutter={[14, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={8}>
            <div style={{ fontSize: 12, color: '#64748B' }}>MMR Trade-off Lambda (λ_MMR)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>
              {currentConfig.diversityReranking?.defaultMmrLambda ?? 0.70}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B' }}>70% Độ liên quan · 30% Đa dạng</div>
          </Col>
          <Col xs={24} sm={16}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Công thức hàm mục tiêu MMR</div>
            <div className="dm-formula" role="region" aria-label="Công thức thuật toán, có thể cuộn ngang" tabIndex={0} style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A', fontSize: 13, background: '#FFFFFF', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
              {currentConfig.diversityReranking?.mmrFormula || 'MMR(i) = lambda * rel(i) - (1 - lambda) * max_{s in S} sim(i, s)'}
            </div>
          </Col>
        </Row>

        <Alert
          type="warning"
          showIcon
          style={{ borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}
          message="Phạm vi reranking trong giai đoạn MVP"
          description="Hệ số λ_MMR = 0.70 là siêu tham số đã được đóng băng trong Engine. Tuy nhiên, tính năng reranking nội bộ phân nhóm (Intra-Bucket MMR) hiện đang ở trạng thái TẮT (DISABLED_IN_MVP) để ưu tiên độ ổn định phân loại nhóm ứng viên. Thuật toán sẽ được kích hoạt toàn diện ở Phase kế tiếp."
        />
      </Card>

      {/* Future Scope Roadmaps */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>
          Lộ trình kỹ thuật mở rộng (Future Scope Roadmap)
        </div>

        <Row gutter={[14, 14]}>
          {(currentConfig.futureScope || []).map((scopeItem) => {
            const scopeMeta: Record<string, { label: string; desc: string }> = {
              DYNAMIC_WEIGHT_OVERRIDE: {
                label: 'Ghi đè trọng số tùy chỉnh theo chiến dịch',
                desc: 'Cho phép thương hiệu cấp cao hoặc chuyên gia dữ liệu tinh chỉnh bộ trọng số riêng cho từng hợp đồng chiến dịch đặc thù.',
              },
              SIMULATION_SANDBOX: {
                label: 'Môi trường giả lập & đánh giá tác động (Sandbox)',
                desc: 'Không gian thử nghiệm độc lập để mô phỏng sự dịch chuyển thứ hạng KOC trước khi áp dụng trọng số vào môi trường Production.',
              },
              OBJECTIVE_PRESET_CREATOR: {
                label: 'Bộ cấu hình mục tiêu tùy biến cho doanh nghiệp',
                desc: 'Hỗ trợ khách hàng Enterprise tự tạo và lưu trữ các preset mục tiêu độc quyền theo ngành hàng chuyên sâu.',
              },
              REALTIME_ONLINE_EXPERIMENTATION: {
                label: 'Thử nghiệm trực tuyến A/B Testing thời gian thực',
                desc: 'Hạ tầng phân luồng lưu lượng truy cập để so sánh tỷ lệ chuyển đổi giữa các phiên bản hiệu chuẩn thuật toán song song.',
              },
            };

            const itemInfo = scopeMeta[scopeItem] || { label: scopeItem, desc: 'Tính năng đang trong kế hoạch nghiên cứu.' };

            return (
              <Col xs={24} sm={12} key={scopeItem}>
                <Card
                  bordered={false}
                  style={{ height: '100%', borderRadius: 10, background: '#F8FAFC', border: '1px solid #EEF0F6' }}
                  styles={{ body: { padding: 14 } }}
                >
                  <Tag style={{ fontFamily: 'monospace', fontWeight: 600, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', margin: '0 0 6px 0' }}>
                    {scopeItem}
                  </Tag>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 4 }}>
                    {itemInfo.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                    {itemInfo.desc}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
}
