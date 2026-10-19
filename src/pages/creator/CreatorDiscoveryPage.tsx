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
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from '@ant-design/icons';
import AiBriefAssistant from '../../components/ai/AiBriefAssistant';
import type { StructuredBrief } from '../../components/ai/AiBriefAssistant';
import ExternalDiscovery from '../../components/discovery/ExternalDiscovery';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';

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
  const engVal = item.engagementRate || 3.5;

  return {
    id: item.creatorId || item.id,
    name: item.displayName || item.userName,
    username: item.userName,
    avatar: item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: !!item.verifiedByInfluencerMatch,
    matchRate: 90,
    matchLevel: 'high',
    platforms: [platformLower],
    categories: item.niche ? [item.niche] : ['Làm đẹp & Chăm sóc da'],
    bio: item.contentSummary || `Creator trên ${item.platform} chuyên về ${item.niche || 'Nội dung số'}.`,
    followers: followersText,
    followersCount: followersNum,
    engagementRate: `${engVal}%`,
    engagementValue: engVal,
    avgPrice: '$800',
    avgPriceValue: 800,
    location: item.location || 'Việt Nam',
    language: 'vi',
    saved: false,
  };
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
  target: string;
  suggestedCategory?: string;
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
  const [searchParams] = useSearchParams();
  const initialCampId = searchParams.get('campaignId') || null;

  // Real Brand Campaigns loaded from API
  const [campaignsList, setCampaignsList] = useState<BrandCampaignItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);

  // Campaign Matching States: Khoan đề xuất khớp cao/thấp cho đến khi Brand chọn dự án và bấm tìm
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampId);
  const [matchedCampaign, setMatchedCampaign] = useState<BrandCampaignItem | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Fetch real campaigns from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchBrandCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const apiCampaigns = await campaignService.getCampaigns(0, 50);
        if (isMounted) {
          if (Array.isArray(apiCampaigns) && apiCampaigns.length > 0) {
            const mapped = apiCampaigns.map(mapApiCampaignToItem);
            setCampaignsList(mapped);
            if (initialCampId) {
              const matched = mapped.find((c) => c.id === initialCampId);
              if (matched) {
                setMatchedCampaign(matched);
                setSelectedCampaignId(initialCampId);
              }
            }
          } else {
            // Không có campaign từ API, fallback sang mock mẫu để Brand tham khảo
            setCampaignsList(BRAND_CAMPAIGNS);
            if (initialCampId) {
              const matched = BRAND_CAMPAIGNS.find((c) => c.id === initialCampId);
              if (matched) setMatchedCampaign(matched);
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải chiến dịch thực tế từ API, dùng danh sách mẫu:', err);
        if (isMounted) {
          setCampaignsList(BRAND_CAMPAIGNS);
          if (initialCampId) {
            const matched = BRAND_CAMPAIGNS.find((c) => c.id === initialCampId);
            if (matched) setMatchedCampaign(matched);
          }
        }
      } finally {
        if (isMounted) setLoadingCampaigns(false);
      }
    };

    fetchBrandCampaigns();
    return () => {
      isMounted = false;
    };
  }, [initialCampId]);

  const handleTriggerMatch = () => {
    if (!selectedCampaignId) {
      message.warning('Vui lòng chọn một Dự án / Chiến dịch trước khi tìm kiếm Creator!');
      return;
    }

    const camp = campaignsList.find((c) => c.id === selectedCampaignId) || BRAND_CAMPAIGNS.find((c) => c.id === selectedCampaignId);
    if (!camp) return;

    setIsMatching(true);
    message.loading({
      content: `AI đang phân tích và đối soát độ tương thích cho dự án "${camp.name}"...`,
      key: 'campaign_match',
      duration: 1,
    });

    setTimeout(() => {
      setIsMatching(false);
      setMatchedCampaign(camp);
      setSortBy('match');
      setCurrentPage(1);
      message.success({
        content: `Đã tính toán độ tương thích cho dự án "${camp.name}"! Sắp xếp theo thứ tự khớp cao nhất.`,
        key: 'campaign_match',
        duration: 3,
      });
    }, 600);
  };

  const handleClearMatch = () => {
    setSelectedCampaignId(null);
    setMatchedCampaign(null);
    message.info('Đã thoát chế độ so khớp dự án. Đang hiển thị danh sách khám phá chung.');
  };

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

  // Creators list with real API state
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(ALL_CATEGORIES);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState<'database' | 'external'>('database');
  const [isRefreshingCreator, setIsRefreshingCreator] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCreatorsAndNiches = async () => {
      try {
        setLoading(true);
        const [apiCreators, apiNiches] = await Promise.all([
          creatorService.getCreators(),
          creatorService.getNiches().catch(() => []),
        ]);
        if (isMounted) {
          if (Array.isArray(apiCreators)) {
            setCreators(apiCreators.map(mapApiCreatorToUi));
          }
          if (Array.isArray(apiNiches) && apiNiches.length > 0) {
            setCategoriesList(Array.from(new Set([...apiNiches, ...ALL_CATEGORIES])));
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
  }, []);

  // Apply AI Structured Brief to filters
  const handleApplyBrief = (brief: StructuredBrief) => {
    setSelectedCategory(brief.category);
    if (brief.location !== 'all') {
      setSelectedLocation(brief.location);
    }
    setEngagementTier(brief.engagement);
    if (brief.price !== 'all') {
      setPriceTier(brief.price);
    }
    setCurrentPage(1);
  };

  // Request Refresh Creator stats
  const handleRequestRefresh = () => {
    if (!selectedCreator) return;
    setIsRefreshingCreator(true);
    message.loading({
      content: `Đang cào dữ liệu mới nhất từ mạng xã hội cho @${selectedCreator.username}...`,
      key: 'refresh_creator',
    });

    setTimeout(() => {
      setIsRefreshingCreator(false);
      const isM = selectedCreator.followers.includes('M');
      const currentNum = parseFloat(selectedCreator.followers);
      const updatedFollowers = isM ? `${(currentNum + 0.05).toFixed(2)}M` : `${Math.round(currentNum + 15)}K`;
      const currentEng = parseFloat(selectedCreator.engagementRate);
      const updatedEng = `${(currentEng + 0.3).toFixed(1)}%`;

      const updatedCreator: Creator = {
        ...selectedCreator,
        followers: updatedFollowers,
        engagementRate: updatedEng,
      };

      setSelectedCreator(updatedCreator);
      setCreators((prev) => prev.map((c) => (c.id === updatedCreator.id ? updatedCreator : c)));
      message.success({
        content: `Đã làm mới dữ liệu mới nhất của ${selectedCreator.name}! (Tiêu hao 1 lượt Refresh Quota)`,
        key: 'refresh_creator',
        duration: 3,
      });
    }, 1200);
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

  // Toggle Save Creator
  const toggleSaveCreator = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = !c.saved;
          message.success(
            newStatus ? `Đã lưu ${c.name} vào danh sách chọn!` : `Đã bỏ lưu ${c.name}`
          );
          return { ...c, saved: newStatus };
        }
        return c;
      })
    );
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
    navigate(`/creators/${creator.id}`);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 110px)',
        gap: 16,
      }}
    >
      {/* 1. Header & Breadcrumb & Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title
              level={2}
              style={{
                fontWeight: 800,
                fontSize: 26,
                color: '#0F172A',
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              Khám phá Creator & Match
            </Title>
          </div>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            Tìm kiếm creator lý tưởng cho thương hiệu với thuật toán ghép nối AI, bộ lọc chuyên sâu và thông tin chi tiết thời gian thực.
          </Text>
        </div>

        {/* Top Right: Discovery Mode Switcher & Actions */}
        <Space size={10} wrap>
          <Radio.Group
            value={discoveryMode}
            onChange={(e) => setDiscoveryMode(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="database">
              <span>Khám phá hệ thống</span>
            </Radio.Button>
            <Radio.Button value="external">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <GlobalOutlined /> Quét kênh ngoài
              </span>
            </Radio.Button>
          </Radio.Group>

          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate('/campaigns/create')}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 10,
              height: 38,
              padding: '0 16px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              border: 'none',
            }}
          >
            Tạo chiến dịch
          </Button>
        </Space>
      </div>

      {/* RENDER EXTERNAL DISCOVERY MODE */}
      {discoveryMode === 'external' ? (
        <ExternalDiscovery />
      ) : (
        <>
          {/* 1.5. CAMPAIGN MATCHING HUB (BỘ CHỌN DỰ ÁN ĐỐI SOÁT AI MATCHING) */}
          <Card
            bordered
            style={{
              borderRadius: 16,
              background: matchedCampaign
                ? 'linear-gradient(135deg, #FAF5FF 0%, #EEF2FF 100%)'
                : '#FFFFFF',
              borderColor: matchedCampaign ? '#C4B5FD' : '#E2E8F0',
              boxShadow: matchedCampaign
                ? '0 6px 20px -4px rgba(124, 58, 237, 0.15)'
                : '0 2px 10px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.3s ease',
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: matchedCampaign
                      ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                      : '#F1F5F9',
                    color: matchedCampaign ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    boxShadow: matchedCampaign ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  <AimOutlined />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                      {matchedCampaign ? 'Dự án đang đối soát AI:' : 'Chọn Dự án / Chiến dịch để tính điểm khớp:'}
                    </span>
                    {matchedCampaign ? (
                      <Tag color="purple" style={{ fontWeight: 800, borderRadius: 999, fontSize: 11 }}>
                        ĐÃ KÍCH HOẠT ĐỘ KHỚP
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ borderRadius: 999, fontSize: 11, color: '#64748B' }}>
                        Khoan đề xuất • Chờ chọn dự án
                      </Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                    {matchedCampaign
                      ? `Đang hiển thị tỷ lệ khớp cao/thấp theo tiêu chí: "${matchedCampaign.name}" (${matchedCampaign.tag})`
                      : 'Vui lòng chọn chiến dịch cần triển khai và bấm "Tìm Creator phù hợp" (hoặc nhấn phím Enter) để AI kích hoạt tính toán.'}
                  </div>
                </div>
              </div>

              {/* Selector & Actions */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTriggerMatch();
                  }
                }}
              >
                <Select
                  size="large"
                  placeholder={loadingCampaigns ? 'Đang tải danh sách dự án...' : '-- Chọn một chiến dịch của thương hiệu --'}
                  value={selectedCampaignId}
                  loading={loadingCampaigns}
                  onChange={(val) => setSelectedCampaignId(val)}
                  style={{ minWidth: 320, height: 42 }}
                  notFoundContent={
                    <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: 13, marginBottom: 6 }}>
                        Chưa có chiến dịch nào được tạo
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate('/campaigns/create')}
                        style={{ padding: 0, fontWeight: 700 }}
                      >
                        + Tạo chiến dịch mới ngay
                      </Button>
                    </div>
                  }
                  options={campaignsList.map((camp) => ({
                    value: camp.id,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontWeight: 600 }}>{camp.name}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>({camp.tag})</span>
                      </div>
                    ),
                  }))}
                />

                <Button
                  type="primary"
                  size="large"
                  loading={isMatching}
                  icon={<RocketOutlined />}
                  onClick={handleTriggerMatch}
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    border: 'none',
                    fontWeight: 700,
                    borderRadius: 10,
                    height: 42,
                    padding: '0 20px',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                  }}
                >
                  Tìm Creator phù hợp
                </Button>

                {matchedCampaign && (
                  <Button
                    size="large"
                    type="default"
                    onClick={handleClearMatch}
                    style={{
                      borderRadius: 10,
                      height: 42,
                      color: '#64748B',
                      borderColor: '#CBD5E1',
                      fontWeight: 600,
                    }}
                  >
                    Bỏ lọc dự án ✕
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* AI Brief Assistant Box */}
          <AiBriefAssistant onApplyBrief={handleApplyBrief} onReset={handleResetFilters} />

          {/* 2. Metrics Summary Overview Row (4 KPI Cards) */}
      <Row gutter={[14, 14]}>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 14, borderColor: '#EEF0F6' }}
            bodyStyle={{ padding: '14px 18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                <EyeOutlined />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                  12,458
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Tổng số Creator</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 14, borderColor: '#EEF0F6' }}
            bodyStyle={{ padding: '14px 18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: matchedCampaign ? '#ECFDF5' : '#F1F5F9',
                  color: matchedCampaign ? '#10B981' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                <StarFilled />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: matchedCampaign ? '#0F172A' : '#94A3B8', lineHeight: 1.2 }}>
                  {matchedCampaign ? '892' : '--'}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  {matchedCampaign ? 'Creator phù hợp' : 'Độ khớp (Chờ dự án)'}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 14, borderColor: '#EEF0F6' }}
            bodyStyle={{ padding: '14px 18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#F0F9FF',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                <BarChartOutlined />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                  4.8%
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Tỷ lệ tương tác TB</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 14, borderColor: '#EEF0F6' }}
            bodyStyle={{ padding: '14px 18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#F0FDF4',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                <TeamOutlined />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                  268.5M
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Tổng lượt tiếp cận</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. BỘ LỌC NGANG TOÀN DIỆN */}
      <Card
        bordered
        style={{
          borderRadius: 16,
          borderColor: '#EEF0F6',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Row 1: Search, Sort & View Switcher */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <Input
                size="large"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm creator theo tên, lĩnh vực, từ khóa hoặc @tênngười dùng..."
                prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: 16, marginRight: 6 }} />}
                allowClear
                style={{
                  borderRadius: 10,
                  fontSize: 13,
                  borderColor: '#E2E8F0',
                  height: 40,
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap' }}>Sắp xếp:</span>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 175, height: 40 }}
                options={[
                  { value: 'match', label: 'Độ phù hợp (AI)' },
                  { value: 'followers', label: 'Lượt theo dõi cao' },
                  { value: 'engagement', label: 'Tương tác cao' },
                  { value: 'priceAsc', label: 'Giá: Thấp đến cao' },
                  { value: 'priceDesc', label: 'Giá: Cao đến thấp' },
                ]}
              />
            </div>

            {/* View Switch Buttons */}
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
                  background: viewMode === 'grid' ? '#2563EB' : 'transparent',
                  color: viewMode === 'grid' ? '#FFFFFF' : '#64748B',
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <AppstoreOutlined /> Lưới
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  border: 'none',
                  background: viewMode === 'list' ? '#2563EB' : 'transparent',
                  color: viewMode === 'list' ? '#FFFFFF' : '#64748B',
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <UnorderedListOutlined /> Danh sách
              </button>
            </div>
          </div>

          {/* Row 2: Horizontal Dropdown Filters */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              paddingTop: 4,
              borderTop: '1px solid #F1F5F9',
            }}
          >
            {/* Filter: Nền tảng */}
            <div style={{ minWidth: 155 }}>
              <Select
                value={selectedPlatform}
                onChange={(val) => {
                  setSelectedPlatform(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', height: 38 }}
                options={[
                  { value: 'all', label: 'Tất cả nền tảng' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'x', label: 'X (Twitter)' },
                ]}
              />
            </div>

            {/* Filter: Lĩnh vực */}
            <div style={{ minWidth: 180 }}>
              <Select
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', height: 38 }}
                options={[
                  { value: 'all', label: 'Tất cả lĩnh vực' },
                  ...categoriesList.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>

            {/* Filter: Địa điểm */}
            <div style={{ minWidth: 165 }}>
              <Select
                showSearch
                loading={loadingProvinces}
                value={selectedLocation}
                onChange={(val) => {
                  setSelectedLocation(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', height: 38 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                options={provinceOptions}
              />
            </div>

            {/* Filter: Quy mô người theo dõi */}
            <div style={{ minWidth: 155 }}>
              <Select
                value={followerTier}
                onChange={(val) => {
                  setFollowerTier(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', height: 38 }}
                options={[
                  { value: 'all', label: 'Quy mô: Tất cả' },
                  { value: 'nano', label: 'Nano (< 50K)' },
                  { value: 'micro', label: 'Micro (50K – 200K)' },
                  { value: 'macro', label: 'Macro (200K – 1M)' },
                  { value: 'mega', label: 'Mega (1M+)' },
                ]}
              />
            </div>

            {/* Filter: Tỷ lệ tương tác */}
            <div style={{ minWidth: 150 }}>
              <Select
                value={engagementTier}
                onChange={(val) => {
                  setEngagementTier(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', height: 38 }}
                options={[
                  { value: 'all', label: 'Tương tác: Tất cả' },
                  { value: 'high', label: 'Cao (> 5%)' },
                  { value: 'vhigh', label: 'Rất cao (> 8%)' },
                ]}
              />
            </div>

            {/* Filter: Mức giá */}
            <div style={{ minWidth: 145 }}>
              <Select
                value={priceTier}
                onChange={(val) => {
                  setPriceTier(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', height: 38 }}
                options={[
                  { value: 'all', label: 'Mức giá: Tất cả' },
                  { value: 'low', label: '< $500' },
                  { value: 'mid', label: '$500 – $1,000' },
                  { value: 'high', label: '> $1,000' },
                ]}
              />
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <Button
                type="dashed"
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                style={{
                  color: '#EF4444',
                  borderColor: '#FECDD3',
                  background: '#FFF1F2',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  height: 38,
                }}
              >
                Đặt lại ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Active Filter Chips Preview */}
          {activeFiltersCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Đang lọc:</span>
              {selectedPlatform !== 'all' && (
                <Tag
                  closable
                  onClose={() => {
                    setSelectedPlatform('all');
                    setCurrentPage(1);
                  }}
                  color="blue"
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  Nền tảng: {selectedPlatform}
                </Tag>
              )}
              {selectedCategory !== 'all' && (
                <Tag
                  closable
                  onClose={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  color="purple"
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  Lĩnh vực: {selectedCategory}
                </Tag>
              )}
              {selectedLocation !== 'all' && (
                <Tag
                  closable
                  onClose={() => {
                    setSelectedLocation('all');
                    setCurrentPage(1);
                  }}
                  color="cyan"
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  {selectedLocation}
                </Tag>
              )}
              {followerTier !== 'all' && (
                <Tag
                  closable
                  onClose={() => {
                    setFollowerTier('all');
                    setCurrentPage(1);
                  }}
                  color="green"
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  Followers: {followerTier}
                </Tag>
              )}
              {engagementTier !== 'all' && (
                <Tag
                  closable
                  onClose={() => {
                    setEngagementTier('all');
                    setCurrentPage(1);
                  }}
                  color="orange"
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  Tương tác cao
                </Tag>
              )}
              {priceTier !== 'all' && (
                <Tag
                  closable
                  onClose={() => {
                    setPriceTier('all');
                    setCurrentPage(1);
                  }}
                  color="magenta"
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  Mức giá
                </Tag>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#2563EB',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0 4px',
                }}
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* 4. Creator Grid / List View (Chiếm trọn không gian, đảm bảo phân trang luôn nằm ở đáy) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Card
            bordered
            style={{ borderRadius: 16, borderColor: '#EEF0F6', textAlign: 'center', padding: '80px 20px', flex: 1 }}
          >
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#64748B', fontWeight: 600 }}>
              Đang tải danh sách Creator từ máy chủ...
            </div>
          </Card>
        ) : filteredCreators.length === 0 ? (
          <Card
            bordered
            style={{ borderRadius: 16, borderColor: '#EEF0F6', textAlign: 'center', padding: '60px 20px', flex: 1 }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <Title level={4} style={{ color: '#0F172A', marginBottom: 6 }}>
              Không tìm thấy creator phù hợp
            </Title>
            <Paragraph style={{ color: '#64748B', maxWidth: 400, margin: '0 auto 16px auto' }}>
              Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc để xem thêm kết quả.
            </Paragraph>
            <Button type="primary" onClick={handleResetFilters} style={{ background: '#2563EB', borderRadius: 8 }}>
              Đặt lại bộ lọc
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          /* ================= FULL WIDTH GRID VIEW (3-4 columns) ================= */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {paginatedCreators.map((creator) => {
              const isHighMatch = creator.matchLevel === 'high';
              return (
                <Card
                  key={creator.id}
                  bordered
                  hoverable
                  style={{
                    borderRadius: 16,
                    borderColor: '#EEF0F6',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedCreator(creator);
                          setDrawerVisible(true);
                        }}
                      >
                        <Avatar
                          src={creator.avatar}
                          size={48}
                          style={{
                            border: '2px solid #E2E8F0',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                              {creator.name}
                            </span>
                            {creator.isVerified && (
                              <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                            @{creator.username}
                          </div>
                          {/* Platform Icons Row */}
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            {creator.platforms.map(renderPlatformIcon)}
                          </div>
                        </div>
                      </div>

                      {/* Match Rate Badge: Chỉ hiển thị khi đã chọn dự án và bấm tìm */}
                      {matchedCampaign ? (
                        <div
                          style={{
                            background: isHighMatch ? '#DCFCE7' : '#FEF3C7',
                            color: isHighMatch ? '#16A34A' : '#D97706',
                            fontWeight: 700,
                            fontSize: 10.5,
                            padding: '3px 8px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ★ {creator.matchRate}% {isHighMatch ? 'Khớp cao' : 'Khớp vừa'}
                        </div>
                      ) : (
                        <div
                          style={{
                            background: '#F1F5F9',
                            color: '#94A3B8',
                            fontWeight: 600,
                            fontSize: 10,
                            padding: '3px 8px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            whiteSpace: 'nowrap',
                          }}
                          title="Chọn dự án phía trên và bấm Tìm Creator phù hợp để tính độ khớp"
                        >
                          Chờ chọn dự án
                        </div>
                      )}
                    </div>

                    {/* AI Explanation Snippet: Chỉ hiển thị khi đã có dự án đối soát */}
                    {matchedCampaign && (
                      <div
                        style={{
                          background: '#FAF5FF',
                          border: '1px solid #E9D5FF',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11,
                          color: '#6B21A8',
                          marginBottom: 10,
                          lineHeight: 1.4,
                        }}
                      >
                        <strong>AI Match ({matchedCampaign.name}):</strong> Khán giả 82% Nữ (18-24 tuổi), tương tác {creator.engagementRate} rất phù hợp với dự án.
                      </div>
                    )}

                    {/* Categories Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {creator.categories.map((cat) => (
                        <Tag
                          key={cat}
                          style={{
                            borderRadius: 6,
                            fontSize: 10.5,
                            color: '#475569',
                            background: '#F8FAFC',
                            borderColor: '#E2E8F0',
                            margin: 0,
                            padding: '1px 8px',
                          }}
                        >
                          {cat}
                        </Tag>
                      ))}
                    </div>

                    {/* Bio snippet */}
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        lineHeight: 1.4,
                        minHeight: 34,
                        marginBottom: 14,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {creator.bio}
                    </div>

                    {/* 3 Metrics Box */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        background: '#F8FAFC',
                        borderRadius: 10,
                        padding: '10px 12px',
                        marginBottom: 16,
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                          {creator.followers}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                          Người theo dõi
                        </div>
                      </div>

                      <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                          {creator.engagementRate}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                          Tỷ lệ tương tác
                        </div>
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                          {creator.avgPrice}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                          Giá TB / Bài
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button
                      onClick={() => {
                        setSelectedCreator(creator);
                        setDrawerVisible(true);
                      }}
                      style={{
                        borderRadius: 8,
                        height: 36,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#4F46E5',
                        borderColor: '#C7D2FE',
                      }}
                    >
                      Xem nhanh
                    </Button>

                    <Button
                      type="primary"
                      onClick={() => handleOpenCreator(creator)}
                      style={{
                        flex: 1,
                        background: '#2563EB',
                        fontWeight: 700,
                        fontSize: 12.5,
                        borderRadius: 8,
                        height: 36,
                      }}
                    >
                      Chi tiết
                    </Button>

                    <Button
                      onClick={(e) => toggleSaveCreator(creator.id, e)}
                      icon={creator.saved ? <HeartFilled style={{ color: '#EF4444' }} /> : <HeartOutlined />}
                      style={{
                        borderRadius: 8,
                        height: 36,
                        fontSize: 12,
                        fontWeight: 600,
                        color: creator.saved ? '#EF4444' : '#64748B',
                        borderColor: creator.saved ? '#FECDD3' : '#E2E8F0',
                        background: creator.saved ? '#FFF1F2' : '#FFFFFF',
                      }}
                    >
                      {creator.saved ? 'Đã lưu' : 'Lưu'}
                    </Button>

                    <Dropdown
                      menu={{
                        items: [
                          { key: 'message', label: 'Gửi tin nhắn', icon: <MessageOutlined /> },
                          { key: 'invite', label: 'Mời vào chiến dịch', icon: <ThunderboltOutlined /> },
                          { key: 'share', label: 'Chia sẻ hồ sơ', icon: <GlobalOutlined /> },
                        ],
                      }}
                      trigger={['click']}
                    >
                      <Button
                        icon={<MoreOutlined />}
                        style={{
                          borderRadius: 8,
                          height: 36,
                          width: 36,
                          padding: 0,
                          color: '#64748B',
                        }}
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
                  bordered
                  hoverable
                  style={{
                    borderRadius: 14,
                    borderColor: '#EEF0F6',
                  }}
                  bodyStyle={{ padding: '16px 20px' }}
                >
                  <Row align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={10} md={8}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Avatar
                          src={creator.avatar}
                          size={52}
                          style={{ border: '2px solid #E2E8F0', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                              {creator.name}
                            </span>
                            {creator.isVerified && (
                              <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />
                            )}
                            {matchedCampaign ? (
                              <span
                                style={{
                                  background: isHighMatch ? '#DCFCE7' : '#FEF3C7',
                                  color: isHighMatch ? '#16A34A' : '#D97706',
                                  fontWeight: 700,
                                  fontSize: 10,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                ★ {creator.matchRate}% {isHighMatch ? 'Khớp cao' : 'Khớp vừa'}
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#F1F5F9',
                                  color: '#94A3B8',
                                  fontWeight: 500,
                                  fontSize: 10,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                }}
                                title="Chọn dự án phía trên để tính điểm khớp"
                              >
                                Chờ chọn dự án
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                            @{creator.username} • 📍 {creator.location}
                          </div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            {creator.platforms.map(renderPlatformIcon)}
                          </div>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} sm={8} md={8}>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                            {creator.followers}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Followers</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                            {creator.engagementRate}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Engagement</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                            {creator.avgPrice}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Giá TB</div>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} sm={6} md={8} style={{ textAlign: 'right' }}>
                      <Space>
                        <Button
                          onClick={(e) => toggleSaveCreator(creator.id, e)}
                          icon={creator.saved ? <HeartFilled style={{ color: '#EF4444' }} /> : <HeartOutlined />}
                          style={{
                            borderRadius: 8,
                            color: creator.saved ? '#EF4444' : '#64748B',
                            borderColor: creator.saved ? '#FECDD3' : '#E2E8F0',
                            background: creator.saved ? '#FFF1F2' : '#FFFFFF',
                          }}
                        >
                          {creator.saved ? 'Đã lưu' : 'Lưu'}
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => handleOpenCreator(creator)}
                          style={{ background: '#2563EB', borderRadius: 8, fontWeight: 700 }}
                        >
                          Xem hồ sơ
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </div>
        )}

        {/* 5. Phân trang cố định sát đáy và chỉ cho phép qua trang khi có creator */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            paddingBottom: 8,
            borderTop: '1px solid #EEF0F6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 12.5, color: '#64748B' }}>
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
                <Avatar src={selectedCreator.avatar} size={38} />
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
                  ? `Creator này có tệp khán giả trùng khớp ${selectedCreator.matchRate}% với tiêu chí của chiến dịch "${matchedCampaign.name}".`
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
                onClick={() => {
                  setDrawerVisible(false);
                  navigate('/campaigns/create');
                }}
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
                onClick={(e) => toggleSaveCreator(selectedCreator.id, e)}
                style={{
                  height: 40,
                  borderRadius: 10,
                  fontWeight: 600,
                  borderColor: selectedCreator.saved ? '#FECDD3' : '#E2E8F0',
                  color: selectedCreator.saved ? '#EF4444' : '#334155',
                }}
              >
                {selectedCreator.saved ? 'Đã lưu' : 'Lưu danh sách'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
