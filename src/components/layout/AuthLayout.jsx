import React, { useState } from 'react';
import { Dropdown, Button, Typography, Card, message } from 'antd';
import {
  GlobalOutlined,
  DownOutlined,
  AimOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  UserOutlined
} from '@ant-design/icons';
import { LABELS } from '../../constants/labels';
import '../../index.css';

const { Title, Paragraph, Text } = Typography;

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
    <div className="app-container">
      {/* Top Navigation Header */}
      <header className="app-header">
        <div className="brand-logo">
          <div className="logo-icon">iM</div>
          <div className="brand-info">
            <h1 className="brand-name"><span>INFLUENCER</span>MATCH</h1>
            <span className="brand-tagline">{LABELS.BRAND.TAGLINE}</span>
          </div>
        </div>

        <Dropdown menu={{ items: langMenuItems }} trigger={['click']} placement="bottomRight">
          <Button className="lang-btn" shape="round" icon={<GlobalOutlined />}>
            {lang === 'vi' ? 'Tiếng Việt' : 'English'} <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>
      </header>

      {/* Main Content Layout */}
      <main className="main-content">
        {/* Left Section: Hero Showcase */}
        <section className="left-section">
          {/* Top Headline & Subtitle */}
          <div className="hero-top-text">
            <Title level={1} className="hero-heading">
              {LABELS.HERO.TITLE_PREFIX}
              <span className="gradient-text">{LABELS.HERO.TITLE_HIGHLIGHT}</span>
              {LABELS.HERO.TITLE_SUFFIX}
            </Title>

            <Paragraph className="hero-subtitle">
              {LABELS.HERO.SUBTITLE}
            </Paragraph>
          </div>

          {/* Middle Body: 2 Columns (Features on Left, Cards on Right) */}
          <div className="hero-middle-grid">
            {/* 3 Features Column */}
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon-wrapper icon-purple">
                  <AimOutlined style={{ fontSize: 18 }} />
                </div>
                <div className="feature-details">
                  <Text bold className="feature-title">{LABELS.FEATURES[0].title}</Text>
                  <Text type="secondary" className="feature-desc">{LABELS.FEATURES[0].description}</Text>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-wrapper icon-blue">
                  <ThunderboltOutlined style={{ fontSize: 18 }} />
                </div>
                <div className="feature-details">
                  <Text bold className="feature-title">{LABELS.FEATURES[1].title}</Text>
                  <Text type="secondary" className="feature-desc">{LABELS.FEATURES[1].description}</Text>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-wrapper icon-indigo">
                  <BarChartOutlined style={{ fontSize: 18 }} />
                </div>
                <div className="feature-details">
                  <Text bold className="feature-title">{LABELS.FEATURES[2].title}</Text>
                  <Text type="secondary" className="feature-desc">{LABELS.FEATURES[2].description}</Text>
                </div>
              </div>
            </div>

            {/* Central Creator Visual Showcase Card Stack */}
            <div className="visual-showcase">
              <div className="sparkle-icon sparkle-1">✦</div>
              <div className="sparkle-icon sparkle-2">✦</div>
              <div className="heart-badge-icon">💜</div>

              {/* Left Tilted Background Card */}
              <div className="showcase-card card-bg-left">
                <div className="card-image-wrap">
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80" alt="Creator Left" />
                  <div className="card-badge bg-creator">
                    <UserOutlined style={{ fontSize: 9 }} />
                    <span>Creator</span>
                  </div>
                </div>
              </div>

              {/* Main Center Card */}
              <div className="showcase-card card-main">
                <div className="card-image-wrap">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80" alt="Influencer Creator" />
                  <div className="card-badge">
                    <UserOutlined style={{ fontSize: 10 }} />
                    <span>Influencer</span>
                  </div>

                  <div className="card-stats-overlay">
                    <div className="stats-row">
                      <div className="stat-box">
                        <span className="stat-val">1.2M</span>
                        <span className="stat-lbl">Followers</span>
                      </div>
                      <div className="stat-box" style={{ textAlign: 'right' }}>
                        <span className="stat-val">4.8%</span>
                        <span className="stat-lbl">Engagement</span>
                      </div>
                    </div>

                    <div className="social-pills">
                      <div className="social-pill-icon sp-tiktok" title="TikTok">♪</div>
                      <div className="social-pill-icon sp-instagram" title="Instagram">📷</div>
                      <div className="social-pill-icon sp-youtube" title="YouTube">▶</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Tilted Background Card */}
              <div className="showcase-card card-bg-right">
                <div className="card-image-wrap">
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80" alt="Creator Right" />
                  <div className="card-badge bg-creator">
                    <UserOutlined style={{ fontSize: 9 }} />
                    <span>Creator</span>
                  </div>
                </div>
              </div>

              {/* Sketched Arrow SVG */}
              <svg className="curved-arrow" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10 40 Q 25 10 40 25 M 32 20 L 40 25 L 35 32" />
              </svg>
            </div>
          </div>

          {/* Bottom Accent */}
          <div className="left-footer">
            <div className="handwritten-slogan">
              {LABELS.SLOGAN.LINE1}<br />{LABELS.SLOGAN.LINE2}
            </div>
          </div>
        </section>

        {/* Right Section: Form Card Slot */}
        <section className="right-section">
          <Card className="login-card" bordered={false}>
            {/* Header Brand Inside Card */}
            <div className="card-brand-header">
              <div className="logo-icon" style={{ width: 36, height: 36, fontSize: 15 }}>iM</div>
              <div className="brand-name" style={{ fontSize: 16, marginTop: 6 }}>
                <span>INFLUENCER</span>MATCH
              </div>
              <span className="brand-tagline" style={{ fontSize: 8 }}>{LABELS.BRAND.TAGLINE}</span>
            </div>

            {/* Form Slot */}
            {children}
          </Card>
        </section>
      </main>
    </div>
  );
}
