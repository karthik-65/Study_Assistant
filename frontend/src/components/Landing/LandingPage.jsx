import React from 'react';
import {
  Brain,
  FileText,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Search,
  MessageSquare,
  Layers,
  GraduationCap
} from 'lucide-react';

export default function LandingPage({ onOpenAuthModal, onContinueAsGuest }) {
  const handleOpenLogin = () => {
    if (onOpenAuthModal) onOpenAuthModal('login');
  };

  const handleOpenRegister = () => {
    if (onOpenAuthModal) onOpenAuthModal('register');
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.18), transparent 70%), var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Background Decorative Ambient Blobs */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '10%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <main style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 1. HERO SECTION */}
        <section style={{
          padding: '4.5rem 1.5rem 3.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Subtle Announcement Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.15)',
            marginBottom: '1.75rem',
            animation: 'fadeIn 0.6s ease-out'
          }}>
            <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
              Next-Gen Academic AI Workspace
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
            maxWidth: '900px',
            marginBottom: '1.5rem',
            color: 'var(--text-primary)'
          }}>
            Master Any Subject Faster with{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Intelligent AI Assistance
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            marginBottom: '2.5rem',
            fontWeight: 500
          }}>
            Transform complex textbooks, lecture slides, research papers, and class notes into
            interactive tutoring sessions, step-by-step problem explanations, and automated mastery quizzes.
          </p>

          {/* Hero CTAs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '3.5rem'
          }}>
            <button
              onClick={handleOpenLogin}
              className="btn-primary"
              style={{
                padding: '0.85rem 1.85rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
                transition: 'all 0.2s ease',
                border: 'none'
              }}
            >
              <span>Log In to Workspace</span>
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>

            <button
              onClick={handleOpenRegister}
              style={{
                padding: '0.85rem 1.75rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)'
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
              <span>Create Account</span>
            </button>

            {onContinueAsGuest && (
              <button
                onClick={onContinueAsGuest}
                style={{
                  padding: '0.85rem 1.75rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.22)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                }}
              >
                <span>Try as Guest</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            )}

            <button
              onClick={scrollToFeatures}
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <span>Explore Features</span>
            </button>
          </div>

          {/* Key Metric Highlights / Trust Badges Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            width: '100%',
            maxWidth: '1050px',
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>Instant Extraction</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>PDF, Word DOCX & Text</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Quiz Creator</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tailored Practice Exams</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>Smart Citations</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Grounded in Your Material</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>Cloud Persistence</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Isolated & Synced History</div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CORE CAPABILITIES (GRID) */}
        <section id="features-section" style={{
          padding: '4rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem'
            }}>
              Engineered Specifically for Deep Academic Learning
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Everything you need to comprehend dense subjects, prepare for competitive exams, and retain knowledge longer.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Feature 1 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '2rem',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                marginBottom: '1.25rem'
              }}>
                <FileText style={{ width: 24, height: 24 }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                Multi-Document Knowledge Base
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                Upload multiple course handouts, textbooks, or research papers at once. StudyAssist extracts the structure, mathematical expressions, and figures for instant querying.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '2rem',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4',
                marginBottom: '1.25rem'
              }}>
                <MessageSquare style={{ width: 24, height: 24 }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                Context-Grounded AI Tutoring
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                Ask tough conceptual questions and receive structured step-by-step explanations with inline LaTeX mathematical equations and precise source citations.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '2rem',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.05) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ec4899',
                marginBottom: '1.25rem'
              }}>
                <Brain style={{ width: 24, height: 24 }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                Automated Practice Quizzes
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                Generate customized multiple-choice quizzes with adjustable question counts directly from your document topics. Includes immediate scoring and detailed rationales.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '2rem',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                marginBottom: '1.25rem'
              }}>
                <Layers style={{ width: 24, height: 24 }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                Organized Multi-Session History
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                Maintain separate chat contexts for each course, chapter, or subject. Automatically titled and persisted securely to your user account for whenever you return.
              </p>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS (3-STEP TIMELINE) */}
        <section style={{
          padding: '4rem 1.5rem',
          maxWidth: '1050px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--accent-primary)'
            }}>
              Simple & Powerful
            </span>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
              marginTop: '0.5rem'
            }}>
              How StudyAssist Powers Your Learning
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
            position: 'relative'
          }}>
            {/* Step 1 */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem 1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '24px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 900,
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)'
              }}>
                1
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                Upload or Start Clean
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Drop in your PDF, Word document, or course syllabus — or jump straight into an open study chat session.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem 1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '24px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 900,
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)'
              }}>
                2
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                Interact & Dissect Concepts
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Ask detailed questions, ask for real-world analogies, or break down proofs step by step with instant AI tutoring.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem 1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '24px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 900,
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)'
              }}>
                3
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                Generate Quizzes & Retain
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Click the Quiz tool to produce randomized test questions with full explanations to cement knowledge before exams.
              </p>
            </div>
          </div>
        </section>

        {/* 4. FINAL CTA BANNER */}
        <section style={{
          padding: '3rem 1.5rem 5rem',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(37, 99, 235, 0.12) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '24px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              Ready to Accelerate Your Academic Journey?
            </h3>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              maxWidth: '580px',
              margin: '0 auto 2rem',
              lineHeight: 1.6
            }}>
              Log in to access your customized study workspace, uploaded documents, and synced revision sessions.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleOpenLogin}
                className="btn-primary"
                style={{
                  padding: '0.85rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.45)',
                  border: 'none'
                }}
              >
                <span>Log In Now</span>
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
              <button
                onClick={handleOpenRegister}
                style={{
                  padding: '0.85rem 1.85rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span>Create Account</span>
              </button>
            </div>
          </div>
        </section>

        {/* 5. MINIMALIST FOOTER */}
        <footer style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>StudyAssist</span>
              <span>— Intelligent Academic Companion</span>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <span onClick={handleOpenLogin} style={{ cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                Log In
              </span>
              <span onClick={handleOpenRegister} style={{ cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                Create Account
              </span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} StudyAssist AI. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
