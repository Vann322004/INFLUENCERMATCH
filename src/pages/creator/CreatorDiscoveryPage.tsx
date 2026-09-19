import React, { useState, useEffect, useMemo } from 'react';
import {
  Breadcrumb,
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
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  ThunderboltOutlined,
  StarFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
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

// 18 Realistic Mock Creators (3 full pages of 6 items each)
const INITIAL_CREATORS: Creator[] = [
  // Page 1
  {
    id: 'c1',
    name: 'Linh Nguyễn',
    username: 'linhnguyen.official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 96,
    matchLevel: 'high',
    platforms: ['tiktok', 'instagram'],
    categories: ['Làm đẹp & Chăm sóc da', 'Phong cách sống'],
    bio: 'Yêu thích chăm sóc da | Chia sẻ chu trình làm đẹp mỗi ngày ✨',
    followers: '1.2M',
    followersCount: 1200000,
    engagementRate: '8.7%',
    engagementValue: 8.7,
    avgPrice: '$1.2K',
    avgPriceValue: 1200,
    location: 'Thành phố Hà Nội',
    language: 'vi',
    saved: true,
  },
  {
    id: 'c2',
    name: 'Minh Hoàng',
    username: 'minhhoang.92',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 94,
    matchLevel: 'high',
    platforms: ['tiktok', 'youtube'],
    categories: ['Thời trang', 'Phong cách sống'],
    bio: 'Thời trang, du lịch và những rung cảm tích cực ✈️ Cùng nhau khám phá thế giới!',
    followers: '856K',
    followersCount: 856000,
    engagementRate: '6.2%',
    engagementValue: 6.2,
    avgPrice: '$980',
    avgPriceValue: 980,
    location: 'Thành phố Hồ Chí Minh',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c3',
    name: 'Thảo Vy',
    username: 'thaovy.official',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 85,
    matchLevel: 'medium',
    platforms: ['instagram', 'facebook'],
    categories: ['Ẩm thực & Đồ uống', 'Phong cách sống'],
    bio: 'Ẩm thực | Cuộc sống thường nhật | Du lịch. Đồ ăn ngon = Tâm trạng vui 🍜',
    followers: '542K',
    followersCount: 542000,
    engagementRate: '5.1%',
    engagementValue: 5.1,
    avgPrice: '$750',
    avgPriceValue: 750,
    location: 'Thành phố Đà Nẵng',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c4',
    name: 'Quỳnh Anh',
    username: 'quynhanh.fitness',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 92,
    matchLevel: 'high',
    platforms: ['tiktok', 'instagram'],
    categories: ['Thể hình & Sức khỏe', 'Phong cách sống'],
    bio: 'Lối sống lành mạnh | Tập luyện | Yêu thương bản thân. Khỏe mạnh hơn mỗi ngày 💪',
    followers: '673K',
    followersCount: 673000,
    engagementRate: '7.9%',
    engagementValue: 7.9,
    avgPrice: '$890',
    avgPriceValue: 890,
    location: 'Thành phố Hà Nội',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c5',
    name: 'Hà My',
    username: 'hamy.beauty',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 98,
    matchLevel: 'high',
    platforms: ['tiktok', 'instagram'],
    categories: ['Làm đẹp & Chăm sóc da', 'Thời trang'],
    bio: 'Mẹo làm đẹp, trang điểm & dưỡng da 💄 Vì bạn xứng đáng được tỏa sáng!',
    followers: '1.5M',
    followersCount: 1500000,
    engagementRate: '9.4%',
    engagementValue: 9.4,
    avgPrice: '$1.5K',
    avgPriceValue: 1500,
    location: 'Thành phố Hồ Chí Minh',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c6',
    name: 'Đức Anh',
    username: 'ducanh.travel',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 82,
    matchLevel: 'medium',
    platforms: ['youtube', 'facebook'],
    categories: ['Du lịch', 'Phong cách sống'],
    bio: 'Đi để trải nghiệm, đừng ngại lo toan 🎒 Những vùng đất mới, những câu chuyện mới.',
    followers: '421K',
    followersCount: 421000,
    engagementRate: '4.8%',
    engagementValue: 4.8,
    avgPrice: '$620',
    avgPriceValue: 620,
    location: 'Thành phố Đà Nẵng',
    language: 'vi',
    saved: false,
  },

  // Page 2
  {
    id: 'c7',
    name: 'Khánh Vy',
    username: 'khanhvy.vibe',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 95,
    matchLevel: 'high',
    platforms: ['tiktok', 'youtube'],
    categories: ['Phong cách sống', 'Làm đẹp & Chăm sóc da'],
    bio: 'Truyền cảm hứng học tập, lối sống tích cực và chia sẻ phong cách sống giới trẻ ✨',
    followers: '2.1M',
    followersCount: 2100000,
    engagementRate: '9.1%',
    engagementValue: 9.1,
    avgPrice: '$1.8K',
    avgPriceValue: 1800,
    location: 'Thành phố Hà Nội',
    language: 'en',
    saved: true,
  },
  {
    id: 'c8',
    name: 'Hoàng Nam',
    username: 'nam.techreview',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 88,
    matchLevel: 'medium',
    platforms: ['youtube', 'tiktok', 'facebook'],
    categories: ['Công nghệ & Game', 'Phong cách sống'],
    bio: 'Đánh giá chân thực các sản phẩm công nghệ, setup góc làm việc và mẹo tiện ích 💻',
    followers: '780K',
    followersCount: 780000,
    engagementRate: '5.8%',
    engagementValue: 5.8,
    avgPrice: '$950',
    avgPriceValue: 950,
    location: 'Thành phố Hồ Chí Minh',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c9',
    name: 'Thanh Hằng',
    username: 'hang.lifestyle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 91,
    matchLevel: 'high',
    platforms: ['instagram', 'tiktok'],
    categories: ['Thời trang', 'Làm đẹp & Chăm sóc da'],
    bio: 'Phong cách thời trang tối giản & thanh lịch cho quý cô hiện đại 👠',
    followers: '640K',
    followersCount: 640000,
    engagementRate: '7.2%',
    engagementValue: 7.2,
    avgPrice: '$850',
    avgPriceValue: 850,
    location: 'Thành phố Hà Nội',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c10',
    name: 'Gia Bảo',
    username: 'bao.foodie',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    matchRate: 84,
    matchLevel: 'medium',
    platforms: ['tiktok', 'facebook'],
    categories: ['Ẩm thực & Đồ uống'],
    bio: 'Khám phá quán ngon vỉa hè & ẩm thực chuẩn vị 3 miền 🍲',
    followers: '490K',
    followersCount: 490000,
    engagementRate: '6.5%',
    engagementValue: 6.5,
    avgPrice: '$600',
    avgPriceValue: 600,
    location: 'Thành phố Hồ Chí Minh',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c11',
    name: 'Mai Phương',
    username: 'phuong.momlife',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 89,
    matchLevel: 'medium',
    platforms: ['facebook', 'youtube'],
    categories: ['Mẹ & Bé', 'Phong cách sống'],
    bio: 'Nhật ký nuôi dạy con & chăm sóc gia đình hạnh phúc 👶🍼',
    followers: '380K',
    followersCount: 380000,
    engagementRate: '5.9%',
    engagementValue: 5.9,
    avgPrice: '$550',
    avgPriceValue: 550,
    location: 'Thành phố Đà Nẵng',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c12',
    name: 'Quang Dũng',
    username: 'dung.fitness',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 93,
    matchLevel: 'high',
    platforms: ['tiktok', 'youtube'],
    categories: ['Thể hình & Sức khỏe'],
    bio: 'Hướng dẫn bài tập tại nhà, dinh dưỡng tăng cơ giảm mỡ chuẩn khoa học 🏋️‍♂️',
    followers: '920K',
    followersCount: 920000,
    engagementRate: '8.3%',
    engagementValue: 8.3,
    avgPrice: '$1.1K',
    avgPriceValue: 1100,
    location: 'Thành phố Hà Nội',
    language: 'vi',
    saved: false,
  },

  // Page 3
  {
    id: 'c13',
    name: 'Ngọc Trâm',
    username: 'tram.skincare',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 97,
    matchLevel: 'high',
    platforms: ['tiktok', 'instagram'],
    categories: ['Làm đẹp & Chăm sóc da'],
    bio: 'Dược sĩ tư vấn skincare khoa học | Review trung thực 100% 🧪✨',
    followers: '1.3M',
    followersCount: 1300000,
    engagementRate: '9.2%',
    engagementValue: 9.2,
    avgPrice: '$1.4K',
    avgPriceValue: 1400,
    location: 'Thành phố Hồ Chí Minh',
    language: 'vi',
    saved: true,
  },
  {
    id: 'c14',
    name: 'Tuấn Kiệt',
    username: 'kiet.gaming',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    matchRate: 83,
    matchLevel: 'medium',
    platforms: ['youtube', 'facebook'],
    categories: ['Công nghệ & Game'],
    bio: 'Streamer giải trí, trải nghiệm tựa game bom tấn đỉnh cao 🎮🔥',
    followers: '620K',
    followersCount: 620000,
    engagementRate: '5.4%',
    engagementValue: 5.4,
    avgPrice: '$700',
    avgPriceValue: 700,
    location: 'Thành phố Hải Phòng',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c15',
    name: 'Thu Trang',
    username: 'trang.traveler',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 90,
    matchLevel: 'high',
    platforms: ['instagram', 'tiktok'],
    categories: ['Du lịch', 'Phong cách sống'],
    bio: 'Review homestay xịn xò, cẩm nang du lịch tiết kiệm cho giới trẻ 🌴📸',
    followers: '710K',
    followersCount: 710000,
    engagementRate: '6.8%',
    engagementValue: 6.8,
    avgPrice: '$800',
    avgPriceValue: 800,
    location: 'Thành phố Cần Thơ',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c16',
    name: 'Hải Đăng',
    username: 'dang.streetwear',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 87,
    matchLevel: 'medium',
    platforms: ['tiktok', 'instagram'],
    categories: ['Thời trang'],
    bio: 'Phối đồ Streetwear cá tính | Xu hướng thời trang Gen Z cực chất 👟',
    followers: '530K',
    followersCount: 530000,
    engagementRate: '7.5%',
    engagementValue: 7.5,
    avgPrice: '$720',
    avgPriceValue: 720,
    location: 'Thành phố Hà Nội',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c17',
    name: 'Bích Ngọc',
    username: 'ngoc.dailyvlog',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 94,
    matchLevel: 'high',
    platforms: ['youtube', 'tiktok'],
    categories: ['Phong cách sống', 'Ẩm thực & Đồ uống'],
    bio: 'Vlog một ngày bình yên, nấu nướng và chăm sóc bản thân tại nhà 🌿☕',
    followers: '890K',
    followersCount: 890000,
    engagementRate: '8.1%',
    engagementValue: 8.1,
    avgPrice: '$990',
    avgPriceValue: 990,
    location: 'Thành phố Hồ Chí Minh',
    language: 'vi',
    saved: false,
  },
  {
    id: 'c18',
    name: 'Văn Hậu',
    username: 'hau.healthy',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchRate: 86,
    matchLevel: 'medium',
    platforms: ['facebook', 'tiktok'],
    categories: ['Thể hình & Sức khỏe'],
    bio: 'Chế độ ăn Eat Clean & phương pháp giảm cân bền vững không ăn kiêng khắt khe 🥗',
    followers: '450K',
    followersCount: 450000,
    engagementRate: '6.0%',
    engagementValue: 6.0,
    avgPrice: '$650',
    avgPriceValue: 650,
    location: 'Thành phố Đà Nẵng',
    language: 'vi',
    saved: false,
  },
];

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

export default function CreatorDiscoveryPage() {
  const navigate = useNavigate();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [followerTier, setFollowerTier] = useState<string>('all');
  const [engagementTier, setEngagementTier] = useState<string>('all');
  const [priceTier, setPriceTier] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('match');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Creators list with saved state
  const [creators, setCreators] = useState<Creator[]>(INITIAL_CREATORS);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

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
    setSelectedLanguage('all');
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

        // Language
        if (selectedLanguage !== 'all') {
          if (c.language !== selectedLanguage) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchRate - a.matchRate;
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
    selectedLanguage,
    sortBy,
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
    if (selectedLanguage !== 'all') count++;
    return count;
  }, [selectedPlatform, selectedCategory, followerTier, engagementTier, priceTier, selectedLocation, selectedLanguage]);

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
          <Breadcrumb
            separator=">"
            items={[
              {
                title: (
                  <span
                    style={{ color: '#5B5BF0', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => navigate('/campaigns')}
                  >
                    Chiến dịch
                  </span>
                ),
              },
              {
                title: <span style={{ color: '#94A3B8' }}>Khám phá Creator</span>,
              },
            ]}
            style={{ marginBottom: 6, fontSize: 12.5 }}
          />
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
            <span style={{ color: '#7C3AED', fontSize: 18, fontWeight: 800 }}>✦</span>
          </div>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            Tìm kiếm creator lý tưởng cho thương hiệu với thuật toán ghép nối AI, bộ lọc chuyên sâu và thông tin chi tiết thời gian thực.
          </Text>
        </div>

        {/* Top Right Action Buttons */}
        <Space size={12}>
          <Button
            icon={<SaveOutlined />}
            onClick={() => message.success('Đã lưu cấu hình tìm kiếm!')}
            style={{
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 10,
              height: 40,
              padding: '0 16px',
              borderColor: '#E2E8F0',
              color: '#334155',
            }}
          >
            Lưu tìm kiếm
          </Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate('/campaigns/create')}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 10,
              height: 40,
              padding: '0 20px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              border: 'none',
            }}
          >
            Tạo chiến dịch
          </Button>
        </Space>
      </div>

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
                  background: '#ECFDF5',
                  color: '#10B981',
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
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                  892
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Creator phù hợp</div>
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
                  { value: 'match', label: '✦ Độ phù hợp (AI)' },
                  { value: 'followers', label: '👥 Lượt theo dõi cao' },
                  { value: 'engagement', label: '📈 Tương tác cao' },
                  { value: 'priceAsc', label: '💰 Giá: Thấp đến cao' },
                  { value: 'priceDesc', label: '💰 Giá: Cao đến thấp' },
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
                  { value: 'all', label: '🌐 Tất cả nền tảng' },
                  { value: 'tiktok', label: '🎵 TikTok' },
                  { value: 'instagram', label: '📷 Instagram' },
                  { value: 'youtube', label: '▶️ YouTube' },
                  { value: 'facebook', label: '👤 Facebook' },
                  { value: 'x', label: '𝕏 X (Twitter)' },
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
                  { value: 'all', label: '🏷️ Tất cả lĩnh vực' },
                  ...ALL_CATEGORIES.map((c) => ({ value: c, label: c })),
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
                  { value: 'all', label: '👥 Quy mô: Tất cả' },
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
                  { value: 'all', label: '📊 Tương tác: Tất cả' },
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
                  { value: 'all', label: '💰 Mức giá: Tất cả' },
                  { value: 'low', label: '< $500' },
                  { value: 'mid', label: '$500 – $1,000' },
                  { value: 'high', label: '> $1,000' },
                ]}
              />
            </div>

            {/* Filter: Ngôn ngữ */}
            <div style={{ minWidth: 140 }}>
              <Select
                value={selectedLanguage}
                onChange={(val) => {
                  setSelectedLanguage(val);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', height: 38 }}
                options={[
                  { value: 'all', label: '🗣️ Ngôn ngữ: Tất cả' },
                  { value: 'vi', label: '🇻🇳 Tiếng Việt' },
                  { value: 'en', label: '🇬🇧 Tiếng Anh' },
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
        {filteredCreators.length === 0 ? (
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
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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

                      {/* Match Rate Badge */}
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
                        ★ {isHighMatch ? 'Khớp cao' : 'Khớp trung bình'}
                      </div>
                    </div>

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
                      Xem hồ sơ →
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
                      {creator.saved ? 'Đã lưu' : 'Lưu danh sách'}
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
                              ★ {creator.matchRate}%
                            </span>
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
                          Xem hồ sơ →
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

      {/* 6. Creator Profile Quick Preview Drawer */}
      <Drawer
        title={
          selectedCreator ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar src={selectedCreator.avatar} size={36} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                  {selectedCreator.name}
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                  @{selectedCreator.username}
                </div>
              </div>
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
                  ✦ AI Match Score
                </span>
                <Tag color="green" style={{ fontWeight: 800, borderRadius: 6 }}>
                  {selectedCreator.matchRate}% Độ phù hợp
                </Tag>
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                Creator này có tệp khán giả trùng khớp 88% với khách hàng mục tiêu của bạn trong lĩnh vực chăm sóc da và làm đẹp.
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
