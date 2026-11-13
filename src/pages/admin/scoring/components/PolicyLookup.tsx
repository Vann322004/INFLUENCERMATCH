import { Row, Col, Card, Tag, Select, InputNumber } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';

interface Props {
  config: RecommendationConfigResponseDto;
  selectedObjective: string;
  setSelectedObjective: (objective: string) => void;
  candidatePoolSize: number;
  setCandidatePoolSize: (size: number) => void;
}

export default function PolicyLookup({ config: currentConfig, selectedObjective, setSelectedObjective, candidatePoolSize, setCandidatePoolSize }: Props) {
  const objectiveWeights = currentConfig.dynamicWeighting?.canonicalObjectiveWeights || {};
  const selectedRawWeights = objectiveWeights[selectedObjective] || [0.25, 0.25, 0.25, 0.25];
  const minPoolSize = currentConfig.dynamicWeighting?.minPoolSizeForCritic ?? 10;
  const isSampleEligible = candidatePoolSize >= minPoolSize;

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 14,
        border: '1px solid #EEF0F6',
        background: '#FFFFFF',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
            Công cụ tra cứu chính sách trọng số & phân nhánh thuật toán (Policy Lookup)
          </div>
          <div style={{ fontSize: 12.5, color: '#64748B' }}>
            Kiểm tra trọng số cơ sở chuẩn (Business Prior) và điều kiện kích hoạt hòa trộn CRITIC theo mục tiêu và quy mô ứng viên.
          </div>
        </div>
        <Tag style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: 4, fontWeight: 600 }}>
          Read-Only Policy Inspector
        </Tag>
      </div>

      {/* Input Selectors */}
      <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #EEF0F6', marginBottom: 16 }}>
        <Row gutter={[14, 14]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Chọn mục tiêu chiến dịch (Objective):
            </div>
            <Select
              aria-label="Mục tiêu chiến dịch"
              value={selectedObjective}
              onChange={setSelectedObjective}
              style={{ width: '100%' }}
              options={[
                { value: 'AWARENESS', label: 'AWARENESS (Nhận diện thương hiệu)' },
                { value: 'ENGAGEMENT', label: 'ENGAGEMENT (Tương tác sâu)' },
                { value: 'TRAFFIC', label: 'TRAFFIC (Lưu lượng truy cập)' },
                { value: 'CONVERSION', label: 'CONVERSION (Chuyển đổi & Uy tín lịch sử)' },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Số lượng ứng viên đủ điều kiện trong Ranking Pool (N):
            </div>
            <InputNumber
              aria-label="Số lượng ứng viên"
              min={1}
              max={500}
              value={candidatePoolSize}
              onChange={(val) => setCandidatePoolSize(val || 1)}
              style={{ width: '100%' }}
              addonAfter="ứng viên"
            />
          </Col>

          <Col xs={24} md={8}>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
              * Công cụ chỉ giải thích nhánh quyết định logic của Engine; không tính toán dynamic weights giả lập khi chưa có ma trận ứng viên thực tế.
            </div>
          </Col>
        </Row>
      </div>

      {/* Output Results */}
      <Row gutter={[14, 14]}>
        <Col xs={24} md={12}>
          <Card bordered={false} style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #EEF0F6', height: '100%' }} styles={{ body: { padding: 16 } }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
              Trọng số cơ sở chuẩn (Business Prior: bg)
            </div>
            <Row gutter={[8, 8]}>
              <Col xs={12} sm={6}>
                <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>M1 Reputation</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{(selectedRawWeights[0] * 100).toFixed(0)}%</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>M2 Performance</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{(selectedRawWeights[1] * 100).toFixed(0)}%</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>M3 Semantic</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{(selectedRawWeights[2] * 100).toFixed(0)}%</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>M4 Taste/Affinity</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{(selectedRawWeights[3] * 100).toFixed(0)}%</div>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 12, fontSize: 12, color: '#475569' }}>
              {selectedObjective === 'CONVERSION' ? (
                <span>
                  <strong>Lưu ý nghiệp vụ CONVERSION:</strong> Tiêu chí <strong>M1 (Uy tín lịch sử)</strong> chiếm tỷ trọng 40% (cao nhất), theo sau là M3 (30%). Không tuyên bố CONVERSION ưu tiên Semantic Fit cao nhất.
                </span>
              ) : (
                <span>
                  Vector trọng số mục tiêu thể hiện sự ưu tiên quyết định định sẵn trước khi xét tới biến động dữ liệu ứng viên.
                </span>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              background: isSampleEligible ? '#F0FDF4' : '#FFFBEB',
              borderRadius: 10,
              border: `1px solid ${isSampleEligible ? '#BBF7D0' : '#FDE68A'}`,
              height: '100%',
            }}
            styles={{ body: { padding: 16 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {isSampleEligible ? (
                <CheckCircleOutlined style={{ color: '#16A34A', fontSize: 15 }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: '#D97706', fontSize: 15 }} />
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: isSampleEligible ? '#15803D' : '#92400E' }}>
                Đánh giá nhánh quyết định chính sách (Policy Branching Decision)
              </span>
            </div>

            {isSampleEligible ? (
              <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Điều kiện quy mô mẫu: ĐẠT ĐIỀU KIỆN CẦN</strong> (Quy mô pool N = {candidatePoolSize} ≥ {minPoolSize}).
                </p>
                <p style={{ margin: 0 }}>
                  Hệ thống sẽ tiến hành kiểm tra phương sai hiệp biến giữa 4 tiêu chí. Nếu dữ liệu có đủ lượng thông tin hữu hiệu (phương sai &gt; 10⁻⁶ và số tiêu chí hoạt động ≥ 2), thuật toán sẽ tính ma trận tương quan Pearson, sinh vector CRITIC <code>q</code> và hòa trộn theo hệ số <strong>λ = 0.30</strong> (70% Business Prior + 30% CRITIC).
                </p>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Kích hoạt BUSINESS_FALLBACK</strong> (Quy mô pool N = {candidatePoolSize} &lt; {minPoolSize}).
                </p>
                <p style={{ margin: 0 }}>
                  Số lượng ứng viên trong Ranking Pool không đạt quy mô mẫu tối thiểu để phân tích hiệp phương sai tin cậy. Hệ thống tự động thiết lập <strong>λ = 0</strong> và sử dụng 100% trọng số cơ sở <strong>bg</strong> của mục tiêu {selectedObjective}.
                </p>
              </div>
            )}

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(0,0,0,0.1)', fontSize: 11.5, color: '#64748B' }}>
              * Minh bạch thuật toán: Không sinh số liệu trọng số động giả định khi chưa có ma trận hiệp phương sai thực tế từ chiến dịch.
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
