import './BrandLogo.css';

export default function BrandLogo({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <a href={href} className={`brand-logo ${className}`} aria-label="InfluencerMatch — Trang chủ">
      <img src="/logo.png" alt="" className="brand-logo-mark" width={36} height={36} />
      <span className="brand-logo-text">Influencer<span className="brand-logo-match">Match</span></span>
    </a>
  );
}
