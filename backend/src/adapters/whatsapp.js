/**
 * WhatsApp Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is the ONLY place that talks to the WhatsApp API.
 * Currently returns mock data. To go live:
 *   1. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env
 *   2. Replace each function body with real API calls (Meta / Twilio / etc.)
 *   3. Keep the same return shapes — the rest of the app needs no changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MOCK_CONTACTS = [
  { id: 'c1', name: 'Ahmed Raza', phone: '+923001234567', avatar: 'AR', type: 'individual', isImportant: true },
  { id: 'c3', name: 'Bilal Khan', phone: '+923451112233', avatar: 'BK', type: 'individual', isImportant: true },
  { id: 'c4', name: 'Fatima Sheikh', phone: '+923331234567', avatar: 'FS', type: 'individual', isImportant: false },
  { id: 'g1', name: 'Events Committee', phone: 'group', avatar: 'EC', type: 'group', memberCount: 8, isImportant: true },
  { id: 'g2', name: 'Finance Subcommittee', phone: 'group', avatar: 'FS', type: 'group', memberCount: 5, isImportant: true },
];

// Note: `isImportant`, `priority`, `importanceReason` and `tags` are NOT stored
// here — they are assigned by the AI classifier (see ./src/services/classifier).
const MOCK_MESSAGES = [
  { id: 'm1', contactId: 'c1', direction: 'inbound', body: 'Assalam o Alaikum! I wanted to follow up on the committee meeting scheduled for next week. Can we confirm the venue?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'read' },
  { id: 'm2', contactId: 'c1', direction: 'outbound', body: 'Walaikum Assalam! Yes, the venue is confirmed — Serena Hotel, Hall 3. I\'ll send the formal invite shortly.', timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), status: 'delivered' },
  { id: 'm3', contactId: 'g2', direction: 'inbound', body: 'The budget proposal has been revised. Please review the attached document before Friday.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'unread' },
  { id: 'm4', contactId: 'c3', direction: 'inbound', body: 'We need to discuss the quarterly report. Are you available tomorrow afternoon around 3pm?', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'read' },
  { id: 'm5', contactId: 'c3', direction: 'outbound', body: 'Tomorrow at 3pm works perfectly. I\'ll set up a call link and share it with you.', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), status: 'read' },
  { id: 'm6', contactId: 'c4', direction: 'inbound', body: 'Just checking in — the subcommittee members have been notified about the policy changes.', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'read' },
  { id: 'm7', contactId: 'g2', direction: 'inbound', body: 'Reminder: membership fees collection deadline is this Sunday. Should we send a bulk reminder?', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), status: 'unread' },
  { id: 'm8', contactId: 'g1', direction: 'inbound', body: 'The event decorations vendor has confirmed. They need a 50% advance payment by Wednesday.', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), status: 'unread' },
  { id: 'm9', contactId: 'g2', direction: 'outbound', body: 'Thanks all, I will review and get back to you by EOD.', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), status: 'delivered' },
  { id: 'm10', contactId: 'g1', direction: 'inbound', body: 'Also, the caterer is asking for the final headcount. Can you confirm by tomorrow morning?', timestamp: new Date(Date.now() - 1000 * 60 * 235).toISOString(), status: 'unread' },
];

// ── AI enrichment ────────────────────────────────────────────────────────────
const { classifyMany, classifierMode } = require('../services/classifier');
const { summarizeInbox } = require('../services/summarizer');

let classifyPromise = null;

// Runs the classifier over every message exactly once, then caches the result
// on the message objects. Safe to await on every request.
async function ensureClassified() {
  if (!classifyPromise) {
    classifyPromise = classifyMany(
      MOCK_MESSAGES.map(m => ({ ...m, contact: MOCK_CONTACTS.find(c => c.id === m.contactId) })),
    ).then(results => {
      for (const m of MOCK_MESSAGES) {
        const r = results.get(m.id) || { isImportant: false, priority: 'low', reason: '', tags: [] };
        m.isImportant = r.isImportant;
        m.priority = r.priority;
        m.importanceReason = r.reason;
        m.importanceSource = r.source;
        m.tags = r.tags;
      }
      console.log(`[Classifier] Tagged ${MOCK_MESSAGES.length} messages via ${classifierMode()}`);
    }).catch(err => {
      console.error('[Classifier] enrichment failed:', err.message);
    });
  }
  return classifyPromise;
}

// ── Public API (replace these bodies with real API calls) ─────────────────────

async function getMessages({ filter = 'all', search = '', limit = 50 } = {}) {
  await ensureClassified();
  // TODO: Replace with real API call
  // e.g. await axios.get(`${process.env.WHATSAPP_API_BASE}/messages`, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` } })
  let messages = [...MOCK_MESSAGES].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (filter === 'unread') messages = messages.filter(m => m.status === 'unread');
  if (filter === 'important') messages = messages.filter(m => m.isImportant);
  if (filter === 'inbound') messages = messages.filter(m => m.direction === 'inbound');
  if (search) messages = messages.filter(m => m.body.toLowerCase().includes(search.toLowerCase()));

  return messages.slice(0, limit).map(m => ({
    ...m,
    contact: MOCK_CONTACTS.find(c => c.id === m.contactId),
  }));
}

async function getConversations() {
  await ensureClassified();
  // Returns one entry per contact with their latest message
  const conversations = MOCK_CONTACTS.map(contact => {
    const msgs = MOCK_MESSAGES
      .filter(m => m.contactId === contact.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = msgs[0];
    const unreadCount = msgs.filter(m => m.status === 'unread').length;
    return { contact, latestMessage: latest || null, unreadCount };
  }).filter(c => c.latestMessage);

  return conversations.sort((a, b) => new Date(b.latestMessage.timestamp) - new Date(a.latestMessage.timestamp));
}

async function getStats() {
  await ensureClassified();
  const total = MOCK_MESSAGES.length;
  const unread = MOCK_MESSAGES.filter(m => m.status === 'unread').length;
  const important = MOCK_MESSAGES.filter(m => m.isImportant).length;
  const inbound = MOCK_MESSAGES.filter(m => m.direction === 'inbound').length;
  const outbound = MOCK_MESSAGES.filter(m => m.direction === 'outbound').length;

  const today = new Date();
  const todayMsgs = MOCK_MESSAGES.filter(m => {
    const d = new Date(m.timestamp);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  });

  // Messages that need attention: inbound + unread
  const needsReply = MOCK_MESSAGES.filter(m => m.direction === 'inbound' && m.status === 'unread');
  const urgentUnread = needsReply.filter(m => m.isImportant).length;
  const oldestUnread = needsReply
    .map(m => new Date(m.timestamp).getTime())
    .sort((a, b) => a - b)[0];
  const oldestUnreadMinutes = oldestUnread ? Math.round((Date.now() - oldestUnread) / 60000) : null;

  const status = urgentUnread > 0 ? 'attention' : unread > 0 ? 'pending' : 'clear';

  return {
    totalMessages: total,
    unreadMessages: unread,
    importantMessages: important,
    inboundMessages: inbound,
    outboundMessages: outbound,
    todayMessages: todayMsgs.length,
    activeContacts: MOCK_CONTACTS.length,
    responseRate: Math.round((outbound / inbound) * 100),
    needsReply: needsReply.length,
    urgentUnread,
    oldestUnreadMinutes,
    status,
  };
}

async function getSummary() {
  await ensureClassified();
  const stats = await getStats();
  const { overview, unreadDigest, source } = await summarizeInbox({
    messages: MOCK_MESSAGES,
    contacts: MOCK_CONTACTS,
    stats,
  });

  return {
    generatedAt: new Date().toISOString(),
    classifier: classifierMode(),
    summarizer: source,
    overview,
    unreadDigest,
  };
}

async function sendMessage({ to, body }) {
  // TODO: Replace with real send API
  // e.g. await axios.post(`${process.env.WHATSAPP_API_BASE}/messages`, { messaging_product: 'whatsapp', to, type: 'text', text: { body } }, ...)
  console.log(`[WhatsApp Adapter] MOCK send to ${to}: ${body}`);
  return { success: true, messageId: `mock_${Date.now()}`, timestamp: new Date().toISOString() };
}

module.exports = { getMessages, getConversations, getStats, getSummary, sendMessage };
