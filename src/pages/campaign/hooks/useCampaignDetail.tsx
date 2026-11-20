import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { activeCampaignId, campaignEditor, rememberCampaign } from '../../../services/campaignContext';
import { App } from 'antd';
import { getErrorMessage } from '../../../services/apiClient';
import type { MenuProps } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { campaignService } from '../../../services/api/campaignService';
import { dealService } from '../../../services/api/dealService';
import type { CooperationBudget } from '../../../services/api/dealService';
import { collaborationService } from '../../../services/api/collaborationService';
import { shortlistService } from '../../../services/api/shortlistService';
import type { CampaignResponse } from '../../../types/api/campaign.types';
import type { CampaignCreatorRow, CampaignStatusType } from '../components/detail/campaignDetailTypes';
import type { CampaignDetailTabKey } from '../components/detail/CampaignDetailNavTabs';
import { getCreatorTableColumns } from '../components/detail/campaignDetailUtils';

export function useCampaignDetail() {
  const { message, modal: Modal } = App.useApp();
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận diện ID từ params, navigation state hoặc sessionStorage
  const resolvedId =
    paramId ||
    new URLSearchParams(location.search).get('campaignId') ||
    (location.state as any)?.id ||
    (location.state as any)?.campaignId ||
    activeCampaignId() ||
    '';

  // Cập nhật sessionStorage khi có paramId mà không gây remount lặp
  useEffect(() => {
    if (paramId) {
      rememberCampaign(paramId);
    }
  }, [paramId]);

  // Trích xuất campaign data đã được truyền từ trang danh sách hoặc sessionStorage
  const [rawCampaign, setRawCampaign] = useState<CampaignResponse | null>(null);
  const [participatingCreators, setParticipatingCreators] = useState<CampaignCreatorRow[]>([]);
  const [currentStatus, setCurrentStatus] = useState<CampaignStatusType>('draft');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [relatedErrors, setRelatedErrors] = useState<string[]>([]);
  const [collaborationsError, setCollaborationsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState<CampaignDetailTabKey>('overview');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [activationNeedsDeliverables, setActivationNeedsDeliverables] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cooperationBudget, setCooperationBudget] = useState<CooperationBudget | null>(null);
  const [shortlistCount, setShortlistCount] = useState<number | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);

  // Fetch dữ liệu từ API thật của Backend: Campaign, Budget, Shortlist, Collaborations
  useEffect(() => {
    if (!resolvedId) return;

    let isMounted = true;
    const loadCampaign = async () => {
      setIsLoadingDetail(true);
      setLoadError(null); setRelatedErrors([]);
      setActivationNeedsDeliverables(false);
      setCollaborationsError(null);
      setRawCampaign(null); setParticipatingCreators([]);
      setCooperationBudget(null); setShortlistCount(null);
      try {
        const [campaignRes, budgetRes, shortlistRes, collabsRes] = await Promise.allSettled([
          campaignService.getCampaignById(resolvedId),
          dealService.budget(resolvedId),
          shortlistService.list(resolvedId, { page: 0, size: 1 }),
          collaborationService.listBrand(resolvedId),
        ]);

        if (!isMounted) return;
        if (campaignRes.status === 'rejected') throw campaignRes.reason;
        setCollaborationsError(collabsRes.status === 'rejected' ? getErrorMessage(collabsRes.reason) : null);
        setRelatedErrors([budgetRes, shortlistRes, collabsRes].flatMap(result => result.status === 'rejected' ? [getErrorMessage(result.reason)] : []));
        const data = campaignRes.status === 'fulfilled' ? campaignRes.value : null;
        const budgetData = budgetRes.status === 'fulfilled' ? budgetRes.value : null;
        const shortlistData = shortlistRes.status === 'fulfilled' ? shortlistRes.value : null;
        const collabs = collabsRes.status === 'fulfilled' ? collabsRes.value : [];

        if (budgetData && isMounted) {
          setCooperationBudget(budgetData);
        }
        if (shortlistData && isMounted) {
          setShortlistCount(shortlistData.totalElements ?? null);
        }

        let newStatus: CampaignStatusType = 'running';
        if (data && isMounted) {
          setRawCampaign(data);

          if (data.status === 'COMPLETED') newStatus = 'completed';
          else if (data.status === 'DRAFT' || data.status === 'READY_FOR_DISCOVERY') newStatus = 'draft';
          else if (data.status === 'ARCHIVED') newStatus = 'cancelled';
          setCurrentStatus(newStatus);
        }

        // Tab "Creator tham gia" CHỈ hiển thị hợp tác đã xác nhận (Collaborations)
        // Tuyệt đối không trộn Shortlist hay Relationship nháp
        if (isMounted) {
          const statusMap: Record<string, { text: string; color: string; deliverable: string; delColor: string }> = {
            PLANNED: { text: 'Đã lên kế hoạch', color: '#7C3AED', deliverable: 'Chưa bắt đầu', delColor: 'default' },
            AWAITING_REVIEW: { text: 'Chờ đánh giá', color: '#7C3AED', deliverable: 'Chờ đánh giá kết quả', delColor: 'default' },
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
              deliverable: c.hasReview ? 'Đã có đánh giá' : c.hasOutcome ? 'Đã có kết quả' : 'Chưa có dữ liệu',
              delColor: 'default',
            };
            return {
              id: c.id,
              name: c.creatorName || c.channelName || `Nhà sáng tạo #${idx + 1}`,
              username: c.channels?.map(channel => channel.username).filter(Boolean).join(', ') || '—',
              avatar: c.avatarUrl || '',
              platform: c.platform?.toLowerCase() || '—',
              followers: '—',
              fee: c.agreedFee != null && c.currency ? `${c.agreedFee.toLocaleString('vi-VN')} ${c.currency}` : 'Chưa có dữ liệu',
              stageText: st.text,
              stageColor: st.color,
              deliverableStatus: st.deliverable,
              deliverableColor: st.delColor,
            };
          });

          setParticipatingCreators(currentCreators);


        }
      } catch (err) {
        if (isMounted) setLoadError(getErrorMessage(err));
        console.warn('Lỗi khi tải chi tiết chiến dịch:', err);
      } finally {
        if (isMounted) setIsLoadingDetail(false);
      }
    };

    loadCampaign();
    return () => {
      isMounted = false;
    };
  }, [resolvedId, reloadKey]);

  const campaignTitle = rawCampaign?.name || 'Chiến dịch';
  const totalBudget = cooperationBudget?.totalBudget ?? (rawCampaign?.totalBudget ?? rawCampaign?.budgetMax ?? null);
  const allocatedBudget = cooperationBudget?.committedBudget ?? null;
  const remainingBudget = cooperationBudget?.remainingBudget ?? null;
  const campaignBudgetFormatted = totalBudget != null ? `${totalBudget.toLocaleString('vi-VN')} ₫` : 'Chưa thiết lập';
  const progressPercent = totalBudget != null && totalBudget > 0 && allocatedBudget != null ? Math.min(100, Math.round((allocatedBudget / totalBudget) * 100)) : null;
  const confirmedCreatorCount = cooperationBudget?.confirmedCreatorCount ?? null;
  const targetCreatorCount = rawCampaign?.targetCreatorCount ?? null;
  const isOverTarget = confirmedCreatorCount != null && targetCreatorCount != null && confirmedCreatorCount > targetCreatorCount;

  // Handle Lifecycle actions
  const handleActivate = () => {
    if (!resolvedId || !rawCampaign) return;
    if (rawCampaign.status === 'DRAFT' && !rawCampaign.niches?.length) {
      Modal.confirm({
        title: 'Cần chọn ngành hàng trước khi chốt chiến dịch',
        content: 'Chọn ngành liên quan trực tiếp đến sản phẩm. Chủ đề cụ thể vẫn là tùy chọn.',
        okText: 'Chọn ngành hàng', cancelText: 'Để sau',
        onOk: () => {
          const target = campaignEditor(resolvedId, 1);
          navigate(target.path, { state: target.state });
        },
      });
      return;
    }
    if (rawCampaign.status === 'DRAFT' && !rawCampaign.deliverables?.length) {
      setActivationNeedsDeliverables(true);
      return;
    }
    Modal.confirm({
      title: rawCampaign.status === 'DRAFT' ? 'Chốt yêu cầu và kích hoạt chiến dịch?' : 'Bắt đầu triển khai chiến dịch?',
      content:
        rawCampaign.status === 'DRAFT'
          ? 'Sau khi chốt, bạn không thể sửa yêu cầu chiến dịch. Hệ thống sẽ kiểm tra điều kiện trước khi kích hoạt.'
          : 'Chuyển sang giai đoạn triển khai để thực hiện các hợp tác. Yêu cầu chiến dịch vẫn được giữ nguyên.',
      okText: 'Kích hoạt ngay',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#10B981', borderColor: '#10B981' } },
      onOk: async () => {
        try {
          message.loading({ content: 'Đang kích hoạt chiến dịch trên hệ thống...', key: 'act_camp' });
          if (resolvedId) {
            const updated = await campaignService.activateCampaign(resolvedId);
            if (updated) {
              setRawCampaign(updated);            }
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
            message.destroy('act_camp');
            setActivationNeedsDeliverables(true);
            return;
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
        'Yêu cầu hoàn thành chiến dịch. Hệ thống sẽ kiểm tra điều kiện và các hợp tác liên quan.',
      okText: 'Hoàn thành chiến dịch',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#6D28D9', borderColor: '#6D28D9' } },
      onOk: async () => {
        try {
          message.loading({ content: 'Đang đánh dấu hoàn thành chiến dịch...', key: 'comp_camp' });
          if (resolvedId) {
            const updated = await campaignService.updateStatus(resolvedId, 'COMPLETED');
            if (updated) {
              setRawCampaign(updated);            }
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
    try {
      message.loading({ content: 'Đang lưu trữ chiến dịch...', key: 'arch_camp' });
      if (resolvedId) {
        const updated = await campaignService.archiveCampaign(resolvedId);
        setRawCampaign(updated);      }
      setCurrentStatus('cancelled');
      setIsCancelModalOpen(false);
      message.success({ content: 'Chiến dịch đã được lưu trữ thành công.', key: 'arch_camp' });
    } catch (err: any) {
      message.error({ content: getErrorMessage(err), key: 'arch_camp' });
    }
  };

  const handleNavigateToEdit = () => {
    const targetId = resolvedId || rawCampaign?.id;
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
      label: rawCampaign?.status === 'DRAFT' ? 'Chỉnh sửa yêu cầu' : 'Xem yêu cầu',
      icon: <EditOutlined />,
      onClick: () => rawCampaign?.status === 'DRAFT' ? handleNavigateToEdit() : setActiveTab('guidelines'),
    },
    ...(rawCampaign?.status === 'DRAFT' ? [{
      key: 'archive',
      label: 'Lưu trữ chiến dịch',
      danger: true,
      onClick: () => setIsCancelModalOpen(true),
    }] : []),
  ];

  const creatorColumns = useMemo(() => getCreatorTableColumns(), []);

  return {
    resolvedId,
    rawCampaign,
    participatingCreators,
    currentStatus,
    activeTab,
    setActiveTab,
    isCancelModalOpen,
    activationNeedsDeliverables,
    editDeliverables: () => {
      if (!resolvedId || rawCampaign?.status !== 'DRAFT') return;
      const target = campaignEditor(resolvedId, 2);
      navigate(target.path, { state: target.state });
    },
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
    isLoadingDetail, collaborationsError,
    loadError, relatedErrors,
    reload: () => setReloadKey(value => value + 1),
    handleActivate,
    handleComplete,
    handleConfirmCancel,
    handleNavigateToEdit,
    moreMenuItems,
    creatorColumns,
  };
}
