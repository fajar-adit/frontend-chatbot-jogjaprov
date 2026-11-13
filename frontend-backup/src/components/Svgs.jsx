import React from 'react';

// Official DIY Logo Crest (Daerah Istimewa Yogyakarta)
export function JogjaCrest({ size = 36, className = "" }) {
  return (
    <div className={`crest-container ${className}`} style={{ width: size, height: size * 1.25 }}>
      <img
        src="/assets/logo-pemda-diy.png"
        alt="Logo Pemda DIY"
        className="crest-img"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

// Laras Chatbot Mascot Avatar (clean circle with pink/merah muda background and updated asset)
export function LarasAvatar({ size = 44, className = "" }) {
  return (
    <div
      className={`laras-avatar-circle ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src="/assets/laras-avatar.png"
        alt="Laras"
        className="laras-avatar-img"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

// OGP Local Yogyakarta Logo Badge
export function OgpBadge({ className = "" }) {
  return (
    <div className={`ogp-badge ${className}`}>
      <div className="ogp-icon">
        <svg width="26" height="32" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2 L17 9 L15 11 L16 22 L20 25 L20 32 L8 32 L8 25 L12 22 L13 11 L11 9 Z" fill="#0284C7" stroke="#38BDF8" strokeWidth="0.8" />
          <circle cx="14" cy="4" r="2" fill="#F59E0B" />
          <rect x="6" y="29" width="16" height="3" rx="1" fill="#0369A1" />
          <circle cx="4" cy="17" r="1.5" fill="#0284C7" opacity="0.7"/>
          <circle cx="24" cy="17" r="1.5" fill="#0284C7" opacity="0.7"/>
          <circle cx="6" cy="11" r="1.2" fill="#38BDF8" opacity="0.7"/>
          <circle cx="22" cy="11" r="1.2" fill="#38BDF8" opacity="0.7"/>
        </svg>
      </div>
      <div className="ogp-text">
        <span className="ogp-title">OGP</span>
        <span className="ogp-sub">Local</span>
        <span className="ogp-city">Yogyakarta</span>
      </div>
    </div>
  );
}

// Landmark Watermark: Tugu Jogja + Gunung Merapi + Pendopo Kraton Joglo
export function JogjaWatermark({ className = "" }) {
  return (
    <div className={`jogja-watermark ${className}`} aria-hidden="true">
      <img
        src="/assets/jogja-landmark.png"
        alt=""
        className="watermark-img"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
