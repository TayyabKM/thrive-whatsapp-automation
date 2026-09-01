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
  { id: 'c1', name: 'Ahmed Raza', phone: '+923001234567', avatar: 'AR', isImportant: true },
  { id: 'c2', name: 'Sana Malik', phone: '+923219876543', avatar: 'SM', isImportant: false },
  { id: 'c3', name: 'Bilal Khan', phone: '+923451112233', avatar: 'BK', isImportant: true },
  { id: 'c4', name: 'Fatima Sheikh', phone: '+923331234567', avatar: 'FS', isImportant: false },
  { id: 'c5', name: 'Usman Ali', phone: '+923125550199', avatar: 'UA', isImportant: false },
  { id: 'c6', name: 'Nadia Hussain', phone: '+923456789012', avatar: 'NH', isImportant: true },
];

const MOCK_MESSAGES = [
  { id: 'm1', contactId: 'c1', direction: 'inbound', body: 'Assalam o Alaikum! I wanted to follow up on the committee meeting scheduled for next week. Can we confirm the venue?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'read', isImportant: true, tags: ['meeting', 'committee'] },
  { id: 'm2', contactId: 'c1', direction: 'outbound', body: 'Walaikum Assalam! Yes, the venue is confirmed — Serena Hotel, Hall 3. I\'ll send the formal invite shortly.', timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), status: 'delivered', isImportant: false, tags: [] },
  { id: 'm3', contactId: 'c2', direction: 'inbound', body: 'The budget proposal has been revised. Please review the attached document before Friday.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'unread', isImportant: true, tags: ['budget', 'urgent'] },
  { id: 'm4', contactId: 'c3', direction: 'inbound', body: 'We need to discuss the quarterly report. Are you available tomorrow afternoon around 3pm?', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'read', isImportant: true, tags: ['meeting'] },
  { id: 'm5', contactId: 'c3', direction: 'outbound', body: 'Tomorrow at 3pm works perfectly. I\'ll set up a call link and share it with you.', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), status: 'read', isImportant: false, tags: [] },
  { id: 'm6', contactId: 'c4', direction: 'inbound', body: 'Just checking in — the subcommittee members have been notified about the policy changes.', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'read', isImportant: false, tags: ['subcommittee'] },
  { id: 'm7', contactId: 'c5', direction: 'inbound', body: 'Reminder: membership fees collection deadline is this Sunday. Should we send a bulk reminder?', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), status: 'unread', isImportant: true, tags: ['finance', 'deadline'] },
  { id: 'm8', contactId: 'c6', direction: 'inbound', body: 'The event decorations vendor has confirmed. They need a 50% advance payment by Wednesday.', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), status: 'unread', isImportant: true, tags: ['event', 'payment'] },
  { id: 'm9', contactId: 'c2', direction: 'outbound', body: 'Thanks Sana, I will review and get back to you by EOD.', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), status: 'delivered', isImportant: false, tags: [] },
  { id: 'm10', contactId: 'c6', direction: 'inbound', body: 'Also, the caterer is asking for the final headcount. Can you confirm by tomorrow morning?', timestamp: new Date(Date.now() - 1000 * 60 * 235).toISOString(), status: 'unread', isImportant: true, tags: ['event', 'catering'] },
];

// ── Public API (replace these bodies with real API calls) ─────────────────────

async function getMessages({ filter = 'all', search = '', limit = 50 } = {}) {
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

  return {
    totalMessages: total,
    unreadMessages: unread,
    importantMessages: important,
    inboundMessages: inbound,
    outboundMessages: outbound,
    todayMessages: todayMsgs.length,
    activeContacts: MOCK_CONTACTS.length,
    responseRate: Math.round((outbound / inbound) * 100),
  };
}

async function getSummary() {
  // TODO: Replace with AI-generated summary (e.g. OpenAI / Claude API)
  return {
    generatedAt: new Date().toISOString(),
    highlights: [
      { priority: 'high', text: 'Budget proposal from Sana Malik needs review before Friday.' },
      { priority: 'high', text: 'Event vendor requires 50% advance payment by Wednesday — Nadia Hussain.' },
      { priority: 'high', text: 'Membership fees collection deadline is this Sunday — bulk reminder pending.' },
      { priority: 'medium', text: 'Quarterly report call scheduled with Bilal Khan tomorrow at 3pm.' },
      { priority: 'medium', text: 'Caterer needs final headcount confirmation by tomorrow morning.' },
      { priority: 'low', text: 'Committee meeting venue confirmed: Serena Hotel, Hall 3.' },
    ],
    pendingActions: [
      'Review revised budget proposal (Sana Malik)',
      'Approve advance payment for event vendor (Nadia Hussain)',
      'Confirm caterer headcount',
      'Send membership fee reminder to members',
    ],
  };
}

async function sendMessage({ to, body }) {
  // TODO: Replace with real send API
  // e.g. await axios.post(`${process.env.WHATSAPP_API_BASE}/messages`, { messaging_product: 'whatsapp', to, type: 'text', text: { body } }, ...)
  console.log(`[WhatsApp Adapter] MOCK send to ${to}: ${body}`);
  return { success: true, messageId: `mock_${Date.now()}`, timestamp: new Date().toISOString() };
}

module.exports = { getMessages, getConversations, getStats, getSummary, sendMessage };
