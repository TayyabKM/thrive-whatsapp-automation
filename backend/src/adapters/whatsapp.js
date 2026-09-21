/**
 * WhatsApp Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * The only place that talks to the WhatsApp API and the message store.
 *
 * Inbound messages arrive via the webhook (Meta pushes them — there's no bulk
 * "list messages" endpoint) and are persisted in ./store.js. sendMessage calls
 * the real Graph API when WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID are
 * set; otherwise it mocks the send but still persists the message, so the UI
 * works identically either way.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const store = require('../store');
const bus = require('../services/bus');
const { classifyMany, classifierMode } = require('../services/classifier');
const { summarizeInbox } = require('../services/summarizer');

// ── AI enrichment ────────────────────────────────────────────────────────────
// Classifies any inbound message that doesn't have a priority yet, then
// persists the result to the store — so it only ever runs once per message,
// even across restarts.
let classifying = false;
async function ensureClassified() {
  if (classifying) return;
  const messages = store.getMessages();
  const contacts = store.getContacts();
  const toClassify = messages.filter(m => m.direction === 'inbound' && m.priority === undefined);
  if (!toClassify.length) return;

  classifying = true;
  try {
    const withContact = toClassify.map(m => ({ ...m, contact: contacts.find(c => c.id === m.contactId) }));
    const results = await classifyMany(withContact);
    for (const m of toClassify) {
      const r = results.get(m.id) || { isImportant: false, priority: 'low', reason: '', tags: [], source: 'rule' };
      store.updateMessage(m.id, {
        isImportant: r.isImportant,
        priority: r.priority,
        importanceReason: r.reason,
        importanceSource: r.source,
        tags: r.tags,
      });
    }
    console.log(`[Classifier] Tagged ${toClassify.length} message(s) via ${classifierMode()}`);
  } catch (err) {
    console.error('[Classifier] enrichment failed:', err.message);
  } finally {
    classifying = false;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

async function getMessages({ filter = 'all', search = '', limit = 50 } = {}) {
  await ensureClassified();
  const contacts = store.getContacts();
  let messages = [...store.getMessages()].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (filter === 'unread') messages = messages.filter(m => m.status === 'unread');
  if (filter === 'important') messages = messages.filter(m => m.isImportant);
  if (filter === 'inbound') messages = messages.filter(m => m.direction === 'inbound');
  if (search) messages = messages.filter(m => m.body.toLowerCase().includes(search.toLowerCase()));

  return messages.slice(0, limit).map(m => ({
    ...m,
    contact: contacts.find(c => c.id === m.contactId),
  }));
}

async function getConversations() {
  await ensureClassified();
  const contacts = store.getContacts();
  const allMessages = store.getMessages();

  const conversations = contacts.map(contact => {
    const msgs = allMessages
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
  const messages = store.getMessages();
  const contacts = store.getContacts();

  const total = messages.length;
  const unread = messages.filter(m => m.status === 'unread').length;
  const important = messages.filter(m => m.isImportant).length;
  const inbound = messages.filter(m => m.direction === 'inbound').length;
  const outbound = messages.filter(m => m.direction === 'outbound').length;

  const today = new Date();
  const todayMsgs = messages.filter(m => {
    const d = new Date(m.timestamp);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  });

  const needsReply = messages.filter(m => m.direction === 'inbound' && m.status === 'unread');
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
    activeContacts: contacts.length,
    responseRate: inbound ? Math.round((outbound / inbound) * 100) : 0,
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
    messages: store.getMessages(),
    contacts: store.getContacts(),
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

function isLiveConfigured() {
  return !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function sendMessage({ to, body }) {
  let contact = store.findContactByPhone(to);
  if (!contact) {
    contact = store.upsertContact({
      id: `c_${Date.now()}`,
      name: to,
      phone: to,
      avatar: to.slice(-2).toUpperCase(),
      type: 'individual',
      isImportant: false,
    });
  }

  let result;
  if (isLiveConfigured()) {
    try {
      const res = await fetch(`${process.env.WHATSAPP_API_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Graph API ${res.status}`);
      result = { success: true, messageId: data.messages?.[0]?.id || `wa_${Date.now()}`, timestamp: new Date().toISOString(), live: true };
    } catch (err) {
      console.error('[WhatsApp Adapter] Live send failed:', err.message);
      result = { success: false, error: err.message, live: true };
    }
  } else {
    console.log(`[WhatsApp Adapter] MOCK send to ${to}: ${body}`);
    result = { success: true, messageId: `mock_${Date.now()}`, timestamp: new Date().toISOString(), live: false };
  }

  const message = store.addMessage({
    id: result.messageId || `m_${Date.now()}`,
    contactId: contact.id,
    direction: 'outbound',
    body,
    timestamp: new Date().toISOString(),
    status: result.success ? 'delivered' : 'failed',
    isImportant: false,
    priority: 'low',
    importanceReason: '',
    importanceSource: 'rule',
    tags: [],
  });
  bus.emit('message', { ...message, contact });

  return result;
}

module.exports = { getMessages, getConversations, getStats, getSummary, sendMessage, isLiveConfigured };
