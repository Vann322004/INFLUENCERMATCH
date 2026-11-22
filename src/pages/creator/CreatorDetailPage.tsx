import CampaignImage from '../../components/common/CampaignImage';
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Spin, Tabs, Tag } from 'antd';
import { ArrowLeftOutlined, ExportOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { creatorService } from '../../services/api/creatorService';
import { shortlistService } from '../../services/api/shortlistService';
import { authService } from '../../services/api/authService';
import { activeCampaignId } from '../../services/campaignContext';
import { getStoredUser } from '../../services/authSession';
import type { CreatorDetail } from '../../types/api/creator.types';
import CreatorAvatar from './components/discovery/CreatorAvatar';
import AddToShortlistModal from '../../components/discovery/AddToShortlistModal';
import './CreatorDetailPage.css';

const numberText = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : 'Chưa có dữ liệu';
const safeLink = (value: unknown) => {
  try { const url = new URL(String(value)); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
};
const pointerKey = () => `im_creator_detail:${getStoredUser()?.id ?? 'anonymous'}`;
const storedCreator = () => { try { return sessionStorage.getItem(pointerKey()) || ''; } catch { return ''; } };

export default function CreatorDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const creatorId = id || location.state?.creatorId || location.state?.creator?.id || storedCreator();
  const campaignId = new URLSearchParams(location.search).get('campaignId') || location.state?.campaignId || location.state?.campaign?.id || activeCampaignId();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [shortlistError, setShortlistError] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const signedInUser = authService.getCurrentUser();
  const canClaim = signedInUser?.role === 'CREATOR' && signedInUser.status === 'ACTIVE'
    && signedInUser.permissions?.includes('CLAIM_CREATOR_PROFILE');

  useEffect(() => {
    if (!creatorId) return;
    try { sessionStorage.setItem(pointerKey(), creatorId); } catch { /* Optional navigation pointer. */ }
    if (id || location.search) navigate('/creators/detail', { replace: true,
      state: { ...location.state, creatorId, campaignId } });
  }, [creatorId, campaignId, id, location.search, location.state, navigate]);

  useEffect(() => {
    let active = true;
    setCreator(null); setError(''); setLoading(Boolean(creatorId)); setSaved(null); setShortlistError(false);
    if (!creatorId) return;
    creatorService.getCreatorById(creatorId).then(data => { if (active) setCreator(data); })
      .catch(err => { if (active) setError(err?.response?.data?.detail || 'Không thể tải hồ sơ nhà sáng tạo.'); })
      .finally(() => { if (active) setLoading(false); });
    if (campaignId) shortlistService.all(campaignId).then(items => {
      if (active) setSaved(items.some(item => item.creatorId === creatorId && item.status !== 'REMOVED'));
    }).catch(() => { if (active) setShortlistError(true); });
    return () => { active = false; };
  }, [creatorId, campaignId, retry]);

  const back = () => navigate('/creators', { state: { campaignId: campaignId || undefined } });
  if (loading) return <div className="creator-detail-container creator-detail-loading"><Spin size="large" /></div>;
  if (error) return <div className="creator-detail-container"><Alert type="error" showIcon title="Không tải được hồ sơ" description={error}
    action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /><Button onClick={back}>Về Khám phá</Button></div>;
  if (!creator) return <div className="creator-detail-container"><Empty description="Chọn một nhà sáng tạo từ trang Khám phá để xem hồ sơ" /><Button onClick={back}>Khám phá nhà sáng tạo</Button></div>;

  const name = creator.displayName || creator.userName || 'Nhà sáng tạo';
  const username = creator.userName?.replace(/^@+/, '');
  const categories = [...new Set([creator.niche, creator.category].filter(Boolean).flatMap(value => value!.split(/[,;]/)).map(value => value.trim()).filter(Boolean))];
  const profileLink = safeLink(creator.profileUrl);
  const posts = creator.recentPosts ?? [];
  const metrics = [
    ['Người theo dõi', numberText(creator.followers)], ['Lượt xem trung bình', numberText(creator.avgViews)],
    ['Tỷ lệ tương tác', typeof creator.engagementRate === 'number' && Number.isFinite(creator.engagementRate) ? `${numberText(creator.engagementRate * 100)}%` : 'Chưa có dữ liệu'],
    ['Lượt thích trung bình', numberText(creator.avgLikes)], ['Bình luận trung bình', numberText(creator.avgComments)],
    ['Chia sẻ trung bình', numberText(creator.avgShares)],
  ];
  const fees = [creator.estimatedFeeMin, creator.estimatedFeeMax];
  const hasFee = fees.some(value => typeof value === 'number' && Number.isFinite(value));
  const feeText = hasFee ? `${fees[0] != null ? numberText(fees[0]) : 'Chưa có mức tối thiểu'} – ${fees[1] != null ? numberText(fees[1]) : 'Chưa có mức tối đa'} ₫` : 'Chưa có dữ liệu';
  const sourceLabel = creator.sourceType === 'AUTHORIZED' ? 'Kênh đã cấp quyền truy cập' : creator.sourceType === 'PUBLIC' ? 'Thông tin kênh công khai' : 'Chưa có thông tin nguồn';
  const renderPosts = (items: typeof posts) => <div className="creator-detail-live-posts">{items.map((post, index) => {
    const link = safeLink(post.postUrl);
    return <Card key={`${post.platformPostId ?? 'post'}-${index}`}>
      <CampaignImage src={post.thumbnailUrl} alt="Ảnh bài đăng" style={{ width: '100%', height: 150, objectFit: 'contain', borderRadius: 10, marginBottom: 12 }} />
      <div className="creator-detail-post-meta"><Tag>{creator.platform || 'Bài đăng'}</Tag>{post.postedAt && <span>{post.postedAt.replace('T', ' ').replace(/\.\d+/, '')}</span>}</div>
      <p className="creator-detail-live-summary creator-detail-post-caption">{post.caption?.trim() || 'Bài đăng chưa có mô tả'}</p>
      <dl>{[['Lượt xem', post.views], ['Lượt thích', post.likes], ['Bình luận', post.comments], ['Chia sẻ', post.shares]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{numberText(value)}</dd></div>)}</dl>
      {link && <Button href={link} target="_blank" rel="noopener noreferrer" icon={<ExportOutlined />}>Xem bài đăng</Button>}
    </Card>;
  })}</div>;
  return <div className="creator-detail-container creator-detail-live">
    <Button type="text" icon={<ArrowLeftOutlined />} onClick={back} className="creator-detail-back">Khám phá nhà sáng tạo</Button>
    <Card className="creator-detail-live-header">
      <div className="creator-detail-live-heading">
        <CreatorAvatar src={creator.avatarUrl} name={name} size={72} />
        <div className="creator-detail-live-name"><h1>{name}</h1>{username && <p>@{username}</p>}
          <div className="creator-detail-live-tags">{creator.platform && <Tag>{creator.platform}</Tag>}
            {creator.verifiedByInfluencerMatch === true && <Tag>Đã xác minh trên InfluencerMatch</Tag>}
            {saved === true && <Tag>Đã lưu trong chiến dịch</Tag>}</div>
          <p className="creator-detail-header-context">{[creator.location, categories.slice(0, 2).join(' · ')].filter(Boolean).join(' · ') || sourceLabel}</p>
        </div>
        <div className="creator-detail-live-actions">
          {profileLink && <Button href={profileLink} target="_blank" rel="noopener noreferrer" icon={<ExportOutlined />}>Mở kênh</Button>}
          {canClaim && (
            <Button icon={<SafetyCertificateOutlined style={{ color: '#1D4ED8' }} />} onClick={() => navigate('/creator/social-accounts?claim=new')}>
              Gửi bằng chứng thủ công
            </Button>
          )}
          <Button type="primary" disabled={Boolean(campaignId) && saved === null} onClick={() => saved && campaignId
            ? navigate('/creators/shortlist', { state: { campaignId } }) : setShortlistOpen(true)}>
            {saved ? 'Xem trong danh sách chọn' : 'Lưu vào danh sách'}</Button>
        </div>
      </div>
      <div className="creator-detail-header-bottom"><span>Hồ sơ nhà sáng tạo</span><span>{sourceLabel}</span></div>
      {shortlistError && <Alert type="warning" title="Chưa kiểm tra được trạng thái danh sách chọn" action={<Button size="small" onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} />}
    </Card>
    <section className="creator-detail-performance" aria-label="Chỉ số kênh"><div className="creator-detail-section-heading"><div><h2>Hiệu suất kênh</h2><p>Các chỉ số công khai được hệ thống ghi nhận.</p></div></div>
    <div className="creator-detail-live-metrics">{metrics.map(([label, value], index) => <Card key={label} className={index < 3 ? 'creator-detail-primary-metric' : ''}><span>{label}</span><strong>{value}</strong>
      {index === 0 && creator.followerChange7d != null && <small>{creator.followerChange7d > 0 ? '+' : ''}{numberText(creator.followerChange7d)} người theo dõi trong 7 ngày</small>}
    </Card>)}</div></section>
    <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
      { key: 'profile', label: 'Tổng quan hồ sơ', children: <div className="creator-detail-overview">
        <div className="creator-detail-overview-main"><Card title="Về nhà sáng tạo"><p className="creator-detail-live-summary">{creator.contentSummary?.trim() || 'Kênh chưa có nội dung giới thiệu được ghi nhận. Bạn có thể mở kênh để xem nội dung trực tiếp.'}</p>
          <div className="creator-detail-live-tags">{categories.map(category => <Tag key={category}>{category}</Tag>)}</div>
        </Card>
        <section className="creator-detail-post-preview"><div className="creator-detail-section-heading"><div><h2>Nội dung đã ghi nhận</h2><p>Xem chủ đề và tương tác trên từng bài đăng.</p></div>{posts.length > 3 && <Button type="text" onClick={() => setActiveTab('posts')}>Xem tất cả ({posts.length})</Button>}</div>
          {posts.length ? renderPosts(posts.slice(0, 3)) : <Card><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài đăng được đồng bộ" />{profileLink && <Button href={profileLink} target="_blank" rel="noopener noreferrer">Xem nội dung trên kênh</Button>}</Card>}
        </section></div>
        <aside className="creator-detail-overview-aside"><Card title="Thông tin kênh"><dl className="creator-detail-facts">
          <div><dt>Nền tảng</dt><dd>{creator.platform || 'Chưa có dữ liệu'}</dd></div>
          <div><dt>Tên tài khoản</dt><dd>{username ? `@${username}` : 'Chưa có dữ liệu'}</dd></div>
          <div><dt>Địa điểm trên hồ sơ</dt><dd>{creator.location || 'Chưa có dữ liệu'}</dd></div>
          <div><dt>Nguồn dữ liệu</dt><dd>{sourceLabel}</dd></div>
          <div><dt>Xác minh trên InfluencerMatch</dt><dd>{creator.verifiedByInfluencerMatch === true ? 'Đã xác minh' : 'Chưa có xác minh được ghi nhận'}</dd></div>
          {creator.authorizedAt && <div><dt>Thời điểm cấp quyền</dt><dd>{creator.authorizedAt.replace('T', ' ').replace(/\.\d+/, '')}</dd></div>}
        </dl></Card>
        <Card title="Chi phí tham khảo" className="creator-detail-fee-card"><span className="creator-detail-fee-caption">Khoảng phí ước tính</span><strong>{feeText}</strong>
          <p>Ước tính do hệ thống cung cấp, không phải báo giá đã xác nhận. Phí hợp tác được chốt trong thỏa thuận.</p>
        </Card>
        <Card title="Lựa chọn cho chiến dịch" className="creator-detail-next-step"><p>{saved ? 'Kênh đã có trong danh sách chọn. Tiếp tục so sánh hoặc chạy gợi ý cùng các kênh đã lưu.' : 'Lưu kênh để so sánh và đánh giá mức độ phù hợp với yêu cầu chiến dịch.'}</p>
          <Button block type="primary" disabled={Boolean(campaignId) && saved === null} onClick={() => saved && campaignId ? navigate('/creators/shortlist', { state: { campaignId } }) : setShortlistOpen(true)}>{saved ? 'Mở danh sách đã chọn' : 'Lưu vào danh sách'}</Button>
        </Card></aside>
      </div> },
      { key: 'posts', label: `Bài đăng (${posts.length})`, children: posts.length ? renderPosts(posts) : <Empty description="Chưa có dữ liệu bài đăng" /> },
    ]} />
    <AddToShortlistModal open={shortlistOpen} onClose={() => setShortlistOpen(false)} defaultCampaignId={campaignId || undefined}
      creator={{ id: creator.id, name, username: username || '', avatar: creator.avatarUrl || '', platform: creator.platform }}
      onSuccess={selectedCampaignId => { if (selectedCampaignId === campaignId) setSaved(true); }} />
  </div>;
}
