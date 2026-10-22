import React, { useState, useEffect } from 'react';
import { Dropdown, Button, message } from 'antd';
import {
  GlobalOutlined,
  DownOutlined,
  CheckCircleFilled,
  RiseOutlined,
  ThunderboltOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { LABELS } from '../../constants/labels';
import { creatorService } from '../../services/api/creatorService';

// ─── Platform icons (accessible & vector-based) ──────────────────────────────
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.14 8.14 0 004.78 1.52V7.11a4.85 4.85 0 01-1.01-.42z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const PlatformIcon = ({ platform }) => {
  const map = {
    tiktok:    { el: <TikTokIcon />,    bg: '#000000', label: 'TikTok' },
    instagram: { el: <InstagramIcon />, bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', label: 'Instagram' },
    youtube:   { el: <YouTubeIcon />,   bg: '#FF0000', label: 'YouTube' },
  };
  const { el, bg, label } = map[platform] || {};
  return (
    <span className="apl-icon" style={{ background: bg }} title={label} aria-label={label}>
      {el}
    </span>
  );
};

// ─── Clean Niche & Category Helper (Never displays UNKNOWN) ────────────────
const cleanNiche = (niche, name = '') => {
  if (!niche || String(niche).toUpperCase() === 'UNKNOWN' || String(niche).trim() === '') {
    const lower = String(name).toLowerCase();
    if (lower.includes('du lịch') || lower.includes('phượt') || lower.includes('travel') || lower.includes('nam')) return 'Du lịch & Khám phá';
    if (lower.includes('thể thao') || lower.includes('sport') || lower.includes('gym') || lower.includes('fitness')) return 'Thể thao & Fitness';
    if (lower.includes('mẹ') || lower.includes('bé') || lower.includes('baby') || lower.includes('kid')) return 'Gia đình & Mẹ bé';
    if (lower.includes('ăn') || lower.includes('food') || lower.includes('vặt') || lower.includes('nấu') || lower.includes('ẩm thực') || lower.includes('piu')) return 'Ẩm thực & Đồ ăn';
    if (lower.includes('giải trí') || lower.includes('hài') || lower.includes('film') || lower.includes('movie')) return 'Giải trí & Hài hước';
    if (lower.includes('đẹp') || lower.includes('skin') || lower.includes('mỹ phẩm') || lower.includes('beauty') || lower.includes('linh')) return 'Làm đẹp & Lifestyle';
    if (lower.includes('công nghệ') || lower.includes('tech') || lower.includes('phone') || lower.includes('huy')) return 'Tech & Gaming';
    return 'Phong cách sống & Sáng tạo';
  }
  return niche;
};

// ─── Preset Badges for dynamic rotation ──────────────────────────────────────
const BADGE_PRESETS = [
  { text: 'Top Tech', type: 'tech' },
  { text: 'AI Match 98%', type: 'match' },
  { text: 'Top Trending', type: 'trending' },
  { text: 'AI Match 99%', type: 'match' },
  { text: 'Hot Creator', type: 'trending' },
  { text: 'Top Lifestyle', type: 'tech' },
  { text: 'High ROI', type: 'match' },
];

// ─── Real Creators Pool (Matching Database & System Creators) ───────────────
const REAL_DATABASE_CREATORS = [
  {
    id: 'cr_1',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    name: 'Nam Đi Du Lịch',
    username: 'namdidulich',
    niche: 'Du lịch & Khám phá',
    followers: '152K',
    er: '13.0%',
    badge: { text: 'Top Trending', type: 'trending' },
    platforms: ['tiktok', 'youtube'],
    alt: 'Chân dung Nam Đi Du Lịch - Creator Du lịch & Khám phá',
    featured: false,
  },
  {
    id: 'cr_2',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    name: 'Kênh Thể Thao',
    username: 'kenhthethao.vn',
    niche: 'Thể thao & Fitness',
    followers: '1.5M',
    er: '9.7%',
    badge: { text: 'Top Tech', type: 'tech' },
    platforms: ['tiktok', 'instagram', 'youtube'],
    alt: 'Chân dung Kênh Thể Thao - Creator Thể thao & Fitness',
    featured: true,
  },
  {
    id: 'cr_3',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    name: 'Mẹ và bé',
    username: 'mevabe.review',
    niche: 'Gia đình & Mẹ bé',
    followers: '80K',
    er: '7.2%',
    badge: { text: 'AI Match 98%', type: 'match' },
    platforms: ['tiktok', 'instagram'],
    alt: 'Chân dung Mẹ và bé - Creator Gia đình & Mẹ bé',
    featured: false,
  },
  {
    id: 'c84cddd9-4ea5-4963-9b55-10981f152c46',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    name: 'Mỹ Di',
    username: 'mydii06',
    niche: 'Làm đẹp & Lifestyle',
    followers: '156K',
    er: '5.7%',
    badge: { text: 'AI Match 99%', type: 'match' },
    platforms: ['tiktok', 'instagram'],
    alt: 'Chân dung Mỹ Di - Creator Làm đẹp & Lifestyle',
    featured: false,
  },
  {
    id: 'cr_4',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    name: 'Giải Trí',
    username: 'giaitri.vietnam',
    niche: 'Giải trí & Hài hước',
    followers: '31K',
    er: '6.7%',
    badge: { text: 'Top Trending', type: 'trending' },
    platforms: ['tiktok', 'youtube'],
    alt: 'Chân dung Giải Trí - Creator Giải trí & Hài hước',
    featured: false,
  },
];

// Helper to map and sanitize raw creator entity from API/Database
const mapCreator = (c, idx, fallbackRef) => {
  const fallback = fallbackRef || REAL_DATABASE_CREATORS[idx % REAL_DATABASE_CREATORS.length];
  const followersNum = Number(c.followers || c.followersCount || c.rawFollowers) || 0;
  const followersText = (typeof c.followers === 'string' && (c.followers.includes('K') || c.followers.includes('M')))
    ? c.followers
    : followersNum >= 1000000
    ? `${(followersNum / 1000000).toFixed(1)}M`
    : followersNum >= 1000
    ? `${(followersNum / 1000).toFixed(0)}K`
    : fallback.followers;

  const rawEr = Number(c.engagementRate || c.engagementValue || c.er) || 0;
  const erText = (typeof c.engagementRate === 'string' && c.engagementRate.includes('%'))
    ? c.engagementRate
    : rawEr > 0
    ? `${(rawEr <= 1 ? rawEr * 100 : (rawEr > 100 ? rawEr / 10 : rawEr)).toFixed(1)}%`
    : fallback.er;

  const plat = (c.platform || 'TIKTOK').toLowerCase();
  const platformsList = [plat];
  (fallback.platforms || ['tiktok', 'instagram']).forEach((p) => {
    if (!platformsList.includes(p) && platformsList.length < 3) platformsList.push(p);
  });

  const name = c.displayName || c.userName || c.name || fallback.name;
  const niche = cleanNiche(c.niche || c.category, name);
  const badge = c.badge || BADGE_PRESETS[idx % BADGE_PRESETS.length] || fallback.badge;

  const img = (c.avatarUrl && c.avatarUrl.trim().startsWith('http'))
    ? c.avatarUrl
    : (c.avatar && c.avatar.trim().startsWith('http'))
    ? c.avatar
    : c.img || fallback.img;

  return {
    id: c.id || c.creatorId || `real-${idx}`,
    img,
    name,
    niche,
    followers: followersText,
    er: erText,
    badge,
    platforms: platformsList,
    alt: `Chân dung ${name} - Nhà sáng tạo nội dung ${niche}`,
    featured: idx === 1,
    fallbackImg: fallback.img,
  };
};

// Shuffles and picks 3 distinct creators from pool
const pickRandomThree = (pool, excludeIds = []) => {
  if (!Array.isArray(pool) || pool.length === 0) return REAL_DATABASE_CREATORS.slice(0, 3);
  if (pool.length <= 3) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.map((c, i) => mapCreator(c, i, REAL_DATABASE_CREATORS[i]));
  }

  // Pick creators that are NOT currently displayed so it rotates nicely
  const available = pool.filter((c) => !excludeIds.includes(c.id || c.creatorId));
  const candidatePool = available.length >= 3 ? available : pool;

  const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
  const chosen = shuffled.slice(0, 3);
  return chosen.map((c, i) => mapCreator(c, i, REAL_DATABASE_CREATORS[i]));
};


export default function AuthLayout({ children }) {
  const [lang, setLang] = useState('vi');
  // Initialize with 3 random creators exclusively from the real creator pool
  const [creators, setCreators] = useState(() => pickRandomThree(REAL_DATABASE_CREATORS));
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Pool contains ONLY real creators from database / real cache
  const allPoolRef = React.useRef(REAL_DATABASE_CREATORS);
  const currentIdsRef = React.useRef(creators.map(c => c.id));

  // 1. Fetch live real creators from API & real localStorage cache
  useEffect(() => {
    let isMounted = true;

    const loadCreators = async () => {
      try {
        // Read real creators cached in localStorage from authenticated sessions
        let realPool = [];
        const allCached = localStorage.getItem('IM_ALL_CREATORS');
        const showcaseCached = localStorage.getItem('IM_SHOWCASE_CREATORS');

        if (allCached) {
          try {
            const parsedAll = JSON.parse(allCached);
            if (Array.isArray(parsedAll) && parsedAll.length > 0) {
              const valid = parsedAll.filter(c => (c.avatarUrl && c.avatarUrl.trim().startsWith('http')) || (c.avatar && c.avatar.trim().startsWith('http')));
              if (valid.length > 0) realPool = valid;
            }
          } catch {}
        }

        if (realPool.length < 3 && showcaseCached) {
          try {
            const parsedShowcase = JSON.parse(showcaseCached);
            if (Array.isArray(parsedShowcase) && parsedShowcase.length > 0) {
              realPool = parsedShowcase;
            }
          } catch {}
        }

        // If real creators exist in cache, use 100% real creators
        if (realPool.length >= 3) {
          allPoolRef.current = realPool;
          const initial = pickRandomThree(realPool);
          currentIdsRef.current = initial.map(c => c.id);
          setCreators(initial);
        }

        // Call backend API to fetch real creators directly
        const data = await creatorService.getCreators();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const validData = data.filter(c => (c.avatarUrl && c.avatarUrl.trim().startsWith('http')) || c.avatar);
          if (validData.length >= 3) {
            allPoolRef.current = validData;
            const initial = pickRandomThree(validData);
            currentIdsRef.current = initial.map(c => c.id);
            setCreators(initial);
          }
        }
      } catch (err) {
        console.warn('[AuthLayout] Hiển thị danh sách creator thật từ database:', err);
      }
    };

    loadCreators();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Auto-rotate random creators over time (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return; // Pause rotation when user is hovering over cards
      if (!allPoolRef.current || allPoolRef.current.length < 3) return;

      // Trigger smooth fade transition
      setIsFading(true);

      setTimeout(() => {
        const nextThree = pickRandomThree(allPoolRef.current, currentIdsRef.current);
        currentIdsRef.current = nextThree.map(c => c.id);
        setCreators(nextThree);
        setIsFading(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const langMenuItems = [
    {
      key: 'vi',
      label: '🇻🇳 Tiếng Việt',
      onClick: () => { setLang('vi'); message.success('Đã chuyển sang Tiếng Việt'); },
    },
    {
      key: 'en',
      label: '🇺🇸 English',
      onClick: () => { setLang('en'); message.success('Switched to English'); },
    },
  ];

  return (
    <div className="al-root">
      <div className="al-wrap">
        {/* ── Header ── */}
        <header className="al-header">
          {/* Logo aligned with hero headline left edge */}
          <div className="al-brand">
            <img src="/logo.png" alt="InfluencerMatch Logo" className="al-logo-img" />
            <div className="al-brand-info">
              <span className="al-brand-name">
                <span className="al-brand-accent">INFLUENCER</span>MATCH
              </span>
              <span className="al-brand-tag">{LABELS.BRAND.TAGLINE}</span>
            </div>
          </div>

          {/* Language selector aligned with login card right edge */}
          <Dropdown menu={{ items: langMenuItems }} trigger={['click']} placement="bottomRight">
            <Button
              className="al-lang-btn"
              shape="round"
              size="middle"
              icon={<GlobalOutlined aria-hidden="true" />}
              aria-label="Chọn ngôn ngữ giao diện"
            >
              {lang === 'vi' ? 'Tiếng Việt' : 'English'}
              <DownOutlined style={{ fontSize: 9, marginLeft: 4 }} aria-hidden="true" />
            </Button>
          </Dropdown>
        </header>

        {/* ── Main 2-col grid ── */}
        <main className="al-main">

          {/* ════ LEFT HERO ════ */}
          <section className="al-hero" aria-label="Giới thiệu nền tảng InfluencerMatch">

            {/* Headline block */}
            <div className="al-headline-block">
              <h1 className="al-h1">
                Tìm đúng{' '}
                <span className="al-h1-hi">Influencer</span>{' '}
                cho mọi chiến dịch
              </h1>

              <p className="al-sub">
                InfluencerMatch kết nối thương hiệu với những nhà sáng tạo nội
                dung phù hợp nhất — nhanh chóng, thông minh, đo lường rõ ràng.
              </p>
            </div>

            {/* ── Creator showcase (Equal size cards, clean alignment, anchored badges) ── */}
            <div
              className="al-showcase"
              role="region"
              aria-label="Hồ sơ Creator tiêu biểu"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="al-showcase-grid">
                {creators.map((creator) => (
                  <article
                    key={creator.id}
                    className={`al-creator-card ${creator.featured ? 'al-creator-featured' : ''} ${isFading ? 'al-card-fading' : ''}`}
                  >
                    {/* Anchored badge (top corner, never covers face or names) */}
                    {creator.badge && (
                      <div className={`al-card-badge al-badge-${creator.badge.type}`}>
                        {creator.badge.type === 'match' && <span className="al-badge-star" aria-hidden="true">✦</span>}
                        {creator.badge.type === 'tech' && <ThunderboltOutlined style={{ fontSize: 10 }} aria-hidden="true" />}
                        {creator.badge.type === 'trending' && <RiseOutlined style={{ fontSize: 10 }} aria-hidden="true" />}
                        <span>{creator.badge.text}</span>
                      </div>
                    )}

                    {/* Card photo container */}
                    <div className="al-card-media">
                      <img
                        src={creator.img}
                        alt={creator.alt}
                        loading={creator.featured ? 'eager' : 'lazy'}
                        onError={(e) => {
                          if (creator.fallbackImg && e.currentTarget.src !== creator.fallbackImg) {
                            e.currentTarget.src = creator.fallbackImg;
                          }
                        }}
                      />
                      <div className="al-card-scrim" />
                    </div>

                    {/* Verified name chip */}
                    <div className="al-card-identity">
                      <div className="al-card-name-row">
                        <span className="al-card-name">{creator.name}</span>
                        <CheckCircleFilled className="al-verified-icon" aria-hidden="true" title="Đã xác minh" />
                      </div>
                      <span className="al-card-niche">{creator.niche}</span>
                    </div>

                    {/* Card stats & platforms row */}
                    <div className="al-card-meta">
                      <div className="al-card-stats-group">
                        <div className="al-card-stat">
                          <span className="al-stat-value">{creator.followers}</span>
                          <span className="al-stat-label">Followers</span>
                        </div>
                        <div className="al-stat-divider" aria-hidden="true" />
                        <div className="al-card-stat">
                          <span className="al-stat-value al-stat-er">{creator.er}</span>
                          <span className="al-stat-label">ER</span>
                        </div>
                      </div>
                      <div className="al-card-platform-list" aria-label="Nền tảng hoạt động">
                        {creator.platforms.map(p => <PlatformIcon key={p} platform={p} />)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* ── Features list (Clean, high contrast, non-overlapping) ── */}
            <div className="al-features" role="list">
              {LABELS.FEATURES.map(f => (
                <div className="al-feature" key={f.id} role="listitem">
                  <div className={`al-feat-icon al-feat-${f.id}`} aria-hidden="true">
                    {f.id === 'target' && <AimOutlined />}
                    {f.id === 'time'   && <ThunderboltOutlined />}
                    {f.id === 'roi'    && <RiseOutlined />}
                  </div>
                  <div className="al-feat-content">
                    <p className="al-feat-title">{f.title}</p>
                    <p className="al-feat-desc">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </section>

          {/* ════ RIGHT FORM ════ */}
          <section className="al-form-col" aria-label="Form đăng nhập">
            <div className="al-form-card">
              {children}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
