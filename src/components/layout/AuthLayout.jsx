import React, { useState } from 'react';
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

// ─── Creator profiles (B2B Showcase - Equal dimensions, clean alignment) ──────
const CREATORS = [
  {
    id: 'minh-huy',
    img: '/creator-left.jpg',
    name: 'Minh Huy',
    niche: 'Tech & Gaming',
    followers: '850K',
    er: '6.1%',
    badge: { text: 'Top Tech', type: 'tech' },
    platforms: ['youtube', 'tiktok'],
    alt: 'Chân dung Minh Huy - Nhà sáng tạo nội dung Tech & Gaming',
  },
  {
    id: 'linh-nguyen',
    img: '/creator-main.jpg',
    name: 'Linh Nguyễn',
    niche: 'Làm đẹp & Lifestyle',
    followers: '1.2M',
    er: '4.8%',
    badge: { text: 'AI Match 98%', type: 'match' },
    platforms: ['tiktok', 'instagram', 'youtube'],
    alt: 'Chân dung Linh Nguyễn - Nhà sáng tạo nội dung Làm đẹp & Phong cách sống',
    featured: true,
  },
  {
    id: 'ha-my',
    img: '/creator-right.jpg',
    name: 'Hà My',
    niche: 'Ẩm thực & Du lịch',
    followers: '420K',
    er: '5.3%',
    badge: { text: 'Top Trending', type: 'trending' },
    platforms: ['instagram', 'tiktok'],
    alt: 'Chân dung Hà My - Nhà sáng tạo nội dung Ẩm thực & Du lịch',
  },
];

// ─── Platform Statistics Configuration (B8) ──────────────────────────────────
// TODO: Thay bằng API số liệu thực tế từ hệ thống thống kê/KPI của InfluencerMatch
const AUTH_STATS = [
  { id: 'creators', value: '50,000+', label: 'Creator đã xác minh' },
  { id: 'satisfaction', value: '98%', label: 'Khách hàng hài lòng' },
  { id: 'roi', value: '2.5×', label: 'Tăng trưởng ROI' },
];

export default function AuthLayout({ children }) {
  const [lang, setLang] = useState('vi');

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
            <div className="al-showcase" role="region" aria-label="Hồ sơ Creator tiêu biểu">
              <div className="al-showcase-grid">
                {CREATORS.map((creator) => (
                  <article
                    key={creator.id}
                    className={`al-creator-card ${creator.featured ? 'al-creator-featured' : ''}`}
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

            {/* ── Stats bar (Equal width, 3 stats divided evenly, with note) ── */}
            <div className="al-stats-container">
              <div className="al-statsbar">
                {AUTH_STATS.map((stat, idx) => (
                  <React.Fragment key={stat.id}>
                    <div className="al-statb">
                      <span className="al-statb-n">{stat.value}</span>
                      <span className="al-statb-l">{stat.label}</span>
                    </div>
                    {idx < AUTH_STATS.length - 1 && (
                      <div className="al-statb-sep" aria-hidden="true" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className="al-stats-note">*Số liệu cập nhật tháng 10/2026</span>
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
