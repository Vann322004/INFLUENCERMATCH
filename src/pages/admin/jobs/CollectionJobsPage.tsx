import { useCollectionState } from '../../../hooks/useCollectionState';
import React, { useState } from 'react';
import { Card, Button, Space, Tag, Tabs, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import AutoHunterTab from './components/discovery/AutoHunterTab';
import LiveCrawlTab from './components/LiveCrawlTab';
import JobsMonitorTab from './components/jobs/JobsMonitorTab';
import { crawlerService } from '../../../services/api/crawlerService';

export default function CollectionJobsPage() {
  const [activeTab, setActiveTab] = useCollectionState<'hunter' | 'live' | 'jobs'>('activeTab', 'hunter');
  const [triggerLoading, setTriggerLoading] = useState(false);
  const handleTriggerDbRefresh = async () => {
    setTriggerLoading(true);
    message.loading({ content: 'Đang gửi lệnh làm mới dữ liệu nhà sáng tạo...', key: 'db_refresh' });
    try {
      const res = await crawlerService.triggerDbRefresh(25);
      message.success({ content: res.message || 'Đã đưa 25 nhà sáng tạo vào hàng đợi làm mới!', key: 'db_refresh' });
      setActiveTab('jobs');
    } catch (err: any) {
      message.error({ content: err.message || 'Lỗi khi gửi yêu cầu làm mới dữ liệu', key: 'db_refresh' });
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Trung tâm Thu thập & Cào Dữ liệu</span>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
              Tìm nhà sáng tạo thông minh
            </Tag>
          </div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
            Tự động săn lùng & phát hiện nhà sáng tạo mới theo chủ đề/hashtag, cào dữ liệu trực tiếp và giám sát các tác vụ nền.
          </div>
        </div>

        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleTriggerDbRefresh}
            loading={triggerLoading}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Làm mới dữ liệu nhà sáng tạo
          </Button>

        </Space>
      </div>

      {/* Tabs */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          size="middle"
          tabBarStyle={{
            padding: '0 20px',
            marginBottom: 0,
            borderBottom: '1px solid #EEF0F6',
            background: '#FAFAFD',
          }}
          items={[
            {
              key: 'hunter',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Tìm & Thu thập nhà sáng tạo</span>,
              children: (
                <div style={{ padding: '24px 24px 32px' }}>
                  <AutoHunterTab />
                </div>
              ),
            },
            {
              key: 'live',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Thu thập trực tiếp</span>,
              children: (
                <div style={{ padding: '24px 24px 32px' }}>
                  <LiveCrawlTab />
                </div>
              ),
            },
            {
              key: 'jobs',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Tiến trình thu thập</span>,
              children: (
                <div style={{ padding: '20px 20px 24px' }}>
                  <JobsMonitorTab />
                </div>
              ),
            },
          ]}
        />
      </Card>

    </div>
  );
}
