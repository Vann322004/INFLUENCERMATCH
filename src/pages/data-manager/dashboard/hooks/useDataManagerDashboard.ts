import { useState, useEffect, useCallback } from 'react';
import { crawlerService } from '../../../../services/api/crawlerService';
import { claimService } from '../../../../services/api/claimService';
import { adminService } from '../../../../services/api/adminService';
import type { CrawlMonitorOverview } from '../../../../types/api/crawler.types';
import type { ClaimResponse } from '../../../../types/api/claim.types';

export function useDataManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CrawlMonitorOverview | null>(null);
  const [pendingClaims, setPendingClaims] = useState<ClaimResponse[]>([]);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [pendingQualityCount, setPendingQualityCount] = useState<number>(0);
  const [pendingConflictsCount, setPendingConflictsCount] = useState<number>(0);
  const [unavailable, setUnavailable] = useState<number[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        crawlerService.getOverview(15).then(data => {
          if (!Array.isArray(data?.activities?.items)) throw new Error('Nhật ký thu thập không hợp lệ.');
          return data;
        }),
        claimService.getClaims({ status: 'PENDING', size: 10 }, { requireBackend: true }),
        adminService.getPendingClaims({ size: 100 }, { requireBackend: true }),
        adminService.getIdentityConflicts({ status: 'PENDING_MANAGER' }).then(page => {
          if (typeof page?.totalElements === 'number' && Number.isSafeInteger(page.totalElements) && page.totalElements >= 0) return page.totalElements;
          if (Array.isArray(page?.items)) return page.items.length;
          throw new Error('Hàng đợi xung đột định danh không hợp lệ.');
        }),
      ]);

      const failed = results.flatMap((result, index) => result.status === 'rejected' ? [index] : []);
      setUnavailable(failed);

      // 1. Crawler Overview (DM-05, DM-03)
      if (results[0].status === 'fulfilled') {
        setOverview(results[0].value);
      } else {
        setOverview(null);
      }

      // 2. Pending Claims (DM-02)
      if (results[1].status === 'fulfilled') {
        const clRes = results[1].value;
        const clList = clRes?.items || clRes?.content || (Array.isArray(clRes) ? clRes : []);
        setPendingClaims(clList);
        setPendingClaimsCount(clRes.totalElements);
      } else {
        setPendingClaims([]);
        setPendingClaimsCount(0);
      }

      // 3. Pending Quality Snapshots (DM-03)
      if (results[2].status === 'fulfilled') {
        const qRes = results[2].value;
        setPendingQualityCount(Array.isArray(qRes) ? qRes.length : 0);
      }

      // 4. Pending Identity Conflicts (DM-01/DM-02)
      if (results[3].status === 'fulfilled') {
        setPendingConflictsCount(results[3].value);
      }

    } catch {
      setUnavailable([0, 1, 2, 3]);
      setOverview(null);
      setPendingClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real recent activities from Crawler Overview (NO FAKE USERNAMES)
  const realActivities = overview?.activities?.items || [];

  // Calculate oldest pending claim wait time
  const getOldestWaitTime = () => {
    if (!pendingClaims.length) return null;
    const dates = pendingClaims.map(claim => claim.submittedAt ? new Date(claim.submittedAt).getTime() : NaN)
      .filter(time => Number.isFinite(time) && time <= Date.now());
    if (!dates.length) return null;
    const diffHours = Math.round((Date.now() - Math.min(...dates)) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} giờ`;
    return `${Math.round(diffHours / 24)} ngày`;
  };

  const oldestWaitTime = getOldestWaitTime();

  return {
    loading, pendingClaims, pendingQualityCount, pendingConflictsCount,
    unavailable, fetchDashboardData, pendingClaimsCount, realActivities, oldestWaitTime,
  };
}

export type DataManagerDashboardData = ReturnType<typeof useDataManagerDashboard>;
