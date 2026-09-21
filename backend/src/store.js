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
  contacts: [],
  messages: [],
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
