import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ShieldCheck,
  TrendingUp,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Calculator,
  ChevronDown,
  Layers,
  BarChart3,
  Flame,
  Award,
  Lock,
} from 'lucide-react';
import './LandingPage.css';

interface DemoCreator {
  id: string;
  categoryKey: string;
  categoryLabel: string;
  name: string;
  handle: string;
  avatar: string;
  matchScore: number;
  followers: string;
  engagement: string;
  expectedRoas: string;
  costEstimate: string;
  genderBadge: string;
  strengths: string[];
  aiReason: string;
}

const DEMO_CREATORS: DemoCreator[] = [
  {
    id: 'demo-tech',
    categoryKey: 'tech',
    categoryLabel: '📱 Công nghệ & Điện tử',
    name: 'Huy Tiện Ích',
    handle: '@huytienich.tech',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    matchScore: 96,
    followers: '305K',
    engagement: '23.8%',
    expectedRoas: '3.6x',
    costEstimate: '12.5M ₫ / video',
    genderBadge: '♂ Nam',
    strengths: ['Tỷ lệ chốt đơn Shopee cao', 'Chuyên review đồ gia dụng thông minh', '87% người xem 18-30 tuổi'],
    aiReason: 'Phong cách review hài hước, thực tế, khán giả có thói quen mua ngay trên giỏ hàng TikTok Shop với tỷ lệ giữ chân video trên 65%.',
  },
  {
    id: 'demo-beauty',
    categoryKey: 'beauty',
    categoryLabel: '💄 Làm đẹp & Skincare',
    name: 'Linh Thạch Skincare',
    handle: '@linhthach.glow',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    matchScore: 98,
    followers: '420K',
    engagement: '7.4%',
    expectedRoas: '4.1x',
    costEstimate: '16.0M ₫ / video',
    genderBadge: '♀ Nữ',
    strengths: ['92% tệp nữ 20-35 tuổi', 'Kiến thức thành phần mỹ phẩm chuẩn', 'Độ tin cậy cộng đồng 9.8/10'],
    aiReason: 'Khán giả đặc biệt tin tưởng các phân tích bảng thành phần AHA/BHA, độ chuyển đổi voucher mỹ phẩm chính hãng đạt đỉnh trong 48h đầu phát hành.',
  },
  {
    id: 'demo-travel',
    categoryKey: 'travel',
    categoryLabel: '✈️ Du lịch & Khám phá',
    name: 'Hoàng Phi Adventure',
    handle: '@hoangphi.travel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    matchScore: 94,
    followers: '580K',
    engagement: '9.2%',
    expectedRoas: '3.2x',
    costEstimate: '22.0M ₫ / series',
    genderBadge: '♂ Nam',
    strengths: ['Khung hình cinematic 4K', 'Tệp yêu thích resort & trekking', 'Lượng share video cao gấp 3x'],
    aiReason: 'Nội dung quay dựng giàu cảm xúc, thúc đẩy mạnh mẽ quyết định đặt phòng và mua phụ kiện du lịch/dã ngoại cao cấp.',
  },
  {
    id: 'demo-fitness',
    categoryKey: 'fitness',
    categoryLabel: '🏋️ Thể thao & Lifestyle',
    name: 'Trang Thu Fitness',
    handle: '@trangthu.healthy',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    matchScore: 95,
    followers: '290K',
    engagement: '8.8%',
    expectedRoas: '3.8x',
    costEstimate: '11.0M ₫ / video',
    genderBadge: '♀ Nữ',
    strengths: ['Tệp gym & yoga đều đặn', 'Thói quen dùng thực phẩm bổ sung', 'Tương tác comment thật 98%'],
    aiReason: 'Cộng đồng tập luyện gắn kết chặt chẽ, cực kỳ lý tưởng cho các dòng sản phẩm Whey Protein, thời trang thể thao và đồ ăn kiêng Eat-Clean.',
  },
];

const FAQS = [
  {
    q: 'InfluencerMatch khác gì so với việc tự tìm kiếm influencer thủ công trên TikTok/Instagram?',
    a: 'Khi tìm kiếm thủ công, bạn dễ mất hàng chục giờ lướt feed và thường gặp rủi ro gặp phải creator có lượng follower ảo hoặc seeding comment bẩn (khiến mất trắng ngân sách). InfluencerMatch sử dụng thuật toán Vector AI quét sâu dữ liệu hành vi thực tế, đo lường tỷ lệ tương tác thật và dự phóng ROAS chính xác trước khi bạn chi trả bất kỳ đồng nào.',
  },
  {
    q: 'Làm thế nào để hệ thống phát hiện follower ảo và bot seeding?',
    a: 'Chúng tôi phân tích biểu đồ tăng trưởng người theo dõi theo thời gian, tỷ lệ comment lặp lại từ cùng một IP/cụm tài khoản, mức độ đa dạng từ ngữ và tốc độ xem video trung bình. Những tài khoản có dấu hiệu gian lận sẽ bị thuật toán hạ điểm tín nhiệm hoặc loại khỏi danh mục gợi ý.',
  },
  {
    q: 'Tôi có thể đo lường trực tiếp doanh thu đơn hàng từ mỗi Creator không?',
    a: 'Có! Hệ thống tự động tạo mã Tracking Link UTM và tích hợp với các sàn Shopee, TikTok Shop, Lazada hoặc website riêng của bạn. Doanh thu (GMV), lượt click và đơn hàng thành công sẽ được đồng bộ theo thời gian thực về Dashboard quản trị.',
  },
  {
    q: 'Nền tảng hỗ trợ thanh toán và hợp đồng pháp lý như thế nào?',
    a: 'Hệ thống cung cấp sẵn mẫu hợp đồng cộng tác pháp lý chuẩn theo quy định Việt Nam có thể ký điện tử ngay. Ngân sách hợp tác được giữ an toàn qua cơ chế bảo chứng (Escrow) và chỉ giải ngân khi creator hoàn tất nghiệm thu video theo đúng brief yêu cầu.',
  },
  {
    q: 'Doanh nghiệp của tôi có được xuất hóa đơn VAT đầy đủ không?',
    a: 'Chắc chắn có. Tất cả các gói dịch vụ phần mềm SaaS và chi phí chiến dịch đều được xuất hóa đơn điện tử VAT hợp lệ phục vụ cho công tác kế toán của doanh nghiệp.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Search input state in Hero
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Demo Sandbox creator
  const [selectedDemoKey, setSelectedDemoKey] = useState('tech');

  // ROI Calculator states
  const [budgetSlider, setBudgetSlider] = useState<number>(50); // Triệu VNĐ
  const [calcIndustry, setCalcIndustry] = useState<string>('beauty');

  // Pricing Toggle (Monthly vs Annual)
  const [isAnnual, setIsAnnual] = useState(false);

  // FAQ open indexes
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Active creator in Sandbox
  const activeCreator = useMemo(() => {
    return DEMO_CREATORS.find((c) => c.categoryKey === selectedDemoKey) || DEMO_CREATORS[0];
  }, [selectedDemoKey]);

  // Handle hero search
  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/creators?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/creators');
    }
  };

  // ROI Calculations
  const calculatedMetrics = useMemo(() => {
    const budgetVND = budgetSlider * 1_000_000;
    // Multipliers by industry
    const multipliers: Record<string, { roas: number; creatorCost: number; cpc: number }> = {
      beauty: { roas: 3.8, creatorCost: 12_000_000, cpc: 2500 },
      tech: { roas: 3.5, creatorCost: 15_000_000, cpc: 3200 },
      fashion: { roas: 3.2, creatorCost: 9_000_000, cpc: 2100 },
      fnb: { roas: 2.9, creatorCost: 8_000_000, cpc: 1800 },
    };
    const cfg = multipliers[calcIndustry] || multipliers.beauty;

    const suggestedCreators = Math.max(1, Math.round(budgetVND / cfg.creatorCost));
    const estimatedReach = Math.round(suggestedCreators * 145_000);
    const estimatedClicks = Math.round(budgetVND / cfg.cpc);
    const estimatedGmv = Math.round(budgetVND * cfg.roas);

    return {
      suggestedCreators,
      estimatedReach: `${(estimatedReach / 1000).toFixed(0)}K`,
      estimatedClicks: `${(estimatedClicks / 1000).toFixed(1)}K`,
      estimatedGmv: `${(estimatedGmv / 1_000_000).toFixed(1)} Triệu ₫`,
      roas: `${cfg.roas}x`,
    };
  }, [budgetSlider, calcIndustry]);

  return (
    <div className="lp-wrapper">
      {/* Background Ambient Lights & Grid */}
      <div className="lp-bg-ambient">
        <div className="lp-glow-orb-1" />
        <div className="lp-glow-orb-2" />
        <div className="lp-glow-orb-3" />
        <div className="lp-grid-pattern" />
      </div>

      {/* ==========================================================================
          NAVBAR
          ========================================================================== */}
      <header className="lp-navbar">
        <div className="lp-container">
          <div className="lp-nav-inner">
            <a href="/" className="lp-logo">
              <div className="lp-logo-icon">IM</div>
              <span>INFLUENCERMATCH</span>
              <span className="lp-logo-badge">AI v2.4</span>
            </a>

            <nav className="lp-nav-links">
              <a href="#tinh-nang" className="lp-nav-link">Tính năng AI</a>
              <a href="#demo-sandbox" className="lp-nav-link">Demo Ghép nối</a>
              <a href="#tinh-roi" className="lp-nav-link">Dự toán ROI</a>
              <a href="#bang-gia" className="lp-nav-link">Bảng giá</a>
              <a href="#faq" className="lp-nav-link">Hỏi đáp</a>
            </nav>

            <div className="lp-nav-actions">
              <button
                type="button"
                className="lp-btn-login"
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => navigate('/register')}
              >
                <span>Dùng thử miễn phí</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================================================
          HERO SECTION
          ========================================================================== */}
      <section className="lp-hero">
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 48, alignItems: 'center' }}>
            {/* Hero Left Content */}
            <div>
              <div className="lp-hero-tag">
                <Sparkles size={14} style={{ color: '#818CF8' }} />
                <span>Thuật toán Vector Semantic AI đầu tiên tại Việt Nam</span>
              </div>

              <h1 className="lp-hero-title">
                Tìm Đúng Creator <br />
                <span className="lp-gradient-text">Bứt Phá ROI & Doanh Số</span> <br />
                Bằng Trí Tuệ Nhân Tạo
              </h1>

              <p className="lp-hero-sub">
                Chấm dứt 40% lãng phí ngân sách vì bot ảo và creator sai tệp. 
                InfluencerMatch tự động quét insight thật, kiểm toán chất lượng và ghép nối chiến dịch hoàn hảo chỉ trong 30 giây.
              </p>

              {/* Natural Language Search Box in Hero */}
              <form onSubmit={handleHeroSearch} className="lp-hero-search-box">
                <Search className="lp-search-icon" />
                <input
                  type="text"
                  className="lp-search-input"
                  placeholder="Mô tả chiến dịch: ví dụ 'review đồ skincare trị mụn tệp sinh viên'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="lp-btn-primary" style={{ padding: '8px 18px' }}>
                  Tìm ngay
                </button>
              </form>

              {/* Quick Chip Prompts */}
              <div className="lp-hero-chips">
                <span className="lp-chip-label">Gợi ý tìm kiếm:</span>
                <button
                  type="button"
                  className="lp-chip-btn"
                  onClick={() => {
                    setSearchQuery('Reviewer mỹ phẩm organic & skincare');
                    navigate('/creators?q=Reviewer%20mỹ%20phẩm%20organic');
                  }}
                >
                  💄 Mỹ phẩm Organic
                </button>
                <button
                  type="button"
                  className="lp-chip-btn"
                  onClick={() => {
                    setSearchQuery('Tech reviewer đồ gia dụng thông minh');
                    navigate('/creators?q=Tech%20reviewer%20gia%20dụng');
                  }}
                >
                  📱 Thiết bị gia dụng
                </button>
                <button
                  type="button"
                  className="lp-chip-btn"
                  onClick={() => {
                    setSearchQuery('Food review đường phố Sài Gòn');
                    navigate('/creators?q=Food%20review%20Sài%20Gòn');
                  }}
                >
                  🍜 Ẩm thực đường phố
                </button>
              </div>

              {/* Badges Row */}
              <div className="lp-hero-badges-row">
                <div className="lp-hero-badge-item">
                  <div className="lp-hero-badge-dot" />
                  <span>650+ Creator đã kiểm duyệt</span>
                </div>
                <div className="lp-hero-badge-item">
                  <div className="lp-hero-badge-dot" />
                  <span>Loại bỏ 99.2% bot ảo</span>
                </div>
                <div className="lp-hero-badge-item">
                  <div className="lp-hero-badge-dot" />
                  <span>Ký hợp đồng & thanh toán Escrow</span>
                </div>
              </div>
            </div>

            {/* Hero Right: 3D-Feel Glassmorphic Dossier Card */}
            <div className="lp-hero-showcase">
              {/* Floating Badge Top Left */}
              <div className="lp-float-badge lp-float-badge-1">
                <div className="lp-float-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="lp-float-title">96.8% Follower Thật</div>
                  <div className="lp-float-sub">Đã quét và lọc sạch bot seeding</div>
                </div>
              </div>

              {/* Dossier Card Core */}
              <div className="lp-dossier-card">
                <div className="lp-dossier-header">
                  <div className="lp-creator-profile">
                    <div className="lp-creator-avatar-wrap">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                        alt="Huy Tiện Ích"
                        className="lp-creator-avatar"
                      />
                      <span className="lp-avatar-verified">✓</span>
                    </div>
                    <div>
                      <div className="lp-creator-name">
                        <span>Huy Tiện Ích</span>
                        <span style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', borderRadius: 4 }}>
                          ♂ Nam
                        </span>
                      </div>
                      <div className="lp-creator-handle">@huytienich.tech • TikTok Star</div>
                    </div>
                  </div>

                  <div className="lp-match-ring">
                    <div className="lp-match-score">96%</div>
                    <div className="lp-match-label">Khớp AI</div>
                  </div>
                </div>

                <div className="lp-dossier-metrics">
                  <div className="lp-dossier-metric-item">
                    <div className="lp-dossier-metric-num">305K</div>
                    <div className="lp-dossier-metric-label">Người theo dõi</div>
                  </div>
                  <div className="lp-dossier-metric-item">
                    <div className="lp-dossier-metric-num" style={{ color: '#10B981' }}>23.8%</div>
                    <div className="lp-dossier-metric-label">Tương tác thật</div>
                  </div>
                  <div className="lp-dossier-metric-item">
                    <div className="lp-dossier-metric-num" style={{ color: '#F59E0B' }}>3.6x</div>
                    <div className="lp-dossier-metric-label">Dự kiến ROAS</div>
                  </div>
                </div>

                <div className="lp-dossier-ai-reason">
                  <Sparkles className="lp-ai-icon" />
                  <div className="lp-ai-reason-text">
                    <strong>Đánh giá của AI:</strong> Tệp người xem có độ trùng khớp 94% với ngành Gia dụng thông minh. Video dạng tình huống thực tế mang lại tỷ lệ nhấp link bio cao gấp 2.4 lần mức trung bình ngành.
                  </div>
                </div>

                <div className="lp-dossier-actions">
                  <button
                    type="button"
                    className="lp-btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => navigate('/campaigns/create')}
                  >
                    <span>Mời hợp tác ngay</span>
                    <Zap size={15} />
                  </button>
                  <button
                    type="button"
                    className="lp-btn-secondary"
                    onClick={() => navigate('/creators')}
                  >
                    Chi tiết
                  </button>
                </div>
              </div>

              {/* Floating Badge Bottom Right */}
              <div className="lp-float-badge lp-float-badge-2">
                <div className="lp-float-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="lp-float-title">+320% ROI Chiến dịch</div>
                  <div className="lp-float-sub">Số liệu ghi nhận thời gian thực</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          STATS & SOCIAL PROOF RIBBON
          ========================================================================== */}
      <section className="lp-stats-section">
        <div className="lp-container">
          <div className="lp-stats-grid">
            <div className="lp-stat-box">
              <div className="lp-stat-number">650+</div>
              <div className="lp-stat-desc">Creator đã xác thực hồ sơ & số liệu</div>
            </div>
            <div className="lp-stat-box">
              <div className="lp-stat-number">98.4%</div>
              <div className="lp-stat-desc">Độ chuẩn xác trong ghép nối AI</div>
            </div>
            <div className="lp-stat-box">
              <div className="lp-stat-number">3.2x</div>
              <div className="lp-stat-desc">ROAS trung bình thương hiệu đạt được</div>
            </div>
            <div className="lp-stat-box">
              <div className="lp-stat-number">10x</div>
              <div className="lp-stat-desc">Rút ngắn thời gian chốt hợp tác & brief</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#64748B', fontWeight: 700 }}>
              Đồng hành cùng các thương hiệu dẫn đầu tại Việt Nam
            </span>
          </div>

          <div className="lp-partners-row">
            <span className="lp-partner-logo">COCOON</span>
            <span className="lp-partner-logo">LEMONADE</span>
            <span className="lp-partner-logo">COOLMATE</span>
            <span className="lp-partner-logo">ANANAS</span>
            <span className="lp-partner-logo">TORANO</span>
            <span className="lp-partner-logo">CỎ MỀM</span>
            <span className="lp-partner-logo">VINAMILK</span>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          CORE PILLARS (FEATURES)
          ========================================================================== */}
      <section className="lp-section" id="tinh-nang">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Giải pháp đột phá</span>
            <h2 className="lp-section-title">
              Công Nghệ AI Định Hình Lại <br />
              Hiệu Quả Influencer Marketing
            </h2>
            <p className="lp-section-sub">
              Không chỉ là danh bạ tìm kiếm thông thường. InfluencerMatch là hệ điều hành hoàn chỉnh giúp thương hiệu tự động hóa từ khâu khám phá, kiểm toán đến đo lường lợi nhuận.
            </p>
          </div>

          <div className="lp-features-grid">
            {/* Feature 1 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
                <Sparkles size={26} />
              </div>
              <h3 className="lp-feature-title">AI Vector Semantic Search</h3>
              <p className="lp-feature-desc">
                Mô hình học máy nhúng vector 768 chiều hiểu sâu sắc văn phong, ngữ cảnh nội dung và tệp khán giả mục tiêu thay vì chỉ so sánh các từ khóa rời rạc.
              </p>
              <ul className="lp-feature-list">
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Tìm kiếm bằng ngôn ngữ tự nhiên: "Creator phong cách hài hước cho Gen Z"</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Định lượng điểm số phù hợp (AI Match Score) từ 0 đến 100</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Tự động gợi ý Creator tương tự (Lookalike Creator Matching)</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#F472B6' }}>
                <ShieldCheck size={26} />
              </div>
              <h3 className="lp-feature-title">Kiểm Toán Bot & Seeding Ảo</h3>
              <p className="lp-feature-desc">
                Hệ thống quét chuyên sâu phân tích tỷ lệ tương tác thật, phát hiện các nhóm hội comment chéo, buff like ảo để bảo vệ 100% ngân sách marketing của bạn.
              </p>
              <ul className="lp-feature-list">
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Phân loại rõ ràng tỷ lệ người theo dõi thật (Audience Authenticity)</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Phát hiện bất thường về tốc độ tăng trưởng view & like</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Cảnh báo sớm Creator có tiền sử vi phạm hoặc seeding tiêu cực</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE' }}>
                <BarChart3 size={26} />
              </div>
              <h3 className="lp-feature-title">Ledger Báo Cáo Real-Time ROI & ROAS</h3>
              <p className="lp-feature-desc">
                Gắn mã tracking link thông minh tự động. Đo lường tức thì lượt click, tỷ lệ chuyển đổi, doanh thu bán hàng (GMV) và chi phí thực tế cho từng Creator.
              </p>
              <ul className="lp-feature-list">
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Tổng hợp ROAS chiến dịch theo thời gian thực (Live Dashboard)</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>So sánh hiệu quả giữa các Creator trong cùng một chiến dịch</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Tự động xuất báo cáo PDF/Excel phục vụ ban giám đốc</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                <Layers size={26} />
              </div>
              <h3 className="lp-feature-title">Quy Trình Hợp Tác & Escrow Khép Kín</h3>
              <p className="lp-feature-desc">
                Toàn bộ quy trình từ giao brief, duyệt kịch bản video, ký hợp đồng điện tử đến thanh toán an toàn đều được thực hiện trơn tru trên một giao diện duy nhất.
              </p>
              <ul className="lp-feature-list">
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Ký hợp đồng pháp lý số không cần in ấn giấy tờ</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Cơ chế bảo chứng Escrow: Chỉ giải ngân khi video đúng brief</span>
                </li>
                <li className="lp-feature-list-item">
                  <CheckCircle2 className="lp-feature-check" />
                  <span>Hệ thống chat và ghi chú chỉnh sửa kịch bản theo timeline</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          INTERACTIVE AI MATCH SANDBOX
          ========================================================================== */}
      <section className="lp-section" id="demo-sandbox" style={{ background: 'rgba(15, 19, 28, 0.6)' }}>
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Trải nghiệm tương tác</span>
            <h2 className="lp-section-title">Thử Nghiệm Ghép Nối Creator Bằng AI</h2>
            <p className="lp-section-sub">
              Chọn ngành hàng của bạn bên dưới để xem AI đề xuất Creator tối ưu với phân tích dữ liệu chuyên sâu.
            </p>
          </div>

          <div className="lp-sandbox-wrap">
            {/* Category Switcher Tabs */}
            <div className="lp-sandbox-tabs">
              {DEMO_CREATORS.map((c) => (
                <button
                  key={c.categoryKey}
                  type="button"
                  className={`lp-sandbox-tab-btn ${selectedDemoKey === c.categoryKey ? 'active' : ''}`}
                  onClick={() => setSelectedDemoKey(c.categoryKey)}
                >
                  <span>{c.categoryLabel}</span>
                </button>
              ))}
            </div>

            {/* Sandbox Content View */}
            <div className="lp-sandbox-content">
              {/* Creator Card */}
              <div className="lp-dossier-card" style={{ background: 'rgba(26, 35, 56, 0.85)' }}>
                <div className="lp-dossier-header">
                  <div className="lp-creator-profile">
                    <div className="lp-creator-avatar-wrap">
                      <img
                        src={activeCreator.avatar}
                        alt={activeCreator.name}
                        className="lp-creator-avatar"
                      />
                      <span className="lp-avatar-verified">✓</span>
                    </div>
                    <div>
                      <div className="lp-creator-name">
                        <span>{activeCreator.name}</span>
                        <span style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(99, 102, 241, 0.2)', color: '#A5B4FC', borderRadius: 4 }}>
                          {activeCreator.genderBadge}
                        </span>
                      </div>
                      <div className="lp-creator-handle">{activeCreator.handle}</div>
                    </div>
                  </div>

                  <div className="lp-match-ring">
                    <div className="lp-match-score">{activeCreator.matchScore}%</div>
                    <div className="lp-match-label">Khớp AI</div>
                  </div>
                </div>

                <div className="lp-dossier-metrics">
                  <div className="lp-dossier-metric-item">
                    <div className="lp-dossier-metric-num">{activeCreator.followers}</div>
                    <div className="lp-dossier-metric-label">Followers</div>
                  </div>
                  <div className="lp-dossier-metric-item">
                    <div className="lp-dossier-metric-num" style={{ color: '#10B981' }}>{activeCreator.engagement}</div>
                    <div className="lp-dossier-metric-label">Tương tác</div>
                  </div>
                  <div className="lp-dossier-metric-item">
                    <div className="lp-dossier-metric-num" style={{ color: '#F59E0B' }}>{activeCreator.expectedRoas}</div>
                    <div className="lp-dossier-metric-label">Dự kiến ROAS</div>
                  </div>
                </div>

                <div className="lp-dossier-ai-reason">
                  <Sparkles className="lp-ai-icon" />
                  <div className="lp-ai-reason-text">
                    <strong>Đánh giá AI:</strong> {activeCreator.aiReason}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Chi phí ước tính: </span>
                    <strong style={{ fontSize: 13, color: '#E2E8F0' }}>{activeCreator.costEstimate}</strong>
                  </div>
                  <button
                    type="button"
                    className="lp-btn-primary"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() => navigate('/campaigns/create')}
                  >
                    Ghép nối ngay
                  </button>
                </div>
              </div>

              {/* Rationale & Analytics Right Column */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818CF8', fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  <Award size={16} />
                  <span>Điểm mạnh nổi bật được AI chứng thực</span>
                </div>
                <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>
                  Tại sao Creator này đem lại hiệu quả cao?
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {activeCreator.strengths.map((str, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: '#E2E8F0' }}>{str}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 14 }}>
                  <button
                    type="button"
                    className="lp-btn-primary"
                    onClick={() => navigate('/creators')}
                  >
                    <span>Xem toàn bộ 600+ Creator</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="lp-btn-secondary"
                    onClick={() => navigate('/register')}
                  >
                    Tạo tài khoản thử nghiệm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          INTERACTIVE ROI CALCULATOR
          ========================================================================== */}
      <section className="lp-section" id="tinh-roi">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Công cụ dự toán</span>
            <h2 className="lp-section-title">Tính Toán ROI Chiến Dịch Influencer</h2>
            <p className="lp-section-sub">
              Kéo thanh trượt để điều chỉnh ngân sách dự kiến của bạn. Hệ thống sẽ ước tính tức thì số lượng Creator, lượng reach, lượt click và doanh số tiềm năng.
            </p>
          </div>

          <div className="lp-calculator-wrap">
            {/* Input Controls */}
            <div>
              <div className="lp-calc-slider-box">
                <div className="lp-calc-label-row">
                  <span className="lp-calc-label">Ngân sách chiến dịch dự kiến:</span>
                  <span className="lp-calc-val-highlight">{budgetSlider} Triệu VNĐ</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={budgetSlider}
                  onChange={(e) => setBudgetSlider(Number(e.target.value))}
                  className="lp-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 8 }}>
                  <span>10 Triệu</span>
                  <span>150 Triệu</span>
                  <span>300 Triệu</span>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <span className="lp-calc-label" style={{ display: 'block', marginBottom: 10 }}>Ngành hàng chính của bạn:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { key: 'beauty', label: 'Mỹ phẩm & Làm đẹp' },
                    { key: 'tech', label: 'Công nghệ & Điện tử' },
                    { key: 'fashion', label: 'Thời trang & Quần áo' },
                    { key: 'fnb', label: 'Ẩm thực & Đồ uống' },
                  ].map((ind) => (
                    <button
                      key={ind.key}
                      type="button"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: calcIndustry === ind.key ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: calcIndustry === ind.key ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: calcIndustry === ind.key ? '#FFFFFF' : '#94A3B8',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setCalcIndustry(ind.key)}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: 13, color: '#94A3B8' }}>
                💡 <strong>Ghi chú từ thuật toán:</strong> Kết quả dự toán dựa trên mức trung bình thực tế của hơn 1,200 chiến dịch đã thực hiện qua nền tảng InfluencerMatch trong 12 tháng qua.
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="lp-calc-result-card">
              <div>
                <div className="lp-calc-roas-hero">
                  <div className="lp-calc-roas-title">Hệ số thu hồi vốn dự kiến (ROAS)</div>
                  <div className="lp-calc-roas-val">{calculatedMetrics.roas}</div>
                  <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>Tỷ suất lợi nhuận vượt trội</span>
                </div>

                <div className="lp-calc-breakdown-grid">
                  <div className="lp-calc-bd-item">
                    <div className="lp-calc-bd-num">{calculatedMetrics.suggestedCreators}</div>
                    <div className="lp-calc-bd-sub">Creator đề xuất tối ưu</div>
                  </div>
                  <div className="lp-calc-bd-item">
                    <div className="lp-calc-bd-num">{calculatedMetrics.estimatedReach}</div>
                    <div className="lp-calc-bd-sub">Lượt tiếp cận (Reach)</div>
                  </div>
                  <div className="lp-calc-bd-item">
                    <div className="lp-calc-bd-num">{calculatedMetrics.estimatedClicks}</div>
                    <div className="lp-calc-bd-sub">Lượt click bio tiềm năng</div>
                  </div>
                  <div className="lp-calc-bd-item">
                    <div className="lp-calc-bd-num" style={{ color: '#10B981' }}>{calculatedMetrics.estimatedGmv}</div>
                    <div className="lp-calc-bd-sub">Doanh số dự kiến (GMV)</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="lp-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}
                onClick={() => navigate('/campaigns/create')}
              >
                <span>Bắt đầu chiến dịch với mức ngân sách này</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          HOW IT WORKS (3 SIMPLE STEPS)
          ========================================================================== */}
      <section className="lp-section" style={{ background: 'rgba(15, 19, 28, 0.4)' }}>
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Đơn giản & Tối ưu</span>
            <h2 className="lp-section-title">Khởi Chạy Chiến Dịch Chỉ Trong 3 Bước</h2>
            <p className="lp-section-sub">
              Tạm biệt các file Excel cồng kềnh và những cuộc nhắn tin kéo dài hàng tuần.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30 }}>
            {/* Step 1 */}
            <div style={{ background: 'var(--lp-bg-card)', padding: 32, borderRadius: 20, border: '1px solid var(--lp-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.2)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
                1
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
                Nhập Mô Tả Chiến Dịch
              </h3>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>
                Chỉ cần nhập sản phẩm và ngân sách của bạn (hoặc để AI Gemini tự động viết brief chuẩn hóa từ đường link sản phẩm).
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ background: 'var(--lp-bg-card)', padding: 32, borderRadius: 20, border: '1px solid var(--lp-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(6, 182, 212, 0.2)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
                2
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
                AI Ghép Nối & Mời 1-Click
              </h3>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>
                Thuật toán xếp hạng danh sách Creator tối ưu theo điểm số Match Score. Gửi lời mời đồng loạt và đàm phán chi phí minh bạch.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: 'var(--lp-bg-card)', padding: 32, borderRadius: 20, border: '1px solid var(--lp-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
                3
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
                Duyệt Bài & Đo Lường ROI
              </h3>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>
                Xem kịch bản, duyệt video trước khi đăng và theo dõi doanh thu đơn hàng đổ về thời gian thực trên màn hình trực quan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          PRICING SECTION
          ========================================================================== */}
      <section className="lp-section" id="bang-gia">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Bảng giá minh bạch</span>
            <h2 className="lp-section-title">Gói Cước Phù Hợp Mọi Quy Mô</h2>
            <p className="lp-section-sub">
              Khởi đầu miễn phí, nâng cấp linh hoạt khi quy mô thương hiệu và nhu cầu tăng trưởng.
            </p>
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="lp-pricing-toggle-wrap">
            <span
              className={`lp-pricing-toggle-label ${!isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(false)}
            >
              Thanh toán hàng tháng
            </span>
            <div
              className={`lp-toggle-switch ${isAnnual ? 'annual' : ''}`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <div className="lp-toggle-knob" />
            </div>
            <span
              className={`lp-pricing-toggle-label ${isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(true)}
            >
              Thanh toán hàng năm
            </span>
            <span className="lp-discount-badge">Tiết kiệm 20%</span>
          </div>

          <div className="lp-pricing-grid">
            {/* Free Plan */}
            <div className="lp-price-card">
              <div>
                <h3 className="lp-plan-name">Trải Nghiệm</h3>
                <p className="lp-plan-desc">Dành cho các Brand và SME mới bắt đầu thử nghiệm Influencer Marketing.</p>
                <div className="lp-plan-price-wrap">
                  <span className="lp-plan-price">0 ₫</span>
                  <span className="lp-plan-period">/ vĩnh viễn</span>
                </div>
                <ul className="lp-plan-features">
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Tối đa <strong>3 chiến dịch</strong> hoạt động</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Tìm kiếm cơ bản 50 creator/tháng</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Kiểm tra tỷ lệ bot cơ bản</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Hỗ trợ qua tài liệu & cộng đồng</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="lp-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/register')}
              >
                Bắt đầu miễn phí
              </button>
            </div>

            {/* Pro Plan */}
            <div className="lp-price-card popular">
              <span className="lp-popular-badge">Phổ Biến Nhất</span>
              <div>
                <h3 className="lp-plan-name">Tăng Tốc Pro</h3>
                <p className="lp-plan-desc">Tối ưu cho doanh nghiệp bán lẻ, D2C cần đẩy mạnh doanh số định kỳ.</p>
                <div className="lp-plan-price-wrap">
                  <span className="lp-plan-price">
                    {isAnnual ? '1.190.000 ₫' : '1.490.000 ₫'}
                  </span>
                  <span className="lp-plan-period">/ tháng</span>
                </div>
                <ul className="lp-plan-features">
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span><strong>Không giới hạn</strong> số lượng chiến dịch</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Thuật toán <strong>Vector Semantic AI Match</strong></span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Kiểm toán bot & seeding chuyên sâu</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Theo dõi doanh thu & tracking link thời gian thực</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Ký hợp đồng số & bảo chứng Escrow</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="lp-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/register')}
              >
                Nâng cấp gói Pro ngay
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="lp-price-card">
              <div>
                <h3 className="lp-plan-name">Doanh Nghiệp</h3>
                <p className="lp-plan-desc">Giải pháp chuyên biệt cho các tập đoàn lớn hoặc Agency quản lý nhiều Brand.</p>
                <div className="lp-plan-price-wrap">
                  <span className="lp-plan-price">Liên hệ</span>
                  <span className="lp-plan-period">/ giải pháp</span>
                </div>
                <ul className="lp-plan-features">
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Mọi tính năng của gói Pro</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>API Tích hợp ERP & CRM riêng của doanh nghiệp</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Quản lý nhiều tài khoản con (Sub-accounts)</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Chuyên viên Account Manager đồng hành 1:1</span>
                  </li>
                  <li className="lp-plan-feature-item">
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    <span>Cam kết SLA 99.9% uptime & bảo mật ngân hàng</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="lp-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/subscription')}
              >
                Tư vấn doanh nghiệp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          TESTIMONIALS
          ========================================================================== */}
      <section className="lp-section" style={{ background: 'rgba(15, 19, 28, 0.5)' }}>
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Được cộng đồng tin cậy</span>
            <h2 className="lp-section-title">Ý Kiến Từ Các Thương Hiệu Tiêu Biểu</h2>
            <p className="lp-section-sub">Xem các thương hiệu tại Việt Nam nói gì về trải nghiệm dùng InfluencerMatch.</p>
          </div>

          <div className="lp-testimonials-grid">
            <div className="lp-testi-card">
              <p className="lp-testi-quote">
                "Trước đây chúng tôi mất gần 2 tuần cho mỗi đợt săn lùng Creator trên TikTok và hay bị dính tài khoản seeding ảo. Dùng InfluencerMatch, chỉ trong 30 phút là đã lọc xong danh sách 10 creator có tỷ lệ tương tác thật chuẩn chỉ. ROAS chiến dịch vừa qua đạt 3.8x."
              </p>
              <div className="lp-testi-author">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Trần Minh Đức"
                  className="lp-testi-avatar"
                />
                <div>
                  <div className="lp-testi-name">Trần Minh Đức</div>
                  <div className="lp-testi-role">Growth Lead @ Coolmate</div>
                </div>
              </div>
            </div>

            <div className="lp-testi-card">
              <p className="lp-testi-quote">
                "Tính năng AI Semantic Match quá ấn tượng. Tôi chỉ cần gõ đúng thông điệp bộ sưu tập son mới, AI đã chỉ đích danh các bạn reviewer có khán giả nữ thích phong cách tự nhiên. Rất đáng đồng tiền bát gạo cho các nhãn hàng D2C."
              </p>
              <div className="lp-testi-author">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                  alt="Nguyễn Bích Phương"
                  className="lp-testi-avatar"
                />
                <div>
                  <div className="lp-testi-name">Nguyễn Bích Phương</div>
                  <div className="lp-testi-role">Brand Manager @ Lemonade Cosmetics</div>
                </div>
              </div>
            </div>

            <div className="lp-testi-card">
              <p className="lp-testi-quote">
                "Là một Content Creator, tôi thích nhất cơ chế hợp đồng số và thanh toán Escrow của nền tảng. Tôi hoàn toàn yên tâm sáng tạo nội dung mà không sợ bị chậm thanh toán thù lao từ nhãn hàng."
              </p>
              <div className="lp-testi-author">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Huy Tiện Ích"
                  className="lp-testi-avatar"
                />
                <div>
                  <div className="lp-testi-name">Huy Tiện Ích</div>
                  <div className="lp-testi-role">Tech & Lifestyle Creator (305K followers)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          FAQ ACCORDION
          ========================================================================== */}
      <section className="lp-section" id="faq">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Giải đáp thắc mắc</span>
            <h2 className="lp-section-title">Câu Hỏi Thường Gặp</h2>
            <p className="lp-section-sub">Những điều bạn cần biết trước khi bắt đầu cùng InfluencerMatch.</p>
          </div>

          <div className="lp-faq-list">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="lp-faq-item">
                <button
                  type="button"
                  className="lp-faq-trigger"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: openFaqIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className="lp-faq-body">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          CLOSING HIGH IMPACT CTA BANNER
          ========================================================================== */}
      <section className="lp-container">
        <div className="lp-closing-banner">
          <h2 className="lp-closing-title">
            Sẵn Sàng Bứt Phá Doanh Số Cùng <br />
            Influencer Marketing Thế Hệ Mới?
          </h2>
          <p className="lp-closing-sub">
            Gia nhập cùng hơn 600 thương hiệu và creator đang tối ưu hóa hiệu quả mỗi ngày. Khởi tạo tài khoản hoàn toàn miễn phí chỉ trong 60 giây.
          </p>
          <div className="lp-closing-actions">
            <button
              type="button"
              className="lp-btn-primary"
              style={{ padding: '14px 28px', fontSize: 16 }}
              onClick={() => navigate('/register')}
            >
              <span>Bắt đầu dùng thử miễn phí</span>
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="lp-btn-secondary"
              style={{ padding: '14px 28px', fontSize: 16 }}
              onClick={() => navigate('/creators')}
            >
              Khám phá danh sách Creator
            </button>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          FOOTER
          ========================================================================== */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <a href="/" className="lp-logo">
                <div className="lp-logo-icon">IM</div>
                <span>INFLUENCERMATCH</span>
              </a>
              <p>
                Nền tảng trí tuệ nhân tạo ghép nối thương hiệu và nhà sáng tạo nội dung hàng đầu Việt Nam. Tối ưu chi phí, minh bạch số liệu và gia tăng doanh số bền vững.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                <span style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, color: '#94A3B8' }}>
                  🔒 ISO 27001 Security
                </span>
                <span style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, color: '#94A3B8' }}>
                  ⚡ 99.9% Uptime SLA
                </span>
              </div>
            </div>

            <div>
              <div className="lp-footer-col-title">Sản Phẩm</div>
              <ul className="lp-footer-links">
                <li><a href="#tinh-nang">AI Semantic Match</a></li>
                <li><a href="#demo-sandbox">Phát hiện Bot & Seeding</a></li>
                <li><a href="#tinh-roi">Sổ cái Real-time ROI</a></li>
                <li><a href="/creators">Danh mục Creator</a></li>
                <li><a href="/campaigns/create">Tạo chiến dịch</a></li>
              </ul>
            </div>

            <div>
              <div className="lp-footer-col-title">Tài Nguyên</div>
              <ul className="lp-footer-links">
                <li><a href="#tinh-roi">Công cụ tính toán ROI</a></li>
                <li><a href="#bang-gia">Bảng giá gói cước</a></li>
                <li><a href="#faq">Câu hỏi thường gặp</a></li>
                <li><a href="/subscription">Chính sách bảo mật</a></li>
                <li><a href="/subscription">Điều khoản dịch vụ</a></li>
              </ul>
            </div>

            <div>
              <div className="lp-footer-col-title">Liên Hệ</div>
              <ul className="lp-footer-links">
                <li><span style={{ color: '#94A3B8', fontSize: 13.5 }}>Hotline: 1900 6868</span></li>
                <li><span style={{ color: '#94A3B8', fontSize: 13.5 }}>Email: support@influencermatch.vn</span></li>
                <li><span style={{ color: '#94A3B8', fontSize: 13.5 }}>Trụ sở: Tòa nhà Tech Tower, Q.1, TP. HCM</span></li>
                <li><a href="/login" style={{ color: '#818CF8', fontWeight: 600, marginTop: 6, display: 'inline-block' }}>Đăng nhập quản trị →</a></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© 2026 INFLUENCERMATCH Vietnam. Tất cả quyền được bảo lưu.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="/subscription" style={{ color: '#64748B', textDecoration: 'none' }}>Quyền riêng tư</a>
              <a href="/subscription" style={{ color: '#64748B', textDecoration: 'none' }}>Điều khoản</a>
              <a href="/subscription" style={{ color: '#64748B', textDecoration: 'none' }}>Quy chế hoạt động</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
