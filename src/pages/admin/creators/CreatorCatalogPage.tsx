import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import {
  UnorderedListOutlined, PlusCircleOutlined, IdcardOutlined,
  CopyOutlined, GlobalOutlined, SyncOutlined,
} from '@ant-design/icons';
import CreatorListTab       from './components/CreatorListTab';
import AddImportTab         from './components/AddImportTab';
import CreatorDetailTab     from './components/CreatorDetailTab';
import DuplicatesMergeTab   from './components/DuplicatesMergeTab';
import ExternalDiscoveredTab from './components/ExternalDiscoveredTab';
import RefreshRequestTab    from './components/RefreshRequestTab';

const TABS = [
  { key: 'list',       label: 'Danh sách Master KOC',        icon: <UnorderedListOutlined />, component: <CreatorListTab /> },
  { key: 'import',     label: 'Thêm mới / Nhập dữ liệu',      icon: <PlusCircleOutlined />,   component: <AddImportTab /> },
  { key: 'detail',     label: 'Hồ sơ chi tiết & Kênh',       icon: <IdcardOutlined />,       component: <CreatorDetailTab /> },
  { key: 'duplicates', label: 'Trùng lặp & Gộp định danh',   icon: <CopyOutlined />,         component: <DuplicatesMergeTab /> },
  { key: 'external',   label: 'Khám phá dữ liệu ngoại vi',    icon: <GlobalOutlined />,       component: <ExternalDiscoveredTab /> },
  { key: 'refresh',    label: 'Yêu cầu làm mới',              icon: <SyncOutlined />,         component: <RefreshRequestTab /> },
];

export default function CreatorCatalogPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>
          Quản trị Định danh Master KOC (Luồng DM-01)
        </div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
          Hồ sơ định danh duy nhất (Master Identity), hợp nhất tài khoản đa nền tảng và kiểm soát trùng lặp
        </div>
      </div>

      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          size="middle"
          style={{ padding: '0 4px' }}
          tabBarStyle={{ padding: '0 20px', marginBottom: 0, borderBottom: '1px solid #EEF0F6' }}
          items={TABS.map(t => ({
            key:      t.key,
            label:    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>{t.icon}{t.label}</span>,
            children: <div style={{ padding: '20px 20px 24px' }}>{t.component}</div>,
          }))}
        />
      </Card>
    </div>
  );
}
