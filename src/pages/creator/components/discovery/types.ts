export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  isSimilarFallback?: boolean;
  matchRate: number;
  matchLevel: 'high' | 'medium' | 'low';
  matchReason?: string;
  platforms: ('tiktok' | 'instagram' | 'youtube' | 'facebook' | 'x')[];
  categories: string[];
  sourceCategories?: string[];
  hasReportedEngagement?: boolean;
  hasReportedPrice?: boolean;
  bio: string;
  followers: string;
  followersCount: number;
  engagementRate: string;
  engagementValue: number;
  avgPrice: string;
  avgPriceValue: number;
  priceSource?: string;
  location: string;
  language?: string;
  saved?: boolean;
}

export interface BrandCampaignItem {
  targetCreatorCount?: number;
  id: string;
  name: string;
  tag: string;
  target?: string;
  suggestedCategory?: string;
  budget?: string;
  targetAudience?: string;
  category?: string;
  channels?: string[];
  status?: string;
  requirements?: string;
  followerMin?: number;
  followerMax?: number;
}

export interface DiscoveryCache {
  creators: Creator[];
  campaigns: BrandCampaignItem[];
  matchedCampaign: BrandCampaignItem | null;
  selectedCampaignId: string | null;
  categoriesList: string[];
  lastUpdated: number;
}

export const DOMAIN_CLUSTERS = {
  TECH: ['công nghệ', 'tech', 'sạc', 'điện tử', 'phụ kiện', 'laptop', 'điện thoại', 'máy tính', 'gadget', 'game', 'gaming', 'tai nghe', 'audio', 'số', 'thiết bị'],
  BEAUTY: ['mỹ phẩm', 'làm đẹp', 'skincare', 'chăm sóc da', 'son', 'makeup', 'trang điểm', 'nước hoa', 'dưỡng da'],
  FOOD: ['thực phẩm', 'ẩm thực', 'ăn uống', 'food', 'nấu ăn', 'quán', 'món ăn', 'đồ ăn', 'đầu bếp'],
  FASHION: ['thời trang', 'trang phục', 'quần áo', 'ootd', 'giày', 'sneaker', 'túi xách', 'outfit'],
  FITNESS: ['sức khỏe', 'thể thao', 'cơ bắp', 'fitness', 'gym', 'yoga', 'workout', 'thể hình'],
};

export const STOP_WORDS = new Set([
  'sản phẩm', 'chiến dịch', 'quảng bá', 'dự án', 'mục tiêu', 'phẩm', 'hàng',
  'thương hiệu', 'và', 'cho', 'của', 'với', 'trong', 'các', 'những', 'để', 'mới'
]);

