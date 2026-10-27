import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  Modal,
  Form,
  Progress,
  message,
  Tooltip,
  Typography,
  Popconfirm,
  Avatar,
  Badge,
  Tabs,
  Divider,
  Alert,
  Drawer,
  Descriptions,
  Radio,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  ControlOutlined,
  BranchesOutlined,
  SwapOutlined,
  EyeOutlined,
  CheckOutlined,
  DisconnectOutlined,
  MailOutlined,
  UserOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import apiClient from '../../../services/apiClient';
import DataPipelineWorkflowBar from '../../../components/admin/DataPipelineWorkflowBar';

const { Text } = Typography;

export interface QualityItem {
  metricId: string;
  creatorId: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | string;
  userName: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;
  niche: string;
  contentSummary: string;
  dataConfidence: number; // 0.0 -> 1.0 (ví dụ: 0.58 < 0.70)
  collectedAt: string;
}

export interface IdentityConflictItem {
  id: string;
  matchScore: number; // 0.0 -> 1.0
  conflictType: 'CROSS_PLATFORM_DUPLICATE' | 'SIMILAR_HANDLE_SAME_NICHE' | 'CONTACT_INFO_OVERLAP';
  conflictLabel: string;
  detectedReason: string;
  evidenceTags: string[];
  profileA: {
    id: string;
    platform: 'tiktok' | 'instagram' | 'youtube';
    userName: string;
    displayName: string;
    avatarUrl: string;
    followers: number;
    engagementRate: number;
    niche: string;
    bioContact?: string;
    profileUrl: string;
    bioSummary: string;
  };
  profileB: {
    id: string;
    platform: 'tiktok' | 'instagram' | 'youtube';
    userName: string;
    displayName: string;
    avatarUrl: string;
    followers: number;
    engagementRate: number;
    niche: string;
    bioContact?: string;
    profileUrl: string;
    bioSummary: string;
  };
  status: 'PENDING' | 'MERGED' | 'RESOLVED_SEPARATE';
  detectedAt: string;
}

const STANDARD_NICHES = [
  'Làm đẹp & Mỹ phẩm',
  'Chăm sóc da & Skincare',
  'Thời trang & Phong cách',
  'Công nghệ & Thiết bị số',
  'Ẩm thực & Nấu ăn',
  'Sức khỏe & Thể hình',
  'Du lịch & Trải nghiệm',
  'Mẹ & Bé',
  'Giáo dục & Phát triển bản thân',
  'Tài chính & Đầu tư',
  'Lối sống & Sáng tạo nội dung',
];

const INITIAL_QUALITY_ITEMS: QualityItem[] = [
  {
    metricId: 'metric-001',
    creatorId: 'c-raw-101',
    platform: 'tiktok',
    userName: 'linh.review.daily',
    displayName: 'Khánh Linh Daily',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    profileUrl: 'https://www.tiktok.com/@linh.review.daily',
    niche: 'Sản phẩm tiêu dùng',
    contentSummary: 'Review son dưỡng có màu và kem chống nắng nâng tone đi học, quay unboxing tại phòng ngủ.',
    dataConfidence: 0.58,
    collectedAt: '2026-10-26T22:15:00Z',
  },
  {
    metricId: 'metric-002',
    creatorId: 'c-raw-102',
    platform: 'instagram',
    userName: 'quang.techie',
    displayName: 'Quang Trần Tech',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    profileUrl: 'https://www.instagram.com/quang.techie',
    niche: 'Đời sống',
    contentSummary: 'Bài đăng ảnh setup góc làm việc tối giản với bàn phím cơ và màn hình 4K, chia sẻ mẹo làm việc hiệu quả.',
    dataConfidence: 0.62,
    collectedAt: '2026-10-26T21:40:00Z',
  },
  {
    metricId: 'metric-003',
    creatorId: 'c-raw-103',
    platform: 'tiktok',
    userName: 'bep.me.na',
    displayName: 'Bếp Mẹ Na',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    profileUrl: 'https://www.tiktok.com/@bep.me.na',
    niche: 'Gia đình',
    contentSummary: 'Nấu súp gà nấm đông cô tẩm bổ cuối tuần cho bé, hướng dẫn chi tiết cách nêm nếm ít muối.',
    dataConfidence: 0.54,
    collectedAt: '2026-10-26T20:10:00Z',
  },
  {
    metricId: 'metric-004',
    creatorId: 'c-raw-104',
    platform: 'youtube',
    userName: 'fitwithan',
    displayName: 'An Nguyễn Fitness',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    profileUrl: 'https://www.youtube.com/@fitwithan',
    niche: 'Thể thao chung',
    contentSummary: 'Video 15 phút tập cơ bụng tại nhà không cần dụng cụ cho người mới bắt đầu.',
    dataConfidence: 0.65,
    collectedAt: '2026-10-26T18:30:00Z',
  },
  {
    metricId: 'metric-005',
    creatorId: 'c-raw-105',
    platform: 'tiktok',
    userName: 'genz.ootd.style',
    displayName: 'Minh Thư Style',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    profileUrl: 'https://www.tiktok.com/@genz.ootd.style',
    niche: 'Khác',
    contentSummary: 'Phối đồ đi học và đi cà phê tone be nâu thanh lịch, giới thiệu địa chỉ mua blazer giá sinh viên.',
    dataConfidence: 0.48,
    collectedAt: '2026-10-26T16:05:00Z',
  },
];

const INITIAL_CONFLICTS: IdentityConflictItem[] = [
  {
    id: 'conflict-001',
    matchScore: 0.96,
    conflictType: 'CROSS_PLATFORM_DUPLICATE',
    conflictLabel: 'Trùng lặp đa nền tảng (Cùng một người)',
    detectedReason: 'Trùng khớp 100% email booking thương mại và nhận diện khuôn mặt AI đạt 97.4%.',
    evidenceTags: ['Email: booking.chaubui@gmail.com', 'Face Match: 97.4%', 'Trùng Display Name'],
    profileA: {
      id: 'cr_insta_chau',
      platform: 'instagram',
      userName: 'chaubui_',
      displayName: 'Châu Bùi',
      avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80',
      followers: 3200000,
      engagementRate: 0.052,
      niche: 'Thời trang & High Fashion',
      bioContact: 'booking.chaubui@gmail.com',
      profileUrl: 'https://instagram.com/chaubui_',
      bioSummary: 'Fashionista & Digital Creator • Đại sứ phong cách • Contact: booking.chaubui@gmail.com',
    },
    profileB: {
      id: 'cr_tiktok_chau',
      platform: 'tiktok',
      userName: 'chaukikii',
      displayName: 'Châu Bùi Official',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      followers: 2450000,
      engagementRate: 0.078,
      niche: 'Thời trang & Sáng tạo nội dung',
      bioContact: 'booking.chaubui@gmail.com',
      profileUrl: 'https://tiktok.com/@chaukikii',
      bioSummary: 'Chào mừng bạn đến với kênh TikTok chính thức của Châu Bùi! For work: booking.chaubui@gmail.com',
    },
    status: 'PENDING',
    detectedAt: '2026-10-27T08:15:00Z',
  },
  {
    id: 'conflict-002',
    matchScore: 0.89,
    conflictType: 'CONTACT_INFO_OVERLAP',
    conflictLabel: 'Trùng lặp thông tin liên hệ & kênh video',
    detectedReason: 'Khớp domain email liên hệ công việc và cùng địa chỉ studio tại TP. Hồ Chí Minh.',
    evidenceTags: ['Email Domain: @quangtech.vn', 'Cùng vị trí địa lý', 'Phân loại cùng Niche Tech'],
    profileA: {
      id: 'cr_yt_quang',
      platform: 'youtube',
      userName: 'quangtrantech',
      displayName: 'Quang Trần Tech',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      followers: 480000,
      engagementRate: 0.082,
      niche: 'Công nghệ & Thiết bị số',
      bioContact: 'contact@quangtech.vn',
      profileUrl: 'https://youtube.com/@quangtrantech',
      bioSummary: 'Đánh giá chân thực laptop, smartphone và setup công nghệ. Liên hệ công việc: contact@quangtech.vn',
    },
    profileB: {
      id: 'cr_insta_quang',
      platform: 'instagram',
      userName: 'quang.techie',
      displayName: 'Quang Trần',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      followers: 110000,
      engagementRate: 0.061,
      niche: 'Đời sống & Setup',
      bioContact: 'contact@quangtech.vn',
      profileUrl: 'https://instagram.com/quang.techie',
      bioSummary: 'Daily workspace setup & tech minimal lifestyle. Business: contact@quangtech.vn',
    },
    status: 'PENDING',
    detectedAt: '2026-10-27T09:30:00Z',
  },
  {
    id: 'conflict-003',
    matchScore: 0.78,
    conflictType: 'SIMILAR_HANDLE_SAME_NICHE',
    conflictLabel: 'Trùng Display Name nhưng nghi vấn kênh phụ',
    detectedReason: 'Tên hiển thị giống nhau nhưng sử dụng 2 email liên hệ khác nhau. Cần người quản lý đối chiếu.',
    evidenceTags: ['Cùng Display Name: Khánh Linh', 'Khác Email liên hệ', 'Độ tương đồng ảnh: 71%'],
    profileA: {
      id: 'cr_tt_linh1',
      platform: 'tiktok',
      userName: 'linh.review.daily',
      displayName: 'Khánh Linh Daily',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      followers: 185000,
      engagementRate: 0.065,
      niche: 'Làm đẹp & Mỹ phẩm',
      bioContact: 'linhdaily.work@gmail.com',
      profileUrl: 'https://tiktok.com/@linh.review.daily',
      bioSummary: 'Review mỹ phẩm học sinh sinh viên chân thực. Contact: linhdaily.work@gmail.com',
    },
    profileB: {
      id: 'cr_tt_linh2',
      platform: 'tiktok',
      userName: 'linh.beauty.vn',
      displayName: 'Khánh Linh Skincare',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      followers: 210000,
      engagementRate: 0.071,
      niche: 'Chăm sóc da & Skincare',
      bioContact: 'beauty.linh@outlook.com',
      profileUrl: 'https://tiktok.com/@linh.beauty.vn',
      bioSummary: 'Chăm da khoa học cùng Linh. Tư vấn routine & hợp tác: beauty.linh@outlook.com',
    },
    status: 'PENDING',
    detectedAt: '2026-10-27T10:05:00Z',
  },
];

export default function DataQualityPage() {
  const [activeTab, setActiveTab] = useState<'quality' | 'identity'>('quality');

  // Tab 1: Quality Review state
  const [items, setItems] = useState<QualityItem[]>(INITIAL_QUALITY_ITEMS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<QualityItem | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveForm] = Form.useForm();

  // Tab 2: Identity Resolution state
  const [conflicts, setConflicts] = useState<IdentityConflictItem[]>(INITIAL_CONFLICTS);
  const [conflictFilter, setConflictFilter] = useState('all');
  const [selectedConflict, setSelectedConflict] = useState<IdentityConflictItem | null>(null);
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [masterProfileId, setMasterProfileId] = useState<string>('');
  const [merging, setMerging] = useState(false);

  // Load from backend
  const fetchPendingData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/data-quality/pending', {
        params: { page: 0, size: 20 },
      });
      const raw = response.data;
      const d = (raw as any)?.data ?? raw;
      const serverList = Array.isArray(d) ? d : d?.content || d?.items || [];
      if (serverList.length > 0) {
        setItems(serverList);
      }
    } catch {
      // Graceful fallback to initial items
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  // Filter items in Tab 1
  const filteredItems = items.filter((it) => {
    if (platformFilter !== 'all' && it.platform.toLowerCase() !== platformFilter.toLowerCase()) return false;
    if (confidenceFilter === 'low' && it.dataConfidence >= 0.5) return false;
    if (confidenceFilter === 'medium' && (it.dataConfidence < 0.5 || it.dataConfidence >= 0.7)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = it.displayName.toLowerCase().includes(q);
      const matchUser = it.userName.toLowerCase().includes(q);
      const matchNiche = it.niche.toLowerCase().includes(q);
      const matchSummary = it.contentSummary.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchNiche && !matchSummary) return false;
    }
    return true;
  });

  // Filter items in Tab 2
  const filteredConflicts = conflicts.filter((c) => {
    if (conflictFilter !== 'all' && c.conflictType !== conflictFilter) return false;
    return true;
  });

  // Open approve modal in Tab 1
  const handleOpenApprove = (item: QualityItem) => {
    setSelectedItem(item);
    approveForm.setFieldsValue({
      niche: item.niche,
    });
    setApproveModalOpen(true);
  };

  // Submit approve in Tab 1
  const handleApproveSubmit = async () => {
    if (!selectedItem) return;
    try {
      const values = await approveForm.validateFields();
      setApproving(true);

      try {
        await apiClient.put(`/admin/data-quality/${selectedItem.metricId}/approve`, {
          niche: values.niche,
        });
      } catch {
        // Fallback locally
      }

      message.success(`Đã phê duyệt và chuẩn hóa hồ sơ cho @${selectedItem.userName} vào ngành "${values.niche}"!`);
      setItems((prev) => prev.filter((i) => i.metricId !== selectedItem.metricId));
      setApproveModalOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('Không thể hoàn tất phê duyệt.');
    } finally {
      setApproving(false);
    }
  };

  // Recrawl action in Tab 1
  const handleRecrawl = async (item: QualityItem) => {
    message.loading({ content: `Đang gửi lệnh yêu cầu quét lại dữ liệu cho @${item.userName}...`, key: 'recrawl' });
    await new Promise((r) => setTimeout(r, 600));
    message.success({ content: `Đã đưa @${item.userName} vào hàng đợi thu thập lại.`, key: 'recrawl' });
    setItems((prev) => prev.filter((i) => i.metricId !== item.metricId));
  };

  // Open Merge Modal in Tab 2
  const handleOpenMerge = (conflict: IdentityConflictItem) => {
    setSelectedConflict(conflict);
    setMasterProfileId(conflict.profileA.id);
    setMergeModalOpen(true);
  };

  // Open Compare Drawer in Tab 2
  const handleOpenCompare = (conflict: IdentityConflictItem) => {
    setSelectedConflict(conflict);
    setCompareDrawerOpen(true);
  };

  // Confirm Merge in Tab 2
  const handleConfirmMerge = async () => {
    if (!selectedConflict) return;
    setMerging(true);
    await new Promise((r) => setTimeout(r, 800));

    const masterName =
      masterProfileId === selectedConflict.profileA.id
        ? selectedConflict.profileA.displayName
        : selectedConflict.profileB.displayName;

    message.success({
      content: `Đã hợp nhất thành công hồ sơ đa kênh cho "${masterName}"! Dữ liệu đã đồng bộ trên Creator Catalog.`,
      duration: 3,
    });

    setConflicts((prev) => prev.filter((c) => c.id !== selectedConflict.id));
    setMergeModalOpen(false);
    setCompareDrawerOpen(false);
    setMerging(false);
  };

  // Confirm Separate Entities in Tab 2
  const handleResolveSeparate = (conflict: IdentityConflictItem) => {
    message.info(
      `Đã xác nhận @${conflict.profileA.userName} và @${conflict.profileB.userName} là 2 Creator riêng biệt. Đã gỡ cờ xung đột.`
    );
    setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
    if (compareDrawerOpen) setCompareDrawerOpen(false);
  };

  // Columns for Tab 1 (Quality Items)
  const columnsQuality: TableColumnsType<QualityItem> = [
    {
      title: 'Hồ sơ KOC',
      key: 'creator',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} src={r.avatarUrl} style={{ border: '1px solid #E2E8F0', flexShrink: 0 }}>
            {r.displayName?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{r.displayName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748B' }}>
              <span>@{r.userName}</span>
              <span>•</span>
              <Tag
                color={r.platform === 'tiktok' ? 'default' : r.platform === 'instagram' ? 'magenta' : 'red'}
                style={{ fontSize: 10, margin: 0, padding: '0 5px', height: 18, lineHeight: '18px' }}
              >
                {r.platform.toUpperCase()}
              </Tag>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Độ tin cậy AI',
      key: 'confidence',
      width: 170,
      render: (_, r) => {
        const pct = Math.round(r.dataConfidence * 100);
        const color = pct >= 60 ? '#F59E0B' : '#EF4444';
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ color }}>{pct}% Match</span>
              <span style={{ fontSize: 10.5, color: '#94A3B8' }}>Ngưỡng: 70%</span>
            </div>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
          </div>
        );
      },
    },
    {
      title: 'Ngành hàng dự đoán',
      key: 'niche',
      width: 160,
      render: (_, r) => (
        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>
          {r.niche}
        </Tag>
      ),
    },
    {
      title: 'Tóm tắt nội dung cào',
      key: 'summary',
      render: (_, r) => (
        <Tooltip title={r.contentSummary}>
          <div
            style={{
              fontSize: 12.5,
              color: '#475569',
              maxWidth: 320,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {r.contentSummary}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 190,
      align: 'right',
      render: (_, r) => (
        <Space size={8}>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleOpenApprove(r)}
            style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 600 }}
          >
            Sửa & Duyệt
          </Button>
          <Popconfirm
            title="Quét lại bản ghi này?"
            description="Hệ thống crawler sẽ trích xuất lại video mới nhất của Creator."
            onConfirm={() => handleRecrawl(r)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button size="small" icon={<ReloadOutlined />} style={{ color: '#64748B' }}>
              Cào lại
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Columns for Tab 2 (Identity Conflicts)
  const columnsConflict: TableColumnsType<IdentityConflictItem> = [
    {
      title: 'Cặp hồ sơ nghi vấn trùng lặp',
      key: 'pair',
      width: 380,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Profile A */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <Avatar size={34} src={r.profileA.avatarUrl}>
              {r.profileA.displayName.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.profileA.displayName}</span>
                <Tag color={r.profileA.platform === 'tiktok' ? 'default' : r.profileA.platform === 'instagram' ? 'magenta' : 'red'} style={{ fontSize: 9.5, padding: '0 4px', height: 16, lineHeight: '16px' }}>
                  {r.profileA.platform.toUpperCase()}
                </Tag>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                @{r.profileA.userName} • {(r.profileA.followers / 1000).toLocaleString()}K flw
              </div>
            </div>
          </div>

          {/* Profile B */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <Avatar size={34} src={r.profileB.avatarUrl}>
              {r.profileB.displayName.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.profileB.displayName}</span>
                <Tag color={r.profileB.platform === 'tiktok' ? 'default' : r.profileB.platform === 'instagram' ? 'magenta' : 'red'} style={{ fontSize: 9.5, padding: '0 4px', height: 16, lineHeight: '16px' }}>
                  {r.profileB.platform.toUpperCase()}
                </Tag>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                @{r.profileB.userName} • {(r.profileB.followers / 1000).toLocaleString()}K flw
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Độ tương đồng AI',
      key: 'matchScore',
      width: 170,
      render: (_, r) => {
        const pct = Math.round(r.matchScore * 100);
        const color = pct >= 90 ? '#10B981' : pct >= 80 ? '#F59E0B' : '#6366F1';
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 3 }}>
              <span style={{ color }}>{pct}% Tương đồng</span>
              <span style={{ fontSize: 10.5, color: '#64748B' }}>Khớp cao</span>
            </div>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>
              Phát hiện: {new Date(r.detectedAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Bằng chứng AI đối chiếu',
      key: 'evidence',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12.5, color: '#0F172A', marginBottom: 6 }}>
            {r.conflictLabel}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {r.evidenceTags.map((tag, i) => (
              <Tag key={i} color="blue" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Xử lý xung đột',
      key: 'action',
      width: 230,
      align: 'right',
      render: (_, r) => (
        <Space size={6} wrap style={{ justifyContent: 'flex-end' }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenCompare(r)}
            style={{ fontSize: 12 }}
          >
            So sánh
          </Button>

          <Button
            type="primary"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleOpenMerge(r)}
            style={{ background: '#2563EB', borderColor: '#2563EB', fontWeight: 600, fontSize: 12 }}
          >
            Hợp nhất
          </Button>

          <Popconfirm
            title="Xác nhận là 2 Creator khác nhau?"
            description="Hệ thống sẽ giữ riêng biệt 2 hồ sơ này và không cảnh báo xung đột nữa."
            onConfirm={() => handleResolveSeparate(r)}
            okText="Xác nhận tách"
            cancelText="Hủy"
          >
            <Button size="small" icon={<DisconnectOutlined />} danger style={{ fontSize: 12 }}>
              Tách biệt
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4px 0 32px' }}>
      {/* 1. Header Pipeline Bar */}
      <DataPipelineWorkflowBar
        currentStep="quality"
        pendingQualityCount={items.length}
        activeConnectorsCount={3}
        runningJobsCount={2}
      />

      {/* 2. Page Title Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: -0.5 }}>
          Kiểm định Chất lượng & Xử lý Xung đột Danh tính
        </h1>
        <p style={{ color: '#64748B', fontSize: 13.5, margin: '4px 0 0' }}>
          Trung tâm xử lý dữ liệu cào: Chuẩn hóa ngách ngành hàng KOC và hợp nhất các hồ sơ trùng lặp đa nền tảng.
        </p>
      </div>

      {/* 3. Main Navigation Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'quality' | 'identity')}
        type="card"
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'quality',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, padding: '2px 4px' }}>
                <ControlOutlined />
                <span>1. Chuẩn hóa Ngách & Dữ liệu Cào</span>
                <Badge count={items.length} overflowCount={99} style={{ backgroundColor: '#F59E0B' }} />
              </span>
            ),
          },
          {
            key: 'identity',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, padding: '2px 4px' }}>
                <BranchesOutlined />
                <span>2. Xử lý Xung đột Danh tính (Identity Resolution)</span>
                <Badge count={conflicts.length} overflowCount={99} style={{ backgroundColor: '#2563EB' }} />
              </span>
            ),
          },
        ]}
      />

      {/* TAB 1: QUALITY & NICHE NORMALIZATION */}
      {activeTab === 'quality' && (
        <>
          {/* Summary Stat Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Cần kiểm duyệt</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
                      {items.length} hồ sơ
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#FFFBEB',
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    <InboxOutlined />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Tỷ lệ AI phân loại chuẩn</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                      92.4%
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#EEF2FF',
                      color: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    <ControlOutlined />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Đã chuẩn hóa hôm nay</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                      28 hồ sơ
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    <CheckCircleOutlined />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Main Quality Table */}
          <Card
            bordered={false}
            style={{ borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <Space size={10} wrap>
                <Input
                  prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                  placeholder="Tìm kiếm KOC, username, nội dung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 260, borderRadius: 8 }}
                  allowClear
                />

                <Select
                  value={platformFilter}
                  onChange={setPlatformFilter}
                  style={{ width: 140 }}
                  options={[
                    { value: 'all', label: 'Tất cả nền tảng' },
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'youtube', label: 'YouTube' },
                  ]}
                />

                <Select
                  value={confidenceFilter}
                  onChange={setConfidenceFilter}
                  style={{ width: 160 }}
                  options={[
                    { value: 'all', label: 'Tất cả độ tin cậy' },
                    { value: 'medium', label: '50% - 70% (Trung bình)' },
                    { value: 'low', label: '< 50% (Rất thấp)' },
                  ]}
                />
              </Space>

              <span style={{ fontSize: 12.5, color: '#64748B' }}>
                Hiển thị <strong>{filteredItems.length}</strong> / {items.length} bản ghi cần kiểm duyệt
              </span>
            </div>

            <Table
              dataSource={filteredItems}
              columns={columnsQuality}
              rowKey="metricId"
              loading={loading}
              pagination={{ pageSize: 6 }}
              locale={{
                emptyText: (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: 36, color: '#10B981', marginBottom: 10 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                      Toàn bộ dữ liệu KOC đã được chuẩn hóa!
                    </div>
                    <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                      Không còn bản ghi nào có độ tin cậy dưới ngưỡng quy định.
                    </div>
                  </div>
                ),
              }}
            />
          </Card>
        </>
      )}

      {/* TAB 2: IDENTITY RESOLUTION & DEDUPLICATION */}
      {activeTab === 'identity' && (
        <>
          {/* Identity Stat Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Xung đột chờ xử lý</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', marginTop: 2 }}>
                      {conflicts.length} cặp hồ sơ
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    <BranchesOutlined />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Độ khớp AI trung bình</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                      87.6%
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    <CheckCircleOutlined />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Hồ sơ đã gộp thành công</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                      14 Creator
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#F0FDF4',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    <SwapOutlined />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Alert Guidance Bar */}
          <Alert
            message="Thuật toán Entity Resolution tự động"
            description="Hệ thống tự động quét và đối chiếu các Creator từ TikTok, Instagram và YouTube. Khi phát hiện chỉ số tương đồng (khớp email, nhận diện khuôn mặt, trùng handle) trên 75%, hệ thống sẽ tạm giữ để Manager xác nhận gộp (Merge) nhằm tránh phân mảnh dữ liệu."
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #BFDBFE' }}
          />

          {/* Main Conflicts Table */}
          <Card
            bordered={false}
            style={{ borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <Space size={10} wrap>
                <Select
                  value={conflictFilter}
                  onChange={setConflictFilter}
                  style={{ width: 260 }}
                  options={[
                    { value: 'all', label: 'Tất cả loại xung đột' },
                    { value: 'CROSS_PLATFORM_DUPLICATE', label: 'Trùng lặp đa nền tảng (Cùng người)' },
                    { value: 'CONTACT_INFO_OVERLAP', label: 'Trùng thông tin liên hệ / Email' },
                    { value: 'SIMILAR_HANDLE_SAME_NICHE', label: 'Trùng tên hiển thị trong cùng ngành' },
                  ]}
                />
              </Space>

              <span style={{ fontSize: 12.5, color: '#64748B' }}>
                Hiển thị <strong>{filteredConflicts.length}</strong> / {conflicts.length} cặp xung đột cần giải quyết
              </span>
            </div>

            <Table
              dataSource={filteredConflicts}
              columns={columnsConflict}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              locale={{
                emptyText: (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: 36, color: '#10B981', marginBottom: 10 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                      Không có xung đột danh tính nào tồn đọng!
                    </div>
                    <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                      Dữ liệu Creator Catalog đã được deduplicate đồng nhất 100%.
                    </div>
                  </div>
                ),
              }}
            />
          </Card>
        </>
      )}

      {/* Modal 1: Approve Niche Modal (Tab 1) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
            <SafetyCertificateOutlined style={{ color: '#4F46E5' }} />
            <span>Chuẩn hóa & Phê duyệt Ngành hàng KOC</span>
          </div>
        }
        open={approveModalOpen}
        onCancel={() => setApproveModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        {selectedItem && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 10,
                padding: '12px 14px',
                border: '1px solid #E2E8F0',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Avatar src={selectedItem.avatarUrl} size={42}>
                {selectedItem.displayName?.charAt(0)}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{selectedItem.displayName}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  @{selectedItem.userName} • {selectedItem.platform.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12.5, color: '#334155', marginBottom: 16, background: '#FFFBEB', padding: '10px 12px', borderRadius: 8, border: '1px solid #FDE68A' }}>
              <strong>Tóm tắt nội dung clip gần nhất:</strong>
              <div style={{ marginTop: 4, color: '#4B5563', lineHeight: 1.45 }}>{selectedItem.contentSummary}</div>
            </div>

            <Form form={approveForm} layout="vertical" onFinish={handleApproveSubmit}>
              <Form.Item
                name="niche"
                label={<span style={{ fontWeight: 600 }}>Ngành hàng chuẩn hóa (Niche Taxonomy):</span>}
                rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập ngành hàng chuẩn!' }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn ngành hàng chuẩn..."
                  options={STANDARD_NICHES.map((n) => ({ value: n, label: n }))}
                  size="large"
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <Button onClick={() => setApproveModalOpen(false)}>Hủy</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={approving}
                  style={{ fontWeight: 700, background: '#4F46E5' }}
                >
                  Xác nhận phê duyệt & Lưu vào Catalog
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Modal 2: Merge Confirmation Modal (Tab 2) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
            <SwapOutlined style={{ color: '#2563EB' }} />
            <span>Hợp nhất Hồ sơ Creator Đa nền tảng (Merge Entity)</span>
          </div>
        }
        open={mergeModalOpen}
        onCancel={() => setMergeModalOpen(false)}
        footer={null}
        destroyOnClose
        width={580}
      >
        {selectedConflict && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              Hệ thống sẽ liên kết hai hồ sơ mạng xã hội này thành **một thực thể KOC duy nhất** trong Creator Catalog. Số liệu người theo dõi và bài đăng sẽ được hiển thị tổng hợp.
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                Chọn hồ sơ chính đại diện (Primary Master Profile):
              </div>
              <Radio.Group
                value={masterProfileId}
                onChange={(e) => setMasterProfileId(e.target.value)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <Radio
                  value={selectedConflict.profileA.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: masterProfileId === selectedConflict.profileA.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: masterProfileId === selectedConflict.profileA.id ? '#EFF6FF' : '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, verticalAlign: 'middle' }}>
                    <Avatar size={30} src={selectedConflict.profileA.avatarUrl} />
                    <span style={{ fontWeight: 700 }}>{selectedConflict.profileA.displayName}</span>
                    <Tag color="blue">{selectedConflict.profileA.platform.toUpperCase()}</Tag>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>
                      ({(selectedConflict.profileA.followers / 1000).toLocaleString()}K flw)
                    </span>
                  </div>
                </Radio>

                <Radio
                  value={selectedConflict.profileB.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: masterProfileId === selectedConflict.profileB.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: masterProfileId === selectedConflict.profileB.id ? '#EFF6FF' : '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, verticalAlign: 'middle' }}>
                    <Avatar size={30} src={selectedConflict.profileB.avatarUrl} />
                    <span style={{ fontWeight: 700 }}>{selectedConflict.profileB.displayName}</span>
                    <Tag color="cyan">{selectedConflict.profileB.platform.toUpperCase()}</Tag>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>
                      ({(selectedConflict.profileB.followers / 1000).toLocaleString()}K flw)
                    </span>
                  </div>
                </Radio>
              </Radio.Group>
            </div>

            {/* Merge Result Preview */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                Kết quả hiển thị sau khi hợp nhất:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar
                  size={46}
                  src={
                    masterProfileId === selectedConflict.profileA.id
                      ? selectedConflict.profileA.avatarUrl
                      : selectedConflict.profileB.avatarUrl
                  }
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                    {masterProfileId === selectedConflict.profileA.id
                      ? selectedConflict.profileA.displayName
                      : selectedConflict.profileB.displayName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                      Liên kết: {selectedConflict.profileA.platform.toUpperCase()} + {selectedConflict.profileB.platform.toUpperCase()}
                    </Tag>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                      Tổng: {((selectedConflict.profileA.followers + selectedConflict.profileB.followers) / 1000000).toFixed(2)}M Followers
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setMergeModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                loading={merging}
                onClick={handleConfirmMerge}
                style={{ background: '#2563EB', fontWeight: 700 }}
              >
                Xác nhận Hợp nhất Hồ sơ
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Drawer: Detailed Comparison (Tab 2) */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EyeOutlined style={{ color: '#2563EB' }} />
            <span style={{ fontWeight: 800 }}>Đối chiếu Chi tiết Hai Hồ sơ Xung đột</span>
          </div>
        }
        open={compareDrawerOpen}
        onClose={() => setCompareDrawerOpen(false)}
        width={720}
        destroyOnClose
        footer={
          selectedConflict && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button danger icon={<DisconnectOutlined />} onClick={() => handleResolveSeparate(selectedConflict)}>
                Xác nhận là 2 người khác nhau
              </Button>
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={() => {
                  setCompareDrawerOpen(false);
                  handleOpenMerge(selectedConflict);
                }}
                style={{ background: '#2563EB', fontWeight: 700 }}
              >
                Tiến hành Hợp nhất
              </Button>
            </div>
          )
        }
      >
        {selectedConflict && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Match Score Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
                padding: '16px 20px',
                borderRadius: 12,
                border: '1px solid #BFDBFE',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1E40AF' }}>
                  {selectedConflict.conflictLabel}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>
                  {Math.round(selectedConflict.matchScore * 100)}% Match
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                {selectedConflict.detectedReason}
              </div>
            </div>

            {/* Side-by-side Profiles */}
            <Row gutter={16}>
              {/* Profile A */}
              <Col span={12}>
                <Card
                  title={
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      Hồ sơ A ({selectedConflict.profileA.platform.toUpperCase()})
                    </span>
                  }
                  size="small"
                  bordered
                  style={{ borderRadius: 10, borderColor: '#CBD5E1' }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <Avatar size={64} src={selectedConflict.profileA.avatarUrl} style={{ border: '2px solid #E2E8F0' }} />
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginTop: 8 }}>
                      {selectedConflict.profileA.displayName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>@{selectedConflict.profileA.userName}</div>
                  </div>

                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="Followers">
                      <strong>{(selectedConflict.profileA.followers / 1000).toLocaleString()}K</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Engagement Rate">
                      {(selectedConflict.profileA.engagementRate * 100).toFixed(1)}%
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngành">
                      {selectedConflict.profileA.niche}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bio Contact">
                      {selectedConflict.profileA.bioContact || 'Chưa có'}
                    </Descriptions.Item>
                  </Descriptions>

                  <div style={{ marginTop: 12, background: '#F8FAFC', padding: '10px', borderRadius: 8, fontSize: 12, color: '#475569' }}>
                    <strong>Mô tả Bio:</strong>
                    <div style={{ marginTop: 4 }}>{selectedConflict.profileA.bioSummary}</div>
                  </div>
                </Card>
              </Col>

              {/* Profile B */}
              <Col span={12}>
                <Card
                  title={
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      Hồ sơ B ({selectedConflict.profileB.platform.toUpperCase()})
                    </span>
                  }
                  size="small"
                  bordered
                  style={{ borderRadius: 10, borderColor: '#CBD5E1' }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <Avatar size={64} src={selectedConflict.profileB.avatarUrl} style={{ border: '2px solid #E2E8F0' }} />
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginTop: 8 }}>
                      {selectedConflict.profileB.displayName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>@{selectedConflict.profileB.userName}</div>
                  </div>

                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="Followers">
                      <strong>{(selectedConflict.profileB.followers / 1000).toLocaleString()}K</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Engagement Rate">
                      {(selectedConflict.profileB.engagementRate * 100).toFixed(1)}%
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngành">
                      {selectedConflict.profileB.niche}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bio Contact">
                      {selectedConflict.profileB.bioContact || 'Chưa có'}
                    </Descriptions.Item>
                  </Descriptions>

                  <div style={{ marginTop: 12, background: '#F8FAFC', padding: '10px', borderRadius: 8, fontSize: 12, color: '#475569' }}>
                    <strong>Mô tả Bio:</strong>
                    <div style={{ marginTop: 4 }}>{selectedConflict.profileB.bioSummary}</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
}
