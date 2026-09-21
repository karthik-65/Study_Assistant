import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

export default function LeftSidebar({
  activeDoc,
  activeOpenChatId,
  openChatSessions = [],
  onOpenChat,
  onSelectOpenChat,
  onDeleteOpenChat
}) {
  const [confirmingDeleteSession, setConfirmingDeleteSession] = useState(null);

  return (
    <>
      <aside
        style={{
          width: '260px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          padding: '1.15rem 1rem',
          gap: '1rem',
          flexShrink: 0,
          overflow: 'hidden',
          overscrollBehavior: 'none',
          userSelect: 'none'
        }}
      >
        {/* New Chat Button */}
        <button
          onClick={onOpenChat}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Plus style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
          <span>New Chat</span>
        </button>

        {/* Your Chats Header & List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '0.3px',
            padding: '0.2rem 0.3rem',
            borderBottom: '2px solid var(--accent-primary)',
            display: 'inline-block',
            alignSelf: 'flex-start',
            marginBottom: '0.25rem'
          }}>
            Your Chats
          </div>

          {openChatSessions.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.9rem 0.85rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              No chat history yet
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              paddingRight: '0.2rem'
            }}>
              {openChatSessions.map((session) => {
                const isSelected = activeDoc === null && activeOpenChatId === session.session_id;

                return (
                  <div
                    key={session.session_id}
                    onClick={() => onSelectOpenChat && onSelectOpenChat(session.session_id)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                      border: '1.5px solid ' + (isSelected ? 'var(--accent-primary)' : 'var(--border-color)'),
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                      <MessageSquare style={{
                        width: 15,
                        height: 15,
                        color: 'var(--accent-primary)',
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {session.title || 'New Chat'}
                      </span>
                    </div>

                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDeleteSession(session);
                      }}
                      title="Delete chat thread"
                      style={{ padding: '0.25rem', color: 'var(--danger)', flexShrink: 0 }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Delete Chat Session Modal */}
      {confirmingDeleteSession && (
        <div className="modal-overlay" onClick={() => setConfirmingDeleteSession(null)} style={{ zIndex: 1200 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '430px',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div className="modal-header" style={{ marginBottom: '1rem', borderBottom: 'none', padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Trash2 style={{ color: 'var(--accent-primary)', width: 19, height: 19 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Delete Chat</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>This action cannot be undone.</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setConfirmingDeleteSession(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '0.75rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{confirmingDeleteSession.title || 'New Chat'}"</strong>?
              </p>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                lineHeight: 1.45
              }}>
                ℹ️ This will permanently remove this open chat session and all messages contained in it.
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                className="btn-secondary"
                onClick={() => setConfirmingDeleteSession(null)}
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (onDeleteOpenChat) onDeleteOpenChat(confirmingDeleteSession.session_id);
                  setConfirmingDeleteSession(null);
                }}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  borderColor: '#dc2626',
                  color: '#ffffff',
                  padding: '0.45rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                <span>Delete Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
