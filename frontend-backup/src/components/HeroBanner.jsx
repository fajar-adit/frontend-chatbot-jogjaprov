import React from 'react';
import { LarasAvatar } from './Svgs';

export function HeroBanner() {
  return (
    <div className="portal-banner-card">
      <img
        src="/assets/banner-dirgahayu.png"
        alt="Dirgahayu Republik Indonesia - Pemerintah Daerah Daerah Istimewa Yogyakarta"
        className="banner-main-image"
      />

      {/* Carousel Dots at Bottom */}
      <div className="banner-carousel-dots" aria-hidden="true">
        <span className="dot dot-active"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
}

// Floating Action Stack (Right margin: CCTV, Chat, Accessibility, Mascot)
export function FloatingActionStack({ onOpenChat }) {
  return (
    <div className="floating-action-stack">
      {/* 1. CCTV Icon */}
      <button className="stack-btn" aria-label="Pantauan CCTV Jogja" title="Pantauan CCTV Jogja">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
          <path d="M19 4v3"/>
        </svg>
      </button>

      {/* 2. Message / Comment Icon */}
      <button className="stack-btn" aria-label="Pengaduan & Aspirasi" title="Pengaduan & Aspirasi" onClick={onOpenChat}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <line x1="8" y1="10" x2="8.01" y2="10" strokeWidth="3.5" />
          <line x1="12" y1="10" x2="12.01" y2="10" strokeWidth="3.5" />
          <line x1="16" y1="10" x2="16.01" y2="10" strokeWidth="3.5" />
        </svg>
      </button>

      {/* 3. Accessibility Icon */}
      <button className="stack-btn" aria-label="Fitur Aksesibilitas" title="Fitur Aksesibilitas">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="4.5" r="2.5" />
          <path d="M19 8.5H5C4.45 8.5 4 8.95 4 9.5C4 10.05 4.45 10.5 5 10.5H9V20C9 20.55 9.45 21 10 21C10.55 21 11 20.55 11 20V15H13V20C13 20.55 13.45 21 14 21C14.55 21 15 20.55 15 20V10.5H19C19.55 10.5 20 10.05 20 9.5C20 8.95 19.55 8.5 19 8.5Z" />
        </svg>
      </button>

      {/* 4. Mascot / Robot Avatar Icon (Tampilan awal: tombol bulat merah marun dengan logo maskot Laras) */}
      <button
        className="stack-btn stack-btn-laras"
        aria-label="Buka Chatbot Laras"
        title="Chat dengan Laras"
        onClick={onOpenChat}
      >
        <img
          src="/assets/laras-avatar.png"
          alt="Chatbot Laras"
          className="stack-laras-icon"
        />
      </button>
    </div>
  );
}
