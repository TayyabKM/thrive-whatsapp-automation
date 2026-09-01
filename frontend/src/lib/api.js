const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
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
