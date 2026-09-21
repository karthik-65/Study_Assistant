import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LeftSidebar from './components/Sidebar/LeftSidebar';
import ChatView from './components/Chat/ChatView';
import DocumentSidebar from './components/Documents/DocumentSidebar';
import QuizView from './components/Quiz/QuizView';
import AuthModal from './components/Auth/AuthModal';
import {
  fetchChatHistory,
  saveChatMessage,
  fetchOpenChatSessions,
  saveOpenChatSession,
  deleteOpenChatSession,
  fetchDocuments,
  getStoredUser,
  fetchCurrentUser,
  clearAuth
} from './services/api';
import './styles/index.css';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('study_assistant_theme') || 'dark');
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'quiz'
  const [activeDoc, setActiveDoc] = useState(null);
  const [activeOpenChatId, setActiveOpenChatId] = useState(() => `open_${Date.now()}`);
  const [openChatSessions, setOpenChatSessions] = useState([]);
  const [fileChats, setFileChats] = useState({});
  const [pendingQuickPrompt, setPendingQuickPrompt] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  // Auth States
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const handleOpenAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study_assistant_theme', theme);
  }, [theme]);

  // Verify authentication on mount
  useEffect(() => {
    async function verifyAuth() {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        setActiveView('chat');
      } else {
        setCurrentUser(null);
      }
    }
    verifyAuth();
  }, []);

  // Load Open Chat sessions & documents list
  const loadOpenChatSessions = async () => {
    const sessions = await fetchOpenChatSessions();
    setOpenChatSessions(sessions);
  };

  const loadDocuments = async () => {
    const docs = await fetchDocuments();
    setUploadedDocs(docs);
  };

  useEffect(() => {
    loadOpenChatSessions();
    loadDocuments();
  }, [currentUser]);

  const currentDocKey = activeDoc ? (activeDoc.title || activeDoc.doc_id) : activeOpenChatId;

  // Load chat history from Database when currentDocKey changes
  useEffect(() => {
    async function loadHistory() {
      const history = await fetchChatHistory(currentDocKey);
      setFileChats(prev => ({
        ...prev,
        [currentDocKey]: history
      }));
    }
    loadHistory();
  }, [currentDocKey, currentUser]);

  const handleAddMessage = async (msg, docKey) => {
    const isFirstUserMsg = !fileChats[docKey] || fileChats[docKey].filter(m => m.sender === 'user').length === 0;

    setFileChats(prev => ({
      ...prev,
      [docKey]: [...(prev[docKey] || []), msg]
    }));
    await saveChatMessage(docKey, msg);

    // If it's an Open Chat message, ensure session title is updated according to the user's chat topic
    if (!activeDoc && msg.sender === 'user') {
      const existingSession = openChatSessions.find(s => s.session_id === docKey);
      const isGenericTitle = !existingSession ||
                             existingSession.title === 'New Chat' ||
                             existingSession.title.startsWith('Open Chat');

      if (isFirstUserMsg || isGenericTitle) {
        const title = msg.text.trim().length > 35 ? msg.text.trim().slice(0, 35) + '...' : msg.text.trim();
        await saveOpenChatSession(docKey, title);
        setOpenChatSessions(prev => {
          const exists = prev.some(s => s.session_id === docKey);
          if (exists) {
            return prev.map(s => s.session_id === docKey ? { ...s, title } : s);
          } else {
            return [{ session_id: docKey, title, created_at: new Date().toISOString() }, ...prev];
          }
        });
        loadOpenChatSessions();
      }
    }
  };

  const currentMessages = fileChats[currentDocKey] || [];

  const handleQuickAction = (doc, promptText) => {
    setActiveDoc(doc);
    setPendingQuickPrompt(promptText);
    setActiveView('chat');
  };

  const handleCreateOpenChat = async () => {
    if (!activeDoc && activeOpenChatId) {
      const currentMsgs = fileChats[activeOpenChatId] || [];
      const hasUserMsg = currentMsgs.some(m => m.sender === 'user');
      if (!hasUserMsg) {
        setActiveDoc(null);
        setActiveView('chat');
        return;
      }
    }

    const existingEmptySession = openChatSessions.find(s => {
      const isGenericTitle = !s.title || s.title === 'New Chat' || s.title.startsWith('Open Chat');
      if (!isGenericTitle) return false;
      const msgs = fileChats[s.session_id];
      if (msgs && msgs.some(m => m.sender === 'user')) return false;
      return true;
    });

    if (existingEmptySession) {
      setActiveDoc(null);
      setActiveOpenChatId(existingEmptySession.session_id);
      setActiveView('chat');
      return;
    }

    setActiveDoc(null);
    const newSessionId = `open_${Date.now()}`;
    const newTitle = `New Chat`;
    setActiveOpenChatId(newSessionId);
    setActiveView('chat');
    await saveOpenChatSession(newSessionId, newTitle);
    await loadOpenChatSessions();
  };

  const handleSelectOpenChat = (sessionId) => {
    setActiveDoc(null);
    setActiveOpenChatId(sessionId);
    setActiveView('chat');
  };

  const handleDeleteOpenChat = async (sessionId) => {
    await deleteOpenChatSession(sessionId);
    if (activeOpenChatId === sessionId) {
      setActiveOpenChatId(`open_${Date.now()}`);
    }
    loadOpenChatSessions();
  };

  const handleFileUploadSuccess = (docObj) => {
    setActiveDoc(docObj);
    loadDocuments();
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setActiveView('chat');
    setActiveDoc(null);
    setFileChats({});
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setActiveView('chat');
    setActiveDoc(null);
    setIsAuthModalOpen(false);
    loadOpenChatSessions();
    loadDocuments();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100vw',
      overflow: 'hidden',
      overscrollBehavior: 'none',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* 1. Header Bar spanning top with Auth */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* 2. Main Body View: Home is the Chat page, or QuizView when activeView === 'quiz' */}
      {activeView === 'quiz' ? (
        <div style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
          <QuizView
            documents={uploadedDocs}
            onReturnToChat={() => setActiveView('chat')}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', overscrollBehavior: 'none' }}>
          {/* Left Column: New Chat & Your Chats */}
          <LeftSidebar
            activeDoc={activeDoc}
            activeOpenChatId={activeOpenChatId}
            openChatSessions={openChatSessions}
            onOpenChat={handleCreateOpenChat}
            onSelectOpenChat={handleSelectOpenChat}
            onDeleteOpenChat={handleDeleteOpenChat}
          />

          {/* Center Column: Question & Interactive Chat View */}
          <div style={{ flex: 1, height: '100%', overflow: 'hidden', overscrollBehavior: 'none' }}>
            <ChatView
              activeDoc={activeDoc}
              currentDocKey={currentDocKey}
              messages={currentMessages}
              onAddMessage={handleAddMessage}
              onClearActiveDoc={handleCreateOpenChat}
              pendingQuickPrompt={pendingQuickPrompt}
              onClearQuickPrompt={() => setPendingQuickPrompt(null)}
              onFileUploadSuccess={handleFileUploadSuccess}
            />
          </div>

          {/* Right Column: Upload Document, Search Documents & Document Chat */}
          <DocumentSidebar
            activeDoc={activeDoc}
            onSelectDoc={(doc) => {
              setActiveDoc(doc);
              setActiveView('chat');
            }}
            onQuickAction={handleQuickAction}
            onFileUploadSuccess={handleFileUploadSuccess}
            onDocumentsUpdated={loadDocuments}
          />
        </div>
      )}

      {/* 3. Auth Modal (Log In / Create Account) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
