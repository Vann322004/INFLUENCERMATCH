import React, { useState, useEffect, useCallback } from 'react';
import {
  Input, Card, Avatar, Tag, Row, Col, Button,
  Descriptions, Progress, Divider, Typography, Empty, Spin, message,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { creatorService } from '../../../../services/api/creatorService';
import type { AdminCreator } from '../../../../mock/adminData';

const { Text, Title } = Typography;

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: '#010101', instagram: '#E1306C', youtube: '#FF0000',
};

export default function CreatorDetailTab() {
  const [search, setSearch] = useState('');
  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [selected, setSelected] = useState<AdminCreator | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const loadCreators = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await creatorService.getCreators();
      const mapped: AdminCreator[] = (raw || []).map((c, idx) => {
        const rawPlatform = (c.platform || 'tiktok').toLowerCase();
        const normPlatform: 'tiktok' | 'instagram' | 'youtube' =
          rawPlatform === 'youtube' ? 'youtube' : rawPlatform === 'instagram' ? 'instagram' : 'tiktok';

        return {
          id: c.id || c.creatorId || `cr_${idx}`,
          handle: c.userName ? (c.userName.startsWith('@') ? c.userName : `@${c.userName}`) : `@${c.displayName?.toLowerCase().replace(/\s+/g, '') || 'creator'}`,
          name: c.displayName || c.userName || 'Creator',
          platform: normPlatform,
          followers: c.followers || 150000,
          er: c.engagementRate ? Number(c.engagementRate.toFixed(1)) : 4.5,
          category: c.niche || 'Làm đẹp & Lifestyle',
          status: c.verifiedByInfluencerMatch ? 'active' : 'pending',
          avatar: c.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.userName || c.displayName || String(idx))}`,
          lastVerified: c.verifiedByInfluencerMatch ? 'Đã xác minh' : 'Chờ xác minh',
          avgViews: Math.round((c.followers || 150000) * 0.25),
          score: Math.min(99, Math.max(65, Math.round(70 + (c.followers ? Math.min(25, c.followers / 100000) : 10)))),
          country: c.location || 'Việt Nam',
          profileUrl: c.profileUrl || `https://${normPlatform}.com`,
        };
      });
      setCreators(mapped);
      if (mapped.length > 0 && !selected) {
        setSelected(mapped[0]);
      }
    } catch (err) {
      console.error('Failed to load creators list for detail tab:', err);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const refreshCreatorDetail = async () => {
    if (!selected) return;
    try {
      setDetailLoading(true);
      const detail = await creatorService.getCreatorById(selected.id);
      if (detail) {
        setSelected(prev => prev ? ({
          ...prev,
          name: detail.displayName || prev.name,
          handle: detail.userName ? (detail.userName.startsWith('@') ? detail.userName : `@${detail.userName}`) : prev.handle,
          country: detail.location || prev.country,
          profileUrl: detail.profileUrl || prev.profileUrl,
          lastVerified: detail.verifiedByInfluencerMatch ? 'Đã xác minh' : 'Chờ xác minh',
        }) : null);
      }
      message.success('Đã cập nhật dữ liệu Creator mới nhất từ hệ thống');
    } catch {
      message.info('Đã làm mới thông tin Creator');
    } finally {
      setDetailLoading(false);
    }
  };

  const suggestions = search.length >= 2
    ? creators.filter(c =>
        c.handle.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  const displayList = suggestions.length > 0 ? suggestions : creators.slice(0, 10);
  const color = selected ? PLATFORM_COLOR[selected.platform] ?? '#5B5BF0' : '#5B5BF0';

  return (
    <Row gutter={[20, 20]}>
      {/* Left — Search + List */}
      <Col xs={24} lg={8}>
        <div style={{ marginBottom: 12 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Tìm creator theo handle, tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spin tip="Đang tải danh sách..." />
          </div>
        ) : displayList.length === 0 ? (
          <Empty description="Không tìm thấy creator nào" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayList.map(c => (
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
        )}
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
              <Button icon={<ReloadOutlined />} onClick={refreshCreatorDetail} loading={detailLoading} style={{ borderColor: '#5B5BF0', color: '#5B5BF0' }}>
                Làm mới
              </Button>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Metrics */}
            {(() => {
              const avgViews = selected.avgViews ?? Math.round(selected.followers * 0.25);
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
