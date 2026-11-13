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
    const urls = [
      `/crawler-api${endpoint}`,
      `http://127.0.0.1:8000${endpoint}`,
      `http://localhost:8000${endpoint}`,
    ];

    let lastError: any = null;

    for (const url of urls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      let responseReceived = false;
      try {
        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });
        responseReceived = true;

        if (res.ok) {
          return await res.json();
        } else {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.detail || errBody.error || `Lỗi máy chủ HTTP ${res.status}`);
        }
      } catch (err: any) {
        // A server rejection must be shown immediately, not replayed as another crawl.
        if (responseReceived) throw err;
        lastError = err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new Error(
      lastError?.message ||
        'Không thể kết nối đến máy chủ thu thập dữ liệu (cổng 8000). Vui lòng kiểm tra dịch vụ uvicorn.'
    );
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
    return await this.requestCrawler<CrawlMonitorOverview>(
      `/api/v1/monitor/overview?limit=${limit}`,
      {},
      10000
    );
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
