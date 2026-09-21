const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const KEY_STORAGE = 'dashboardKey';

function getKey() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY_STORAGE) || '';
}

function setKey(key) {
  if (typeof window === 'undefined') return;
  if (key) localStorage.setItem(KEY_STORAGE, key);
  else localStorage.removeItem(KEY_STORAGE);
}

async function apiFetch(path, options = {}) {
  const key = getKey();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { 'x-dashboard-key': key } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) {
    setKey('');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('dashboard-unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  apiUrl: API_URL,
  getKey,
  setKey,
  getStats: () => apiFetch('/api/stats'),
  getSummary: () => apiFetch('/api/summary'),
  getMessages: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/messages?${q}`);
  },
  getConversations: () => apiFetch('/api/messages/conversations'),
  sendMessage: (to, body) =>
    apiFetch('/api/messages/send', { method: 'POST', body: JSON.stringify({ to, body }) }),
};
