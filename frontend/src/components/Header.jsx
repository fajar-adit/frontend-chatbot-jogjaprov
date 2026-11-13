import React from 'react';
import { Globe, ArrowRight, ChevronDown, Menu, Sun } from 'lucide-react';
import { JogjaCrest } from './Svgs';

export function Header({
  portal = false,
  title = 'Layanan Aspirasi & Pengaduan',
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  onToggleSidebar,
}) {
  return (
    <header className={portal ? 'portal-header' : 'chat-header'}>
      {/* Mobile Menu Button for Chat */}
      {!portal && onToggleSidebar && (
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Brand on Portal */}
      {portal ? (
        <div className="portal-brand">
          <JogjaCrest size={38} className="portal-crest" />
          <div className="portal-brand-text">
            <span className="brand-line-1">PORTAL PEMERINTAH DAERAH</span>
            <span className="brand-line-2">DAERAH ISTIMEWA YOGYAKARTA</span>
          </div>
        </div>
      ) : (
        <h1 className="chat-header-title">{title}</h1>
      )}

      {/* Portal Center Navigation */}
      {portal && (
        <nav className="portal-nav" aria-label="Navigasi Utama">
          <a href="#beranda" className="nav-item active">
            Beranda
            <span className="nav-indicator" />
          </a>
          <a href="#profil" className="nav-item">
            Profil <ChevronDown size={14} className="dropdown-chevron" />
          </a>
          <a href="#ppid" className="nav-item">
            PPID <ChevronDown size={14} className="dropdown-chevron" />
          </a>
          <a href="#informasi" className="nav-item">
            Informasi dan Berita <ChevronDown size={14} className="dropdown-chevron" />
          </a>
          <a href="#layanan" className="nav-item">
            Layanan Publik <ChevronDown size={14} className="dropdown-chevron" />
          </a>
        </nav>
      )}

      {/* Right Action Controls */}
      <div className="header-actions">
        {/* Visual Pill Dark Mode Switch (matches screenshot toggle design) */}
        <button
          type="button"
          className={`theme-toggle-pill ${darkMode ? 'is-dark' : ''}`}
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
          title="Toggle tema gelap/terang"
        >
          <span className="toggle-track">
            <span className="toggle-thumb">
              {darkMode ? (
                <Sun size={16} strokeWidth={2.2} fill="currentColor" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
          </span>
        </button>

        {/* Language Switcher */}
        <button
          type="button"
          className="lang-pill"
          onClick={() => setLanguage(language === 'EN' ? 'ID' : 'EN')}
          aria-label="Pilih Bahasa"
        >
          <Globe size={15} className="lang-icon" />
          <span>{language}</span>
        </button>

        {/* Login Button */}
        <button type="button" className="login-btn" aria-label="Masuk ke portal">
          <span>Login</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </header>
  );
}
