import React, { useState } from 'react';
import {
  Row, Col, Card, Select, Button, Tag, Rate,
  Progress, Tabs, Avatar, Form, Input, Modal, message,
  Tooltip, Badge, Statistic, Divider, InputNumber,
} from 'antd';
import {
  RiseOutlined, FallOutlined, TrophyOutlined, StarFilled,
  DollarOutlined, EyeOutlined, HeartOutlined, CheckCircleOutlined,
  DownloadOutlined, PlusOutlined, ClockCircleOutlined, InfoCircleOutlined,
  FlagFilled, EditOutlined, LikeOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './PerformancePage.css';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface CampaignROI {
  id: string; name: string; budget: number; spent: number; revenue: number;
  roas: number; reach: number; clicks: number; conversions: number;
  creators: number; status: 'active' | 'completed' | 'paused';
  selfReported: boolean; // Self-reported flag
}
interface CreatorReview {
  id: string; creatorName: string; avatar: string; platform: string;
  campaign: string; punctuality: number; attitude: number;
  quality: number; kpiAchieved: number; overallRating: number;
  comment: string; date: string; reviewed: boolean;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const CAMPAIGNS: CampaignROI[] = [
  { id:'c1', name:'Summer Glow 2024', budget:80000000, spent:72000000, revenue:210000000, roas:2.92, reach:4500000, clicks:180000, conversions:5400, creators:12, status:'completed', selfReported:false },
  { id:'c2', name:'Back to School', budget:50000000, spent:43000000, revenue:115000000, roas:2.67, reach:2800000, clicks:112000, conversions:2800, creators:8, status:'completed', selfReported:true },
  { id:'c3', name:'Tet Campaign 2024', budget:120000000, spent:98000000, revenue:340000000, roas:3.47, reach:8200000, clicks:310000, conversions:9300, creators:20, status:'completed', selfReported:false },
  { id:'c4', name:'Flash Sale 11.11', budget:60000000, spent:55000000, revenue:145000000, roas:2.64, reach:3300000, clicks:138000, conversions:3300, creators:10, status:'active', selfReported:true },
];

const INIT_REVIEWS: CreatorReview[] = [
  { id:'r1', creatorName:'Linh Nguyen', avatar:'https://i.pravatar.cc/80?img=1', platform:'TikTok', campaign:'Summer Glow 2024', punctuality:5, attitude:5, quality:5, kpiAchieved:4, overallRating:4.8, comment:'Linh rat chuyen nghiep, noi dung sang tao va giao hang dung han. Ket qua vuot ky vong!', date:'2024-09-15', reviewed:true },
  { id:'r2', creatorName:'Nam Tran', avatar:'https://i.pravatar.cc/80?img=2', platform:'YouTube', campaign:'Tet Campaign 2024', punctuality:4, attitude:5, quality:5, kpiAchieved:4, overallRating:4.5, comment:'Nam co kien thuc tot ve thuong hieu. Can cai thien toc do phan hoi.', date:'2024-03-01', reviewed:true },
  { id:'r3', creatorName:'Minh Le', avatar:'https://i.pravatar.cc/80?img=4', platform:'TikTok', campaign:'Flash Sale 11.11', punctuality:5, attitude:5, quality:5, kpiAchieved:5, overallRating:4.9, comment:'Xuat sac! Minh Le la creator hang dau chung toi tung hop tac.', date:'2024-11-15', reviewed:true },
  { id:'r4', creatorName:'Huong Pham', avatar:'https://i.pravatar.cc/80?img=3', platform:'Instagram', campaign:'Back to School', punctuality:0, attitude:0, quality:0, kpiAchieved:0, overallRating:0, comment:'', date:'', reviewed:false },
  { id:'r5', creatorName:'Thu Ha', avatar:'https://i.pravatar.cc/80?img=5', platform:'YouTube', campaign:'Summer Glow 2024', punctuality:0, attitude:0, quality:0, kpiAchieved:0, overallRating:0, comment:'', date:'', reviewed:false },
];

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
const fmtVND = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(2)} ty` : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M vnd` : `${n.toLocaleString()} vnd`;

// ─── KPI Summary Card ─────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string; sub?: string; trend?: number; icon: React.ReactNode; color: string }> =
  ({ label, value, sub, trend, icon, color }) => (
    <div className="perf-kpi-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="perf-kpi-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="perf-kpi-body">
        <div className="perf-kpi-value">{value}</div>
        <div className="perf-kpi-label">{label}</div>
        {sub && <div className="perf-kpi-sub">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={`perf-kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );

// ─── Horizontal bar component ─────────────────────────────────────────────────
const HBar: React.FC<{ label: string; value: number; maxValue: number; color: string; suffix?: string; selfReported?: boolean }> =
  ({ label, value, maxValue, color, suffix = '', selfReported }) => (
    <div className="perf-hbar-row">
      <div className="perf-hbar-label">
        {label}
        {selfReported && (
          <Tooltip title="Du lieu tu khai bao boi Brand — chua duoc xac minh doc lap">
            <FlagFilled style={{ color: '#f59e0b', fontSize: 11, marginLeft: 5 }} />
          </Tooltip>
        )}
      </div>
      <div className="perf-hbar-track">
        <div className="perf-hbar-fill" style={{ width: `${Math.min((value / maxValue) * 100, 100)}%`, background: color }} />
      </div>
      <div className="perf-hbar-val">{suffix}{fmtVND(value)}</div>
    </div>
  );

// ─── Radar-style score display ────────────────────────────────────────────────
const ScoreRow: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="score-row">
    <span className="score-icon">{icon}</span>
    <span className="score-label">{label}</span>
    <Rate disabled value={value} style={{ fontSize: 13 }} />
    <span className="score-num">{value}/5</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const PerformancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roi');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [reviews, setReviews] = useState<CreatorReview[]>(INIT_REVIEWS);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; creator?: CreatorReview }>({ open: false });
  const [detailModal, setDetailModal] = useState<{ open: boolean; review?: CreatorReview }>({ open: false });
  const [form] = Form.useForm();

  const totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const totalSpent = CAMPAIGNS.reduce((s, c) => s + c.spent, 0);
  const avgROAS = (totalRevenue / totalSpent).toFixed(2);
  const totalReach = CAMPAIGNS.reduce((s, c) => s + c.reach, 0);
  const totalConv = CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const selfReportedCount = CAMPAIGNS.filter(c => c.selfReported).length;

  const filteredCampaigns = filterCampaign === 'all'
    ? CAMPAIGNS
    : CAMPAIGNS.filter(c => c.id === filterCampaign);

  const maxRevenue = Math.max(...CAMPAIGNS.map(c => c.revenue));

  const handleSubmitReview = () => {
    form.validateFields().then(vals => {
      const avg = parseFloat(((vals.punctuality + vals.attitude + vals.quality + vals.kpiAchieved) / 4).toFixed(1));
      setReviews(prev => prev.map(r =>
        r.id === reviewModal.creator!.id
          ? { ...r, ...vals, overallRating: avg, date: dayjs().format('YYYY-MM-DD'), reviewed: true }
          : r
      ));
      message.success('Da gui danh gia thanh cong!');
      setReviewModal({ open: false });
      form.resetFields();
    });
  };

  const reviewedList = reviews.filter(r => r.reviewed);
  const pendingList = reviews.filter(r => !r.reviewed);
  const avgRating = reviewedList.length
    ? (reviewedList.reduce((s, r) => s + r.overallRating, 0) / reviewedList.length).toFixed(1)
    : '0';

  return (
    <div className="perf-page">
      {/* ── Header ────────────────────────────────────── */}
      <div className="perf-header">
        <div>
          <h1 className="perf-title">Hieu suat & ROI</h1>
          <p className="perf-subtitle">Phan tich hieu qua dau tu va danh gia chat luong creator</p>
        </div>
        <div className="perf-header-right">
          <Select value={filterCampaign} onChange={setFilterCampaign} style={{ width: 220 }}>
            <Option value="all">Tat ca chien dich</Option>
            {CAMPAIGNS.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
          <Button icon={<DownloadOutlined />} style={{ borderRadius: 8 }}>Xuat bao cao</Button>
        </div>
      </div>

      {/* ── KPI Summary Row ───────────────────────────── */}
      <div className="perf-kpi-row">
        <KpiCard label="Tong doanh thu" value={fmtVND(totalRevenue)} sub="Tat ca chien dich" trend={23} icon={<DollarOutlined />} color="#10b981" />
        <KpiCard label="ROAS trung binh" value={`${avgROAS}x`} sub="Doanh thu / Chi phi" trend={8} icon={<TrophyOutlined />} color="#6366f1" />
        <KpiCard label="Tong tien chi" value={fmtVND(totalSpent)} sub="Da giai ngan" icon={<DollarOutlined />} color="#3b82f6" />
        <KpiCard label="Tong tiep can" value={fmtNum(totalReach)} trend={15} icon={<EyeOutlined />} color="#8b5cf6" />
        <KpiCard label="Chuyen doi" value={fmtNum(totalConv)} trend={12} icon={<CheckCircleOutlined />} color="#f59e0b" />
        <KpiCard label="Danh gia Creator" value={`${avgRating}/5`} sub={`${reviewedList.length}/${reviews.length} da danh gia`} icon={<StarFilled />} color="#ec4899" />
      </div>

      {/* ── Self-reported notice ──────────────────────── */}
      {selfReportedCount > 0 && (
        <div className="perf-self-reported-banner">
          <FlagFilled style={{ color: '#f59e0b', fontSize: 14 }} />
          <span>
            <strong>{selfReportedCount} chien dich</strong> co du lieu doanh thu <strong>tu khai bao (Self-reported)</strong> — Brand tu nhap lieu thu cong, chua duoc xac minh doc lap boi he thong.
          </span>
          <Tooltip title="Self-reported flag: Du lieu nay do Brand tu nhap va khong duoc he thong tu dong xac minh tu platform MXH. Nen doi chieu voi du lieu ads hoac analytics rieng.">
            <InfoCircleOutlined style={{ color: '#f59e0b', cursor: 'pointer' }} />
          </Tooltip>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────── */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="perf-tabs" size="large">

        {/* ════════════════════════════════════════════════════
            TAB 1: ROI & ROAS ANALYTICS
        ════════════════════════════════════════════════════ */}
        <TabPane tab={<span><TrophyOutlined /> ROI / ROAS Analytics</span>} key="roi">
          <Row gutter={[20, 20]}>

            {/* Revenue per Campaign bar */}
            <Col xs={24} lg={14}>
              <Card title="Doanh thu tren moi chien dich" className="perf-card"
                extra={
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888', alignItems: 'center' }}>
                    <span><span style={{ background: '#6366f1', width: 10, height: 10, borderRadius: 2, display: 'inline-block', marginRight: 4 }} />Chi phi</span>
                    <span><span style={{ background: '#10b981', width: 10, height: 10, borderRadius: 2, display: 'inline-block', marginRight: 4 }} />Loi nhuan</span>
                    <FlagFilled style={{ color: '#f59e0b' }} /><span style={{ color: '#f59e0b' }}>= Tu khai bao</span>
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
                  {filteredCampaigns.map(c => (
                    <div key={c.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                          {c.selfReported && (
                            <Tooltip title="Du lieu tu khai bao — Brand tu nhap lieu">
                              <Tag icon={<FlagFilled />} color="warning" style={{ fontSize: 10, lineHeight: '16px' }}>Tu khai bao</Tag>
                            </Tooltip>
                          )}
                          <Tag color={c.status === 'active' ? 'blue' : 'green'} style={{ fontSize: 10 }}>
                            {c.status === 'active' ? 'Dang chay' : 'Hoan thanh'}
                          </Tag>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                          <span style={{ color: '#6366f1' }}>Chi: {fmtVND(c.spent)}</span>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>DT: {fmtVND(c.revenue)}</span>
                          <Tag color={c.roas >= 3 ? 'green' : c.roas >= 2 ? 'orange' : 'red'} style={{ fontWeight: 800 }}>ROAS {c.roas}x</Tag>
                        </div>
                      </div>
                      <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
                        <Tooltip title={`Chi phi: ${fmtVND(c.spent)}`}>
                          <div style={{ flex: c.spent, background: '#6366f1', borderRadius: '6px 0 0 6px' }} />
                        </Tooltip>
                        <Tooltip title={`Loi nhuan rong: ${fmtVND(c.revenue - c.spent)}`}>
                          <div style={{ flex: c.revenue - c.spent, background: '#10b981', borderRadius: '0 6px 6px 0' }} />
                        </Tooltip>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#999', marginTop: 4 }}>
                        <span>ROI: +{Math.round(((c.revenue - c.spent) / c.spent) * 100)}%</span>
                        <span>Tiep can: {fmtNum(c.reach)}</span>
                        <span>Chuyen doi: {fmtNum(c.conversions)}</span>
                        <span>CPC: {fmtVND(Math.round(c.spent / c.clicks))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* ROAS Gauge Cards */}
            <Col xs={24} lg={10}>
              <Card title="ROAS theo chien dich" className="perf-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {filteredCampaigns.map(c => (
                    <div key={c.id} className="perf-roas-gauge">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>
                          {c.name} {c.selfReported && <FlagFilled style={{ color: '#f59e0b', fontSize: 10 }} />}
                        </span>
                        <span style={{
                          fontWeight: 800, fontSize: 16,
                          color: c.roas >= 3 ? '#10b981' : c.roas >= 2 ? '#f59e0b' : '#ef4444',
                        }}>{c.roas}x</span>
                      </div>
                      <Progress
                        percent={(c.roas / 5) * 100}
                        showInfo={false}
                        strokeColor={c.roas >= 3 ? '#10b981' : c.roas >= 2 ? '#f59e0b' : '#ef4444'}
                        trailColor="#f1f5f9"
                        strokeWidth={10}
                        style={{ borderRadius: 8 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginTop: 4 }}>
                        <span>0x</span><span style={{ fontWeight: 600, color: c.roas >= 3 ? '#10b981' : '#f59e0b' }}>Muc tieu: 3x</span><span>5x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Funnel */}
            <Col xs={24} md={10}>
              <Card title="Phe chuyen doi tong hop" className="perf-card">
                {[
                  { label: 'Tiep can (Reach)', value: CAMPAIGNS.reduce((s, c) => s + c.reach, 0), pct: 100, color: '#6366f1' },
                  { label: 'Luot click', value: CAMPAIGNS.reduce((s, c) => s + c.clicks, 0), pct: 17, color: '#8b5cf6' },
                  { label: 'Chuyen doi', value: totalConv, pct: 6, color: '#a78bfa' },
                  { label: 'Dat ROAS > 2.5x', value: CAMPAIGNS.filter(c => c.roas >= 2.5).length, pct: 75, color: '#10b981' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                      <span>{f.label}</span>
                      <span style={{ fontWeight: 700 }}>{typeof f.value === 'number' && f.value > 100 ? fmtNum(f.value) : f.value}</span>
                    </div>
                    <div style={{ height: 20, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${f.pct}%`, background: f.color, borderRadius: 6, transition: 'width .5s' }} />
                    </div>
                  </div>
                ))}
              </Card>
            </Col>

            {/* Summary Stats */}
            <Col xs={24} md={14}>
              <Card title="Tong ket hieu suat dau tu" className="perf-card">
                <Row gutter={[16, 16]}>
                  {[
                    { title: 'Tong loi nhuan rong', value: fmtVND(totalRevenue - totalSpent), color: '#10b981' },
                    { title: 'Chi phi trung binh/chuyen doi', value: fmtVND(Math.round(totalSpent / totalConv)), color: '#6366f1' },
                    { title: 'Trung binh tiep can/chien dich', value: fmtNum(Math.round(totalReach / CAMPAIGNS.length)), color: '#3b82f6' },
                    { title: 'So chien dich ROAS > 3x', value: `${CAMPAIGNS.filter(c => c.roas >= 3).length}/${CAMPAIGNS.length}`, color: '#f59e0b' },
                  ].map(s => (
                    <Col span={12} key={s.title}>
                      <div style={{ background: '#f8f9ff', borderRadius: 10, padding: 14, border: `1px solid #e8e3ff` }}>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{s.title}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <Divider style={{ margin: '16px 0 12px' }} />
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
                  <FlagFilled style={{ color: '#f59e0b', marginRight: 6 }} />
                  <strong>Luu y:</strong> {selfReportedCount} chien dich co du lieu <strong>Tu khai bao</strong> — chua qua nen tang xac minh. Nen doi chieu voi Analytics chinh thuc truoc khi bao cao.
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* ════════════════════════════════════════════════════
            TAB 2: BRAND REVIEW (STRUCTURED RATING)
        ════════════════════════════════════════════════════ */}
        <TabPane tab={<span><StarFilled style={{ color: '#faad14' }} /> Danh gia Creator (Brand Review)</span>} key="review">
          <Row gutter={[20, 20]}>

            {/* Review Summary */}
            <Col xs={24}>
              <div className="review-summary-strip">
                <div className="rsm-block">
                  <div className="rsm-num" style={{ color: '#faad14' }}>{avgRating}</div>
                  <Rate disabled value={parseFloat(avgRating)} allowHalf style={{ fontSize: 16 }} />
                  <div className="rsm-label">Diem trung binh tong the</div>
                </div>
                <div className="rsm-divider" />
                <div className="rsm-block">
                  <div className="rsm-num" style={{ color: '#10b981' }}>{reviewedList.length}</div>
                  <div className="rsm-label">Creator da danh gia</div>
                </div>
                <div className="rsm-divider" />
                <div className="rsm-block">
                  <div className="rsm-num" style={{ color: '#f59e0b' }}>{pendingList.length}</div>
                  <div className="rsm-label">Cho danh gia</div>
                </div>
                <div className="rsm-divider" />
                {[
                  { label: 'Dung han', key: 'punctuality', icon: <ClockCircleOutlined />, color: '#3b82f6' },
                  { label: 'Thai do', key: 'attitude', icon: <LikeOutlined />, color: '#10b981' },
                  { label: 'Chat luong', key: 'quality', icon: <ThunderboltOutlined />, color: '#8b5cf6' },
                  { label: 'Dat KPI', key: 'kpiAchieved', icon: <TrophyOutlined />, color: '#f59e0b' },
                ].map(dim => {
                  const avg = reviewedList.length
                    ? reviewedList.reduce((s, r) => s + (r as any)[dim.key], 0) / reviewedList.length
                    : 0;
                  return (
                    <div key={dim.key} className="rsm-dim">
                      <div style={{ fontSize: 18, color: dim.color }}>{dim.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: dim.color }}>{avg.toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{dim.label}</div>
                    </div>
                  );
                })}
              </div>
            </Col>

            {/* Pending Reviews */}
            {pendingList.length > 0 && (
              <Col xs={24}>
                <Card
                  title={<span><ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 6 }} />Creator chua duoc danh gia ({pendingList.length})</span>}
                  className="perf-card"
                >
                  <div className="review-pending-grid">
                    {pendingList.map(cr => (
                      <div key={cr.id} className="review-pending-card">
                        <Avatar src={cr.avatar} size={48} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{cr.creatorName}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{cr.campaign}</div>
                          <Tag color={cr.platform === 'TikTok' ? 'magenta' : cr.platform === 'YouTube' ? 'red' : 'orange'} style={{ fontSize: 10, marginTop: 4 }}>{cr.platform}</Tag>
                        </div>
                        <Button
                          type="primary"
                          icon={<StarFilled />}
                          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 8 }}
                          onClick={() => { setReviewModal({ open: true, creator: cr }); form.resetFields(); form.setFieldsValue({ punctuality: 5, attitude: 5, quality: 5, kpiAchieved: 5 }); }}
                        >
                          Viet danh gia
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            )}

            {/* Completed Reviews */}
            <Col xs={24}>
              <Card
                title={<span><CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />Danh gia da hoan thanh ({reviewedList.length})</span>}
                className="perf-card"
              >
                <div className="review-cards-grid">
                  {reviewedList.map(rv => (
                    <div key={rv.id} className="review-card-item">
                      <div className="review-card-top">
                        <Avatar src={rv.avatar} size={52} style={{ border: '2px solid #e8e3ff' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>{rv.creatorName}</div>
                          <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>{rv.campaign}</div>
                          <Tag color={rv.platform === 'TikTok' ? 'magenta' : rv.platform === 'YouTube' ? 'red' : 'orange'} style={{ fontSize: 10 }}>{rv.platform}</Tag>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#faad14', lineHeight: 1 }}>{rv.overallRating}</div>
                          <Rate disabled value={rv.overallRating} allowHalf style={{ fontSize: 12 }} />
                        </div>
                      </div>

                      <div className="review-dims-grid">
                        <ScoreRow label="Dung han" value={rv.punctuality} icon={<ClockCircleOutlined style={{ color: '#3b82f6' }} />} />
                        <ScoreRow label="Thai do" value={rv.attitude} icon={<LikeOutlined style={{ color: '#10b981' }} />} />
                        <ScoreRow label="Chat luong ND" value={rv.quality} icon={<ThunderboltOutlined style={{ color: '#8b5cf6' }} />} />
                        <ScoreRow label="Dat KPI" value={rv.kpiAchieved} icon={<TrophyOutlined style={{ color: '#f59e0b' }} />} />
                      </div>

                      {rv.comment && (
                        <div className="review-comment-box">"{rv.comment}"</div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <span style={{ fontSize: 11, color: '#aaa' }}>Ngay danh gia: {dayjs(rv.date).format('DD/MM/YYYY')}</span>
                        <Button size="small" icon={<EditOutlined />} onClick={() => { setReviewModal({ open: true, creator: rv }); form.setFieldsValue(rv); }}>Sua</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* ── Review Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={reviewModal.open}
        onCancel={() => setReviewModal({ open: false })}
        onOk={handleSubmitReview}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar src={reviewModal.creator?.avatar} size={36} />
            <div>
              <div style={{ fontWeight: 700 }}>Danh gia Creator: {reviewModal.creator?.creatorName}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{reviewModal.creator?.campaign}</div>
            </div>
          </div>
        }
        okText="Gui danh gia"
        cancelText="Huy"
        width={540}
        okButtonProps={{ style: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div className="review-modal-criteria">
            <Form.Item label={<span><ClockCircleOutlined style={{ color: '#3b82f6', marginRight: 5 }} />Tinh dung han (Punctuality)</span>} name="punctuality" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
            <Form.Item label={<span><LikeOutlined style={{ color: '#10b981', marginRight: 5 }} />Thai do chuyen nghiep (Attitude)</span>} name="attitude" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
            <Form.Item label={<span><ThunderboltOutlined style={{ color: '#8b5cf6', marginRight: 5 }} />Chat luong noi dung (Content Quality)</span>} name="quality" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
            <Form.Item label={<span><TrophyOutlined style={{ color: '#f59e0b', marginRight: 5 }} />Kha nang dat KPI (KPI Achievement)</span>} name="kpiAchieved" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </div>
          <Form.Item label="Nhan xet tong the" name="comment" rules={[{ required: true, message: 'Vui long nhap nhan xet' }]}>
            <TextArea rows={3} placeholder="Mo ta trai nghiem hop tac, diem manh, diem can cai thien..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PerformancePage;
