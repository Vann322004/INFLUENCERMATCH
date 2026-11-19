import { collectionOutcome } from '../../../services/collectionDecision';
import { collectionIdentity, readCollectionResults, type CollectionResult } from '../../../services/collectionResults';
import { useEffect, useState } from 'react';
import { Alert, Button, Empty, Select, Skeleton, Table, Tag } from 'antd';
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
    crawlerService
      .getOverview(100)
      .then((result) => {
        if (active) setOverview(result);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không tải được danh sách chờ xem xét từ crawler.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const records = new Map<string, CollectionResult>(local.map((row) => [row.id, row]));
  const pending = (overview?.activities?.items || []).filter(
    (item) => collectionOutcome(item.decision, item.primaryType) === 'review'
  );

  for (const item of overview?.activities?.items || []) {
    const id = collectionIdentity(item.platform, item.username);
    const previous = records.get(id);
    const snapshot = overview?.crawled_data?.items?.find(
      (row) => collectionIdentity(row.creator.platform, row.creator.username) === id
    );
    const result: LiveCrawlResult = {
      ...(previous?.result || {}),
      status: 'success',
      platform: item.platform,
      username: item.username,
      display_name: item.displayName || previous?.result.display_name,
      decision: item.decision,
      primary_type: item.primaryType,
      followers: snapshot?.creator.followers ?? previous?.result.followers,
      avatar_url: snapshot?.creator.avatarUrl || previous?.result.avatar_url,
      bio: snapshot?.creator.bio ?? previous?.result.bio,
      is_verified: snapshot?.creator.isVerified ?? previous?.result.is_verified,
      recent_posts: snapshot?.recentPosts ?? previous?.result.recent_posts,
      collected_at: snapshot?.collectedAt || previous?.result.collected_at,
    };
    records.set(id, {
      id,
      result,
      sources: previous?.sources || [],
      savedAt: item.updatedAt || previous?.savedAt || '',
    });
  }

  const rows = [...records.values()]
    .filter(
      (row) =>
        collectionOutcome(row.result.decision, row.result.primary_type) === 'review' &&
        (source === 'all' || row.sources.includes(source as 'manual' | 'automatic'))
    )
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return (
    <section className="quality-crawler-box">
      <header className="quality-config-title">
        <h2>Đối chiếu dữ liệu hồ sơ</h2>
        <p>
          Chỉ hiển thị nhà sáng tạo cần xem xét thêm. Mở hồ sơ để đối chiếu thông tin tài khoản và bài viết đã thu thập
          trước khi kiểm định. Hồ sơ đã đồng bộ và đủ điều kiện nằm trong tab Hồ sơ chờ kiểm định.
        </p>
      </header>

      <div className="quality-filter-box quality-source-filter-bar">
        <label htmlFor="crawler-source-filter">Nguồn thu thập</label>
        <Select
          id="crawler-source-filter"
          value={source}
          onChange={setSource}
          size="large"
          style={{ width: 220 }}
          options={[
            { value: 'all', label: 'Tất cả nguồn' },
            { value: 'manual', label: 'Thu thập thủ công' },
            { value: 'automatic', label: 'Thu thập tự động' },
          ]}
        />
      </div>

      {error && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          title="Chưa tải được dữ liệu tiến trình"
          description={<>{error}. Kết quả đã lưu trong phiên vẫn hiển thị bên dưới. Bấm Làm mới dữ liệu để thử lại.</>}
        />
      )}

      {loading && !rows.length ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : !rows.length ? (
        <Empty description="Không có hồ sơ cần đối chiếu từ nguồn này." />
      ) : (
        <Table
          loading={loading}
          rowKey="id"
          dataSource={rows}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Tài khoản',
              render: (_, { result }) => (
                <strong>
                  {result.display_name || result.username} (@{result.username.replace(/^@/, '')})
                </strong>
              ),
            },
            { title: 'Nền tảng', render: (_, row) => row.result.platform },
            {
              title: 'Người theo dõi',
              render: (_, row) => row.result.followers == null ? 'Chưa có dữ liệu' : row.result.followers.toLocaleString('vi-VN'),
            },
            {
              title: 'Bài viết đã thu thập',
              render: (_, row) => row.result.recent_posts == null ? 'Chưa có dữ liệu' : `${row.result.recent_posts.length} bài`,
            },
            {
              title: 'Nguồn',
              render: (_, row) =>
                row.sources.length ? (
                  row.sources.map((value) => (
                    <Tag key={value} color={value === 'manual' ? 'blue' : 'purple'}>
                      {value === 'manual' ? 'Thu thập thủ công' : 'Thu thập tự động'}
                    </Tag>
                  ))
                ) : (
                  <Tag>Tiến trình thu thập</Tag>
                ),
            },
            {
              title: 'Yêu cầu xem xét',
              render: () => <Tag color="orange">Cần đối chiếu</Tag>,
            },
            {
              title: 'Thao tác',
              align: 'right',
              render: (_, row) => (
                <Button onClick={() => setSelected(row.result)}>Đối chiếu hồ sơ</Button>
              ),
            },
          ]}
        />
      )}

      {(overview?.stats?.review_pending || 0) > pending.length && (
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          title={`Hệ thống báo ${overview?.stats.review_pending} tài khoản chờ xem xét; dữ liệu tiến trình chỉ bao gồm 100 hoạt động gần nhất.`}
        />
      )}

      {selected && (
        <DirectCrawlModal open onClose={() => setSelected(null)} defaultInput={selected.username} initialResult={selected} />
      )}
    </section>
  );
}
