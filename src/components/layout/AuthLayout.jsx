import React, { useState } from 'react';
import { Dropdown, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import './AuthLayout.css';

export default function AuthLayout({ children }) {
  const [lang, setLang] = useState('vi');

  const langMenuItems = [
    {
      key: 'vi',
      label: '🇻🇳 Tiếng Việt',
      onClick: () => {
        setLang('vi');
        message.success('Đã chuyển sang Tiếng Việt');
      },
    },
    {
      key: 'en',
      label: '🇺🇸 English',
      onClick: () => {
        setLang('en');
        message.success('Switched to English');
      },
    },
  ];

  return (
    <div className="al-root">
      {/* ── 2K Ultra-HD Wave Background Canvas with Subtle Breathing ── */}
      <div className="al-bg-canvas" aria-hidden="true" />

      {/* ── Dynamic Ambient Shimmer & Sparkles on Light Waves ── */}
      <div className="al-effects-layer" aria-hidden="true">
        <div className="al-ambient-glow" />
        <div className="al-wave-sparkle sparkle-1" />
        <div className="al-wave-sparkle sparkle-2" />
        <div className="al-wave-sparkle sparkle-3" />
      </div>

      <div className="al-wrap">
        {/* ── Top Header: Logo on left, Language on right ── */}
        <header className="al-header">
          <div className="al-brand" onClick={() => (window.location.href = '/')}>
            <img src="/logo.png" alt="InfluencerMatch Logo" className="al-logo-img" />
            <div className="al-brand-name">
              <span className="brand-dark">Influencer</span>
              <span className="brand-purple">Match</span>
            </div>
          </div>

          <div className="al-header-actions">
            <Dropdown menu={{ items: langMenuItems }} trigger={['click']} placement="bottomRight">
              <button type="button" className="al-lang-pill" aria-label="Chọn ngôn ngữ">
                <span>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                <DownOutlined style={{ fontSize: 9, marginLeft: 6, color: '#64748B' }} />
              </button>
            </Dropdown>
          </div>
        </header>

        {/* ── Main Single-Screen Content ── */}
        <main className="al-main">
          {/* ════ LEFT COLUMN: Pure Refined Editorial Typography ════ */}
          <section className="al-hero-col" aria-label="Giới thiệu nền tảng">
            <div className="al-hero-text">
              <h1 className="al-hero-title">
                Kết nối<br />
                <span className="word-dung-wrap">
                  đúng
                  <span className="al-hero-underline" />
                </span>{' '}
                <span className="al-hero-highlight">nhà sáng tạo</span>
              </h1>

              <p className="al-hero-desc">
                Nền tảng AI giúp thương hiệu tìm và hợp tác<br />
                với nhà sáng tạo nội dung phù hợp.
              </p>
            </div>
          </section>

          {/* ════ RIGHT COLUMN: Clean White Luxe Form Card ════ */}
          <section className="al-card-col" aria-label="Biểu mẫu">
            <div className="al-form-card">
              {children}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
