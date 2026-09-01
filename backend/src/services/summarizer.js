/**
 * Inbox Summarizer
 * ─────────────────────────────────────────────────────────────────────────────
 * Turns the current message list into a plain-English overview:
 *   - `overview`     : 3-5 bullets describing the state of the WhatsApp inbox
 *   - `unreadDigest` : one simple bullet per unread message that needs a reply
 *
 * Uses the same LLM config as the classifier (Groq / any OpenAI-compatible API).
 * Falls back to a composed summary when no key is set or the call fails.
 * Cached briefly so the 30s dashboard poll doesn't re-bill on every refresh.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LLM = {
  key: process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '',
  baseUrl: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
  model: process.env.SUMMARY_MODEL || process.env.CLASSIFIER_MODEL || 'qwen/qwen3.8-27b',
};

function extractJson(text = '') {
  const fenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in response');
  return JSON.parse(fenced.slice(start, end + 1));
}

const SYSTEM_PROMPT = `You brief a busy committee coordinator on their WhatsApp inbox.
You are given the recent messages with sender, group/individual, read status and
an importance tag. Produce a short, plain-English briefing.

Return ONLY JSON, no prose, no code fence:
{
  "overview": ["3 to 5 short bullets: overall volume, what needs attention, deadlines, money, anything waiting too long"],
  "unreadDigest": [
    {"contact": "<sender name>", "priority": "high"|"medium"|"low", "point": "<one short sentence: what they need>"}
  ]
}
Rules: one unreadDigest entry per UNREAD inbound message only. Keep every string
under 16 words. No emojis. Plain language a non-technical reader understands.`;

let cache = { key: '', at: 0, value: null };
const TTL_MS = 60 * 1000;

function cacheKey(messages) {
  return messages.map(m => `${m.id}:${m.status}:${m.isImportant ? 1 : 0}`).join('|');
}

function contactName(id, contacts) {
  return contacts.find(c => c.id === id)?.name || 'Unknown';
}

function fallback(messages, contacts, stats) {
  const unread = messages.filter(m => m.direction === 'inbound' && m.status === 'unread');
  const important = messages.filter(m => m.isImportant);
  const rank = { high: 0, medium: 1, low: 2 };

  const overview = [];
  overview.push(`${stats.totalMessages} messages tracked across ${stats.activeContacts} chats, ${stats.todayMessages} today.`);
  if (unread.length) overview.push(`${unread.length} unread message${unread.length === 1 ? '' : 's'} waiting for a reply.`);
  else overview.push('No unread messages — you are caught up.');
  if (stats.urgentUnread) overview.push(`${stats.urgentUnread} of those are marked important.`);
  if (stats.oldestUnreadMinutes != null) {
    const h = Math.round(stats.oldestUnreadMinutes / 60);
    overview.push(`Oldest unread has been waiting about ${h < 1 ? 'under an hour' : h + ' hour' + (h === 1 ? '' : 's')}.`);
  }
  overview.push(`Response rate is ${stats.responseRate}%.`);

  const unreadDigest = unread
    .sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3))
    .map(m => ({
      contact: contactName(m.contactId, contacts),
      priority: m.priority || 'medium',
      point: m.importanceReason || m.body.slice(0, 80),
    }));

  return { overview, unreadDigest, source: 'composed' };
}

async function callLLM(messages, contacts) {
  const lines = messages.map(m => ({
    from: contactName(m.contactId, contacts),
    kind: contacts.find(c => c.id === m.contactId)?.type || 'individual',
    direction: m.direction,
    status: m.status,
    importance: m.isImportant ? (m.priority || 'medium') : 'not important',
    text: m.body,
  }));

  const res = await fetch(`${LLM.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM.key}` },
    body: JSON.stringify({
      model: LLM.model,
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(lines, null, 1) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const parsed = extractJson(data.choices?.[0]?.message?.content || '{}');

  return {
    overview: (Array.isArray(parsed.overview) ? parsed.overview : []).map(String).slice(0, 6),
    unreadDigest: (Array.isArray(parsed.unreadDigest) ? parsed.unreadDigest : []).map(d => ({
      contact: String(d.contact || 'Unknown'),
      priority: ['high', 'medium', 'low'].includes(d.priority) ? d.priority : 'medium',
      point: String(d.point || '').slice(0, 160),
    })),
    source: 'llm',
  };
}

async function summarizeInbox({ messages, contacts, stats }) {
  const key = cacheKey(messages);
  if (cache.key === key && Date.now() - cache.at < TTL_MS) return cache.value;

  let value;
  if (LLM.key) {
    try {
      value = await callLLM(messages, contacts);
      if (!value.overview.length) value = fallback(messages, contacts, stats);
    } catch (err) {
      console.warn(`[Summarizer] LLM call failed (${err.message}); using composed summary`);
      value = fallback(messages, contacts, stats);
    }
  } else {
    value = fallback(messages, contacts, stats);
  }

  cache = { key, at: Date.now(), value };
  return value;
}

module.exports = { summarizeInbox };
