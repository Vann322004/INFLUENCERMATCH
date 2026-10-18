import React, { useState } from 'react';
import { Card, List, Button, Tag, Space, Typography, Alert, message } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  SaveOutlined,
  CheckOutlined,
  DragOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { DataConnector } from '../../../../mock/adminData';

const { Text, Paragraph } = Typography;

interface Props {
  connectors: DataConnector[];
  onSavePriority: (orderedConnectors: DataConnector[]) => void;
}

export default function SourcePriorityPanel({ connectors, onSavePriority }: Props) {
  const [list, setList] = useState<DataConnector[]>(() =>
    [...connectors].sort((a, b) => a.priority - b.priority)
  );
  const [hasChanged, setHasChanged] = useState(false);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const updated = [...list];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Re-assign priority values
    const reordered = updated.map((item, idx) => ({
      ...item,
      priority: idx + 1,
    }));

    setList(reordered);
    setHasChanged(true);
  };

  const handleSave = () => {
    onSavePriority(list);
    setHasChanged(false);
    message.success('Đã lưu cấu hình thứ tự ưu tiên nguồn dữ liệu thành công!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Alert
        message="Nguyên tắc phân định thứ tự ưu tiên dữ liệu"
        description="Khi đồng bộ hoặc hợp nhất hồ sơ Creator xuất hiện ở nhiều mạng xã hội, các trường thông tin chuẩn (Tên hiển thị, Avatar chính, Bio chuẩn, Thể loại chính) sẽ ưu tiên lấy từ nguồn có mức ưu tiên cao nhất."
        type="warning"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ borderRadius: 10 }}
      />

      <Card
        bordered={false}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Thứ tự ưu tiên nguồn dữ liệu trích xuất</span>
            <Tag color="purple" style={{ borderRadius: 6 }}>1 = Cao nhất</Tag>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!hasChanged}
            onClick={handleSave}
            style={{
              background: hasChanged ? '#6366F1' : undefined,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Lưu thứ tự ưu tiên
          </Button>
        }
        style={{ borderRadius: 14, border: '1px solid #EEF0F6' }}
      >
        <List
          dataSource={list}
          renderItem={(item, index) => (
            <List.Item
              style={{
                padding: '16px 20px',
                background: index === 0 ? 'rgba(99, 102, 241, 0.04)' : '#FFFFFF',
                borderRadius: 10,
                marginBottom: 10,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: index === 0 ? '#6366F1' : '#F1F5F9',
                    color: index === 0 ? '#FFFFFF' : '#475569',
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  #{item.priority}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 10 }}>
                    <span>Platform: <strong>{item.platform}</strong></span>
                    <span>•</span>
                    <span>Rate limit: <strong>{item.rateLimit} req/min</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0}
                  onClick={() => moveItem(index, 'up')}
                  style={{ borderRadius: 6 }}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  disabled={index === list.length - 1}
                  onClick={() => moveItem(index, 'down')}
                  style={{ borderRadius: 6 }}
                />
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
