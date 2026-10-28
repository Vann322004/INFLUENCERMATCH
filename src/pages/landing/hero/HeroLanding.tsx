import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, Play, Sparkles, Menu, X } from 'lucide-react';
import BoomerangVideoBg from './BoomerangVideoBg';
import './HeroLanding.css';

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261014_144105_b4b14bc7-788f-4997-86aa-ce920dc8fe96.mp4';

const navLinks = [
  { href: '#mission', label: 'About' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
];

export default function HeroLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <section className="hv-root">
      <BoomerangVideoBg src={BG_VIDEO} className="hv-video-bg" />

      <nav className="hv-nav">
        <div className="hv-logo">
          <img src="/logo.png" alt="InfluencerMatch logo" className="hv-logo-img" />
          <span>
            InfluencerMatch<sup>TM</sup>
          </span>
        </div>

        <div className="hv-pill">
          {navLinks.map((link, i) => (
            <a key={link.href} href={link.href} className={`hv-pill-link ${i === 0 ? 'is-active' : ''}`}>
              {link.label}
            </a>
          ))}
          <Link to="/register" className="hv-btn-dark">
            Get Started
          </Link>
        </div>

        <div className="hv-nav-right">
          <Link to="/register" className="hv-auth-link">
            <UserPlus size={16} />
            Sign Up
          </Link>
          <Link to="/login" className="hv-auth-link">
            <LogIn size={16} />
            Log In
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="hv-burger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <Menu size={20} className={`hv-burger-icon ${menuOpen ? 'out-menu' : ''}`} />
            <X size={20} className={`hv-burger-icon ${menuOpen ? '' : 'out-x'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`hv-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="hv-overlay-bg" />
      </div>

      {/* Mobile drawer */}
      <div className={`hv-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="hv-drawer-inner">
          <div className="hv-drawer-links">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="hv-drawer-link"
                style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : '0ms' }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hv-drawer-cta" style={{ transitionDelay: menuOpen ? '400ms' : '0ms' }}>
            <Link to="/register" className="hv-drawer-auth">
              <UserPlus size={16} />
              Sign Up
            </Link>
            <Link to="/login" className="hv-drawer-auth">
              <LogIn size={16} />
              Log In
            </Link>
            <Link to="/register" className="hv-btn-dark hv-btn-drawer">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Hero copy */}
      <div className="hv-hero">
        <h1 className="hv-title">
          Close the rift <span className="hv-title-accent">linking<br className="hv-br" /> signals and action</span>
        </h1>
        <p className="hv-sub">Shape scattered signals into meaningful outcomes via AI-driven workflows.</p>
      </div>

      {/* Bottom-left CTA */}
      <div className="hv-bl">
        <div className="hv-bl-brand">
          <Sparkles size={16} />
          <span>
            InfluencerMatch<sup>TM</sup>
          </span>
        </div>
        <p className="hv-bl-text">
          InfluencerMatch connects brands with the right creators using AI matching, so you can discover, manage and
          measure influencer campaigns in one place.
        </p>
        <div className="hv-bl-actions">
          <Link to="/register" className="hv-btn-bl">
            Get Started
          </Link>
          <a href="#mission" className="hv-link-bl">
            Learn More
          </a>
        </div>
      </div>

      {/* Bottom-right video link */}
      <div className="hv-br-video">
        <button className="hv-play" aria-label="Play video">
          <Play size={12} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />
        </button>
        <span className="hv-br-label">Watch demo</span>
        <span className="hv-br-time">1:35</span>
      </div>
    </section>
  );
}
