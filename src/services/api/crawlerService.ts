import { invalidateDataManagerCacheForMutation, invalidateAdminCacheForMutation } from '../requestCache';
import { requestCrawler } from './crawlerTransport';
import type {
  CrawlPlatform,
  LiveCrawlResult,
  BatchCrawlResponse,
  CrawlMonitorOverview,
} from '../../types/api/crawler.types';

class CrawlerService {
  /**
   * Gọi API trực tiếp tới FastAPI Crawler Service (qua Vite proxy /crawler-api hoặc cổng 8000)
   */
  private async requestCrawler<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 25000
  ): Promise<T> {
    const result = await requestCrawler<T>(import.meta.env.VITE_CRAWLER_API_BASE_URL || '/crawler-api', endpoint, options, timeoutMs);
    invalidateDataManagerCacheForMutation(options.method, endpoint);
    invalidateAdminCacheForMutation(options.method, endpoint);
    return result;
  }

  /**
   * Cào trực tiếp 1 KOC thời gian thực (POST /api/v1/crawl/test-scrape)
   */
  async testScrape(profileUrl: string, platform: CrawlPlatform = 'TIKTOK'): Promise<LiveCrawlResult> {
    const cleanInput = profileUrl.trim();
    if (!cleanInput) {
      throw new Error('Vui lòng nhập đường dẫn kênh hoặc tên người dùng của Nhà sáng tạo');
    }

    return await this.requestCrawler<LiveCrawlResult>(
      '/api/v1/crawl/test-scrape',
      {
        method: 'POST',
        body: JSON.stringify({
          profile_url: cleanInput,
          platform: platform.toUpperCase(),
        }),
      },
      30000 // 30s cho 1 profile + clips
    );
  }

  /**
   * Cào hàng loạt theo ngành hàng hoặc danh sách (POST /api/v1/crawl/batch-crawl)
   */
  async collectAccounts(platform: CrawlPlatform, usernames: string[], maxChannels = 20): Promise<BatchCrawlResponse> {
    const limit = Math.max(1, Math.min(20, Math.trunc(maxChannels) || 1));
    const accounts = [...new Set(usernames.map(value => value.trim().replace(/^@+/, '')).filter(Boolean))].slice(0, limit);
    if (!accounts.length) throw new Error('Vui lòng nhập ít nhất một tài khoản.');
    return this.batchCrawl({ platform, usernames: accounts, maxChannels: limit });
  }

  async batchCrawl(payload: {
    platform?: CrawlPlatform;
    category?: string;
    keywords?: string[];
    usernames?: string[];
    maxChannels?: number;
  }): Promise<BatchCrawlResponse> {
    const plat = (payload.platform || 'TIKTOK').toUpperCase();
    const maxChannels = payload.maxChannels || 3;

    const body = JSON.stringify({ platform: plat, category: payload.category,
      keywords: payload.keywords, usernames: payload.usernames || [], max_channels: maxChannels });
    const storageKey = `crawler.batch:${body}`;
    let taskId = '';
    try { taskId = sessionStorage.getItem(storageKey) || ''; } catch { /* Storage may be disabled. */ }
    if (!taskId) {
      const job = await this.requestCrawler<{ task_id: string }>(
        '/api/v1/crawl/batch-crawl/jobs',
        { method: 'POST', body },
        15000
      );
      if (!job.task_id) throw new Error('Máy chủ chưa trả mã tác vụ thu thập.');
      taskId = job.task_id;
      try { sessionStorage.setItem(storageKey, taskId); } catch { /* Keep tracking in memory. */ }
    }
    const deadline = Date.now() + 15 * 60 * 1000;
    let failures = 0;
    while (Date.now() < deadline) {
      let job: { status: string; result?: BatchCrawlResponse; error?: string };
      try {
        job = await this.requestCrawler(`/api/v1/crawl/batch-crawl/jobs/${encodeURIComponent(taskId)}`, {}, 10000);
        failures = 0;
      } catch (error) {
        if (++failures >= 3) throw new Error(`Tạm mất kết nối theo dõi tác vụ ${taskId}. Bấm bắt đầu với cùng cấu hình để tiếp tục theo dõi. ${error instanceof Error ? error.message : ''}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      if (job.status === 'COMPLETED' && job.result) {
        try { sessionStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
        invalidateDataManagerCacheForMutation('POST', '/api/v1/crawl/batch-crawl');
        invalidateAdminCacheForMutation('POST', '/api/v1/crawl/batch-crawl');
        return job.result;
      }
      if (['FAILED', 'REVOKED'].includes(job.status)) {
        try { sessionStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
        throw new Error(job.error || `Tác vụ ${taskId} không hoàn tất.`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error(`Chưa có kết quả tác vụ ${taskId}. Bấm bắt đầu với cùng cấu hình để tiếp tục theo dõi; tác vụ không được gửi lại.`);
  }

  /**
   * Lấy Overview giám sát Crawler thời gian thực (GET /api/v1/monitor/overview)
   */
  async getOverview(limit = 30): Promise<CrawlMonitorOverview> {
    const overview = await this.requestCrawler<CrawlMonitorOverview>(
      `/api/v1/monitor/overview?limit=${Math.max(1, Math.min(100, Math.trunc(limit) || 30))}`,
      {},
      10000
    );
    // The crawler persists flat Creator payloads; older deployments wrap creator.
    const rawItems = overview.crawled_data?.items || [];
    return {
      ...overview,
      crawled_data: {
        ...overview.crawled_data,
        items: rawItems.map(item => {
          if (item.creator) return item;
          const flat = item as unknown as CrawlMonitorOverview['crawled_data']['items'][number]['creator'] & {
            recentPosts?: LiveCrawlResult['recent_posts']; collectedAt?: string;
          };
          return { creator: flat, recentPosts: flat.recentPosts, collectedAt: flat.collectedAt };
        }),
      },
    };
  }

  /**
   * Đưa Creator vào hàng đợi phân loại Celery (POST /api/v1/crawl/enqueue)
   */
  async enqueueCandidate(
    platform: CrawlPlatform,
    username: string,
    forceDeepCrawl = false
  ): Promise<any> {
    return await this.requestCrawler<any>(
      '/api/v1/crawl/enqueue',
      {
        method: 'POST',
        body: JSON.stringify({
          platform: platform.toUpperCase(),
          username: username.trim().replace(/^@+/, '').trim(),
          force_deep_crawl: forceDeepCrawl,
        }),
      },
      10000
    );
  }

  /**
   * Kích hoạt làm mới KOC trong DB (POST /api/v1/crawl/trigger-db-refresh)
   */
  async triggerDbRefresh(limit = 25): Promise<any> {
    return await this.requestCrawler<any>(
      `/api/v1/crawl/trigger-db-refresh?limit=${limit}`,
      {
        method: 'POST',
      },
      15000
    );
  }

  /**
   * Thẩm định & Tái phân loại Creator hàng loạt trong DB (POST /api/v1/quality/batch-reclassify)
   */
  async batchReclassify(payload: {
    limit?: number;
    offset?: number;
    platform?: string;
    category?: string;
    dry_run?: boolean;
    auto_quarantine?: boolean;
  } = {}): Promise<any> {
    return await this.requestCrawler<any>(
      '/api/v1/quality/batch-reclassify',
      {
        method: 'POST',
        body: JSON.stringify({
          limit: payload.limit ?? 20,
          offset: payload.offset ?? 0,
          platform: payload.platform || undefined,
          category: payload.category || undefined,
          dry_run: payload.dry_run ?? false,
          auto_quarantine: payload.auto_quarantine ?? true,
        }),
      },
      60000
    );
  }

  /**
   * Lấy báo cáo thẩm định DB gần nhất (GET /api/v1/quality/audit-report)
   */
  async getAuditReport(): Promise<any> {
    return await this.requestCrawler<any>(
      '/api/v1/quality/audit-report',
      {},
      15000
    );
  }

  async getAuditEvidence(creatorId: string, platform: string, username: string, runId: string): Promise<any> {
    const params = new URLSearchParams({ creator_id: creatorId, platform: platform.toUpperCase(),
      username, run_id: runId });
    return this.requestCrawler(`/api/v1/quality/audit-evidence?${params}`, {}, 10000);
  }
}

export const crawlerService = new CrawlerService();
