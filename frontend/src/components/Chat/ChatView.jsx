import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Plus,
  Mic,
  MicOff
} from 'lucide-react';
import katex from 'katex';
import { askBackendRAG, uploadDocument } from '../../services/api';

export default function ChatView({
  activeDoc,
  currentDocKey = 'all',
  messages = [],
  onAddMessage,
  onClearActiveDoc,
  pendingQuickPrompt,
  onClearQuickPrompt,
  onFileUploadSuccess
}) {
  const [inputQuery, setInputQuery] = useState('');
  const [loadingSessions, setLoadingSessions] = useState({});
  const isLoading = !!loadingSessions[currentDocKey];
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [activeSnippetModal, setActiveSnippetModal] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice Speech Recognition is not supported in this browser environment. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
    const t1 = setTimeout(() => scrollToBottom(true), 60);
    const t2 = setTimeout(() => scrollToBottom(false), 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, isLoading, currentDocKey, activeDoc]);

  useEffect(() => {
    if (pendingQuickPrompt) {
      handleSend(pendingQuickPrompt);
      if (onClearQuickPrompt) onClearQuickPrompt();
    }
  }, [pendingQuickPrompt]);

  const handleSend = async (queryText = inputQuery, allowGeneral = false) => {
    const textToSend = queryText.trim();
    const docKeyToSend = currentDocKey || (activeDoc ? (activeDoc.title || activeDoc.doc_id) : 'all');
    if (!textToSend || loadingSessions[docKeyToSend]) return;

    if (!allowGeneral && onAddMessage) {
      const userMsg = {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: textToSend,
        timestamp: new Date()
      };
      onAddMessage(userMsg, docKeyToSend);
    }

    setInputQuery('');
    setLoadingSessions(prev => ({ ...prev, [docKeyToSend]: true }));

    const chatHistoryPayload = (messages || []).map(m => ({
      sender: m.sender,
      text: m.text
    }));

    try {
      const response = await askBackendRAG({
        query: textToSend,
        subjectFilter: 'all',
        filenameFilter: activeDoc ? (activeDoc.title || activeDoc.doc_id) : null,
        allowGeneral: allowGeneral,
        chatHistory: chatHistoryPayload
      });

      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: response.answerText || response.answer || "No response received.",
        sources: response.sources || [],
        consentRequired: response.consentRequired || false,
        originalQuery: textToSend,
        timestamp: new Date()
      };

      if (onAddMessage) onAddMessage(botMsg, docKeyToSend);
    } catch (err) {
      console.error(err);
      if (onAddMessage) onAddMessage({
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: '❌ Could not connect to Python RAG Backend (`http://localhost:8000`). Please ensure `python run.py` is running!',
        sources: []
      }, docKeyToSend);
    } finally {
      setLoadingSessions(prev => ({ ...prev, [docKeyToSend]: false }));
    }
  };

  const handleSpeech = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[#*$`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const renderFormattedMarkdown = (content) => {
    if (!content) return null;

    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <div key={idx} dangerouslySetInnerHTML={{ __html: html }} style={{ margin: '0.6rem 0' }} />;
        } catch {
          return <code key={idx}>{math}</code>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <code key={idx}>{math}</code>;
        }
      }

      const lines = part.split('\n');
      return (
        <span key={idx}>
          {lines.map((line, lIdx) => {
            if (line.startsWith('### ')) {
              return <h3 key={lIdx} style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.75rem 0 0.4rem', color: 'var(--accent-primary)' }}>{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('#### ')) {
              return <h4 key={lIdx} style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.6rem 0 0.3rem' }}>{line.replace('#### ', '')}</h4>;
            }
            if (line.startsWith('- ')) {
              return <li key={lIdx} style={{ marginLeft: '1.2rem', marginBottom: '0.25rem' }}>{line.replace('- ', '')}</li>;
            }
            return <React.Fragment key={lIdx}>{line}{lIdx < lines.length - 1 ? <br /> : null}</React.Fragment>;
          })}
        </span>
      );
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      setUploadStatus(`Indexing ${file.name}...`);
      try {
        const res = await uploadDocument(file, 'General');
        if (res && res.status === 'success') {
          const docObj = {
            doc_id: file.name,
            title: file.name,
            subject: 'General',
            totalPages: res.total_pages || 1,
            chunks_count: res.chunks_created || 1
          };
          const sysMsg = {
            id: `sys_${Date.now()}`,
            sender: 'assistant',
            type: 'doc_indexed',
            fileData: {
              name: file.name,
              chunks: res.chunks_created || 1,
              pages: res.total_pages || 1
            },
            text: `📄 **Document indexed:** \`${file.name}\``,
            sources: []
          };
          if (onAddMessage) onAddMessage(sysMsg, file.name);
          if (onFileUploadSuccess) onFileUploadSuccess(docObj);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    setIsUploading(false);
    setUploadStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderInputBar = () => (
    <div style={{
      width: '100%',
      maxWidth: '680px',
      margin: '0 auto'
    }}>
      {isUploading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.82rem',
          color: 'var(--accent-primary)',
          marginBottom: '0.4rem',
          justifyContent: 'center'
        }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          <span>{uploadStatus || 'Uploading document...'}</span>
        </div>
      )}

      {/* Pill Input Bar with text input, mic icon, -> send button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--accent-primary)',
        borderRadius: '36px',
        padding: '0.45rem 0.65rem 0.45rem 0.85rem',
        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35), 0 0 20px rgba(99, 102, 241, 0.25)',
        transition: 'all 0.2s ease-in-out'
      }}>
        {/* Hidden File Input for uploading attachments */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.docx,.txt"
        />
        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Upload Document (.pdf, .docx, .txt)"
          disabled={isUploading}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-primary)',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            opacity: isUploading ? 0.5 : 1,
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus style={{ width: 18, height: 18 }} />
        </button>

        <input
          type="text"
          placeholder="Ask any question..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-family)',
            padding: '0.4rem 0.2rem'
          }}
        />

        {/* Animated Sound Wave Indicator during Recording */}
        {isListening && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            height: '18px',
            padding: '0 4px',
            flexShrink: 0
          }} title="Recording audio...">
            <div className="sound-wave-bar" />
            <div className="sound-wave-bar" />
            <div className="sound-wave-bar" />
            <div className="sound-wave-bar" />
          </div>
        )}

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          className={isListening ? 'mic-recording-active' : ''}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isListening ? 'var(--danger)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title={isListening ? "Listening... Click to stop" : "Voice Input"}
        >
          {isListening ? (
            <MicOff style={{ width: 18, height: 18, color: 'var(--danger)' }} />
          ) : (
            <Mic style={{ width: 18, height: 18 }} />
          )}
        </button>

        {/* Send Arrow Button on Right */}
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: inputQuery.trim() && !isLoading
              ? 'var(--accent-gradient)'
              : 'rgba(99, 102, 241, 0.08)',
            border: inputQuery.trim() && !isLoading
              ? 'none'
              : '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: inputQuery.trim() && !isLoading
              ? '0 4px 14px rgba(79, 70, 229, 0.45)'
              : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputQuery.trim() && !isLoading ? 'pointer' : 'not-allowed',
            opacity: inputQuery.trim() && !isLoading ? 1 : 0.45,
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title={inputQuery.trim() && !isLoading ? "Send Question" : "Type a message to send"}
        >
          <ArrowRight style={{
            width: 20,
            height: 20,
            color: inputQuery.trim() && !isLoading ? '#ffffff' : 'var(--text-muted)',
            strokeWidth: 2.5
          }} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      overscrollBehavior: 'none',
      background: 'var(--bg-primary)'
    }}>
      {/* Active Document/Chat Header */}
      {activeDoc && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '0.6rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <FileText style={{ width: 17, height: 17, color: 'var(--accent-primary)' }} />
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{activeDoc.title}</strong>
            <span className="badge badge-success" style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>
              {activeDoc.totalPages || 1} Pages • {activeDoc.chunks_count || 4} Chunks
            </span>
          </div>
          {onClearActiveDoc && (
            <button
              onClick={onClearActiveDoc}
              title="Close document chat"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      )}

      {/* Messages / Welcome Container */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          padding: '1.5rem 2rem',
          overflowY: messages.length === 0 ? 'hidden' : 'auto',
          overscrollBehavior: 'contain',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          justifyContent: messages.length === 0 ? 'center' : 'flex-start',
          alignItems: messages.length === 0 ? 'center' : 'stretch'
        }}
      >
        {messages.length === 0 && !isLoading ? (
          <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2.5rem',
            width: '100%',
            maxWidth: '720px',
            padding: '1rem',
            margin: '0 auto'
          }}>
            {/* Wireframe Centered Title */}
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.3px',
              color: 'var(--text-primary)',
              fontFamily: "'Outfit', sans-serif"
            }}>
              What would you like to Study?
            </h1>

            {/* Input Bar Centered Directly Under Title */}
            {renderInputBar()}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.sender === 'user' ? '80%' : '90%'
                }}
              >
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: msg.sender === 'user' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {msg.sender === 'user' ? <User style={{ width: 18, height: 18, color: '#fff' }} /> : <Bot style={{ width: 18, height: 18, color: 'var(--accent-primary)' }} />}
                </div>

                <div style={{
                  background: msg.type === 'doc_indexed' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)' : (msg.sender === 'user' ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-card)'),
                  border: '1px solid ' + (msg.type === 'doc_indexed' ? 'rgba(99, 102, 241, 0.35)' : (msg.sender === 'user' ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-color)')),
                  padding: msg.type === 'doc_indexed' ? '0.9rem 1.15rem' : '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  maxWidth: '560px'
                }}>
                  {msg.type === 'doc_indexed' && msg.fileData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            background: 'var(--accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                          }}>
                            <FileText style={{ width: 18, height: 18 }} />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {msg.fileData.name}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                          onClick={() => handleSend(`Summarize the main concepts in ${msg.fileData.name}`)}
                        >
                          <Sparkles style={{ width: 13, height: 13 }} />
                          <span>Summarize Document</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    renderFormattedMarkdown(msg.text)
                  )}

                  {/* Consent Action Button for Doc Specific Chats */}
                  {msg.consentRequired && (
                    <div style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                        onClick={() => handleSend(msg.originalQuery || inputQuery, true)}
                      >
                        Yes, Answer with General AI
                      </button>
                    </div>
                  )}

                  {/* Citations Footer */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        📚 Citations:
                      </div>
                      <div>
                        {msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="citation-pill"
                            onClick={() => setActiveSnippetModal(src)}
                          >
                            <BookOpen style={{ width: 12, height: 12 }} />
                            <span>{src.title} (Pg {src.page})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Speech Button */}
                  {msg.sender === 'assistant' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleSpeech(msg.text)}
                        title="Read answer aloud"
                        style={{ padding: '0.2rem 0.4rem' }}
                      >
                        {isSpeaking ? <VolumeX style={{ width: 15, height: 15, color: 'var(--danger)' }} /> : <Volume2 style={{ width: 15, height: 15 }} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', gap: '0.85rem', alignSelf: 'flex-start' }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot style={{ width: 18, height: 18, color: 'var(--accent-primary)' }} />
                </div>

                <div className="simple-loader-card">
                  <div className="simple-pulse-dot"></div>
                  <div className="simple-pulse-dot"></div>
                  <div className="simple-pulse-dot"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Render bottom input bar when active messages exist */}
      {messages.length > 0 && (
        <div style={{ padding: '0.6rem 1.5rem 1.25rem', width: '100%', flexShrink: 0, overscrollBehavior: 'none' }}>
          {renderInputBar()}
        </div>
      )}

      {/* Source Citation Modal */}
      {activeSnippetModal && (
        <div className="modal-overlay" onClick={() => setActiveSnippetModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen style={{ color: 'var(--accent-primary)', width: 20, height: 20 }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Source Excerpt: {activeSnippetModal.title}</h3>
              </div>
              <button className="btn-icon" onClick={() => setActiveSnippetModal(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <span className="badge badge-success">Page {activeSnippetModal.page}</span>
                {(() => {
                  const score = activeSnippetModal.relevanceScore ?? activeSnippetModal.confidenceScore ?? 0.8;
                  let label = activeSnippetModal.relevanceLabel;
                  if (!label) {
                    if (score >= 0.65) label = 'High Relevance';
                    else if (score >= 0.35) label = 'Medium Relevance';
                    else label = 'Low Relevance';
                  }
                  const badgeClass = label.startsWith('High')
                    ? 'badge badge-success'
                    : (label.startsWith('Medium') ? 'badge badge-warning' : 'badge');
                  return <span className={badgeClass}>{label}</span>;
                })()}
              </div>
              <div style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '1.1rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap'
              }}>
                {activeSnippetModal.fullText || activeSnippetModal.snippet}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
