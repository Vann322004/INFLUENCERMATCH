import { collectionIdentity, readCollectionResults, type CollectionResult } from '../../../services/collectionResults';
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Select, Space, Table, Tag, Typography } from 'antd';
import { crawlerService } from '../../../services/api/crawlerService';
import type { CrawlMonitorOverview, LiveCrawlResult } from '../../../types/api/crawler.types';
import DirectCrawlModal from '../jobs/components/DirectCrawlModal';

export default function CrawlerReviewList({ refreshKey }: { refreshKey: number }) {
  const [overview, setOverview] = useState<CrawlMonitorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<LiveCrawlResult | null>(null);
  const [local, setLocal] = useState(readCollectionResults);
  const [source, setSource] = useState('all');
  useEffect(() => {
    const reload = () => setLocal(readCollectionResults());
    reload();
    window.addEventListener('im-collection-results', reload);
    return () => window.removeEventListener('im-collection-results', reload);
  }, [refreshKey]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    crawlerService.getOverview(100).then(result => {
      if (active) setOverview(result);
    }).catch(err => {
      if (active) setError(err.message || 'Không tải được danh sách chờ xem xét từ crawler.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const records = new Map<string, CollectionResult>(local.map(row => [row.id, row]));
  const pending = (overview?.activities?.items || []).filter(item =>
    /REVIEW|VERIFY|VERIFICATION/.test(`${item.decision} ${item.status}`.toUpperCase()));
  for (const item of pending) {
    const id = collectionIdentity(item.platform, item.username);
    const previous = records.get(id);
    const snapshot = overview?.crawled_data?.items?.find(row =>
      collectionIdentity(row.creator.platform, row.creator.username) === id);
    const result: LiveCrawlResult = {
      ...(previous?.result || {}),
      status: 'success', platform: item.platform, username: item.username,
      display_name: item.displayName || previous?.result.display_name,
      decision: item.decision, primary_type: item.primaryType,
      followers: snapshot?.creator.followers ?? previous?.result.followers,
      avatar_url: snapshot?.creator.avatarUrl || previous?.result.avatar_url,
      bio: snapshot?.creator.bio ?? previous?.result.bio,
      is_verified: snapshot?.creator.isVerified ?? previous?.result.is_verified,
      recent_posts: snapshot?.recentPosts ?? previous?.result.recent_posts,
      collected_at: snapshot?.collectedAt || previous?.result.collected_at,
    };
    records.set(id, { id, result, sources: previous?.sources || [], savedAt: item.updatedAt || previous?.savedAt || '' });
  }
  const rows = [...records.values()].filter(row => source === 'all' || row.sources.includes(source as 'manual' | 'automatic'))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return <Card className="quality-collection-list">
    <Typography.Title level={4}>Dữ liệu cào thủ công và tự động</Typography.Title>
    <Typography.Paragraph type="secondary">Tổng hợp kết quả thu thập từ hai nguồn và tài khoản cần xác minh. Hồ sơ đã đồng bộ và đủ điều kiện duyệt KOC nằm trong danh sách bên dưới.</Typography.Paragraph>
    <Space wrap className="quality-source-filter">
      <span>Nguồn thu thập</span>
      <Select value={source} onChange={setSource} style={{ width: 100 }} options={[
        { value: 'all', label: 'Tất cả nguồn' },
        { value: 'manual', label: 'Cào thủ công' },
        { value: 'automatic', label: 'Cào tự động' },
      ]} />
    </Space>
    {error && <Alert style={{ marginBottom: 16 }} type="warning" showIcon title="Chưa tải được dữ liệu tiến trình" description={<>{error}. Kết quả đã lưu trong phiên vẫn hiển thị bên dưới. Bấm Làm mới để thử lại.</>} />}
    <Table loading={loading && !rows.length} rowKey="id" dataSource={rows} scroll={{ x: 800 }} pagination={{ pageSize: 10 }}
      locale={{ emptyText: 'Chưa có kết quả thu thập từ nguồn này' }} columns={[
        { title: 'Tài khoản', render: (_, { result }) => <strong>{result.display_name || result.username} (@{result.username.replace(/^@/, '')})</strong> },
        { title: 'Nền tảng', render: (_, row) => row.result.platform },
        { title: 'Nguồn', render: (_, row) => row.sources.length ? row.sources.map(value => <Tag key={value} color={value === 'manual' ? 'blue' : 'purple'}>{value === 'manual' ? 'Cào thủ công' : 'Cào tự động'}</Tag>) : <Tag>Tiến trình thu thập</Tag> },
        { title: 'Trạng thái', render: (_, row) => <Tag color="orange">{row.result.decision || 'Chưa đánh giá'}</Tag> },
        { title: 'Thao tác', render: (_, row) => <Button onClick={() => setSelected(row.result)}>Xem dữ liệu đã cào</Button> },
      ]} />
    {(overview?.stats?.review_pending || 0) > pending.length && <Alert type="info" showIcon title={`Hệ thống báo ${overview?.stats.review_pending} tài khoản chờ xem xét; dữ liệu tiến trình chỉ bao gồm 100 hoạt động gần nhất.`} />}
    {selected && <DirectCrawlModal open onClose={() => setSelected(null)} defaultInput={selected.username} initialResult={selected} />}
  </Card>;
}
