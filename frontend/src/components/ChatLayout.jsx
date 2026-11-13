import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Paperclip,
  Send,
  CircleHelp,
  CheckCircle2,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { JogjaWatermark, LarasAvatar } from './Svgs';
import { categories, quickQuestions, faqList } from '../data/mockData';
import { sendLarasMessage } from '../services/chatApi';

// Render Markdown-style links and plain HTTP(S) URLs as safe clickable links.
// Model HTML is never injected into the page.
function renderAnswerInline(text) {
  const input = String(text ?? '');
  const tokenPattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]+)/gi;
  const nodes = [];
  let cursor = 0;
  let match;
  let index = 0;

  while ((match = tokenPattern.exec(input)) !== null) {
    if (match.index > cursor) nodes.push(input.slice(cursor, match.index));
    const [full, boldText, linkLabel, markdownUrl, plainUrl] = match;
    if (boldText !== undefined) {
      nodes.push(<strong key={`answer-token-${index++}`}>{boldText}</strong>);
    } else {
      const rawUrl = (markdownUrl || plainUrl || '').replace(/[.,;!?]+$/, '');
      let safeUrl = '';
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') safeUrl = parsed.href;
      } catch { safeUrl = ''; }
      if (safeUrl) {
        nodes.push(
          <a key={`answer-token-${index++}`} href={safeUrl} target="_blank"
             rel="noopener noreferrer nofollow">
            {linkLabel || rawUrl}
          </a>
        );
      } else {
        nodes.push(full);
      }
    }
    cursor = tokenPattern.lastIndex;
  }
  if (cursor < input.length) nodes.push(input.slice(cursor));
  return nodes;
}

function AnswerText({ text }) {
  const lines = String(text ?? '').split('\n');
  return (
    <p className="bubble-answer">
      {lines.map((line, index) => (
        <React.Fragment key={`answer-line-${index}`}>
          {renderAnswerInline(line)}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  );
}

export function ChatLayout({ darkMode, setDarkMode, language, setLanguage }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Find if we are in Panduan & Bantuan
  const isHelpRoute = location.pathname === '/panduan';

  // Selected Category (defaults to 'Aspirasi & Pengaduan' as shown in Screenshot 3)
  const defaultCategory =
    categories.find((c) => c.id === 'aspirasi') || categories[0];
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [categoryExplicitlySelected, setCategoryExplicitlySelected] = useState(false);

  // Active tab inside Panduan & Bantuan ('Cara Penggunaan' | 'FAQ' | 'Privasi')
  const [activeHelpTab, setActiveHelpTab] = useState('Cara Penggunaan');

  // Chat state
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('laras_session_id') || '');
  const [isTyping, setIsTyping] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Handle URL query parameters if coming from search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('query');
    if (q) {
      handleSendMessage(q);
      // Clean query from url
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setCategoryExplicitlySelected(true);
    if (isHelpRoute) {
      navigate('/chatbot');
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setInputText('');
    setSessionId('');
    sessionStorage.removeItem('laras_session_id');
    setSelectedCategory(defaultCategory);
    setCategoryExplicitlySelected(false);
    if (isHelpRoute) {
      navigate('/chatbot');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await sendLarasMessage({
        question: query,
        sessionId,
        category: categoryExplicitlySelected ? (selectedCategory?.title || '') : '',
      });

      if (result.sessionId && result.sessionId !== sessionId) {
        setSessionId(result.sessionId);
        sessionStorage.setItem('laras_session_id', result.sessionId);
      }

      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: result.answer,
        sources: result.sources,
        showDataDisclaimer: true,
        time: new Date(),
      }]);
    } catch (error) {
      console.error('Laras API error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        isError: true,
        text: error?.message || 'Maaf, Laras belum dapat terhubung ke layanan AI. Pastikan backend Golang aktif dan endpoint /api/chat tersedia.',
        time: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Header Title
  const headerTitle = isHelpRoute
    ? 'Panduan & Bantuan'
    : selectedCategory?.title || 'Layanan Aspirasi & Pengaduan';

  return (
    <div className="chat-app-container">
      {/* Left Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onNewSession={handleNewSession}
        onOpenHelp={() => navigate('/panduan')}
        isHelpActive={isHelpRoute}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="chat-main-wrapper">
        {/* Top Header */}
        <Header
          portal={false}
          title={headerTitle}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          language={language}
          setLanguage={setLanguage}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Content Pane with Landmark Watermark Background */}
        <div className="chat-content-pane">
          {/* Subtle Silhouette Watermark (Tugu + Merapi + Kraton Joglo) */}
          <JogjaWatermark />

          {/* SCREEN A: PANDUAN & BANTUAN (Matches Image 2 & 4) */}
          {isHelpRoute ? (
            <div className="help-view-container">
              <div className="help-card-panel">
                {/* Panel Header */}
                <div className="help-panel-heading">
                  <div className="help-icon-circle">
                    <CircleHelp size={22} className="help-icon" />
                  </div>
                  <div className="help-heading-text">
                    <h2 className="help-title">Panduan &amp; Bantuan</h2>
                    <span className="help-sub">Layanan Digital Terpadu DIY</span>
                  </div>
                </div>

                {/* Intro Paragraph */}
                <p className="help-greeting-para">
                  Halo! Ada yang bisa kami bantu?
                  <br />
                  Pelajari cara menggunakan Laras untuk mendapatkan informasi seputar layanan publik Daerah Istimewa Yogyakarta.
                </p>

                {/* 3 Pills Tabs */}
                <div className="help-tab-pills" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeHelpTab === 'Cara Penggunaan'}
                    className={`help-tab-btn ${
                      activeHelpTab === 'Cara Penggunaan' ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveHelpTab('Cara Penggunaan')}
                  >
                    Cara Penggunaan
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeHelpTab === 'FAQ'}
                    className={`help-tab-btn ${
                      activeHelpTab === 'FAQ' ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveHelpTab('FAQ')}
                  >
                    FAQ
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeHelpTab === 'Privasi'}
                    className={`help-tab-btn ${
                      activeHelpTab === 'Privasi' ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveHelpTab('Privasi')}
                  >
                    Privasi
                  </button>
                </div>

                {/* TAB 1: CARA PENGGUNAAN (Matches Image 2) */}
                {activeHelpTab === 'Cara Penggunaan' && (
                  <div className="help-tab-content">
                    <h3 className="section-subheading">Mulai menggunakan chatbot</h3>
                    <ul className="help-checklist">
                      <li className="check-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <span>Pilih kategori layanan atau langsung tuliskan pertanyaan.</span>
                      </li>
                      <li className="check-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <span>Gunakan pertanyaan yang jelas dan spesifik.</span>
                      </li>
                      <li className="check-item">
                        <CheckCircle2 size={20} className="check-icon" />
                        <span>Periksa sumber resmi yang disertakan pada jawaban.</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* TAB 2: FAQ */}
                {activeHelpTab === 'FAQ' && (
                  <div className="help-tab-content">
                    <h3 className="section-subheading">Pertanyaan yang Sering Diajukan</h3>
                    <div className="faq-accordion-list">
                      {faqList.map((faq, idx) => (
                        <details className="faq-item" key={idx}>
                          <summary className="faq-question">
                            <span>{faq.q}</span>
                            <ChevronRight size={18} className="chevron" />
                          </summary>
                          <p className="faq-answer">{faq.a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: PRIVASI (Matches Image 4) */}
                {activeHelpTab === 'Privasi' && (
                  <div className="help-tab-content">
                    <h3 className="section-subheading">Gunakan Laras dengan aman</h3>
                    <p className="privacy-body-text">
                      Hindari memasukkan kata sandi, kode OTP, atau data pribadi yang tidak diperlukan. Informasi mengenai penyimpanan, pemrosesan, dan penghapusan percakapan harus mengikuti kebijakan privasi resmi layanan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SCREEN B: CHATBOT WELCOME & CONVERSATION (Matches Image 3) */
            <div className="chat-interactive-view">
              {messages.length === 0 ? (
                /* Empty / Welcome State (Image 3) */
                <div className="chat-welcome-container">
                  <div className="welcome-texts">
                    <h2 className="welcome-headline">Halo, Warga Jogja!</h2>
                    <p className="welcome-sub1">
                      Selamat datang di Laras - Layanan Digital Terpadu.
                    </p>
                    <p className="welcome-sub2">
                      Mulai percakapan untuk mendapatkan informasi seputar layanan publik dan administrasi daerah.
                    </p>
                  </div>

                  {/* Quick Prompts Section */}
                  <div className="quick-suggestions-box">
                    <span className="coba-tanya-label">COBA TANYA INI:</span>
                    <div className="quick-pill-grid">
                      {quickQuestions.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="quick-prompt-pill"
                          onClick={() => handleSendMessage(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Message Stream */
                <div className="messages-stream">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-bubble-row ${
                        msg.sender === 'user' ? 'is-user' : 'is-bot'
                      }`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="bot-avatar-thumb">
                          <LarasAvatar size={34} />
                        </div>
                      )}
                      <div className={`bubble-content ${msg.isError ? 'bubble-error' : ''}`}>
                        <AnswerText text={msg.text} />
                        {msg.sender === 'bot' && msg.sources?.length > 0 && (
                          <div className="chat-sources">
                            <strong>Sumber informasi</strong>
                            <ul>
                              {msg.sources.map((source, index) => (
                                <li key={source.id || `${msg.id}-source-${index}`}>
                                  {source.url ? (
                                    <a href={source.url} target="_blank" rel="noopener noreferrer nofollow">
                                      {source.title || source.url}
                                    </a>
                                  ) : (
                                    <span>{source.title || 'Referensi knowledge base'}</span>
                                  )}
                                  {source.unverified && (
                                    <span className="verification-pill">Belum terverifikasi / perlu ditinjau</span>
                                  )}
                                  {source.excerpt && (
                                    <small>{source.excerpt.slice(0, 260)}{source.excerpt.length > 260 ? '…' : ''}</small>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {msg.showDataDisclaimer && (
                          <div className="chat-data-disclaimer">
                            Catatan: dataset mencakup sebagian informasi yang belum terverifikasi. Periksa sumber dan konfirmasikan ke instansi terkait sebelum menindaklanjuti.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="chat-bubble-row is-bot">
                      <div className="bot-avatar-thumb">
                        <LarasAvatar size={34} />
                      </div>
                      <div className="bubble-content typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Bottom Chat Input Capsule (Matches Image 3) */}
              <div className="chat-input-bar-container">
                <form className="chat-input-pill" onSubmit={handleInputSubmit}>
                  {/* Paperclip attachment button */}
                  <button
                    type="button"
                    className="attach-btn"
                    aria-label="Lampirkan berkas dokumen"
                    title="Lampirkan berkas"
                  >
                    <Paperclip size={22} className="attach-icon" />
                  </button>

                  {/* Input field */}
                  <input
                    type="text"
                    className="chat-text-input"
                    placeholder="Tanya apa saja seputar Jogja..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    aria-label="Tulis pertanyaan seputar Jogja"
                  />

                  {/* Send Button (Red circle with paper plane) */}
                  <button
                    type="submit"
                    className="send-circle-btn"
                    aria-label="Kirim pertanyaan"
                    title="Kirim"
                    disabled={!inputText.trim() || isTyping}
                  >
                    <Send size={18} className="send-icon" fill="currentColor" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
