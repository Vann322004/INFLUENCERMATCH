import type {
  CrawlPlatform,
  LiveCrawlResult,
  BatchCrawlResponse,
  CrawlCategory,
  CrawlMonitorOverview,
} from '../../types/api/crawler.types';

export const DEFAULT_CRAWL_CATEGORIES: CrawlCategory[] = [
  { id: 'BEAUTY', name: '💄 Làm đẹp & Mỹ phẩm', description: 'Skincare, Makeup, Mỹ phẩm' },
  { id: 'TECH', name: '💻 Công nghệ & Thiết bị', description: 'Điện thoại, PC, Setup công nghệ' },
  { id: 'FOOD', name: '🍲 Ẩm thực & Nhà hàng', description: 'Quán ăn, Món ngon, Nấu ăn' },
  { id: 'FASHION', name: '👗 Thời trang & Phụ kiện', description: 'OOTD, Phối đồ thời thượng' },
  { id: 'ENTERTAINMENT', name: '🎬 Truyền thông & Giải trí', description: 'Hài hước, Kịch bản' },
  { id: 'TRAVEL', name: '✈️ Du lịch & Trải nghiệm', description: 'Check-in, Khám phá vùng miền' },
  { id: 'LIFESTYLE', name: '🏡 Đời sống & Sức khỏe', description: 'Gia đình, Decor nhà cửa' },
];

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
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          return await res.json();
        } else {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.detail || errBody.error || `Lỗi máy chủ HTTP ${res.status}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw new Error(
      lastError?.message ||
        'Không thể kết nối đến máy chủ thu thập dữ liệu (cổng 8000). Vui lòng kiểm tra dịch vụ uvicorn.'
    );
  }

  /**
   * Lấy danh mục ngành hàng Taxonomy thực tế (GET /api/v1/crawl/categories)
   */
  async getCategories(): Promise<CrawlCategory[]> {
    try {
      const data = await this.requestCrawler<any[]>('/api/v1/crawl/categories', {}, 8000);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
          id: item.code || item.id,
          name: `${item.icon || '🏷️'} ${item.label || item.name || item.code}`,
          description: item.description,
          defaultCandidates: item.candidates || [],
        }));
      }
    } catch {
      // Fallback về danh mục chuẩn
    }
    return DEFAULT_CRAWL_CATEGORIES;
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
   * Kích hoạt quét tìm KOC mới (POST /api/v1/crawl/trigger-weekly-discovery)
   */
  async triggerWeeklyDiscovery(payload?: {
    maxNewKocs?: number;
    keywords?: string[];
    platform?: string;
  }): Promise<any> {
    return await this.requestCrawler<any>(
      '/api/v1/crawl/trigger-weekly-discovery',
      {
        method: 'POST',
        body: JSON.stringify({
          max_new_kocs: payload?.maxNewKocs || 30,
          keywords: payload?.keywords,
          platform: payload?.platform || 'ALL',
        }),
      },
      15000
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
