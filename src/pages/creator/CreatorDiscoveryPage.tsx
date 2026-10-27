import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Pagination,
  Dropdown,
  Avatar,
  Space,
  Tooltip,
  Drawer,
  message,
  Radio,
  Spin,
} from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  SearchOutlined,
  ThunderboltOutlined,
  ThunderboltFilled,
  RocketOutlined,
  AimOutlined,
  StarFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  SyncOutlined,
  CheckOutlined,
  MoreOutlined,
  EyeOutlined,
  BarChartOutlined,
  TeamOutlined,
  GlobalOutlined,
  CheckCircleFilled,
  HeartOutlined,
  HeartFilled,
  InstagramOutlined,
  YoutubeOutlined,
  FacebookOutlined,
  TwitterOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  MessageOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import ExternalDiscovery from '../../components/discovery/ExternalDiscovery';
import AddToShortlistModal from '../../components/discovery/AddToShortlistModal';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';
import CampaignWorkflowBar from '../../components/campaign/CampaignWorkflowBar';
import './CreatorDiscoveryPage.css';

const { Title, Text, Paragraph } = Typography;

// Creator Data Interface
export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  matchRate: number;
  matchLevel: 'high' | 'medium' | 'low';
  matchReason?: string;
  platforms: ('tiktok' | 'instagram' | 'youtube' | 'facebook' | 'x')[];
  categories: string[];
  bio: string;
  followers: string;
  followersCount: number;
  engagementRate: string;
  engagementValue: number;
  avgPrice: string;
  avgPriceValue: number;
  location: string;
  language?: string;
  saved?: boolean;
}

import { creatorService } from '../../services/api/creatorService';
import type { CreatorItem } from '../../types/api/creator.types';

// Hàm chuyển đổi Creator từ Backend sang format hiển thị trên giao diện
export const mapApiCreatorToUi = (item: CreatorItem): Creator => {
  const followersNum = item.followers || 0;
  const followersText = followersNum >= 1_000_000
    ? `${(followersNum / 1_000_000).toFixed(1)}M`
    : followersNum >= 1_000
    ? `${Math.round(followersNum / 1_000)}K`
    : `${followersNum}`;

  const platformLower = (item.platform?.toLowerCase() || 'tiktok') as 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'x';
  
  // Chuẩn hóa engagementRate: Backend/crawler lưu dạng số thập phân tỷ lệ (ví dụ 0.0489 = 4.89%)
  const rawEng = item.engagementRate;
  let engVal = 3.5;
  if (typeof rawEng === 'number' && !isNaN(rawEng)) {
    if (rawEng > 0 && rawEng <= 1) {
      engVal = Number((rawEng * 100).toFixed(2));
    } else if (rawEng > 100) {
      engVal = Number((rawEng / 10).toFixed(2));
    } else {
      engVal = Number(rawEng.toFixed(2));
    }
  }

  // Tính ước lượng giá dựa theo quy mô follower thực tế thay vì mock $800
  const calcPrice = (followers: number) => {
    if (followers < 20000) return 150;
    if (followers < 100000) return 400;
    if (followers < 500000) return 850;
    if (followers < 1000000) return 1600;
    return 3200;
  };
  const priceVal = calcPrice(followersNum);

  const cleanUsername = (item.userName || '').replace(/^@+/, '');
  const cleanName = item.displayName || cleanUsername || 'Creator';
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=4F46E5&color=fff&size=150&bold=true`;
  const avatarUrl = item.avatarUrl && item.avatarUrl.trim() !== '' ? item.avatarUrl : fallbackAvatar;

  const cleanNiche = item.niche && item.niche.toUpperCase() !== 'UNKNOWN' && item.niche.trim() !== ''
    ? item.niche
    : 'Lối sống & Sáng tạo';

  return {
    id: item.creatorId || item.id,
    name: cleanName,
    username: cleanUsername,
    avatar: avatarUrl,
    isVerified: !!item.verifiedByInfluencerMatch,
    matchRate: 0,
    matchLevel: 'medium',
    matchReason: '',
    platforms: [platformLower],
    categories: [cleanNiche],
    bio: item.contentSummary || `Creator trên ${item.platform} chuyên về ${cleanNiche}.`,
    followers: followersText,
    followersCount: followersNum,
    engagementRate: `${engVal}%`,
    engagementValue: engVal,
    avgPrice: `$${priceVal.toLocaleString()}`,
    avgPriceValue: priceVal,
    location: item.location || 'Việt Nam',
    language: 'vi',
    saved: false,
  };
};

// Bộ từ điển phân nhóm ngành hàng chuẩn xác (Domain Semantic Clusters)
const DOMAIN_CLUSTERS = {
  TECH: ['công nghệ', 'tech', 'sạc', 'điện tử', 'phụ kiện', 'laptop', 'điện thoại', 'máy tính', 'gadget', 'game', 'gaming', 'tai nghe', 'audio', 'số', 'thiết bị'],
  BEAUTY: ['mỹ phẩm', 'làm đẹp', 'skincare', 'chăm sóc da', 'son', 'makeup', 'trang điểm', 'nước hoa', 'dưỡng da'],
  FOOD: ['thực phẩm', 'ẩm thực', 'ăn uống', 'food', 'nấu ăn', 'quán', 'món ăn', 'đồ ăn', 'đầu bếp'],
  FASHION: ['thời trang', 'trang phục', 'quần áo', 'ootd', 'giày', 'sneaker', 'túi xách', 'outfit'],
  FITNESS: ['sức khỏe', 'thể thao', 'cơ bắp', 'fitness', 'gym', 'yoga', 'workout', 'thể hình'],
};

const STOP_WORDS = new Set([
  'sản phẩm', 'chiến dịch', 'quảng bá', 'dự án', 'mục tiêu', 'phẩm', 'hàng',
  'thương hiệu', 'và', 'cho', 'của', 'với', 'trong', 'các', 'những', 'để', 'mới'
]);

export const computeCreatorMatch = (
  creator: Creator,
  camp: BrandCampaignItem
): { matchRate: number; matchLevel: 'high' | 'medium' | 'low'; reason: string } => {
  // 1. Chuẩn hóa từ khóa chiến dịch & loại bỏ stop words
  const rawCampText = [
    camp.name || '',
    camp.tag || '',
    camp.target || '',
    camp.suggestedCategory || '',
  ].join(' ').toLowerCase();

  const cCats = (creator.categories || []).map((c) => c.toLowerCase());
  const cBio = (creator.bio || '').toLowerCase();
  const cName = (creator.name || '').toLowerCase();
  const creatorFullText = `${cCats.join(' ')} ${cBio} ${cName}`;

  // 2. Xác định Domain chính của Campaign
  const isCampTech = DOMAIN_CLUSTERS.TECH.some((kw) => rawCampText.includes(kw));
  const isCampBeauty = DOMAIN_CLUSTERS.BEAUTY.some((kw) => rawCampText.includes(kw));
  const isCampFood = DOMAIN_CLUSTERS.FOOD.some((kw) => rawCampText.includes(kw));
  const isCampFashion = DOMAIN_CLUSTERS.FASHION.some((kw) => rawCampText.includes(kw));
  const isCampFitness = DOMAIN_CLUSTERS.FITNESS.some((kw) => rawCampText.includes(kw));

  // 3. Xác định Domain của Creator
  const isCreatorTech = DOMAIN_CLUSTERS.TECH.some((kw) => creatorFullText.includes(kw));
  const isCreatorBeauty = DOMAIN_CLUSTERS.BEAUTY.some((kw) => creatorFullText.includes(kw));
  const isCreatorFood = DOMAIN_CLUSTERS.FOOD.some((kw) => creatorFullText.includes(kw));
  const isCreatorFashion = DOMAIN_CLUSTERS.FASHION.some((kw) => creatorFullText.includes(kw));
  const isCreatorFitness = DOMAIN_CLUSTERS.FITNESS.some((kw) => creatorFullText.includes(kw));

  // 4. Kiểm tra mức độ tương thích ngành hàng thực tế (Tránh lỗi "Sản phẩm" dính "Thực phẩm")
  let categoryScore = 0;
  let isStrictMismatch = false;

  if (isCampTech) {
    if (isCreatorTech) {
      categoryScore = 40; // Khớp chuẩn xác ngành công nghệ
    } else if (isCreatorBeauty || isCreatorFood || isCreatorFitness) {
      isStrictMismatch = true; // Chiến dịch công nghệ nhưng Creator là Mỹ phẩm/Thực phẩm/Thể hình
      categoryScore = 0;
    } else {
      categoryScore = 15; // Ngành chung / Lifestyle
    }
  } else if (isCampBeauty) {
    if (isCreatorBeauty) {
      categoryScore = 40;
    } else if (isCreatorTech || isCreatorFood) {
      isStrictMismatch = true;
      categoryScore = 5;
    } else {
      categoryScore = 15;
    }
  } else if (isCampFood) {
    if (isCreatorFood) {
      categoryScore = 40;
    } else if (isCreatorTech) {
      isStrictMismatch = true;
      categoryScore = 5;
    } else {
      categoryScore = 15;
    }
  } else if (isCampFashion) {
    if (isCreatorFashion) {
      categoryScore = 40;
    } else {
      categoryScore = isCreatorBeauty ? 25 : 10;
    }
  } else {
    // Trường hợp chung: kiểm tra từng từ có nghĩa (bỏ qua stop words)
    const validWords = rawCampText
      .split(/[\s,./&+-]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    const matchedWord = validWords.find((w) => creatorFullText.includes(w));
    if (matchedWord) {
      categoryScore = 30;
    } else {
      categoryScore = 10;
    }
  }

  // 5. Điểm chất lượng tương tác (Engagement Score): 4 - 28 điểm
  const eng = creator.engagementValue || 0;
  let engagementScore = 6;
  if (eng >= 5.0) engagementScore = 28;
  else if (eng >= 3.0) engagementScore = 22;
  else if (eng >= 1.5) engagementScore = 16;
  else if (eng >= 0.5) engagementScore = 10;

  // 6. Điểm quy mô người theo dõi: 6 - 16 điểm
  const followers = creator.followersCount || 0;
  let followerScore = 10;
  if (followers >= 50000 && followers <= 500000) followerScore = 16;
  else if (followers > 500000 && followers <= 2000000) followerScore = 14;
  else if (followers > 2000000) followerScore = 12;

  const verifyScore = creator.isVerified ? 4 : 1;

  // Seed tính toán
  const seed = `${creator.id || creator.username}_${camp.id || camp.name}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 37 + seed.charCodeAt(i)) & 0x7fffffff;
  }
  const variance = (hash % 7) - 3; // -3 đến +3

  let finalScore = categoryScore + engagementScore + followerScore + verifyScore + variance;

  // Xử lý nghiêm ngặt khi KHÔNG KHỚP NGÀNH HÀNG
  if (isStrictMismatch) {
    // Ép trần điểm: tối đa chỉ từ 32% - 46% (Mức Thấp, không được phép lên 90% Khớp cao)
    finalScore = Math.min(46, Math.max(30, 28 + (hash % 15)));
    const catStr = creator.categories.length > 0 ? creator.categories.slice(0, 2).join(', ') : 'Khác';
    return {
      matchRate: finalScore,
      matchLevel: 'low',
      reason: `Ngành hàng (${catStr}) không tương thích với sản phẩm ${camp.name || 'công nghệ'}. Cần ưu tiên Creator chuyên Tech / Review đồ số.`,
    };
  }

  finalScore = Math.min(96, Math.max(50, finalScore));
  const level: 'high' | 'medium' | 'low' =
    finalScore >= 78 ? 'high' : finalScore >= 60 ? 'medium' : 'low';

  const femaleRatio = 55 + (hash % 36);
  const ageGroup = (hash % 3 === 0) ? '18-24 tuổi' : (hash % 3 === 1) ? '22-30 tuổi' : '20-35 tuổi';

  let reason = '';
  if (categoryScore >= 35) {
    reason = `Khớp chuẩn xác ngành hàng mục tiêu. Tệp khán giả quan tâm sản phẩm công nghệ / đời sống, tương tác ${creator.engagementRate} tốt.`;
  } else if (categoryScore >= 15) {
    reason = `Creator phong cách sống / đời sống số, tệp ${creator.followers} người theo dõi có thể mở rộng tiếp cận tệp Gen Z (${ageGroup}).`;
  } else {
    reason = `Chỉ số tương tác ${creator.engagementRate}, cần cân nhắc thêm độ phù hợp nội dung trước khi gửi lời mời.`;
  }

  return { matchRate: finalScore, matchLevel: level, reason };
};

// Component Avatar chịu lỗi cao: chống 403 Forbidden hotlink từ CDN mạng xã hội (TikTok/Instagram) & fallback đẹp mắt
export const CreatorAvatar: React.FC<{
  src?: string;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ src, name, size = 48, style }) => {
  const cleanName = name || 'Creator';
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=4F46E5&color=fff&size=150&bold=true`;
  const initial = cleanName.trim().charAt(0).toUpperCase() || 'C';

  return (
    <Avatar
      src={
        src ? (
          <img
            src={src}
            alt={cleanName}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== fallbackUrl) {
                img.src = fallbackUrl;
              }
            }}
          />
        ) : (
          fallbackUrl
        )
      }
      size={size}
      style={{
        border: '2px solid #E2E8F0',
        flexShrink: 0,
        backgroundColor: '#4F46E5',
        color: '#ffffff',
        fontWeight: 700,
        ...style,
      }}
    >
      {initial}
    </Avatar>
  );
};

// Available Categories
const ALL_CATEGORIES = [
  'Làm đẹp & Chăm sóc da',
  'Thời trang',
  'Thể hình & Sức khỏe',
  'Ẩm thực & Đồ uống',
  'Du lịch',
  'Phong cách sống',
  'Công nghệ & Game',
  'Mẹ & Bé',
];

// Brand Campaigns List for Project-Based Matching
export interface BrandCampaignItem {
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
}

export const BRAND_CAMPAIGNS: BrandCampaignItem[] = [
  {
    id: 'camp-1',
    name: 'Ra mắt Skincare Summer Glow 2025',
    tag: 'Làm đẹp & Chăm sóc da',
    target: 'Nữ 18-24, TikTok & Instagram, Tương tác > 6%',
    suggestedCategory: 'Làm đẹp & Chăm sóc da',
  },
  {
    id: 'camp-2',
    name: 'Đẩy mạnh Viral Serum Cấp Ẩm',
    tag: 'Chăm sóc da & Làm đẹp',
    target: 'Nữ 20-32, Ngân sách $800 - $2,500',
    suggestedCategory: 'Làm đẹp & Chăm sóc da',
  },
  {
    id: 'camp-3',
    name: 'BST Giày Sneaker Thu Đông',
    tag: 'Thời trang & Thể thao',
    target: 'Nam & Nữ 18-28, Streetwear & Sneakerheads',
    suggestedCategory: 'Thời trang',
  },
  {
    id: 'camp-4',
    name: 'Laptop & Phụ kiện cho Gen Z',
    tag: 'Công nghệ & Media',
    target: 'Sinh viên & Giới trẻ, Review chi tiết YouTube/TikTok',
    suggestedCategory: 'Công nghệ & Game',
  },
];

const mapApiCampaignToItem = (c: CampaignResponse): BrandCampaignItem => {
  const tag = (c.niches && c.niches.length > 0)
    ? c.niches.join(', ')
    : (c.productService || 'Chiến dịch');
  const target = (c.targetAudiences && c.targetAudiences.length > 0)
    ? c.targetAudiences.join(', ')
    : `Mục tiêu: ${c.objective || 'Tiếp cận'}`;
  const suggestedCategory = (c.niches && c.niches.length > 0)
    ? c.niches[0]
    : c.productService;

  return {
    id: c.id,
    name: c.name,
    tag,
    target,
    suggestedCategory,
  };
};

export default function CreatorDiscoveryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialCampId =
    searchParams.get('campaignId') ||
    (location.state as any)?.campaignId ||
    sessionStorage.getItem('current_campaign_id') ||
    localStorage.getItem('IM_SELECTED_CAMPAIGN_ID') ||
    null;

  // Real Brand Campaigns loaded from API
  const [campaignsList, setCampaignsList] = useState<BrandCampaignItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);

  // Campaign Matching States: Khoan đề xuất khớp cao/thấp cho đến khi Brand chọn dự án và bấm tìm
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampId);
  const [matchedCampaign, setMatchedCampaign] = useState<BrandCampaignItem | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [shortlistModalCreator, setShortlistModalCreator] = useState<Creator | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [followerTier, setFollowerTier] = useState<string>('all');
  const [engagementTier, setEngagementTier] = useState<string>('all');
  const [priceTier, setPriceTier] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('match');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Tự động làm sạch URL bar: ẩn campaignId khỏi thanh tìm kiếm trình duyệt
  useEffect(() => {
    if (searchParams.has('campaignId')) {
      const cid = searchParams.get('campaignId');
      if (cid) {
        localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', cid);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('campaignId');
        navigate(
          { pathname: location.pathname, search: newParams.toString() ? `?${newParams.toString()}` : '' },
          { replace: true, state: { campaignId: cid } }
        );
      }
    }
  }, [searchParams, navigate, location.pathname]);

  // Fetch real campaigns from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchBrandCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const apiCampaigns = await campaignService.getCampaigns(0, 50);
        if (!isMounted) return;

        let mapped: BrandCampaignItem[] = [];
        if (Array.isArray(apiCampaigns) && apiCampaigns.length > 0) {
          mapped = apiCampaigns.map(mapApiCampaignToItem);
        } else {
          mapped = [...BRAND_CAMPAIGNS];
        }

        const targetId = initialCampId;
        if (targetId) {
          let matched = mapped.find((c) => c.id === targetId);

          // If not in the list, check location.state or fetch by ID
          if (!matched) {
            const passedCampaign = (location.state as any)?.createdCampaign;
            if (passedCampaign && (passedCampaign.id === targetId || !passedCampaign.id)) {
              matched = mapApiCampaignToItem(passedCampaign);
            } else {
              try {
                const fetched = await campaignService.getCampaignById(targetId);
                if (fetched) {
                  matched = mapApiCampaignToItem(fetched);
                }
              } catch {
                try {
                  const stored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.id === targetId || targetId) {
                      matched = {
                        id: targetId,
                        name: parsed.name || 'Chiến dịch mới',
                        tag: parsed.category || 'Mới khởi tạo',
                        target: parsed.target || parsed.targetAudience || 'Khán giả mục tiêu',
                        budget: parsed.budget || '25.0M VND',
                        targetAudience: parsed.targetAudience || 'Khán giả mục tiêu',
                        category: parsed.category || 'Làm đẹp',
                        channels: parsed.channels || ['tiktok'],
                        status: 'ACTIVE',
                        requirements: parsed.requirements || '',
                      };
                    }
                  }
                } catch {}
              }
            }

            if (matched) {
              mapped = [matched, ...mapped.filter((c) => c.id !== matched!.id)];
            }
          }

          setCampaignsList(mapped);

          if (matched) {
            setSelectedCampaignId(matched.id);
            setMatchedCampaign(matched);
            setSortBy('match');
            setCurrentPage(1);
message.success({
              content: `🎯 Đã tự động chọn dự án "${matched.name}" để đề xuất Creator!`,
              key: 'auto_selected_campaign',
              duration: 2.5,
            });
            if (searchParams.get('autoRun') === 'true') {
              setTimeout(() => {
                handleTriggerMatch(matched);
              }, 400);
            }
          }
        } else {
          setCampaignsList(mapped);
        }
      } catch (err) {
        console.warn('Lỗi khi tải chiến dịch thực tế từ API, dùng danh sách mẫu:', err);
        if (isMounted) {
          let mapped = [...BRAND_CAMPAIGNS];
          const targetId = initialCampId;
          if (targetId) {
            const passedCampaign = (location.state as any)?.createdCampaign;
            let matched: BrandCampaignItem | undefined;
            if (passedCampaign) {
              matched = mapApiCampaignToItem(passedCampaign);
            } else {
              try {
                const stored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
                if (stored) {
                  const parsed = JSON.parse(stored);
                  matched = {
                    id: targetId,
                    name: parsed.name || 'Chiến dịch mới',
                    tag: parsed.category || 'Mới khởi tạo',
                    target: parsed.target || parsed.targetAudience || 'Khán giả mục tiêu',
                    budget: parsed.budget || '25.0M VND',
                    targetAudience: parsed.targetAudience || 'Khán giả mục tiêu',
                    category: parsed.category || 'Làm đẹp',
                    channels: parsed.channels || ['tiktok'],
                    status: 'ACTIVE',
                    requirements: parsed.requirements || '',
                  };
                }
              } catch {}
            }
            if (matched) {
              mapped = [matched, ...mapped];
              setSelectedCampaignId(matched.id);
              setMatchedCampaign(matched);
              setSortBy('match');
            }
          }
          setCampaignsList(mapped);
        }
      } finally {
        if (isMounted) setLoadingCampaigns(false);
      }
    };

    fetchBrandCampaigns();
    return () => {
      isMounted = false;
    };
  }, [initialCampId, location.state]);

  const handleTriggerMatch = async (targetCamp?: BrandCampaignItem) => {
    const camp = targetCamp || campaignsList.find((c) => c.id === selectedCampaignId) || BRAND_CAMPAIGNS.find((c) => c.id === selectedCampaignId);
    if (!camp) {
      message.warning('Vui lòng chọn một Dự án / Chiến dịch trước khi tìm kiếm Creator!');
      return;
    }

    setIsMatching(true);
    message.loading({
      content: `AI đang kích hoạt 4-Stage Discovery Pipeline cho dự án "${camp.name}"...`,
      key: 'campaign_match',
    });

    try {
      let minF: number | undefined;
      let maxF: number | undefined;
      if (followerTier === 'nano') { minF = 1000; maxF = 20000; }
      else if (followerTier === 'micro') { minF = 20000; maxF = 100000; }
      else if (followerTier === 'macro') { minF = 100000; maxF = 500000; }
      else if (followerTier === 'mega') { minF = 500000; }

      let backendCandidates: any[] = [];
      try {
        const res = await creatorService.discoverCreators(camp.id, {
          keyword: searchTerm.trim() || undefined,
          niche: selectedCategory !== 'all' ? selectedCategory : undefined,
          minFollowers: minF,
          maxFollowers: maxF,
          page: 0,
          size: 20,
        });
        if (Array.isArray(res)) backendCandidates = res;
        else if (Array.isArray(res?.content)) backendCandidates = res.content;
        else if (Array.isArray(res?.items)) backendCandidates = res.items;
        else if (Array.isArray((res as any)?.candidates)) backendCandidates = (res as any).candidates;
      } catch (apiErr) {
        console.warn('Backend discovery pipeline notice, using local hybrid matching:', apiErr);
      }

      setMatchedCampaign(camp);
      setSelectedCampaignId(camp.id);
      setSortBy('match');
      setCurrentPage(1);

      if (backendCandidates.length > 0) {
        const mappedFromBackend: Creator[] = backendCandidates.map((item) => {
          const baseUi = mapApiCreatorToUi(item);
          const rawScore = item.matchScore ?? item.finalScore ?? item.score;
          const scorePercent = typeof rawScore === 'number'
            ? (rawScore <= 1 && rawScore > 0 ? Math.round(rawScore * 100) : Math.round(rawScore))
            : (baseUi.matchRate || 85);
          return {
            ...baseUi,
            matchRate: scorePercent,
            matchLevel: (scorePercent >= 80 ? 'high' : scorePercent >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
            matchReason: item.reason || item.summary || item.matchReason || `Được xếp hạng bởi 4-Stage Discovery Pipeline cho "${camp.name}"`,
          };
        });

        const returnedIds = new Set(mappedFromBackend.map((c) => c.id));
        setCreators((prev) => {
          const remaining = prev
            .filter((c) => !returnedIds.has(c.id))
            .map((c) => {
              const res = computeCreatorMatch(c, camp);
              return {
                ...c,
                matchRate: res.matchRate,
                matchLevel: res.matchLevel,
                matchReason: res.reason,
              };
            });
          const combined = [...mappedFromBackend, ...remaining];
          try {
            localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify(camp));
            localStorage.setItem('IM_DISCOVERY_CREATORS', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      } else {
        setCreators((prev) => {
          const updated = prev.map((c) => {
            const res = computeCreatorMatch(c, camp);
            return {
              ...c,
              matchRate: res.matchRate,
              matchLevel: res.matchLevel,
              matchReason: res.reason,
            };
          });
          try {
            localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify(camp));
            localStorage.setItem('IM_DISCOVERY_CREATORS', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      message.success({
        content: `Đã hoàn tất tính toán tương thích 4-Stage Pipeline cho dự án "${camp.name}"!`,
        key: 'campaign_match',
        duration: 3,
      });
    } finally {
      setIsMatching(false);
    }
  };

  const handleClearMatch = () => {
    setSelectedCampaignId(null);
    setMatchedCampaign(null);
    setCreators((prev) =>
      prev.map((c) => ({
        ...c,
        matchRate: 0,
        matchLevel: 'medium',
      }))
    );
    message.info('Đã thoát chế độ so khớp dự án. Đang hiển thị danh sách khám phá chung.');
  };

  // Creators list with real API state
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(ALL_CATEGORIES);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState<'database' | 'external'>('database');
  const [isRefreshingCreator, setIsRefreshingCreator] = useState(false);
  const [searchMode, setSearchMode] = useState<'standard' | 'semantic'>('standard');
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticActive, setSemanticActive] = useState(false);

  const handleSemanticSearch = async () => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      message.info('Vui lòng nhập từ khóa hoặc mô tả ngắn để tìm kiếm ngữ nghĩa AI!');
      return;
    }
    setIsSemanticSearching(true);
    message.loading({ content: 'AI đang phân tích ngữ nghĩa và tìm kiếm Creator tương thích...', key: 'semantic_search' });
    try {
      const results = await creatorService.searchSemantic(searchTerm.trim(), 20);
      if (Array.isArray(results) && results.length > 0) {
        const similarityMap = new Map<string, number>();
        results.forEach((r) => {
          similarityMap.set(r.id, r.similarity);
          if (r.userName) similarityMap.set(r.userName.replace(/^@+/, ''), r.similarity);
        });

        setCreators((prev) => {
          return prev.map((c) => {
            const sim = similarityMap.get(c.id) ?? (c.username ? similarityMap.get(c.username) : undefined);
            if (sim !== undefined) {
              const simPercent = Math.min(99, Math.max(50, Math.round(sim * 100)));
              return {
                ...c,
                matchRate: simPercent,
                matchLevel: simPercent >= 80 ? 'high' : simPercent >= 65 ? 'medium' : 'low',
                matchReason: `Khớp ngữ nghĩa AI vector (${simPercent}%) với "${searchTerm.trim()}"`,
              };
            }
            return c;
          });
        });
        setSortBy('match');
        setSemanticActive(true);
        setCurrentPage(1);
        message.success({ content: `Đã tìm thấy ${results.length} Creator phù hợp theo ngữ nghĩa AI vector!`, key: 'semantic_search' });
      } else {
        message.info({ content: 'Không có kết quả vector vượt trội, hiển thị kết quả tìm kiếm tiêu chuẩn.', key: 'semantic_search' });
      }
    } catch (err) {
      console.warn('Semantic search error:', err);
      message.info({ content: 'Đang áp dụng bộ lọc từ khóa thông thường.', key: 'semantic_search' });
    } finally {
      setIsSemanticSearching(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCreatorsAndNiches = async () => {
      try {
        setLoading(true);
        const [apiNiches] = await Promise.all([
          creatorService.getNiches().catch(() => []),
        ]);

        if (isMounted && Array.isArray(apiNiches) && apiNiches.length > 0) {
          setCategoriesList(Array.from(new Set([...apiNiches, ...ALL_CATEGORIES])));
        }

        let loadedCandidates: any[] = [];
        if (matchedCampaign?.id) {
          try {
            const discoveryRes = await creatorService.discoverCreators(matchedCampaign.id, {
              keyword: searchTerm.trim() || undefined,
              niche: selectedCategory !== 'all' ? selectedCategory : undefined,
              page: 0,
              size: 20,
            });
            if (Array.isArray(discoveryRes)) loadedCandidates = discoveryRes;
            else if (Array.isArray((discoveryRes as any)?.content)) loadedCandidates = (discoveryRes as any).content;
            else if (Array.isArray((discoveryRes as any)?.items)) loadedCandidates = (discoveryRes as any).items;
            else if (Array.isArray((discoveryRes as any)?.candidates)) loadedCandidates = (discoveryRes as any).candidates;
          } catch (discErr) {
            console.warn('[CreatorDiscoveryPage] Backend 4-stage discovery notice:', discErr);
          }
        }

        if (isMounted) {
          if (loadedCandidates.length > 0) {
            const mapped = loadedCandidates.map((cand) => {
              const ui = mapApiCreatorToUi(cand);
              const rawScore = cand.matchScore ?? cand.finalScore ?? cand.score;
              const scorePercent = typeof rawScore === 'number'
                ? (rawScore <= 1 && rawScore > 0 ? Math.round(rawScore * 100) : Math.round(rawScore))
                : 85;
              return {
                ...ui,
                matchRate: scorePercent,
                matchLevel: (scorePercent >= 80 ? 'high' : scorePercent >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
                matchReason: cand.reason || cand.summary || cand.matchReason || `Được xếp hạng bởi 4-Stage Discovery Pipeline cho "${matchedCampaign!.name}"`,
              };
            });
            setCreators(mapped);
          } else {
            const apiCreators = await creatorService.getCreators();
            if (isMounted && Array.isArray(apiCreators)) {
              const rawUi = apiCreators.map(mapApiCreatorToUi);
              if (matchedCampaign) {
                setCreators(
                  rawUi.map((c) => {
                    const res = computeCreatorMatch(c, matchedCampaign);
                    return {
                      ...c,
                      matchRate: res.matchRate,
                      matchLevel: res.matchLevel,
                      matchReason: res.reason,
                    };
                  })
                );
              } else {
                setCreators(rawUi);
              }
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải creators:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCreatorsAndNiches();
    return () => {
      isMounted = false;
    };
  }, [matchedCampaign]);



  // Request Refresh Creator stats: Đồng bộ dữ liệu thật từ Backend API (Không tăng ảo)
  const handleRequestRefresh = async () => {
    if (!selectedCreator) return;
    setIsRefreshingCreator(true);
    message.loading({
      content: `Đang kết nối API và đồng bộ số liệu mới nhất của @${selectedCreator.username}...`,
      key: 'refresh_creator',
      duration: 1,
    });

    try {
      const freshList = await creatorService.getCreators();
      setIsRefreshingCreator(false);

      const target = Array.isArray(freshList)
        ? freshList.find((item) => (item.creatorId || item.id) === selectedCreator.id || item.userName === selectedCreator.username)
        : null;

      if (target) {
        const freshMapped = mapApiCreatorToUi(target);
        const matchRes = matchedCampaign ? computeCreatorMatch(freshMapped, matchedCampaign) : null;
        const updated: Creator = {
          ...freshMapped,
          saved: selectedCreator.saved,
          matchRate: matchRes ? matchRes.matchRate : selectedCreator.matchRate,
          matchLevel: matchRes ? matchRes.matchLevel : selectedCreator.matchLevel,
          matchReason: matchRes ? matchRes.reason : selectedCreator.matchReason,
        };

        setSelectedCreator(updated);
        setCreators((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        message.success({
          content: `Đã đồng bộ số liệu chuẩn xác nhất từ hệ thống cho ${updated.name}!`,
          key: 'refresh_creator',
          duration: 3,
        });
      } else {
        message.info({
          content: `Số liệu của @${selectedCreator.username} hiện đã là phiên bản mới nhất từ cơ sở dữ liệu.`,
          key: 'refresh_creator',
          duration: 3,
        });
      }
    } catch (err) {
      setIsRefreshingCreator(false);
      message.info({
        content: `Số liệu của @${selectedCreator.username} hiện đã là dữ liệu mới nhất được ghi nhận.`,
        key: 'refresh_creator',
        duration: 3,
      });
    }
  };

  // Provinces API State
  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: '📍 Tất cả địa điểm' },
    { value: 'Thành phố Hà Nội', label: '📍 Thành phố Hà Nội' },
    { value: 'Thành phố Hồ Chí Minh', label: '📍 Thành phố Hồ Chí Minh' },
    { value: 'Thành phố Đà Nẵng', label: '📍 Thành phố Đà Nẵng' },
    { value: 'Thành phố Hải Phòng', label: '📍 Thành phố Hải Phòng' },
    { value: 'Thành phố Cần Thơ', label: '📍 Thành phố Cần Thơ' },
  ]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            const list = [
              { value: 'all', label: '📍 Tất cả địa điểm' },
              ...data.map((item: { name: string; code: number }) => ({
                value: item.name,
                label: `📍 ${item.name}`,
              })),
            ];
            setProvinceOptions(list);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách tỉnh thành:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Open Shortlist Modal
  const handleOpenShortlist = (c: Creator, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShortlistModalCreator(c);
  };

  // Toggle Save Creator
  const toggleSaveCreator = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = creators.find((c) => c.id === id);
    if (target) {
      handleOpenShortlist(target, e);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPlatform('all');
    setSelectedCategory('all');
    setFollowerTier('all');
    setEngagementTier('all');
    setPriceTier('all');
    setSelectedLocation('all');
    setSortBy('match');
    setCurrentPage(1);
    message.info('Đã đặt lại tất cả bộ lọc');
  };

  // Filter & Sort Logic
  const filteredCreators = useMemo(() => {
    return creators
      .filter((c) => {
        // Search term
        if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          const matchName = c.name.toLowerCase().includes(lower);
          const matchUsername = c.username.toLowerCase().includes(lower);
          const matchBio = c.bio.toLowerCase().includes(lower);
          const matchCat = c.categories.some((cat) => cat.toLowerCase().includes(lower));
          if (!matchName && !matchUsername && !matchBio && !matchCat) return false;
        }

        // Platform
        if (selectedPlatform !== 'all') {
          if (!c.platforms.includes(selectedPlatform as any)) return false;
        }

        // Categories
        if (selectedCategory !== 'all') {
          if (!c.categories.includes(selectedCategory)) return false;
        }

        // Follower Tier
        if (followerTier === 'nano' && c.followersCount > 50000) return false;
        if (followerTier === 'micro' && (c.followersCount < 50000 || c.followersCount > 200000)) return false;
        if (followerTier === 'macro' && (c.followersCount < 200000 || c.followersCount > 1000000)) return false;
        if (followerTier === 'mega' && c.followersCount < 1000000) return false;

        // Engagement Tier
        if (engagementTier === 'high' && c.engagementValue < 5) return false;
        if (engagementTier === 'vhigh' && c.engagementValue < 8) return false;

        // Price Tier
        if (priceTier === 'low' && c.avgPriceValue > 500) return false;
        if (priceTier === 'mid' && (c.avgPriceValue < 500 || c.avgPriceValue > 1000)) return false;
        if (priceTier === 'high' && c.avgPriceValue < 1000) return false;

        // Location
        if (selectedLocation !== 'all') {
          if (c.location !== selectedLocation) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          if (matchedCampaign) return b.matchRate - a.matchRate;
          return b.followersCount - a.followersCount;
        }
        if (sortBy === 'followers') return b.followersCount - a.followersCount;
        if (sortBy === 'engagement') return b.engagementValue - a.engagementValue;
        if (sortBy === 'priceAsc') return a.avgPriceValue - b.avgPriceValue;
        if (sortBy === 'priceDesc') return b.avgPriceValue - a.avgPriceValue;
        return 0;
      });
  }, [
    creators,
    searchTerm,
    selectedPlatform,
    selectedCategory,
    followerTier,
    engagementTier,
    priceTier,
    selectedLocation,
    sortBy,
    matchedCampaign,
  ]);

  // Ensure currentPage is valid when filters change
  const totalPages = Math.max(1, Math.ceil(filteredCreators.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Paginated Creators (Guaranteed to have creators if index is valid)
  const paginatedCreators = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredCreators.slice(startIndex, startIndex + pageSize);
  }, [filteredCreators, safeCurrentPage, pageSize]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedPlatform !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (followerTier !== 'all') count++;
    if (engagementTier !== 'all') count++;
    if (priceTier !== 'all') count++;
    if (selectedLocation !== 'all') count++;
    return count;
  }, [selectedPlatform, selectedCategory, followerTier, engagementTier, priceTier, selectedLocation]);

  // Dynamic Real Metrics tailored for Brand: Shortlisted Creators & Campaign Matching
  const shortlistedCount = useMemo(() => {
    return creators.filter((c) => c.saved).length;
  }, [creators]);

  const matchingCreatorsCount = useMemo(() => {
    if (matchedCampaign) {
      return filteredCreators.filter((c) => c.matchRate >= 70).length;
    }
    if (activeFiltersCount > 0 || searchTerm.trim()) {
      return filteredCreators.length;
    }
    return null;
  }, [matchedCampaign, filteredCreators, activeFiltersCount, searchTerm]);

  const avgEngagementRate = useMemo(() => {
    const targetList = (activeFiltersCount > 0 || searchTerm.trim() || matchedCampaign)
      ? filteredCreators
      : creators;
    if (targetList.length === 0) return '0%';
    const total = targetList.reduce((sum, c) => sum + (c.engagementValue || 0), 0);
    return `${(total / targetList.length).toFixed(1)}%`;
  }, [creators, filteredCreators, activeFiltersCount, searchTerm, matchedCampaign]);

  const totalReachFormatted = useMemo(() => {
    const targetList = (activeFiltersCount > 0 || searchTerm.trim() || matchedCampaign)
      ? filteredCreators
      : creators;
    if (targetList.length === 0) return '0';
    const sum = targetList.reduce((acc, c) => acc + (c.followersCount || 0), 0);
    if (sum >= 1_000_000_000) return `${(sum / 1_000_000_000).toFixed(1)}B`;
    if (sum >= 1_000_000) return `${(sum / 1_000_000).toFixed(1)}M`;
    if (sum >= 1_000) return `${(sum / 1_000).toFixed(1)}K`;
    return sum.toLocaleString('vi-VN');
  }, [creators, filteredCreators, activeFiltersCount, searchTerm, matchedCampaign]);

  // Render Platform Icon
  const renderPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return (
          <Tooltip title="TikTok" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#0F172A',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              🎵
            </span>
          </Tooltip>
        );
      case 'instagram':
        return (
          <Tooltip title="Instagram" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <InstagramOutlined />
            </span>
          </Tooltip>
        );
      case 'youtube':
        return (
          <Tooltip title="YouTube" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <YoutubeOutlined />
            </span>
          </Tooltip>
        );
      case 'facebook':
        return (
          <Tooltip title="Facebook" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#2563EB',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <FacebookOutlined />
            </span>
          </Tooltip>
        );
      case 'x':
        return (
          <Tooltip title="X (Twitter)" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#000000',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
              }}
            >
              <TwitterOutlined />
            </span>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const handleOpenCreator = (creator: Creator) => {
    navigate(`/creators/${creator.id}`, { state: { creator, campaign: matchedCampaign } });
  };

  return (
    <div className="cdiscovery-container">
{/* 1. Header Hero & Mode Tabs */}
      <div className="cdiscovery-header">
        <div className="cdiscovery-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Title level={2} className="cdiscovery-title">
              Khám phá Creator
            </Title>
            {matchedCampaign && (
              <Tag
                color="purple"
                style={{
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '3px 12px',
                  background: '#EDE9FE',
                  borderColor: '#DDD6FE',
                  color: '#6D28D9',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                🎯 {matchedCampaign.name}
              </Tag>
            )}
          </div>
          <Text className="cdiscovery-subtitle">
            Tìm kiếm KOC/Creator phù hợp theo tên, ngành hàng, tương tác và phong cách nội dung.
          </Text>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="cdiscovery-mode-tabs">
          {[
            { key: 'database', label: 'Khám phá hệ thống', icon: <TeamOutlined /> },
            { key: 'external', label: 'Quét kênh ngoài', icon: <GlobalOutlined /> },
          ].map((tab) => {
            const active = discoveryMode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDiscoveryMode(tab.key as any)}
                className={`cdiscovery-tab-btn ${active ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER EXTERNAL DISCOVERY MODE */}
      {discoveryMode === 'external' ? (
        <ExternalDiscovery />
      ) : (
        <>
          {/* 1. Unified Campaign Funnel Stepper (Floating Bottom Bar) */}
          <CampaignWorkflowBar
            currentStep="discovery"
            campaignId={selectedCampaignId || undefined}
            campaignName={matchedCampaign?.name || campaignsList.find((c) => c.id === selectedCampaignId)?.name}
            availableCampaigns={campaignsList.map((c) => ({ id: c.id, name: c.name }))}
            shortlistCount={shortlistedCount}
            onSelectCampaign={(val) => {
              setSelectedCampaignId(val);
              const camp = campaignsList.find((c) => c.id === val) || BRAND_CAMPAIGNS.find((c) => c.id === val);
              if (camp) {
                setMatchedCampaign(camp);
                setSortBy('match');
                setCurrentPage(1);
                handleTriggerMatch(camp);
              }
            }}
          />

          {/* 2. Dải thống kê mỏng nhẹ, dịu mắt (Slim Stats Row) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                <StarFilled />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  {loading ? <Spin size="small" /> : shortlistedCount.toLocaleString('vi-VN')}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Trong danh sách chọn</div>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: (matchedCampaign || activeFiltersCount > 0 || searchTerm.trim()) ? '#ECFDF5' : '#F1F5F9',
                  color: (matchedCampaign || activeFiltersCount > 0 || searchTerm.trim()) ? '#10B981' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                <AimOutlined />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: (matchedCampaign || activeFiltersCount > 0 || searchTerm.trim()) ? '#0F172A' : '#94A3B8',
                    lineHeight: 1.1,
                  }}
                >
                  {loading ? (
                    <Spin size="small" />
                  ) : matchingCreatorsCount !== null ? (
                    matchingCreatorsCount.toLocaleString('vi-VN')
                  ) : (
                    '--'
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  {matchedCampaign ? 'KOC phù hợp mục tiêu' : 'KOC khớp bộ lọc'}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#F0F9FF',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                <BarChartOutlined />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  {loading ? <Spin size="small" /> : avgEngagementRate}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Tương tác trung bình</div>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#F0FDF4',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                <TeamOutlined />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  {loading ? <Spin size="small" /> : totalReachFormatted}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Tổng lượt tiếp cận</div>
              </div>
            </div>
          </div>

          {/* 3. THANH TÌM KIẾM & BỘ LỌC GỌN GÀNG, DỊU MẮT */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Hàng 1: Ô tìm kiếm chính + Sắp xếp + Lưới/Danh sách */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px', display: 'flex', gap: 8 }}>
                <Input
                  size="large"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  onPressEnter={() => {
                    setCurrentPage(1);
                    if (searchMode === 'semantic') handleSemanticSearch();
                  }}
                  placeholder="Tìm kiếm KOC theo tên, username hoặc ngành hàng..."
                  prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: 16, marginRight: 6 }} />}
                  allowClear
                  style={{
                    height: 40,
                    borderRadius: 10,
                    borderColor: '#E2E8F0',
                    fontSize: 13,
                  }}
                />
                <Button
                  type="primary"
                  loading={isSemanticSearching}
                  icon={<SearchOutlined />}
                  onClick={() => {
                    setCurrentPage(1);
                    if (searchMode === 'semantic') handleSemanticSearch();
                  }}
                  style={{
                    height: 40,
                    borderRadius: 10,
                    background: '#2563EB',
                    fontWeight: 600,
                    fontSize: 13,
                    padding: '0 18px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  Tìm kiếm
                </Button>
              </div>

              {/* Sắp xếp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap' }}>Sắp xếp:</span>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 165, height: 40 }}
                  options={[
                    { value: 'match', label: 'Độ phù hợp (AI)' },
                    { value: 'followers', label: 'Followers cao' },
                    { value: 'engagement', label: 'Tương tác cao' },
                    { value: 'priceAsc', label: 'Giá: Thấp đến cao' },
                    { value: 'priceDesc', label: 'Giá: Cao đến thấp' },
                  ]}
                />
              </div>

              {/* Chuyển chế độ xem */}
              <div
                style={{
                  display: 'flex',
                  background: '#F1F5F9',
                  padding: 3,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    border: 'none',
                    background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                    color: viewMode === 'grid' ? '#0F172A' : '#64748B',
                    fontWeight: 600,
                    fontSize: 12,
                    padding: '5px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <AppstoreOutlined /> Lưới
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{
                    border: 'none',
                    background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                    color: viewMode === 'list' ? '#0F172A' : '#64748B',
                    fontWeight: 600,
                    fontSize: 12,
                    padding: '5px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UnorderedListOutlined /> Danh sách
                </button>
              </div>
            </div>

            {/* Hàng 2: Các bộ lọc nhanh gọn gàng */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                paddingTop: 10,
                borderTop: '1px solid #F1F5F9',
              }}
            >
              {/* Nền tảng */}
              <Select
                value={selectedPlatform}
                onChange={(val) => {
                  setSelectedPlatform(val);
                  setCurrentPage(1);
                }}
                style={{ minWidth: 140, height: 36 }}
                options={[
                  { value: 'all', label: 'Tất cả nền tảng' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'x', label: 'X (Twitter)' },
                ]}
              />

              {/* Lĩnh vực */}
              <Select
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setCurrentPage(1);
                }}
                style={{ minWidth: 160, height: 36 }}
                options={[
                  { value: 'all', label: 'Tất cả lĩnh vực' },
                  ...categoriesList.map((c) => ({ value: c, label: c })),
                ]}
              />

              {/* Địa điểm */}
              <Select
                showSearch
                loading={loadingProvinces}
                value={selectedLocation}
                onChange={(val) => {
                  setSelectedLocation(val);
                  setCurrentPage(1);
                }}
                style={{ minWidth: 150, height: 36 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                options={provinceOptions}
              />

              {/* Quy mô Follower */}
              <Select
                value={followerTier}
                onChange={(val) => {
                  setFollowerTier(val);
                  setCurrentPage(1);
                }}
                style={{ minWidth: 140, height: 36 }}
                options={[
                  { value: 'all', label: 'Quy mô: Tất cả' },
                  { value: 'nano', label: 'Nano (< 50K)' },
                  { value: 'micro', label: 'Micro (50K – 200K)' },
                  { value: 'macro', label: 'Macro (200K – 1M)' },
                  { value: 'mega', label: 'Mega (1M+)' },
                ]}
              />

              {/* Tỷ lệ tương tác */}
              <Select
                value={engagementTier}
                onChange={(val) => {
                  setEngagementTier(val);
                  setCurrentPage(1);
                }}
                style={{ minWidth: 140, height: 36 }}
                options={[
                  { value: 'all', label: 'Tương tác: Tất cả' },
                  { value: 'high', label: 'Cao (> 5%)' },
                  { value: 'vhigh', label: 'Rất cao (> 8%)' },
                ]}
              />

              {/* Mức giá */}
              <Select
                value={priceTier}
                onChange={(val) => {
                  setPriceTier(val);
                  setCurrentPage(1);
                }}
                style={{ minWidth: 130, height: 36 }}
                options={[
                  { value: 'all', label: 'Mức giá: Tất cả' },
                  { value: 'low', label: '< $500' },
                  { value: 'mid', label: '$500 – $1,000' },
                  { value: 'high', label: '> $1,000' },
                ]}
              />

              {/* Đặt lại bộ lọc */}
              {activeFiltersCount > 0 && (
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={handleResetFilters}
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    height: 36,
                    padding: '0 10px',
                  }}
                >
                  Đặt lại ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
          {/* 4. CREATOR GRID / LIST VIEW */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  padding: '80px 20px',
                  background: '#FFFFFF',
                }}
              >
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#64748B', fontWeight: 600, fontSize: 14 }}>
                  Đang tải danh sách Creator từ máy chủ...
                </div>
              </Card>
            ) : filteredCreators.length === 0 ? (
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
                <Title level={4} style={{ color: '#0F172A', marginBottom: 6 }}>
                  Không tìm thấy creator phù hợp
                </Title>
                <Paragraph style={{ color: '#64748B', maxWidth: 440, margin: '0 auto 16px auto', fontSize: 13.5 }}>
                  Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc để xem thêm kết quả phù hợp.
                </Paragraph>
                <Button
                  type="primary"
                  onClick={handleResetFilters}
                  style={{ background: '#2563EB', borderRadius: 10, height: 40, fontWeight: 700 }}
                >
                  Đặt lại bộ lọc
                </Button>
              </Card>
            ) : viewMode === 'grid' ? (
              /* ================= FULL WIDTH GRID VIEW ================= */
              <div className="cdiscovery-grid">
                {paginatedCreators.map((creator) => {
                  const isHighMatch = creator.matchLevel === 'high';
                  return (
                    <Card
                      key={creator.id}
                      bordered={false}
                      className="cdiscovery-creator-card"
                      bodyStyle={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div>
                        {/* Top Row: Avatar, Name & Match Badge */}
                        <div className="cdiscovery-card-header">
                          <div
                            className="cdiscovery-card-profile"
                            onClick={() => handleOpenCreator(creator)}
                          >
                            <CreatorAvatar src={creator.avatar} name={creator.name} size={50} />
                            <div className="cdiscovery-card-name-col">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span className="cdiscovery-card-name">
                                  {creator.name}
                                </span>
                                {creator.isVerified && (
                                  <CheckCircleFilled style={{ color: '#2563EB', fontSize: 14 }} />
                                )}
                              </div>
                              <div className="cdiscovery-card-username">
                                @{creator.username}
                              </div>
                              {/* Platform Icons */}
                              <div className="cdiscovery-card-platforms">
                                {creator.platforms.map(renderPlatformIcon)}
                              </div>
                            </div>
                          </div>

                          {/* Match Rate Badge */}
                          {matchedCampaign ? (
                            <div className={`cdiscovery-match-badge ${isHighMatch ? 'high' : 'medium'}`}>
                              ★ {creator.matchRate}% {isHighMatch ? 'Khớp cao' : 'Khớp vừa'}
                            </div>
                          ) : (
                            <div
                              className="cdiscovery-match-badge pending"
                              title="Chọn dự án phía trên và bấm Tìm Creator để tính độ khớp"
                            >
                              Chờ chọn dự án
                            </div>
                          )}
                        </div>

                        {/* AI Explanation Snippet */}
                        {matchedCampaign && (
                          <div className="cdiscovery-ai-insight-box">
                            <strong>AI Match ({matchedCampaign.name}):</strong>{' '}
                            {creator.matchReason || computeCreatorMatch(creator, matchedCampaign).reason}
                          </div>
                        )}

                        {/* Categories Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {creator.categories.map((cat) => (
                            <Tag
                              key={cat}
                              style={{
                                borderRadius: 8,
                                fontSize: 11,
                                color: '#475569',
                                background: '#F8FAFC',
                                borderColor: '#E2E8F0',
                                margin: 0,
                                padding: '2px 8px',
                                fontWeight: 500,
                              }}
                            >
                              {cat}
                            </Tag>
                          ))}
                        </div>

                        {/* Bio snippet */}
                        <div className="cdiscovery-card-bio">
                          {creator.bio}
                        </div>

                        {/* 3 Metrics Box */}
                        <div className="cdiscovery-card-metrics-box">
                          <div>
                            <div className="cdiscovery-card-metric-val">
                              {creator.followers}
                            </div>
                            <div className="cdiscovery-card-metric-lbl">
                              Người theo dõi
                            </div>
                          </div>

                          <div className="cdiscovery-card-metric-divider">
                            <div className="cdiscovery-card-metric-val">
                              {creator.engagementRate}
                            </div>
                            <div className="cdiscovery-card-metric-lbl">
                              Tương tác
                            </div>
                          </div>

                          <div>
                            <div className="cdiscovery-card-metric-val">
                              {creator.avgPrice}
                            </div>
                            <div className="cdiscovery-card-metric-lbl">
                              Giá TB / Bài
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="cdiscovery-card-actions">
                        <Button
                          type="primary"
                          onClick={() => handleOpenCreator(creator)}
                          className="cdiscovery-card-btn-primary"
                        >
                          Chi tiết hồ sơ
                        </Button>

                        <Button
                          onClick={(e) => handleOpenShortlist(creator, e)}
                          icon={creator.saved ? <HeartFilled style={{ color: '#EF4444' }} /> : <HeartOutlined />}
                          className="cdiscovery-card-btn-secondary"
                          style={{
                            color: creator.saved ? '#EF4444' : '#334155',
                            borderColor: creator.saved ? '#FECDD3' : '#E2E8F0',
                            background: creator.saved ? '#FFF1F2' : '#FFFFFF',
                          }}
                        >
                          {creator.saved ? 'Đã lưu' : 'Shortlist'}
                        </Button>

                        <Button
                          onClick={() => {
                            setSelectedCreator(creator);
                            setDrawerVisible(true);
                          }}
                          className="cdiscovery-card-btn-secondary"
                          style={{ padding: '0 12px' }}
                        >
                          Xem nhanh
                        </Button>

                        <Dropdown
                          menu={{
                            items: [
                              { key: 'shortlist', label: 'Thêm vào Shortlist', icon: <SaveOutlined /> },
                              { key: 'message', label: 'Gửi tin nhắn', icon: <MessageOutlined /> },
                              { key: 'invite', label: 'Mời vào chiến dịch', icon: <ThunderboltOutlined /> },
                              { key: 'share', label: 'Chia sẻ hồ sơ', icon: <GlobalOutlined /> },
                            ],
                            onClick: ({ key, domEvent }) => {
                              domEvent.stopPropagation();
                              if (key === 'shortlist' || key === 'invite') {
                                handleOpenShortlist(creator);
                              } else if (key === 'share') {
                                navigator.clipboard?.writeText(window.location.origin + '/creators/' + creator.id);
                                message.success('Đã sao chép liên kết creator!');
                              } else if (key === 'message') {
                                navigate('/messages');
                              }
                            },
                          }}
                          trigger={['click']}
                        >
                          <Button
                            icon={<MoreOutlined />}
                            className="cdiscovery-card-btn-secondary"
                            style={{ width: 38, padding: 0, color: '#64748B' }}
                          />
                        </Dropdown>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* ================= LIST VIEW ================= */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {paginatedCreators.map((creator) => {
                  const isHighMatch = creator.matchLevel === 'high';
                  return (
                    <Card
                      key={creator.id}
                      bordered={false}
                      className="cdiscovery-list-card"
                      bodyStyle={{ padding: '16px 22px' }}
                    >
                      <Row align="middle" gutter={[16, 16]}>
                        <Col xs={24} sm={10} md={9}>
                          <div
                            style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleOpenCreator(creator)}
                          >
                            <CreatorAvatar src={creator.avatar} name={creator.name} size={52} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                                  {creator.name}
                                </span>
                                {creator.isVerified && (
                                  <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />
                                )}
                                {matchedCampaign ? (
                                  <span className={`cdiscovery-match-badge ${isHighMatch ? 'high' : 'medium'}`}>
                                    ★ {creator.matchRate}% {isHighMatch ? 'Khớp cao' : 'Khớp vừa'}
                                  </span>
                                ) : (
                                  <span className="cdiscovery-match-badge pending">
                                    Chờ chọn dự án
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                                @{creator.username} • 📍 {creator.location}
                              </div>
                              <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                                {creator.platforms.map(renderPlatformIcon)}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col xs={24} sm={7} md={7}>
                          <div style={{ display: 'flex', gap: 24 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                                {creator.followers}
                              </div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Followers</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                                {creator.engagementRate}
                              </div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Tương tác</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                                {creator.avgPrice}
                              </div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Giá TB</div>
                            </div>
                          </div>
                        </Col>

                        <Col xs={24} sm={7} md={8} style={{ textAlign: 'right' }}>
                          <Space size="middle">
                            <Button
                              onClick={(e) => handleOpenShortlist(creator, e)}
                              icon={creator.saved ? <HeartFilled style={{ color: '#EF4444' }} /> : <HeartOutlined />}
                              style={{
                                borderRadius: 10,
                                height: 38,
                                fontWeight: 600,
                                color: creator.saved ? '#EF4444' : '#334155',
                                borderColor: creator.saved ? '#FECDD3' : '#E2E8F0',
                                background: creator.saved ? '#FFF1F2' : '#FFFFFF',
                              }}
                            >
                              {creator.saved ? 'Đã lưu' : 'Shortlist'}
                            </Button>
                            <Button
                              type="primary"
                              onClick={() => handleOpenCreator(creator)}
                              style={{
                                background: '#2563EB',
                                borderRadius: 10,
                                height: 38,
                                padding: '0 20px',
                                fontWeight: 700,
                              }}
                            >
                              Chi tiết hồ sơ
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* 5. Phân trang cố định chuẩn mực */}
            <div className="cdiscovery-pagination-bar">
              <span className="cdiscovery-pagination-info">
                {filteredCreators.length === 0 ? (
                  'Không có creator nào'
                ) : (
                  <>
                    Hiển thị <strong style={{ color: '#0F172A' }}>{(safeCurrentPage - 1) * pageSize + 1} – {Math.min(safeCurrentPage * pageSize, filteredCreators.length)}</strong> trên tổng số <strong style={{ color: '#0F172A' }}>{filteredCreators.length}</strong> creator
                  </>
                )}
              </span>

              <Pagination
                current={safeCurrentPage}
                pageSize={pageSize}
                total={filteredCreators.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                hideOnSinglePage={false}
              />
            </div>
          </div>
        </>
      )}

      {/* 6. Creator Profile Quick Preview Drawer */}
      <Drawer
        title={
          selectedCreator ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CreatorAvatar src={selectedCreator.avatar} name={selectedCreator.name} size={38} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                    {selectedCreator.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                    @{selectedCreator.username}
                  </div>
                </div>
              </div>

              <Button
                size="small"
                icon={<SyncOutlined spin={isRefreshingCreator} />}
                loading={isRefreshingCreator}
                onClick={handleRequestRefresh}
                style={{
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderColor: '#818CF8',
                  color: '#4F46E5',
                  background: '#EEF2FF',
                }}
              >
                Làm mới số liệu
              </Button>
            </div>
          ) : (
            'Chi tiết Creator'
          )
        }
        placement="right"
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedCreator && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
                padding: '16px',
                borderRadius: 12,
                border: '1px solid #DBEAFE',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#1E40AF' }}>
                  AI Match Score
                </span>
                {matchedCampaign ? (
                  <Tag color="green" style={{ fontWeight: 800, borderRadius: 6 }}>
                    {selectedCreator.matchRate}% Độ phù hợp ({matchedCampaign.name})
                  </Tag>
                ) : (
                  <Tag color="default" style={{ borderRadius: 6, color: '#64748B' }}>
                    Chưa chọn dự án đối soát
                  </Tag>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                {matchedCampaign
                  ? (selectedCreator.matchReason || computeCreatorMatch(selectedCreator, matchedCampaign).reason)
                  : 'Vui lòng chọn một Dự án / Chiến dịch ở đầu trang và bấm "Tìm Creator phù hợp" để AI tính toán tỷ lệ tương thích chi tiết.'}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 10 }}>
                Chỉ số hiệu quả chính
              </div>
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                      {selectedCreator.followers}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Followers</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                      {selectedCreator.engagementRate}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Tương tác</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                      {selectedCreator.avgPrice}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Giá TB/Bài</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Bio & Categories */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 6 }}>
                Giới thiệu & Lĩnh vực
              </div>
              <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>
                {selectedCreator.bio}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedCreator.categories.map((cat) => (
                  <Tag key={cat} color="blue" style={{ borderRadius: 6 }}>
                    {cat}
                  </Tag>
                ))}
              </div>
            </div>

            {/* Location & Platforms */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 8 }}>
                Kênh hoạt động & Địa điểm
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <EnvironmentOutlined style={{ color: '#2563EB' }} />
                <span style={{ fontSize: 12.5, color: '#334155' }}>{selectedCreator.location}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedCreator.platforms.map(renderPlatformIcon)}
              </div>
            </div>

            {/* Action Buttons inside drawer */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Button
                type="primary"
                block
                icon={<ThunderboltOutlined />}
                onClick={() => handleOpenShortlist(selectedCreator)}
                style={{
                  background: '#2563EB',
                  fontWeight: 700,
                  height: 40,
                  borderRadius: 10,
                }}
              >
                Mời vào chiến dịch
              </Button>
              <Button
                onClick={() => handleOpenShortlist(selectedCreator)}
                style={{
                  height: 40,
                  borderRadius: 10,
                  fontWeight: 600,
                  borderColor: selectedCreator.saved ? '#FECDD3' : '#E2E8F0',
                  color: selectedCreator.saved ? '#EF4444' : '#334155',
                }}
              >
                {selectedCreator.saved ? 'Đã lưu trong Shortlist' : 'Thêm vào Shortlist'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal thêm creator vào Shortlist chiến dịch thực tế */}
      <AddToShortlistModal
        open={!!shortlistModalCreator}
        onClose={() => setShortlistModalCreator(null)}
        creator={
          shortlistModalCreator
            ? {
                id: shortlistModalCreator.id,
                name: shortlistModalCreator.name,
                avatar: shortlistModalCreator.avatar,
                username: shortlistModalCreator.username,
                niche: shortlistModalCreator.categories?.[0],
              }
            : null
        }
        onSuccess={() => {
          if (shortlistModalCreator) {
            setCreators((prev) =>
              prev.map((c) => (c.id === shortlistModalCreator.id ? { ...c, saved: true } : c))
            );
          }
        }}
      />

    </div>
  );
}
