import { collectionOutcomeLabel } from '../../../../../services/collectionDecision';
import { collectionOutcome } from '../../../../../services/collectionDecision';
import { saveCollectionResults, restoreCrawledAvatars } from '../../../../../services/collectionResults';
import { useCollectionState } from '../../../../../hooks/useCollectionState';
import type { LiveCrawlResult } from '../../../../../types/api/crawler.types';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, message, Table, Tag } from 'antd';
import HunterSetupCard from './HunterSetupCard';
import { nicheService, type Niche } from '../../../../../services/api/nicheService';
import HunterRadarScanner from './HunterRadarScanner';
import DiscoveredFeedCard, { type DiscoveredKocItem } from './DiscoveredFeedCard';
import DirectCrawlModal from '../DirectCrawlModal';
import { crawlerService } from '../../../../../services/api/crawlerService';
import { dataQualityService } from '../../../../../services/api/dataQualityService';
import { DATA_MANAGER_ROUTES } from '../../../../../constants/adminRoutes';
import type { CrawlPlatform } from '../../../../../types/api/crawler.types';

export default function AutoHunterTab({ mode = 'category' }: { mode?: 'category' | 'custom' }) {
  const [platform, setPlatform] = useCollectionState<string>(`hunter.${mode}.platform`, 'ALL');
  const [topics, setTopics] = useState<Niche[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [topicsVersion, setTopicsVersion] = useState(0);
  const [selectedTopic, setSelectedTopic] = useCollectionState<string>(`hunter.${mode}.selectedTopic`, '');
  const [activeKeywords, setActiveKeywords] = useCollectionState<string[]>(`hunter.${mode}.activeKeywords`, []);
  const [customUsernames, setCustomUsernames] = useCollectionState<string>(`hunter.${mode}.customUsernames`, '');
  const [maxKocs, setMaxKocs] = useCollectionState<number>(`hunter.${mode}.maxKocs`, 5);
  const [loading, setLoading] = useCollectionState<boolean>(`hunter.${mode}.loading`, false, false);

  // Radar state — driven bởi response thực từ API
  const [currentKeyword, setCurrentKeyword] = useCollectionState<string>(`hunter.${mode}.currentKeyword`, '');
  const [progressPercent, setProgressPercent] = useCollectionState<number>(`hunter.${mode}.progressPercent`, 0);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [huntError, setHuntError] = useState('');
  useEffect(() => {
    if (!loading) return;
    setWaitSeconds(0);
    setHuntError('');
    const started = Date.now();
    const waitTimer = setInterval(() => {
      setWaitSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => {
      clearInterval(waitTimer);
    };
  }, [loading]);

  const [scannedCount, setScannedCount] = useCollectionState<number>(`hunter.${mode}.scannedCount`, 0);
  const [filteredOutCount, setFilteredOutCount] = useCollectionState<number>(`hunter.${mode}.filteredOutCount`, 0);
  const [pendingReviewCount, setPendingReviewCount] = useCollectionState<number | null>(`hunter.${mode}.pendingReviewCount`, null);
  const [matchedCount, setMatchedCount] = useCollectionState<number>(`hunter.${mode}.matchedCount`, 0);
  const [logLines, setLogLines] = useCollectionState<string[]>(`hunter.${mode}.logLines`, []);

  // Discovered Feed
  const [discoveredList, setDiscoveredList] = useCollectionState<DiscoveredKocItem[]>(`hunter.${mode}.discoveredList`, []);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectUsername, setInspectUsername] = useState<string>('');

  const [rawResults, setRawResults] = useCollectionState<LiveCrawlResult[]>(`hunter.${mode}.results`, []);
  const feedRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (mode !== 'category') { setTopicsLoading(false); return; }
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
  }, [topicsVersion, mode]);

  const reloadTopics = () => {
    setTopicsLoading(true);
    setTopicsError('');
    setTopicsVersion(value => value + 1);
  };

  const handleNavigateQuality = () => {
    navigate(DATA_MANAGER_ROUTES.DATA_QUALITY);
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

    const targetCount = mode === 'custom' ? Math.min(usernamesToCrawl.length, maxKocs) : maxKocs;
    setLoading(true);
    setHuntError('');
    setProgressPercent(0);
    setScannedCount(targetCount);
    setFilteredOutCount(0);
    setMatchedCount(0);
    setDiscoveredList([]);
    setRawResults([]);

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

    try {
      const res = mode === 'custom' ? await crawlerService.collectAccounts(crawlPlatform, usernamesToCrawl, maxKocs) : await crawlerService.batchCrawl({
        platform: crawlPlatform,
        category: categoryCode,
        keywords: activeKeywords,
        maxChannels: maxKocs,
      });


      const summary = res.summary;
      const totalReq = summary?.total_requested ?? (res.results?.length ?? maxKocs);
      const failedCnt = summary?.failed_count ?? 0;

      res.results = restoreCrawledAvatars(res.results || []);
      setRawResults(res.results);
      const rawResults = (res.results || []).filter((r) => r.status === 'success' && !!r.username).map(r => ({ ...r }));

      // Backend decisions are authoritative for eligibility.
      let rejectedCount = 0;
      const passedResults: typeof rawResults = [];
      const rejectedNames: string[] = [];
      const reviewPendingCandidates: { username: string; platform: string }[] = [];

      for (const r of rawResults) {
        const uname = r.username || '';
        // Loại bỏ nếu Backend Rule Engine từ chối (Brand / Shop / Spam)
        if (collectionOutcome(r.decision, r.primary_type) === 'rejected' || r.primary_type === 'BRAND' || r.primary_type === 'SPAM') {
          r.decision = 'AUTO_REJECT';
          rejectedCount++;
          rejectedNames.push(`@${uname.replace(/^@/, '')}`);
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

      const totalExcluded = failedCnt + rejectedCount;
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
            avatarUrl: r.avatar_url || r.avatarUrl,
            avatarFallbackUrl: r.avatar_fallback_url,
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
        if (rejectedCount > 0) {
          newLogs.push(`[${now()}] Đã loại bỏ ${rejectedCount} tài khoản bị backend từ chối: ${rejectedNames.join(', ')}`);
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
        const reason = rejectedCount > 0
          ? `Backend từ chối ${rejectedCount} tài khoản: ${rejectedNames.join(', ')}.`
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
      setHuntError(err.message || 'Crawler request failed');
      setLogLines((prev) => [`[${now()}] Chưa nhận được kết quả thu thập: ${err.message || 'Không thể lấy dữ liệu'}`, ...prev]);
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
      <HunterSetupCard
        topics={topics}
        topicsLoading={topicsLoading}
        topicsError={topicsError}
        topicsManagementPath={DATA_MANAGER_ROUTES.TAXONOMY}
        onReloadTopics={reloadTopics}
        mode={mode}
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

      {(loading || logLines.length > 0 || !!huntError) && (
        <HunterRadarScanner
          loading={loading}
          currentKeyword={currentKeyword}
          progressPercent={progressPercent}
          waitSeconds={waitSeconds}
          errorMessage={huntError}
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
              { title: 'Thao tác', key: 'details', width: 120, render: (_, row) => <Button size="small"
                disabled={row.status === 'error'} onClick={() => { setInspectUsername(row.username); setInspectModalOpen(true); }}>Xem chi tiết</Button> },
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
