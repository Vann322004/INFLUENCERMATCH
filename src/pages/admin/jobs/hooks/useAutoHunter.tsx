import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { saveCollectionResults } from '../../../../services/collectionResults';
import { useCollectionState } from '../../../../hooks/useCollectionState';
import { nicheService, type Niche } from '../../../../services/api/nicheService';
import { crawlerService } from '../../../../services/api/crawlerService';
import { dataQualityService } from '../../../../services/api/dataQualityService';
import type { CrawlPlatform, LiveCrawlResult } from '../../../../types/api/crawler.types';
import type { DiscoveredKocItem } from '../components/discovery/DiscoveredFeedCard';
import { filterTier0Candidates } from '../utils/hunterTier0Filter';

export function useAutoHunter() {
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
  const [loading, setLoading] = useState<boolean>(false);

  // Radar state — driven bởi response thực từ API
  const [currentKeyword, setCurrentKeyword] = useCollectionState<string>('hunter.currentKeyword', '');
  const [progressPercent, setProgressPercent] = useCollectionState<number>('hunter.progressPercent', 0);
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
      setTopicsError(`Không tải được lĩnh vực thu thập Nhà sáng tạo${status ? ` (HTTP ${status})` : ''}. ${detail}`);
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

  const handleInspectDetail = (item: DiscoveredKocItem) => {
    setInspectUsername(item.username);
    setInspectModalOpen(true);
  };

  const handleStartHunting = async () => {
    let usernamesToCrawl: string[] = [];

    if (mode === 'custom') {
      usernamesToCrawl = customUsernames
        .split(/[\n,]+/)
        .map((u) => u.trim().replace(/^@/, ''))
        .filter(Boolean);

      if (usernamesToCrawl.length === 0) {
        message.warning('Vui lòng nhập ít nhất 1 username hoặc link Nhà sáng tạo!');
        return;
      }
    } else {
      if (topicsLoading || topicsError || !topics.some(topic => topic.id === selectedTopic)) {
        message.warning('Vui lòng chọn một lĩnh vực đang bật.');
        return;
      }
      if (activeKeywords.length === 0) {
        message.warning('Vui lòng chọn hoặc nhập ít nhất 1 từ khóa để tìm Nhà sáng tạo!');
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
        `[${now()}] Bắt đầu cào ${usernamesToCrawl.length} tài khoản Nhà sáng tạo từ danh sách chỉ định...`,
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

    // Dynamic progress feedback
    const timer1 = setTimeout(() => {
      setProgressPercent(40);
      setLogLines((prev) => [`[${now()}] Đang bóc tách dữ liệu hồ sơ và bài đăng...`, ...prev]);
    }, 4000);

    const timer2 = setTimeout(() => {
      setProgressPercent(70);
      setLogLines((prev) => [`[${now()}] Áp dụng bộ lọc Tier-0: loại bỏ Shop & nick dưới 7.000 followers...`, ...prev]);
    }, 12000);

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
      saveCollectionResults(res.results || [], mode === 'custom' ? 'manual' : 'automatic');
      const validResults = (res.results || []).filter((r) => r.status === 'success' && !!r.username);

      // Áp dụng bộ lọc Tier-0 qua module tách biệt
      const {
        passedResults,
        shopFilteredCount,
        lowFollowersCount,
        shopRemovedNames,
        reviewPendingCandidates,
      } = filterTier0Candidates(validResults);

      const totalExcluded = failedCnt + shopFilteredCount + lowFollowersCount;
      setScannedCount(totalReq);
      setFilteredOutCount(totalExcluded);
      setMatchedCount(passedResults.length);

      // Enqueue candidates requiring processing
      reviewPendingCandidates.forEach((cand) => {
        const u = cand.username.replace(/^@/, '');
        crawlerService.enqueueCandidate(cand.platform as any, u, false).catch(() => {});
      });

      if (passedResults.length > 0) {
        const mappedList: DiscoveredKocItem[] = passedResults.map((r, idx) => {
          const username = (r.username || `koc_${idx}`).replace(/^@/, '');
          const followers = r.followers || 0;
          const isKol = r.primary_type === 'KOL' && Boolean(r.is_verified);

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
            decision: isKol ? 'AUTO_ACCEPT_KOL' : 'AUTO_ACCEPT_KOC',
            bio: r.bio,
            latencyMs: r.latency_ms,
            status: 'DISCOVERED',
          };
        });

        // Tự động lưu tất cả KOC đạt chuẩn vào Database hệ thống
        const submissions = await Promise.allSettled(passedResults.map((koc) => {
          const uname = koc.username.replace(/^@/, '');
          const kocPlat = (koc.platform || 'TIKTOK') as any;
          return crawlerService.enqueueCandidate(kocPlat, uname, false);
        }));
        const queuedCount = submissions.filter(result => result.status === 'fulfilled').length;
        mappedList.forEach((item, index) => {
          if (submissions[index].status === 'fulfilled') item.status = 'QUEUED';
        });
        if (queuedCount < mappedList.length) message.warning(`Có ${mappedList.length - queuedCount} hồ sơ chưa gửi được vào hàng đợi. Bạn có thể gửi lại từng hồ sơ.`);

        setProgressPercent(100);
        setDiscoveredList(mappedList);

        const newLogs = [
          `[${now()}] Đã xử lý ${res.results?.length ?? 0}/${totalReq} kênh yêu cầu; ${mappedList.length} Nhà sáng tạo đạt chuẩn Tier-0. ${(res.results?.length ?? 0) < totalReq ? "Nguồn tìm kiếm chưa trả đủ kênh phù hợp." : ""}`,
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
        message.success(`Đã thu thập ${mappedList.length} Nhà sáng tạo; ${queuedCount} hồ sơ đã vào hàng đợi đồng bộ.`);

        if (totalExcluded > 0) {
          message.info({
            content: (
              <span>
                Có {totalExcluded} kênh chưa đạt tự động.{' '}
                <a
                  onClick={handleNavigateQuality}
                  style={{ color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Mở danh sách kiểm định trên hệ thống →
                </a>
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
              Không có Nhà sáng tạo nào đạt chuẩn tự động (cào lỗi hoặc bị lọc {totalExcluded} kênh).{' '}
              <a
                onClick={handleNavigateQuality}
                style={{ color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Mở danh sách kiểm định trên hệ thống →
              </a>
            </span>
          ),
          duration: 6,
        });
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setProgressPercent(0);
      setLogLines([`[${now()}] Lỗi kết nối máy chủ cào: ${err.message || 'Không thể lấy dữ liệu'}`]);
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
      message.error({ content: `Lỗi khi lưu @${item.username}. Vui lòng thử lại.`, key: 'imp_single' });
    }
  };

  return {
    mode, setMode,
    platform, setPlatform,
    topics, topicsLoading, topicsError, reloadTopics,
    selectedTopic, handleSelectTopic,
    activeKeywords, setActiveKeywords,
    customUsernames, setCustomUsernames,
    maxKocs, setMaxKocs,
    loading,
    currentKeyword, progressPercent, scannedCount, filteredOutCount, pendingReviewCount, matchedCount, logLines,
    discoveredList, setDiscoveredList,
    inspectModalOpen, setInspectModalOpen,
    inspectUsername,
    feedRef,
    handleStartHunting,
    handleImportSingle,
    handleInspectDetail,
    handleNavigateQuality,
    location,
  };
}
