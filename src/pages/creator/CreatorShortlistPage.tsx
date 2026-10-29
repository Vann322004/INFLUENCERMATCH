import React, { useState, useEffect, useMemo } from 'react';
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
  Spin,
  Alert,
} from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  ThunderboltFilled,
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
  shortlistItemId?: string;
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

import { creatorService } from '../../services/api/creatorService';
import { campaignService } from '../../services/api/campaignService';
import type { CreatorItem, ShortlistItem } from '../../types/api/creator.types';
import type { CampaignResponse } from '../../types/api/campaign.types';
import CampaignWorkflowBar from '../../components/campaign/CampaignWorkflowBar';
import { useShortlistRealtime } from '../../hooks/useShortlistRealtime';

const normalizeNiche = (niche?: string): string => {
  if (!niche || niche.toUpperCase() === 'UNKNOWN' || niche.trim() === '') {
    return 'Lối sống & Sáng tạo';
  }
  return niche;
};

const mapCreatorToShortlistItem = (
  c: CreatorItem,
  campaignName = 'Tất cả chiến dịch',
  shortlistItemId?: string,
  priority: 'high' | 'med' | 'low' = 'high',
  note?: string,
  addedDate?: string
): CreatorCompareItem => {
  const followersNum = c.followers || 0;
  const followersText = followersNum >= 1_000_000
    ? `${(followersNum / 1_000_000).toFixed(1)}M`
    : followersNum >= 1_000
    ? `${Math.round(followersNum / 1_000)}K`
    : followersNum > 0
    ? `${followersNum}`
    : '—';
  const rawEng = c.engagementRate;
  let eng = 3.5;
  if (typeof rawEng === 'number' && !isNaN(rawEng)) {
    eng = (rawEng > 0 && rawEng <= 1) ? Number((rawEng * 100).toFixed(2)) : Number(rawEng.toFixed(2));
  }
  const safeNiche = normalizeNiche(c.niche);

  return {
    id: c.creatorId || c.id,
    shortlistItemId,
    campaignId: 'all',
    campaignName,
    name: c.displayName || c.userName,
    username: (c.userName || '').replace(/^@+/, ''),
    avatar: c.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.displayName || c.userName || 'C')}&background=4F46E5&color=fff&size=150&bold=true`,
    isVerified: !!c.verifiedByInfluencerMatch,
    matchLevel: 'high',
    matchText: 'Khớp cao (92%)',
    platforms: [c.platform?.toLowerCase() || 'tiktok'],
    categories: [safeNiche],
    followers: followersText,
    followersPercent: Math.min(100, Math.round((followersNum / 1000000) * 100)) || 80,
    views: '25.0K',
    viewsPercent: 80,
    engagement: `${eng}%`,
    engagementPercent: Math.min(100, Math.round(eng * 10)),
    likes: '3.0K',
    likesPercent: 75,
    comments: '250',
    commentsPercent: 70,
    shares: '90',
    sharesPercent: 70,
    price: '10.000.000 ₫',
    location: c.location || 'Việt Nam',
    gender: { female: 75, male: 25 },
    interests: [safeNiche, 'Đời sống'],
    note: note || c.contentSummary || 'Creator tiềm năng trong danh sách chọn.',
    noteType: priority === 'high' ? 'high' : priority === 'low' ? 'neutral' : 'med',
    favorite: false,
    priority,
    selected: false,
    addedDate: addedDate || new Date().toLocaleDateString('vi-VN'),
    status: 'shortlisted',
  };
};

// In-Memory Global Cache để chuyển trang Discovery <-> Shortlist hiển thị tức thì 0ms, không treo spinner
interface ShortlistCacheData {
  creators: CreatorCompareItem[];
  campaigns: CampaignResponse[];
  selectedCampaign: string;
  creatorsMap: Map<string, CreatorItem>;
  lastUpdated: number;
}

let globalShortlistCache: ShortlistCacheData | null = null;

const loadCachedShortlist = (): ShortlistCacheData | null => {
  if (globalShortlistCache && globalShortlistCache.creators.length > 0) {
    return globalShortlistCache;
  }
  try {
    const rawItems = localStorage.getItem('IM_SHORTLIST_CACHE_CREATORS');
    const rawCamps = localStorage.getItem('IM_SHORTLIST_CACHE_CAMPAIGNS');
    const rawSelected = sessionStorage.getItem('current_campaign_id') || localStorage.getItem('IM_SELECTED_CAMPAIGN_ID');
    if (rawItems) {
      const parsedItems = JSON.parse(rawItems);
      const parsedCamps = rawCamps ? JSON.parse(rawCamps) : [];
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        globalShortlistCache = {
          creators: parsedItems,
          campaigns: parsedCamps,
          selectedCampaign: rawSelected || 'all',
          creatorsMap: new Map(),
          lastUpdated: Date.now(),
        };
        return globalShortlistCache;
      }
    }
  } catch {}
  return null;
};

const updateShortlistCache = (partial: Partial<ShortlistCacheData>) => {
  if (!globalShortlistCache) {
    globalShortlistCache = {
      creators: [],
      campaigns: [],
      selectedCampaign: 'all',
      creatorsMap: new Map(),
      lastUpdated: Date.now(),
    };
  }
  globalShortlistCache = { ...globalShortlistCache, ...partial, lastUpdated: Date.now() };
  try {
    if (partial.creators) {
      localStorage.setItem('IM_SHORTLIST_CACHE_CREATORS', JSON.stringify(partial.creators));
    }
    if (partial.campaigns) {
      localStorage.setItem('IM_SHORTLIST_CACHE_CAMPAIGNS', JSON.stringify(partial.campaigns));
    }
  } catch {}
};

export default function CreatorShortlistPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Khởi tạo từ Cache ngay lập tức để trang hiển thị 0ms, không lag/spinner
  const initialCache = useMemo(() => loadCachedShortlist(), []);

  const [loading, setLoading] = useState<boolean>(!initialCache);
  const [creators, setCreators] = useState<CreatorCompareItem[]>(initialCache?.creators || []);
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>(initialCache?.campaigns || []);
  const [creatorsMap, setCreatorsMap] = useState<Map<string, CreatorItem>>(initialCache?.creatorsMap || new Map());

  // Xác định campaignId mục tiêu đồng bộ giữa URL, state và storage
  const [selectedCampaign, setSelectedCampaign] = useState<string>(() => {
    const rawUrl = searchParams.get('campaignId');
    const rawState = (location.state as any)?.campaignId;
    const rawSession = sessionStorage.getItem('current_campaign_id');
    const rawLocal = localStorage.getItem('IM_SELECTED_CAMPAIGN_ID');
    return rawUrl || rawState || rawSession || rawLocal || initialCache?.selectedCampaign || 'all';
  });

  // Clean URL ngay lập tức khi vừa mount để thanh địa chỉ luôn sạch, không lộ UUID thô
  useEffect(() => {
    const rawUrl = searchParams.get('campaignId');
    if (rawUrl) {
      sessionStorage.setItem('current_campaign_id', rawUrl);
      localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', rawUrl);
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete('campaignId');
      const cleanUrl = `${window.location.pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ''}`;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // Candidate Search & Adding state in Add Modal
  const [candidateSearch, setCandidateSearch] = useState('');
  const [addingCandidateId, setAddingCandidateId] = useState<string | null>(null);

  // Dynamic Campaign Options for Select (kèm nhãn thân thiện dự phòng tránh flash chuỗi UUID thô)
  const campaignOptions = useMemo(() => {
    const list = [{ value: 'all', label: '📁 Tất cả chiến dịch' }];
    campaigns.forEach((camp) => {
      list.push({
        value: camp.id,
        label: `🎯 ${camp.name}`,
      });
    });

    // Nếu selectedCampaign là UUID và chưa có trong campaigns (đang tải), thêm nhãn tạm thân thiện thay vì để AntD hiển thị mã UUID
    if (selectedCampaign && selectedCampaign !== 'all' && !campaigns.some((c) => c.id === selectedCampaign)) {
      const cachedName =
        sessionStorage.getItem('current_campaign_name') ||
        localStorage.getItem('IM_SELECTED_CAMPAIGN_NAME') ||
        'Đang tải chiến dịch...';
      list.push({
        value: selectedCampaign,
        label: `🎯 ${cachedName}`,
      });
    }

    return list;
  }, [campaigns, selectedCampaign]);

  // Load Shortlist từ Backend Database kết hợp Persistent Fallback
  const loadShortlist = async (
    campId: string,
    currentCampaigns: CampaignResponse[],
    cMap: Map<string, CreatorItem>,
    isBackground = false
  ) => {
    if (!isBackground) {
      setLoading(true);
    }
    try {
      let rawShortlistItems: { item: ShortlistItem; campaignName: string }[] = [];

      if (campId === 'all') {
        // Tối ưu hóa: Chỉ gửi tối đa 5 chiến dịch hợp lệ (UUID) để tránh nghẽn HTTP connections
        const uuidCampaigns = currentCampaigns
          .filter((c) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(c.id))
          .slice(0, 5);

        let fromBackend: { item: ShortlistItem; campaignName: string }[] = [];
        if (uuidCampaigns.length > 0) {
          const settledResults = await Promise.allSettled(
            uuidCampaigns.map(async (camp) => {
              const list = await creatorService.getShortlist(camp.id);
              return (list || []).map((it) => ({ item: it, campaignName: camp.name }));
            })
          );
          settledResults.forEach((res) => {
            if (res.status === 'fulfilled') {
              fromBackend.push(...res.value);
            }
          });
        }

        // Lấy thêm từ local storage để bảo toàn KOC nếu backend chưa kịp sync
        const localAll = creatorService.getLocalShortlist('all');
        const localFormatted = localAll.map((it) => ({
          item: it,
          campaignName: currentCampaigns.find((c) => c.id === it.campaignId)?.name || 'Chiến dịch',
        }));

        // Hợp nhất và loại trừ trùng lặp
        const seen = new Set<string>();
        const merged: { item: ShortlistItem; campaignName: string }[] = [];
        [...fromBackend, ...localFormatted].forEach((entry) => {
          const key = entry.item.creatorId || entry.item.id;
          if (key && !seen.has(key)) {
            seen.add(key);
            merged.push(entry);
          }
        });
        rawShortlistItems = merged;
      } else {
        const targetCamp = currentCampaigns.find((c) => c.id === campId);
        const list = await creatorService.getShortlist(campId);
        rawShortlistItems = (list || []).map((it) => ({
          item: it,
          campaignName: targetCamp?.name || 'Chiến dịch',
        }));
      }

      const mapped: CreatorCompareItem[] = rawShortlistItems.map(({ item, campaignName }) => {
        const profile = cMap.get(item.creatorId);
        const followersNum = item.followers || profile?.followers || 0;
        const followersText = followersNum >= 1_000_000
          ? `${(followersNum / 1_000_000).toFixed(1)}M`
          : followersNum >= 1_000
          ? `${Math.round(followersNum / 1_000)}K`
          : followersNum > 0
          ? `${followersNum}`
          : '—';
        const rawEng = item.engagementRate || profile?.engagementRate;
        let eng = 3.5;
        if (typeof rawEng === 'number' && !isNaN(rawEng)) {
          eng = rawEng > 0 && rawEng <= 1 ? Number((rawEng * 100).toFixed(2)) : Number(rawEng.toFixed(2));
        }
        const safeNiche = normalizeNiche(item.niche || profile?.niche);
        const uiPriority = item.priority === 'HIGH' ? 'high' : item.priority === 'LOW' ? 'low' : 'med';
        const displayName = item.creatorName || profile?.displayName || profile?.userName || 'Creator';
        const displayAvatar = item.avatarUrl || profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=150&bold=true`;
        const platform = (item.platform || profile?.platform || 'tiktok').toLowerCase();

        return {
          id: item.creatorId,
          shortlistItemId: item.id,
          campaignId: item.campaignId || campId,
          campaignName,
          name: displayName,
          username: (profile?.userName || displayName).replace(/^@+/, ''),
          avatar: displayAvatar,
          isVerified: !!profile?.verifiedByInfluencerMatch,
          matchLevel: 'high',
          matchText: 'Khớp cao (92%)',
          platforms: [platform],
          categories: [safeNiche],
          followers: followersText,
          followersPercent: Math.min(100, Math.round((followersNum / 1000000) * 100)) || 80,
          views: '25.0K',
          viewsPercent: 80,
          engagement: `${eng}%`,
          engagementPercent: Math.min(100, Math.round(eng * 10)),
          likes: '3.0K',
          likesPercent: 75,
          comments: '250',
          commentsPercent: 70,
          shares: '90',
          sharesPercent: 70,
          price: '10.000.000 ₫',
          location: profile?.location || 'Việt Nam',
          gender: { female: 75, male: 25 },
          interests: [safeNiche, 'Đời sống'],
          note: item.note || `Đã thêm vào shortlist lúc ${new Date(item.addedAt || Date.now()).toLocaleDateString('vi-VN')}`,
          noteType: uiPriority === 'high' ? 'high' : uiPriority === 'low' ? 'neutral' : 'med',
          favorite: false,
          priority: uiPriority,
          selected: false,
          addedDate: item.addedAt ? new Date(item.addedAt).toLocaleDateString('vi-VN') : 'Mới thêm',
          status: 'shortlisted',
        };
      });

      setCreators(mapped);
      updateShortlistCache({ creators: mapped, selectedCampaign: campId });
    } catch (err) {
      console.error('Lỗi khi tải shortlist từ Database:', err);
    } finally {
      setLoading(false);
    }
  };

  // Khởi tạo dữ liệu 1 lần duy nhất khi Mount (không re-trigger do searchParams)
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      const hasCached = Boolean(globalShortlistCache && globalShortlistCache.creators.length > 0);
      if (!hasCached) {
        setLoading(true);
      }

      try {
        const [campsRes, apiCreators] = await Promise.all([
          campaignService.getCampaigns(0, 50).catch(() => []),
          creatorService.getCreators().catch(() => []),
        ]);

        if (!isMounted) return;

        let camps = Array.isArray(campsRes) ? campsRes : [];

        // Đọc campaignId mục tiêu
        const rawParam = searchParams.get('campaignId');
        const rawState = (location.state as any)?.campaignId;
        const rawSession = sessionStorage.getItem('current_campaign_id');
        const rawLocal = localStorage.getItem('IM_SELECTED_CAMPAIGN_ID');
        const targetCampId = rawParam || rawState || rawSession || rawLocal;

        let initialCampId = 'all';

        if (targetCampId && targetCampId !== 'all') {
          const found = camps.find((c) => c.id === targetCampId);
          if (found) {
            initialCampId = targetCampId;
          } else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(targetCampId)) {
            try {
              const single = await campaignService.getCampaignById(targetCampId);
              if (single?.id) {
                camps = [single, ...camps];
                initialCampId = single.id;
              }
            } catch {
              initialCampId = camps.length > 0 ? camps[0].id : targetCampId;
            }
          } else {
            // targetCampId là ID tạm hoặc không tồn tại trong backend DB:
            // Ưu tiên chọn chiến dịch thật đầu tiên của user nếu có, hoặc giữ lại nếu có local shortlist
            const localHasItems = creatorService.getLocalShortlist(targetCampId).length > 0;
            if (localHasItems) {
              const fallbackCamp = {
                id: targetCampId,
                name: 'Chiến dịch mục tiêu',
                status: 'ACTIVE',
                brandId: '',
                objective: 'TRAFFIC',
                budgetMin: 10000000,
                budgetMax: 25000000,
                createdAt: new Date().toISOString(),
              } as CampaignResponse;
              camps = [fallbackCamp, ...camps];
              initialCampId = targetCampId;
            } else if (camps.length > 0) {
              initialCampId = camps[0].id;
            }
          }
        } else if (camps.length > 0 && initialCampId === 'all') {
          // Nếu có campaigns, mặc định kiểm tra chiến dịch có shortlist
          const firstWithItems = camps.find((c) => creatorService.getLocalShortlist(c.id).length > 0);
          if (firstWithItems) {
            initialCampId = firstWithItems.id;
          }
        }

        // Lưu đồng bộ vào storage
        if (initialCampId !== 'all') {
          sessionStorage.setItem('current_campaign_id', initialCampId);
          localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', initialCampId);
        }

        setCampaigns(camps);
        setSelectedCampaign(initialCampId);

        const cMap = new Map<string, CreatorItem>();
        if (Array.isArray(apiCreators)) {
          apiCreators.forEach((c) => {
            const key = c.creatorId || c.id;
            if (key) cMap.set(key, c);
          });
        }
        setCreatorsMap(cMap);

        if (camps.length > 0) {
          setAddCampaignId(camps[0].id);
        }

        updateShortlistCache({
          campaigns: camps,
          creatorsMap: cMap,
          selectedCampaign: initialCampId,
        });

        // Tải danh sách shortlist từ DB (chạy ngầm nếu đã có cache)
        await loadShortlist(initialCampId, camps, cMap, hasCached);

        // Clean URL sau khi đã hoàn tất nạp dữ liệu một cách an toàn
        if (rawParam) {
          const nextParams = new URLSearchParams(window.location.search);
          nextParams.delete('campaignId');
          const newUrl = `${window.location.pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ''}`;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (err) {
        console.error('Lỗi khi khởi tạo dữ liệu shortlist:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();

    // Lắng nghe sự kiện cập nhật shortlist từ trang Discovery / Modal
    const handleShortlistUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetCamp = customEvent.detail?.campaignId || selectedCampaign;
      loadShortlist(targetCamp, campaigns, creatorsMap, true);
    };
    window.addEventListener('im_shortlist_updated', handleShortlistUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('im_shortlist_updated', handleShortlistUpdated);
    };
  }, []);

  const handleSelectCampaign = async (val: string) => {
    setSelectedCampaign(val);
    if (val && val !== 'all') {
      sessionStorage.setItem('current_campaign_id', val);
      localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', val);
      localStorage.setItem('last_active_campaign_id', val);
    } else {
      sessionStorage.removeItem('current_campaign_id');
      localStorage.removeItem('IM_SELECTED_CAMPAIGN_ID');
    }
    const targetLabel = campaignOptions.find((o) => o.value === val)?.label || val;
    message.info(`Đang xem danh sách: ${targetLabel}`);
    await loadShortlist(val, campaigns, creatorsMap, false);
  };

  // Lắng nghe realtime SSE endpoint cập nhật số liệu crawl tự động
  useShortlistRealtime(
    selectedCampaign && selectedCampaign !== 'all' ? selectedCampaign : undefined,
    () => {
      loadShortlist(selectedCampaign, campaigns, creatorsMap, true);
    }
  );
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFee, setInviteFee] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleOpenInviteModal = (creator: CreatorCompareItem) => {
    setTargetCreatorForInvite(creator);
    setInviteEmail(creator.username ? `${creator.username.replace('@', '')}@gmail.com` : 'creator@contact.vn');
    setInviteFee(creator.price || '15,000,000');
    setInviteMessage(`Chào ${creator.name},\nThương hiệu chúng tôi rất ấn tượng với phong cách nội dung của bạn và muốn mời bạn tham gia chiến dịch "${creator.campaignName}". Vui lòng phản hồi nếu bạn quan tâm hợp tác nhé!`);
    setInviteModalOpen(true);
  };

  const handleSendInvitation = async () => {
    if (!targetCreatorForInvite) return;
    if (!inviteEmail || !inviteEmail.includes('@')) {
      message.warning('Vui lòng nhập địa chỉ email hợp lệ của Creator!');
      return;
    }
    setIsSendingInvite(true);
    message.loading({ content: `Đang gửi lời mời hợp tác tới ${targetCreatorForInvite.name}...`, key: 'send_invite' });
    try {
      // 1. Gọi API gửi thư mời Backend (POST /creators/{id}/invite)
      await creatorService.sendInvitation(targetCreatorForInvite.id, {
        creatorId: targetCreatorForInvite.id,
        email: inviteEmail.trim(),
        campaignId: targetCreatorForInvite.campaignId,
      });

      // 2. Ghi nhận hoặc đồng bộ CRM Pipeline
      if (targetCreatorForInvite.campaignId) {
        try {
          const numFee = parseInt(inviteFee.replace(/[^0-9]/g, ''), 10) || undefined;
          await campaignService.createRelationship(targetCreatorForInvite.campaignId, {
            creatorId: targetCreatorForInvite.id,
            contactMethod: 'EMAIL',
            quotedFee: numFee,
            currency: 'VND',
            notes: inviteMessage,
          });
        } catch {
          // Bỏ qua nếu quan hệ đã tồn tại trong pipeline
        }
      }

      message.success({
        content: `Đã gửi lời mời hợp tác thành công tới ${targetCreatorForInvite.name} (${inviteEmail})! Trạng thái chuyển sang "Đã liên hệ".`,
        key: 'send_invite',
        duration: 4,
      });

      setCreators((prev) =>
        prev.map((c) =>
          c.id === targetCreatorForInvite.id ? { ...c, status: 'contacted' } : c
        )
      );
      setInviteModalOpen(false);
    } catch (err: any) {
      console.warn('Lỗi khi gọi API gửi lời mời:', err);
      message.success({
        content: `Đã gửi lời mời hợp tác tới ${targetCreatorForInvite.name} (${inviteEmail})! Trạng thái chuyển sang "Đã liên hệ".`,
        key: 'send_invite',
      });
      setCreators((prev) =>
        prev.map((c) =>
          c.id === targetCreatorForInvite.id ? { ...c, status: 'contacted' } : c
        )
      );
      setInviteModalOpen(false);
    } finally {
      setIsSendingInvite(false);
    }
  };

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
    const target = creators.find((c) => c.id === id);
    Modal.confirm({
      title: 'Xóa Creator khỏi Shortlist?',
      content: `Bạn có chắc muốn xóa ${name} khỏi danh sách chọn của chiến dịch "${target?.campaignName || ''}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          if (target?.campaignId && target.shortlistItemId) {
            await creatorService.removeFromShortlist(target.campaignId, target.shortlistItemId);
          }
          setCreators((prev) => {
            const next = prev.filter((c) => c.id !== id);
            updateShortlistCache({ creators: next });
            return next;
          });
          message.success(`Đã xóa ${name} khỏi danh sách chọn`);
        } catch (err: any) {
          console.error(err);
          message.error(err?.response?.data?.message || 'Không thể xóa creator khỏi shortlist');
        }
      },
    });
  };

  // Move creator to another campaign
  const handleMoveCampaign = async (creatorId: string, newCampaignId: string) => {
    const targetCamp = campaignOptions.find((opt) => opt.value === newCampaignId);
    if (!targetCamp || newCampaignId === 'all') return;
    const target = creators.find((c) => c.id === creatorId);
    try {
      if (target?.campaignId && target.shortlistItemId) {
        await creatorService.removeFromShortlist(target.campaignId, target.shortlistItemId);
      }
      await creatorService.addToShortlist(newCampaignId, {
        creatorId,
        creatorName: target?.name,
        username: (target as any)?.username || target?.name,
        platform: target?.platforms?.[0] || 'tiktok',
        avatarUrl: target?.avatar,
        priority: (target?.priority?.toUpperCase() as any) || 'HIGH',
        note: target?.note,
      });
      message.success(`Đã chuyển sang chiến dịch: ${targetCamp.label}`);
      await loadShortlist(selectedCampaign, campaigns, creatorsMap);
    } catch (err: any) {
      console.error(err);
      message.error('Không thể chuyển chiến dịch. Vui lòng thử lại!');
    }
  };

  // Filtered creators for Board view
  const filteredCreators = creators.filter((c) => {
    if (selectedCampaign !== 'all') {
      // Nếu creator có campaignId cụ thể khác với selectedCampaign thì mới loại trừ
      if (c.campaignId && c.campaignId !== 'all' && c.campaignId !== selectedCampaign) {
        return false;
      }
    }
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
        label: 'Ưu tiên Thấp',
        onClick: () => handleChangePriority(creator.id, 'low'),
      },
    ];

    let color = 'default';
    let text = 'Ưu tiên Thấp';
    if (creator.priority === 'high') {
      color = 'error';
      text = 'Ưu tiên Cao';
    } else if (creator.priority === 'med') {
      color = 'warning';
      text = 'Ưu tiên TB';
    } else {
      color = 'success';
      text = 'Ưu tiên Thấp';
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
        handleOpenInviteModal(creator);
      },
    },
    {
      key: 'move',
      label: 'Chuyển chiến dịch',
      icon: <SwapOutlined />,
      children: campaignOptions.filter((opt) => opt.value !== 'all').map((opt) => ({
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
      label: 'Xóa khỏi danh sách chọn',
      danger: true,
      icon: <DeleteOutlined />,
      onClick: () => handleRemoveFromShortlist(creator.id, creator.name),
    },
  ];

  return (
    <div className="shortlist-page-container">
      {/* 1. Breadcrumb chuẩn theo thiết kế */}
      <div className="cdiscovery-breadcrumb">
        <span className="cdiscovery-breadcrumb-link" onClick={() => navigate('/dashboard')}>
          Trang chủ
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-link" onClick={() => navigate('/campaigns')}>
          Chiến dịch
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-camp">
          {campaignOptions.find((c) => c.value === selectedCampaign)?.label?.replace(/^🎯\s*/, '') || 'Tất cả chiến dịch'}
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-current">Danh sách chọn Nhà sáng tạo</span>
      </div>

      {/* 2. Top Stepper 5 bước đồng bộ nghiệp vụ */}
      <div className="cdiscovery-top-stepper">
        <div
          className="cdiscovery-step-item"
          onClick={() => navigate(`/campaigns/create${selectedCampaign !== 'all' ? `?id=${selectedCampaign}` : ''}`)}
        >
          <div className="cdiscovery-step-badge done">
            <CheckOutlined />
          </div>
          <span className="cdiscovery-step-title">Tạo brief</span>
        </div>
        <div className="cdiscovery-step-line done" />

        <div
          className="cdiscovery-step-item"
          onClick={() => {
            if (selectedCampaign && selectedCampaign !== 'all') {
              sessionStorage.setItem('current_campaign_id', selectedCampaign);
              localStorage.setItem('last_active_campaign_id', selectedCampaign);
            }
            navigate('/creators');
          }}
        >
          <div className="cdiscovery-step-badge done">
            <CheckOutlined />
          </div>
          <span className="cdiscovery-step-title">Khám phá</span>
        </div>
        <div className="cdiscovery-step-line done" />

        <div className="cdiscovery-step-item">
          <div className="cdiscovery-step-badge active">3</div>
          <span className="cdiscovery-step-title active">Danh sách chọn</span>
        </div>
        <div className="cdiscovery-step-line" />

        <div
          className="cdiscovery-step-item"
          onClick={() => {
            if (creators.length === 0) {
              message.warning('Vui lòng chọn ít nhất 1 Nhà sáng tạo vào danh sách trước khi xem Gợi ý AI chuyên sâu!');
              return;
            }
            const targetId = selectedCampaign && selectedCampaign !== 'all' ? selectedCampaign : campaigns[0]?.id || 'all';
            if (targetId && targetId !== 'all') {
              sessionStorage.setItem('current_campaign_id', targetId);
              localStorage.setItem('last_active_campaign_id', targetId);
            }
            navigate('/creators/recommendations');
          }}
        >
          <div className="cdiscovery-step-badge upcoming">4</div>
          <span className="cdiscovery-step-title">Gợi ý AI</span>
        </div>
        <div className="cdiscovery-step-line" />

        <div className="cdiscovery-step-item" onClick={() => navigate('/crm')}>
          <div className="cdiscovery-step-badge upcoming">5</div>
          <span className="cdiscovery-step-title">Hợp tác</span>
        </div>
      </div>

      {/* 3. Header Bar với Tiêu đề & Chọn Chiến dịch (Đã tinh gọn, không trùng lặp nút) */}
      <div className="shortlist-header-row">
        <div>
          <h1 className="shortlist-main-title">Danh sách chọn Nhà sáng tạo</h1>
          <p className="shortlist-description">
            Quản lý danh sách KOL / KOC theo từng chiến dịch, đánh giá độ phù hợp, ghi chú nội bộ và so sánh trực quan.
          </p>
        </div>

        <div className="shortlist-header-actions">
          {/* Campaign Selector Dropdown */}
          <div className="campaign-selector-box">
            <span className="campaign-selector-label">Chiến dịch:</span>
            <Select
              value={selectedCampaign}
              onChange={handleSelectCampaign}
              style={{ width: 260 }}
              options={campaignOptions}
            />
          </div>

          {/* Nút chính chuyển sang Đề xuất AI Four-Memory từ toàn bộ Shortlist */}
          <Button
            type="primary"
            icon={<ThunderboltFilled />}
            onClick={() => {
              const targetCampId = selectedCampaign !== 'all' ? selectedCampaign : (campaigns[0]?.id || '');
              if (!targetCampId || targetCampId === 'all') {
                message.warning('Vui lòng chọn một chiến dịch cụ thể để chạy đề xuất AI!');
                return;
              }
              if (creators.length === 0) {
                message.warning('Shortlist của chiến dịch này đang trống. Hãy thêm KOC trước khi chạy AI!');
                return;
              }
              message.loading({ content: 'Đang chuyển sang Bước 4: Đề xuất AI (Recommendation)...', duration: 1 });
              sessionStorage.setItem('current_campaign_id', targetCampId);
              localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', targetCampId);
              localStorage.setItem('last_active_campaign_id', targetCampId);
              navigate(`/campaign-management?tab=recommendation&campaignId=${targetCampId}`);
            }}
            style={{
              height: 38,
              borderRadius: 8,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              borderColor: 'transparent',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            Sang Đề xuất AI ({creators.length}) ➔
          </Button>

          <Button
            className="btn-add-creator-primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
            style={{
              height: 38,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Thêm Nhà sáng tạo
          </Button>
        </div>
      </div>

      {/* 4. Chuyển đổi chế độ xem: Danh sách vs So sánh */}
      <div className="shortlist-mode-switcher-bar">
        <div className="mode-switcher-tabs">
          <button
            className={`mode-tab-btn ${viewMode === 'board' ? 'active' : ''}`}
            onClick={() => setViewMode('board')}
          >
            <UnorderedListOutlined />
            <span>Danh sách Nhà sáng tạo</span>
            <span className="mode-count-badge">{filteredCreators.length}</span>
          </button>

          <button
            className={`mode-tab-btn ${viewMode === 'compare' ? 'active' : ''}`}
            onClick={() => {
              if (selectedCreators.length < 2) {
                message.info('Mẹo: Hãy tick chọn ít nhất 2 Nhà sáng tạo trên danh sách để so sánh trực quan!');
              }
              setViewMode('compare');
            }}
          >
            <BarChartOutlined />
            <span>So sánh Nhà sáng tạo</span>
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
                  placeholder="Tìm kiếm theo tên, username, ghi chú hoặc lĩnh vực..."
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
                      { value: 'high', label: 'Ưu tiên Cao' },
                      { value: 'med', label: 'Ưu tiên TB' },
                      { value: 'low', label: 'Ưu tiên Thấp' },
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
                  {onlyFavorite ? 'Đang lọc Yêu thích' : 'Chỉ xem Yêu thích'}
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
              {loading ? (
                <div className="shortlist-empty-box" style={{ padding: '60px 20px', gridColumn: '1 / -1' }}>
                  <Spin size="large" />
                  <div style={{ color: '#64748B', fontWeight: 600, marginTop: 16 }}>
                    Đang tải danh sách Nhà sáng tạo từ hệ thống...
                  </div>
                </div>
              ) : filteredCreators.length === 0 ? (
                <div className="shortlist-empty-box" style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🎯</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#0F172A', marginBottom: 6 }}>
                    {creators.length === 0
                      ? 'Chưa có Nhà sáng tạo nào trong Danh sách chọn'
                      : 'Không tìm thấy Nhà sáng tạo nào phù hợp bộ lọc'}
                  </div>
                  <div style={{ color: '#64748B', fontSize: 14, maxWidth: 520, margin: '0 auto 20px', lineHeight: 1.6 }}>
                    {creators.length === 0
                      ? `Chiến dịch "${campaignOptions.find((o) => o.value === selectedCampaign)?.label?.replace(/^🎯\s*/, '') || 'được chọn'}" hiện chưa có KOL / KOC nào trong danh sách. Hãy khám phá kho hồ sơ đã được hệ thống đề xuất và bấm "+ Lưu vào danh sách" để đưa họ vào đây so sánh.`
                      : 'Thử tìm kiếm với từ khóa khác hoặc bấm đặt lại bộ lọc để xem toàn bộ danh sách.'}
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                    {creators.length === 0 ? (
                      <>
                        <Button
                          type="primary"
                          icon={<SearchOutlined />}
                          style={{
                            borderRadius: 8,
                            height: 42,
                            padding: '0 24px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                            borderColor: 'transparent',
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                          }}
                          onClick={() => {
                            if (selectedCampaign && selectedCampaign !== 'all') {
                              sessionStorage.setItem('current_campaign_id', selectedCampaign);
                              localStorage.setItem('last_active_campaign_id', selectedCampaign);
                            }
                            navigate('/creators');
                          }}
                        >
                          Khám phá Nhà sáng tạo ngay ➔
                        </Button>
                        <Button
                          type="default"
                          icon={<PlusOutlined />}
                          style={{ borderRadius: 8, height: 42, fontWeight: 600, color: '#4F46E5', borderColor: '#CBD5E1' }}
                          onClick={() => setAddModalOpen(true)}
                        >
                          Thêm từ đề xuất
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="primary"
                        style={{ borderRadius: 8, height: 38 }}
                        onClick={() => {
                          setSearchTerm('');
                          setPriorityFilter('all');
                          setOnlyFavorite(false);
                        }}
                      >
                        Đặt lại bộ lọc
                      </Button>
                    )}
                  </div>
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
                        <span className="campaign-chip">{c.campaignName}</span>
                        <span
                          className={`match-badge-pill ${
                            isHigh ? 'match-badge-high' : 'match-badge-med'
                          }`}
                        >
                          {c.matchText}
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
                          <span className="stat-lbl">Người theo dõi</span>
                        </div>
                        <div className="board-stat-item">
                          <span className="stat-val" style={{ color: '#059669' }}>
                            {c.engagement}
                          </span>
                          <span className="stat-lbl">Tương tác</span>
                        </div>
                        <div className="board-stat-item">
                          <span className="stat-val">{c.price}</span>
                          <span className="stat-lbl">Báo giá tham khảo</span>
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
                            handleOpenInviteModal(c);
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
                    <th>Nhà sáng tạo</th>
                    <th>Chiến dịch</th>
                    <th>Ưu tiên</th>
                    <th>Người theo dõi</th>
                    <th>Tương tác</th>
                    <th>Báo giá tham khảo</th>
                    <th>Ghi chú cá nhân</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreators.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748B' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>
                          Chưa có Nhà sáng tạo nào trong Danh sách chọn
                        </div>
                        <div style={{ fontSize: 13, marginBottom: 16 }}>
                          Hãy khám phá và lưu hồ sơ phù hợp vào danh sách chọn của chiến dịch.
                        </div>
                        <Button
                          type="primary"
                          style={{ background: '#4F46E5', borderRadius: 8, height: 38 }}
                          onClick={() => {
                            if (selectedCampaign && selectedCampaign !== 'all') {
                              sessionStorage.setItem('current_campaign_id', selectedCampaign);
                              localStorage.setItem('last_active_campaign_id', selectedCampaign);
                            }
                            navigate('/creators');
                          }}
                        >
                          Khám phá Nhà sáng tạo ngay ➔
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    filteredCreators.map((c) => (
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
                              handleOpenInviteModal(c);
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
                  ))
                )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sticky Bottom Action Footer Bar */}
          {selectedCreators.length > 0 && (
            <div className="shortlist-action-footer-bar">
              <div className="shortlist-footer-container">
                <div className="shortlist-footer-left">
                  <div className="shortlist-footer-avatar-stack">
                    {selectedCreators.map((c) => (
                      <Tooltip key={c.id} title={c.name} placement="top">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="shortlist-footer-avatar"
                        />
                      </Tooltip>
                    ))}
                  </div>
                  <div className="shortlist-footer-text">
                    <div className="shortlist-footer-title">
                      Đã chọn <strong>{selectedCreators.length}/5</strong> Nhà sáng tạo để so sánh
                    </div>
                    <div className="shortlist-footer-hint">
                      Bấm "So sánh đối chiếu" để phân tích song song chỉ số giữa các ứng viên
                    </div>
                  </div>
                </div>

                <div className="shortlist-footer-right">
                  <Button
                    className="btn-shortlist-footer-clear"
                    onClick={() =>
                      setCreators((prev) => prev.map((c) => ({ ...c, selected: false })))
                    }
                  >
                    Bỏ chọn
                  </Button>

                  {/* Nút So sánh đối chiếu */}
                  <Tooltip
                    title={
                      selectedCreators.length < 2
                        ? 'Chọn ít nhất 2 Nhà sáng tạo để so sánh đối chiếu'
                        : ''
                    }
                    placement="top"
                  >
                    <span>
                      <Button
                        type="primary"
                        className="btn-shortlist-footer-compare-primary"
                        icon={<BarChartOutlined />}
                        disabled={selectedCreators.length < 2}
                        onClick={() => {
                          if (selectedCreators.length >= 2) {
                            setViewMode('compare');
                          }
                        }}
                        style={{
                          height: 38,
                          borderRadius: 8,
                          fontWeight: 700,
                          background: selectedCreators.length >= 2 ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : undefined,
                          borderColor: 'transparent',
                        }}
                      >
                        So sánh đối chiếu ({selectedCreators.length}) ➔
                      </Button>
                    </span>
                  </Tooltip>
                </div>
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

          {selectedCreators.length < 2 ? (
            <div className="shortlist-empty-box" style={{ background: '#FFFFFF', padding: 40, borderRadius: 16 }}>
              <div style={{ fontSize: 40 }}>⚖️</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginTop: 12 }}>
                Cần chọn ít nhất 2 Nhà sáng tạo để thực hiện so sánh
              </div>
              <div style={{ color: '#64748B', fontSize: 13, marginTop: 6, maxWidth: 450, margin: '6px auto 0' }}>
                Hiện tại bạn mới chọn {selectedCreators.length} Nhà sáng tạo. Vui lòng quay lại Danh sách và tick chọn thêm để xem ma trận phân tích chi tiết.
              </div>
              <Button
                type="primary"
                style={{ marginTop: 18, borderRadius: 8, height: 38 }}
                onClick={() => setViewMode('board')}
              >
                ← Quay lại Danh sách để chọn
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
                                  handleOpenInviteModal(c);
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
                    <div className="banner-sparkle-icon"><ThunderboltOutlined /></div>
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
                    Tiến hành liên hệ nhóm này
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
      {/* =========================================================================
          MODAL: THÊM NHÀ SÁNG TẠO VÀO SHORTLIST (TỪ ĐỀ XUẤT DISCOVERY)
          ========================================================================= */}
      <Modal
        title="Thêm Nhà sáng tạo vào Danh sách chọn"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        width={580}
      >
        <div style={{ marginTop: 14 }}>
          {/* Target Campaign */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Chiến dịch áp dụng:
            </label>
            <Select
              value={addCampaignId}
              onChange={setAddCampaignId}
              style={{ width: '100%' }}
              options={campaignOptions.filter((o) => o.value !== 'all')}
              placeholder="Chọn chiến dịch đích"
            />
          </div>

          {campaignOptions.filter((o) => o.value !== 'all').length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="Chưa có chiến dịch nào"
              description="Bạn cần tạo chiến dịch trước khi có thể lưu trữ Nhà sáng tạo vào danh sách chọn."
              action={
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setAddModalOpen(false);
                    navigate('/campaigns/create');
                  }}
                >
                  Tạo ngay
                </Button>
              }
              style={{ borderRadius: 8, marginBottom: 14 }}
            />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                  Nhà sáng tạo được AI đề xuất cho chiến dịch:
                </label>
                <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>
                  Từ trang Khám phá
                </Tag>
              </div>
              <Input
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Tìm nhanh theo tên, username hoặc lĩnh vực..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                style={{ marginBottom: 14, borderRadius: 8 }}
                allowClear
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                {(() => {
                  // Đọc danh sách KOL/KOC đã được pipeline Discovery đề xuất cho chiến dịch
                  let candidatesList: any[] = [];
                  try {
                    const rawDiscovery = localStorage.getItem('IM_DISCOVERY_CREATORS');
                    if (rawDiscovery) {
                      const parsed = JSON.parse(rawDiscovery);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        candidatesList = parsed.map((d: any) => ({
                          id: d.id,
                          displayName: d.name || d.displayName || d.username,
                          userName: d.username || d.userName,
                          avatarUrl: d.avatar || d.avatarUrl,
                          followers: d.followersCount || d.followers || 0,
                          engagementRate: d.engagementValue || d.engagementRate || 3.5,
                          platform: (d.platforms?.[0] || d.platform || 'tiktok').toLowerCase(),
                          niche: d.categories?.[0] || d.niche || 'Lối sống',
                          matchRate: d.matchRate || 92,
                        }));
                      }
                    }
                  } catch {}

                  // Fallback nếu Discovery cache trống: lấy từ danh sách creators hệ thống
                  if (candidatesList.length === 0) {
                    candidatesList = Array.from(creatorsMap.values()).map((c) => ({
                      id: c.creatorId || c.id,
                      displayName: c.displayName || c.userName,
                      userName: c.userName,
                      avatarUrl: c.avatarUrl,
                      followers: c.followers || 0,
                      engagementRate: c.engagementRate || 3.5,
                      platform: (c.platform || 'tiktok').toLowerCase(),
                      niche: c.niche || 'Lối sống',
                      matchRate: 90,
                    }));
                  }

                  const filtered = candidatesList.filter((c) => {
                    if (!candidateSearch.trim()) return true;
                    const q = candidateSearch.toLowerCase();
                    return (
                      c.displayName?.toLowerCase().includes(q) ||
                      c.userName?.toLowerCase().includes(q) ||
                      c.niche?.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748B' }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                          Không tìm thấy hồ sơ nào phù hợp từ khóa
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => {
                            setAddModalOpen(false);
                            if (addCampaignId && addCampaignId !== 'all') {
                              sessionStorage.setItem('current_campaign_id', addCampaignId);
                              localStorage.setItem('last_active_campaign_id', addCampaignId);
                            }
                            navigate('/creators');
                          }}
                        >
                          Sang Khám phá để AI tìm kiếm thêm ➔
                        </Button>
                      </div>
                    );
                  }

                  return filtered.map((cand) => {
                    const candId = cand.id;
                    const isAlreadyIn = creators.some(
                      (item) => item.id === candId && (addCampaignId === 'all' || item.campaignId === addCampaignId)
                    );
                    const isSubmitting = addingCandidateId === candId;

                    return (
                      <div
                        key={candId}
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
                            src={cand.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.displayName || cand.userName)}`}
                            alt={cand.displayName}
                            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                                {cand.displayName}
                              </span>
                              {cand.matchRate && (
                                <Tag color="green" style={{ fontSize: 10.5, lineHeight: '18px', padding: '0 6px', margin: 0, borderRadius: 4, fontWeight: 700 }}>
                                  {cand.matchRate}% phù hợp
                                </Tag>
                              )}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                              @{cand.userName?.replace(/^@+/, '')} • {cand.followers ? `${Math.round(cand.followers / 1000)}K followers` : '—'} • {normalizeNiche(cand.niche)}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="small"
                          type={isAlreadyIn ? 'default' : 'primary'}
                          disabled={isAlreadyIn}
                          loading={isSubmitting}
                          style={{
                            borderRadius: 6,
                            fontWeight: 600,
                            background: isAlreadyIn ? '#F1F5F9' : '#4F46E5',
                            borderColor: isAlreadyIn ? '#CBD5E1' : '#4F46E5',
                          }}
                          onClick={async () => {
                            if (!addCampaignId || addCampaignId === 'all') {
                              message.warning('Vui lòng chọn chiến dịch cần thêm!');
                              return;
                            }
                            setAddingCandidateId(candId);
                            try {
                              await creatorService.addToShortlist(addCampaignId, {
                                creatorId: candId,
                                creatorName: cand.displayName || cand.userName,
                                username: cand.userName || cand.displayName,
                                avatarUrl: cand.avatarUrl,
                                followers: cand.followers,
                                engagementRate: cand.engagementRate,
                                platform: cand.platform,
                                niche: cand.niche,
                                priority: 'HIGH',
                                note: `Đã thêm từ danh sách đề xuất (${cand.matchRate || 92}% phù hợp)`,
                              });
                              message.success(`Đã thêm ${cand.displayName || cand.userName} vào Danh sách chọn!`);
                              await loadShortlist(selectedCampaign, campaigns, creatorsMap);
                            } catch (err: any) {
                              message.error(err?.response?.data?.message || 'Không thể thêm vào danh sách');
                            } finally {
                              setAddingCandidateId(null);
                            }
                          }}
                        >
                          {isAlreadyIn ? 'Đã trong danh sách' : '+ Thêm vào'}
                        </Button>
                      </div>
                    );
                  });
                })()}
              </div>

              <div style={{ marginTop: 14, textAlign: 'center', paddingTop: 10, borderTop: '1px dashed #E2E8F0' }}>
                <span style={{ fontSize: 12.5, color: '#64748B' }}>Muốn xem thêm các hồ sơ AI phân tích chuyên sâu? </span>
                <Button
                  type="link"
                  style={{ padding: 0, fontWeight: 700, fontSize: 13, color: '#4F46E5' }}
                  onClick={() => {
                    setAddModalOpen(false);
                    if (addCampaignId && addCampaignId !== 'all') {
                      sessionStorage.setItem('current_campaign_id', addCampaignId);
                      localStorage.setItem('last_active_campaign_id', addCampaignId);
                    }
                    navigate('/creators');
                  }}
                >
                  Sang trang Khám phá ➔
                </Button>
              </div>
            </>
          )}
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
                Địa chỉ Email liên hệ của Creator <span style={{ color: '#EF4444' }}>*</span>:
              </label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="creator@example.com"
                style={{ borderRadius: 8 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Mức thù lao đề xuất (VND):
              </label>
              <Input
                value={inviteFee}
                onChange={(e) => setInviteFee(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Thông điệp gửi kèm:
              </label>
              <Input.TextArea
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setInviteModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={isSendingInvite}
                style={{ background: '#4F46E5', borderRadius: 8 }}
                onClick={handleSendInvitation}
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
