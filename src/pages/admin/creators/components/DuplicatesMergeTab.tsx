import React, { useState } from 'react';
import {
  Table, Avatar, Button, Tag, Modal, Select, Typography,
  message, Space, Row, Col, Card, Alert,
} from 'antd';
import { MergeCellsOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

interface DuplicateGroup {
  id: string;
  handle: string;
  duplicates: {
    id: string; handle: string; platform: string;
    followers: number; avatar: string; source: string;
  }[];
}

const MOCK_DUPLICATES: DuplicateGroup[] = [
  {
    id: 'dup_1',
    handle: '@linh_beauty',
    duplicates: [
      { id: 'c1', handle: '@linh_beauty',     platform: 'tiktok',    followers: 1200000, avatar: 'https://i.pravatar.cc/40?img=1',  source: 'Manual' },
      { id: 'c2', handle: '@linhmakeup',      platform: 'tiktok',    followers: 1185000, avatar: 'https://i.pravatar.cc/40?img=2',  source: 'CSV Import' },
      { id: 'c3', handle: '@linhtran_beauty', platform: 'instagram', followers: 980000,  avatar: 'https://i.pravatar.cc/40?img=3',  source: 'Auto-discovered' },
    ],
  },
  {
    id: 'dup_2',
    handle: '@chef_minh',
    duplicates: [
      { id: 'c4', handle: '@chef_minh',   platform: 'youtube',   followers: 450000, avatar: 'https://i.pravatar.cc/40?img=4', source: 'Manual' },
      { id: 'c5', handle: '@minhchef_vn', platform: 'tiktok',    followers: 420000, avatar: 'https://i.pravatar.cc/40?img=5', source: 'Auto-discovered' },
    ],
  },
];

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: '#010101', instagram: '#E1306C', youtube: '#FF0000',
};

export default function DuplicatesMergeTab() {
  const [groups, setGroups] = useState(MOCK_DUPLICATES);
  const [mergeGroup, setMergeGroup] = useState<DuplicateGroup | null>(null);
  const [keepId, setKeepId] = useState<string>('');

  const handleMerge = async () => {
    if (!keepId) { message.warning('Vui lòng chọn creator gốc cần giữ lại'); return; }
    await new Promise(r => setTimeout(r, 600));
    setGroups(prev => prev.filter(g => g.id !== mergeGroup?.id));
    setMergeGroup(null);
    setKeepId('');
    message.success('Merge thành công!');
  };

  const handleDismiss = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    message.info('Đã bỏ qua nhóm trùng lặp này.');
  };

  return (
    <div>
      <Alert
        type="warning"
        showIcon
        message={`Phát hiện ${groups.length} nhóm creator có thể trùng lặp`}
        description="Hệ thống phát hiện dựa trên handle similarity và follower count."
        style={{ marginBottom: 20, borderRadius: 10 }}
      />

      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
          ✅ Không có creator trùng lặp nào!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map(group => (
            <Card
              key={group.id}
              bordered={false}
              style={{ borderRadius: 12, border: '1px solid #FDE68A', background: '#FFFBEB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <Title level={5} style={{ margin: 0, color: '#92400E', fontWeight: 700 }}>
                    ⚠️ Nhóm trùng: {group.handle}
                  </Title>
                  <Text style={{ color: '#B45309', fontSize: 12 }}>{group.duplicates.length} creator có thể là cùng 1 người</Text>
                </div>
                <Space>
                  <Button
                    size="small"
                    icon={<MergeCellsOutlined />}
                    type="primary"
                    onClick={() => { setMergeGroup(group); setKeepId(group.duplicates[0].id); }}
                    style={{ background: '#5B5BF0', border: 'none', fontWeight: 700 }}
                  >
                    Merge
                  </Button>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDismiss(group.id)}
                  >
                    Bỏ qua
                  </Button>
                </Space>
              </div>

              <Row gutter={[10, 10]}>
                {group.duplicates.map(d => (
                  <Col xs={24} sm={8} key={d.id}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 10,
                      background: '#fff', border: '1px solid #E2E8F0',
                    }}>
                      <Avatar src={d.avatar} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A', lineHeight: 1.2 }}>{d.handle}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>
                          <Tag style={{ fontSize: 9, padding: '0 4px', lineHeight: '14px', color: PLATFORM_COLOR[d.platform] }}>{d.platform}</Tag>
                          {' '}{(d.followers / 1000).toFixed(0)}K
                        </div>
                        <div style={{ fontSize: 9, color: '#94A3B8' }}>Source: {d.source}</div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          ))}
        </div>
      )}

      {/* Merge Modal */}
      <Modal
        open={!!mergeGroup}
        onCancel={() => { setMergeGroup(null); setKeepId(''); }}
        title={<span><MergeCellsOutlined style={{ color: '#5B5BF0' }} /> Merge Creator</span>}
        onOk={handleMerge}
        okText="Xác nhận Merge"
        okButtonProps={{ style: { background: '#5B5BF0', border: 'none' } }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 600 }}>Chọn creator gốc cần giữ lại (các creator còn lại sẽ bị gộp vào):</Text>
        </div>
        <Select value={keepId} onChange={setKeepId} style={{ width: '100%' }} size="large">
          {mergeGroup?.duplicates.map(d => (
            <Option key={d.id} value={d.id}>
              {d.handle} — {d.platform} — {(d.followers/1000).toFixed(0)}K followers
            </Option>
          ))}
        </Select>
        <Alert
          type="error"
          style={{ marginTop: 14, borderRadius: 8 }}
          message="Hành động không thể hoàn tác. Dữ liệu của các creator bị gộp sẽ bị xóa."
          showIcon
        />
      </Modal>
    </div>
  );
}
