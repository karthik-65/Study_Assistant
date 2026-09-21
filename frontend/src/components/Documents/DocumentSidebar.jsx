import React, { useState, useEffect, useRef } from 'react';
import { FileText, Sparkles, Trash2, Search, UploadCloud, X } from 'lucide-react';
import { fetchDocuments, fetchChunks, deleteDocument, uploadDocument } from '../../services/api';

export default function DocumentSidebar({
  activeDoc,
  onSelectDoc,
  onQuickAction,
  onFileUploadSuccess,
  onDocumentsUpdated
}) {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [confirmingDeleteDoc, setConfirmingDeleteDoc] = useState(null);
  const [docChunks, setDocChunks] = useState([]);
  const [recentTimestamps, setRecentTimestamps] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const docFileInputRef = useRef(null);

  const loadDocuments = async () => {
    const docs = await fetchDocuments();
    setDocuments(docs);
    if (onDocumentsUpdated) onDocumentsUpdated(docs.length);
  };

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(loadDocuments, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeDoc) {
      const docKey = activeDoc.title || activeDoc.doc_id;
      setRecentTimestamps(prev => ({
        ...prev,
        [docKey]: Date.now()
      }));
    }
  }, [activeDoc]);

  const handleSelectDoc = (doc) => {
    if (doc) {
      const docKey = doc.title || doc.doc_id;
      setRecentTimestamps(prev => ({
        ...prev,
        [docKey]: Date.now()
      }));
    }
    onSelectDoc(doc);
  };

  const handleInspect = async (e, doc) => {
    e.stopPropagation();
    setInspectingDoc(doc);
    const chunks = await fetchChunks(doc.title || doc.doc_id);
    setDocChunks(chunks);
  };

  const handleSidebarFileUpload = async (event) => {
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
          if (onFileUploadSuccess) onFileUploadSuccess(docObj);
          handleSelectDoc(docObj);
          await loadDocuments();
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    setIsUploading(false);
    setUploadStatus('');
    if (docFileInputRef.current) docFileInputRef.current.value = '';
  };

  const filteredDocs = documents.filter(doc =>
    (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    const timeA = recentTimestamps[a.title || a.doc_id] || 0;
    const timeB = recentTimestamps[b.title || b.doc_id] || 0;
    return timeB - timeA;
  });

  return (
    <>
      {/* Right Sidebar */}
      <aside
        style={{
          width: '280px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          padding: '1.15rem 1rem',
          gap: '0.9rem',
          flexShrink: 0,
          overflow: 'hidden',
          overscrollBehavior: 'none',
          userSelect: 'none'
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={docFileInputRef}
          accept=".pdf,.txt,.md,.docx"
          multiple
          onChange={handleSidebarFileUpload}
          style={{ display: 'none' }}
        />

        {/* 1. Upload Doc Button */}
        <button
          onClick={() => docFileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <UploadCloud style={{ width: 18, height: 18 }} />
          <span>{isUploading ? (uploadStatus || 'Indexing...') : 'Upload Document'}</span>
        </button>

        {/* 2. Search Documents Input Box */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 15,
            height: 15,
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search Documents"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '2.2rem',
              fontSize: '0.84rem',
              width: '100%',
              borderRadius: '20px',
              border: '1px solid var(--border-color)'
            }}
          />
        </div>

        {/* 3. Doc specific Chats Section Header & List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', overflow: 'hidden' }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '0.3px',
            padding: '0.2rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Document Chats</span>
            <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
              {documents.length} Files
            </span>
          </div>

          {/* Document List */}
          <div style={{
            flex: 1,
            overflowY: sortedDocs.length === 0 ? 'hidden' : 'auto',
            overscrollBehavior: 'contain',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            paddingRight: '0.2rem'
          }}>
            {sortedDocs.length === 0 ? (
              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                padding: '1.5rem 0.8rem',
                opacity: 0.6,
                fontSize: '0.82rem',
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}>
                {searchQuery ? 'No documents match search.' : 'No documents uploaded yet. Click Upload Document above to start!'}
              </div>
            ) : (
              sortedDocs.map((doc, idx) => {
                const isSelected = activeDoc && (activeDoc.title === doc.title || activeDoc.doc_id === doc.doc_id);

                return (
                  <div
                    key={doc.title || doc.doc_id || idx}
                    onClick={() => handleSelectDoc(doc)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                      border: '1.5px solid ' + (isSelected ? 'var(--accent-primary)' : 'var(--border-color)'),
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none'
                    }}
                  >
                    {/* Top Row: Document Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', width: '100%' }}>
                      <FileText style={{
                        color: 'var(--accent-primary)',
                        width: 16,
                        height: 16,
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {doc.title}
                      </span>
                    </div>

                    {/* Bottom Row: Pages/Chunks on left & Action Icons on right */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>{doc.totalPages || 1} Pgs • {doc.chunks_count || 4} Chunks</span>

                      {/* Action Icons aligned right on the bottom side */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', flexShrink: 0, marginLeft: 'auto' }}>
                        {/* Summarize Action */}
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDoc(doc);
                            if (onQuickAction) onQuickAction(doc, `Summarize the main concepts in ${doc.title}`);
                          }}
                          title="Summarize document"
                          style={{ padding: '0.15rem 0.2rem', color: 'var(--accent-primary)' }}
                        >
                          <Sparkles style={{ width: 14, height: 14 }} />
                        </button>

                        {/* View Chunks Action */}
                        <button
                          className="btn-icon"
                          onClick={(e) => handleInspect(e, doc)}
                          title="View document chunks"
                          style={{ padding: '0.15rem 0.2rem', color: 'var(--text-secondary)' }}
                        >
                          <Eye style={{ width: 14, height: 14 }} />
                        </button>

                        {/* Delete Document Action */}
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingDeleteDoc(doc);
                          }}
                          title="Delete document and chat history"
                          style={{ padding: '0.15rem 0.2rem', color: 'var(--danger)' }}
                        >
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Chunk Inspector Modal */}
      {inspectingDoc && (
        <div className="modal-overlay" onClick={() => setInspectingDoc(null)} style={{ zIndex: 1100 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode style={{ color: 'var(--accent-primary)', width: 20, height: 20 }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Document Chunks: {inspectingDoc.title}</h3>
              </div>
              <button className="btn-icon" onClick={() => setInspectingDoc(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {docChunks.map((chunk, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
                    <span className="badge badge-success">Chunk #{idx + 1} (Page {chunk.page || 1})</span>
                    <span style={{ color: 'var(--text-muted)' }}>{chunk.word_count || 50} words</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, fontFamily: 'monospace' }}>
                    {chunk.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {confirmingDeleteDoc && (
        <div className="modal-overlay" onClick={() => setConfirmingDeleteDoc(null)} style={{ zIndex: 1200 }}>
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
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Delete Document</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>This action cannot be undone.</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setConfirmingDeleteDoc(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '0.75rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{confirmingDeleteDoc.title}"</strong>?
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
                ℹ️ This will permanently erase the indexed document chunks and clear its associated chat history.
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
                onClick={() => setConfirmingDeleteDoc(null)}
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  const targetTitle = confirmingDeleteDoc.title || confirmingDeleteDoc.doc_id;
                  await deleteDocument(targetTitle);
                  if (activeDoc && (activeDoc.title === targetTitle || activeDoc.doc_id === targetTitle)) {
                    onSelectDoc(null);
                  }
                  setConfirmingDeleteDoc(null);
                  loadDocuments();
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
                <span>Delete Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
