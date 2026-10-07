import React from 'react';
import { Modal, Form, Input, Alert, Descriptions, Tag, Typography } from 'antd';
import type { ScoringVersion } from '../../../../mock/adminData';

const { Text } = Typography;

interface Props {
  version: ScoringVersion | null;
  currentWeights: Record<string, number>;
  open: boolean;
  onClose: () => void;
  onConfirmRollback: (version: ScoringVersion, reason: string) => void;
}

export default function RollbackModal({ version, currentWeights, open, onClose, onConfirmRollback }: Props) {
  const [form] = Form.useForm();

  if (!version) return null;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onConfirmRollback(version, values.reason);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Xác nhận Rollback về {version.version}</span>
          <Tag color="warning">Khôi phục</Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận Rollback"
      okButtonProps={{ danger: true }}
      cancelText="Hủy"
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <Alert
          type="warning"
          showIcon
          message="Lưu ý khi khôi phục trọng số thuật toán"
          description={`Toàn bộ hệ thống tính điểm Creator sẽ ngay lập tức chuyển về áp dụng bộ trọng số của phiên bản ${version.version} (${version.savedAt}).`}
          style={{ marginBottom: 16, borderRadius: 10 }}
        />

        {/* Diff preview */}
        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'block', marginBottom: 8 }}>
            So sánh trọng số (Hiện tại ➜ Phiên bản {version.version})
          </Text>
          <Descriptions bordered size="small" column={1}>
            {Object.keys(version.weights).map(key => {
              const currentVal = currentWeights[key] ?? 0;
              const targetVal = version.weights[key] ?? 0;
              const isDiff = currentVal !== targetVal;
              return (
                <Descriptions.Item key={key} label={<span style={{ textTransform: 'capitalize' }}>{key}</span>}>
                  <span>{currentVal}%</span>
                  {isDiff && (
                    <span style={{ marginLeft: 8, fontWeight: 700, color: targetVal > currentVal ? '#10B981' : '#EF4444' }}>
                      ➜ {targetVal}% ({targetVal > currentVal ? `+${targetVal - currentVal}` : targetVal - currentVal}%)
                    </span>
                  )}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </div>

        {/* Reason form */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do Rollback *"
            rules={[{ required: true, message: 'Vui lòng nhập lý do rollback' }]}
          >
            <Input.TextArea
              placeholder="VD: Phiên bản hiện tại làm giảm điểm của creator mảng ẩm thực quá mức..."
              rows={3}
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
