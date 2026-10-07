import React, { useState } from 'react';
import {
  Input, Select, Button, Tag, Modal, Avatar, Rate, Progress,
  Tooltip, Statistic, Tabs, Row, Col, Card, Badge, Divider,
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, EyeOutlined, TrophyOutlined,
  DollarOutlined, RiseOutlined, FallOutlined, TeamOutlined,
  CalendarOutlined, CheckCircleFilled, StarFilled, BarChartOutlined,
  ClockCircleOutlined, FileTextOutlined, FilterOutlined,
  ArrowUpOutlined, ArrowDownOutlined, FireOutlined,
} from '@ant-design/icons';
import './CampaignHistoryPage.css';

const { Option } = Select;
const { TabPane } = Tabs;

// ── Interfaces ────────────────────────────────────────────────────────────────
interface CampaignHistory {
  id: string;
  name: string;
  category: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  revenue: number;
  roas: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  creatorsCount: number;
  creatorsRating: number;
  status: 'completed' | 'cancelled' | 'paused_archived';
  tags: string[];
  objective: string;
  kpiTarget: { reach: number; conversions: number; roas: number };
  kpiAchieved: { reach: number; conversions: number; roas: number };
  creators: { name: string; avatar: string; platform: string; roi: number; rating: number }[];
  topContent: { title: string; views: number; platform: string }[];
  lessons: string;
  overallScore: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_HISTORY: CampaignHistory[] = [
  {
    id: 'h1', name: 'Tet Campaign 2024', category: 'Skincare',
    dateRange: '01/01/2024 - 15/02/2024', startDate: '2024-01-01', endDate: '2024-02-15',
    budget: 120000000, actualCost: 98000000, revenue: 340000000, roas: 3.47,
    reach: 8200000, impressions: 22000000, clicks: 310000, conversions: 9300, engagementRate: 5.8,
    creatorsCount: 20, creatorsRating: 4.7,
    status: 'completed', tags: ['TikTok', 'Best ROI', 'Seasonal'],
    objective: 'Tang nhan dien thuong hieu mua Tet, dat 8M reach va 3x ROAS',
    kpiTarget: { reach: 8000000, conversions: 8000, roas: 3.0 },
    kpiAchieved: { reach: 8200000, conversions: 9300, roas: 3.47 },
    creators: [
      { name: 'Minh Le', avatar: 'https://i.pravatar.cc/40?img=4', platform: 'TikTok', roi: 4.1, rating: 4.9 },
      { name: 'Linh Nguyen', avatar: 'https://i.pravatar.cc/40?img=1', platform: 'TikTok', roi: 3.8, rating: 4.8 },
      { name: 'Nam Tran', avatar: 'https://i.pravatar.cc/40?img=2', platform: 'YouTube', roi: 3.2, rating: 4.5 },
    ],
    topContent: [
      { title: 'Review kem chong nang Tet 2024 - Minh Le', views: 2100000, platform: 'TikTok' },
      { title: 'Top 5 skincare goi y qua Tet - Linh Nguyen', views: 1800000, platform: 'TikTok' },
    ],
    lessons: 'Chien dich Tet chay rat tot. Nen bat dau 2 tuan som hon trong nam toi. Creator TikTok hieu qua hon YouTube 2.3x ve reach.',
    overallScore: 96,
  },
  {
    id: 'h2', name: 'Summer Glow 2024', category: 'Skincare',
    dateRange: '01/06/2024 - 31/08/2024', startDate: '2024-06-01', endDate: '2024-08-31',
    budget: 80000000, actualCost: 72000000, revenue: 210000000, roas: 2.92,
    reach: 4500000, impressions: 12000000, clicks: 180000, conversions: 5400, engagementRate: 4.2,
    creatorsCount: 12, creatorsRating: 4.6,
    status: 'completed', tags: ['Multi-platform', 'SPF'],
    objective: 'Ra mat san pham kem chong nang SPF50+, tap trung khach hang nu 18-30 tuoi',
    kpiTarget: { reach: 4000000, conversions: 5000, roas: 2.5 },
    kpiAchieved: { reach: 4500000, conversions: 5400, roas: 2.92 },
    creators: [
      { name: 'Linh Nguyen', avatar: 'https://i.pravatar.cc/40?img=1', platform: 'TikTok', roi: 3.8, rating: 4.8 },
      { name: 'Huong Pham', avatar: 'https://i.pravatar.cc/40?img=3', platform: 'Instagram', roi: 2.9, rating: 4.3 },
    ],
    topContent: [
      { title: 'Review GlowBeauty SPF50+ khong von cuc - Linh Nguyen', views: 980000, platform: 'TikTok' },
    ],
    lessons: 'Instagram hieu qua kem TikTok ve engagement nhung kem hon ve chuyen doi. Nen tap trung ngan sach vao TikTok.',
    overallScore: 84,
  },
  {
    id: 'h3', name: 'Back to School', category: 'Education Tech',
    dateRange: '01/08/2024 - 15/09/2024', startDate: '2024-08-01', endDate: '2024-09-15',
    budget: 50000000, actualCost: 43000000, revenue: 115000000, roas: 2.67,
    reach: 2800000, impressions: 7500000, clicks: 112000, conversions: 2800, engagementRate: 3.9,
    creatorsCount: 8, creatorsRating: 4.4,
    status: 'completed', tags: ['YouTube', 'Gen-Z'],
    objective: 'Quang ba ung dung hoc tap cho hoc sinh cap 2-3 mua tuu truong',
    kpiTarget: { reach: 3000000, conversions: 3000, roas: 2.5 },
    kpiAchieved: { reach: 2800000, conversions: 2800, roas: 2.67 },
    creators: [
      { name: 'Nam Tran', avatar: 'https://i.pravatar.cc/40?img=2', platform: 'YouTube', roi: 3.2, rating: 4.5 },
      { name: 'Thu Ha', avatar: 'https://i.pravatar.cc/40?img=5', platform: 'YouTube', roi: 2.5, rating: 4.1 },
    ],
    topContent: [
      { title: 'App hoc tieng Anh tot nhat nam 2024 - Nam Tran', views: 650000, platform: 'YouTube' },
    ],
    lessons: 'Reach khong dat KPI do thieu creator TikTok. Nam sau nen mix them TikTok de vuon toi Gen-Z hieu qua hon.',
    overallScore: 78,
  },
  {
    id: 'h4', name: 'Flash Sale 11.11', category: 'Fashion',
    dateRange: '01/11/2024 - 30/11/2024', startDate: '2024-11-01', endDate: '2024-11-30',
    budget: 60000000, actualCost: 55000000, revenue: 145000000, roas: 2.64,
    reach: 3300000, impressions: 9200000, clicks: 138000, conversions: 3300, engagementRate: 4.5,
    creatorsCount: 10, creatorsRating: 4.5,
    status: 'completed', tags: ['Flash Sale', 'E-commerce'],
    objective: 'Day doanh so thang 11, tap trung vao khung 11.11 Double Day',
    kpiTarget: { reach: 3000000, conversions: 3000, roas: 2.5 },
    kpiAchieved: { reach: 3300000, conversions: 3300, roas: 2.64 },
    creators: [
      { name: 'Minh Le', avatar: 'https://i.pravatar.cc/40?img=4', platform: 'TikTok', roi: 4.1, rating: 4.9 },
      { name: 'Linh Nguyen', avatar: 'https://i.pravatar.cc/40?img=1', platform: 'TikTok', roi: 3.8, rating: 4.8 },
    ],
    topContent: [
      { title: 'HAUL thoi trang Flash Sale 11.11 - Minh Le', views: 1200000, platform: 'TikTok' },
    ],
    lessons: 'Nen chuan bi brief som hon 3 tuan. Creator confirm muon dan den bi dong thoi han dang bai. Nam 2025 khoa lich truoc 1 thang.',
    overallScore: 81,
  },
  {
    id: 'h5', name: 'Year End Mega Campaign', category: 'FMCG',
    dateRange: '01/12/2023 - 31/12/2023', startDate: '2023-12-01', endDate: '2023-12-31',
    budget: 150000000, actualCost: 112000000, revenue: 195000000, roas: 1.74,
    reach: 5500000, impressions: 14000000, clicks: 195000, conversions: 4200, engagementRate: 3.1,
    creatorsCount: 25, creatorsRating: 3.8,
    status: 'completed', tags: ['FMCG', 'Large Scale'],
    objective: 'Tong ket cuoi nam, tang brand awareness tren dien rong',
    kpiTarget: { reach: 6000000, conversions: 6000, roas: 3.0 },
    kpiAchieved: { reach: 5500000, conversions: 4200, roas: 1.74 },
    creators: [
      { name: 'Thu Ha', avatar: 'https://i.pravatar.cc/40?img=5', platform: 'YouTube', roi: 2.5, rating: 4.1 },
      { name: 'Huong Pham', avatar: 'https://i.pravatar.cc/40?img=3', platform: 'Instagram', roi: 1.8, rating: 3.9 },
    ],
    topContent: [
      { title: 'Best of 2023 - Thu Ha Review', views: 420000, platform: 'YouTube' },
    ],
    lessons: 'Chien dich KHONG dat KPI. Ly do chinh: qua nhieu creator chat luong thap, brief qua rong. Nen tap trung vao 8-10 creator chat luong thay vi 25 creator phan tan.',
    overallScore: 55,
  },
];

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
const fmtVND = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(2)} ty` :
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${n.toLocaleString()}`;

const kpiPct = (achieved: number, target: number) =>
  Math.round((achieved / target) * 100);

// ── KPI Achievement Bar ───────────────────────────────────────────────────────
const KpiBar: React.FC<{ label: string; achieved: number; target: number; fmt?: (n: number) => string }> =
  ({ label, achieved, target, fmt = String }) => {
    const pct = Math.min(kpiPct(achieved, target), 150);
    const color = pct >= 100 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444';
    return (
      <div className="kpi-bar-row">
        <div className="kpi-bar-label">{label}</div>
        <div className="kpi-bar-track">
          <div className="kpi-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
          {pct > 100 && <div className="kpi-bar-over" style={{ width: `${pct - 100}%`, background: '#10b981', opacity: 0.3 }} />}
        </div>
        <div className="kpi-bar-nums">
          <span style={{ color, fontWeight: 700 }}>{fmt(achieved)}</span>
          <span style={{ color: '#aaa' }}> / {fmt(target)}</span>
        </div>
        <Tag color={pct >= 100 ? 'green' : pct >= 80 ? 'orange' : 'red'} style={{ fontSize: 10, marginLeft: 4 }}>
          {pct >= 100 ? `+${pct - 100}%` : `${pct}%`}
        </Tag>
      </div>
    );
  };

// ── Score Circle ──────────────────────────────────────────────────────────────
const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#6366f1' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 90 ? 'Xuat sac' : score >= 75 ? 'Tot' : score >= 60 ? 'Dat yeu cau' : 'Can cai thien';
  return (
    <div className="score-circle" style={{ borderColor: color }}>
      <div className="score-circle-num" style={{ color }}>{score}</div>
      <div className="score-circle-label" style={{ color }}>{label}</div>
    </div>
  );
};

// ── Campaign Card ─────────────────────────────────────────────────────────────
const CampaignCard: React.FC<{ camp: CampaignHistory; onClick: () => void }> = ({ camp, onClick }) => {
  const costPct = Math.round((camp.actualCost / camp.budget) * 100);
  const roiPct = Math.round(((camp.revenue - camp.actualCost) / camp.actualCost) * 100);
  const roasColor = camp.roas >= 3 ? '#10b981' : camp.roas >= 2 ? '#f59e0b' : '#ef4444';

  return (
    <div className={`hist-card ${camp.overallScore >= 90 ? 'card-excellent' : camp.overallScore >= 75 ? 'card-good' : camp.overallScore < 60 ? 'card-poor' : ''}`} onClick={onClick}>
      {/* Top accent */}
      <div className="hist-card-accent" style={{
        background: camp.overallScore >= 90 ? 'linear-gradient(90deg,#10b981,#34d399)' :
                    camp.overallScore >= 75 ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' :
                    camp.overallScore >= 60 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' :
                    'linear-gradient(90deg,#ef4444,#f87171)',
      }} />

      <div className="hist-card-header">
        <div style={{ flex: 1 }}>
          <div className="hist-card-name">{camp.name}</div>
          <div className="hist-card-meta">
            <CalendarOutlined style={{ fontSize: 11 }} />
            <span>{camp.dateRange}</span>
            <Tag color="default" style={{ fontSize: 10 }}>{camp.category}</Tag>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {camp.tags.map(t => <Tag key={t} color="purple" style={{ fontSize: 10 }}>{t}</Tag>)}
          </div>
        </div>
        <ScoreCircle score={camp.overallScore} />
      </div>

      <div className="hist-card-stats">
        <div className="hist-stat">
          <span className="hist-stat-val" style={{ color: roasColor }}>{camp.roas}x</span>
          <span className="hist-stat-lbl">ROAS</span>
        </div>
        <div className="hist-stat">
          <span className="hist-stat-val" style={{ color: '#10b981' }}>{fmtVND(camp.revenue)}M</span>
          <span className="hist-stat-lbl">Doanh thu</span>
        </div>
        <div className="hist-stat">
          <span className="hist-stat-val" style={{ color: '#6366f1' }}>{fmtVND(camp.actualCost)}M</span>
          <span className="hist-stat-lbl">Chi phi thuc</span>
        </div>
        <div className="hist-stat">
          <span className="hist-stat-val" style={{ color: roiPct >= 0 ? '#10b981' : '#ef4444' }}>
            {roiPct >= 0 ? '+' : ''}{roiPct}%
          </span>
          <span className="hist-stat-lbl">ROI</span>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4 }}>
          <span>Tieu ngan sach: {costPct}%</span>
          <span>{camp.creatorsCount} Creators</span>
        </div>
        <Progress percent={costPct} showInfo={false} strokeColor={costPct <= 100 ? '#6366f1' : '#ef4444'} size="small" />
      </div>

      <div className="hist-card-footer">
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#888' }}>
          <span><EyeOutlined /> {fmtNum(camp.reach)}</span>
          <span><TeamOutlined /> {camp.creatorsCount}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <StarFilled style={{ color: '#faad14', fontSize: 10 }} />
            <span>{camp.creatorsRating.toFixed(1)}</span>
          </div>
        </div>
        <Button size="small" type="primary" ghost icon={<EyeOutlined />}>Xem chi tiet</Button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CampaignHistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterScore, setFilterScore] = useState('all');
  const [detailModal, setDetailModal] = useState<{ open: boolean; camp?: CampaignHistory }>({ open: false });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = MOCK_HISTORY
    .filter(c => filterCategory === 'all' || c.category === filterCategory)
    .filter(c => filterScore === 'all' || (filterScore === 'excellent' && c.overallScore >= 90) || (filterScore === 'good' && c.overallScore >= 75 && c.overallScore < 90) || (filterScore === 'poor' && c.overallScore < 60))
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sortBy === 'score' ? b.overallScore - a.overallScore : sortBy === 'roas' ? b.roas - a.roas : sortBy === 'revenue' ? b.revenue - a.revenue : sortBy === 'recent' ? b.endDate.localeCompare(a.endDate) : 0);

  const totalRevenue = MOCK_HISTORY.reduce((s, c) => s + c.revenue, 0);
  const totalCost = MOCK_HISTORY.reduce((s, c) => s + c.actualCost, 0);
  const avgROAS = (totalRevenue / totalCost).toFixed(2);
  const bestCamp = MOCK_HISTORY.reduce((best, c) => c.overallScore > best.overallScore ? c : best);

  const camp = detailModal.camp;

  return (
    <div className="hist-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="hist-header">
        <div>
          <h1 className="hist-title">Lich su Chien dich</h1>
          <p className="hist-subtitle">Luu tru, tra cuu va hoc hoi tu cac chien dich da ket thuc</p>
        </div>
        <Button icon={<DownloadOutlined />} style={{ borderRadius: 8 }}>Xuat Bao cao Tong hop</Button>
      </div>

      {/* ── Overview Strip ──────────────────────────────────────── */}
      <div className="hist-overview-strip">
        <div className="ov-block">
          <div className="ov-icon" style={{ background: '#eef2ff', color: '#6366f1' }}><FileTextOutlined /></div>
          <div><div className="ov-val">{MOCK_HISTORY.length} Chien dich</div><div className="ov-lbl">Da luu tru</div></div>
        </div>
        <div className="ov-block">
          <div className="ov-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><DollarOutlined /></div>
          <div><div className="ov-val">{fmtVND(totalRevenue)}M</div><div className="ov-lbl">Tong doanh thu da tao ra</div></div>
        </div>
        <div className="ov-block">
          <div className="ov-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}><TrophyOutlined /></div>
          <div><div className="ov-val">{avgROAS}x</div><div className="ov-lbl">ROAS trung binh lich su</div></div>
        </div>
        <div className="ov-block">
          <div className="ov-icon" style={{ background: '#fdf4ff', color: '#a21caf' }}><FireOutlined /></div>
          <div><div className="ov-val" style={{ fontSize: 14, maxWidth: 180, lineHeight: 1.3 }}>{bestCamp.name}</div><div className="ov-lbl">Chien dich hieu qua nhat ({bestCamp.overallScore} diem)</div></div>
        </div>
      </div>

      {/* ── Filters Row ─────────────────────────────────────────── */}
      <div className="hist-filters-row">
        <Input
          prefix={<SearchOutlined style={{ color: '#aaa' }} />}
          placeholder="Tim kiem ten chien dich, the..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 260, borderRadius: 8 }}
          allowClear
        />
        <Select value={filterCategory} onChange={setFilterCategory} style={{ width: 160, borderRadius: 8 }}>
          <Option value="all">Tat ca nganh hang</Option>
          <Option value="Skincare">Skincare</Option>
          <Option value="Fashion">Fashion</Option>
          <Option value="Education Tech">Education Tech</Option>
          <Option value="FMCG">FMCG</Option>
        </Select>
        <Select value={filterScore} onChange={setFilterScore} style={{ width: 160, borderRadius: 8 }}>
          <Option value="all">Tat ca muc do</Option>
          <Option value="excellent">Xuat sac (90+)</Option>
          <Option value="good">Tot (75-89)</Option>
          <Option value="poor">Can cai thien (&lt;60)</Option>
        </Select>
        <Select value={sortBy} onChange={setSortBy} style={{ width: 160, borderRadius: 8 }}>
          <Option value="score">Sap xep: Diem tong</Option>
          <Option value="roas">Sap xep: ROAS</Option>
          <Option value="revenue">Sap xep: Doanh thu</Option>
          <Option value="recent">Sap xep: Moi nhat</Option>
        </Select>
        <div style={{ display: 'flex', gap: 0, border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
          <Button type={viewMode === 'grid' ? 'primary' : 'default'} style={{ borderRadius: 0, border: 'none' }} onClick={() => setViewMode('grid')}>Grid</Button>
          <Button type={viewMode === 'table' ? 'primary' : 'default'} style={{ borderRadius: 0, border: 'none' }} onClick={() => setViewMode('table')}>Table</Button>
        </div>
      </div>

      {/* ── GRID VIEW ───────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="hist-grid">
          {filtered.map(c => (
            <CampaignCard key={c.id} camp={c} onClick={() => setDetailModal({ open: true, camp: c })} />
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ──────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="hist-table-card">
          <table className="hist-table">
            <thead>
              <tr>
                <th>Ten chien dich</th>
                <th>Thoi gian</th>
                <th>Nganh hang</th>
                <th>Chi phi thuc</th>
                <th>Doanh thu</th>
                <th>ROAS</th>
                <th>ROI</th>
                <th>Reach</th>
                <th>Creator</th>
                <th>Diem tong</th>
                <th>Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const roiPct = Math.round(((c.revenue - c.actualCost) / c.actualCost) * 100);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                      <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                        {c.tags.map(t => <Tag key={t} style={{ fontSize: 9, padding: '0 4px' }}>{t}</Tag>)}
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{c.dateRange}</td>
                    <td><Tag>{c.category}</Tag></td>
                    <td style={{ fontWeight: 600 }}>{fmtVND(c.actualCost)}M</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{fmtVND(c.revenue)}M</td>
                    <td>
                      <Tag color={c.roas >= 3 ? 'green' : c.roas >= 2 ? 'orange' : 'red'} style={{ fontWeight: 800 }}>{c.roas}x</Tag>
                    </td>
                    <td>
                      <span style={{ color: roiPct >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                        {roiPct >= 0 ? '+' : ''}{roiPct}%
                      </span>
                    </td>
                    <td>{fmtNum(c.reach)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TeamOutlined style={{ color: '#888' }} />
                        <span>{c.creatorsCount}</span>
                        <StarFilled style={{ color: '#faad14', fontSize: 10 }} />
                        <span style={{ fontSize: 11 }}>{c.creatorsRating}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Progress type="circle" percent={c.overallScore} width={36} strokeColor={c.overallScore >= 90 ? '#10b981' : c.overallScore >= 75 ? '#6366f1' : '#ef4444'} format={() => <span style={{ fontSize: 10, fontWeight: 800 }}>{c.overallScore}</span>} />
                      </div>
                    </td>
                    <td>
                      <Button size="small" type="primary" ghost onClick={() => setDetailModal({ open: true, camp: c })}>Xem</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      <Modal
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false })}
        footer={null}
        width={780}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 36, borderRadius: 4, background: camp && camp.overallScore >= 90 ? '#10b981' : camp && camp.overallScore >= 75 ? '#6366f1' : '#f59e0b' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{camp?.name}</div>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>{camp?.dateRange} • {camp?.category}</div>
            </div>
            {camp && <ScoreCircle score={camp.overallScore} />}
          </div>
        }
      >
        {camp && (
          <div className="hist-modal-body">
            {/* Objective */}
            <div className="modal-objective-box">
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>MUC TIEU CHIEN DICH</div>
              <div style={{ fontSize: 13, color: '#333' }}>{camp.objective}</div>
            </div>

            {/* 4-stat row */}
            <div className="modal-stats-row">
              {[
                { label: 'Chi phi thuc', val: `${fmtVND(camp.actualCost)}M`, sub: `/${fmtVND(camp.budget)}M ngan sach`, color: '#6366f1' },
                { label: 'Doanh thu', val: `${fmtVND(camp.revenue)}M`, sub: `Loi nhuan: +${fmtVND(camp.revenue - camp.actualCost)}M`, color: '#10b981' },
                { label: 'ROAS', val: `${camp.roas}x`, sub: camp.roas >= 3 ? 'Xuat sac' : camp.roas >= 2 ? 'Dat muc tieu' : 'Can cai thien', color: camp.roas >= 3 ? '#10b981' : '#f59e0b' },
                { label: 'ROI', val: `+${Math.round(((camp.revenue - camp.actualCost) / camp.actualCost) * 100)}%`, sub: `${fmtNum(camp.conversions)} chuyen doi`, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="modal-stat-card">
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* KPI Achievement */}
            <div className="modal-section">
              <div className="modal-section-title"><BarChartOutlined /> Muc do Dat KPI</div>
              <KpiBar label="Reach (Tiep can)" achieved={camp.kpiAchieved.reach} target={camp.kpiTarget.reach} fmt={fmtNum} />
              <KpiBar label="Chuyen doi (Orders)" achieved={camp.kpiAchieved.conversions} target={camp.kpiTarget.conversions} fmt={n => n.toLocaleString()} />
              <KpiBar label="ROAS" achieved={camp.kpiAchieved.roas * 100} target={camp.kpiTarget.roas * 100} fmt={n => `${(n / 100).toFixed(2)}x`} />
            </div>

            {/* Top Creators */}
            <div className="modal-section">
              <div className="modal-section-title"><TeamOutlined /> Creator hieu qua nhat</div>
              <div className="modal-creators-row">
                {camp.creators.map((cr, i) => (
                  <div key={i} className="modal-creator-chip">
                    <Avatar src={cr.avatar} size={36} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{cr.name}</div>
                      <Tag color={cr.platform === 'TikTok' ? 'magenta' : cr.platform === 'YouTube' ? 'red' : 'orange'} style={{ fontSize: 10 }}>{cr.platform}</Tag>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <Tag color={cr.roi >= 3.5 ? 'green' : 'orange'} style={{ fontWeight: 700 }}>ROI {cr.roi}x</Tag>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                        <StarFilled style={{ color: '#faad14', fontSize: 9 }} /> {cr.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Content */}
            <div className="modal-section">
              <div className="modal-section-title"><FireOutlined /> Noi dung hieu qua nhat</div>
              {camp.topContent.map((tc, i) => (
                <div key={i} className="modal-content-item">
                  <div className="modal-content-rank">#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{tc.title}</div>
                    <Tag color={tc.platform === 'TikTok' ? 'magenta' : tc.platform === 'YouTube' ? 'red' : 'orange'} style={{ fontSize: 10, marginTop: 2 }}>{tc.platform}</Tag>
                  </div>
                  <div style={{ fontWeight: 800, color: '#6366f1', fontSize: 14 }}>{fmtNum(tc.views)} views</div>
                </div>
              ))}
            </div>

            {/* Lessons Learned */}
            <div className="modal-section">
              <div className="modal-section-title"><FileTextOutlined /> Bai hoc & Ghi chu (Lessons Learned)</div>
              <div className="modal-lessons-box">{camp.lessons}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button icon={<DownloadOutlined />}>Xuat bao cao PDF</Button>
              <Button type="primary" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}>Tai su dung Brief</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CampaignHistoryPage;
