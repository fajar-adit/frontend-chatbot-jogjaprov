import React from 'react';
import {
  Plus,
  ChevronDown,
  ContactRound,
  ReceiptText,
  Store,
  Heart,
  Megaphone,
  Landmark,
  CircleHelp,
  X,
} from 'lucide-react';
import { LarasAvatar } from './Svgs';
import { categories } from '../data/mockData';

const iconMap = {
  ContactRound,
  ReceiptText,
  Store,
  Heart,
  Megaphone,
  Landmark,
};

export function Sidebar({
  selectedCategory,
  onSelectCategory,
  onNewSession,
  onOpenHelp,
  isHelpActive,
  isOpen,
  onClose,
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`laras-sidebar ${isOpen ? 'is-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="avatar-wrapper">
            <LarasAvatar size={54} />
          </div>
          <div className="brand-info">
            <h2 className="brand-name">Laras</h2>
            <span className="brand-tagline">Layanan Digital Terpadu</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        {/* New Session Button */}
        <div className="sidebar-action-wrap">
          <button className="new-session-btn" onClick={onNewSession}>
            <Plus size={20} strokeWidth={2.6} />
            <span>Sesi Baru</span>
          </button>
        </div>

        {/* Categories Section */}
        <div className="sidebar-categories">
          <div className="categories-header">
            <span>Kategori Layanan DIY</span>
            <ChevronDown size={17} />
          </div>

          <div className="categories-list">
            {categories.map((cat) => {
              const IconComponent = iconMap[cat.iconName] || Megaphone;
              const isSelected = !isHelpActive && selectedCategory?.id === cat.id;

              return (
                <button
                  key={cat.id}
                  className={`category-item ${isSelected ? 'is-active' : ''}`}
                  onClick={() => {
                    onSelectCategory(cat);
                    if (onClose) onClose();
                  }}
                >
                  <IconComponent size={22} className="cat-icon" />
                  <div className="cat-text">
                    <span className="cat-title">{cat.title}</span>
                    <span className="cat-sub">{cat.sub}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Riwayat Konsultasi Link */}
          <button className="history-btn" onClick={onNewSession}>
            Riwayat Konsultasi
          </button>
        </div>

        {/* Bottom Panduan & Bantuan Button */}
        <div className="sidebar-footer">
          <button
            className={`help-nav-btn ${isHelpActive ? 'is-active' : ''}`}
            onClick={() => {
              onOpenHelp();
              if (onClose) onClose();
            }}
          >
            <CircleHelp size={20} strokeWidth={2.4} />
            <span>Panduan &amp; Bantuan</span>
          </button>
        </div>
      </aside>
    </>
  );
}
