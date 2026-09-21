/**
 * Message Store
 * ─────────────────────────────────────────────────────────────────────────────
 * Simple file-backed persistence (backend/data/store.json). Survives restarts,
 * no external database required. Seeded once with sample data on first run —
 * after that, real inbound messages come from the webhook and real outbound
 * messages come from sendMessage; the seed is never re-applied.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const SEED = {
  contacts: [
    { id: 'c1', name: 'Ahmed Raza', phone: '+923001234567', avatar: 'AR', type: 'individual', isImportant: true },
    { id: 'c3', name: 'Bilal Khan', phone: '+923451112233', avatar: 'BK', type: 'individual', isImportant: true },
    { id: 'c4', name: 'Fatima Sheikh', phone: '+923331234567', avatar: 'FS', type: 'individual', isImportant: false },
    { id: 'g1', name: 'Events Committee', phone: 'group', avatar: 'EC', type: 'group', memberCount: 8, isImportant: true },
    { id: 'g2', name: 'Finance Subcommittee', phone: 'group', avatar: 'FS', type: 'group', memberCount: 5, isImportant: true },
  ],
  messages: [
    { id: 'm1', contactId: 'c1', direction: 'inbound', body: 'Assalam o Alaikum! I wanted to follow up on the committee meeting scheduled for next week. Can we confirm the venue?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'read' },
    { id: 'm2', contactId: 'c1', direction: 'outbound', body: 'Walaikum Assalam! Yes, the venue is confirmed — Serena Hotel, Hall 3. I\'ll send the formal invite shortly.', timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), status: 'delivered', isImportant: false, priority: 'low', tags: [] },
    { id: 'm3', contactId: 'g2', direction: 'inbound', body: 'The budget proposal has been revised. Please review the attached document before Friday.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'unread' },
    { id: 'm4', contactId: 'c3', direction: 'inbound', body: 'We need to discuss the quarterly report. Are you available tomorrow afternoon around 3pm?', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'read' },
    { id: 'm5', contactId: 'c3', direction: 'outbound', body: 'Tomorrow at 3pm works perfectly. I\'ll set up a call link and share it with you.', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), status: 'read', isImportant: false, priority: 'low', tags: [] },
    { id: 'm6', contactId: 'c4', direction: 'inbound', body: 'Just checking in — the subcommittee members have been notified about the policy changes.', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'read' },
    { id: 'm7', contactId: 'g2', direction: 'inbound', body: 'Reminder: membership fees collection deadline is this Sunday. Should we send a bulk reminder?', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), status: 'unread' },
    { id: 'm8', contactId: 'g1', direction: 'inbound', body: 'The event decorations vendor has confirmed. They need a 50% advance payment by Wednesday.', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), status: 'unread' },
    { id: 'm9', contactId: 'g2', direction: 'outbound', body: 'Thanks all, I will review and get back to you by EOD.', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), status: 'delivered', isImportant: false, priority: 'low', tags: [] },
    { id: 'm10', contactId: 'g1', direction: 'inbound', body: 'Also, the caterer is asking for the final headcount. Can you confirm by tomorrow morning?', timestamp: new Date(Date.now() - 1000 * 60 * 235).toISOString(), status: 'unread' },
  ],
};

let cache = null;

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
}

function load() {
  if (cache) return cache;
  ensureFile();
  cache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return cache;
}

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2));
}

function getContacts() {
  return load().contacts;
}

function getMessages() {
  return load().messages;
}

function findContactByPhone(phone) {
  return load().contacts.find(c => c.phone === phone);
}

function upsertContact(contact) {
  const data = load();
  const idx = data.contacts.findIndex(c => c.id === contact.id);
  if (idx >= 0) data.contacts[idx] = { ...data.contacts[idx], ...contact };
  else data.contacts.push(contact);
  persist();
  return data.contacts.find(c => c.id === contact.id);
}

function addMessage(message) {
  const data = load();
  data.messages.push(message);
  persist();
  return message;
}

function updateMessage(id, patch) {
  const data = load();
  const idx = data.messages.findIndex(m => m.id === id);
  if (idx === -1) return null;
  data.messages[idx] = { ...data.messages[idx], ...patch };
  persist();
  return data.messages[idx];
}

module.exports = { getContacts, getMessages, findContactByPhone, upsertContact, addMessage, updateMessage };
