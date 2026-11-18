import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CreatorListTab       from './components/CreatorListTab';

const TABS = [
  { key: 'list',       label: 'Danh sách Nhà sáng tạo',        icon: <UnorderedListOutlined />, component: <CreatorListTab /> },
];

export default function CreatorCatalogPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>
          Quản trị Định danh Nhà sáng tạo
        </div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
          Tra cứu hồ sơ kênh, đối chiếu định danh nền tảng và kiểm tra trạng thái xác minh.
        </div>
      </div>

      <div className="dm-flow-highlights">
        <article><strong>Nhận diện đúng kênh</strong><p>Đối chiếu nền tảng, mã kênh và hồ sơ gốc; không suy đoán quyền sở hữu từ tên hiển thị.</p></article>
        <article><strong>Phân biệt nguồn dữ liệu</strong><p>Tách hồ sơ công khai với kênh đã được cấp quyền, hiển thị trạng thái xác minh từ hệ thống.</p></article>
        <article><strong>Xử lý định danh có kiểm soát</strong><p>Đối chiếu và xử lý hồ sơ trùng tại bước kiểm định dữ liệu.</p><Link to="/data-manager/data-quality">Mở kiểm định chất lượng →</Link></article>
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
