import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Dropdown,
  message,
  Modal,
  Tag,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SaveOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckCircleFilled,
  MoreOutlined,
  DownloadOutlined,
  UserOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  HeartFilled,
  MessageOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
  WomanOutlined,
  AimOutlined,
  BarChartOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  RightOutlined,
  StarFilled,
  StarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  SwapOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import './CreatorShortlistPage.css';

export interface CreatorCompareItem {
  id: string;
  campaignId: string;
  campaignName: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  matchLevel: 'high' | 'med';
  matchText: string;
  platforms: string[];
  categories: string[];
  followers: string;
  followersPercent: number;
  views: string;
  viewsPercent: number;
  engagement: string;
  engagementPercent: number;
  likes: string;
  likesPercent: number;
  comments: string;
  commentsPercent: number;
  shares: string;
  sharesPercent: number;
  price: string;
  location: string;
  gender: {
    female: number;
    male: number;
  };
  interests: string[];
  note: string;
  noteType: 'high' | 'med' | 'neutral';
  favorite: boolean;
  priority: 'high' | 'med' | 'low';
  selected: boolean;
  addedDate: string;
  status: 'shortlisted' | 'contacted' | 'negotiating';
}

export const CAMPAIGN_OPTIONS = [
  { value: 'all', label: '📁 Tất cả chiến dịch' },
  { value: 'camp-1', label: '🌟 Ra mắt Skincare Summer Glow' },
  { value: 'camp-2', label: '💄 Son Lì TikTok Blitz' },
  { value: 'camp-3', label: '👟 BST Giày Sneaker Thu Đông' },
];

export const INITIAL_COMPARE_CREATORS: CreatorCompareItem[] = [
  {
    id: 'c1',
    campaignId: 'camp-1',
    campaignName: 'Ra mắt Skincare Summer Glow',
    name: 'Linh Nguyễn',
    username: 'linhnguyen.official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchLevel: 'high',
    matchText: 'Khớp cao (96%)',
    platforms: ['tiktok', 'instagram'],
    categories: ['Làm đẹp & Chăm sóc da', 'Phong cách sống'],
    followers: '1.2M',
    followersPercent: 100,
    views: '32.4K',
    viewsPercent: 100,
    engagement: '8.7%',
    engagementPercent: 100,
    likes: '4.1K',
    likesPercent: 100,
    comments: '340',
    commentsPercent: 100,
    shares: '120',
    sharesPercent: 100,
    price: '15.000.000 ₫',
    location: 'Việt Nam (78%)',
    gender: { female: 78, male: 22 },
    interests: ['Chăm sóc da', 'Làm đẹp', 'Đời sống'],
    note: 'Phù hợp hoàn hảo với mục tiêu ra mắt kem chống nắng, tệp nữ 18-28 tuổi rất đông.',
    noteType: 'high',
    favorite: true,
    priority: 'high',
    selected: true,
    addedDate: '28/09/2026',
    status: 'shortlisted',
  },
  {
    id: 'c2',
    campaignId: 'camp-1',
    campaignName: 'Ra mắt Skincare Summer Glow',
    name: 'Minh Hoàng',
    username: 'minhhoang.92',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchLevel: 'high',
    matchText: 'Khớp cao (91%)',
    platforms: ['tiktok', 'youtube'],
    categories: ['Thời trang', 'Phong cách sống'],
    followers: '856K',
    followersPercent: 71,
    views: '28.7K',
    viewsPercent: 88,
    engagement: '6.2%',
    engagementPercent: 71,
    likes: '3.2K',
    likesPercent: 78,
    comments: '210',
    commentsPercent: 62,
    shares: '87',
    sharesPercent: 72,
    price: '12.500.000 ₫',
    location: 'Việt Nam (72%)',
    gender: { female: 72, male: 28 },
    interests: ['Thời trang', 'Đời sống', 'Du lịch'],
    note: 'Tệp khán giả tương tác rất tốt, phong cách video chất lượng 4K.',
    noteType: 'high',
    favorite: true,
    priority: 'high',
    selected: true,
    addedDate: '29/09/2026',
    status: 'contacted',
  },
  {
    id: 'c3',
    campaignId: 'camp-2',
    campaignName: 'Son Lì TikTok Blitz',
    name: 'Thảo Vy',
    username: 'thaovy.official',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchLevel: 'med',
    matchText: 'Khớp TB (84%)',
    platforms: ['instagram', 'tiktok'],
    categories: ['Ẩm thực & Đồ uống', 'Phong cách sống'],
    followers: '542K',
    followersPercent: 45,
    views: '19.6K',
    viewsPercent: 60,
    engagement: '5.1%',
    engagementPercent: 58,
    likes: '2.1K',
    likesPercent: 51,
    comments: '150',
    commentsPercent: 44,
    shares: '62',
    sharesPercent: 51,
    price: '8.000.000 ₫',
    location: 'Việt Nam (68%)',
    gender: { female: 68, male: 32 },
    interests: ['Ẩm thực', 'Đời sống', 'Nấu ăn'],
    note: 'Nội dung swatch son tự nhiên, review chân thật, giá hợp lý trong ngân sách.',
    noteType: 'med',
    favorite: false,
    priority: 'med',
    selected: true,
    addedDate: '26/09/2026',
    status: 'shortlisted',
  },
  {
    id: 'c4',
    campaignId: 'camp-3',
    campaignName: 'BST Giày Sneaker Thu Đông',
    name: 'Đức Anh',
    username: 'ducanh.travel',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    matchLevel: 'med',
    matchText: 'Khớp TB (79%)',
    platforms: ['tiktok', 'facebook'],
    categories: ['Du lịch', 'Phong cách sống'],
    followers: '421K',
    followersPercent: 35,
    views: '15.2K',
    viewsPercent: 47,
    engagement: '4.8%',
    engagementPercent: 55,
    likes: '1.8K',
    likesPercent: 44,
    comments: '120',
    commentsPercent: 35,
    shares: '45',
    sharesPercent: 37,
    price: '7.000.000 ₫',
    location: 'Việt Nam (61%)',
    gender: { female: 61, male: 39 },
    interests: ['Du lịch', 'Trải nghiệm', 'Đời sống'],
    note: 'Phong cách năng động đường phố, thường xuyên phối outfit với giày thể thao.',
    noteType: 'neutral',
    favorite: false,
    priority: 'med',
    selected: false,
    addedDate: '25/09/2026',
    status: 'shortlisted',
  },
  {
    id: 'c5',
    campaignId: 'camp-1',
    campaignName: 'Ra mắt Skincare Summer Glow',
    name: 'Bác sĩ Ngọc',
    username: 'drngoc.dermatology',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchLevel: 'high',
    matchText: 'Khớp cao (94%)',
    platforms: ['tiktok', 'youtube'],
    categories: ['Làm đẹp & Chăm sóc da', 'Sức khỏe'],
    followers: '920K',
    followersPercent: 77,
    views: '41.0K',
    viewsPercent: 95,
    engagement: '7.8%',
    engagementPercent: 90,
    likes: '3.8K',
    likesPercent: 92,
    comments: '410',
    commentsPercent: 96,
    shares: '180',
    sharesPercent: 95,
    price: '18.000.000 ₫',
    location: 'Việt Nam (85%)',
    gender: { female: 81, male: 19 },
    interests: ['Da liễu', 'Dược mỹ phẩm', 'Chăm sóc sức khỏe'],
    note: 'Có chuyên môn cao, tăng uy tín cho thương hiệu khi phân tích thành phần sản phẩm.',
    noteType: 'high',
    favorite: true,
    priority: 'high',
    selected: false,
    addedDate: '27/09/2026',
    status: 'negotiating',
  },
  {
    id: 'c6',
    campaignId: 'camp-2',
    campaignName: 'Son Lì TikTok Blitz',
    name: 'Mai Lan',
    username: 'mailan.foodie',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    matchLevel: 'high',
    matchText: 'Khớp cao (89%)',
    platforms: ['tiktok', 'instagram'],
    categories: ['Làm đẹp & Chăm sóc da', 'Thời trang'],
    followers: '680K',
    followersPercent: 57,
    views: '24.5K',
    viewsPercent: 76,
    engagement: '6.9%',
    engagementPercent: 79,
    likes: '2.9K',
    likesPercent: 71,
    comments: '280',
    commentsPercent: 82,
    shares: '95',
    sharesPercent: 79,
    price: '9.500.000 ₫',
    location: 'Việt Nam (75%)',
    gender: { female: 86, male: 14 },
    interests: ['Makeup', 'Thời trang', 'GenZ Lifestyle'],
    note: 'Fanbase nữ 18-24 chiếm 86%, chuyên các video thử son lên màu chuẩn.',
    noteType: 'high',
    favorite: true,
    priority: 'med',
    selected: false,
    addedDate: '28/09/2026',
    status: 'shortlisted',
  },
  {
    id: 'c7',
    campaignId: 'camp-3',
    campaignName: 'BST Giày Sneaker Thu Đông',
    name: 'Tuấn Khang',
    username: 'tuankhang.tech',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    matchLevel: 'med',
    matchText: 'Khớp TB (76%)',
    platforms: ['youtube', 'tiktok'],
    categories: ['Công nghệ', 'Phong cách sống'],
    followers: '510K',
    followersPercent: 43,
    views: '18.0K',
    viewsPercent: 56,
    engagement: '4.2%',
    engagementPercent: 48,
    likes: '1.6K',
    likesPercent: 39,
    comments: '98',
    commentsPercent: 29,
    shares: '34',
    sharesPercent: 28,
    price: '6.500.000 ₫',
    location: 'Việt Nam (65%)',
    gender: { female: 42, male: 58 },
    interests: ['Công nghệ', 'Sneakers', 'Gym'],
    note: 'Dự phòng cho Đức Anh nếu cần thêm góc nhìn unbox & review độ êm khi di chuyển.',
    noteType: 'neutral',
    favorite: false,
    priority: 'low',
    selected: false,
    addedDate: '29/09/2026',
    status: 'shortlisted',
  },
];

export default function CreatorShortlistPage() {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorCompareItem[]>(INITIAL_COMPARE_CREATORS);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'compare'>('board');
  const [boardLayout, setBoardLayout] = useState<'grid' | 'table'>('grid');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [onlyFavorite, setOnlyFavorite] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [metricFilter, setMetricFilter] = useState('engagement');
  
  // Note inline editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCampaignId, setAddCampaignId] = useState('camp-1');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [targetCreatorForInvite, setTargetCreatorForInvite] = useState<CreatorCompareItem | null>(null);

  // Toggle selection checkbox for comparison (Max 5)
  const handleToggleSelect = (id: string) => {
    setCreators((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;
      if (!target.selected) {
        const currentlySelected = prev.filter((c) => c.selected).length;
        if (currentlySelected >= 5) {
          message.warning('Bạn chỉ có thể chọn tối đa 5 Creator cùng lúc để so sánh!');
          return prev;
        }
      }
      return prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c));
    });
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextFav = !c.favorite;
          if (nextFav) {
            message.success(`Đã thêm ${c.name} vào danh sách yêu thích ⭐`);
          } else {
            message.info(`Đã bỏ ${c.name} khỏi danh sách yêu thích`);
          }
          return { ...c, favorite: nextFav };
        }
        return c;
      })
    );
  };

  // Change priority
  const handleChangePriority = (id: string, priority: 'high' | 'med' | 'low') => {
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, priority } : c))
    );
    const label = priority === 'high' ? 'Ưu tiên Cao' : priority === 'med' ? 'Ưu tiên TB' : 'Ưu tiên Thấp';
    message.success(`Đã cập nhật mức độ ưu tiên: ${label}`);
  };

  // Save inline note
  const handleStartEditNote = (c: CreatorCompareItem) => {
    setEditingNoteId(c.id);
    setEditingNoteText(c.note);
  };

  const handleSaveNote = (id: string) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, note: editingNoteText } : c))
    );
    setEditingNoteId(null);
    message.success('Đã lưu ghi chú thành công!');
  };

  // Remove from shortlist
  const handleRemoveFromShortlist = (id: string, name: string) => {
    Modal.confirm({
      title: 'Xóa Creator khỏi Shortlist?',
      content: `Bạn có chắc muốn xóa ${name} khỏi danh sách chọn này?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setCreators((prev) => prev.filter((c) => c.id !== id));
        message.info(`Đã xóa ${name} khỏi shortlist`);
      },
    });
  };

  // Move creator to another campaign
  const handleMoveCampaign = (creatorId: string, newCampaignId: string) => {
    const targetCamp = CAMPAIGN_OPTIONS.find((opt) => opt.value === newCampaignId);
    if (!targetCamp || newCampaignId === 'all') return;
    setCreators((prev) =>
      prev.map((c) =>
        c.id === creatorId
          ? { ...c, campaignId: newCampaignId, campaignName: targetCamp.label.replace(/^[^\w\s]*\s*/, '') }
          : c
      )
    );
    message.success(`Đã chuyển sang chiến dịch: ${targetCamp.label}`);
  };

  // Filtered creators for Board view
  const filteredCreators = creators.filter((c) => {
    if (selectedCampaign !== 'all' && c.campaignId !== selectedCampaign) return false;
    if (onlyFavorite && !c.favorite) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchUser = c.username.toLowerCase().includes(q);
      const matchCat = c.categories.some((cat) => cat.toLowerCase().includes(q));
      const matchNote = c.note.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchCat && !matchNote) return false;
    }
    return true;
  });

  // Selected creators for comparison
  const selectedCreators = creators.filter((c) => c.selected);

  // Render social platform icons
  const renderPlatformIcon = (platform: string) => {
    if (platform === 'tiktok') {
      return (
        <span
          key={platform}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#0F172A',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="TikTok"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V8.92a8.31 8.31 0 0 0 4.91 1.6V7.07a4.8 4.8 0 0 1-1-.38z" />
          </svg>
        </span>
      );
    }
    if (platform === 'instagram') {
      return (
        <span
          key={platform}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Instagram"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
          </svg>
        </span>
      );
    }
    if (platform === 'youtube') {
      return (
        <span
          key={platform}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#EF4444',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 800,
          }}
          title="YouTube"
        >
          ▶
        </span>
      );
    }
    if (platform === 'facebook') {
      return (
        <span
          key={platform}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#2563EB',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
          }}
          title="Facebook"
        >
          f
        </span>
      );
    }
    return null;
  };

  // Priority Tag Component
  const renderPriorityTag = (creator: CreatorCompareItem) => {
    const menuItems: MenuProps['items'] = [
      {
        key: 'high',
        label: '🔴 Ưu tiên Cao',
        onClick: () => handleChangePriority(creator.id, 'high'),
      },
      {
        key: 'med',
        label: '🟡 Ưu tiên Trung bình',
        onClick: () => handleChangePriority(creator.id, 'med'),
      },
      {
        key: 'low',
        label: '🟢 Ưu tiên Thấp',
        onClick: () => handleChangePriority(creator.id, 'low'),
      },
    ];

    let color = 'default';
    let text = 'Ưu tiên Thấp';
    if (creator.priority === 'high') {
      color = 'error';
      text = '🔴 Ưu tiên Cao';
    } else if (creator.priority === 'med') {
      color = 'warning';
      text = '🟡 Ưu tiên TB';
    } else {
      color = 'success';
      text = '🟢 Ưu tiên Thấp';
    }

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Tag
          color={color}
          style={{ cursor: 'pointer', fontWeight: 600, borderRadius: 6, margin: 0 }}
          title="Bấm để đổi độ ưu tiên"
        >
          {text} ▾
        </Tag>
      </Dropdown>
    );
  };

  // More menu for card
  const getCardMoreMenu = (creator: CreatorCompareItem): MenuProps['items'] => [
    {
      key: 'invite',
      label: 'Gửi lời mời hợp tác',
      icon: <SendOutlined style={{ color: '#4F46E5' }} />,
      onClick: () => {
        setTargetCreatorForInvite(creator);
        setInviteModalOpen(true);
      },
    },
    {
      key: 'move',
      label: 'Chuyển chiến dịch',
      icon: <SwapOutlined />,
      children: CAMPAIGN_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => ({
        key: `move-${opt.value}`,
        label: opt.label,
        disabled: opt.value === creator.campaignId,
        onClick: () => handleMoveCampaign(creator.id, opt.value),
      })),
    },
    {
      key: 'share',
      label: 'Sao chép liên kết hồ sơ',
      icon: <ShareAltOutlined />,
      onClick: () => {
        navigator.clipboard?.writeText(window.location.origin + '/creators/' + creator.id);
        message.success('Đã sao chép liên kết hồ sơ!');
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'remove',
      label: 'Xóa khỏi Shortlist',
      danger: true,
      icon: <DeleteOutlined />,
      onClick: () => handleRemoveFromShortlist(creator.id, creator.name),
    },
  ];

  return (
    <div className="shortlist-page-container">
      {/* 1. Breadcrumb */}
      <div className="shortlist-breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/campaigns')}>
          Chiến dịch
        </span>
        <span>›</span>
        <span className="breadcrumb-link" onClick={() => navigate('/creators')}>
          Khám phá Creator
        </span>
        <span>›</span>
        <span className="breadcrumb-current">Danh sách chọn (Shortlist)</span>
      </div>

      {/* 2. Header & Title Bar with Campaign Selector */}
      <div className="shortlist-header-row">
        <div>
          <div className="shortlist-title-wrap">
            <h1 className="shortlist-main-title">Danh sách chọn & So sánh Creator</h1>
            <span className="shortlist-tagline-cursive">
              Phù hợp hơn • Quản lý tập trung • So sánh trực quan ✨
            </span>
          </div>
          <div className="shortlist-description">
            Quản lý shortlist theo từng chiến dịch, đánh dấu ưu tiên, ghi chú nội bộ và so sánh đa chiều từ 2-5 Creator.
          </div>
        </div>

        <div className="shortlist-header-actions">
          {/* Campaign Selector Dropdown */}
          <div className="campaign-selector-box">
            <span className="campaign-selector-label">Chiến dịch:</span>
            <Select
              value={selectedCampaign}
              onChange={(val) => {
                setSelectedCampaign(val);
                message.info(`Đang xem danh sách: ${CAMPAIGN_OPTIONS.find((o) => o.value === val)?.label}`);
              }}
              style={{ width: 250 }}
              options={CAMPAIGN_OPTIONS}
            />
          </div>

          <Button
            className="btn-save-shortlist"
            icon={<SaveOutlined />}
            onClick={() => message.success('Đã lưu toàn bộ trạng thái shortlist thành công!')}
          >
            Lưu danh sách
          </Button>

          <Button
            className="btn-add-creator-primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
          >
            Thêm Creator
          </Button>
        </div>
      </div>

      {/* 3. Main Navigation Mode Switcher: Board View vs Compare View */}
      <div className="shortlist-mode-switcher-bar">
        <div className="mode-switcher-tabs">
          <button
            className={`mode-tab-btn ${viewMode === 'board' ? 'active' : ''}`}
            onClick={() => setViewMode('board')}
          >
            <UnorderedListOutlined />
            <span>📋 Bảng Shortlist Board</span>
            <span className="mode-count-badge">{filteredCreators.length}</span>
          </button>

          <button
            className={`mode-tab-btn ${viewMode === 'compare' ? 'active' : ''}`}
            onClick={() => {
              if (selectedCreators.length < 2) {
                message.info('Mẹo: Hãy tick chọn ít nhất 2 Creator trên bảng Shortlist để so sánh trực quan nhất!');
              }
              setViewMode('compare');
            }}
          >
            <BarChartOutlined />
            <span>⚖️ So sánh chi tiết</span>
            <span className="mode-count-badge highlight">
              {selectedCreators.length}/5 đã chọn
            </span>
          </button>
        </div>

        {viewMode === 'board' && (
          <div className="layout-toggle-group">
            <span style={{ fontSize: 12, color: '#64748B', marginRight: 4 }}>Hiển thị:</span>
            <Button
              size="small"
              type={boardLayout === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setBoardLayout('grid')}
            >
              Thẻ
            </Button>
            <Button
              size="small"
              type={boardLayout === 'table' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setBoardLayout('table')}
            >
              Bảng
            </Button>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW MODE 1: SHORTLIST BOARD
          ========================================================================= */}
      {viewMode === 'board' && (
        <div className="shortlist-board-section">
          {/* Search & Filters */}
          <div className="shortlist-filters-container">
            <div className="filters-top-row">
              <div className="search-input-wrap">
                <Input
                  prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                  placeholder="Tìm kiếm creator theo tên, username, ghi chú hoặc lĩnh vực..."
                  allowClear
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filters-top-actions">
                {/* Priority Filter */}
                <div className="sort-label-wrap">
                  <span>Ưu tiên:</span>
                  <Select
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                    size="small"
                    style={{ width: 140 }}
                    options={[
                      { value: 'all', label: 'Tất cả mức độ' },
                      { value: 'high', label: '🔴 Ưu tiên Cao' },
                      { value: 'med', label: '🟡 Ưu tiên TB' },
                      { value: 'low', label: '🟢 Ưu tiên Thấp' },
                    ]}
                  />
                </div>

                {/* Favorite Filter Toggle */}
                <Button
                  size="small"
                  type={onlyFavorite ? 'primary' : 'default'}
                  icon={onlyFavorite ? <StarFilled style={{ color: '#F59E0B' }} /> : <StarOutlined />}
                  onClick={() => setOnlyFavorite(!onlyFavorite)}
                  style={{ borderRadius: 8, height: 32 }}
                >
                  {onlyFavorite ? 'Đang lọc Yêu thích ⭐' : 'Chỉ xem Yêu thích'}
                </Button>

                <span
                  className="link-clear-filters"
                  onClick={() => {
                    setSearchTerm('');
                    setPriorityFilter('all');
                    setOnlyFavorite(false);
                    message.info('Đã xóa tất cả bộ lọc');
                  }}
                >
                  Xóa bộ lọc
                </span>
              </div>
            </div>
          </div>

          {/* Grid Layout Cards */}
          {boardLayout === 'grid' && (
            <div className="shortlist-board-grid">
              {filteredCreators.length === 0 ? (
                <div className="shortlist-empty-box">
                  <div style={{ fontSize: 36 }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>
                    Không tìm thấy Creator nào trong danh sách
                  </div>
                  <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                    Thử đổi bộ lọc hoặc bấm "Thêm Creator" để bổ sung ứng viên mới vào chiến dịch này.
                  </div>
                  <Button
                    type="primary"
                    style={{ marginTop: 14, borderRadius: 8 }}
                    onClick={() => {
                      setSearchTerm('');
                      setPriorityFilter('all');
                      setOnlyFavorite(false);
                      setSelectedCampaign('all');
                    }}
                  >
                    Xem tất cả Creator
                  </Button>
                </div>
              ) : (
                filteredCreators.map((c) => {
                  const isHigh = c.matchLevel === 'high';
                  return (
                    <div
                      key={c.id}
                      className={`board-creator-card ${c.selected ? 'selected' : ''}`}
                    >
                      {/* Top Row: Checkbox, Campaign Badge & Actions */}
                      <div className="board-card-header">
                        <div className="card-select-group">
                          <Checkbox
                            checked={c.selected}
                            onChange={() => handleToggleSelect(c.id)}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                              So sánh
                            </span>
                          </Checkbox>
                        </div>

                        <div className="card-top-right-group">
                          {/* Priority dropdown */}
                          {renderPriorityTag(c)}

                          {/* Star favorite */}
                          <Tooltip title={c.favorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}>
                            <button
                              className="btn-star-fav"
                              onClick={(e) => handleToggleFavorite(c.id, e)}
                            >
                              {c.favorite ? (
                                <StarFilled style={{ color: '#F59E0B', fontSize: 17 }} />
                              ) : (
                                <StarOutlined style={{ color: '#94A3B8', fontSize: 17 }} />
                              )}
                            </button>
                          </Tooltip>

                          {/* More dropdown */}
                          <Dropdown
                            menu={{ items: getCardMoreMenu(c) }}
                            trigger={['click']}
                            placement="bottomRight"
                          >
                            <Button size="small" type="text" icon={<MoreOutlined />} />
                          </Dropdown>
                        </div>
                      </div>

                      {/* Campaign Tag */}
                      <div className="card-campaign-badge">
                        <span className="campaign-chip">📌 {c.campaignName}</span>
                        <span
                          className={`match-badge-pill ${
                            isHigh ? 'match-badge-high' : 'match-badge-med'
                          }`}
                        >
                          ✦ {c.matchText}
                        </span>
                      </div>

                      {/* Creator Info */}
                      <div className="board-card-profile">
                        <img src={c.avatar} alt={c.name} className="board-card-avatar" />
                        <div className="board-card-info">
                          <div className="board-name-row">
                            <span className="board-creator-name">{c.name}</span>
                            {c.isVerified && (
                              <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />
                            )}
                          </div>
                          <span className="board-creator-user">@{c.username}</span>

                          <div className="board-social-row">
                            {c.platforms.map(renderPlatformIcon)}
                            <span className="board-cat-label">{c.categories[0]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Core Metrics Grid */}
                      <div className="board-stats-grid">
                        <div className="board-stat-item">
                          <span className="stat-val">{c.followers}</span>
                          <span className="stat-lbl">Followers</span>
                        </div>
                        <div className="board-stat-item">
                          <span className="stat-val" style={{ color: '#059669' }}>
                            {c.engagement}
                          </span>
                          <span className="stat-lbl">Tương tác</span>
                        </div>
                        <div className="board-stat-item">
                          <span className="stat-val">{c.price}</span>
                          <span className="stat-lbl">Giá dự kiến</span>
                        </div>
                      </div>

                      {/* Editable Note Section */}
                      <div className="board-note-box">
                        <div className="note-header">
                          <span className="note-title">📝 Ghi chú cá nhân:</span>
                          {editingNoteId !== c.id && (
                            <button
                              className="btn-edit-note-icon"
                              onClick={() => handleStartEditNote(c)}
                              title="Chỉnh sửa ghi chú"
                            >
                              <EditOutlined />
                            </button>
                          )}
                        </div>

                        {editingNoteId === c.id ? (
                          <div className="note-editor-wrap">
                            <Input.TextArea
                              rows={2}
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              placeholder="Nhập ghi chú (vd: Đã gửi email, xin báo giá 1 video TikTok)..."
                              autoFocus
                            />
                            <div className="note-editor-actions">
                              <Button
                                size="small"
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => handleSaveNote(c.id)}
                              >
                                Lưu
                              </Button>
                              <Button
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => setEditingNoteId(null)}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="note-content-display"
                            onClick={() => handleStartEditNote(c)}
                            title="Bấm để chỉnh sửa ghi chú"
                          >
                            {c.note || (
                              <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                                Chưa có ghi chú. Bấm vào đây để thêm...
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="board-card-actions">
                        <Button
                          className="btn-invite-creator"
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={() => {
                            setTargetCreatorForInvite(c);
                            setInviteModalOpen(true);
                          }}
                        >
                          Mời hợp tác
                        </Button>

                        <Button
                          className="btn-view-creator-profile"
                          onClick={() => navigate(`/creators/${c.id}`)}
                        >
                          Xem hồ sơ
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Table Layout */}
          {boardLayout === 'table' && (
            <div className="shortlist-table-container">
              <table className="shortlist-board-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th style={{ width: 40 }}>⭐</th>
                    <th>Creator</th>
                    <th>Chiến dịch</th>
                    <th>Ưu tiên</th>
                    <th>Followers</th>
                    <th>Tương tác</th>
                    <th>Giá dự kiến</th>
                    <th>Ghi chú cá nhân</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreators.map((c) => (
                    <tr key={c.id} className={c.selected ? 'row-selected' : ''}>
                      <td>
                        <Checkbox
                          checked={c.selected}
                          onChange={() => handleToggleSelect(c.id)}
                        />
                      </td>
                      <td>
                        <button
                          className="btn-star-fav"
                          onClick={(e) => handleToggleFavorite(c.id, e)}
                        >
                          {c.favorite ? (
                            <StarFilled style={{ color: '#F59E0B', fontSize: 16 }} />
                          ) : (
                            <StarOutlined style={{ color: '#94A3B8', fontSize: 16 }} />
                          )}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={c.avatar}
                            alt={c.name}
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>@{c.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="campaign-chip-small">📌 {c.campaignName}</span>
                      </td>
                      <td>{renderPriorityTag(c)}</td>
                      <td>
                        <strong style={{ fontSize: 12.5 }}>{c.followers}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: 12.5 }}>{c.engagement}</strong>
                      </td>
                      <td>
                        <strong style={{ fontSize: 12.5 }}>{c.price}</strong>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStartEditNote(c)}
                          title={c.note}
                        >
                          {c.note || <span style={{ color: '#94A3B8' }}>Bấm để thêm ghi chú...</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button
                            size="small"
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={() => {
                              setTargetCreatorForInvite(c);
                              setInviteModalOpen(true);
                            }}
                          >
                            Mời
                          </Button>
                          <Dropdown menu={{ items: getCardMoreMenu(c) }} trigger={['click']}>
                            <Button size="small" icon={<MoreOutlined />} />
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sticky Bottom Floating Bar for Comparison */}
          {selectedCreators.length > 0 && (
            <div className="floating-comparison-bar">
              <div className="floating-bar-left">
                <div className="floating-avatar-stack">
                  {selectedCreators.map((c) => (
                    <img
                      key={c.id}
                      src={c.avatar}
                      alt={c.name}
                      title={c.name}
                      className="floating-avatar-item"
                    />
                  ))}
                </div>
                <div className="floating-text-wrap">
                  <span className="floating-title">
                    Đã chọn <strong>{selectedCreators.length}/5</strong> Creator để so sánh
                  </span>
                  <span className="floating-hint">
                    {selectedCreators.length < 2
                      ? 'Chọn thêm ít nhất 1 Creator nữa để đối chiếu chỉ số'
                      : 'Sẵn sàng phân tích và lập báo cáo đối chiếu đa chiều!'}
                  </span>
                </div>
              </div>

              <div className="floating-bar-right">
                <Button
                  className="btn-clear-selection"
                  onClick={() =>
                    setCreators((prev) => prev.map((c) => ({ ...c, selected: false })))
                  }
                >
                  Bỏ chọn tất cả
                </Button>

                <Button
                  className="btn-start-compare-floating"
                  type="primary"
                  icon={<BarChartOutlined />}
                  onClick={() => setViewMode('compare')}
                >
                  Bắt đầu so sánh chi tiết ({selectedCreators.length}) →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: COMPARISON MATRIX
          ========================================================================= */}
      {viewMode === 'compare' && (
        <div className="shortlist-compare-section">
          {/* Top Banner Navigation */}
          <div className="compare-mode-header-card">
            <div className="compare-header-left">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setViewMode('board')}
                style={{ borderRadius: 8 }}
              >
                ← Quay lại Bảng Shortlist
              </Button>
              <div>
                <h2 className="compare-main-title">
                  Bảng đối chiếu chuyên sâu ({selectedCreators.length} Creator)
                </h2>
                <div className="compare-main-subtitle">
                  Chiến dịch:{' '}
                  <strong>
                    {selectedCampaign === 'all'
                      ? 'Tất cả chiến dịch'
                      : CAMPAIGN_OPTIONS.find((o) => o.value === selectedCampaign)?.label}
                  </strong>
                </div>
              </div>
            </div>

            <div className="compare-header-right">
              <div className="matrix-metric-select-wrap">
                <span>Chỉ số tập trung:</span>
                <Select
                  value={metricFilter}
                  onChange={setMetricFilter}
                  size="small"
                  style={{ width: 140 }}
                  options={[
                    { value: 'engagement', label: 'Tỷ lệ tương tác' },
                    { value: 'views', label: 'Lượt xem TB' },
                    { value: 'followers', label: 'Người theo dõi' },
                    { value: 'price', label: 'Giá dự kiến' },
                  ]}
                />
              </div>

              <Button
                className="btn-download-report"
                icon={<DownloadOutlined />}
                onClick={() => {
                  message.loading('Đang xuất file báo cáo so sánh...');
                  setTimeout(() => {
                    message.success('Đã tải xuống file so sánh Creator (PDF/Excel)!');
                  }, 1000);
                }}
              >
                Tải báo cáo
              </Button>
            </div>
          </div>

          {selectedCreators.length < 2 ? (
            <div className="shortlist-empty-box" style={{ background: '#FFFFFF', padding: 40, borderRadius: 16 }}>
              <div style={{ fontSize: 40 }}>⚖️</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginTop: 12 }}>
                Cần chọn ít nhất 2 Creator để thực hiện so sánh
              </div>
              <div style={{ color: '#64748B', fontSize: 13, marginTop: 6, maxWidth: 450, margin: '6px auto 0' }}>
                Hiện tại bạn mới chọn {selectedCreators.length} Creator. Vui lòng quay lại Bảng Shortlist và tick chọn thêm để xem ma trận phân tích chi tiết.
              </div>
              <Button
                type="primary"
                style={{ marginTop: 18, borderRadius: 8, height: 38 }}
                onClick={() => setViewMode('board')}
              >
                ← Quay lại Bảng Shortlist để chọn
              </Button>
            </div>
          ) : (
            <>
              {/* Tabs Navigation Bar */}
              <div className="shortlist-tabs-row">
                <div
                  className={`shortlist-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <BarChartOutlined />
                  Tổng quan so sánh
                </div>

                <div
                  className={`shortlist-tab-item ${activeTab === 'audience' ? 'active' : ''}`}
                  onClick={() => setActiveTab('audience')}
                >
                  <TeamOutlined />
                  Khán giả & Nhân khẩu học
                </div>

                <div
                  className={`shortlist-tab-item ${activeTab === 'content' ? 'active' : ''}`}
                  onClick={() => setActiveTab('content')}
                >
                  <VideoCameraOutlined />
                  Nội dung & Phong cách
                </div>

                <div
                  className={`shortlist-tab-item ${activeTab === 'performance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('performance')}
                >
                  <RiseOutlined />
                  Hiệu suất & Dự báo
                </div>

                <div
                  className={`shortlist-tab-item ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <ClockCircleOutlined />
                  Dữ liệu lịch sử
                </div>
              </div>

              {/* Matrix Table */}
              <div className="comparison-matrix-card">
                <div className="matrix-table-wrap">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th className="matrix-col-indicator">CHỈ SỐ PHÂN TÍCH</th>
                        {selectedCreators.map((c) => (
                          <th key={c.id} className="matrix-creator-col-header">
                            <div className="creator-header-cell">
                              <img
                                src={c.avatar}
                                alt={c.name}
                                className="creator-header-avatar"
                              />
                              <div className="creator-header-info">
                                <span className="creator-header-name">{c.name}</span>
                                <span className="creator-header-user">@{c.username}</span>
                                <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                                  <span
                                    className={`creator-header-match-tag ${
                                      c.matchLevel === 'high' ? 'tag-match-high' : 'tag-match-med'
                                    }`}
                                  >
                                    {c.matchText}
                                  </span>
                                  <span className="campaign-chip-tiny">
                                    {c.campaignName.slice(0, 16)}...
                                  </span>
                                </div>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {/* Row 1: Người theo dõi */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <UserOutlined style={{ color: '#4F46E5' }} />
                            <span>Người theo dõi</span>
                          </div>
                        </td>
                        {selectedCreators.map((c, idx) => (
                          <td key={c.id}>
                            <div className="metric-cell-value-wrap">
                              <span className="metric-cell-num">{c.followers}</span>
                              <div className="metric-cell-bar-track">
                                <div
                                  className={`metric-cell-bar-fill ${
                                    idx === 0 ? 'bar-blue' : idx === 1 ? 'bar-orange' : 'bar-slate'
                                  }`}
                                  style={{ width: `${c.followersPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 2: Lượt xem TB */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <EyeOutlined style={{ color: '#06B6D4' }} />
                            <span>Lượt xem TB</span>
                          </div>
                        </td>
                        {selectedCreators.map((c, idx) => (
                          <td key={c.id}>
                            <div className="metric-cell-value-wrap">
                              <span className="metric-cell-num">{c.views}</span>
                              <div className="metric-cell-bar-track">
                                <div
                                  className={`metric-cell-bar-fill ${
                                    idx === 0 ? 'bar-blue' : idx === 1 ? 'bar-orange' : 'bar-slate'
                                  }`}
                                  style={{ width: `${c.viewsPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 3: Tỷ lệ tương tác */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <ThunderboltOutlined style={{ color: '#EC4899' }} />
                            <span>Tỷ lệ tương tác</span>
                          </div>
                        </td>
                        {selectedCreators.map((c, idx) => (
                          <td key={c.id}>
                            <div className="metric-cell-value-wrap">
                              <span className="metric-cell-num" style={{ color: '#059669' }}>
                                {c.engagement}
                              </span>
                              <div className="metric-cell-bar-track">
                                <div
                                  className={`metric-cell-bar-fill ${
                                    idx === 0 ? 'bar-blue' : idx === 1 ? 'bar-orange' : 'bar-slate'
                                  }`}
                                  style={{ width: `${c.engagementPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 4: Lượt thích TB */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <HeartFilled style={{ color: '#EF4444' }} />
                            <span>Lượt thích TB</span>
                          </div>
                        </td>
                        {selectedCreators.map((c, idx) => (
                          <td key={c.id}>
                            <div className="metric-cell-value-wrap">
                              <span className="metric-cell-num">{c.likes}</span>
                              <div className="metric-cell-bar-track">
                                <div
                                  className={`metric-cell-bar-fill ${
                                    idx === 0 ? 'bar-blue' : idx === 1 ? 'bar-orange' : 'bar-slate'
                                  }`}
                                  style={{ width: `${c.likesPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 5: Bình luận TB */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <MessageOutlined style={{ color: '#8B5CF6' }} />
                            <span>Bình luận TB</span>
                          </div>
                        </td>
                        {selectedCreators.map((c, idx) => (
                          <td key={c.id}>
                            <div className="metric-cell-value-wrap">
                              <span className="metric-cell-num">{c.comments}</span>
                              <div className="metric-cell-bar-track">
                                <div
                                  className={`metric-cell-bar-fill ${
                                    idx === 0 ? 'bar-blue' : idx === 1 ? 'bar-orange' : 'bar-slate'
                                  }`}
                                  style={{ width: `${c.commentsPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 6: Lượt chia sẻ TB */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <ShareAltOutlined style={{ color: '#3B82F6' }} />
                            <span>Lượt chia sẻ TB</span>
                          </div>
                        </td>
                        {selectedCreators.map((c, idx) => (
                          <td key={c.id}>
                            <div className="metric-cell-value-wrap">
                              <span className="metric-cell-num">{c.shares}</span>
                              <div className="metric-cell-bar-track">
                                <div
                                  className={`metric-cell-bar-fill ${
                                    idx === 0 ? 'bar-blue' : idx === 1 ? 'bar-orange' : 'bar-slate'
                                  }`}
                                  style={{ width: `${c.sharesPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 7: Giá bài đăng dự kiến */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <span style={{ fontSize: 13 }}>💰</span>
                            <span>Giá bài đăng dự kiến</span>
                          </div>
                        </td>
                        {selectedCreators.map((c) => (
                          <td key={c.id}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>
                              {c.price}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Row 8: Giới tính khán giả */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <WomanOutlined style={{ color: '#8B5CF6' }} />
                            <span>Giới tính khán giả</span>
                          </div>
                        </td>
                        {selectedCreators.map((c, idx) => {
                          const color = idx === 0 ? '#4F46E5' : idx === 1 ? '#F59E0B' : '#64748B';
                          const bg = idx === 0 ? '#EEF2FF' : idx === 1 ? '#FEF3C7' : '#F1F5F9';
                          return (
                            <td key={c.id}>
                              <div className="demo-donut-cell">
                                <div className="demo-donut-chart">
                                  <svg width="32" height="32" viewBox="0 0 36 36">
                                    <circle
                                      cx="18"
                                      cy="18"
                                      r="15"
                                      fill="none"
                                      stroke={bg}
                                      strokeWidth="4"
                                    />
                                    <circle
                                      cx="18"
                                      cy="18"
                                      r="15"
                                      fill="none"
                                      stroke={color}
                                      strokeWidth="4"
                                      strokeDasharray={`${c.gender.female} ${100 - c.gender.female}`}
                                      strokeDashoffset="25"
                                    />
                                  </svg>
                                </div>
                                <div className="demo-donut-text">
                                  <span className="demo-text-female">Nữ: {c.gender.female}%</span>
                                  <span className="demo-text-male">Nam: {c.gender.male}%</span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 9: Mối quan tâm hàng đầu */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <AimOutlined style={{ color: '#EC4899' }} />
                            <span>Mối quan tâm</span>
                          </div>
                        </td>
                        {selectedCreators.map((c) => (
                          <td key={c.id}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {c.interests.map((interest) => (
                                <span
                                  key={interest}
                                  style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 6,
                                    padding: '2px 6px',
                                    fontSize: 10.5,
                                    color: '#475569',
                                  }}
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 10: Ghi chú đánh giá */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <EditOutlined style={{ color: '#F59E0B' }} />
                            <span>Ghi chú nội bộ</span>
                          </div>
                        </td>
                        {selectedCreators.map((c) => (
                          <td key={c.id}>
                            <div className={`card-recommendation-box ${c.noteType}`}>
                              ✓ {c.note}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Row 11: Thao tác trực tiếp */}
                      <tr>
                        <td>
                          <div className="indicator-row-name">
                            <span>Thao tác nhanh</span>
                          </div>
                        </td>
                        {selectedCreators.map((c) => (
                          <td key={c.id}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Button
                                size="small"
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={() => {
                                  setTargetCreatorForInvite(c);
                                  setInviteModalOpen(true);
                                }}
                              >
                                Mời
                              </Button>
                              <Button
                                size="small"
                                onClick={() => navigate(`/creators/${c.id}`)}
                              >
                                Hồ sơ
                              </Button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Callout */}
                <div className="matrix-bottom-banner">
                  <div className="banner-left-group">
                    <div className="banner-sparkle-icon">✦</div>
                    <div>
                      <div className="banner-title">Khuyến nghị phân bổ ngân sách AI</div>
                      <div className="banner-subtitle">
                        Dựa trên tỷ lệ tương tác và chi phí ước tính, kết hợp <strong>{selectedCreators[0]?.name}</strong> và{' '}
                        <strong>{selectedCreators[1]?.name || 'Creator khác'}</strong> sẽ tối ưu ROI cao nhất cho chiến dịch.
                      </div>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    style={{ background: '#4F46E5', borderRadius: 8 }}
                    onClick={() => {
                      message.success('Đã chuyển danh sách được chọn sang bước Tiếp cận & Gửi thư mời!');
                      navigate('/campaigns/management');
                    }}
                  >
                    Tiến hành liên hệ nhóm này →
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM CREATOR VÀO SHORTLIST
          ========================================================================= */}
      <Modal
        title="Thêm Creator vào Danh sách chọn (Shortlist)"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        width={560}
      >
        <div style={{ marginTop: 14 }}>
          {/* Target Campaign */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Thêm vào chiến dịch:
            </label>
            <Select
              value={addCampaignId}
              onChange={setAddCampaignId}
              style={{ width: '100%' }}
              options={CAMPAIGN_OPTIONS.filter((o) => o.value !== 'all')}
            />
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Chọn Creator từ kho ứng viên:
          </label>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên hoặc username..."
            style={{ marginBottom: 14, borderRadius: 8 }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
            {[
              {
                id: 'cand-1',
                name: 'Hải Đăng',
                user: 'haidang.vlog',
                followers: '740K',
                cat: 'Đời sống & Vlog',
                price: '11.000.000 ₫',
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
              },
              {
                id: 'cand-2',
                name: 'Quỳnh Nga',
                user: 'quynhnga.skin',
                followers: '590K',
                cat: 'Làm đẹp & Mỹ phẩm',
                price: '9.000.000 ₫',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
              },
              {
                id: 'cand-3',
                name: 'Bảo Long',
                user: 'baolong.fitness',
                followers: '460K',
                cat: 'Thể thao & Gym',
                price: '7.500.000 ₫',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
              },
            ].map((cand) => (
              <div
                key={cand.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  background: '#F8FAFC',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={cand.avatar}
                    alt={cand.name}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{cand.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>
                      @{cand.user} • {cand.followers} • {cand.price}
                    </div>
                  </div>
                </div>

                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#4F46E5', borderRadius: 6 }}
                  onClick={() => {
                    const campObj = CAMPAIGN_OPTIONS.find((o) => o.value === addCampaignId);
                    const newCreator: CreatorCompareItem = {
                      id: `c-added-${Date.now()}`,
                      campaignId: addCampaignId,
                      campaignName: campObj ? campObj.label.replace(/^[^\w\s]*\s*/, '') : 'Chiến dịch',
                      name: cand.name,
                      username: cand.user,
                      avatar: cand.avatar,
                      isVerified: true,
                      matchLevel: 'high',
                      matchText: 'Khớp cao (88%)',
                      platforms: ['tiktok', 'instagram'],
                      categories: [cand.cat],
                      followers: cand.followers,
                      followersPercent: 65,
                      views: '22.0K',
                      viewsPercent: 70,
                      engagement: '6.4%',
                      engagementPercent: 72,
                      likes: '2.5K',
                      likesPercent: 68,
                      comments: '190',
                      commentsPercent: 60,
                      shares: '75',
                      sharesPercent: 65,
                      price: cand.price,
                      location: 'Việt Nam (80%)',
                      gender: { female: 70, male: 30 },
                      interests: ['Làm đẹp', 'Đời sống'],
                      note: 'Mới thêm vào shortlist từ kho ứng viên.',
                      noteType: 'neutral',
                      favorite: false,
                      priority: 'med',
                      selected: false,
                      addedDate: 'Hôm nay',
                      status: 'shortlisted',
                    };
                    setCreators((prev) => [newCreator, ...prev]);
                    message.success(`Đã thêm ${cand.name} vào Shortlist chiến dịch!`);
                    setAddModalOpen(false);
                  }}
                >
                  + Thêm vào
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          MODAL: GỬI LỜI MỜI HỢP TÁC (INVITE)
          ========================================================================= */}
      <Modal
        title={`Gửi lời mời hợp tác tới ${targetCreatorForInvite?.name}`}
        open={inviteModalOpen}
        onCancel={() => setInviteModalOpen(false)}
        footer={null}
        width={560}
      >
        {targetCreatorForInvite && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: '#F8FAFC',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                marginBottom: 16,
              }}
            >
              <img
                src={targetCreatorForInvite.avatar}
                alt={targetCreatorForInvite.name}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{targetCreatorForInvite.name}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Chiến dịch:{' '}
                  <strong style={{ color: '#4F46E5' }}>{targetCreatorForInvite.campaignName}</strong>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Mức thù lao đề xuất (VND):
              </label>
              <Input defaultValue={targetCreatorForInvite.price} style={{ borderRadius: 8 }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Thông điệp gửi kèm:
              </label>
              <Input.TextArea
                rows={4}
                defaultValue={`Chào ${targetCreatorForInvite.name},\nThương hiệu chúng tôi rất ấn tượng với nội dung của bạn và muốn mời bạn tham gia chiến dịch "${targetCreatorForInvite.campaignName}". Vui lòng phản hồi nếu bạn quan tâm hợp tác nhé!`}
                style={{ borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setInviteModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                style={{ background: '#4F46E5', borderRadius: 8 }}
                onClick={() => {
                  message.success(`Đã gửi lời mời hợp tác tới ${targetCreatorForInvite.name}! Trạng thái chuyển sang "Đã liên hệ".`);
                  setCreators((prev) =>
                    prev.map((c) =>
                      c.id === targetCreatorForInvite.id ? { ...c, status: 'contacted' } : c
                    )
                  );
                  setInviteModalOpen(false);
                }}
              >
                Gửi lời mời chính thức
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
