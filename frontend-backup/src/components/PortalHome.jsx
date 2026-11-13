import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Search, ExternalLink, Info } from 'lucide-react';
import { Header } from './Header';
import { HeroBanner, FloatingActionStack } from './HeroBanner';
import { OgpBadge } from './Svgs';
import { weatherForecast } from '../data/mockData';

export function PortalHome({ darkMode, setDarkMode, language, setLanguage }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/chatbot?query=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/chatbot');
    }
  };

  return (
    <div className="portal-page-container">
      {/* Top Header */}
      <Header
        portal={true}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Announcement Running Strip */}
      <div className="announcement-strip">
        <div className="announcement-content">
          <Megaphone size={16} className="announcement-icon" />
          <span>Temukan layanan publik dari PEMDA D.I. Yogyakarta</span>
        </div>
      </div>

      <main className="portal-content-body">
        {/* Weather Forecast Banner (Maroon) */}
        <section className="weather-bar" aria-label="Informasi Cuaca Yogyakarta">
          <div className="weather-location-now">
            <span className="location-name">Yogyakarta</span>
            <div className="current-temp-block">
              <span className="current-weather-icon" aria-hidden="true">⛅</span>
              <span className="current-temp">26°C</span>
            </div>
          </div>

          <div className="forecast-divider" />

          {/* 7-day forecast cards */}
          <div className="forecast-days-list">
            {weatherForecast.map((item, index) => (
              <div className="forecast-col" key={index}>
                <span className="forecast-day">{item.day}</span>
                <span className="forecast-icon">{item.icon}</span>
                <span className="forecast-temp-max">{item.tempMax}</span>
                <span className="forecast-temp-min">{item.tempMin}</span>
              </div>
            ))}
          </div>

          <button className="weather-info-btn" aria-label="Informasi sumber BMKG">
            <Info size={16} />
          </button>
        </section>

        {/* Hero Section */}
        <section className="portal-hero-grid">
          {/* Left Hero Column */}
          <div className="hero-left-column">
            <h1 className="hero-main-title">
              <span className="title-black">Public</span>
              <span className="title-red">Services</span>
            </h1>

            <div className="hero-welcome-text">
              <p className="welcome-salutation">Welcome,</p>
              <p className="welcome-desc">
                Access public services easily to fulfill the needs of the Yogyakarta community.
              </p>
            </div>

            {/* Portal Tag & OGP Local Badge Row */}
            <div className="portal-badge-row">
              <button
                type="button"
                className="public-service-pill"
                onClick={() => navigate('/chatbot')}
              >
                PUBLIC SERVICE PORTAL
              </button>
              <OgpBadge />
            </div>

            {/* Search Input Bar */}
            <form className="hero-search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search services here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari layanan publik"
              />
              <button type="submit" className="search-submit-btn" aria-label="Cari">
                <Search size={18} />
              </button>
            </form>

            {/* Popular Services Section */}
            <div className="popular-services-section">
              <span className="popular-heading">Popular Services</span>
              <div className="popular-pills-row">
                <button
                  type="button"
                  className="popular-pill"
                  onClick={() => navigate('/chatbot?query=Gunungkidul Raharja')}
                >
                  <span>Gunungkidul Raharja</span>
                  <ExternalLink size={13} className="pill-ext-icon" />
                </button>
                <button
                  type="button"
                  className="popular-pill"
                  onClick={() => navigate('/chatbot?query=Profil Pemimpin Daerah')}
                >
                  <span>Profil Pemimpin Daerah</span>
                  <ExternalLink size={13} className="pill-ext-icon" />
                </button>
                <button
                  type="button"
                  className="popular-pill"
                  onClick={() => navigate('/chatbot?query=Jadwal Samsat keliling')}
                >
                  <span>Jadwal Samsat Keliling</span>
                  <ExternalLink size={13} className="pill-ext-icon" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Independence / Officials Banner */}
          <div className="hero-right-column">
            <HeroBanner />
          </div>
        </section>
      </main>

      {/* Floating Action Buttons on Right Edge */}
      <FloatingActionStack onOpenChat={() => navigate('/chatbot')} />
    </div>
  );
}
