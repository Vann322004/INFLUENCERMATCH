import { collectionOutcomeLabel } from '../../../../../services/collectionDecision';
import { collectionOutcome } from '../../../../../services/collectionDecision';
import { saveCollectionResults } from '../../../../../services/collectionResults';
import { useCollectionState } from '../../../../../hooks/useCollectionState';
import type { LiveCrawlResult } from '../../../../../types/api/crawler.types';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, message, Table, Tag } from 'antd';
import HunterSetupCard from './HunterSetupCard';
import { nicheService, type Niche } from '../../../../../services/api/nicheService';
import HunterRadarScanner from './HunterRadarScanner';
import DiscoveredFeedCard, { type DiscoveredKocItem } from './DiscoveredFeedCard';
import DirectCrawlModal from '../DirectCrawlModal';
import { crawlerService } from '../../../../../services/api/crawlerService';
import { dataQualityService } from '../../../../../services/api/dataQualityService';
import type { CrawlPlatform } from '../../../../../types/api/crawler.types';

// Kiểm tra tài khoản shop, bán sỉ, kho hàng
function isShopAccount(username: string, displayName?: string, bio?: string): boolean {
  const text = `${username} ${displayName || ''} ${bio || ''}`.toLowerCase();
  const shopPatterns = [
    /(\b|_|\.)shop(\b|_|\.|\d|$)/i,
    /(\b|_|\.)store(\b|_|\.|\d|$)/i,
    /(\b|_|\.)boutique(\b|_|\.|\d|$)/i,
    /(\b|_|\.)tongkho(\b|_|\.|\d|$)/i,
    /(\b|_|\.)khohang(\b|_|\.|\d|$)/i,
    /(\b|_|\.)bansi(\b|_|\.|\d|$)/i,
    /(\b|_|\.)sile(\b|_|\.|\d|$)/i,
    /(\b|_|\.)order(\b|_|\.|\d|$)/i,
    /bán sỉ/i,
    /sỉ lẻ/i,
    /tổng kho/i,
    /kho buôn/i,
    /cửa hàng/i,
    /chuyên sỉ/i,
    /giỏ hàng/i,
    /bấm vào giỏ hàng/i,
    /đơn hàng/i,
    /từng đơn hàng/i,
    /chốt đơn/i,
    /lên đơn/i,
    /đặt hàng/i,
    /mua hàng/i,
    /hoàn tiền/i,
    /1 đổi 1/i,
    /lỗi 1/i,
    /đổi trả/i,
    /bao đổi trả/i,
    /ủng hộ em/i,
    /ủng hộ shop/i,
    /hàng có sẵn/i,
    /sẵn kho/i,
    /sẵn hàng/i,
    /xả kho/i,
    /thanh lý/i,
    /ship cod/i,
    /đồng kiểm/i,
    /cho xem hàng/i,
    /kiểm tra hàng/i,
    /freeship/i,
    /báo giá/i,
    /giá sỉ/i,
  ];
  return shopPatterns.some((pattern) => pattern.test(text));
}

export default function AutoHunterTab() {
  const [mode, setMode] = useCollectionState<'category' | 'custom'>('hunter.mode', 'category');
  const [platform, setPlatform] = useCollectionState<string>('hunter.platform', 'ALL');
  const [topics, setTopics] = useState<Niche[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [topicsVersion, setTopicsVersion] = useState(0);
  const [selectedTopic, setSelectedTopic] = useCollectionState<string>('hunter.selectedTopic', '');
  const [activeKeywords, setActiveKeywords] = useCollectionState<string[]>('hunter.activeKeywords', []);
  const [customUsernames, setCustomUsernames] = useCollectionState<string>('hunter.customUsernames', '');
  const [maxKocs, setMaxKocs] = useCollectionState<number>('hunter.maxKocs', 5);
  const [loading, setLoading] = useCollectionState<boolean>('hunter.loading', false, false);

  // Radar state — driven bởi response thực từ API
  const [currentKeyword, setCurrentKeyword] = useCollectionState<string>('hunter.currentKeyword', '');
  const [progressPercent, setProgressPercent] = useCollectionState<number>('hunter.progressPercent', 0);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [huntError, setHuntError] = useState('');
  useEffect(() => {
    if (!loading) return;
    setWaitSeconds(0);
    setHuntError('');
    const started = Date.now();
    const timer = setInterval(() => setWaitSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const [scannedCount, setScannedCount] = useCollectionState<number>('hunter.scannedCount', 0);
  const [filteredOutCount, setFilteredOutCount] = useCollectionState<number>('hunter.filteredOutCount', 0);
  const [pendingReviewCount, setPendingReviewCount] = useCollectionState<number | null>('hunter.pendingReviewCount', null);
  const [matchedCount, setMatchedCount] = useCollectionState<number>('hunter.matchedCount', 0);
  const [logLines, setLogLines] = useCollectionState<string[]>('hunter.logLines', []);

  // Discovered Feed
  const [discoveredList, setDiscoveredList] = useCollectionState<DiscoveredKocItem[]>('hunter.discoveredList', []);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectUsername, setInspectUsername] = useState<string>('');

  const [rawResults, setRawResults] = useCollectionState<LiveCrawlResult[]>('hunter.results', []);
  const feedRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    nicheService.list().then(rows => {
      if (!active) return;
      const enabled = rows.filter(row => row.active);
      setTopics(enabled);
      if (!enabled.some(topic => topic.id === selectedTopic)) {
        setSelectedTopic(enabled[0]?.id || '');
        setActiveKeywords(enabled[0]?.keywords || []);
      }
    }).catch((error) => {
      if (!active) return;
      setTopics([]);
      setSelectedTopic('');
      setActiveKeywords([]);
      const status = error?.response?.status;
      const detail = status === 401 ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
        : status === 403 ? 'Yêu cầu bị từ chối. Kiểm tra quyền tài khoản hoặc cấu hình máy chủ.'
        : status === 404 ? 'Máy chủ chưa có API quản lý lĩnh vực. Cần cập nhật backend.'
        : status >= 500 ? 'Máy chủ gặp lỗi khi tải lĩnh vực. Vui lòng thử lại sau.'
        : error?.message === 'INVALID_CRAWL_FIELDS_RESPONSE' ? 'Dữ liệu lĩnh vực trả về không đúng định dạng.'
        : 'Không kết nối được API lĩnh vực. Vui lòng kiểm tra kết nối và thử lại.';
      setTopicsError(`Không tải được lĩnh vực tìm nhà sáng tạo${status ? ` (HTTP ${status})` : ''}. ${detail}`);
    }).finally(() => { if (active) setTopicsLoading(false); });
    return () => { active = false; };
  }, [topicsVersion]);

  const reloadTopics = () => {
    setTopicsLoading(true);
    setTopicsError('');
    setTopicsVersion(value => value + 1);
  };

  const handleNavigateQuality = () => {
    const target = location.pathname.startsWith('/data-manager')
      ? '/data-manager/data-quality'
      : '/admin/data-quality';
    navigate(target);
  };

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopic(topicId);
    const found = topics.find((t) => t.id === topicId);
    if (found) setActiveKeywords(found.keywords || []);
  };

  const handleStartHunting = async () => {
    if (loading) return;
    let usernamesToCrawl: string[] = [];

    if (mode === 'custom') {
      usernamesToCrawl = customUsernames
        .split(/[\n,]+/)
        .map((u) => u.trim().replace(/^@/, ''))
        .filter(Boolean);

      if (usernamesToCrawl.length === 0) {
        message.warning('Vui lòng nhập ít nhất 1 username hoặc link kênh!');
        return;
      }
    } else {
      if (topicsLoading || topicsError || !topics.some(topic => topic.id === selectedTopic)) {
        message.warning('Vui lòng chọn một lĩnh vực đang bật.');
        return;
      }
      if (activeKeywords.length === 0) {
        message.warning('Vui lòng chọn hoặc nhập ít nhất 1 từ khóa để tìm nhà sáng tạo!');
        return;
      }
    }

    setLoading(true);
    setProgressPercent(15);
    setScannedCount(0);
    setFilteredOutCount(0);
    setMatchedCount(0);
    setDiscoveredList([]);

    const now = () => new Date().toLocaleTimeString('vi-VN');
    const topicObj = topics.find((t) => t.id === selectedTopic);
    const categoryCode = topicObj?.name || '';
    const crawlPlatform = platform as CrawlPlatform;

    if (mode === 'custom') {
      setLogLines([
        `[${now()}] Bắt đầu cào ${usernamesToCrawl.length} tài khoản từ danh sách chỉ định...`,
        `[${now()}] Danh sách mục tiêu: ${usernamesToCrawl.slice(0, 5).join(', ')}${usernamesToCrawl.length > 5 ? '...' : ''}`,
      ]);
      setCurrentKeyword(usernamesToCrawl[0] || 'custom');
    } else {
      setLogLines([
        `[${now()}] Bắt đầu cào ${maxKocs} kênh thuộc lĩnh vực ${topicObj?.name}...`,
        `[${now()}] Nền tảng: ${platform === 'ALL' ? 'Tất cả nền tảng (TikTok + Facebook)' : platform} | Từ khóa: ${activeKeywords.join(', ')}`,
      ]);
      setCurrentKeyword(activeKeywords[0] || categoryCode || '');
    }

    // No fabricated progress: the batch endpoint responds when the request completes.
    const timer1 = setTimeout(() => {
      setLogLines((prev) => [`[${now()}] Yêu cầu vẫn đang chạy; chưa nhận kết quả từ crawler.`, ...prev]);
    }, 15000);
    const timer2 = setTimeout(() => {
      setLogLines((prev) => [`[${now()}] Sau 60 giây chưa nhận kết quả. Chưa xác nhận cào thành công.`, ...prev]);
    }, 60000);

    try {
      const res = await crawlerService.batchCrawl({
        platform: crawlPlatform,
        category: mode === 'category' ? categoryCode : undefined,
        keywords: mode === 'category' ? activeKeywords : undefined,
        usernames: mode === 'custom' ? usernamesToCrawl : undefined,
        maxChannels: maxKocs,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const summary = res.summary;
      const totalReq = summary?.total_requested ?? (res.results?.length ?? maxKocs);
      const failedCnt = summary?.failed_count ?? 0;

      setRawResults(res.results || []);
      const rawResults = (res.results || []).filter((r) => r.status === 'success' && !!r.username).map(r => ({ ...r }));

      // Áp dụng bộ lọc Tier-0 Guards
      let shopFilteredCount = 0;
      let lowFollowersCount = 0;
      const passedResults: typeof rawResults = [];
      const shopRemovedNames: string[] = [];
      const reviewPendingCandidates: { username: string; platform: string }[] = [];

      for (const r of rawResults) {
        const uname = r.username || '';
        const dname = r.display_name || '';
        const bio = r.bio || '';
        const followers = r.followers || 0;

        // 1. Loại bỏ tài khoản Shop / thương mại
        if (isShopAccount(uname, dname, bio)) {
          r.decision = 'AUTO_REJECT';
          shopFilteredCount++;
          shopRemovedNames.push(`@${uname.replace(/^@/, '')}`);
          continue;
        }

        // 2. Loại bỏ tài khoản dưới 7.000 followers
        if (followers < 7000) {
          r.decision = 'SKIP_INSUFFICIENT';
          lowFollowersCount++;
          continue;
        }

        // 3. Loại bỏ nếu Backend Rule Engine từ chối (Brand / Shop / Spam)
        if (collectionOutcome(r.decision, r.primary_type) === 'rejected' || r.primary_type === 'BRAND' || r.primary_type === 'SPAM') {
          r.decision = 'AUTO_REJECT';
          shopFilteredCount++;
          shopRemovedNames.push(`@${uname.replace(/^@/, '')}`);
          continue;
        }

        const outcome = collectionOutcome(r.decision, r.primary_type);
        if (outcome === 'review') {
          reviewPendingCandidates.push({ username: uname, platform: r.platform || 'TIKTOK' });
          continue;
        }
        if (outcome === 'accepted') passedResults.push(r);
      }

      saveCollectionResults(res.results || [], mode === 'custom' ? 'manual' : 'automatic');

      const totalExcluded = failedCnt + shopFilteredCount + lowFollowersCount;
      setScannedCount(totalReq);
      setFilteredOutCount(totalExcluded);
      setMatchedCount(passedResults.length);

      if (passedResults.length > 0) {
        const mappedList: DiscoveredKocItem[] = passedResults.map((r, idx) => {
          const username = (r.username || `koc_${idx}`).replace(/^@/, '');
          const followers = r.followers || 0;
          // Chỉ coi là KOL khi có tick xanh chính thức hoặc backend phân loại KOL, còn lại ưu tiên chuẩn KOC
          const isKol = r.primary_type === 'KOL' || r.decision === 'AUTO_ACCEPT_KOL';

          return {
            id: `koc_${r.author_id || username}_${idx}`,
            username,
            displayName: r.display_name || username,
            platform: r.platform || 'TIKTOK',
            followers,
            heartCount: r.heart_count,
            videoCount: r.video_count,
            avatarUrl: r.avatar_url,
            profileUrl: r.profile_url,
            topicKeyword: activeKeywords[idx % activeKeywords.length] || categoryCode.toLowerCase(),
            primaryType: isKol ? 'KOL' : 'KOC',
            decision: r.decision,
            bio: r.bio,
            latencyMs: r.latency_ms,
            status: r.database_synced ? 'INGESTED' : 'DISCOVERED',
          };
        });

        // Live API already attempts ingest. Do not recrawl completed profiles automatically.
        const queuedCount = passedResults.filter(result => result.database_synced).length;
        setProgressPercent(100);
        setDiscoveredList(mappedList);

        const newLogs = [
          `[${now()}] Đã xử lý ${res.results?.length ?? 0}/${totalReq} kênh yêu cầu; ${mappedList.length} nhà sáng tạo đạt chuẩn Tier-0. ${(res.results?.length ?? 0) < totalReq ? "Nguồn tìm kiếm chưa trả đủ kênh phù hợp." : ""}`,
        ];
        if (shopFilteredCount > 0) {
          newLogs.push(`[${now()}] Đã loại bỏ ${shopFilteredCount} tài khoản Shop/Kho hàng: ${shopRemovedNames.join(', ')}`);
        }
        if (lowFollowersCount > 0) {
          newLogs.push(`[${now()}] Đã loại bỏ ${lowFollowersCount} tài khoản có lượng theo dõi dưới 7.000.`);
        }
        if (totalExcluded > 0) {
          newLogs.push(`[${now()}] Có ${totalExcluded} kênh cào lỗi hoặc bị lọc Tier-0. Chưa xác nhận có hồ sơ chờ kiểm định trên hệ thống.`);
        }
        setLogLines(newLogs);
        message.success(`Đã thu thập ${mappedList.length} nhà sáng tạo; ${queuedCount} hồ sơ đã lưu vào DB.`);

        if (reviewPendingCandidates.length > 0) {
          message.info({
            content: (
              <span>
                Có {totalExcluded} kênh chưa đạt tự động.{' '}
              </span>
            ),
            duration: 6,
          });
        }

        // Tự động cuộn xuống bảng kết quả
        setTimeout(() => {
          feedRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        setProgressPercent(100);
        const reason = shopFilteredCount > 0
          ? `Tất cả kênh đều là tài khoản Shop (${shopRemovedNames.join(', ')}) hoặc dưới 7.000 followers.`
          : 'Không có tài khoản nào đạt tiêu chuẩn Tier-0 trong danh mục này.';
        setLogLines([
          `[${now()}] ${reason}`,
          totalExcluded > 0
            ? `[${now()}] Có ${totalExcluded} kênh cào lỗi hoặc bị lọc Tier-0; số này không phải số hồ sơ chờ kiểm định.`
            : `[${now()}] Gợi ý: Hãy thử chọn danh mục khác hoặc tăng số lượng mục tiêu cào.`,
        ]);
        message.warning({
          content: (
            <span>
              Không có nhà sáng tạo nào đạt chuẩn tự động (cào lỗi hoặc bị lọc {totalExcluded} kênh).{' '}
            </span>
          ),
          duration: 6,
        });
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setProgressPercent(0);
      setHuntError(err.message || 'Crawler request failed');
      setLogLines((prev) => [`[${now()}] Lỗi kết nối máy chủ cào: ${err.message || 'Không thể lấy dữ liệu'}`, ...prev]);
      message.error(err.message || 'Lỗi khi gọi API cào dữ liệu');
    } finally {
      setLoading(false);
      setPendingReviewCount(null);
      dataQualityService.pending(0, 1)
        .then(result => setPendingReviewCount(result.totalElements))
        .catch(() => setPendingReviewCount(null));
    }
  };

  const handleImportSingle = async (item: DiscoveredKocItem) => {
    message.loading({ content: `Đang lưu @${item.username} vào hệ thống...`, key: 'imp_single' });
    try {
      await crawlerService.enqueueCandidate(item.platform as any, item.username, true);
      setDiscoveredList((prev) =>
        prev.map((k) => (k.id === item.id ? { ...k, status: 'QUEUED' } : k))
      );
      message.success({ content: `Đã đưa @${item.username} vào hàng đợi đồng bộ.`, key: 'imp_single' });
    } catch {
      message.error({ content: 'Lỗi khi lưu nhà sáng tạo', key: 'imp_single' });
    }
  };

  const handleImportAll = async () => {
    if (discoveredList.length === 0) return;
    message.loading({ content: `Đang đồng bộ ${discoveredList.length} nhà sáng tạo vào Database...`, key: 'imp_all' });
    try {
      const submissions = await Promise.allSettled(
        discoveredList.map((k) =>
          crawlerService.enqueueCandidate(k.platform as any, k.username, false)
        )
      );
      const queuedIds = new Set(discoveredList.filter((_, index) => submissions[index].status === 'fulfilled').map(item => item.id));
      setDiscoveredList(prev => prev.map(item => queuedIds.has(item.id) ? { ...item, status: 'QUEUED' } : item));
      const failedCount = submissions.length - queuedIds.size;
      message[failedCount ? 'warning' : 'success']({ content: `Đã gửi ${queuedIds.size} hồ sơ vào hàng đợi.${failedCount ? ` ${failedCount} hồ sơ gửi thất bại, hãy thử lại.` : ''}`, key: 'imp_all' });
    } catch {
      message.error({ content: 'Lỗi khi lưu danh sách nhà sáng tạo', key: 'imp_all' });
    }
  };

  const handleInspectDetail = (item: DiscoveredKocItem) => {
    setInspectUsername(item.username);
    setInspectModalOpen(true);
  };

  return (
    <div>
      {topicsError && <Alert type="error" showIcon title={topicsError} style={{ marginBottom: 16 }} />}
      <HunterSetupCard
        topics={topics}
        topicsLoading={topicsLoading}
        topicsError={topicsError}
        topicsManagementPath={`${location.pathname.startsWith('/data-manager') ? '/data-manager' : '/admin'}/data-sources`}
        onReloadTopics={reloadTopics}
        mode={mode}
        onModeChange={setMode}
        platform={platform}
        selectedTopic={selectedTopic}
        activeKeywords={activeKeywords}
        customUsernames={customUsernames}
        onCustomUsernamesChange={setCustomUsernames}
        maxKocs={maxKocs}
        loading={loading}
        onPlatformChange={setPlatform}
        onSelectTopic={handleSelectTopic}
        onKeywordsChange={setActiveKeywords}
        onMaxKocsChange={setMaxKocs}
        onStartHunting={handleStartHunting}
      />

      {loading && <Alert showIcon type="info" style={{ marginBottom: 16 }}
        message={`Đang chờ kết quả — ${Math.floor(waitSeconds / 60)} phút ${waitSeconds % 60} giây`}
        description="Yêu cầu chưa kết thúc. Không bấm gửi lại; kết quả hoặc lỗi sẽ hiện tại đây khi API phản hồi." />}
      {huntError && <Alert showIcon type="error" style={{ marginBottom: 16 }}
        message="Lượt săn chưa hoàn tất" description={huntError} />}
      {(loading || logLines.length > 0) && (
        <HunterRadarScanner
          loading={loading}
          currentKeyword={currentKeyword}
          progressPercent={progressPercent}
          scannedCount={scannedCount}
          filteredOutCount={filteredOutCount}
          pendingReviewCount={pendingReviewCount}
          matchedCount={matchedCount}
          logLines={logLines}
          onNavigateQuality={handleNavigateQuality}
        />
      )}

      {rawResults.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Danh sách kênh vừa thử cào ({rawResults.length})</h3>
          <Table<LiveCrawlResult> dataSource={rawResults}
            rowKey={(row) => `${row.platform}:${row.username}`}
            pagination={{ pageSize: 10 }} scroll={{ x: 900 }}
            columns={[
              { title: 'Tài khoản', key: 'account', render: (_, row) => (
                <div><strong>{row.display_name || row.username}</strong><br />
                  <span>@{(row.username || '').replace(/^@+/, '')}</span></div>
              ) },
              { title: 'Nền tảng', dataIndex: 'platform' },
              { title: 'Người theo dõi', key: 'followers', render: (_, row) =>
                row.followers == null ? '—' : row.followers.toLocaleString('vi-VN') },
              { title: 'Kết quả', key: 'outcome', render: (_, row) => {
                const outcome = collectionOutcome(row.decision, row.primary_type);
                return <Tag color={row.status === 'error' || outcome === 'rejected' ? 'red' : outcome === 'accepted' ? 'green' : 'orange'}>
                  {row.status === 'error' ? 'Lỗi thu thập' : collectionOutcomeLabel(outcome)}</Tag>;
              } },
              { title: 'Lý do / chi tiết', key: 'reason', render: (_, row) =>
                row.error || row.sync_error || (row.reason_codes?.length ? row.reason_codes.join(', ') :
                  row.decision === 'SKIP_INSUFFICIENT' ? 'Chưa đủ dữ liệu xác minh' : row.decision || 'Chưa có lý do từ crawler') },
            ]} />
        </div>
      )}

      <div ref={feedRef}>
        {discoveredList.length > 0 && (
          <DiscoveredFeedCard
            discoveredList={discoveredList}
            onImportSingle={handleImportSingle}
            onImportAll={handleImportAll}
            onInspectDetail={handleInspectDetail}
          />
        )}
      </div>

      <DirectCrawlModal
        open={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        defaultInput={inspectUsername}
        initialResult={rawResults.find(result => result.username.replace(/^@/, '') === inspectUsername)}
      />
    </div>
  );
}
