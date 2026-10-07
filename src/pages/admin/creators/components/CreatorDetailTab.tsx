import React, { useState } from 'react';
import {
  Input, Select, Card, Avatar, Tag, Row, Col, Button,
  Descriptions, Progress, Divider, Typography, Empty, Space,
} from 'antd';
import { SearchOutlined, InstagramOutlined, YoutubeOutlined, ReloadOutlined } from '@ant-design/icons';
import { MOCK_CREATORS } from '../../../../mock/adminData';

const { Text, Title } = Typography;
const { Option } = Select;

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: '#010101', instagram: '#E1306C', youtube: '#FF0000',
};

export default function CreatorDetailTab() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(MOCK_CREATORS[0]);

  const suggestions = search.length >= 2
    ? MOCK_CREATORS.filter(c =>
        c.handle.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  const color = PLATFORM_COLOR[selected?.platform] ?? '#5B5BF0';

  return (
    <Row gutter={[20, 20]}>
      {/* Left — Search + List */}
      <Col xs={24} lg={8}>
        <div style={{ marginBottom: 12 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Tìm creator theo handle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
          />
        </div>

        {/* Suggestions or full list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(suggestions.length > 0 ? suggestions : MOCK_CREATORS.slice(0, 8)).map(c => (
            <div
              key={c.id}
              onClick={() => { setSelected(c); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: selected?.id === c.id ? '#EEF2FF' : '#F8FAFC',
                border: `1px solid ${selected?.id === c.id ? '#C7D2FE' : '#E2E8F0'}`,
                transition: 'all 0.15s',
              }}
            >
              <Avatar src={c.avatar} size={36} style={{ border: '1.5px solid #E2E8F0', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', lineHeight: 1.2 }}>{c.handle}</div>
                <div style={{ color: '#64748B', fontSize: 11 }}>{c.platform} • {c.followers >= 1e6 ? (c.followers/1e6).toFixed(1)+'M' : (c.followers/1e3).toFixed(0)+'K'}</div>
              </div>
              {selected?.id === c.id && <span style={{ color: '#5B5BF0', fontSize: 12 }}>●</span>}
            </div>
          ))}
        </div>
      </Col>

      {/* Right — Detail */}
      <Col xs={24} lg={16}>
        {!selected ? (
          <Empty description="Chọn creator để xem chi tiết" />
        ) : (
          <Card
            bordered={false}
            style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
            bodyStyle={{ padding: '24px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar src={selected.avatar} size={64} style={{ border: `3px solid ${color}40` }} />
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>{selected.name}</Title>
                <Text style={{ color: '#64748B', fontSize: 13 }}>{selected.handle}</Text>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <Tag style={{ background: color+'12', border: `1px solid ${color}30`, color, borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
                    {selected.platform.charAt(0).toUpperCase() + selected.platform.slice(1)}
                  </Tag>
                  <Tag style={{ borderRadius: 20, fontSize: 11 }}>{selected.category}</Tag>
                  <Tag color={selected.status === 'active' ? 'success' : 'default'} style={{ borderRadius: 20, fontSize: 11 }}>
                    {selected.status}
                  </Tag>
                </div>
              </div>
              <Button icon={<ReloadOutlined />} style={{ borderColor: '#5B5BF0', color: '#5B5BF0' }}>
                Refresh data
              </Button>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Metrics */}
            {(() => {
              const avgViews = selected.avgViews ?? 350000;
              const score = selected.score ?? 85;
              const country = selected.country ?? 'Việt Nam';
              const profileUrl = selected.profileUrl ?? `https://${selected.platform}.com/${selected.handle.replace('@', '')}`;

              return (
                <>
                  <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                    {[
                      { label: 'Followers',    value: selected.followers >= 1e6 ? (selected.followers/1e6).toFixed(2)+'M' : (selected.followers/1e3).toFixed(0)+'K', color: '#5B5BF0' },
                      { label: 'Engagement Rate', value: selected.er + '%', color: selected.er >= 7 ? '#10B981' : '#F59E0B' },
                      { label: 'Avg. Views',   value: avgViews >= 1e6 ? (avgViews/1e6).toFixed(1)+'M' : (avgViews/1e3).toFixed(0)+'K', color: '#0EA5E9' },
                      { label: 'Score',        value: score + '/100', color: score >= 80 ? '#10B981' : '#F59E0B' },
                    ].map(m => (
                      <Col xs={12} sm={6} key={m.label}>
                        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                          <div style={{ color: m.color, fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{m.value}</div>
                          <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{m.label}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>

                  {/* Score bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontWeight: 600, fontSize: 12, color: '#334155' }}>Influencer Score</Text>
                      <Text style={{ fontWeight: 700, color: '#5B5BF0' }}>{score}/100</Text>
                    </div>
                    <Progress percent={score} strokeColor={{ '0%': '#5B5BF0', '100%': '#7C3AED' }} showInfo={false} />
                  </div>

                  <Descriptions column={2} size="small"
                    labelStyle={{ color: '#94A3B8', fontWeight: 600, fontSize: 12 }}
                    contentStyle={{ color: '#334155', fontWeight: 600, fontSize: 13 }}
                    colon={false}
                  >
                    <Descriptions.Item label="Quốc gia">{country}</Descriptions.Item>
                    <Descriptions.Item label="Xác minh cuối">{selected.lastVerified}</Descriptions.Item>
                    <Descriptions.Item label="Profile URL" span={2}>
                      <a href={profileUrl} target="_blank" rel="noreferrer" style={{ color: '#5B5BF0' }}>{profileUrl}</a>
                    </Descriptions.Item>
                  </Descriptions>
                </>
              );
            })()}
          </Card>
        )}
      </Col>
    </Row>
  );
}
