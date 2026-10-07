import React, { useState } from 'react';
import { Card, Row, Col, Slider, InputNumber, Button, Alert, Tag, Modal, Form, Input, Space, Typography, message } from 'antd';
import {
  SaveOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { CURRENT_WEIGHTS } from '../../../../mock/adminData';

const { Text, Title } = Typography;

interface Props {
  weights: Record<string, number>;
  onChange: (weights: Record<string, number>) => void;
  onSaveNewVersion: (weights: Record<string, number>, notes: string) => void;
}

const WEIGHT_LABELS: Record<string, { label: string; desc: string }> = {
  engagementRate: { label: 'Tỷ lệ tương tác (Engagement Rate)', desc: 'Đánh giá mức độ phản hồi của người xem trên từng video/post' },
  followerCount:  { label: 'Quy mô người theo dõi (Followers)', desc: 'Số lượng khán giả tiếp cận tiềm năng trên kênh' },
  growthRate:     { label: 'Tốc độ tăng trưởng (Growth Rate)',   desc: 'Tỷ lệ tăng trưởng follower và view trong 30 ngày qua' },
  contentQuality: { label: 'Chất lượng nội dung (Content)',     desc: 'Điểm đánh giá thẩm mỹ, tỷ lệ hoàn thành clip và retention' },
  consistency:    { label: 'Độ đều đặn (Consistency)',          desc: 'Tần suất đăng tải nội dung đều đặn theo tuần' },
  brandSafety:    { label: 'An toàn thương hiệu (Brand Safety)', desc: 'Mức độ uy tín, không dính tranh cãi hoặc nội dung tiêu cực' },
};

const PRESETS: Record<string, Record<string, number>> = {
  balanced: {
    engagementRate: 30, followerCount: 20, growthRate: 15, contentQuality: 15, consistency: 10, brandSafety: 10,
  },
  engagementFocus: {
    engagementRate: 45, followerCount: 15, growthRate: 15, contentQuality: 15, consistency: 5, brandSafety: 5,
  },
  reachFocus: {
    engagementRate: 20, followerCount: 40, growthRate: 15, contentQuality: 10, consistency: 10, brandSafety: 5,
  },
  safetyFocus: {
    engagementRate: 25, followerCount: 15, growthRate: 10, contentQuality: 20, consistency: 10, brandSafety: 20,
  },
};

export default function WeightsEditorTab({ weights, onChange, onSaveNewVersion }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const currentSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = currentSum === 100;

  const handleSliderChange = (key: string, value: number) => {
    onChange({ ...weights, [key]: value });
  };

  const handleApplyPreset = (presetKey: string) => {
    const target = PRESETS[presetKey];
    if (target) {
      onChange(target);
      message.info('Đã áp dụng cấu hình mẫu!');
    }
  };

  const handleReset = () => {
    onChange(CURRENT_WEIGHTS);
    message.info('Đã khôi phục về trọng số mặc định!');
  };

  const handleConfirmSave = async () => {
    try {
      const values = await form.validateFields();
      onSaveNewVersion(weights, values.notes);
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <div>
      {/* Top Banner Status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isValid ? '#ECFDF5' : '#FEF2F2',
          border: `1.5px solid ${isValid ? '#10B981' : '#EF4444'}`,
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isValid ? (
            <CheckCircleOutlined style={{ fontSize: 24, color: '#10B981' }} />
          ) : (
            <ExclamationCircleOutlined style={{ fontSize: 24, color: '#EF4444' }} />
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: isValid ? '#065F46' : '#991B1B' }}>
              Tổng trọng số: {currentSum}% {isValid ? '(Hợp lệ - sẵn sàng lưu)' : `(Lệch ${currentSum - 100 > 0 ? `+${currentSum - 100}%` : `${currentSum - 100}%`})`}
            </div>
            <div style={{ fontSize: 12, color: isValid ? '#047857' : '#B91C1C' }}>
              {isValid
                ? 'Tổng tỷ trọng đạt đúng 100%. Bạn có thể lưu thành phiên bản thuật toán mới.'
                : 'Quy tắc bắt buộc: Tổng tỷ trọng của tất cả các tiêu chí phải bằng đúng 100%.'}
            </div>
          </div>
        </div>

        <Space>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            Đặt lại mặc định
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!isValid}
            onClick={() => setModalOpen(true)}
            style={{
              background: isValid ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : undefined,
              border: 'none',
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            Lưu phiên bản mới
          </Button>
        </Space>
      </div>

      {/* Quick Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <Text style={{ fontWeight: 600, fontSize: 13, color: '#64748B' }}>Preset nhanh:</Text>
        <Button size="small" onClick={() => handleApplyPreset('balanced')}>Cân bằng chuẩn (30-20-15-15-10-10)</Button>
        <Button size="small" onClick={() => handleApplyPreset('engagementFocus')}>Ưu tiên tương tác (45% ER)</Button>
        <Button size="small" onClick={() => handleApplyPreset('reachFocus')}>Ưu tiên quy mô (40% Followers)</Button>
        <Button size="small" onClick={() => handleApplyPreset('safetyFocus')}>An toàn thương hiệu cao (20% Brand Safety)</Button>
      </div>

      {/* Sliders Grid */}
      <Row gutter={[16, 16]}>
        {Object.entries(WEIGHT_LABELS).map(([key, info]) => {
          const val = weights[key] ?? 0;
          return (
            <Col xs={24} md={12} key={key}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                }}
                bodyStyle={{ padding: 18 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{info.label}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{info.desc}</div>
                  </div>
                  <Tag color="indigo" style={{ fontWeight: 800, fontSize: 13, borderRadius: 6, margin: 0, padding: '2px 8px' }}>
                    {val}%
                  </Tag>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={val}
                    onChange={v => handleSliderChange(key, v)}
                    style={{ flex: 1 }}
                  />
                  <InputNumber
                    min={0}
                    max={100}
                    step={5}
                    value={val}
                    onChange={v => handleSliderChange(key, v || 0)}
                    style={{ width: 68 }}
                  />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Save Modal */}
      <Modal
        title="Lưu bộ trọng số mới"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleConfirmSave}
        okText="Lưu & Áp dụng"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Alert
            type="info"
            showIcon
            message="Phiên bản sẽ được tăng lên (ví dụ: v2.5)"
            description="Sau khi lưu, hệ thống sẽ tự động cập nhật lại Influencer Score cho toàn bộ Creator trong danh mục."
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
          <Form.Item
            name="notes"
            label="Ghi chú thay đổi (Release Notes) *"
            rules={[{ required: true, message: 'Vui lòng nhập lý do điều chỉnh trọng số' }]}
          >
            <Input.TextArea
              placeholder="VD: Điều chỉnh tăng trọng số Content Quality theo định hướng chiến dịch Q4..."
              rows={3}
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
