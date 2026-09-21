import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  FileText,
  BookOpen,
  Brain,
  X
} from 'lucide-react';
import { generateQuizAPI, fetchDocuments } from '../../services/api';

export default function QuizView({ documents = [], onReturnToChat }) {
  const [docList, setDocList] = useState(documents);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');
  const [timerOption, setTimerOption] = useState(600); // 600s = 10 mins (0 = no timer)
  const [docSearchQuery, setDocSearchQuery] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  
  const [quizData, setQuizData] = useState(null);
  const [quizState, setQuizState] = useState('setup'); // 'setup' | 'taking' | 'review'
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const setupScrollRef = useRef(null);

  const handleDocListWheel = (e) => {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 2;
    const isAtTop = el.scrollTop <= 0;

    if ((isAtBottom && e.deltaY > 0) || (isAtTop && e.deltaY < 0)) {
      if (setupScrollRef.current) {
        setupScrollRef.current.scrollTop += e.deltaY;
      }
    }
  };

  // Load documents if empty
  useEffect(() => {
    async function loadDocs() {
      if (!documents || documents.length === 0) {
        const docs = await fetchDocuments();
        setDocList(docs);
        if (docs.length > 0 && !selectedDoc) {
          setSelectedDoc(docs[0]);
        }
      } else {
        setDocList(documents);
        if (documents.length > 0 && !selectedDoc) {
          setSelectedDoc(documents[0]);
        }
      }
    }
    loadDocs();
  }, [documents]);

  // Countdown timer logic
  useEffect(() => {
    let timer = null;
    if (quizState === 'taking' && timerOption > 0 && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setQuizState('review');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizState, timerOption, timeRemaining]);

  const handleStartGeneration = async () => {
    let targetDoc = selectedDoc;
    if (!targetDoc && quizData && quizData.filename) {
      targetDoc = docList.find(d => (d.title === quizData.filename || d.doc_id === quizData.filename)) || { title: quizData.filename };
      setSelectedDoc(targetDoc);
    }
    if (!targetDoc) return;
    const docName = targetDoc.title || targetDoc.doc_id;
    
    setIsGenerating(true);
    setGenerationError('');
    
    try {
      const res = await generateQuizAPI({
        filename: docName,
        numQuestions: numQuestions,
        difficulty: difficulty
      });

      if (res && res.status === 'success' && res.questions && res.questions.length > 0) {
        setQuizData(res);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setTimeRemaining(timerOption);
        setQuizState('taking');
      } else {
        setGenerationError(res.message || 'Could not generate quiz from this document. Please ensure Python backend is running.');
      }
    } catch (err) {
      console.error(err);
      setGenerationError('Failed to connect to backend server for quiz generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const formatTimer = (seconds) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    if (!quizData || !quizData.questions) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quizData.questions.forEach(q => {
      if (userAnswers[q.id] === q.correct_answer) {
        correct += 1;
      }
    });
    const total = quizData.questions.length;
    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  };

  // RENDER: SETUP / SETUP CONFIGURATION SCREEN
  if (quizState === 'setup') {
    return (
      <div
        ref={setupScrollRef}
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          overflowY: 'auto',
          overscrollBehavior: 'auto',
          padding: '2rem 3rem'
        }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          {/* Header Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}>
                  <Brain style={{ width: 20, height: 20, color: '#fff' }} />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                  AI Quiz Generator
                </h1>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Select an uploaded study document and customize quiz parameters to test your knowledge with AI-generated questions.
              </p>
            </div>

            {onReturnToChat && (
              <button
                className="btn-secondary"
                onClick={onReturnToChat}
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Home style={{ width: 16, height: 16 }} />
                <span>Return to Home</span>
              </button>
            )}
          </div>

          {/* Document Selection Section */}
          <div style={{ marginBottom: '2.2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '0.85rem'
            }}>
              <h2 style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem'
              }}>
                <FileText style={{ width: 18, height: 18, color: 'var(--accent-primary)' }} />
                <span>1. Choose Document</span>
                {docList.length > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    ({docList.length})
                  </span>
                )}
              </h2>

              {/* Search bar beside Choose Document */}
              {docList.length > 0 && (
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '220px',
                  maxWidth: '320px',
                  flex: '1 1 220px'
                }}>
                  <Search style={{
                    position: 'absolute',
                    left: '10px',
                    width: 14,
                    height: 14,
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    style={{
                      width: '100%',
                      padding: '0.45rem 1.8rem 0.45rem 2rem',
                      fontSize: '0.82rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {docSearchQuery && (
                    <button
                      onClick={() => setDocSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px'
                      }}
                      title="Clear search"
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {docList.length === 0 ? (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1.5px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '2.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <FileText style={{ width: 36, height: 36, margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  No Documents Uploaded Yet
                </h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                  Please upload a PDF or text document in the Document Sidebar to start generating quizzes!
                </p>
              </div>
            ) : (() => {
              const filteredDocs = docList.filter(doc => {
                const query = docSearchQuery.trim().toLowerCase();
                if (!query) return true;
                const title = (doc.title || doc.filename || doc.doc_id || '').toLowerCase();
                const subject = (doc.subject || '').toLowerCase();
                return title.includes(query) || subject.includes(query);
              });

              if (filteredDocs.length === 0) {
                return (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.8rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <p style={{ fontSize: '0.88rem', marginBottom: '0.6rem' }}>
                      No documents found matching "{docSearchQuery}"
                    </p>
                    <button
                      className="btn-secondary"
                      onClick={() => setDocSearchQuery('')}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', margin: '0 auto' }}
                    >
                      Clear Search
                    </button>
                  </div>
                );
              }

              return (
                <div
                  onWheel={handleDocListWheel}
                  style={{
                    maxHeight: '286px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                    overscrollBehavior: 'auto'
                  }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {filteredDocs.map((doc) => {
                      const isSelected = selectedDoc && (selectedDoc.title === doc.title || selectedDoc.doc_id === doc.doc_id);
                      return (
                        <div
                          key={doc.title || doc.doc_id}
                          onClick={() => setSelectedDoc(doc)}
                          style={{
                            background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                            border: '2px solid ' + (isSelected ? 'var(--accent-primary)' : 'var(--border-color)'),
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.3)' : 'none',
                            position: 'relative',
                            height: '84px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: 30,
                              height: 30,
                              borderRadius: '8px',
                              background: isSelected ? 'var(--accent-gradient)' : 'rgba(99, 102, 241, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSelected ? '#fff' : 'var(--accent-primary)',
                              flexShrink: 0
                            }}>
                              <FileText style={{ width: 16, height: 16 }} />
                            </div>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {doc.title || doc.filename || doc.doc_id}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            <span>{doc.totalPages || 1} Pages • {doc.chunks_count || 4} Chunks</span>
                            {isSelected && (
                              <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                                <Check style={{ width: 11, height: 11, marginRight: 2 }} /> Selected
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quiz Options Configuration Panel */}
          {selectedDoc && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: '2.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <Sliders style={{ width: 19, height: 19, color: 'var(--accent-primary)' }} />
                <span>2. Customize Quiz Parameters</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
                {/* 1. Number of Questions */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                    Number of Questions:
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {[5, 10, 15, 20].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNumQuestions(count)}
                        style={{
                          padding: '0.55rem 1.25rem',
                          borderRadius: '20px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: numQuestions === count ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: numQuestions === count ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                          color: numQuestions === count ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {count} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Difficulty Level */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                    Difficulty Level:
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {['Easy', 'Medium', 'Hard', 'Mix'].map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        style={{
                          padding: '0.55rem 1.25rem',
                          borderRadius: '20px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: difficulty === diff ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: difficulty === diff ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                          color: difficulty === diff ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {diff === 'Mix' ? 'Balanced Mix' : diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Timer Duration */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                    Timer Option:
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'No Timer', value: 0 },
                      { label: '5 Minutes', value: 300 },
                      { label: '10 Minutes', value: 600 },
                      { label: '15 Minutes', value: 900 },
                      { label: '20 Minutes', value: 1200 }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTimerOption(opt.value)}
                        style={{
                          padding: '0.55rem 1.25rem',
                          borderRadius: '20px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: timerOption === opt.value ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: timerOption === opt.value ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                          color: timerOption === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Banner */}
                {generationError && (
                  <div style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger)',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
                    <span>{generationError}</span>
                  </div>
                )}

                {/* Action Submit Button */}
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    className="btn-primary"
                    onClick={handleStartGeneration}
                    disabled={isGenerating || !selectedDoc}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '0.85rem 1.5rem',
                      fontSize: '1.02rem',
                      fontWeight: 800,
                      borderRadius: '30px',
                      background: isGenerating
                        ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #8b5cf6 100%)'
                        : 'var(--accent-gradient)',
                      boxShadow: isGenerating
                        ? '0 0 25px rgba(99, 102, 241, 0.75), inset 0 0 10px rgba(255, 255, 255, 0.2)'
                        : '0 8px 25px rgba(79, 70, 229, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      opacity: !selectedDoc ? 0.6 : 1,
                      cursor: isGenerating ? 'wait' : (!selectedDoc ? 'not-allowed' : 'pointer'),
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isGenerating && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '50%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
                          animation: 'cyber-wave 1.4s ease-in-out infinite'
                        }}
                      />
                    )}
                    {isGenerating ? (
                      <>
                        <Sparkles style={{ width: 20, height: 20, color: '#fde047', animation: 'spin-glow 1.5s linear infinite', flexShrink: 0 }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          Generating MCQ Quiz with Gemini AI
                          <span style={{ animation: 'typing-bounce 1.4s infinite ease-in-out', display: 'inline-block' }}>.</span>
                          <span style={{ animation: 'typing-bounce 1.4s infinite ease-in-out 0.2s', display: 'inline-block' }}>.</span>
                          <span style={{ animation: 'typing-bounce 1.4s infinite ease-in-out 0.4s', display: 'inline-block' }}>.</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles style={{ width: 20, height: 20 }} />
                        <span>Generate Quiz ({numQuestions} Questions)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER: INTERACTIVE QUIZ TAKING SCREEN
  if (quizState === 'taking' && quizData && quizData.questions) {
    const currentQ = quizData.questions[currentQuestionIndex];
    const totalQ = quizData.questions.length;
    const isLastQuestion = currentQuestionIndex === totalQ - 1;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        overflow: 'hidden'
      }}>
        {/* Quiz Header Bar */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
              {quizData.filename}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Question {currentQuestionIndex + 1} of {totalQ}
            </span>
          </div>

          {/* Countdown Timer Display */}
          {timerOption > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              background: timeRemaining < 60 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.12)',
              border: '1.5px solid ' + (timeRemaining < 60 ? 'var(--danger)' : 'var(--accent-primary)'),
              color: timeRemaining < 60 ? 'var(--danger)' : 'var(--text-primary)',
              fontWeight: 800,
              fontSize: '0.92rem',
              boxShadow: timeRemaining < 60 ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
            }}>
              <Clock style={{ width: 16, height: 16, color: timeRemaining < 60 ? 'var(--danger)' : 'var(--accent-primary)' }} />
              <span>{formatTimer(timeRemaining)}</span>
            </div>
          )}

          <button
            className="btn-secondary"
            onClick={() => setShowExitModal(true)}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            Exit Quiz
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            width: `${((currentQuestionIndex + 1) / totalQ) * 100}%`,
            background: 'var(--accent-gradient)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Main Question Body Container */}
        <div style={{
          flex: 1,
          padding: '2.5rem 2rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ maxWidth: '760px', width: '100%' }}>
            {/* Question Box */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                Question {currentQuestionIndex + 1}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
                {currentQ.question}
              </h2>

              {/* 4 Options Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {currentQ.options && currentQ.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                  const isSelected = userAnswers[currentQ.id] === opt;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-card)',
                        border: '2px solid ' + (isSelected ? 'var(--accent-primary)' : 'var(--border-color)'),
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.9rem',
                        boxShadow: isSelected ? '0 4px 14px rgba(99, 102, 241, 0.25)' : 'none'
                      }}
                    >
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: isSelected ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.06)',
                        border: isSelected ? 'none' : '1px solid var(--border-color)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {letter}
                      </div>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: isSelected ? 700 : 500 }}>
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                className="btn-secondary"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 600, opacity: currentQuestionIndex === 0 ? 0.4 : 1 }}
              >
                <ArrowLeft style={{ width: 16, height: 16, marginRight: 4 }} />
                Previous
              </button>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {answeredCount} of {totalQ} Answered
              </div>

              {isLastQuestion ? (
                <button
                  className="btn-primary"
                  onClick={() => setQuizState('review')}
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  <span>Submit Quiz</span>
                  <Check style={{ width: 16, height: 16, marginLeft: 4 }} />
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQ - 1, prev + 1))}
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  Next
                  <ArrowRight style={{ width: 16, height: 16, marginLeft: 4 }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Exit Quiz Confirmation Modal */}
        {showExitModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowExitModal(false);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.15)',
              textAlign: 'center',
              animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}>
              {/* Alert icon badge */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--danger)'
              }}>
                <AlertTriangle style={{ width: 28, height: 28 }} />
              </div>

              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                fontFamily: "'Outfit', sans-serif"
              }}>
                Exit Quiz?
              </h3>

              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: '1.5rem'
              }}>
                Are you sure you want to exit? Your quiz answers and current progress ({answeredCount} of {totalQ} completed) will not be saved.
              </p>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowExitModal(false)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    borderRadius: '12px'
                  }}
                >
                  Resume Quiz
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    setQuizState('setup');
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Yes, Exit Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER: QUIZ SCORE & DETAILED REVIEW SCREEN
  if (quizState === 'review' && quizData) {
    const { correct, total, percentage } = calculateScore();

    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: '2.5rem 2rem'
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
          {/* Celebratory Hero Score Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1.5px solid var(--accent-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 12px 35px rgba(79, 70, 229, 0.3)',
            marginBottom: '2.5rem'
          }}>
            <div style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              margin: '0 auto 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '2rem',
              fontWeight: 900,
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45)'
            }}>
              {percentage}%
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {percentage >= 80 ? '🏆 Outstanding Performance!' : (percentage >= 60 ? '👍 Great Effort!' : '📚 Keep Studying!')}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You answered <strong style={{ color: 'var(--text-primary)' }}>{correct}</strong> out of <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> questions correctly on <strong style={{ color: 'var(--accent-primary)' }}>{quizData.filename}</strong>.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={handleStartGeneration}
                disabled={isGenerating}
                style={{
                  padding: '0.7rem 1.45rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '30px',
                  background: isGenerating
                    ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #8b5cf6 100%)'
                    : 'var(--accent-gradient)',
                  boxShadow: isGenerating
                    ? '0 0 25px rgba(99, 102, 241, 0.75), inset 0 0 10px rgba(255, 255, 255, 0.2)'
                    : '0 8px 25px rgba(79, 70, 229, 0.45)',
                  cursor: isGenerating ? 'wait' : 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Subtle animated light shimmer bar across button while generating */}
                {isGenerating && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '50%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
                      animation: 'cyber-wave 1.4s ease-in-out infinite'
                    }}
                  />
                )}

                {isGenerating ? (
                  <>
                    <Sparkles
                      style={{
                        width: 17,
                        height: 17,
                        color: '#fde047',
                        animation: 'spin-glow 1.5s linear infinite',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      Generating Quiz
                      <span style={{ animation: 'typing-bounce 1.4s infinite ease-in-out', display: 'inline-block' }}>.</span>
                      <span style={{ animation: 'typing-bounce 1.4s infinite ease-in-out 0.2s', display: 'inline-block' }}>.</span>
                      <span style={{ animation: 'typing-bounce 1.4s infinite ease-in-out 0.4s', display: 'inline-block' }}>.</span>
                    </span>
                  </>
                ) : (
                  <>
                    <RotateCcw style={{ width: 16, height: 16 }} />
                    <span>Generate Another Quiz</span>
                  </>
                )}
              </button>

              <button
                className="btn-secondary"
                onClick={() => setQuizState('setup')}
                disabled={isGenerating}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 600 }}
              >
                Change Parameters
              </button>

              {onReturnToChat && (
                <button
                  className="btn-secondary"
                  onClick={onReturnToChat}
                  disabled={isGenerating}
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Home style={{ width: 16, height: 16 }} />
                  <span>Return to Home</span>
                </button>
              )}
            </div>

            {generationError && (
              <div style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem'
              }}>
                <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>{generationError}</span>
              </div>
            )}
          </div>

          {/* Detailed Question Review List */}
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <BookOpen style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
            <span>Detailed Question Review & Explanations</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
            {quizData.questions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = userAns === q.correct_answer;

              return (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid ' + (isCorrect ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'),
                    borderRadius: 'var(--radius-md)',
                    padding: '1.35rem 1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem' }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {idx + 1}. {q.question}
                    </h3>
                    <span className={isCorrect ? 'badge badge-success' : 'badge'} style={{
                      background: isCorrect ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                      color: isCorrect ? 'var(--success)' : 'var(--danger)',
                      border: '1px solid ' + (isCorrect ? 'var(--success)' : 'var(--danger)'),
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      flexShrink: 0
                    }}>
                      {isCorrect ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <XCircle style={{ width: 14, height: 14 }} />}
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {/* Your Answer & Correct Answer Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
                    <div style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                      <strong>Your Answer:</strong> {userAns || <em>Not Answered</em>}
                    </div>
                    {!isCorrect && (
                      <div style={{ color: 'var(--success)' }}>
                        <strong>Correct Answer:</strong> {q.correct_answer}
                      </div>
                    )}
                  </div>

                  {/* AI Explanation Callout */}
                  {q.explanation && (
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5
                    }}>
                      <strong style={{ color: 'var(--accent-primary)' }}>💡 AI Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
