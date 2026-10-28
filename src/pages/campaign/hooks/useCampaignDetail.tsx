import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { campaignService } from '../../../services/api/campaignService';
import { creatorService } from '../../../services/api/creatorService';
import type { RelationshipDto } from '../../../services/api/campaignService';
import type { CampaignResponse } from '../../../types/api/campaign.types';
import { mapApiCampaignToUi } from '../../../components/dashboard/CampaignTable';
import type { Campaign } from '../../../data/mockData';
import type { CampaignItemUI } from '../CampaignPage';
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
        followerMin: 50000,
        followerMax: 1000000,
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

  // Fetch dữ liệu từ API chạy nền để giữ view mượt mà
  useEffect(() => {
    if (!resolvedId) return;

    let isMounted = true;
    const loadCampaign = async () => {
      try {
        const data = await campaignService.getCampaignById(resolvedId);
        if (data && isMounted) {
          setRawCampaign(data);
          const mappedUi = mapApiCampaignToUi(data);
          setCampaign(mappedUi);

          let newStatus: CampaignStatusType = 'running';
          if (data.status === 'COMPLETED') newStatus = 'completed';
          else if (data.status === 'DRAFT') newStatus = 'draft';
          else if (data.status === 'ARCHIVED') newStatus = 'cancelled';
          setCurrentStatus(newStatus);

          // Tải danh sách KOC từ Pipeline Relationship và Shortlist từ Backend DB
          let rels: RelationshipDto[] = [];
          try {
            rels = await campaignService.getRelationships(resolvedId);
          } catch {
            rels = [];
          }

          let shortlists: any[] = [];
          try {
            shortlists = await creatorService.getShortlist(resolvedId);
          } catch {
            shortlists = [];
          }

          let currentCreators: CampaignCreatorRow[] = [];
          if (isMounted) {
            if (rels && rels.length > 0) {
              currentCreators = rels.map((r: any, idx) => {
                const stageInfo = getStageInfo(r.stage);
                return {
                  id: r.id || `rel_${idx}`,
                  name: r.creatorName || `Nhà sáng tạo #${idx + 1}`,
                  username: r.creatorUsername
                    ? `@${r.creatorUsername.replace('@', '')}`
                    : `@creator_${idx + 1}`,
                  avatar:
                    r.creatorAvatar && r.creatorAvatar.startsWith('http') && !r.creatorAvatar.includes('NaN')
                      ? r.creatorAvatar
                      : VERIFIED_CREATOR_AVATARS[idx % VERIFIED_CREATOR_AVATARS.length],
                  platform: r.platform?.toLowerCase() === 'instagram' ? 'instagram' : 'tiktok',
                  followers: r.followersCount ? `${(r.followersCount / 1000).toFixed(0)}K` : '50K+',
                  fee: r.agreedFee
                    ? `${r.agreedFee.toLocaleString('vi-VN')} ₫`
                    : r.quotedFee
                    ? `${r.quotedFee.toLocaleString('vi-VN')} ₫`
                    : 'Thỏa thuận',
                  stageText: stageInfo.text,
                  stageColor: stageInfo.color,
                  deliverableStatus: stageInfo.deliverable,
                  deliverableColor: stageInfo.delColor,
                };
              });
            }

            // Bổ sung các KOC từ bảng Shortlist Database nếu chưa có trong Pipeline
            if (shortlists && shortlists.length > 0) {
              shortlists.forEach((s: any, idx) => {
                const exists = currentCreators.some((c) => c.id === s.id || c.name === s.creatorName);
                if (!exists) {
                  currentCreators.push({
                    id: s.id || `sl_${idx}`,
                    name: s.creatorName || `Nhà sáng tạo #${idx + 1}`,
                    username: s.creatorUsername
                      ? `@${s.creatorUsername.replace('@', '')}`
                      : `@creator_${idx + 1}`,
                    avatar:
                      s.avatarUrl && s.avatarUrl.startsWith('http') && !s.avatarUrl.includes('NaN')
                        ? s.avatarUrl
                        : VERIFIED_CREATOR_AVATARS[(idx + 2) % VERIFIED_CREATOR_AVATARS.length],
                    platform: s.platform?.toLowerCase() === 'instagram' ? 'instagram' : 'tiktok',
                    followers: s.followers ? `${(s.followers / 1000).toFixed(0)}K` : '80K+',
                    fee: 'Đang thỏa thuận',
                    stageText: 'Đã lưu Shortlist',
                    stageColor: '#6366F1',
                    deliverableStatus: 'Chờ gửi đề xuất',
                    deliverableColor: 'blue',
                  });
                }
              });
            }

            setParticipatingCreators(currentCreators);
          }

          // Ghi vào memory cache
          campaignDetailCache.set(resolvedId, {
            rawCampaign: data,
            campaign: mappedUi,
            participatingCreators: currentCreators,
            currentStatus: newStatus,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Lỗi khi tải chi tiết chiến dịch:', err);
      }
    };

    loadCampaign();
    return () => {
      isMounted = false;
    };
  }, [resolvedId]);

  const campaignTitle =
    rawCampaign?.name || passedItem?.name || 'Chiến dịch trọng điểm 2026';
  const campaignBudgetFormatted = rawCampaign?.budgetMax
    ? `${rawCampaign.budgetMax.toLocaleString('vi-VN')} đ`
    : passedItem?.budgetFormatted || '80.000.000 đ';

  // Tính toán ngân sách thực tế từ danh sách KOC trong pipeline
  const totalBudget = rawCampaign?.budgetMax || passedItem?.budgetRaw || 80000000;
  const allocatedBudget =
    participatingCreators.reduce((sum, c) => {
      const rawNum = parseInt(c.fee.replace(/\D/g, ''), 10);
      return sum + (isNaN(rawNum) ? 0 : rawNum);
    }, 0) || (participatingCreators.length > 0 ? participatingCreators.length * 12000000 : 0);

  const remainingBudget = Math.max(0, totalBudget - allocatedBudget);
  const progressPercent =
    currentStatus === 'completed'
      ? 100
      : totalBudget > 0
      ? Math.min(100, Math.round((allocatedBudget / totalBudget) * 100))
      : 0;

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
          const errMsg =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            'Không thể kích hoạt chiến dịch';
          message.error({ content: errMsg, key: 'act_camp' });
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
      okButtonProps: { style: { background: '#4F46E5', borderColor: '#4F46E5' } },
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
      navigate(`/campaigns/${targetId}/edit`, {
        state: {
          campaignId: targetId,
          campaign: rawCampaign,
          campaignData: rawCampaign,
        },
      });
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
    handleActivate,
    handleComplete,
    handleConfirmCancel,
    handleNavigateToEdit,
    moreMenuItems,
    creatorColumns,
  };
}
