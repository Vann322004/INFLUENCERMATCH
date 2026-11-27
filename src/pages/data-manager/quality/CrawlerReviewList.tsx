import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Grid,
  Input,
  Pagination,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  DeleteOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  UndoOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { collectionNeedsComparison } from '../../../services/collectionDecision';
import {
  collectionIdentity,
  readCollectionResults,
  readDismissedIds,
  readDismissedReasons,
  dismissCollectionResult,
  dismissBatchCollectionResults,
  restoreCollectionResult,
  type CollectionResult,
} from '../../../services/collectionResults';
import { crawlerService } from '../../../services/api/crawlerService';
import type { CrawlPlatform, CrawlMonitorOverview, LiveCrawlResult } from '../../../types/api/crawler.types';
import DirectCrawlModal from '../jobs/components/DirectCrawlModal';

export default function CrawlerReviewList({ refreshKey }: { refreshKey: number }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [overview, setOverview] = useState<CrawlMonitorOverview | null>(null);
  const [mobilePage, setMobilePage] = useState(1);
  const [reviewCandidates, setReviewCandidates] = useState<LiveCrawlResult[]>([]);
  const [limitedQueue, setLimitedQueue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<LiveCrawlResult | null>(null);
  const [local, setLocal] = useState(readCollectionResults);
  const [source, setSource] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'dismissed' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(readDismissedIds);
  const [dismissedReasons, setDismissedReasons] = useState<Record<string, string>>(readDismissedReasons);
  const [batchEnqueuing, setBatchEnqueuing] = useState(false);

  useEffect(() => {
    const reload = () => {
      setLocal(readCollectionResults());
      setDismissedIds(readDismissedIds());
      setDismissedReasons(readDismissedReasons());
    };
    reload();
    window.addEventListener('im-collection-results', reload);
    return () => window.removeEventListener('im-collection-results', reload);
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.allSettled([crawlerService.getOverview(100), crawlerService.getReviewCandidates()])
      .then(([overviewResult, queueResult]) => {
        if (!active) return;
        setOverview(overviewResult.status === 'fulfilled' ? overviewResult.value : null);
        setReviewCandidates(queueResult.status === 'fulfilled' ? queueResult.value.items : []);
        setLimitedQueue(queueResult.status === 'fulfilled' && !queueResult.value.complete);
        const failures = [overviewResult, queueResult].filter(result => result.status === 'rejected');
        if (failures.length) setError(failures.map(result =>
          result.status === 'rejected' ? result.reason?.message || 'Không tải được đầy đủ danh sách đối chiếu.' : '').join(' '));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const records = useMemo(() => {
    const map = new Map<string, CollectionResult>(local.map((row) => [row.id, row]));

    for (const item of overview?.activities?.items || []) {
      const id = collectionIdentity(item.platform, item.username);
      const previous = map.get(id);
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
      map.set(id, {
        id,
        result,
        sources: previous?.sources || [],
        savedAt: item.updatedAt || previous?.savedAt || '',
      });
    }

    for (const result of reviewCandidates) {
      const id = collectionIdentity(result.platform, result.username);
      const previous = map.get(id);
      map.set(id, { id, sources: previous?.sources || [],
        savedAt: result.collected_at || previous?.savedAt || '',
        result: { ...previous?.result, ...result,
          followers: result.followers ?? previous?.result.followers,
          recent_posts: result.recent_posts ?? previous?.result.recent_posts,
        } });
    }
    return map;
  }, [local, overview, reviewCandidates]);

  const rows = useMemo(() => {
    return [...records.values()]
      .filter((row) => {
        const isOutcomeReview = collectionNeedsComparison(row.result);
        if (!isOutcomeReview) return false;

        // Lọc theo nguồn
        if (source !== 'all' && !row.sources.includes(source as 'manual' | 'automatic')) {
          return false;
        }

        const isDismissed = dismissedIds.has(row.id);
        // Lọc theo trạng thái quyết định của Manager
        if (statusFilter === 'active' && isDismissed) return false;
        if (statusFilter === 'dismissed' && !isDismissed) return false;

        // Lọc theo từ khóa tìm kiếm
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase().replace(/^@+/, '');
          const matchName = (row.result.display_name || '').toLowerCase().includes(q);
          const matchUser = (row.result.username || '').toLowerCase().includes(q);
          if (!matchName && !matchUser) return false;
        }

        return true;
      })
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }, [records, source, statusFilter, searchQuery, dismissedIds]);

  // Hành động: Loại bỏ 1 hồ sơ
  const handleDismiss = (id: string, username: string, reason?: string) => {
    dismissCollectionResult(id, reason);
    setDismissedIds(readDismissedIds());
    setDismissedReasons(readDismissedReasons());
    setSelectedRowKeys((keys) => keys.filter((k) => k !== id));
    message.success({
      content: (
        <span>
          Đã loại bỏ hồ sơ <strong>@{username}</strong>.{' '}
          <Button
            type="link"
            size="small"
            onClick={() => handleRestore(id, username)}
            style={{ padding: 0 }}
          >
            Hoàn tác
          </Button>
        </span>
      ),
      duration: 4,
    });
  };

  // Hành động: Khôi phục hồ sơ đã loại bỏ
  const handleRestore = (id: string, username: string) => {
    restoreCollectionResult(id);
    setDismissedIds(readDismissedIds());
    setDismissedReasons(readDismissedReasons());
    message.success(`Đã khôi phục hồ sơ @${username} về danh sách cần đối chiếu.`);
  };

  // Hành động hàng loạt: Loại bỏ nhiều hồ sơ đã chọn
  const handleBatchDismiss = () => {
    if (!selectedRowKeys.length) return;
    const ids = selectedRowKeys.map(String);
    dismissBatchCollectionResults(ids, 'Loại bỏ hàng loạt');
    setDismissedIds(readDismissedIds());
    setDismissedReasons(readDismissedReasons());
    setSelectedRowKeys([]);
    message.success(`Đã loại bỏ ${ids.length} hồ sơ khỏi danh sách cần đối chiếu.`);
  };

  // Hành động hàng loạt: Cào sâu tất cả hồ sơ đã chọn
  const handleBatchEnqueueDeep = async () => {
    if (!selectedRowKeys.length) return;
    setBatchEnqueuing(true);
    let successCount = 0;
    const ids = selectedRowKeys.map(String);
    for (const id of ids) {
      const row = records.get(id);
      if (!row) continue;
      try {
        await crawlerService.enqueueCandidate(
          (row.result.platform || 'TIKTOK') as CrawlPlatform,
          row.result.username,
          true
        );
        dismissCollectionResult(id, 'Đã đưa vào cào sâu');
        successCount++;
      } catch {}
    }
    setDismissedIds(readDismissedIds());
    setDismissedReasons(readDismissedReasons());
    setSelectedRowKeys([]);
    setBatchEnqueuing(false);
    message.success(`Đã gửi yêu cầu cào sâu cho ${successCount}/${ids.length} hồ sơ đã chọn.`);
  };

  return (
    <section className="quality-crawler-box">
      <header className="quality-config-title">
        <h2>Đối chiếu dữ liệu hồ sơ</h2>
        <p>
          Kiểm tra các nhà sáng tạo được quét từ tiến trình thu thập. Người thẩm định có thể đối chiếu bài viết,
          chọn <strong>Cào sâu</strong> để chuyển sang bước kiểm định hoặc <strong>Loại bỏ</strong> các tài khoản không phù hợp.
        </p>
      </header>

      {/* Thanh lọc & Tìm kiếm */}
      <div
        className="quality-filter-box quality-source-filter-bar"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <label htmlFor="crawler-source-filter" style={{ fontWeight: 600, fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
            Nguồn:
          </label>
          <Select
            id="crawler-source-filter"
            value={source}
            onChange={setSource}
            style={{ width: isMobile ? '100%' : 170 }}
            options={[
              { value: 'all', label: 'Tất cả nguồn' },
              { value: 'manual', label: 'Thu thập thủ công' },
              { value: 'automatic', label: 'Thu thập tự động' },
            ]}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <label style={{ fontWeight: 600, fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>Trạng thái:</label>
          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setSelectedRowKeys([]);
            }}
            style={{ width: isMobile ? '100%' : 180 }}
            options={[
              { value: 'active', label: 'Cần đối chiếu' },
              { value: 'dismissed', label: 'Đã loại bỏ' },
              { value: 'all', label: 'Tất cả hồ sơ' },
            ]}
          />
        </div>

        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}>
          <Input
            placeholder="Tìm theo tên kênh hoặc @username..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Thanh thao tác hàng loạt khi có dòng được chọn */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ color: '#0369A1', fontWeight: 600 }}>
            Đã chọn {selectedRowKeys.length} hồ sơ
          </div>
          <Space size={8}>
            {statusFilter !== 'dismissed' && (
              <>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  loading={batchEnqueuing}
                  style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 600 }}
                  onClick={handleBatchEnqueueDeep}
                >
                  Cào sâu đã chọn
                </Button>
                <Popconfirm
                  title={`Loại bỏ ${selectedRowKeys.length} hồ sơ đã chọn?`}
                  description="Các hồ sơ này sẽ được loại bỏ khỏi danh sách đối chiếu."
                  okText="Loại bỏ tất cả"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleBatchDismiss}
                >
                  <Button danger icon={<DeleteOutlined />} style={{ fontWeight: 600 }}>
                    Loại bỏ đã chọn
                  </Button>
                </Popconfirm>
              </>
            )}
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              Bỏ chọn
            </Button>
          </Space>
        </div>
      )}

      {error && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          title="Chưa tải được dữ liệu tiến trình"
          description={<>{error}. Kết quả đã lưu trong phiên vẫn hiển thị bên dưới. Bấm Làm mới dữ liệu để thử lại.</>}
        />
      )}

      {limitedQueue && <Alert type="info" showIcon style={{ marginBottom: 16 }}
        title="Đã tải hồ sơ chờ manager duyệt"
        description="Máy chủ chưa hỗ trợ đầy đủ danh sách đối chiếu. Hiện đang hiển thị hồ sơ chờ duyệt và dữ liệu thu thập gần nhất; một số hồ sơ thiếu dữ liệu có thể chưa xuất hiện." />}

      {loading && !rows.length ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : !rows.length ? (
        <Empty
          description={
            records.size > 0
              ? 'Không có hồ sơ khớp bộ lọc hiện tại. Hồ sơ đã ẩn nằm trong mục Đã loại bỏ.'
              : statusFilter === 'dismissed'
              ? 'Không có hồ sơ nào trong mục Đã loại bỏ.'
              : 'Không có hồ sơ cần đối chiếu từ nguồn này.'
          }
        >
          {records.size > 0 && <Button onClick={() => {
            setSource('all'); setStatusFilter('all'); setSearchQuery('');
          }}>Bỏ bộ lọc và xem cả hồ sơ đã ẩn</Button>}
        </Empty>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.slice((mobilePage - 1) * 10, mobilePage * 10).map((row) => {
            const { result } = row;
            const isDismissed = dismissedIds.has(row.id);
            const reason = dismissedReasons[row.id];
            const checked = selectedRowKeys.includes(row.id);
            return (
              <div
                key={row.id}
                style={{
                  border: checked ? '1px solid #7C3AED' : '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: 12,
                  background: checked ? '#F3E8FF' : '#FAF8FF',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => {
                        setSelectedRowKeys((prev) =>
                          e.target.checked ? [...prev, row.id] : prev.filter((k) => k !== row.id)
                        );
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5, wordBreak: 'break-word' }}>
                        {result.display_name || result.username}
                      </div>
                      <div style={{ fontSize: 12, color: '#7C3AED' }}>@{result.username.replace(/^@/, '')}</div>
                    </div>
                  </div>
                  <Tag color="geekblue" style={{ fontWeight: 600, borderRadius: 4, marginInlineEnd: 0 }}>
                    {result.platform}
                  </Tag>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, fontSize: 12, color: '#475569' }}>
                  <span>
                    {result.followers == null ? 'Chưa có followers' : `${result.followers.toLocaleString('vi-VN')} followers`}
                  </span>
                  <span>·</span>
                  <span>
                    {result.recent_posts == null ? 'Chưa có bài viết' : `${result.recent_posts.length} bài`}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {row.sources.length ? (
                    row.sources.map((value) => (
                      <Tag key={value} color={value === 'manual' ? 'blue' : 'purple'} style={{ borderRadius: 4, marginInlineEnd: 0 }}>
                        {value === 'manual' ? 'Thu thập thủ công' : 'Thu thập tự động'}
                      </Tag>
                    ))
                  ) : (
                    <Tag style={{ borderRadius: 4, marginInlineEnd: 0 }}>Hệ thống / Kiểm định lại</Tag>
                  )}
                  {isDismissed ? (
                    <Tag color="default" style={{ borderRadius: 4, fontWeight: 600, marginInlineEnd: 0 }}>Đã loại bỏ</Tag>
                  ) : (
                    <Tag color="orange" style={{ borderRadius: 4, fontWeight: 600, marginInlineEnd: 0 }}>
                      {result.decision === 'SKIP_INSUFFICIENT' ? 'Thiếu dữ liệu xác minh'
                        : result.decision === 'RETRY_PREFLIGHT' ? 'Cần kiểm tra lại' : 'Cần đối chiếu'}
                    </Tag>
                  )}
                </div>
                {isDismissed && reason && (
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>{reason}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isDismissed ? (
                    <Button size="small" icon={<UndoOutlined />} onClick={() => handleRestore(row.id, result.username)}>
                      Khôi phục
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setSelected(result)}
                      style={{ background: '#F3E8FF', borderColor: '#DDD6FE', color: '#7C3AED', fontWeight: 600 }}
                    >
                      Đối chiếu
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <Pagination current={mobilePage} pageSize={10} total={rows.length} size="small" onChange={setMobilePage} />
          </div>
        </div>
      ) : (
        <Table
          loading={loading}
          rowKey="id"
          dataSource={rows}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={[
            {
              title: 'Tài khoản',
              ellipsis: true,
              render: (_, { result }) => (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.display_name || result.username}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    @{result.username.replace(/^@/, '')}
                  </div>
                </div>
              ),
            },
            {
              title: 'Nền tảng',
              width: 92,
              render: (_, row) => (
                <Tag color="geekblue" style={{ fontWeight: 600, borderRadius: 4, marginInlineEnd: 0 }}>
                  {row.result.platform}
                </Tag>
              ),
            },
            {
              title: 'Chỉ số',
              render: (_, row) => (
                <div style={{ fontSize: 12.5 }}>
                  <div>
                    {row.result.followers == null ? (
                      <span style={{ color: '#94A3B8' }}>Chưa có followers</span>
                    ) : (
                      <strong style={{ color: '#0F172A' }}>{row.result.followers.toLocaleString('vi-VN')}</strong>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    {row.result.recent_posts == null ? 'Chưa có bài viết' : `${row.result.recent_posts.length} bài`}
                  </div>
                </div>
              ),
            },
            {
              title: 'Nguồn',
              render: (_, row) =>
                row.sources.length ? (
                  row.sources.map((value) => (
                    <Tag key={value} color={value === 'manual' ? 'blue' : 'purple'} style={{ borderRadius: 4, marginInlineEnd: 0, whiteSpace: 'normal' }}>
                      {value === 'manual' ? 'Thu thập thủ công' : 'Thu thập tự động'}
                    </Tag>
                  ))
                ) : (
                  <Tag style={{ borderRadius: 4, marginInlineEnd: 0, whiteSpace: 'normal' }}>Hệ thống / Kiểm định lại</Tag>
                ),
            },
            {
              title: 'Trạng thái',
              render: (_, row) => {
                const isDismissed = dismissedIds.has(row.id);
                if (isDismissed) {
                  const reason = dismissedReasons[row.id];
                  return (
                    <div>
                      <Tag color="default" style={{ borderRadius: 4, fontWeight: 600, marginInlineEnd: 0 }}>
                        Đã loại bỏ
                      </Tag>
                      {reason && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, lineHeight: 1.3 }}>
                          {reason}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Tag color="orange" style={{ borderRadius: 4, fontWeight: 600, marginInlineEnd: 0, whiteSpace: 'normal' }}>
                    {row.result.decision === 'SKIP_INSUFFICIENT' ? 'Thiếu dữ liệu xác minh'
                      : row.result.decision === 'RETRY_PREFLIGHT' ? 'Cần kiểm tra lại' : 'Cần đối chiếu'}
                  </Tag>
                );
              },
            },
            {
              title: 'Thao tác',
              key: 'actions',
              align: 'right',
              width: 110,
              render: (_, row) => {
                const isDismissed = dismissedIds.has(row.id);

                if (isDismissed) {
                  return (
                    <Button
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={() => handleRestore(row.id, row.result.username)}
                    >
                      Khôi phục
                    </Button>
                  );
                }

                return (
                  <Tooltip title="Mở chi tiết để đối chiếu thông tin, cào sâu hoặc loại bỏ hồ sơ">
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setSelected(row.result)}
                    >
                      Đối chiếu
                    </Button>
                  </Tooltip>
                );
              },
            },
          ]}
        />
      )}

      {reviewCandidates.length > 0 && (
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          title={`Hàng chờ có ${reviewCandidates.length} hồ sơ cần đối chiếu. Thiếu dữ liệu xác minh chưa phải là quyết định từ chối.`}
        />
      )}

      {selected && (
        <DirectCrawlModal
          open
          onClose={() => setSelected(null)}
          defaultInput={selected.username}
          initialResult={selected}
          onDismiss={(res, reason) => {
            const id = collectionIdentity(res.platform, res.username);
            handleDismiss(id, res.username, reason);
          }}
          onImportSuccess={(res) => {
            const id = collectionIdentity(res.platform, res.username);
            dismissCollectionResult(id, 'Đã yêu cầu cào sâu');
            setDismissedIds(readDismissedIds());
            setDismissedReasons(readDismissedReasons());
          }}
        />
      )}
    </section>
  );
}
