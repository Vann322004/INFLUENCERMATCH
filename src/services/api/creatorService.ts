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
      console.warn('[creatorService.getCreators] Backend API /creators error or unauthorized. Falling back to structured data:', err);
    }
    return DEFAULT_CREATORS;
  },

  /**
   * Lấy thông tin chi tiết của creator theo ID
   */
  async getCreatorById(id: string): Promise<CreatorDetail> {
    try {
      const response = await apiClient.get<ApiResponse<CreatorDetail>>(`/creators/${id}`);
      if (response.data?.data) return response.data.data;
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
   */
  async searchSemantic(query: string, limit = 10): Promise<CreatorVectorSearchItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<CreatorVectorSearchItem[]>>(
        `/creators/search/semantic`,
        {
          params: { q: query, limit },
        }
      );
      if (response.data?.data && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch {
      // fallback
    }
    const q = query.toLowerCase();
    return DEFAULT_CREATORS
      .filter((c) => c.displayName.toLowerCase().includes(q) || (c.niche && c.niche.toLowerCase().includes(q)) || (c.contentSummary && c.contentSummary.toLowerCase().includes(q)))
      .slice(0, limit)
      .map((c, i) => ({
        id: c.id,
        displayName: c.displayName,
        userName: c.userName,
        platform: c.platform,
        avatarUrl: c.avatarUrl,
        profileUrl: c.profileUrl,
        similarity: 0.95 - i * 0.05,
      }));
  },

  /**
   * Lấy bảng giá (rate card) của creator
   */
  async getRateCard(creatorId: string): Promise<RateCardResponse> {
    try {
      const response = await apiClient.get<ApiResponse<RateCardResponse>>(
        `/creators/${creatorId}/rate-card`
      );
      if (response.data?.data) return response.data.data;
    } catch {
      // fallback
    }
    return {
      creatorId,
      currency: 'VND',
      packages: [
        { name: '1 Video ngắn (Short/Reel/TikTok)', price: 8000000, turnaroundDays: 3 },
        { name: '1 Bài đăng ảnh kèm Caption & Tag', price: 5000000, turnaroundDays: 2 },
        { name: 'Combo Độc quyền 1 tháng', price: 20000000, turnaroundDays: 7 },
      ],
    } as unknown as RateCardResponse;
  },

  /**
   * Lấy danh mục các niches/ngành hàng
   */
  async getNiches(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/taxonomies/niches');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch {
      // fallback
    }
    return [
      'Du lịch & Khám phá',
      'Thể thao & Fitness',
      'Gia đình & Mẹ bé',
      'Làm đẹp & Lifestyle',
      'Giải trí & Hài hước',
      'Ẩm thực & Đồ ăn',
      'Tech & Gaming',
      'Thời trang & OOTD',
    ];
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
   * Lấy danh sách shortlist creator của một chiến dịch
   */
  async getShortlist(campaignId: string): Promise<ShortlistItem[]> {
    const response = await apiClient.get<ApiResponse<{ content?: ShortlistItem[]; items?: ShortlistItem[] }>>(
      `/campaigns/${campaignId}/shortlist`
    );
    const data = response.data.data;
    return (data?.content || data?.items || (Array.isArray(data) ? data : [])) as ShortlistItem[];
  },

  /**
   * Thêm creator vào danh sách shortlist của chiến dịch
   */
  async addToShortlist(campaignId: string, payload: AddShortlistItemPayload): Promise<ShortlistItem> {
    const response = await apiClient.post<ApiResponse<ShortlistItem>>(
      `/campaigns/${campaignId}/shortlist`,
      payload
    );
    return response.data.data;
  },

  /**
   * Xóa creator khỏi shortlist của chiến dịch
   */
  async removeFromShortlist(campaignId: string, shortlistItemId: string): Promise<void> {
    await apiClient.delete(`/campaigns/${campaignId}/shortlist/${shortlistItemId}`);
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
