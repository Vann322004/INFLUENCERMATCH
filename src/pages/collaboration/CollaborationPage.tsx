import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  Tag,
  Modal,
  message,
  Tooltip,
  Radio,
  Progress,
  Form,
  InputNumber,
  Upload,
  Empty,
  Spin,
  Rate,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import { collaborationService } from '../../services/api/collaborationService';
import {
  FileTextOutlined,
  VideoCameraOutlined,
  DollarOutlined,
  BarChartOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  StarFilled,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  LinkOutlined,
  FileDoneOutlined,
  WarningOutlined,
  ShoppingOutlined,
  RiseOutlined,
  SendOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import './CollaborationPage.css';

// Campaign selector options - loaded dynamically from campaignService

// Interface for Collaboration Partner
interface CollabPartner {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  handle: string;
  deliverableSummary: string;
  stage: 'contract_signed' | 'waiting_script' | 'waiting_video' | 'review_pending' | 'published';
  progressPercent: number;
  postDeadline: string;
  picBrand: string;
  fee: string;
  depositStatus: 'paid' | 'unpaid';
  finalStatus: 'paid' | 'pending' | 'unpaid';
}

// Interface for Deliverable Review Item
interface DeliverableReviewItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  title: string;
  version: string;
  submittedAt: string;
  videoDuration: string;
  status: 'pending' | 'revision_requested' | 'approved';
  captionDraft: string;
  hashtags: string[];
  comments: {
    id: string;
    timestamp: string;
    author: string;
    avatar: string;
    text: string;
    resolved: boolean;
    createdAt: string;
  }[];
}

// Interface for Fee Tracking Item
interface FeeTrackingItem {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  totalFee: number;
  depositAmount: number;
  depositDate: string;
  depositStatus: 'paid' | 'pending';
  depositEvidence?: string;
  finalAmount: number;
  finalDueDate: string;
  finalStatus: 'paid' | 'pending' | 'unpaid';
  finalEvidence?: string;
  bankAccount: string;
  bankName: string;
}

// Interface for KPI Entry Item
interface KpiEntryItem {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  postLink: string;
  postDate: string;
  views: number;
  likes: number;
  comments: number;
  clicks: number;
  orders: number;
  revenue: number;
  totalCost: number;
}

// Initial Mock Partners
const INITIAL_PARTNERS: CollabPartner[] = [
  {
    id: 'col-1',
    creatorName: 'Linh Nguyễn',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    handle: '@linhnguyen.official',
    deliverableSummary: '1 Video TikTok 60s + 1 Story IG',
    stage: 'review_pending',
    progressPercent: 75,
    postDeadline: '12/10/2026',
    picBrand: 'Trang Nguyễn (Brand Lead)',
    fee: '15.000.000 ₫',
    depositStatus: 'paid',
    finalStatus: 'pending',
  },
  {
    id: 'col-2',
    creatorName: 'Minh Hoàng',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    handle: '@minhhoang.92',
    deliverableSummary: '1 Video TikTok 45s outdoor',
    stage: 'waiting_video',
    progressPercent: 50,
    postDeadline: '15/10/2026',
    picBrand: 'Hoàng Nam (Marketing Ops)',
    fee: '12.500.000 ₫',
    depositStatus: 'paid',
    finalStatus: 'unpaid',
  },
  {
    id: 'col-3',
    creatorName: 'Thảo Vy',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    handle: '@thaovy.official',
    deliverableSummary: '1 Reel IG + 2 Story',
    stage: 'published',
    progressPercent: 100,
    postDeadline: '02/10/2026',
    picBrand: 'Trang Nguyễn (Brand Lead)',
    fee: '8.000.000 ₫',
    depositStatus: 'paid',
    finalStatus: 'paid',
  },
  {
    id: 'col-4',
    creatorName: 'Bác sĩ Ngọc',
    creatorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    handle: '@drngoc.dermatology',
    deliverableSummary: '1 Video phân tích da liễu chuyên sâu',
    stage: 'waiting_script',
    progressPercent: 30,
    postDeadline: '20/10/2026',
    picBrand: 'Bảo Trâm (PR Manager)',
    fee: '18.000.000 ₫',
    depositStatus: 'paid',
    finalStatus: 'unpaid',
  },
  {
    id: 'col-5',
    creatorName: 'Mai Lan',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    handle: '@mailan.beauty',
    deliverableSummary: '1 Video review kết cấu kem',
    stage: 'contract_signed',
    progressPercent: 15,
    postDeadline: '22/10/2026',
    picBrand: 'Hoàng Nam (Marketing Ops)',
    fee: '9.500.000 ₫',
    depositStatus: 'unpaid',
    finalStatus: 'unpaid',
  },
];

// Initial Deliverables for Review
const INITIAL_DELIVERABLES: DeliverableReviewItem[] = [
  {
    id: 'deliv-1',
    creatorId: 'col-1',
    creatorName: 'Linh Nguyễn',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    title: '[Video Demo v2] Review Kem Chống Nắng Summer Glow SPF50+ PA++++',
    version: 'Version 2 (Đã sửa theo góp ý)',
    submittedAt: 'Hôm nay lúc 09:30',
    videoDuration: '00:54',
    status: 'pending',
    captionDraft: 'Chân ái chống nắng mùa hè không vón cục, mỏng nhẹ tênh trên da cùng GlowBeauty ✨ Giảm ngay 20% khi nhập code LINHGLOW nha cả nhà ơi!',
    hashtags: ['#GlowBeauty', '#SummerGlow', '#KemChongNang', '#SkincareRoutine'],
    comments: [
      {
        id: 'c-1',
        timestamp: '00:15',
        author: 'Trang Nguyễn (Brand Lead)',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        text: 'Đoạn test độ thấm trên mu bàn tay rất đẹp! Nhưng hãy chèn text màng lọc quang phổ rộng ở góc dưới nhé.',
        resolved: true,
        createdAt: 'Hôm qua 15:20',
      },
      {
        id: 'c-2',
        timestamp: '00:42',
        author: 'Trang Nguyễn (Brand Lead)',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        text: 'Nhắc rõ hơn về quà tặng tặng kèm túi cói đi biển trước khi kết thúc video nha Linh.',
        resolved: false,
        createdAt: 'Hôm nay 10:05',
      },
    ],
  },
  {
    id: 'deliv-2',
    creatorId: 'col-2',
    creatorName: 'Minh Hoàng',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    title: '[Kịch bản chi tiết] Trải nghiệm chống nắng thể thao ngoài trời',
    version: 'Kịch bản Version 1',
    submittedAt: '29/09/2026 14:15',
    videoDuration: '00:45',
    status: 'revision_requested',
    captionDraft: 'Chạy bộ 10km dưới nắng gắt và cái kết kem chống nắng không hề cay mắt!',
    hashtags: ['#MinhHoang', '#RunningLifestyle', '#GlowBeauty'],
    comments: [
      {
        id: 'c-3',
        timestamp: '00:05',
        author: 'Hoàng Nam',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        text: 'Phần mở đầu cần quay cận cảnh tuýp kem chống nắng nổi bật hơn trước khi bắt đầu chạy bộ.',
        resolved: false,
        createdAt: '29/09/2026 16:30',
      },
    ],
  },
];

// Initial Fee Tracking Data
const INITIAL_FEES: FeeTrackingItem[] = [
  {
    id: 'fee-1',
    creatorName: 'Linh Nguyễn',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    totalFee: 15000000,
    depositAmount: 6000000,
    depositDate: '28/09/2026',
    depositStatus: 'paid',
    depositEvidence: 'UNC_MBBank_28092026_01.pdf',
    finalAmount: 9000000,
    finalDueDate: '15/10/2026',
    finalStatus: 'pending',
    bankAccount: '1903688888888',
    bankName: 'Techcombank - NGUYEN LINH',
  },
  {
    id: 'fee-2',
    creatorName: 'Minh Hoàng',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    totalFee: 12500000,
    depositAmount: 5000000,
    depositDate: '29/09/2026',
    depositStatus: 'paid',
    depositEvidence: 'UNC_Vietcombank_29092026_04.pdf',
    finalAmount: 7500000,
    finalDueDate: '18/10/2026',
    finalStatus: 'unpaid',
    bankAccount: '0071000889922',
    bankName: 'Vietcombank - TRAN MINH HOANG',
  },
  {
    id: 'fee-3',
    creatorName: 'Thảo Vy',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    totalFee: 8000000,
    depositAmount: 3200000,
    depositDate: '26/09/2026',
    depositStatus: 'paid',
    depositEvidence: 'UNC_ACB_26092026_08.pdf',
    finalAmount: 4800000,
    finalDueDate: '02/10/2026',
    finalStatus: 'paid',
    finalEvidence: 'UNC_ACB_FINAL_02102026.pdf',
    bankAccount: '1029384756',
    bankName: 'ACB - NGUYEN THAO VY',
  },
  {
    id: 'fee-4',
    creatorName: 'Bác sĩ Ngọc',
    creatorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80',
    totalFee: 18000000,
    depositAmount: 7200000,
    depositDate: '30/09/2026',
    depositStatus: 'paid',
    depositEvidence: 'UNC_MBBank_30092026_11.pdf',
    finalAmount: 10800000,
    finalDueDate: '22/10/2026',
    finalStatus: 'unpaid',
    bankAccount: '098877665544',
    bankName: 'MBBank - PHONG KHAM DA LIEU DR NGOC',
  },
];

// Initial KPI Entries
const INITIAL_KPIS: KpiEntryItem[] = [
  {
    id: 'kpi-1',
    creatorName: 'Thảo Vy',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    postLink: 'https://instagram.com/reel/C89xYzKlM1',
    postDate: '01/10/2026',
    views: 482000,
    likes: 38400,
    comments: 1820,
    clicks: 14200,
    orders: 380,
    revenue: 125400000,
    totalCost: 8000000,
  },
  {
    id: 'kpi-2',
    creatorName: 'Linh Nguyễn (Teaser Story)',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    postLink: 'https://tiktok.com/@linhnguyen/video/7281928371',
    postDate: '29/09/2026',
    views: 890000,
    likes: 74200,
    comments: 3100,
    clicks: 22800,
    orders: 620,
    revenue: 204600000,
    totalCost: 15000000,
  },
];

export default function CollaborationPage() {
  const navigate = useNavigate();
  const [campaignOptions, setCampaignOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
  const [loadingPartners, setLoadingPartners] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'review' | 'fees' | 'kpi'>('list');

  // Partners state
  const [partners, setPartners] = useState<CollabPartner[]>([]);
  const [partnerFilter, setPartnerFilter] = useState<'all' | 'in_progress' | 'review_pending' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const inProgressCount = partners.filter(
    (p) => p.stage !== 'review_pending' && p.stage !== 'published'
  ).length;
  const reviewPendingCount = partners.filter((p) => p.stage === 'review_pending').length;
  const publishedCount = partners.filter((p) => p.stage === 'published').length;

  const filteredPartners = partners.filter((p) => {
    const matchesFilter =
      partnerFilter === 'all'
        ? true
        : partnerFilter === 'in_progress'
        ? p.stage !== 'review_pending' && p.stage !== 'published'
        : p.stage === partnerFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.creatorName.toLowerCase().includes(q) ||
      p.handle.toLowerCase().includes(q) ||
      p.deliverableSummary.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Review state (Deliverables)
  const [deliverables, setDeliverables] = useState<DeliverableReviewItem[]>(INITIAL_DELIVERABLES);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>('deliv-1');
  const [timestampInput, setTimestampInput] = useState('00:24');
  const [newCommentText, setNewCommentText] = useState('');
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  // Creator Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [selectedPartnerForReview, setSelectedPartnerForReview] = useState<CollabPartner | null>(null);
  const [creatorReviewForm] = Form.useForm();

  // Fee state
  const [feeItems, setFeeItems] = useState<FeeTrackingItem[]>(INITIAL_FEES);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFeeItem, setSelectedFeeItem] = useState<FeeTrackingItem | null>(null);

  // KPI state
  const [kpiItems, setKpiItems] = useState<KpiEntryItem[]>(INITIAL_KPIS);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiSubmitting, setKpiSubmitting] = useState(false);
  const [kpiForm] = Form.useForm();

  // Load Campaigns on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const list = await campaignService.getCampaigns(0, 50);
        if (isMounted) {
          if (list && list.length > 0) {
            const opts = list.map((c) => ({
              value: c.id,
              label: `🌟 ${c.name}`,
            }));
            setCampaignOptions(opts);
            setSelectedCampaign(opts[0].value);
          } else {
            setCampaignOptions([]);
            setSelectedCampaign('');
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách chiến dịch:', err);
      } finally {
        if (isMounted) setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Relationships when selectedCampaign changes
  useEffect(() => {
    if (!selectedCampaign) {
      setPartners([]);
      return;
    }
    let isMounted = true;
    const fetchRelationships = async () => {
      try {
        setLoadingPartners(true);
        const rels = await campaignService.getRelationships(selectedCampaign);
        if (isMounted) {
          if (rels && rels.length > 0) {
            const stageMap: Record<string, CollabPartner['stage']> = {
              SHORTLISTED: 'contract_signed',
              CONTACTED: 'waiting_script',
              INTERESTED: 'waiting_video',
              COLLABORATING: 'review_pending',
              COMPLETED: 'published',
              NOT_INTERESTED: 'contract_signed',
            };
            const progressMap: Record<string, number> = {
              SHORTLISTED: 15,
              CONTACTED: 35,
              INTERESTED: 55,
              COLLABORATING: 75,
              COMPLETED: 100,
              NOT_INTERESTED: 0,
            };
            const mapped: CollabPartner[] = rels.map((r) => ({
              id: r.id,
              creatorName: r.creatorName || `Creator #${r.creatorId.substring(0, 6)}`,
              creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.creatorId}`,
              platform: 'tiktok',
              handle: `@${(r.creatorName || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              deliverableSummary: r.notes || '1 Video Reels/TikTok + 1 Story nghiệm thu',
              stage: stageMap[r.stage] || 'contract_signed',
              progressPercent: progressMap[r.stage] || 30,
              postDeadline: r.nextAction || 'Theo kế hoạch',
              picBrand: 'Trang Nguyễn (Brand Lead)',
              fee: r.agreedFee ? `${r.agreedFee.toLocaleString()} ₫` : (r.quotedFee ? `${r.quotedFee.toLocaleString()} ₫` : 'Thương lượng'),
              depositStatus: 'paid',
              finalStatus: r.stage === 'COMPLETED' ? 'paid' : 'pending',
            }));
            setPartners(mapped);
          } else {
            setPartners([]);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách đối tác:', err);
      } finally {
        if (isMounted) setLoadingPartners(false);
      }
    };
    fetchRelationships();
    return () => {
      isMounted = false;
    };
  }, [selectedCampaign]);

  const activeDeliverable = deliverables.find((d) => d.id === selectedDeliverableId) || deliverables[0];

  // Helper to load sample partners for demo
  const handleLoadDemoPartners = () => {
    setPartners(INITIAL_PARTNERS);
    message.success('Đã nạp 5 đối tác mẫu vào chiến dịch để thử nghiệm đầy đủ quy trình!');
  };

  // Add timestamp comment
  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newC = {
      id: `c-${Date.now()}`,
      timestamp: timestampInput,
      author: 'Trang Nguyễn (Brand Lead)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      text: newCommentText,
      resolved: false,
      createdAt: 'Vừa xong',
    };

    setDeliverables((prev) =>
      prev.map((d) => (d.id === activeDeliverable.id ? { ...d, comments: [...d.comments, newC] } : d))
    );
    setNewCommentText('');
    message.success(`Đã thêm nhận xét tại mốc ${timestampInput}!`);
  };

  // Approve deliverable
  const handleApproveDeliverable = () => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === activeDeliverable.id ? { ...d, status: 'approved' } : d))
    );
    // Also update partner stage to published / approved
    setPartners((prev) =>
      prev.map((p) =>
        p.id === activeDeliverable.creatorId
          ? { ...p, stage: 'published', progressPercent: 100 }
          : p
      )
    );
    message.success('🎉 Đã phê duyệt ấn phẩm! Thông báo và link xác nhận đã được gửi tới Creator.');
  };

  // Request revision
  const handleConfirmRevision = () => {
    if (!revisionFeedback.trim()) {
      message.error('Vui lòng nhập lý do hoặc chi tiết cần chỉnh sửa!');
      return;
    }

    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === activeDeliverable.id
          ? {
              ...d,
              status: 'revision_requested',
              comments: [
                ...d.comments,
                {
                  id: `rev-${Date.now()}`,
                  timestamp: '00:00',
                  author: 'Brand Feedback (Chỉnh sửa)',
                  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
                  text: `[Yêu cầu sửa]: ${revisionFeedback}`,
                  resolved: false,
                  createdAt: 'Vừa xong',
                },
              ],
            }
          : d
      )
    );
    message.warning('Đã gửi yêu cầu chỉnh sửa kèm nhận xét chi tiết tới Creator.');
    setRevisionModalOpen(false);
    setRevisionFeedback('');
  };

  // Save new KPI submission with API call
  const handleSaveKpiSubmit = async (values: any) => {
    try {
      setKpiSubmitting(true);
      const targetPartner = partners.find((p) => p.id === values.partnerId);
      const totalCost = values.totalCost || 10000000;
      const revenue = values.revenue || 0;

      // Call API outcome recording
      if (values.partnerId) {
        await collaborationService.recordOutcome(values.partnerId, {
          views: Number(values.views) || 0,
          clicks: Number(values.clicks) || 0,
          publishedContentUrl: values.postLink || '',
          resultNote: `Doanh thu: ${revenue.toLocaleString()}đ, Đơn hàng: ${values.orders || 0}`,
        }).catch((err) => {
          console.warn('API recordOutcome error (using fallback local entry):', err);
        });
      }

      const newKpi: KpiEntryItem = {
        id: `kpi-${Date.now()}`,
        creatorName: targetPartner?.creatorName || values.creatorName || 'Đối tác Creator',
        creatorAvatar: targetPartner?.creatorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=partner',
        platform: values.platform || 'tiktok',
        postLink: values.postLink || 'https://tiktok.com/@post',
        postDate: 'Hôm nay',
        views: Number(values.views) || 0,
        likes: Number(values.likes) || 0,
        comments: Number(values.comments) || 0,
        clicks: Number(values.clicks) || 0,
        orders: Number(values.orders) || 0,
        revenue: revenue,
        totalCost: totalCost,
      };

      setKpiItems([newKpi, ...kpiItems]);
      message.success('Đã lưu dữ liệu KPI nghiệm thu bài đăng thành công!');
      setKpiModalOpen(false);
      kpiForm.resetFields();
    } catch {
      message.error('Có lỗi xảy ra khi lưu KPI.');
    } finally {
      setKpiSubmitting(false);
    }
  };

  // Submit Creator Review after collaboration
  const handleReviewSubmit = async (values: any) => {
    if (!selectedPartnerForReview) return;
    try {
      setReviewSubmitting(true);
      await collaborationService.reviewCreator(selectedPartnerForReview.id, {
        overallRating: values.overallRating || 5,
        brandFitRating: values.brandFitRating || 5,
        wouldCollaborateAgain: values.wouldCollaborateAgain ?? true,
        note: values.note || '',
      });
      message.success(`Đã gửi đánh giá Creator ${selectedPartnerForReview.creatorName} thành công!`);
      setReviewModalOpen(false);
      creatorReviewForm.resetFields();
      setSelectedPartnerForReview(null);
    } catch (err: any) {
      console.error('Lỗi khi gửi đánh giá:', err);
      message.error(err?.response?.data?.message || 'Không thể gửi đánh giá lúc này.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Helpers for Stage tags
  const renderStageTag = (stage: CollabPartner['stage']) => {
    switch (stage) {
      case 'contract_signed':
        return <Tag color="default">1. Đã ký HĐ</Tag>;
      case 'waiting_script':
        return <Tag color="processing">2. Đợi kịch bản</Tag>;
      case 'waiting_video':
        return <Tag color="warning">3. Đợi video demo</Tag>;
      case 'review_pending':
        return <Tag color="purple" style={{ fontWeight: 700 }}>4. Cần duyệt bài</Tag>;
      case 'published':
        return <Tag color="success" style={{ fontWeight: 700 }}>5. Đã đăng bài</Tag>;
      default:
        return null;
    }
  };

  return (
    <div className="collaboration-page-container">
      {/* 1. Header Row */}
      <div className="collab-header-row">
        <div>
          <div className="collab-title-wrap">
            <h1 className="collab-main-title">Quản lý Vận hành & Hợp tác Creator</h1>
            <span className="collab-tagline">Tiến độ chuẩn • Duyệt bài nhanh • Minh bạch thù lao</span>
          </div>
          <div className="collab-description">
            Trung tâm điều phối toàn bộ các hợp đồng hợp tác: kiểm duyệt ấn phẩm theo mốc thời gian, đối soát thanh toán và nghiệm thu số liệu KPI thực tế.
          </div>
        </div>

        <div className="collab-header-actions">
          <div className="collab-campaign-selector">
            <span className="selector-label">Chiến dịch:</span>
            <Select
              value={selectedCampaign || undefined}
              onChange={setSelectedCampaign}
              loading={loadingCampaigns}
              placeholder="Chọn chiến dịch..."
              style={{ width: 280 }}
              options={campaignOptions}
              notFoundContent="Chưa có chiến dịch nào"
            />
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', borderRadius: 8, height: 38 }}
            onClick={() => setKpiModalOpen(true)}
          >
            Nhập kết quả KPI
          </Button>
        </div>
      </div>

      {/* 3. Funnel Stats Overview */}
      <div className="collab-stats-grid">
        <div className="c-stat-card">
          <div className="c-stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
            <FileDoneOutlined />
          </div>
          <div>
            <div className="c-stat-val">{partners.length} Đối tác</div>
            <div className="c-stat-lbl">Đang tiến hành hợp tác</div>
          </div>
        </div>

        <div className="c-stat-card">
          <div className="c-stat-icon" style={{ background: '#FAF5FF', color: '#9333EA' }}>
            <VideoCameraOutlined />
          </div>
          <div>
            <div className="c-stat-val">
              {partners.filter((p) => p.stage === 'review_pending').length} Ấn phẩm
            </div>
            <div className="c-stat-lbl">Đang chờ Brand duyệt</div>
          </div>
        </div>

        <div className="c-stat-card">
          <div className="c-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <DollarOutlined />
          </div>
          <div>
            <div className="c-stat-val">
              {partners.length === 0 ? '0 ₫' : '26.200.000 ₫'}
            </div>
            <div className="c-stat-lbl">
              {partners.length === 0 ? 'Chưa phát sinh giải ngân' : 'Đã giải ngân tạm ứng (49%)'}
            </div>
          </div>
        </div>

        <div className="c-stat-card">
          <div className="c-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <RiseOutlined />
          </div>
          <div>
            <div className="c-stat-val">
              {partners.length === 0 ? '0 Views' : '1.372.000 Views'}
            </div>
            <div className="c-stat-lbl">Tổng lượt xem thực tế ghi nhận</div>
          </div>
        </div>
      </div>

      {/* 4. Sub-tabs Navigation */}
      <div className="collab-tabs-bar">
        <button
          className={`collab-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <FileTextOutlined />
          <span>1. Danh sách tiến độ hợp tác</span>
          <span className="collab-tab-badge">{partners.length}</span>
        </button>

        <button
          className={`collab-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <VideoCameraOutlined />
          <span>2. Duyệt ấn phẩm (Deliverable Review)</span>
          <span className={`collab-tab-badge ${partners.length > 0 && deliverables.filter((d) => d.status === 'pending').length > 0 ? 'alert' : ''}`}>
            {partners.length === 0 ? '0 chờ duyệt' : `${deliverables.filter((d) => d.status === 'pending').length} chờ duyệt`}
          </span>
        </button>

        <button
          className={`collab-tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          <DollarOutlined />
          <span>3. Quản lý thù lao & Đối soát (Fee Tracking)</span>
          <span className="collab-tab-badge">{partners.length === 0 ? 0 : feeItems.length}</span>
        </button>

        <button
          className={`collab-tab-btn ${activeTab === 'kpi' ? 'active' : ''}`}
          onClick={() => setActiveTab('kpi')}
        >
          <BarChartOutlined />
          <span>4. Nghiệm thu KPI thực tế (KPI Entry)</span>
          <span className="collab-tab-badge success">{kpiItems.length} bài đăng</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: COLLABORATION LIST
          ========================================================================= */}
      {activeTab === 'list' && (
        <div className="collab-list-section">
          {/* Modern Filter Toolbar */}
          <div className="table-controls-row">
            <div className="collab-filter-left">
              <div className="collab-filter-label">
                <FilterOutlined style={{ fontSize: 13, color: '#6366F1' }} />
                <span>Tiến độ hợp tác:</span>
              </div>
              <div className="collab-pill-segmented">
                <button
                  type="button"
                  className={`collab-pill-btn ${partnerFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPartnerFilter('all')}
                >
                  <span>Tất cả</span>
                  <span className="collab-pill-count">{partners.length}</span>
                </button>

                <button
                  type="button"
                  className={`collab-pill-btn ${partnerFilter === 'in_progress' ? 'active' : ''}`}
                  onClick={() => setPartnerFilter('in_progress')}
                >
                  <span className="status-dot in-progress" />
                  <span>Đang thực hiện</span>
                  <span className="collab-pill-count">{inProgressCount}</span>
                </button>

                <button
                  type="button"
                  className={`collab-pill-btn ${partnerFilter === 'review_pending' ? 'active' : ''}`}
                  onClick={() => setPartnerFilter('review_pending')}
                >
                  <span className="status-dot pending" />
                  <span>Chờ duyệt bài</span>
                  {reviewPendingCount > 0 ? (
                    <span className="collab-pill-count alert">{reviewPendingCount}</span>
                  ) : (
                    <span className="collab-pill-count">0</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`collab-pill-btn ${partnerFilter === 'published' ? 'active' : ''}`}
                  onClick={() => setPartnerFilter('published')}
                >
                  <span className="status-dot published" />
                  <span>Đã đăng tải</span>
                  <span className={`collab-pill-count ${publishedCount > 0 ? 'success' : ''}`}>
                    {publishedCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Search Input & counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Tìm tên creator, handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                className="collab-search-input"
              />
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Hiển thị {filteredPartners.length}/{partners.length}
              </span>
            </div>
          </div>

          <div className="collab-table-card">
            <table className="collab-table">
              <thead>
                <tr>
                  <th>Creator đối tác</th>
                  <th>Ấn phẩm cam kết</th>
                  <th>Giai đoạn tiến độ</th>
                  <th>Tiến trình</th>
                  <th>Hạn đăng bài</th>
                  <th>Thù lao</th>
                  <th>Phụ trách</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loadingPartners ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0' }}>
                      <Spin description="Đang tải dữ liệu đối tác hợp tác..." />
                    </td>
                  </tr>
                ) : filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0' }}>
                      {partners.length === 0 ? (
                        <Empty
                          description={
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#475569', fontSize: 13.5, fontWeight: 600 }}>
                                Chiến dịch này chưa có Creator nào được kết nối trong database.
                              </span>
                              <span style={{ color: '#94A3B8', fontSize: 12, maxWidth: 460 }}>
                                Dữ liệu đang kết nối trực tiếp với API backend (GET /campaigns/:id/relationships). Bạn có thể tìm và mời Creator, hoặc nạp đối tác mẫu để thử nghiệm.
                              </span>
                              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                <Button
                                  type="primary"
                                  icon={<SearchOutlined />}
                                  onClick={() => navigate('/creators')}
                                  style={{ background: '#4F46E5', borderRadius: 8, height: 36 }}
                                >
                                  Khám phá Creator để mời hợp tác
                                </Button>
                                <Button
                                  onClick={handleLoadDemoPartners}
                                  style={{ borderRadius: 8, borderColor: '#CBD5E1', height: 36 }}
                                >
                                  ⚡ Nạp đối tác mẫu (Demo)
                                </Button>
                              </div>
                            </div>
                          }
                        />
                      ) : (
                        <Empty
                          description={
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                                Không có đối tác nào phù hợp với bộ lọc hiện tại.
                              </span>
                              <Button
                                size="small"
                                onClick={() => {
                                  setPartnerFilter('all');
                                  setSearchQuery('');
                                }}
                                style={{ borderRadius: 8 }}
                              >
                                Đặt lại bộ lọc
                              </Button>
                            </div>
                          }
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={p.creatorAvatar} alt={p.creatorName} className="collab-avatar" />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>{p.creatorName}</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>{p.handle}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 12.5, color: '#334155' }}>{p.deliverableSummary}</span>
                        </td>
                        <td>{renderStageTag(p.stage)}</td>
                        <td style={{ width: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Progress
                              percent={p.progressPercent}
                              size="small"
                              strokeColor={p.progressPercent === 100 ? '#10B981' : '#4F46E5'}
                            />
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>📅 {p.postDeadline}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{p.fee}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 11.5, color: '#64748B' }}>{p.picBrand}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {p.stage === 'review_pending' && (
                              <Button
                                size="small"
                                type="primary"
                                style={{ background: '#7C3AED' }}
                                onClick={() => {
                                  setSelectedDeliverableId('deliv-1');
                                  setActiveTab('review');
                                }}
                              >
                                Duyệt bài ngay
                              </Button>
                            )}
                            {p.stage === 'published' && (
                              <>
                                <Button
                                  size="small"
                                  style={{ color: '#10B981', borderColor: '#A7F3D0' }}
                                  onClick={() => setActiveTab('kpi')}
                                >
                                  Xem KPI
                                </Button>
                                <Button
                                  size="small"
                                  icon={<StarFilled style={{ color: '#F59E0B' }} />}
                                  style={{ color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB' }}
                                  onClick={() => {
                                    setSelectedPartnerForReview(p);
                                    setReviewModalOpen(true);
                                  }}
                                >
                                  Đánh giá
                                </Button>
                              </>
                            )}
                            <Button size="small" onClick={() => setActiveTab('fees')}>
                              Đối soát
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DELIVERABLE REVIEW (TIMESTAMP COMMENTS & APPROVAL)
          ========================================================================= */}
      {activeTab === 'review' && (
        <div className="collab-review-grid">
          {/* Left: Deliverables List */}
          <div className="review-sidebar-card">
            <div className="sidebar-header-title">Danh sách bài nộp cần duyệt</div>
            <div className="deliverable-items-list">
              {deliverables.map((item) => (
                <div
                  key={item.id}
                  className={`deliverable-card-item ${selectedDeliverableId === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedDeliverableId(item.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={item.creatorAvatar} alt={item.creatorName} className="deliverable-avatar" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{item.creatorName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{item.version}</div>
                    </div>
                  </div>
                  <div className="item-title-preview">{item.title}</div>
                  <div className="item-bottom-meta">
                    <span style={{ fontSize: 10.5, color: '#94A3B8' }}>Nộp: {item.submittedAt}</span>
                    {item.status === 'pending' && <Tag color="purple">Chờ duyệt</Tag>}
                    {item.status === 'revision_requested' && <Tag color="warning">Cần sửa</Tag>}
                    {item.status === 'approved' && <Tag color="success">Đã duyệt</Tag>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mock Video Player & Timestamp Feedback */}
          <div className="review-main-card">
            <div className="review-player-top">
              <div>
                <h3 className="review-content-title">{activeDeliverable.title}</h3>
                <div className="review-meta-row">
                  <span>Creator: <strong>{activeDeliverable.creatorName}</strong></span>
                  <span>•</span>
                  <span>Thời lượng: <strong>{activeDeliverable.videoDuration}</strong></span>
                  <span>•</span>
                  <span>{activeDeliverable.version}</span>
                </div>
              </div>

              <div className="review-top-action-buttons">
                {activeDeliverable.status !== 'approved' ? (
                  <>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => setRevisionModalOpen(true)}
                    >
                      Yêu cầu chỉnh sửa
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      style={{ background: '#10B981', borderRadius: 8 }}
                      onClick={handleApproveDeliverable}
                    >
                      Phê duyệt video này ✓
                    </Button>
                  </>
                ) : (
                  <Tag color="success" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
                    ✅ Đã phê duyệt xuất bản
                  </Tag>
                )}
              </div>
            </div>

            {/* Video Mockup Player */}
            <div className="video-player-mockup">
              <div className="player-screen">
                <div className="video-inner-watermark">
                  <PlayCircleOutlined style={{ fontSize: 56, color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }} />
                  <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15, color: '#FFFFFF' }}>
                    {activeDeliverable.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    Bấm để phát video demo • Khung hình 9:16 dọc
                  </div>
                </div>

                {/* Timeline Bar */}
                <div className="player-timeline-bar">
                  <div className="timeline-progress-fill" style={{ width: '45%' }} />
                  {/* Timestamp Comment Pin */}
                  <div className="timeline-pin" style={{ left: '28%' }} title="00:15 - Góp ý logo" />
                  <div className="timeline-pin" style={{ left: '78%' }} title="00:42 - Góp ý CTA" />
                </div>
              </div>

              {/* Caption & Hashtag Preview */}
              <div className="caption-preview-box">
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                  Nội dung Caption đăng bài dự kiến:
                </div>
                <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.4 }}>
                  {activeDeliverable.captionDraft}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {activeDeliverable.hashtags.map((tag) => (
                    <span key={tag} className="caption-hashtag-chip">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Timestamp Comments Thread */}
            <div className="timestamp-comments-container">
              <div className="comments-section-title">
                <MessageOutlined style={{ color: '#4F46E5' }} />
                <span>Nhận xét theo mốc thời gian (Timestamp Feedback)</span>
              </div>

              {/* Add Comment Bar */}
              <div className="add-timestamp-row">
                <div className="timestamp-pill-input">
                  <span>Mốc:</span>
                  <Input
                    value={timestampInput}
                    onChange={(e) => setTimestampInput(e.target.value)}
                    style={{ width: 65, textAlign: 'center', borderRadius: 6, height: 32 }}
                    placeholder="00:00"
                  />
                </div>
                <Input
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Nhập nhận xét (vd: Ở giây 00:15 cần tăng độ sáng sản phẩm...)"
                  style={{ borderRadius: 8, height: 36 }}
                  onPressEnter={handleAddComment}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddComment}
                  style={{ background: '#4F46E5', borderRadius: 8, height: 36 }}
                >
                  Gửi góp ý
                </Button>
              </div>

              {/* Comments List */}
              <div className="comments-list">
                {activeDeliverable.comments.map((comm) => (
                  <div key={comm.id} className="comment-bubble-item">
                    <img src={comm.avatar} alt={comm.author} className="comment-avatar" />
                    <div className="comment-body">
                      <div className="comment-top-row">
                        <span className="comment-timestamp-tag">⏱️ {comm.timestamp}</span>
                        <span className="comment-author">{comm.author}</span>
                        <span className="comment-time">{comm.createdAt}</span>
                      </div>
                      <div className="comment-text">{comm.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FEE TRACKING (ĐỐI SOÁT & THANH TOÁN)
          ========================================================================= */}
      {activeTab === 'fees' && (
        <div className="collab-fees-section">
          {/* Summary Box */}
          <div className="fees-summary-banner">
            <div className="fee-sum-col">
              <span className="fee-sum-lbl">Tổng ngân sách thỏa thuận</span>
              <span className="fee-sum-val">53.500.000 ₫</span>
            </div>
            <div className="fee-sum-col">
              <span className="fee-sum-lbl">Đã tạm ứng (Đợt 1 - Cọc)</span>
              <span className="fee-sum-val" style={{ color: '#10B981' }}>21.400.000 ₫ (100% đã cọc)</span>
            </div>
            <div className="fee-sum-col">
              <span className="fee-sum-lbl">Đã quyết toán đợt cuối</span>
              <span className="fee-sum-val" style={{ color: '#3B82F6' }}>4.800.000 ₫ (Thảo Vy)</span>
            </div>
            <div className="fee-sum-col">
              <span className="fee-sum-lbl">Còn phải trả sau nghiệm thu</span>
              <span className="fee-sum-val" style={{ color: '#F59E0B' }}>27.300.000 ₫</span>
            </div>
          </div>

          {/* Table */}
          <div className="collab-table-card">
            <table className="collab-table">
              <thead>
                <tr>
                  <th>Creator đối tác</th>
                  <th>Tổng thù lao</th>
                  <th>Đợt 1: Tạm ứng (40%)</th>
                  <th>Bằng chứng UNC Đợt 1</th>
                  <th>Đợt 2: Quyết toán (60%)</th>
                  <th>Thông tin tài khoản nhận</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={f.creatorAvatar} alt={f.creatorName} className="collab-avatar" />
                        <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>{f.creatorName}</div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: 13.5, color: '#4F46E5' }}>
                        {f.totalFee.toLocaleString('vi-VN')} ₫
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{f.depositAmount.toLocaleString('vi-VN')} ₫</div>
                      <Tag color="success" style={{ marginTop: 2 }}>✓ Đã cọc {f.depositDate}</Tag>
                    </td>
                    <td>
                      {f.depositEvidence ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            message.info(`Đang mở xem chứng từ: ${f.depositEvidence}`);
                          }}
                          style={{ fontSize: 11.5, color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <FileTextOutlined /> {f.depositEvidence}
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>Chưa có file</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{f.finalAmount.toLocaleString('vi-VN')} ₫</div>
                      {f.finalStatus === 'paid' && <Tag color="success">✓ Đã tất toán</Tag>}
                      {f.finalStatus === 'pending' && <Tag color="purple">⏳ Chờ duyệt bài xong</Tag>}
                      {f.finalStatus === 'unpaid' && <Tag color="default">Chưa tới hạn</Tag>}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{f.bankAccount}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{f.bankName}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button
                          size="small"
                          icon={<UploadOutlined />}
                          onClick={() => {
                            setSelectedFeeItem(f);
                            setUploadModalOpen(true);
                          }}
                        >
                          Upload UNC
                        </Button>
                        {f.finalStatus === 'pending' && (
                          <Button
                            size="small"
                            type="primary"
                            style={{ background: '#10B981' }}
                            onClick={() => {
                              message.success(`Đã xác nhận thanh toán đợt cuối ${f.finalAmount.toLocaleString('vi-VN')} ₫ cho ${f.creatorName}!`);
                              setFeeItems((prev) =>
                                prev.map((item) => (item.id === f.id ? { ...item, finalStatus: 'paid' } : item))
                              );
                            }}
                          >
                            Tất toán
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: KPI ENTRY & RESULTS
          ========================================================================= */}
      {activeTab === 'kpi' && (
        <div className="collab-kpi-section">
          {/* Header Action */}
          <div className="kpi-controls-bar">
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                Bảng Nghiệm thu Số liệu Hiệu suất Thực tế
              </h3>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Đối soát lượt xem, tương tác, đơn hàng và doanh thu sau khi bài đăng lên sóng
              </div>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#4F46E5', borderRadius: 8 }}
              onClick={() => setKpiModalOpen(true)}
            >
              Nhập số liệu bài đăng mới
            </Button>
          </div>

          <div className="collab-table-card">
            <table className="collab-table">
              <thead>
                <tr>
                  <th>Creator & Link bài đăng</th>
                  <th>Lượt xem (Views)</th>
                  <th>Tương tác (Likes/Comments)</th>
                  <th>Lượt nhấp (Clicks)</th>
                  <th>Đơn hàng (Orders)</th>
                  <th>Doanh thu phát sinh</th>
                  <th>Chi phí (Cost)</th>
                  <th>ROI ước tính</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {kpiItems.map((item) => {
                  const roiPercent = Math.round(((item.revenue - item.totalCost) / item.totalCost) * 100);
                  const cpo = Math.round(item.totalCost / (item.orders || 1));
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={item.creatorAvatar} alt={item.creatorName} className="collab-avatar" />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>{item.creatorName}</div>
                            <a
                              href={item.postLink}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 11, color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                            >
                              <LinkOutlined /> Xem bài viết thực tế
                            </a>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: 13.5 }}>{item.views.toLocaleString('vi-VN')}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#059669' }}>
                          {item.likes.toLocaleString('vi-VN')} likes
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{item.comments} bình luận</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{item.clicks.toLocaleString('vi-VN')}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#D97706' }}>
                          📦 {item.orders} đơn
                        </span>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>
                          CPO: {cpo.toLocaleString('vi-VN')} ₫/đơn
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: 14, color: '#16A34A' }}>
                          {item.revenue.toLocaleString('vi-VN')} ₫
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, color: '#64748B' }}>
                          {item.totalCost.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>
                      <td>
                        <Tag color={roiPercent >= 0 ? 'success' : 'error'} style={{ fontWeight: 800, fontSize: 12 }}>
                          {roiPercent >= 0 ? `+${roiPercent}%` : `${roiPercent}%`}
                        </Tag>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            kpiForm.setFieldsValue(item);
                            setKpiModalOpen(true);
                          }}
                        >
                          Chỉnh sửa
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: YÊU CẦU CHỈNH SỬA BÀI VIẾT (REVISION)
          ========================================================================= */}
      <Modal
        title={`Yêu cầu chỉnh sửa: ${activeDeliverable?.creatorName}`}
        open={revisionModalOpen}
        onCancel={() => setRevisionModalOpen(false)}
        onOk={handleConfirmRevision}
        okText="Gửi yêu cầu chỉnh sửa"
        okType="danger"
        cancelText="Hủy"
      >
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>
            Vui lòng tóm tắt các điểm cần Creator quay lại hoặc chỉnh sửa trước khi xuất bản:
          </div>
          <Input.TextArea
            rows={4}
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="Ví dụ: Đoạn đầu cần làm sáng rõ hộp sản phẩm, bổ sung hashtag #GlowBeauty vào caption..."
          />
        </div>
      </Modal>

      {/* =========================================================================
          MODAL: TẢI LÊN ỦY NHIỆM CHI (UNC)
          ========================================================================= */}
      <Modal
        title={`Tải lên Bằng chứng Thanh toán: ${selectedFeeItem?.creatorName}`}
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        onOk={() => {
          message.success('Đã tải lên UNC và lưu vào hồ sơ đối soát!');
          setUploadModalOpen(false);
        }}
        okText="Lưu chứng từ"
        cancelText="Hủy"
      >
        <div style={{ marginTop: 14 }}>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            <div><strong>Creator:</strong> {selectedFeeItem?.creatorName}</div>
            <div><strong>Số tài khoản:</strong> {selectedFeeItem?.bankAccount} ({selectedFeeItem?.bankName})</div>
          </div>

          <Upload.Dragger style={{ padding: 20 }}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 32, color: '#4F46E5' }} />
            </p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả file UNC/Hóa đơn ngân hàng vào đây</p>
            <p className="ant-upload-hint">Hỗ trợ định dạng PDF, PNG, JPG (Tối đa 5MB)</p>
          </Upload.Dragger>
        </div>
      </Modal>

      {/* =========================================================================
          MODAL: NHẬP SỐ LIỆU KPI BÀI ĐĂNG
          ========================================================================= */}
      <Modal
        title="Nhập Số liệu Nghiệm thu KPI Bài đăng Thực tế"
        open={kpiModalOpen}
        onCancel={() => setKpiModalOpen(false)}
        footer={null}
        width={580}
      >
        <Form form={kpiForm} layout="vertical" onFinish={handleSaveKpiSubmit} style={{ marginTop: 14 }}>
          {partners.length > 0 ? (
            <Form.Item name="partnerId" label="Chọn Creator đối tác trong chiến dịch" initialValue={partners[0]?.id}>
              <Select
                options={partners.map((p) => ({
                  value: p.id,
                  label: `${p.creatorName} (${p.handle}) - ${p.fee}`,
                }))}
              />
            </Form.Item>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Form.Item
                name="creatorName"
                label="Tên Creator"
                rules={[{ required: true, message: 'Nhập tên creator!' }]}
                initialValue="Linh Nguyễn"
              >
                <Input placeholder="Tên creator..." />
              </Form.Item>

              <Form.Item name="platform" label="Nền tảng đăng bài" initialValue="tiktok">
                <Select
                  options={[
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'youtube', label: 'YouTube' },
                  ]}
                />
              </Form.Item>
            </div>
          )}

          <Form.Item
            name="postLink"
            label="Đường link bài đăng thực tế (URL)"
            rules={[{ required: true, message: 'Nhập đường link bài đăng!' }]}
            initialValue="https://tiktok.com/@creator/video/1"
          >
            <Input prefix={<LinkOutlined />} placeholder="https://tiktok.com/@..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Form.Item name="views" label="Lượt xem thực tế (Views)" initialValue={650000}>
              <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>

            <Form.Item name="likes" label="Lượt thích (Likes)" initialValue={42000}>
              <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="comments" label="Bình luận" initialValue={1850}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="clicks" label="Lượt click bio" initialValue={12400}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="orders" label="Đơn hàng chốt" initialValue={420}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Form.Item name="revenue" label="Doanh số phát sinh (VND)" initialValue={138600000}>
              <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>

            <Form.Item name="totalCost" label="Tổng chi phí thù lao (VND)" initialValue={15000000}>
              <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setKpiModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={kpiSubmitting}
              style={{ background: '#4F46E5', borderRadius: 8 }}
            >
              Lưu số liệu nghiệm thu
            </Button>
          </div>
        </Form>
      </Modal>

      {/* =========================================================================
          MODAL: ĐÁNH GIÁ CREATOR SAU CHIẾN DỊCH
          ========================================================================= */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarFilled style={{ color: '#F59E0B', fontSize: 18 }} />
            <span>Đánh giá kết quả hợp tác với Creator</span>
          </div>
        }
        open={reviewModalOpen}
        onCancel={() => {
          setReviewModalOpen(false);
          creatorReviewForm.resetFields();
          setSelectedPartnerForReview(null);
        }}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form
          form={creatorReviewForm}
          layout="vertical"
          onFinish={handleReviewSubmit}
          initialValues={{ overallRating: 5, brandFitRating: 5, wouldCollaborateAgain: true }}
          style={{ marginTop: 14 }}
        >
          {selectedPartnerForReview && (
            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedPartnerForReview.creatorName}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{selectedPartnerForReview.deliverableSummary}</div>
            </div>
          )}

          <Form.Item
            name="overallRating"
            label="Đánh giá tổng thể (Overall Rating)"
            rules={[{ required: true, message: 'Vui lòng chọn số sao đánh giá!' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="brandFitRating"
            label="Độ phù hợp thương hiệu & sản phẩm (Brand Fit)"
            rules={[{ required: true, message: 'Vui lòng đánh giá độ phù hợp!' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="wouldCollaborateAgain"
            label="Sẵn sàng tái hợp tác trong các chiến dịch tiếp theo?"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value={true}>Có, rất sẵn sàng</Radio>
              <Radio value={false}>Cần cân nhắc thêm</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="note"
            label="Nhận xét chi tiết về tác phong, đúng hạn và chất lượng nội dung"
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Creator giao bài đúng deadline, tương tác bình luận nhiệt tình, hình ảnh sắc nét..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setReviewModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={reviewSubmitting}
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: 8 }}
            >
              Gửi đánh giá
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
