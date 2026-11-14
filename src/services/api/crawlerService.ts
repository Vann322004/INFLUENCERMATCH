import { invalidateDataManagerCacheForMutation } from '../requestCache';
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
    return result;
  }

  /**
   * Cào trực tiếp 1 KOC thời gian thực (POST /api/v1/crawl/test-scrape)
   */
  async testScrape(profileUrl: string, platform: CrawlPlatform = 'TIKTOK'): Promise<LiveCrawlResult> {
    const cleanInput = profileUrl.trim();
    if (!cleanInput) {
      throw new Error('Vui lòng nhập đường dẫn kênh hoặc tên người dùng của KOC');
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
  async batchCrawl(payload: {
    platform?: CrawlPlatform;
    category?: string;
    keywords?: string[];
    usernames?: string[];
    maxChannels?: number;
  }): Promise<BatchCrawlResponse> {
    const plat = (payload.platform || 'TIKTOK').toUpperCase();
    const maxChannels = payload.maxChannels || 3;

    return await this.requestCrawler<BatchCrawlResponse>(
      '/api/v1/crawl/batch-crawl',
      {
        method: 'POST',
        body: JSON.stringify({
          platform: plat,
          category: payload.category,
          keywords: payload.keywords,
          usernames: payload.usernames || [],
          max_channels: maxChannels,
        }),
      },
      90000 // 90s cho cào hàng loạt
    );
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
          username: username.replace(/^@+/, '').trim(),
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
}

export const crawlerService = new CrawlerService();
