const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'study_assistant_auth_token';
const USER_KEY = 'study_assistant_user_info';

// Auth State Helpers
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser() {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getAuthHeaders(additionalHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...additionalHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ----------------- Auth API Endpoints -----------------

export async function registerUser({ username, email, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  if (data.token) {
    setAuthToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export async function loginUser({ identifier, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Login failed');
  }
  if (data.token) {
    setAuthToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export function checkAuthResponse(res) {
  if (res && res.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event('study_assistant_session_expired'));
  }
  return res;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) {
    clearAuth();
    return null;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    checkAuthResponse(res);
    if (!res.ok) {
      clearAuth();
      return null;
    }
    const data = await res.json();
    if (data.user) {
      setStoredUser(data.user);
      return data.user;
    }
    return null;
  } catch (err) {
    console.error("Fetch current user error:", err);
    return null;
  }
}

// ----------------- Document & Chat Endpoints -----------------

export async function fetchDocuments() {
  try {
    const res = await fetch(`${API_BASE_URL}/documents`, {
      headers: getAuthHeaders()
    });
    checkAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  } catch (err) {
    console.error("Backend fetch error:", err);
    return [];
  }
}

export async function deleteDocument(filename) {
  try {
    const res = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    checkAuthResponse(res);
    return await res.json();
  } catch (err) {
    console.error("Delete document error:", err);
    return { status: "error" };
  }
}

export async function uploadDocument(file, subject = 'General') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', subject);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });
  checkAuthResponse(res);
  return await res.json();
}

export async function askBackendRAG({ query, subjectFilter = 'all', filenameFilter = null, allowGeneral = false, chatHistory = [] }) {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      query,
      subject: subjectFilter,
      filename: filenameFilter,
      top_k: 4,
      allow_general: allowGeneral,
      chat_history: chatHistory
    })
  });
  checkAuthResponse(res);
  return await res.json();
}

export async function fetchChunks(filename) {
  try {
    const res = await fetch(`${API_BASE_URL}/chunks?filename=${encodeURIComponent(filename)}`, {
      headers: getAuthHeaders()
    });
    checkAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return data.chunks || [];
  } catch (err) {
    console.error("Fetch chunks error:", err);
    return [];
  }
}

export async function fetchChatHistory(docKey = 'all') {
  try {
    const res = await fetch(`${API_BASE_URL}/history?doc_key=${encodeURIComponent(docKey)}`, {
      headers: getAuthHeaders()
    });
    checkAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error("Fetch history error:", err);
    return [];
  }
}

export async function saveChatMessage(docKey, message) {
  try {
    const res = await fetch(`${API_BASE_URL}/history`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: message.id,
        doc_key: docKey,
        sender: message.sender,
        text: message.text,
        sources: message.sources || [],
        type: message.type || null,
        fileData: message.fileData || null
      })
    });
    checkAuthResponse(res);
  } catch (err) {
    console.error("Save history error:", err);
  }
}

export async function clearChatHistory(docKey = 'all') {
  try {
    const res = await fetch(`${API_BASE_URL}/history/clear`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ doc_key: docKey })
    });
    checkAuthResponse(res);
  } catch (err) {
    console.error("Clear history error:", err);
  }
}

export async function fetchOpenChatSessions() {
  try {
    const res = await fetch(`${API_BASE_URL}/open_chats`, {
      headers: getAuthHeaders()
    });
    checkAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.error("Fetch open chats error:", err);
    return [];
  }
}

export async function saveOpenChatSession(sessionId, title) {
  try {
    const res = await fetch(`${API_BASE_URL}/open_chats`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ session_id: sessionId, title })
    });
    checkAuthResponse(res);
  } catch (err) {
    console.error("Save open chat error:", err);
  }
}

export async function deleteOpenChatSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/open_chats/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    checkAuthResponse(res);
  } catch (err) {
    console.error("Delete open chat error:", err);
  }
}

export async function generateQuizAPI({ filename, numQuestions = 10, difficulty = 'Medium' }) {
  try {
    const res = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        filename,
        num_questions: numQuestions,
        difficulty
      })
    });
    checkAuthResponse(res);
    return await res.json();
  } catch (err) {
    console.error("Generate quiz error:", err);
    return { status: "error", message: err.message };
  }
}
