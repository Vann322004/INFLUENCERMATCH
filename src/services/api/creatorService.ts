import { apiClient } from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';
import {
  CreatorItem,
  CreatorDetail,
  CreatorVectorSearchItem,
  RateCardResponse,
  ShortlistItem,
  AddShortlistItemPayload,
  SendInvitationRequest,
  InvitationResponse,
  DiscoverCreatorsParams,
  CreatorDiscoveryPageResponse,
} from '../../types/api/creator.types';

// ── Structured Fallback Creators (Ảnh chuẩn xác theo đúng giới tính & ngành nghề) ──
export const DEFAULT_CREATORS: CreatorItem[] = [
  {
    id: 'cr_1',
    creatorId: 'cr_1',
    displayName: 'Nam Đi Du Lịch',
    userName: 'namdidulich',
    platform: 'tiktok',
    followers: 152000,
    engagementRate: 0.13,
    verifiedByInfluencerMatch: true,
    sourceType: 'PUBLIC',
    niche: 'Du lịch & Khám phá',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    location: 'Đà Lạt, Việt Nam',
    profileUrl: 'https://tiktok.com/@namdidulich',
    contentSummary: 'Creator chuyên về du lịch trải nghiệm, khám phá văn hóa và ẩm thực vùng miền.',
  },
  {
    id: 'cr_2',
    creatorId: 'cr_2',
    displayName: 'Kênh Thể Thao',
    userName: 'kenhthethao.vn',
    platform: 'youtube',
    followers: 1500000,
    engagementRate: 0.097,
    verifiedByInfluencerMatch: true,
    sourceType: 'AUTHORIZED',
    niche: 'Thể thao & Fitness',
    avatarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
    location: 'Hồ Chí Minh, Việt Nam',
    profileUrl: 'https://youtube.com/@kenhthethao.vn',
    contentSummary: 'Tin tức thể thao, hướng dẫn tập luyện gym & fitness, dinh dưỡng cho người năng động.',
  },
  {
    id: 'cr_3',
    creatorId: 'cr_3',
    displayName: 'Mẹ và bé',
    userName: 'mevabe.review',
    platform: 'tiktok',
    followers: 80000,
    engagementRate: 0.072,
    verifiedByInfluencerMatch: true,
    sourceType: 'PUBLIC',
    niche: 'Gia đình & Mẹ bé',
    avatarUrl: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=400&auto=format&fit=crop&q=80',
    location: 'Hà Nội, Việt Nam',
    profileUrl: 'https://tiktok.com/@mevabe.review',
    contentSummary: 'Chia sẻ kiến thức nuôi dạy con, review đồ dùng mẹ & bé chất lượng và an toàn.',
  },
  {
    id: 'cr_4',
    creatorId: 'cr_4',
    displayName: 'Mỹ Di',
    userName: 'mydii06',
    platform: 'instagram',
    followers: 156000,
    engagementRate: 0.057,
    verifiedByInfluencerMatch: true,
    sourceType: 'AUTHORIZED',
    niche: 'Làm đẹp & Lifestyle',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    location: 'Hồ Chí Minh, Việt Nam',
    profileUrl: 'https://instagram.com/mydii06',
    contentSummary: 'Skincare routine, makeup tutorial phong cách trẻ trung hiện đại và thời trang hàng ngày.',
  },
  {
    id: 'cr_5',
    creatorId: 'cr_5',
    displayName: 'Giải Trí TV',
    userName: 'giaitri.vietnam',
    platform: 'tiktok',
    followers: 310000,
    engagementRate: 0.067,
    verifiedByInfluencerMatch: false,
    sourceType: 'PUBLIC',
    niche: 'Giải trí & Hài hước',
    avatarUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&auto=format&fit=crop&q=80',
    location: 'Đà Nẵng, Việt Nam',
    profileUrl: 'https://tiktok.com/@giaitri.vietnam',
    contentSummary: 'Nội dung hài hước ngắn, parody xu hướng và các tình huống giải trí đời sống.',
  },
  {
    id: 'cr_6',
    creatorId: 'cr_6',
    displayName: 'Linh Beauty',
    userName: 'linh.beauty',
    platform: 'tiktok',
    followers: 420000,
    engagementRate: 0.084,
    verifiedByInfluencerMatch: true,
    sourceType: 'AUTHORIZED',
    niche: 'Làm đẹp & Lifestyle',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    location: 'Hà Nội, Việt Nam',
    profileUrl: 'https://tiktok.com/@linh.beauty',
    contentSummary: 'Chuyên gia mỹ phẩm lành tính, phân tích thành phần dưỡng da và phong cách sống tối giản.',
  },
  {
    id: 'cr_7',
    creatorId: 'cr_7',
    displayName: 'Hùng Food Review',
    userName: 'hungfood',
    platform: 'youtube',
    followers: 650000,
    engagementRate: 0.112,
    verifiedByInfluencerMatch: true,
    sourceType: 'PUBLIC',
    niche: 'Ẩm thực & Đồ ăn',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    location: 'Hồ Chí Minh, Việt Nam',
    profileUrl: 'https://youtube.com/@hungfood',
    contentSummary: 'Review ẩm thực đường phố, nhà hàng độc đáo và các món ngon khắp 3 miền Việt Nam.',
  },
  {
    id: 'cr_8',
    creatorId: 'cr_8',
    displayName: 'Tuấn Tech',
    userName: 'tuantech',
    platform: 'youtube',
    followers: 290000,
    engagementRate: 0.078,
    verifiedByInfluencerMatch: true,
    sourceType: 'AUTHORIZED',
    niche: 'Tech & Gaming',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    location: 'Hà Nội, Việt Nam',
    profileUrl: 'https://youtube.com/@tuantech',
    contentSummary: 'Đánh giá smartphone, laptop, setup góc làm việc công nghệ cao và mẹo phần mềm.',
  },
  {
    id: 'cr_9',
    creatorId: 'cr_9',
    displayName: 'Anh Thư Fashion',
    userName: 'anhthu.fashion',
    platform: 'instagram',
    followers: 520000,
    engagementRate: 0.069,
    verifiedByInfluencerMatch: true,
    sourceType: 'PUBLIC',
    niche: 'Thời trang & OOTD',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    location: 'Hồ Chí Minh, Việt Nam',
    profileUrl: 'https://instagram.com/anhthu.fashion',
    contentSummary: 'Phối đồ OOTD hàng ngày, đón đầu xu hướng thời trang Gen Z và thương hiệu thiết kế Việt.',
  },
  {
    id: 'cr_10',
    creatorId: 'cr_10',
    displayName: 'Châu Bùi',
    userName: 'chaubui_',
    platform: 'instagram',
    followers: 3200000,
    engagementRate: 0.052,
    verifiedByInfluencerMatch: true,
    sourceType: 'AUTHORIZED',
    niche: 'Thời trang & High Fashion',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80',
    location: 'Hà Nội, Việt Nam',
    profileUrl: 'https://instagram.com/chaubui_',
    contentSummary: 'Fashionista hàng đầu Việt Nam, đại sứ các thương hiệu quốc tế và phong cách sống truyền cảm hứng.',
  },
];

export const creatorService = {
  /**
   * Khám phá Creator cho chiến dịch qua 4-Stage Hybrid Discovery Pipeline
   * Swagger Tag: "Creator Discovery"
   * GET /campaigns/{campaignId}/discovery
   * OperationId: discoverCreators
   * Summary: Discover creators for campaign
   * Description: Executes the 4-Stage Hybrid Discovery Pipeline (Hard Filters + Semantic & FTS Search + Rank Fusion + Fallback) to find creators.
   * Query params: keyword, niche, minFollowers, maxFollowers, page, size
   */
  async discoverCreators(
    campaignId: string,
    params?: DiscoverCreatorsParams
  ): Promise<CreatorDiscoveryPageResponse> {
    const response = await apiClient.get<ApiResponse<CreatorDiscoveryPageResponse>>(
      `/campaigns/${campaignId}/discovery`,
      { params }
    );
    return response.data?.data || (response.data as unknown as CreatorDiscoveryPageResponse);
  },
  /**
   * Lấy danh sách toàn bộ creator công khai
   */
  async getCreators(): Promise<CreatorItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<CreatorItem[]>>('/creators');
      const items = response.data?.data || (response.data as unknown as CreatorItem[]) || [];
      if (Array.isArray(items) && items.length > 0) {
        try {
          const withAvatars = items.filter((c) => c.avatarUrl && c.avatarUrl.trim().startsWith('http'));
          if (withAvatars.length > 0) {
            localStorage.setItem('IM_SHOWCASE_CREATORS', JSON.stringify(withAvatars.slice(0, 6)));
          }
        } catch {
          // ignore storage quota error
        }
        return items;
      }
    } catch (err) {
      console.warn('[creatorService.getCreators] Backend API /creators error or unauthorized:', err);
    }
    return [];
  },

  /**
   * Lấy thông tin chi tiết của creator theo ID (GET /creators/{id})
   */
  async getCreatorById(id: string): Promise<CreatorDetail> {
    try {
      const response = await apiClient.get<ApiResponse<CreatorDetail>>(`/creators/${id}`);
      if (response.data?.data) return response.data.data;
      if (response.data) return response.data as unknown as CreatorDetail;
    } catch {
      // fallback
    }
    const found = DEFAULT_CREATORS.find((c) => c.id === id || c.creatorId === id) || DEFAULT_CREATORS[0];
    return {
      id: found.id,
      platform: found.platform,
      externalId: found.id,
      userName: found.userName,
      displayName: found.displayName,
      profileUrl: found.profileUrl,
      avatarUrl: found.avatarUrl,
      location: found.location,
      sourceType: found.sourceType || 'PUBLIC',
      verifiedByInfluencerMatch: !!found.verifiedByInfluencerMatch,
      followers: found.followers || 150000,
      avgViews: Math.round((found.followers || 150000) * 0.25),
      avgLikes: Math.round((found.followers || 150000) * 0.03),
      avgComments: Math.round((found.followers || 150000) * 0.005),
      avgShares: Math.round((found.followers || 150000) * 0.002),
      engagementRate: found.engagementRate ? found.engagementRate * 100 : 5.0,
      niche: found.niche || 'Sáng tạo nội dung',
      contentSummary: found.contentSummary || '',
      recentPosts: [],
    };
  },

  /**
   * Tìm kiếm creator bằng ngữ nghĩa / AI vector search
   * GET /creators/search/semantic?q={keyword}&limit=20 (Model BKAI 768-dim pgvector)
   */
  async searchSemantic(query: string, limit = 20): Promise<CreatorVectorSearchItem[]> {
    const response = await apiClient.get<ApiResponse<CreatorVectorSearchItem[]>>(
      `/creators/search/semantic`,
      {
        params: { q: query, limit },
      }
    );
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Lấy bảng giá (rate card) của creator (GET /creators/{id}/rate-card)
   */
  async getRateCard(creatorId: string): Promise<RateCardResponse> {
    const response = await apiClient.get<ApiResponse<RateCardResponse>>(
      `/creators/${creatorId}/rate-card`
    );
    return response.data?.data || (response.data as unknown as RateCardResponse);
  },

  /**
   * Lấy danh mục các niches/ngành hàng chuẩn (GET /taxonomies/niches)
   */
  async getNiches(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/taxonomies/niches');
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    } catch (err) {
      console.warn('[creatorService] Lỗi khi tải /taxonomies/niches:', err);
      return [];
    }
  },

  /**
   * Gửi yêu cầu claim hồ sơ creator
   */
  async claimCreator(creatorId: string, evidence: Record<string, unknown>): Promise<void> {
    await apiClient.post(`/creators/${creatorId}/claim`, evidence);
  },

  /**
   * Lấy danh sách yêu cầu claim của tài khoản hiện tại
   */
  async getMyClaims(): Promise<unknown[]> {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/creator-claims/me');
    return response.data.data || [];
  },

  /**
   * Dọn dẹp cache cục bộ cũ để đảm bảo Database là nguồn dữ liệu duy nhất
   */
  clearLegacyLocalShortlist(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('IM_LOCAL_SHORTLIST_') || key.startsWith('IM_SHORTLIST_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  },

  /**
   * Lấy danh sách shortlist lưu cục bộ (Persistent fallback cache)
   */
  getLocalShortlist(campaignId: string): ShortlistItem[] {
    try {
      if (!campaignId || campaignId === 'all') {
        const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('IM_SHORTLIST_'));
        const merged: ShortlistItem[] = [];
        const seen = new Set<string>();
        for (const k of allKeys) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(parsed)) {
              for (const it of parsed) {
                const uid = it.creatorId || it.id;
                if (uid && !seen.has(uid)) {
                  seen.add(uid);
                  merged.push(it);
                }
              }
            }
          } catch {}
        }
        return merged;
      }
      const raw = localStorage.getItem(`IM_SHORTLIST_${campaignId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  /**
   * Lưu danh sách shortlist cục bộ để đảm bảo dữ liệu không bị mất khi chuyển trang
   */
  saveLocalShortlist(campaignId: string, items: ShortlistItem[]): void {
    try {
      if (!campaignId || campaignId === 'all') return;
      localStorage.setItem(`IM_SHORTLIST_${campaignId}`, JSON.stringify(items));
    } catch {}
  },

  /**
   * Lấy danh sách shortlist creator của một chiến dịch từ Backend Database + Fallback LocalStorage
   * Swagger: GET /campaigns/{campaignId}/shortlist
   */
  async getShortlist(campaignId: string): Promise<ShortlistItem[]> {
    if (!campaignId) {
      return [];
    }

    const localItems = this.getLocalShortlist(campaignId);

    if (campaignId === 'all') {
      return localItems;
    }

    let backendItems: ShortlistItem[] = [];
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(campaignId);

    if (isUuid) {
      try {
        const response = await apiClient.get<ApiResponse<any>>(
          `/campaigns/${campaignId}/shortlist`,
          { params: { page: 0, size: 100 }, timeout: 4000 }
        );
        const raw = response.data;
        const d = (raw as any)?.data ?? raw;
        const list = Array.isArray(d) ? d : (d?.content || d?.items || []);

        backendItems = (list || []).map((it: any) => ({
          id: it.id || it.shortlistItemId || it.creatorId,
          campaignId: it.campaignId || campaignId,
          creatorId: it.creatorId || it.id,
          creatorName: it.creatorName || it.displayName || it.name || 'Creator',
          avatarUrl: it.avatarUrl || it.avatar,
          platform: it.platform || 'tiktok',
          followers: it.followers || 0,
          engagementRate: it.engagementRate || 0,
          niche: it.niche,
          priority: it.priority || 'HIGH',
          note: it.note || '',
          addedAt: it.addedAt || new Date().toISOString(),
          status: it.status || 'SAVED',
        }));
      } catch (err: any) {
        // Backend shortlist trả lỗi hoặc timeout, dùng localItems để trải nghiệm mượt mà
        console.warn(`[creatorService] getShortlist từ DB không phản hồi hoặc rỗng (${campaignId}):`, err?.message);
        backendItems = [];
      }
    }

    // Hợp nhất backend + local (Ưu tiên backend nhưng không làm mất local)
    const seen = new Set<string>();
    const merged: ShortlistItem[] = [];

    backendItems.forEach((b) => {
      const key = b.creatorId || b.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(b);
      }
    });

    localItems.forEach((l) => {
      const key = l.creatorId || l.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(l);
      }
    });

    // Cập nhật lại local cache để luôn đồng bộ
    if (merged.length > 0) {
      this.saveLocalShortlist(campaignId, merged);
    }

    return merged;
  },

  /**
   * Thêm creator vào danh sách shortlist của chiến dịch và lưu trực tiếp xuống Database + LocalStorage
   * Swagger: POST /campaigns/{campaignId}/shortlist
   */
  async addToShortlist(campaignId: string, payload: AddShortlistItemPayload): Promise<ShortlistItem> {
    const requestBody = {
      creatorId: payload.creatorId,
      priority: (payload.priority || 'HIGH').toUpperCase(),
      note: payload.note || '',
    };

    let serverData: any = null;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(campaignId);

    if (isUuid) {
      try {
        const response = await apiClient.post<ApiResponse<any>>(
          `/campaigns/${campaignId}/shortlist`,
          requestBody,
          { timeout: 5000 }
        );
        serverData = response.data?.data || response.data;
      } catch (err: any) {
        try {
          const response2 = await apiClient.post<ApiResponse<any>>(
            `/campaigns/${campaignId}/shortlist/items`,
            requestBody,
            { timeout: 5000 }
          );
          serverData = response2.data?.data || response2.data;
        } catch (innerErr: any) {
          console.warn(`[creatorService] Backend DB shortlist không khả dụng cho chiến dịch ${campaignId}, lưu vào bộ nhớ dự phòng:`, innerErr?.message || err?.message);
        }
      }
    }

    const item: ShortlistItem = {
      id: serverData?.id || `shortlist_${Date.now()}_${payload.creatorId}`,
      campaignId: serverData?.campaignId || campaignId,
      creatorId: serverData?.creatorId || payload.creatorId,
      creatorName: serverData?.creatorName || payload.creatorName || 'Creator',
      avatarUrl: serverData?.avatarUrl || payload.avatarUrl,
      platform: serverData?.platform || payload.platform || 'tiktok',
      followers: serverData?.followers ?? payload.followers ?? 0,
      engagementRate: serverData?.engagementRate ?? payload.engagementRate ?? 0,
      niche: serverData?.niche || payload.niche,
      priority: serverData?.priority || payload.priority || 'HIGH',
      note: serverData?.note || payload.note || '',
      addedAt: serverData?.addedAt || new Date().toISOString(),
      status: serverData?.status || 'SAVED',
    };

    // Luôn lưu trữ bền vững vào LocalStorage theo campaignId hiện tại
    const currentList = this.getLocalShortlist(campaignId);
    const existingIndex = currentList.findIndex((i) => (i.creatorId || i.id) === item.creatorId);
    if (existingIndex >= 0) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...item };
    } else {
      currentList.unshift(item);
    }
    this.saveLocalShortlist(campaignId, currentList);

    // Đồng thời cập nhật vào danh sách tổng hợp IM_SHORTLIST_ALL
    try {
      const allRaw = localStorage.getItem('IM_SHORTLIST_ALL');
      const allList: ShortlistItem[] = allRaw ? JSON.parse(allRaw) : [];
      const idx = allList.findIndex((i) => (i.creatorId || i.id) === item.creatorId && i.campaignId === campaignId);
      if (idx >= 0) allList[idx] = item;
      else allList.unshift(item);
      localStorage.setItem('IM_SHORTLIST_ALL', JSON.stringify(allList));
    } catch {}

    // Tự động kích hoạt cào dữ liệu mới nhất khi Creator được thêm vào Shortlist (POST /crawl/shortlist-trigger)
    const rawUsername =
      payload.username ||
      (payload as any).userName ||
      (payload as any).handle ||
      payload.creatorName;
    if (rawUsername) {
      this.triggerShortlistCrawl({
        platform: payload.platform || 'TIKTOK',
        username: rawUsername,
        creatorId: payload.creatorId,
        campaignId,
      }).catch(() => null);
    }

    return item;
  },

  /**
   * Kích hoạt cào dữ liệu khi Creator được thêm vào Shortlist
   * POST /api/v1/crawl/shortlist-trigger (FastAPI / Crawler worker)
   */
  async triggerShortlistCrawl(payload: {
    platform: string;
    username: string;
    creatorId?: string;
    campaignId?: string;
  }): Promise<unknown> {
    const cleanPlatform = (payload.platform || 'TIKTOK').toUpperCase();
    const cleanUsername = (payload.username || '').replace(/^@+/, '').trim();
    if (!cleanUsername) return null;

    const body = {
      platform: cleanPlatform,
      username: cleanUsername,
      creatorId: payload.creatorId || null,
      campaignId: payload.campaignId || null,
    };

    // 1. Khi đang chạy local (localhost / 127.0.0.1), ưu tiên gọi trực tiếp tới FastAPI / uvicorn crawler (port 8000)
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      try {
        const resLocal = await fetch('http://localhost:8000/api/v1/crawl/shortlist-trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (resLocal.ok) {
          const data = await resLocal.json();
          console.log('[creatorService] Đã kích hoạt cào dữ liệu qua local crawler (port 8000):', data);
          return data;
        }
      } catch {
        // Local crawler không phản hồi, fallback qua apiClient bên dưới
      }
    }

    // 2. Fallback qua API Gateway / Spring Boot (/api/v1/crawl/shortlist-trigger)
    try {
      const res = await apiClient.post('/crawl/shortlist-trigger', body, { timeout: 5000 });
      console.log('[creatorService] Đã kích hoạt cào dữ liệu qua backend API:', res.data);
      return res.data;
    } catch (err: any) {
      console.warn('[creatorService] Không thể gửi yêu cầu cào dữ liệu /crawl/shortlist-trigger:', err?.message);
      return null;
    }
  },

  /**
   * Xóa creator khỏi shortlist của chiến dịch trong Database + LocalStorage
   * Swagger: DELETE /campaigns/{campaignId}/shortlist/{shortlistItemId}
   */
  async removeFromShortlist(campaignId: string, shortlistItemId: string): Promise<void> {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(campaignId);
    if (isUuid) {
      try {
        await apiClient.delete(`/campaigns/${campaignId}/shortlist/${shortlistItemId}`, { timeout: 4000 });
      } catch (err: any) {
        try {
          await apiClient.delete(`/campaigns/${campaignId}/shortlist/items/${shortlistItemId}`, { timeout: 4000 });
        } catch (innerErr: any) {
          console.warn('[creatorService] Backend delete API không khả dụng, xóa khỏi local storage.');
        }
      }
    }

    // Xóa khỏi LocalStorage
    const currentList = this.getLocalShortlist(campaignId);
    const updated = currentList.filter((it) => it.id !== shortlistItemId && it.creatorId !== shortlistItemId);
    this.saveLocalShortlist(campaignId, updated);

    try {
      const allRaw = localStorage.getItem('IM_SHORTLIST_ALL');
      if (allRaw) {
        const allList: ShortlistItem[] = JSON.parse(allRaw);
        const filteredAll = allList.filter((it) => it.id !== shortlistItemId && it.creatorId !== shortlistItemId);
        localStorage.setItem('IM_SHORTLIST_ALL', JSON.stringify(filteredAll));
      }
    } catch {}
  },

  /**
   * So sánh danh sách creator trong shortlist của chiến dịch
   */
  async compareShortlist(campaignId: string, creatorIds: string[]): Promise<unknown> {
    const response = await apiClient.post(
      `/campaigns/${campaignId}/shortlist/compare`,
      { creatorIds }
    );
    return response.data;
  },

  /**
   * Gửi lời mời tham gia chiến dịch tới Creator (POST /creators/{id}/invite)
   */
  async sendInvitation(creatorId: string, payload: SendInvitationRequest): Promise<InvitationResponse> {
    const response = await apiClient.post<ApiResponse<InvitationResponse>>(
      `/creators/${creatorId}/invite`,
      { creatorId, ...payload }
    );
    return response.data?.data || (response.data as unknown as InvitationResponse);
  },
};

// Tự động dọn dẹp các key cache cục bộ cũ để đảm bảo 100% dữ liệu đồng bộ từ Database
try {
  creatorService.clearLegacyLocalShortlist();
} catch {}

