'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import LoginGate from '@/components/LoginGate';
import InboxSummary from '@/components/InboxSummary';
import StatsGrid from '@/components/StatsGrid';
import ConversationList from '@/components/ConversationList';
import MessageFeed from '@/components/MessageFeed';

function DashboardContent() {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [conversations, setConversations] = useState(null);
  const [messages, setMessages] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [health, setHealth] = useState(null);
  const [live, setLive] = useState(false); // SSE connection state

  const loadStats = useCallback(async () => {
    try { const r = await api.getStats(); setStats(r.data); } catch {}
  }, []);

  const loadSummary = useCallback(async () => {
    try { const r = await api.getSummary(); setSummary(r.data); } catch {}
  }, []);

  const loadConversations = useCallback(async () => {
    try { const r = await api.getConversations(); setConversations(r.data); } catch {}
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const r = await api.getMessages({ filter, search: search.trim(), limit: 100 });
      let msgs = r.data;
      if (selectedContact) msgs = msgs.filter(m => m.contactId === selectedContact || m.contact?.id === selectedContact);
      setMessages(msgs);
    } catch {}
  }, [filter, search, selectedContact]);

  const refreshAll = useCallback(() => {
    loadStats();
    loadSummary();
    loadConversations();
    loadMessages();
    setLastRefresh(new Date());
  }, [loadStats, loadSummary, loadConversations, loadMessages]);

  // Initial load
  useEffect(() => {
    loadStats();
    loadSummary();
    loadConversations();
    fetch(`${api.apiUrl}/health`).then(r => r.json()).then(setHealth).catch(() => {});
  }, []);

  // Reload messages when filter/search/contact changes
  useEffect(() => { loadMessages(); }, [loadMessages]);

  // 30s poll — a safety net; SSE below handles the real-time path
  useEffect(() => {
    const t = setInterval(refreshAll, 30000);
    return () => clearInterval(t);
  }, [refreshAll]);

  // Live updates: the backend pushes an SSE event the moment a webhook
  // message lands or a reply is sent, so the dashboard doesn't wait on the poll.
  const refreshAllRef = useRef(refreshAll);
  refreshAllRef.current = refreshAll;

  useEffect(() => {
    const key = api.getKey();
    const url = `${api.apiUrl}/api/events${key ? `?key=${encodeURIComponent(key)}` : ''}`;
    const es = new EventSource(url);
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.addEventListener('message', () => refreshAllRef.current());
    return () => { es.close(); setLive(false); };
  }, []);

  const unreadCount = stats?.unreadMessages ?? 0;
  const activeContact = conversations?.find(c => c.contact.id === selectedContact)?.contact ?? null;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-white">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Thrive WhatsApp Dashboard</h1>
            <p className="text-xs text-gray-400">MMT Consulting — Subcommittee Monitor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {unreadCount} unread
            </span>
          )}
          <span className="text-xs text-gray-400" suppressHydrationWarning>
            {mounted ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
          <div
            className={`w-2 h-2 rounded-full ${live ? 'bg-green-400' : 'bg-gray-300'}`}
            title={live ? 'Live updates connected' : 'Live updates disconnected — polling every 30s'}
          />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-4 md:p-6">
        {/* ── Written Summary ──────────────────────────────────────────────── */}
        <InboxSummary summary={summary} stats={stats} />

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <StatsGrid stats={stats} />

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4 h-[calc(100vh-240px)]">

          {/* ── Left: Conversation List ───────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 text-sm">Conversations</h2>
              {selectedContact && (
                <button onClick={() => setSelectedContact(null)} className="text-xs text-green-600 hover:underline">
                  Show all
                </button>
              )}
            </div>
            <ConversationList
              conversations={conversations}
              selected={selectedContact}
              onSelect={(id) => setSelectedContact(prev => prev === id ? null : id)}
            />
          </div>

          {/* ── Centre: Message Feed ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">
                {activeContact ? `Chat — ${activeContact.name}` : 'All Messages'}
              </h2>
            </div>
            <MessageFeed
              messages={messages}
              filter={filter}
              search={search}
              onFilterChange={setFilter}
              onSearchChange={setSearch}
              activeContact={activeContact}
              onSent={refreshAll}
            />
          </div>

          {/* ── Right: Quick Stats ───────────────────────────────────────── */}
          <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-800 text-sm">Quick Stats</h2>
              {stats ? (
                <div className="space-y-3">
                  {[
                    { label: 'Inbound', value: stats.inboundMessages, bar: stats.inboundMessages / stats.totalMessages, color: 'bg-blue-400' },
                    { label: 'Outbound', value: stats.outboundMessages, bar: stats.outboundMessages / stats.totalMessages, color: 'bg-green-400' },
                    { label: 'Unread', value: stats.unreadMessages, bar: stats.unreadMessages / stats.totalMessages, color: 'bg-red-400' },
                    { label: 'Important', value: stats.importantMessages, bar: stats.importantMessages / stats.totalMessages, color: 'bg-amber-400' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${Math.round(item.bar * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 font-medium">Connection Status</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${health?.whatsappLive ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-gray-600">
                    {health ? (health.whatsappLive ? 'Connected to WhatsApp Cloud API' : 'Mock mode — API not connected') : 'Checking…'}
                  </span>
                </div>
                {!health?.whatsappLive && (
                  <p className="text-xs text-gray-400 mt-1">
                    Plug in your WhatsApp API token in <code className="bg-gray-100 px-1 rounded">backend/.env</code>
                  </p>
                )}
                {health && !health.authRequired && (
                  <p className="text-xs text-gray-400 mt-1">
                    No dashboard key set — set <code className="bg-gray-100 px-1 rounded">DASHBOARD_API_KEY</code> before deploying.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <LoginGate>
      <DashboardContent />
    </LoginGate>
  );
}
