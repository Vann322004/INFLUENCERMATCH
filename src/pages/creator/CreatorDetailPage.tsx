import CampaignImage from '../../components/common/CampaignImage';
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Spin, Tabs, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  ExportOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  EyeOutlined,
  RiseOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { creatorService } from '../../services/api/creatorService';
import { creatorPortalService, type CreatorRateCardPackage } from '../../services/api/creatorPortalService';
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
  const [rateCards, setRateCards] = useState<CreatorRateCardPackage[]>([]);

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
    if (signedInUser?.role === 'BRAND') {
      creatorPortalService.fetchCreatorRateCards(creatorId).then(list => {
        if (active) setRateCards(list);
      });
    }
    return () => { active = false; };
  }, [creatorId, campaignId, retry, signedInUser?.role]);

  const fromShortlist = location.state?.from === 'shortlist' || location.state?.returnTo === '/creators/shortlist';
  const backPath = fromShortlist ? '/creators/shortlist' : '/creators';
  const backLabel = fromShortlist ? 'Danh sách đã chọn' : 'Khám phá nhà sáng tạo';
  const back = () => navigate(backPath, { state: { campaignId: campaignId || undefined } });
  if (loading) return <div className="creator-detail-container creator-detail-loading"><Spin size="large" /></div>;
  if (error) return <div className="creator-detail-container"><Alert type="error" showIcon title="Không tải được hồ sơ" description={error}
    action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /><Button onClick={back}>{fromShortlist ? 'Về Danh sách đã chọn' : 'Về Khám phá'}</Button></div>;
  if (!creator) return <div className="creator-detail-container"><Empty description="Chọn một nhà sáng tạo để xem hồ sơ" /><Button onClick={back}>{backLabel}</Button></div>;

  const name = creator.displayName || creator.userName || 'Nhà sáng tạo';
  const username = creator.userName?.replace(/^@+/, '');
  const categories = [...new Set([creator.niche, creator.category].filter(Boolean).flatMap(value => value!.split(/[,;]/)).map(value => value.trim()).filter(Boolean))];
  const profileLink = safeLink(creator.profileUrl);
  const posts = creator.recentPosts ?? [];
  const metrics = [
    {
      label: 'Người theo dõi',
      value: numberText(creator.followers),
      icon: <UserOutlined />,
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    {
      label: 'Lượt xem trung bình',
      value: numberText(creator.avgViews),
      icon: <EyeOutlined />,
      color: '#0284C7',
      bg: '#E0F2FE',
    },
    {
      label: 'Tỷ lệ tương tác',
      value: typeof creator.engagementRate === 'number' && Number.isFinite(creator.engagementRate) ? `${numberText(creator.engagementRate * 100)}%` : 'Chưa có dữ liệu',
      icon: <RiseOutlined />,
      color: '#059669',
      bg: '#D1FAE5',
    },
    {
      label: 'Lượt thích trung bình',
      value: numberText(creator.avgLikes),
      icon: <HeartOutlined />,
      color: '#E11D48',
      bg: '#FFE4E6',
    },
    {
      label: 'Bình luận trung bình',
      value: numberText(creator.avgComments),
      icon: <MessageOutlined />,
      color: '#D97706',
      bg: '#FEF3C7',
    },
    {
      label: 'Chia sẻ trung bình',
      value: numberText(creator.avgShares),
      icon: <ShareAltOutlined />,
      color: '#4F46E5',
      bg: '#E0E7FF',
    },
  ];
  const chartData = [...posts]
    .slice(0, 8)
    .reverse()
    .map((post, index) => {
      const dateLabel = post.postedAt
        ? new Date(post.postedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        : `Bài ${index + 1}`;
      const views = typeof post.views === 'number' && Number.isFinite(post.views) ? post.views : 0;
      const interactions =
        (typeof post.likes === 'number' && Number.isFinite(post.likes) ? post.likes : 0) +
        (typeof post.comments === 'number' && Number.isFinite(post.comments) ? post.comments : 0) +
        (typeof post.shares === 'number' && Number.isFinite(post.shares) ? post.shares : 0);
      return {
        name: dateLabel === 'Invalid Date' ? `Bài ${index + 1}` : dateLabel,
        views,
        interactions,
      };
    });
  const showChart = chartData.length >= 2 && chartData.some((item) => item.views > 0 || item.interactions > 0);
  const fees = [creator.estimatedFeeMin, creator.estimatedFeeMax];
  const hasFee = fees.some(value => typeof value === 'number' && Number.isFinite(value));
  const feeText = hasFee ? `${fees[0] != null ? numberText(fees[0]) : 'Chưa có mức tối thiểu'} – ${fees[1] != null ? numberText(fees[1]) : 'Chưa có mức tối đa'} ₫` : 'Chưa có dữ liệu';
  const sourceLabel = creator.sourceType === 'AUTHORIZED' ? 'Kênh đã cấp quyền truy cập' : creator.sourceType === 'PUBLIC' ? 'Thông tin kênh công khai' : 'Chưa có thông tin nguồn';
  const renderPosts = (items: typeof posts, compact = false) => (
    <div className={compact ? 'creator-detail-live-posts is-compact' : 'creator-detail-live-posts'}>
      {items.map((post, index) => {
        const link = safeLink(post.postUrl);
        return (
          <Card key={`${post.platformPostId ?? 'post'}-${index}`} className="creator-detail-post-card">
            <div className="creator-detail-post-body">
              <CampaignImage
                src={post.thumbnailUrl}
                alt="Ảnh bài đăng"
                className="creator-detail-post-thumb"
              />
              <div className="creator-detail-post-content">
                <div className="creator-detail-post-meta">
                  <Tag>{creator.platform || 'Bài đăng'}</Tag>
                  {post.postedAt && <span>{post.postedAt.replace('T', ' ').replace(/\.\d+/, '')}</span>}
                </div>
                <p className="creator-detail-live-summary creator-detail-post-caption">
                  {post.caption?.trim() || 'Bài đăng chưa có mô tả'}
                </p>
                <dl>
                  {[['Lượt xem', post.views], ['Lượt thích', post.likes], ['Bình luận', post.comments], ['Chia sẻ', post.shares]].map(([label, value]) => (
                    <div key={String(label)}>
                      <dt>{label}</dt>
                      <dd>{numberText(value)}</dd>
                    </div>
                  ))}
                </dl>
                {link && (
                  <Button size="small" href={link} target="_blank" rel="noopener noreferrer" icon={<ExportOutlined />}>
                    Xem bài đăng
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
  return <div className="creator-detail-container creator-detail-live">
    <Button type="text" icon={<ArrowLeftOutlined />} onClick={back} className="creator-detail-back">{backLabel}</Button>
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
    <div className="creator-detail-live-metrics">{metrics.map((metric, index) => <Card key={metric.label} className={index < 3 ? 'creator-detail-primary-metric' : ''} style={{ borderTop: `3px solid ${metric.color}` }}>
      <div className="creator-detail-metric-head">
        <span>{metric.label}</span>
        <span className="creator-detail-metric-icon" style={{ color: metric.color, background: metric.bg }}>{metric.icon}</span>
      </div>
      <strong>{metric.value}</strong>
      {index === 0 && creator.followerChange7d != null && <small>{creator.followerChange7d > 0 ? '+' : ''}{numberText(creator.followerChange7d)} người theo dõi trong 7 ngày</small>}
    </Card>)}</div>
    {showChart && (
      <Card className="creator-detail-chart-card">
        <div className="creator-detail-chart-head">
          <div>
            <h3>Xu hướng lượt xem & tương tác gần đây</h3>
            <p>Thống kê trên {chartData.length} bài đăng công khai gần nhất.</p>
          </div>
          <div className="creator-detail-chart-legend">
            <span><i style={{ background: '#7C3AED' }} />Lượt xem</span>
            <span><i style={{ background: '#10B981' }} />Tương tác</span>
          </div>
        </div>
        <div className="creator-detail-chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => Number(v).toLocaleString('vi-VN')} />
              <Tooltip
                formatter={(value: unknown, name: unknown) => [
                  numberText(Number(value)),
                  name === 'views' ? 'Lượt xem' : 'Tương tác',
                ]}
                contentStyle={{ borderRadius: 10, borderColor: '#E1E7F0', fontSize: 12.5 }}
              />
              <Bar dataKey="views" name="views" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="interactions" name="interactions" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    )}
    </section>
    <div className="creator-detail-tabs-card">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'profile', label: 'Tổng quan hồ sơ', children: <div className="creator-detail-overview">
          <div className="creator-detail-overview-main"><Card title="Về nhà sáng tạo"><p className="creator-detail-live-summary">{creator.contentSummary?.trim() || 'Kênh chưa có nội dung giới thiệu được ghi nhận. Bạn có thể mở kênh để xem nội dung trực tiếp.'}</p>
            <div className="creator-detail-live-tags">{categories.map(category => <Tag key={category}>{category}</Tag>)}</div>
          </Card>
          {rateCards.length > 0 && (
            <Card title="Bảng giá dịch vụ (Rate Card) do Creator công bố">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rateCards.map((pkg) => (
                  <div key={pkg.id} style={{ padding: '12px 14px', border: '1px solid #E1E7F0', borderRadius: 10, background: '#FAFBFD' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#0F172A', fontSize: 14 }}>{pkg.name}</strong>
                      <strong style={{ color: '#7C3AED', fontSize: 15 }}>{pkg.priceVnd.toLocaleString('vi-VN')} ₫</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      {pkg.platform} · {pkg.format} · Giao bài {pkg.turnaroundDays} ngày · Bản quyền {pkg.usageRightsDays} ngày
                    </div>
                    {pkg.deliverables?.length > 0 && (
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: '#334155' }}>
                        {pkg.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
          <section className="creator-detail-post-preview"><div className="creator-detail-section-heading"><div><h2>Nội dung đã ghi nhận</h2><p>Xem chủ đề và tương tác trên từng bài đăng.</p></div>{posts.length > 3 && <Button type="text" onClick={() => setActiveTab('posts')}>Xem tất cả ({posts.length})</Button>}</div>
            {posts.length ? renderPosts(posts.slice(0, 3), true) : <Card><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài đăng được đồng bộ" />{profileLink && <Button href={profileLink} target="_blank" rel="noopener noreferrer">Xem nội dung trên kênh</Button>}</Card>}
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
          </Card></aside>
        </div> },
        { key: 'posts', label: `Bài đăng (${posts.length})`, children: <div className="creator-detail-posts-tab-wrap">{posts.length ? renderPosts(posts) : <Empty description="Chưa có dữ liệu bài đăng" />}</div> },
      ]} />
    </div>
    <AddToShortlistModal open={shortlistOpen} onClose={() => setShortlistOpen(false)} defaultCampaignId={campaignId || undefined}
      creator={{ id: creator.id, name, username: username || '', avatar: creator.avatarUrl || '', platform: creator.platform }}
      onSuccess={selectedCampaignId => { if (selectedCampaignId === campaignId) setSaved(true); }} />
  </div>;
}
