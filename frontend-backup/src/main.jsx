import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PortalHome } from './components/PortalHome';
import { ChatLayout } from './components/ChatLayout';
import './styles.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('laras_dark') === 'true';
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('laras_lang') || 'EN';
  });

  useEffect(() => {
    localStorage.setItem('laras_dark', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('laras_lang', language);
  }, [language]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PortalHome
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              language={language}
              setLanguage={setLanguage}
            />
          }
        />
        <Route
          path="/chatbot"
          element={
            <ChatLayout
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              language={language}
              setLanguage={setLanguage}
            />
          }
        />
        <Route
          path="/panduan"
          element={
            <ChatLayout
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              language={language}
              setLanguage={setLanguage}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
