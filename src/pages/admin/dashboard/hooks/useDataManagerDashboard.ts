import { useState, useEffect, useCallback } from 'react';
import { crawlerService } from '../../../../services/api/crawlerService';
import { claimService } from '../../../../services/api/claimService';
import { adminService } from '../../../../services/api/adminService';
import { nicheService, type Niche } from '../../../../services/api/nicheService';
import type { CrawlMonitorOverview } from '../../../../types/api/crawler.types';
import type { ClaimResponse } from '../../../../types/api/claim.types';

export function useDataManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CrawlMonitorOverview | null>(null);
  const [pendingClaims, setPendingClaims] = useState<ClaimResponse[]>([]);
  const [pendingQualityCount, setPendingQualityCount] = useState<number>(0);
  const [pendingConflictsCount, setPendingConflictsCount] = useState<number>(0);
  const [masterCreatorsCount, setMasterCreatorsCount] = useState<number>(0);
  const [claimedChannelsCount, setClaimedChannelsCount] = useState<number>(0);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [unavailable, setUnavailable] = useState<number[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const results = await Promise.allSettled([
        crawlerService.getOverview(15),
        claimService.getClaims({ status: 'PENDING', size: 10 }, { requireBackend: true }),
        adminService.getPendingClaims({ size: 100 }, { requireBackend: true }),
        adminService.getIdentityConflicts({ status: 'PENDING_MANAGER' }),
        adminService.getCreatorMasters({ size: 1 }),
        nicheService.list(),
      ]);

      const failed = results.flatMap((result, index) => result.status === 'rejected' ? [index] : []);
      setUnavailable(failed);
      if (failed.length) setApiError('Không tải được ' + failed.length + '/6 nguồn dữ liệu. Các mục tương ứng chưa có dữ liệu mới; hãy làm mới để thử lại.');

      // 1. Crawler Overview (DM-05, DM-03)
      if (results[0].status === 'fulfilled') {
        setOverview(results[0].value);
      } else {
        console.warn('Crawler overview API offline:', results[0].reason);
      }

      // 2. Pending Claims (DM-02)
      if (results[1].status === 'fulfilled') {
        const clRes = results[1].value;
        const clList = clRes?.items || clRes?.content || (Array.isArray(clRes) ? clRes : []);
        setPendingClaims(clList);
      }

      // 3. Pending Quality Snapshots (DM-03)
      if (results[2].status === 'fulfilled') {
        const qRes = results[2].value;
        setPendingQualityCount(Array.isArray(qRes) ? qRes.length : 0);
      }

      // 4. Pending Identity Conflicts (DM-01/DM-02)
      if (results[3].status === 'fulfilled') {
        const confRes = results[3].value;
        const confCount = confRes?.totalElements ?? (Array.isArray(confRes?.items) ? confRes.items.length : 0);
        setPendingConflictsCount(confCount);
      }

      // 5. Master Creators Count (DM-01)
      if (results[4].status === 'fulfilled') {
        const mRes = results[4].value;
        const mTotal = mRes?.totalElements ?? 0;
        setMasterCreatorsCount(mTotal);
      }

      // 6. Niches List (DM-06)
      if (results[5].status === 'fulfilled') {
        setNiches(Array.isArray(results[5].value) ? results[5].value : []);
      }

      // Read linked channel count from the backend
      const approvedClaimsRes = await claimService.getClaims({ status: 'APPROVED', size: 1 }, { requireBackend: true }).catch(() => {
        setUnavailable((previous) => [...previous, 6]);
        setApiError('Một số nguồn dữ liệu chưa tải được. Làm mới để thử lại.');
        return null;
      });
      if (approvedClaimsRes?.totalElements !== undefined) {
        setClaimedChannelsCount(approvedClaimsRes.totalElements);
      }

      setLastRefreshed(new Date());
    } catch (err: any) {
      setApiError(err?.message || 'Có lỗi kết nối đến một số dịch vụ backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Computed Metrics directly from Real API Data (NO HARDCODED NUMBERS) ──
  const stats = overview?.stats || {};
  const totalCandidates = stats.total_candidates ?? 0;
  const ingestedCount = stats.ingested_count ?? 0;
  const uningestedCount = Math.max(0, totalCandidates - ingestedCount);
  const acceptedKolKoc = stats.accepted_kol_koc ?? 0;
  const rejectedCount = stats.rejected_count ?? 0;
  const reviewPending = stats.review_pending ?? pendingQualityCount;
  const rateLimit429 = stats.rate_limit_429_count ?? 0;

  const pendingClaimsCount = pendingClaims.length;

  // Real recent activities from Crawler Overview (NO FAKE USERNAMES)
  const realActivities = overview?.activities?.items || [];

  // Calculate oldest pending claim wait time
  const getOldestWaitTime = () => {
    if (!pendingClaims.length) return null;
    const sorted = [...pendingClaims].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    const oldest = sorted[0];
    const diffHours = Math.round((Date.now() - new Date(oldest.submittedAt).getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} giờ`;
    return `${Math.round(diffHours / 24)} ngày`;
  };

  const oldestWaitTime = getOldestWaitTime();

  return {
    loading, pendingClaims, pendingQualityCount, pendingConflictsCount,
    masterCreatorsCount, claimedChannelsCount, niches, lastRefreshed,
    unavailable, apiError, fetchDashboardData, totalCandidates, ingestedCount,
    uningestedCount, acceptedKolKoc, rejectedCount, reviewPending,
    rateLimit429, pendingClaimsCount, realActivities, oldestWaitTime,
  };
}

export type DataManagerDashboardData = ReturnType<typeof useDataManagerDashboard>;
