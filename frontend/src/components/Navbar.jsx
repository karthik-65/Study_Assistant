import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Brain, Home, LogIn, LogOut, UserPlus } from 'lucide-react';

export default function Navbar({
  theme,
  setTheme,
  activeView = 'chat',
  setActiveView,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onReturnToHome
}) {
  const [isNavIconHovered, setIsNavIconHovered] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="glass-panel" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 10,
      flexShrink: 0,
      overscrollBehavior: 'none',
      userSelect: 'none',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          onClick={() => {
            if (onReturnToHome) onReturnToHome();
            if (setActiveView) setActiveView('chat');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          title="Return to Home"
        >
          {/* Classy StudyAssist Brand Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.45))'
          }}>
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="saClassyGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F46E5" />
                  <stop offset="0.5" stopColor="#6366F1" />
                  <stop offset="1" stopColor="#2563EB" />
                </linearGradient>
                <linearGradient id="saSparkGoldGrad" x1="14" y1="6" x2="22" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FDE047" />
                  <stop offset="1" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="10" fill="url(#saClassyGrad)" />
              <rect x="0.5" y="0.5" width="35" height="35" rx="9.5" stroke="rgba(255,255,255,0.25)" />
              <path d="M8 25C11 23.5 14.5 23.5 17 25.2V13C14.5 11.2 11 11.2 8 12.5V25Z" fill="#ffffff" fillOpacity="0.95" />
              <path d="M28 25C25 23.5 21.5 23.5 19 25.2V13C21.5 11.2 25 11.2 28 12.5V25Z" fill="#ffffff" fillOpacity="0.95" />
              <path d="M18 5L19.4 9.6L24 11L19.4 12.4L18 17L16.6 12.4L12 11L16.6 9.6L18 5Z" fill="url(#saSparkGoldGrad)" />
            </svg>
          </div>

          {/* Classy StudyAssist Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)'
            }}>
              Study
            </span>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Assist
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Dynamic View Toggle Button (Quiz / Chat Icon) */}
        {setActiveView && (
          <button
            className="btn-icon"
            onClick={() => setActiveView(activeView === 'quiz' ? 'chat' : 'quiz')}
            onMouseEnter={() => setIsNavIconHovered(true)}
            onMouseLeave={() => setIsNavIconHovered(false)}
            title={activeView === 'quiz' ? "Return to Home" : "AI Quiz Generator"}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid ' + ((activeView === 'quiz' || isNavIconHovered) ? 'var(--accent-primary)' : 'var(--border-color)'),
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            {activeView === 'quiz' ? (
              <Home style={{
                width: 18,
                height: 18,
                color: isNavIconHovered ? 'var(--accent-primary)' : 'var(--text-primary)',
                transition: 'color 0.2s ease'
              }} />
            ) : (
              <Brain style={{
                width: 18,
                height: 18,
                color: isNavIconHovered ? 'var(--accent-primary)' : 'var(--text-primary)',
                transition: 'color 0.2s ease'
              }} />
            )}
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          className="btn-icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Light/Dark Theme"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'dark' ? <Sun style={{ width: 18, height: 18, color: '#f59e0b' }} /> : <Moon style={{ width: 18, height: 18 }} />}
        </button>

        {/* Auth State Button / User Profile */}
        {currentUser ? (
          <div ref={userMenuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '4px 12px 4px 6px',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                {(currentUser.username || currentUser.email || 'U')[0]}
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentUser.username || currentUser.email}
              </span>
            </div>

            {/* Logout / User dropdown */}
            {isUserMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: '140px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                  padding: '4px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut style={{ width: 16, height: 16 }} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)'
              }}
            >
              <LogIn style={{ width: 15, height: 15 }} />
              <span>Log In</span>
            </button>
            <button
              onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 0.95rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--bg-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <UserPlus style={{ width: 15, height: 15 }} />
              <span>Create Account</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
