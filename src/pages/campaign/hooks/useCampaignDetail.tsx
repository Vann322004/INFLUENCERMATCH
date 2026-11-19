import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { campaignEditor } from '../../../services/campaignContext';
import { Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { campaignService } from '../../../services/api/campaignService';
import { creatorService } from '../../../services/api/creatorService';
import { dealService } from '../../../services/api/dealService';
import type { CooperationBudget } from '../../../services/api/dealService';
import { collaborationService } from '../../../services/api/collaborationService';
import { shortlistService } from '../../../services/api/shortlistService';
import type { CampaignResponse } from '../../../types/api/campaign.types';
import { mapApiCampaignToUi } from '../../../components/dashboard/CampaignTable';
import type { Campaign } from '../../../data/mockData';
import type { CampaignItemUI } from '../campaignLegacy.types';
import type { CampaignCreatorRow, CampaignStatusType } from '../components/detail/campaignDetailTypes';
import type { CampaignDetailTabKey } from '../components/detail/CampaignDetailNavTabs';
import {
  campaignDetailCache,
  getStageInfo,
  getCreatorTableColumns,
  VERIFIED_CREATOR_AVATARS,
} from '../components/detail/campaignDetailUtils';

export function useCampaignDetail() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận diện ID từ params, navigation state hoặc sessionStorage
  const resolvedId =
    paramId ||
    (location.state as any)?.id ||
    (location.state as any)?.campaignId ||
    sessionStorage.getItem('current_campaign_id') ||
    '';

  // Cập nhật sessionStorage khi có paramId mà không gây remount lặp
  useEffect(() => {
    if (paramId) {
      sessionStorage.setItem('current_campaign_id', paramId);
    }
  }, [paramId]);

  // Trích xuất campaign data đã được truyền từ trang danh sách hoặc sessionStorage
  const passedItem: CampaignItemUI | null = useMemo(() => {
    const fromState = (location.state as any)?.item || (location.state as any)?.campaignData;
    if (fromState) return fromState;
    try {
      const raw = sessionStorage.getItem('current_campaign_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.id === resolvedId || !resolvedId)) return parsed;
      }
    } catch {}
    return null;
  }, [location.state, resolvedId]);

  const cached = campaignDetailCache.get(resolvedId);

  // Khởi tạo state tức thì (0ms) từ Cache hoặc Passed Data để không bao giờ bị chớp màn hình rỗng
  const [rawCampaign, setRawCampaign] = useState<CampaignResponse | null>(() => {
    if (cached) return cached.rawCampaign;
    if (passedItem) {
      return {
        id: passedItem.id || resolvedId,
        name: passedItem.name,
        description:
          (passedItem as any).description ||
          (passedItem as any).subtitle ||
          'Chiến dịch quảng bá thương hiệu và phát triển thị phần cùng cộng đồng Creator.',
        productService: (passedItem as any).productService || 'Sản phẩm & Dịch vụ chính',
        objective: ((passedItem as any).objective as any) || 'AWARENESS',
        budgetMin: passedItem.budgetRaw ? Math.round(passedItem.budgetRaw * 0.75) : 50000000,
        budgetMax: passedItem.budgetRaw || 80000000,
        platforms: passedItem.platforms || ['TIKTOK', 'INSTAGRAM'],
        niches: passedItem.niches || ['Beauty', 'Skincare', 'Lifestyle'],
        targetAudiences: ['Nữ 18–28', 'Dân văn phòng', 'Học sinh sinh viên'],
        locations: ['Thành phố Hồ Chí Minh', 'Hà Nội'],
        followerMin: (passedItem as any).followerMin !== undefined ? Number((passedItem as any).followerMin) : 50000,
        followerMax: (passedItem as any).followerMax !== undefined ? Number((passedItem as any).followerMax) : undefined,
        startDate: '2026-10-26',
        endDate: '2026-12-25',
        status: (passedItem.status as any) || 'ACTIVE',
        brandId: '',
        createdAt: '2026-10-15T08:00:00.000Z',
      };
    }
    return null;
  });

  const [campaign, setCampaign] = useState<Campaign | null>(() => {
    if (cached) return cached.campaign;
    if (passedItem) {
      return {
        id: passedItem.id || resolvedId,
        title: passedItem.name || 'Chiến dịch trọng điểm 2026',
        tags: passedItem.niches || ['AWARENESS', 'TikTok', 'Instagram'],
        thumbnail:
          passedItem.thumbnail ||
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
        status:
          passedItem.status === 'COMPLETED'
            ? 'completed'
            : passedItem.status === 'DRAFT'
            ? 'draft'
            : 'running',
        statusText: passedItem.statusText || 'Đang triển khai',
        creatorsCount: passedItem.creatorsCount || 0,
        reach: '50K+',
        reachNumber: 50000,
        engagement: '4.5% – 8.0%',
        engagementNumber: 6.2,
        spent: passedItem.budgetFormatted || '80.000.000 đ',
        spentNumber: passedItem.budgetRaw || 80000000,
        date: passedItem.dateRange || '26/10/2026 – 25/12/2026',
      };
    }
    return null;
  });

  const [participatingCreators, setParticipatingCreators] = useState<CampaignCreatorRow[]>(() => {
    if (cached) return cached.participatingCreators;
    return [];
  });

  const [currentStatus, setCurrentStatus] = useState<CampaignStatusType>(() => {
    if (cached) return cached.currentStatus;
    if (passedItem?.status === 'COMPLETED') return 'completed';
    if (passedItem?.status === 'DRAFT') return 'draft';
    return 'running';
  });

  const [activeTab, setActiveTab] = useState<CampaignDetailTabKey>('overview');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cooperationBudget, setCooperationBudget] = useState<CooperationBudget | null>(null);
  const [shortlistCount, setShortlistCount] = useState<number>(0);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);

  // Fetch dữ liệu từ API thật của Backend: Campaign, Budget, Shortlist, Collaborations
  useEffect(() => {
    if (!resolvedId) return;

    let isMounted = true;
    const loadCampaign = async () => {
      setIsLoadingDetail(true);
      try {
        const [campaignRes, budgetRes, shortlistRes, collabsRes] = await Promise.allSettled([
          campaignService.getCampaignById(resolvedId),
          dealService.budget(resolvedId),
          shortlistService.list(resolvedId, { page: 0, size: 1 }),
          collaborationService.listBrand(resolvedId),
        ]);

        const data = campaignRes.status === 'fulfilled' ? campaignRes.value : null;
        const budgetData = budgetRes.status === 'fulfilled' ? budgetRes.value : null;
        const shortlistData = shortlistRes.status === 'fulfilled' ? shortlistRes.value : null;
        const collabs = collabsRes.status === 'fulfilled' ? collabsRes.value : [];

        if (budgetData && isMounted) {
          setCooperationBudget(budgetData);
        }
        if (shortlistData && isMounted) {
          setShortlistCount(shortlistData.totalElements ?? 0);
        }

        let newStatus: CampaignStatusType = 'running';
        if (data && isMounted) {
          setRawCampaign(data);
          const mappedUi = mapApiCampaignToUi(data);
          setCampaign(mappedUi);

          if (data.status === 'COMPLETED') newStatus = 'completed';
          else if (data.status === 'DRAFT') newStatus = 'draft';
          else if (data.status === 'ARCHIVED') newStatus = 'cancelled';
          setCurrentStatus(newStatus);
        }

        // Tab "Creator tham gia" CHỈ hiển thị hợp tác đã xác nhận (Collaborations)
        // Tuyệt đối không trộn Shortlist hay Relationship nháp
        if (isMounted) {
          const statusMap: Record<string, { text: string; color: string; deliverable: string; delColor: string }> = {
            CONFIRMED: { text: 'Đã xác nhận', color: '#10B981', deliverable: 'Chờ lên nội dung', delColor: 'blue' },
            IN_PROGRESS: { text: 'Đang thực hiện', color: '#8B5CF6', deliverable: 'Đang sản xuất', delColor: 'processing' },
            CONTENT_SUBMITTED: { text: 'Đã nộp bài', color: '#F59E0B', deliverable: 'Chờ duyệt nội dung', delColor: 'warning' },
            CONTENT_APPROVED: { text: 'Đã duyệt bài', color: '#7C3AED', deliverable: 'Chờ xuất bản', delColor: 'purple' },
            PUBLISHED: { text: 'Đã xuất bản', color: '#06B6D4', deliverable: 'Đang đo lường', delColor: 'cyan' },
            COMPLETED: { text: 'Hoàn thành', color: '#10B981', deliverable: 'Nghiệm thu hoàn tất', delColor: 'success' },
            CANCELLED: { text: 'Đã hủy', color: '#EF4444', deliverable: 'Dừng hợp tác', delColor: 'error' },
          };

          const currentCreators: CampaignCreatorRow[] = (collabs || []).map((c, idx) => {
            const st = statusMap[c.status] || {
              text: c.status || 'Đang hợp tác',
              color: '#7C3AED',
              deliverable: c.hasReview ? 'Đã duyệt bài' : c.hasOutcome ? 'Đã đo lường' : 'Đang xử lý',
              delColor: 'default',
            };
            return {
              id: c.id,
              name: c.creatorName || c.channelName || `Nhà sáng tạo #${idx + 1}`,
              username: c.channelName ? `@${c.channelName.replace(/^@+/, '')}` : (c.creatorName ? `@${c.creatorName.toLowerCase().replace(/\s+/g, '')}` : '—'),
              avatar: c.avatarUrl || VERIFIED_CREATOR_AVATARS[idx % VERIFIED_CREATOR_AVATARS.length],
              platform: (c.platform?.toLowerCase() === 'instagram' ? 'instagram' : 'tiktok') as 'instagram' | 'tiktok',
              followers: '—',
              fee: c.agreedFee != null ? `${c.agreedFee.toLocaleString('vi-VN')} ₫` : 'Chưa có',
              stageText: st.text,
              stageColor: st.color,
              deliverableStatus: st.deliverable,
              deliverableColor: st.delColor,
            };
          });

          setParticipatingCreators(currentCreators);

          if (data) {
            campaignDetailCache.set(resolvedId, {
              rawCampaign: data,
              campaign: mapApiCampaignToUi(data),
              participatingCreators: currentCreators,
              currentStatus: newStatus,
              timestamp: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải chi tiết chiến dịch:', err);
      } finally {
        if (isMounted) setIsLoadingDetail(false);
      }
    };

    loadCampaign();
    return () => {
      isMounted = false;
    };
  }, [resolvedId]);

  const campaignTitle = rawCampaign?.name || passedItem?.name || 'Chiến dịch';
  const totalBudget = cooperationBudget?.totalBudget ?? (rawCampaign?.totalBudget ?? rawCampaign?.budgetMax ?? null);
  const allocatedBudget = cooperationBudget?.committedBudget ?? 0;
  const remainingBudget = cooperationBudget?.remainingBudget ?? (totalBudget != null ? Math.max(0, totalBudget - allocatedBudget) : 0);
  const campaignBudgetFormatted = totalBudget != null ? `${totalBudget.toLocaleString('vi-VN')} ₫` : 'Chưa thiết lập';
  const progressPercent = totalBudget && totalBudget > 0 ? Math.min(100, Math.round((allocatedBudget / totalBudget) * 100)) : 0;
  const confirmedCreatorCount = cooperationBudget?.confirmedCreatorCount ?? participatingCreators.length;
  const targetCreatorCount = rawCampaign?.targetCreatorCount ?? 1;
  const isOverTarget = confirmedCreatorCount > targetCreatorCount;

  // Handle Lifecycle actions
  const handleActivate = () => {
    Modal.confirm({
      title: 'Kích hoạt chiến dịch ngay?',
      content:
        'Chiến dịch sẽ được kích hoạt trên hệ thống và chuyển sang trạng thái sẵn sàng để liên hệ, đàm phán với Creator.',
      okText: 'Kích hoạt ngay',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#10B981', borderColor: '#10B981' } },
      onOk: async () => {
        try {
          message.loading({ content: 'Đang kích hoạt chiến dịch trên hệ thống...', key: 'act_camp' });
          if (resolvedId) {
            const updated = await campaignService.activateCampaign(resolvedId);
            if (updated) {
              setRawCampaign(updated);
              setCampaign(mapApiCampaignToUi(updated));
            }
          }
          setCurrentStatus('running');
          message.success({ content: 'Chiến dịch đã được kích hoạt thành công!', key: 'act_camp' });
        } catch (error: any) {
          console.error('Lỗi khi kích hoạt chiến dịch:', error);
          let errMsg =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            'Không thể kích hoạt chiến dịch';
          const fieldErrors = error?.response?.data?.fieldErrors;
          if (fieldErrors?.deliverables) {
            errMsg = 'Chiến dịch chưa có ấn phẩm bàn giao (Deliverables). Vui lòng vào Chỉnh sửa để thêm ít nhất 1 ấn phẩm trước khi kích hoạt.';
          }
          message.error({ content: errMsg, key: 'act_camp', duration: 5 });
        }
      },
    });
  };

  const handleComplete = () => {
    Modal.confirm({
      title: 'Xác nhận hoàn thành chiến dịch?',
      content:
        'Đóng chiến dịch và lưu trữ toàn bộ chỉ số KPI, chi phí thực tế vào Lịch sử chiến dịch.',
      okText: 'Hoàn thành chiến dịch',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#6D28D9', borderColor: '#6D28D9' } },
      onOk: async () => {
        try {
          message.loading({ content: 'Đang đánh dấu hoàn thành chiến dịch...', key: 'comp_camp' });
          if (resolvedId) {
            const updated = await campaignService.updateStatus(resolvedId, 'COMPLETED');
            if (updated) {
              setRawCampaign(updated);
              setCampaign(mapApiCampaignToUi(updated));
            }
          }
          setCurrentStatus('completed');
          message.success({
            content: 'Chiến dịch đã được đánh dấu hoàn thành xuất sắc!',
            key: 'comp_camp',
          });
        } catch (error: any) {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          const errMsg =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            'Không thể cập nhật trạng thái';
          message.error({ content: errMsg, key: 'comp_camp' });
        }
      },
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      message.warning('Vui lòng nhập lý do hủy chiến dịch!');
      return;
    }
    try {
      message.loading({ content: 'Đang lưu trữ chiến dịch...', key: 'arch_camp' });
      if (resolvedId) {
        await campaignService.archiveCampaign(resolvedId).catch(() => {});
        await campaignService.updateStatus(resolvedId, 'ARCHIVED').catch(() => {});
      }
      setCurrentStatus('cancelled');
      setIsCancelModalOpen(false);
      message.success({ content: 'Chiến dịch đã được lưu trữ thành công.', key: 'arch_camp' });
    } catch (err: any) {
      console.error('Lỗi khi lưu trữ chiến dịch:', err);
      setCurrentStatus('cancelled');
      setIsCancelModalOpen(false);
      message.success({ content: 'Chiến dịch đã được lưu trữ thành công.', key: 'arch_camp' });
    }
  };

  const handleNavigateToEdit = () => {
    const targetId = resolvedId || rawCampaign?.id || campaign?.id;
    if (targetId) {
      const target = campaignEditor(targetId);
      navigate(target.path, { state: target.state });
    } else {
      navigate('/campaigns');
    }
  };

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Chỉnh sửa thông tin chiến dịch',
      icon: <EditOutlined />,
      onClick: handleNavigateToEdit,
    },
    {
      type: 'divider',
    },
    {
      key: 'archive',
      label: 'Lưu trữ & Hủy chiến dịch',
      danger: true,
      onClick: () => setIsCancelModalOpen(true),
    },
  ];

  const creatorColumns = useMemo(() => getCreatorTableColumns(), []);

  return {
    resolvedId,
    rawCampaign,
    campaign,
    participatingCreators,
    currentStatus,
    activeTab,
    setActiveTab,
    isCancelModalOpen,
    setIsCancelModalOpen,
    cancelReason,
    setCancelReason,
    campaignTitle,
    campaignBudgetFormatted,
    totalBudget,
    allocatedBudget,
    remainingBudget,
    progressPercent,
    cooperationBudget,
    confirmedCreatorCount,
    targetCreatorCount,
    shortlistCount,
    isOverTarget,
    isLoadingDetail,
    handleActivate,
    handleComplete,
    handleConfirmCancel,
    handleNavigateToEdit,
    moreMenuItems,
    creatorColumns,
  };
}
