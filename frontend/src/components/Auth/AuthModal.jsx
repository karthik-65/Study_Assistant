import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, LogIn, UserPlus, AlertCircle, Loader2, User, Lock, Mail } from 'lucide-react';
import { loginUser, registerUser } from '../../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetFormFields = () => {
    setIdentifier('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setErrorMsg('');
  };

  // Sync mode and clear fields when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      resetFormFields();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetFormFields();
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (!identifier.trim()) {
        setErrorMsg('Please enter your username or email address.');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await loginUser({ identifier: identifier.trim(), password });
        if (res.user) {
          resetFormFields();
          onAuthSuccess(res.user);
          onClose();
        }
      } catch (err) {
        setErrorMsg(err.message || 'Log in failed. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!username.trim() || username.trim().length < 3) {
        setErrorMsg('Username must be at least 3 characters long.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await registerUser({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password
        });
        if (res.user) {
          resetFormFields();
          onAuthSuccess(res.user);
          onClose();
        }
      } catch (err) {
        setErrorMsg(err.message || 'Account creation failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetFormFields();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={handleClose}
    >
      {/* Outer Glow Wrapper */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow Aura */}
        <div style={{
          position: 'absolute',
          inset: '-2px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.5) 0%, rgba(56, 189, 248, 0.3) 50%, rgba(129, 140, 248, 0.4) 100%)',
          borderRadius: '24px',
          filter: 'blur(20px)',
          opacity: 0.65,
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Modal Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'var(--bg-secondary)',
            borderRadius: '22px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Top Brand Bar & Close Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 1.75rem 0.5rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.45))'
              }}>
                <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="saClassyGradAuthModal" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5" />
                      <stop offset="0.5" stopColor="#6366F1" />
                      <stop offset="1" stopColor="#2563EB" />
                    </linearGradient>
                    <linearGradient id="saSparkGoldGradAuthModal" x1="14" y1="6" x2="22" y2="18" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FDE047" />
                      <stop offset="1" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                  <rect width="36" height="36" rx="10" fill="url(#saClassyGradAuthModal)" />
                  <rect x="0.5" y="0.5" width="35" height="35" rx="9.5" stroke="rgba(255,255,255,0.25)" />
                  <path d="M8 25C11 23.5 14.5 23.5 17 25.2V13C14.5 11.2 11 11.2 8 12.5V25Z" fill="#ffffff" fillOpacity="0.95" />
                  <path d="M28 25C25 23.5 21.5 23.5 19 25.2V13C21.5 11.2 25 11.2 28 12.5V25Z" fill="#ffffff" fillOpacity="0.95" />
                  <path d="M18 5L19.4 9.6L24 11L19.4 12.4L18 17L16.6 12.4L12 11L16.6 9.6L18 5Z" fill="url(#saSparkGoldGradAuthModal)" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                  Study
                </span>
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.25rem',
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

            <button
              onClick={handleClose}
              className="btn-icon"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Title and Subtitle */}
          <div style={{ padding: '0.5rem 1.75rem 1rem' }}>
            <h2 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.3px',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {mode === 'login' ? 'Log In to StudyAssist' : 'Create Your Account'}
            </h2>
            <p style={{
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              marginTop: '6px',
              marginBottom: 0,
              lineHeight: 1.45
            }}>
              {mode === 'login'
                ? 'Welcome back! Log in to continue your sessions, notes, and study quizzes.'
                : 'Join StudyAssist to upload documents, ask deep questions, and generate tests.'}
            </p>
          </div>


          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{
            padding: '1.25rem 1.75rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem'
          }}>
            {/* Error Message Toast */}
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                fontSize: '0.84rem',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              <>
                {/* Log In: Username or Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Username or Email
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.95rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <User style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. student or student@university.edu"
                      autoFocus
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

                {/* Log In: Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.95rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <Lock style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      spellCheck="false"
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        width: '100%'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        padding: 0
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Create Account: Username */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Username
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.95rem'
                  }}>
                    <User style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a unique username"
                      autoFocus
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

                {/* Create Account: Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.95rem'
                  }}>
                    <Mail style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

                {/* Create Account: Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Password (min. 6 characters)
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.95rem'
                  }}>
                    <Lock style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      spellCheck="false"
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        width: '100%'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                    </button>
                  </div>
                </div>

                {/* Create Account: Confirm Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Confirm Password
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.95rem'
                  }}>
                    <Lock style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      spellCheck="false"
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                borderRadius: '12px',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.45)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                border: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                  <span>{mode === 'login' ? 'Logging In...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  {mode === 'login' ? <LogIn style={{ width: 18, height: 18 }} /> : <UserPlus style={{ width: 18, height: 18 }} />}
                  <span>{mode === 'login' ? 'Log In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation Switch */}
          <div style={{
            padding: '1rem 1.75rem',
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '0.84rem',
            color: 'var(--text-secondary)'
          }}>
            {mode === 'login' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: '4px',
                    fontSize: '0.84rem'
                  }}
                >
                  Create Account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: '4px',
                    fontSize: '0.84rem'
                  }}
                >
                  Log In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
