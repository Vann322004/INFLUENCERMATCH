import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Tag,
  Modal,
  message,
  Tooltip,
  DatePicker,
  Radio,
  Badge,
  Form,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  MailOutlined,
  SendOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  RightOutlined,
  DownOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  ApartmentOutlined,
  EditOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import './OutreachCrmPage.css';

// Campaign selector options
const CAMPAIGN_OPTIONS = [
  { value: 'camp-1', label: '🌟 Ra mắt Skincare Summer Glow' },
  { value: 'camp-2', label: '💄 Son Lì TikTok Blitz' },
  { value: 'camp-3', label: '👟 BST Giày Sneaker Thu Đông' },
];

// Interface for Outreach Email Log
interface OutreachEmail {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorEmail: string;
  channel: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
  openedCount: number;
  lastOpenedAt?: string;
}

// Interface for Kanban Pipeline Creator
interface KanbanCreator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  followers: string;
  engagement: string;
  fee: string;
  matchScore: number;
  stage: 'found' | 'review' | 'contacted' | 'negotiating' | 'confirmed';
  lastActivity: string;
  note: string;
  tags: string[];
}

// Interface for Official Invitation
interface CollaborationInvitation {
  id: string;
  code: string;
  creatorName: string;
  creatorAvatar: string;
  creatorPlatform: string;
  fee: string;
  deliverables: string;
  scriptDeadline: string;
  postDeadline: string;
  freeProducts: string;
  status: 'pending' | 'accepted' | 'counter_offer' | 'declined';
  notes?: string;
  counterFee?: string;
  createdAt: string;
}

// Initial Mock Data
const INITIAL_EMAILS: OutreachEmail[] = [
  {
    id: 'em-1',
    creatorId: 'c1',
    creatorName: 'Linh Nguyễn',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    creatorEmail: 'linhnguyen.booking@gmail.com',
    channel: 'TikTok & IG (1.2M)',
    subject: 'Lời mời hợp tác chiến dịch Summer Glow 2026 cùng GlowBeauty',
    body: 'Chào Linh,\nThương hiệu GlowBeauty rất ấn tượng với chuỗi video chăm sóc da buổi sáng của bạn. Chúng tôi sắp ra mắt dòng kem chống nắng thế hệ mới và mong muốn mời bạn là một trong những Creator đầu tiên trải nghiệm...',
    sentAt: '28/09/2026 14:30',
    status: 'replied',
    openedCount: 4,
    lastOpenedAt: 'Hôm nay lúc 09:15',
  },
  {
    id: 'em-2',
    creatorId: 'c2',
    creatorName: 'Minh Hoàng',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    creatorEmail: 'minhhoang.work@gmail.com',
    channel: 'TikTok (856K)',
    subject: 'Đề xuất hợp tác nội dung phong cách năng động cho chiến dịch Summer Glow',
    body: 'Chào Minh Hoàng,\nChúng tôi theo dõi các clip OOTD và skincare của bạn rất thường xuyên. Dòng sản phẩm mới của chúng tôi có tính năng chống trôi mồ hôi rất hợp với phong cách thể thao của bạn...',
    sentAt: '29/09/2026 10:15',
    status: 'opened',
    openedCount: 2,
    lastOpenedAt: 'Hôm qua lúc 16:40',
  },
  {
    id: 'em-3',
    creatorId: 'c5',
    creatorName: 'Bác sĩ Ngọc',
    creatorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80',
    creatorEmail: 'drngoc.official@clinic.vn',
    channel: 'YouTube & TikTok (920K)',
    subject: 'Thư mời hợp tác chuyên gia da liễu: Phân tích màng lọc quang phổ rộng',
    body: 'Kính gửi Bác sĩ Ngọc,\nĐại diện nhãn hàng GlowBeauty xin gửi lời chào trân trọng. Với nền tảng kiến thức da liễu uy tín của Bác sĩ, chúng tôi mong muốn gửi mẫu sản phẩm kiểm nghiệm lâm sàng để Bác sĩ đánh giá...',
    sentAt: '29/09/2026 16:00',
    status: 'delivered',
    openedCount: 0,
  },
  {
    id: 'em-4',
    creatorId: 'c3',
    creatorName: 'Thảo Vy',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    creatorEmail: 'thaovy.collab@gmail.com',
    channel: 'Instagram (542K)',
    subject: 'GlowBeauty x Thảo Vy: Lời mời tham dự chiến dịch ra mắt độc quyền',
    body: 'Chào Vy xinh đẹp,\nNhãn hàng GlowBeauty muốn mời bạn trải nghiệm sớm bộ sản phẩm trước khi chính thức mở bán trên TikTok Shop...',
    sentAt: '27/09/2026 09:00',
    status: 'replied',
    openedCount: 3,
    lastOpenedAt: '28/09/2026 11:20',
  },
];

const INITIAL_KANBAN_CREATORS: KanbanCreator[] = [
  // 1. Mới tìm thấy
  {
    id: 'k1',
    name: 'Phương Mai',
    username: 'phuongmai.vlog',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '450K',
    engagement: '5.2%',
    fee: '6.000.000 ₫',
    matchScore: 88,
    stage: 'found',
    lastActivity: 'Đã lưu từ AI Discovery',
    note: 'Video phong cách sáng tạo, năng lượng Gen-Z.',
    tags: ['Skincare', 'Daily Vlog'],
  },
  {
    id: 'k2',
    name: 'Quang Đăng',
    username: 'dang.review',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    followers: '310K',
    engagement: '4.1%',
    fee: '5.500.000 ₫',
    matchScore: 82,
    stage: 'found',
    lastActivity: 'Mới tìm thấy hôm qua',
    note: 'Chuyên so sánh chi tiết các thành phần hóa học.',
    tags: ['Review', 'Mỹ phẩm'],
  },
  // 2. Đang xem xét
  {
    id: 'k3',
    name: 'Khánh Linh',
    username: 'linhkhanh.official',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '580K',
    engagement: '6.4%',
    fee: '8.500.000 ₫',
    matchScore: 91,
    stage: 'review',
    lastActivity: 'Team Brand đã duyệt hồ sơ',
    note: 'Hình ảnh sang trọng, tệp người theo dõi thu nhập khá.',
    tags: ['Thời trang', 'Làm đẹp'],
  },
  // 3. Đã liên hệ
  {
    id: 'k4',
    name: 'Bác sĩ Ngọc',
    username: 'drngoc.dermatology',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '920K',
    engagement: '7.8%',
    fee: '18.000.000 ₫',
    matchScore: 94,
    stage: 'contacted',
    lastActivity: 'Đã gửi email ngày 29/09',
    note: 'Chờ phản hồi kiểm tra lịch quay tại phòng khám.',
    tags: ['Bác sĩ', 'Da liễu'],
  },
  {
    id: 'k5',
    name: 'Đức Anh',
    username: 'ducanh.travel',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '421K',
    engagement: '4.8%',
    fee: '7.000.000 ₫',
    matchScore: 79,
    stage: 'contacted',
    lastActivity: 'Đã gửi email mở thư hôm qua',
    note: 'Đang đợi xác nhận chi phí 1 video 60s.',
    tags: ['Du lịch', 'Outdoor'],
  },
  // 4. Đang thương lượng
  {
    id: 'k6',
    name: 'Minh Hoàng',
    username: 'minhhoang.92',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    followers: '856K',
    engagement: '6.2%',
    fee: '12.500.000 ₫',
    matchScore: 91,
    stage: 'negotiating',
    lastActivity: 'Creator đề xuất tặng kèm 1 Story IG',
    note: 'Thống nhất mức giá 12.5M, đang chốt quyền sử dụng hình ảnh 6 tháng.',
    tags: ['Thời trang', 'Vlog'],
  },
  // 5. Đã xác nhận
  {
    id: 'k7',
    name: 'Linh Nguyễn',
    username: 'linhnguyen.official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '1.2M',
    engagement: '8.7%',
    fee: '15.000.000 ₫',
    matchScore: 96,
    stage: 'confirmed',
    lastActivity: 'Đã chấp nhận thư mời chính thức ✓',
    note: 'Đã chốt hợp đồng. Đang gửi hộp quà sản phẩm thử nghiệm.',
    tags: ['Skincare', 'Top Match'],
  },
  {
    id: 'k8',
    name: 'Thảo Vy',
    username: 'thaovy.official',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '542K',
    engagement: '5.1%',
    fee: '8.000.000 ₫',
    matchScore: 84,
    stage: 'confirmed',
    lastActivity: 'Đã nhận quà & ký thỏa thuận',
    note: 'Kịch bản nộp ngày 05/10, đăng bài ngày 10/10.',
    tags: ['Food', 'Beauty'],
  },
];

const INITIAL_INVITATIONS: CollaborationInvitation[] = [
  {
    id: 'inv-1',
    code: 'INV-2026-081',
    creatorName: 'Linh Nguyễn',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    creatorPlatform: 'TikTok (1.2M)',
    fee: '15.000.000 ₫',
    deliverables: '1 Video TikTok 60s + 1 Story IG kèm link mua hàng',
    scriptDeadline: '04/10/2026',
    postDeadline: '12/10/2026',
    freeProducts: 'Bộ Skincare Summer Glow VIP Kit (trị giá 2.500.000 ₫)',
    status: 'accepted',
    notes: 'Creator đã xác nhận điều khoản bản quyền quảng cáo 90 ngày.',
    createdAt: '28/09/2026',
  },
  {
    id: 'inv-2',
    code: 'INV-2026-082',
    creatorName: 'Minh Hoàng',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    creatorPlatform: 'YouTube & TikTok (856K)',
    fee: '12.500.000 ₫',
    deliverables: '1 Video TikTok 45s lồng ghép thử nghiệm chống nắng ngoài trời',
    scriptDeadline: '06/10/2026',
    postDeadline: '15/10/2026',
    freeProducts: '2 Tuýp Kem chống nắng thế hệ mới',
    status: 'pending',
    notes: 'Đã gửi qua email, creator đã xem thư và đang duyệt lịch trình.',
    createdAt: '29/09/2026',
  },
  {
    id: 'inv-3',
    code: 'INV-2026-083',
    creatorName: 'Bác sĩ Ngọc',
    creatorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80',
    creatorPlatform: 'YouTube (920K)',
    fee: '18.000.000 ₫',
    deliverables: '1 Video phân tích chuyên sâu da liễu 3-5 phút trên YouTube',
    scriptDeadline: '08/10/2026',
    postDeadline: '20/10/2026',
    freeProducts: 'Bộ sản phẩm kèm hồ sơ kiểm định lâm sàng',
    status: 'counter_offer',
    counterFee: '20.000.000 ₫',
    notes: 'Creator đề xuất phụ thu 2.000.000 ₫ do cần ghi hình tại phòng khám da liễu có ekip chuyên môn.',
    createdAt: '29/09/2026',
  },
  {
    id: 'inv-4',
    code: 'INV-2026-084',
    creatorName: 'Thảo Vy',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    creatorPlatform: 'Instagram (542K)',
    fee: '8.000.000 ₫',
    deliverables: '1 Reel Instagram + 2 Story chia sẻ cảm nhận sau 7 ngày',
    scriptDeadline: '03/10/2026',
    postDeadline: '10/10/2026',
    freeProducts: 'Set quà độc quyền Summer Glow',
    status: 'accepted',
    notes: 'Đã chốt hợp đồng và chuyển sang phân hệ Vận hành hợp tác.',
    createdAt: '27/09/2026',
  },
  {
    id: 'inv-5',
    code: 'INV-2026-085',
    creatorName: 'Mai Lan',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    creatorPlatform: 'TikTok (680K)',
    fee: '9.500.000 ₫',
    deliverables: '1 Video TikTok swatch & review',
    scriptDeadline: '05/10/2026',
    postDeadline: '14/10/2026',
    freeProducts: 'Set quà tặng thương hiệu',
    status: 'declined',
    notes: 'Creator từ chối do bị trùng lịch ký độc quyền ngành hàng mỹ phẩm đến hết tháng 10.',
    createdAt: '26/09/2026',
  },
];

export default function OutreachCrmPage() {
  const navigate = useNavigate();
  const [selectedCampaign, setSelectedCampaign] = useState('camp-1');
  const [activeSubTab, setActiveSubTab] = useState<'email' | 'crm' | 'invitation'>('email');

  // Tab 1: Outreach Email State
  const [emails, setEmails] = useState<OutreachEmail[]>(INITIAL_EMAILS);
  const [selectedRecipientId, setSelectedRecipientId] = useState('c1');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [aiTone, setAiTone] = useState<'formal' | 'friendly' | 'concise'>('friendly');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [previewEmail, setPreviewEmail] = useState<OutreachEmail | null>(null);

  // Tab 2: Relationship CRM State
  const [pipelineCreators, setPipelineCreators] = useState<KanbanCreator[]>(INITIAL_KANBAN_CREATORS);
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeCreatorForNote, setActiveCreatorForNote] = useState<KanbanCreator | null>(null);
  const [newLogNote, setNewLogNote] = useState('');

  // Tab 3: Official Invitation State
  const [invitations, setInvitations] = useState<CollaborationInvitation[]>(INITIAL_INVITATIONS);
  const [invitationFilter, setInvitationFilter] = useState<string>('all');
  const [createInviteModalOpen, setCreateInviteModalOpen] = useState(false);
  const [inviteForm] = Form.useForm();
  const [detailInviteModal, setDetailInviteModal] = useState<CollaborationInvitation | null>(null);

  // AI Email Generator Simulation
  const handleGenerateAiEmail = () => {
    setAiGenerating(true);
    message.loading({ content: 'AI đang phân tích hồ sơ Creator & thương hiệu để soạn thảo...', key: 'ai-email' });

    setTimeout(() => {
      let subject = '';
      let body = '';

      if (aiTone === 'formal') {
        subject = 'Thư mời hợp tác chiến dịch truyền thông thương hiệu GlowBeauty';
        body = `Kính gửi bạn,\n\nĐại diện cho nhãn hàng GlowBeauty, chúng tôi rất trân trọng những giá trị nội dung chỉn chu và uy tín mà kênh của bạn đã xây dựng.\n\nNhân dịp ra mắt chiến dịch "${CAMPAIGN_OPTIONS.find((c) => c.value === selectedCampaign)?.label.replace(/^[^\w\s]*\s*/, '')}", chúng tôi trân trọng kính mời bạn đồng hành cùng nhãn hàng với vai trò Key Creator. Chi tiết quyền lợi bao gồm:\n• Thù lao hợp tác thỏa thuận cạnh tranh\n• Bộ sản phẩm trải nghiệm cao cấp gửi tận nơi\n• Quyền sử dụng mã giảm giá độc quyền cho cộng đồng của bạn\n\nRất mong nhận được phản hồi từ bạn trước ngày 05/10/2026.\n\nTrân trọng,\nĐội ngũ Influencer Marketing GlowBeauty.`;
      } else if (aiTone === 'friendly') {
        subject = '✨ Lời mời hợp tác siêu ngọt ngào cùng GlowBeauty x Bạn!';
        body = `Chào bạn ơi,\n\nTeam GlowBeauty theo dõi kênh của bạn từ lâu và cực kỳ mê phong cách chia sẻ tự nhiên, gần gũi của bạn luôn ấy! 💖\n\nTụi mình chuẩn bị tung ra chiến dịch "${CAMPAIGN_OPTIONS.find((c) => c.value === selectedCampaign)?.label.replace(/^[^\w\s]*\s*/, '')}" với những sản phẩm cực hot cho mùa hè này. Team rất muốn mời bạn là một trong những người đầu tiên bóc hộp và trải nghiệm sản phẩm cùng tụi mình.\n\nNếu bạn có hứng thú, hãy reply lại email này nhé, tụi mình sẽ gửi ngay brief chi tiết và hộp quà xinh xắn đến bạn liền nha!\n\nChúc bạn một ngày tràn đầy năng lượng! ✨`;
      } else {
        subject = 'Cơ hội hợp tác chiến dịch ra mắt: GlowBeauty 2026';
        body = `Chào bạn,\n\nChúng tôi đại diện cho nhãn hàng GlowBeauty. Chúng tôi đang tìm kiếm Creator phù hợp cho chiến dịch "${CAMPAIGN_OPTIONS.find((c) => c.value === selectedCampaign)?.label.replace(/^[^\w\s]*\s*/, '')}".\n\n• Ấn phẩm yêu cầu: 1 Video review 45-60s\n• Thời gian bàn giao: Tháng 10/2026\n• Ngân sách đề xuất: Thỏa thuận theo báo giá của bạn\n\nVui lòng phản hồi kèm báo giá (rate card) mới nhất nếu bạn quan tâm hợp tác. Cảm ơn bạn!`;
      }

      setEmailSubject(subject);
      setEmailBody(body);
      setAiGenerating(false);
      message.success({ content: 'Đã tạo bản thảo email bằng AI thành công! Bạn có thể chỉnh sửa trước khi gửi.', key: 'ai-email' });
    }, 1200);
  };

  // Send Email
  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      message.error('Vui lòng nhập tiêu đề và nội dung email trước khi gửi!');
      return;
    }

    const newEmailItem: OutreachEmail = {
      id: `em-${Date.now()}`,
      creatorId: selectedRecipientId,
      creatorName: selectedRecipientId === 'c1' ? 'Linh Nguyễn' : selectedRecipientId === 'c2' ? 'Minh Hoàng' : 'Creator Đối tác',
      creatorAvatar: selectedRecipientId === 'c1' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      creatorEmail: selectedRecipientId === 'c1' ? 'linhnguyen.booking@gmail.com' : 'creator.collab@gmail.com',
      channel: 'TikTok & Instagram',
      subject: emailSubject,
      body: emailBody,
      sentAt: 'Vừa xong',
      status: 'delivered',
      openedCount: 0,
    };

    setEmails([newEmailItem, ...emails]);
    message.success('Đã gửi email tiếp cận thành công! Hệ thống đang theo dõi trạng thái mở thư.');
    setEmailSubject('');
    setEmailBody('');
  };

  // Kanban Stage Moving
  const stages: { key: KanbanCreator['stage']; title: string; color: string; count: number }[] = [
    { key: 'found', title: '1. Mới tìm thấy', color: '#6366F1', count: pipelineCreators.filter((c) => c.stage === 'found').length },
    { key: 'review', title: '2. Đang xem xét', color: '#3B82F6', count: pipelineCreators.filter((c) => c.stage === 'review').length },
    { key: 'contacted', title: '3. Đã liên hệ', color: '#F59E0B', count: pipelineCreators.filter((c) => c.stage === 'contacted').length },
    { key: 'negotiating', title: '4. Đang thương lượng', color: '#EC4899', count: pipelineCreators.filter((c) => c.stage === 'negotiating').length },
    { key: 'confirmed', title: '5. Đã xác nhận', color: '#10B981', count: pipelineCreators.filter((c) => c.stage === 'confirmed').length },
  ];

  const handleMoveStage = (creatorId: string, currentStage: KanbanCreator['stage']) => {
    const stageOrder: KanbanCreator['stage'][] = ['found', 'review', 'contacted', 'negotiating', 'confirmed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      setPipelineCreators((prev) =>
        prev.map((c) => (c.id === creatorId ? { ...c, stage: nextStage, lastActivity: `Vừa chuyển sang ${stages.find((s) => s.key === nextStage)?.title}` } : c))
      );
      message.success(`Đã chuyển Creator sang bước: ${stages.find((s) => s.key === nextStage)?.title}`);
    }
  };

  // Save interaction note
  const handleSaveLogNote = () => {
    if (!newLogNote.trim() || !activeCreatorForNote) return;
    setPipelineCreators((prev) =>
      prev.map((c) =>
        c.id === activeCreatorForNote.id
          ? { ...c, note: newLogNote, lastActivity: `Ghi chú mới lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` }
          : c
      )
    );
    message.success('Đã lưu nhật ký tương tác thành công!');
    setNoteModalOpen(false);
    setNewLogNote('');
  };

  // Create Invitation Submission
  const handleCreateInviteSubmit = (values: any) => {
    const newInv: CollaborationInvitation = {
      id: `inv-${Date.now()}`,
      code: `INV-2026-0${invitations.length + 80}`,
      creatorName: values.creatorName,
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      creatorPlatform: values.platform,
      fee: values.fee,
      deliverables: values.deliverables,
      scriptDeadline: values.scriptDeadline ? values.scriptDeadline.format('DD/MM/YYYY') : '10/10/2026',
      postDeadline: values.postDeadline ? values.postDeadline.format('DD/MM/YYYY') : '20/10/2026',
      freeProducts: values.freeProducts || 'Hộp quà sản phẩm trải nghiệm',
      status: 'pending',
      notes: values.notes || 'Thư mời gửi trực tiếp từ nhãn hàng',
      createdAt: 'Hôm nay',
    };

    setInvitations([newInv, ...invitations]);
    message.success(`Đã tạo và gửi thư mời chính thức mã ${newInv.code} tới ${newInv.creatorName}!`);
    setCreateInviteModalOpen(false);
    inviteForm.resetFields();
  };

  // Filtered lists
  const filteredEmails = emails.filter((em) => {
    if (!emailSearch) return true;
    const q = emailSearch.toLowerCase();
    return em.creatorName.toLowerCase().includes(q) || em.subject.toLowerCase().includes(q) || em.creatorEmail.toLowerCase().includes(q);
  });

  const filteredInvitations = invitations.filter((inv) => {
    if (invitationFilter !== 'all' && inv.status !== invitationFilter) return false;
    return true;
  });

  // Render Status Tag for Email
  const renderEmailStatusTag = (status: OutreachEmail['status'], openedCount: number) => {
    switch (status) {
      case 'replied':
        return <Tag color="success">💬 Đã trả lời</Tag>;
      case 'opened':
        return <Tag color="processing">👁️ Đã mở ({openedCount} lần)</Tag>;
      case 'delivered':
        return <Tag color="default">📬 Đã nhận thư</Tag>;
      case 'sent':
        return <Tag color="blue">✈️ Đã gửi</Tag>;
      case 'bounced':
        return <Tag color="error">❌ Bị trả về</Tag>;
      default:
        return null;
    }
  };

  // Render Status Tag for Invitation
  const renderInvitationStatusTag = (status: CollaborationInvitation['status']) => {
    switch (status) {
      case 'accepted':
        return <Tag color="success" style={{ fontWeight: 700 }}>✅ Đã chấp thuận</Tag>;
      case 'pending':
        return <Tag color="warning" style={{ fontWeight: 700 }}>⏳ Chờ phản hồi</Tag>;
      case 'counter_offer':
        return <Tag color="purple" style={{ fontWeight: 700 }}>⚠️ Đề xuất lại giá</Tag>;
      case 'declined':
        return <Tag color="error" style={{ fontWeight: 700 }}>❌ Từ chối</Tag>;
      default:
        return null;
    }
  };

  return (
    <div className="outreach-crm-container">
      {/* 1. Breadcrumb */}
      <div className="crm-breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/campaigns')}>
          Chiến dịch
        </span>
        <span>›</span>
        <span className="breadcrumb-link" onClick={() => navigate('/campaign-management')}>
          Quản lý chiến dịch
        </span>
        <span>›</span>
        <span className="breadcrumb-current">Tiếp cận & CRM (Outreach & Relationship)</span>
      </div>

      {/* 2. Top Header Row */}
      <div className="crm-header-row">
        <div>
          <div className="crm-title-wrap">
            <h1 className="crm-main-title">Tiếp cận & Quản lý mối quan hệ (Outreach CRM)</h1>
            <span className="crm-tagline">Kết nối chuyên nghiệp • Cá nhân hóa bằng AI ✨</span>
          </div>
          <div className="crm-description">
            Soạn email tiếp cận cá nhân hóa với AI, quản lý phễu đàm phán quan hệ Creator và phát hành thư mời hợp tác chính thức.
          </div>
        </div>

        <div className="crm-header-actions">
          {/* Campaign Selector */}
          <div className="crm-campaign-selector">
            <span className="selector-label">Chiến dịch:</span>
            <Select
              value={selectedCampaign}
              onChange={setSelectedCampaign}
              style={{ width: 260 }}
              options={CAMPAIGN_OPTIONS}
            />
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', borderRadius: 8, height: 38 }}
            onClick={() => setCreateInviteModalOpen(true)}
          >
            Tạo thư mời hợp tác
          </Button>
        </div>
      </div>

      {/* 3. Funnel Summary Stats Banner */}
      <div className="crm-stats-banner">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
            <UserOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-number">42 Creator</span>
            <span className="stat-text">Trong phễu chiến dịch</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <MailOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-number">18 Đã gửi Email</span>
            <span className="stat-text">Tỷ lệ mở thư đạt 78%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <MessageOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-number">12 Đang đàm phán</span>
            <span className="stat-text">Phản hồi tích cực</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#FAF5FF', color: '#9333EA' }}>
            <CheckCircleFilled />
          </div>
          <div className="stat-info">
            <span className="stat-number">6 Đã chốt (Confirmed)</span>
            <span className="stat-text">Sẵn sàng ký hợp đồng</span>
          </div>
        </div>
      </div>

      {/* 4. Sub-tabs Navigation */}
      <div className="crm-subtabs-bar">
        <div className="subtabs-list">
          <button
            className={`subtab-btn ${activeSubTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('email')}
          >
            <MailOutlined />
            <span>✉️ Outreach Email (AI Draft & Tracker)</span>
            <span className="subtab-count-pill">{emails.length}</span>
          </button>

          <button
            className={`subtab-btn ${activeSubTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('crm')}
          >
            <ApartmentOutlined />
            <span>🤝 Relationship CRM (Phễu 5 bước)</span>
            <span className="subtab-count-pill highlight">{pipelineCreators.length}</span>
          </button>

          <button
            className={`subtab-btn ${activeSubTab === 'invitation' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('invitation')}
          >
            <FileTextOutlined />
            <span>📜 Lời mời hợp tác chính thức (Invitation)</span>
            <span className="subtab-count-pill">{invitations.length}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: OUTREACH EMAIL (AI DRAFT & TRACKER)
          ========================================================================= */}
      {activeSubTab === 'email' && (
        <div className="outreach-email-grid">
          {/* Left Column: Email Composer */}
          <div className="email-composer-card">
            <div className="composer-header">
              <div className="composer-title">
                <RobotOutlined style={{ color: '#4F46E5', fontSize: 18 }} />
                <span>Soạn Email Tiếp Cận Creator</span>
              </div>
              <Tag color="purple">Tích hợp AI Copywriting</Tag>
            </div>

            <div className="composer-form">
              {/* Recipient select */}
              <div className="form-item-group">
                <label className="form-item-label">Người nhận (Chọn từ Shortlist):</label>
                <Select
                  value={selectedRecipientId}
                  onChange={setSelectedRecipientId}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'c1', label: '🌟 Linh Nguyễn (TikTok & IG - 1.2M) - linhnguyen.booking@gmail.com' },
                    { value: 'c2', label: '🌟 Minh Hoàng (TikTok - 856K) - minhhoang.work@gmail.com' },
                    { value: 'c5', label: '🌟 Bác sĩ Ngọc (Da liễu - 920K) - drngoc.official@clinic.vn' },
                    { value: 'c3', label: '🌟 Thảo Vy (Instagram - 542K) - thaovy.collab@gmail.com' },
                  ]}
                />
              </div>

              {/* AI Generator Control Box */}
              <div className="ai-draft-trigger-box">
                <div className="ai-trigger-top">
                  <div className="ai-trigger-left">
                    <ThunderboltOutlined style={{ color: '#F59E0B' }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>
                      Tạo bản thảo cá nhân hóa bằng AI:
                    </span>
                  </div>

                  <div className="ai-tone-selector">
                    <span style={{ fontSize: 12, color: '#64748B' }}>Tone giọng:</span>
                    <Radio.Group
                      size="small"
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                    >
                      <Radio.Button value="friendly">Thân thiện 💖</Radio.Button>
                      <Radio.Button value="formal">Trang trọng 💼</Radio.Button>
                      <Radio.Button value="concise">Ngắn gọn ⚡</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>

                <Button
                  className="btn-ai-generate-email"
                  icon={<RobotOutlined />}
                  loading={aiGenerating}
                  onClick={handleGenerateAiEmail}
                >
                  {aiGenerating ? 'AI đang soạn thảo...' : '🤖 Bấm để AI tự động viết thư mời'}
                </Button>
              </div>

              {/* Email Subject */}
              <div className="form-item-group">
                <label className="form-item-label">Tiêu đề thư (Subject):</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Nhập tiêu đề thư mời hợp tác..."
                  style={{ borderRadius: 8 }}
                />
              </div>

              {/* Email Body */}
              <div className="form-item-group">
                <label className="form-item-label">Nội dung thư (Email Body):</label>
                <Input.TextArea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Nội dung thư tiếp cận, giới thiệu thương hiệu, sản phẩm và đề xuất thù lao..."
                  style={{ borderRadius: 8 }}
                />
              </div>

              {/* Action Buttons */}
              <div className="composer-actions">
                <Button
                  onClick={() => {
                    message.info('Đã lưu thư nháp vào hàng đợi gửi!');
                  }}
                >
                  Lưu bản nháp
                </Button>

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ background: '#4F46E5', borderRadius: 8, height: 38 }}
                  onClick={handleSendEmail}
                >
                  Gửi Email ngay →
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Email Logs & Open Tracking */}
          <div className="email-tracker-card">
            <div className="tracker-header">
              <div>
                <div className="tracker-title">Nhật ký Email & Theo dõi trạng thái mở</div>
                <div className="tracker-subtitle">
                  Theo dõi thời gian gửi, tỷ lệ mở thư và phản hồi của Creator theo thời gian thực
                </div>
              </div>

              <Input
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Tìm email đã gửi..."
                style={{ width: 220, borderRadius: 8 }}
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                allowClear
              />
            </div>

            <div className="tracker-email-list">
              {filteredEmails.map((item) => (
                <div
                  key={item.id}
                  className="tracker-email-item"
                  onClick={() => setPreviewEmail(item)}
                >
                  <div className="email-item-avatar-wrap">
                    <img src={item.creatorAvatar} alt={item.creatorName} className="email-avatar" />
                  </div>

                  <div className="email-item-content">
                    <div className="email-item-top">
                      <span className="email-creator-name">{item.creatorName}</span>
                      <span className="email-creator-channel">{item.channel}</span>
                      <span className="email-time-tag">{item.sentAt}</span>
                    </div>

                    <div className="email-item-subject">{item.subject}</div>
                    <div className="email-item-preview-text">{item.body.slice(0, 90)}...</div>

                    <div className="email-item-footer">
                      {renderEmailStatusTag(item.status, item.openedCount)}
                      {item.lastOpenedAt && (
                        <span className="last-opened-info">
                          <EyeOutlined style={{ color: '#3B82F6', marginRight: 4 }} />
                          Mở gần nhất: {item.lastOpenedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="email-item-arrow">
                    <RightOutlined style={{ color: '#CBD5E1', fontSize: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: RELATIONSHIP CRM (KANBAN STAGES)
          ========================================================================= */}
      {activeSubTab === 'crm' && (
        <div className="relationship-crm-section">
          {/* Controls Bar */}
          <div className="crm-controls-bar">
            <div className="controls-left">
              <Input
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Tìm Creator trong phễu quan hệ..."
                style={{ width: 260, borderRadius: 8 }}
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                allowClear
              />

              <div className="platform-filter-group">
                <span style={{ fontSize: 12, color: '#64748B' }}>Kênh:</span>
                <Select
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
                  size="small"
                  style={{ width: 130 }}
                  options={[
                    { value: 'all', label: 'Tất cả kênh' },
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'youtube', label: 'YouTube' },
                  ]}
                />
              </div>
            </div>

            <div className="controls-right">
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Tổng giá trị dự kiến:{' '}
                <strong style={{ color: '#4F46E5', fontSize: 14 }}>68.500.000 ₫</strong>
              </span>
            </div>
          </div>

          {/* Kanban Board Container */}
          <div className="crm-kanban-board">
            {stages.map((stage) => {
              const stageCreators = pipelineCreators.filter((c) => {
                if (c.stage !== stage.key) return false;
                if (selectedPlatform !== 'all' && c.platform !== selectedPlatform) return false;
                if (crmSearch) {
                  const q = crmSearch.toLowerCase();
                  return c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q) || c.note.toLowerCase().includes(q);
                }
                return true;
              });

              return (
                <div key={stage.key} className="kanban-column">
                  <div className="kanban-column-header">
                    <div className="kanban-title-row">
                      <span className="kanban-stage-title" style={{ borderLeft: `3px solid ${stage.color}` }}>
                        {stage.title}
                      </span>
                      <span className="kanban-count-badge">{stageCreators.length}</span>
                    </div>
                  </div>

                  <div className="kanban-cards-list">
                    {stageCreators.map((creator) => (
                      <div key={creator.id} className="kanban-card">
                        <div className="kanban-card-top">
                          <img src={creator.avatar} alt={creator.name} className="kanban-avatar" />
                          <div className="kanban-info">
                            <span className="kanban-name">{creator.name}</span>
                            <span className="kanban-user">@{creator.username}</span>
                            <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px', margin: '2px 0 0' }}>
                              ✦ Khớp {creator.matchScore}%
                            </Tag>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="kanban-metrics-row">
                          <div>
                            <span className="k-val">{creator.followers}</span>
                            <span className="k-lbl">Followers</span>
                          </div>
                          <div>
                            <span className="k-val" style={{ color: '#059669' }}>{creator.engagement}</span>
                            <span className="k-lbl">Tương tác</span>
                          </div>
                          <div>
                            <span className="k-val" style={{ color: '#4F46E5' }}>{creator.fee}</span>
                            <span className="k-lbl">Chi phí</span>
                          </div>
                        </div>

                        {/* Recent Note / Activity */}
                        <div className="kanban-note-box">
                          <div className="k-activity-time">🕒 {creator.lastActivity}</div>
                          <div className="k-note-text">"{creator.note}"</div>
                        </div>

                        {/* Card Action Row */}
                        <div className="kanban-card-actions">
                          <button
                            className="btn-kanban-log-note"
                            onClick={() => {
                              setActiveCreatorForNote(creator);
                              setNewLogNote(creator.note);
                              setNoteModalOpen(true);
                            }}
                          >
                            <EditOutlined /> Nhật ký
                          </button>

                          {stage.key !== 'confirmed' && (
                            <button
                              className="btn-kanban-next-stage"
                              onClick={() => handleMoveStage(creator.id, creator.stage)}
                            >
                              Chuyển tiếp <ArrowRightOutlined />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: OFFICIAL INVITATION MANAGER
          ========================================================================= */}
      {activeSubTab === 'invitation' && (
        <div className="invitations-section">
          {/* Filter Bar */}
          <div className="invitations-filter-bar">
            <div className="filter-left">
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Trạng thái phản hồi:</span>
              <Radio.Group
                value={invitationFilter}
                onChange={(e) => setInvitationFilter(e.target.value)}
                size="small"
              >
                <Radio.Button value="all">Tất cả ({invitations.length})</Radio.Button>
                <Radio.Button value="pending">Chờ phản hồi</Radio.Button>
                <Radio.Button value="accepted">Đã chấp thuận</Radio.Button>
                <Radio.Button value="counter_offer">Đề xuất lại giá</Radio.Button>
                <Radio.Button value="declined">Từ chối</Radio.Button>
              </Radio.Group>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#4F46E5', borderRadius: 8 }}
              onClick={() => setCreateInviteModalOpen(true)}
            >
              + Tạo thư mời mới
            </Button>
          </div>

          {/* Invitations Table */}
          <div className="invitations-table-wrap">
            <table className="invitations-table">
              <thead>
                <tr>
                  <th>Mã thư mời</th>
                  <th>Creator người nhận</th>
                  <th>Thù lao cam kết</th>
                  <th>Ấn phẩm yêu cầu (Deliverables)</th>
                  <th>Hạn nộp kịch bản</th>
                  <th>Hạn đăng bài</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitations.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className="invite-code-pill">{inv.code}</span>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>{inv.createdAt}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={inv.creatorAvatar} alt={inv.creatorName} className="invite-avatar" />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>{inv.creatorName}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{inv.creatorPlatform}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#4F46E5' }}>{inv.fee}</div>
                      {inv.counterFee && (
                        <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>
                          (Đề xuất: {inv.counterFee})
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.3 }}>{inv.deliverables}</div>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>🎁 {inv.freeProducts}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#475569' }}>📅 {inv.scriptDeadline}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>🚀 {inv.postDeadline}</span>
                    </td>
                    <td>{renderInvitationStatusTag(inv.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button
                          size="small"
                          onClick={() => setDetailInviteModal(inv)}
                        >
                          Chi tiết
                        </Button>

                        {inv.status === 'accepted' && (
                          <Button
                            size="small"
                            type="primary"
                            style={{ background: '#10B981' }}
                            onClick={() => {
                              message.success(`Đã chuyển ${inv.creatorName} sang phân hệ Vận hành hợp tác & Ký hợp đồng!`);
                            }}
                          >
                            Hợp tác
                          </Button>
                        )}

                        {inv.status === 'pending' && (
                          <Button
                            size="small"
                            icon={<SendOutlined />}
                            onClick={() => message.success(`Đã gửi email nhắc nhở phản hồi tới ${inv.creatorName}!`)}
                          >
                            Nhắc nhở
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
          MODAL: XEM TRƯỚC NỘI DUNG EMAIL
          ========================================================================= */}
      <Modal
        title={`Chi tiết Email đã gửi: ${previewEmail?.creatorName}`}
        open={!!previewEmail}
        onCancel={() => setPreviewEmail(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewEmail(null)}>
            Đóng
          </Button>,
          <Button
            key="resend"
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              message.success(`Đã gửi lại email theo dõi tới ${previewEmail?.creatorName}!`);
              setPreviewEmail(null);
            }}
          >
            Gửi email tiếp theo (Follow-up)
          </Button>,
        ]}
        width={580}
      >
        {previewEmail && (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, marginBottom: 14 }}>
              <div><strong>Người nhận:</strong> {previewEmail.creatorName} &lt;{previewEmail.creatorEmail}&gt;</div>
              <div style={{ marginTop: 4 }}><strong>Tiêu đề:</strong> {previewEmail.subject}</div>
              <div style={{ marginTop: 4 }}>
                <strong>Trạng thái:</strong> {renderEmailStatusTag(previewEmail.status, previewEmail.openedCount)}
                <span style={{ marginLeft: 12, fontSize: 12, color: '#64748B' }}>
                  Gửi lúc: {previewEmail.sentAt}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line', color: '#1E293B', padding: 8 }}>
              {previewEmail.body}
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================================
          MODAL: GHI NHẬT KÝ TƯƠNG TÁC KANBAN
          ========================================================================= */}
      <Modal
        title={`Cập nhật nhật ký trao đổi: ${activeCreatorForNote?.name}`}
        open={noteModalOpen}
        onCancel={() => setNoteModalOpen(false)}
        onOk={handleSaveLogNote}
        okText="Lưu nhật ký"
        cancelText="Hủy"
      >
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Nội dung trao đổi / kết quả thương lượng:
          </label>
          <Input.TextArea
            rows={4}
            value={newLogNote}
            onChange={(e) => setNewLogNote(e.target.value)}
            placeholder="Ví dụ: Đã gọi điện trao đổi, creator đồng ý giảm giá còn 14 triệu nếu cọc trước 30%..."
          />
        </div>
      </Modal>

      {/* =========================================================================
          MODAL: TẠO THƯ MỜI HỢP TÁC CHÍNH THỨC
          ========================================================================= */}
      <Modal
        title="Tạo Thư mời Hợp tác Chính thức (Collaboration Invitation)"
        open={createInviteModalOpen}
        onCancel={() => setCreateInviteModalOpen(false)}
        footer={null}
        width={620}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleCreateInviteSubmit} style={{ marginTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Form.Item
              name="creatorName"
              label="Tên Creator"
              rules={[{ required: true, message: 'Vui lòng nhập tên Creator!' }]}
              initialValue="Linh Nguyễn"
            >
              <Input placeholder="Nhập tên creator..." />
            </Form.Item>

            <Form.Item
              name="platform"
              label="Kênh & Lượng người theo dõi"
              rules={[{ required: true, message: 'Vui lòng nhập thông tin kênh!' }]}
              initialValue="TikTok & Instagram (1.2M)"
            >
              <Input placeholder="Vd: TikTok (850K)..." />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Form.Item
              name="fee"
              label="Mức thù lao cam kết (VND)"
              rules={[{ required: true, message: 'Vui lòng nhập mức thù lao!' }]}
              initialValue="15.000.000 ₫"
            >
              <Input placeholder="Vd: 15.000.000 ₫..." />
            </Form.Item>

            <Form.Item
              name="freeProducts"
              label="Sản phẩm tài trợ gửi tặng"
              initialValue="Bộ Kit Skincare Summer Glow"
            >
              <Input placeholder="Vd: Bộ mỹ phẩm cao cấp..." />
            </Form.Item>
          </div>

          <Form.Item
            name="deliverables"
            label="Ấn phẩm cam kết bàn giao (Deliverables)"
            rules={[{ required: true, message: 'Vui lòng nhập yêu cầu ấn phẩm!' }]}
            initialValue="1 Video TikTok 60s + 1 Story Instagram kèm link bio"
          >
            <Input.TextArea rows={2} placeholder="Vd: 1 Video ngắn 60s trên TikTok, 1 bài viết..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Form.Item name="scriptDeadline" label="Hạn chốt kịch bản (Script Deadline)">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>

            <Form.Item name="postDeadline" label="Hạn đăng bài chính thức (Post Deadline)">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Ghi chú điều khoản nghiệm thu & bản quyền">
            <Input.TextArea rows={2} placeholder="Vd: Quyền sử dụng video chạy quảng cáo 90 ngày..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setCreateInviteModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#4F46E5', borderRadius: 8 }}>
              Phát hành Thư mời chính thức
            </Button>
          </div>
        </Form>
      </Modal>

      {/* =========================================================================
          MODAL: CHI TIẾT THƯ MỜI CHÍNH THỨC
          ========================================================================= */}
      <Modal
        title={`Chi tiết Thư mời: ${detailInviteModal?.code}`}
        open={!!detailInviteModal}
        onCancel={() => setDetailInviteModal(null)}
        footer={[
          <Button key="close" onClick={() => setDetailInviteModal(null)}>
            Đóng
          </Button>,
        ]}
        width={560}
      >
        {detailInviteModal && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 14 }}>
              <img src={detailInviteModal.creatorAvatar} alt={detailInviteModal.creatorName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{detailInviteModal.creatorName}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{detailInviteModal.creatorPlatform}</div>
                <div style={{ marginTop: 4 }}>{renderInvitationStatusTag(detailInviteModal.status)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div><strong>Thù lao đề xuất:</strong> <span style={{ color: '#4F46E5', fontWeight: 700 }}>{detailInviteModal.fee}</span></div>
              {detailInviteModal.counterFee && (
                <div style={{ color: '#D97706' }}>
                  <strong>Creator đề xuất lại:</strong> {detailInviteModal.counterFee}
                </div>
              )}
              <div><strong>Ấn phẩm cam kết:</strong> {detailInviteModal.deliverables}</div>
              <div><strong>Sản phẩm tài trợ:</strong> {detailInviteModal.freeProducts}</div>
              <div><strong>Hạn nộp kịch bản:</strong> {detailInviteModal.scriptDeadline}</div>
              <div><strong>Hạn đăng bài:</strong> {detailInviteModal.postDeadline}</div>
              <div><strong>Ghi chú điều khoản:</strong> {detailInviteModal.notes}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
