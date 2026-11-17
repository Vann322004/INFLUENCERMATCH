import React, { useState } from 'react';
import { Dropdown, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import './AuthLayout.css';
import BrandLogo from './BrandLogo';

const AUTH_BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261029_084140_553c4785-d33c-496e-9702-45247fa2fcf3.mp4';

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
      {/* ── Full-Viewport Looping Video Background ── */}
      <video
        className="al-bg-video"
        src={AUTH_BG_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="al-video-overlay" aria-hidden="true" />

      <div className="al-wrap">
        {/* ── Top Header: Logo on left, Language on right ── */}
        <header className="al-header">
          <BrandLogo href="/" className="al-brand" />

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
              <p className="al-hero-eyebrow">Khởi đầu một kết nối phù hợp</p>
              <h1 className="al-hero-title">
                Kết nối đúng{' '}
                <span className="al-hero-highlight">nhà sáng tạo</span>
              </h1>

              <p className="al-hero-desc">
                Nền tảng AI giúp thương hiệu tìm và hợp tác{' '}
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
