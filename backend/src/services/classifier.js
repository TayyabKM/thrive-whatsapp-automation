/**
 * Message Importance Classifier
 * ─────────────────────────────────────────────────────────────────────────────
 * Decides whether an inbound WhatsApp message is "important" and why.
 *
 * Primary path : an LLM — Groq (GROQ_API_KEY) or any OpenAI-compatible endpoint.
 * Fallback path: keyword heuristic — used when no key is configured or the API
 *                call fails, so the dashboard always keeps working.
 *
 * Results are cached per message id so repeated dashboard polls don't re-bill.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LLM = {
  key: process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '',
  baseUrl: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
  model: process.env.CLASSIFIER_MODEL || 'qwen/qwen3.8-27b',
};

// Models sometimes wrap JSON in prose or reasoning — pull out the first object.
function extractJson(text = '') {
  const fenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in response');
  return JSON.parse(fenced.slice(start, end + 1));
}

const cache = new Map(); // messageId -> { isImportant, priority, reason, tags, source }

const SYSTEM_PROMPT = `You triage WhatsApp messages for a busy committee coordinator.
Decide if a single message is IMPORTANT — meaning it needs the coordinator's
attention or action soon. Signals of importance:
- a deadline, due date, or time-sensitive request
- money: payments, invoices, budgets, advances, fees
- a decision, approval, or confirmation is being asked of the reader
- meetings/events that need scheduling or a headcount
- escalations, complaints, or anything that blocks other people

NOT important: casual acknowledgements ("thanks", "ok noted"), FYI updates with
no action, small talk, greetings.

Reply with ONLY a compact JSON object, no prose, no code fence:
{"isImportant": boolean, "priority": "high"|"medium"|"low", "reason": "<8 words max, why>", "tags": ["<lowercase topic>", ...]}
"priority" is "low" whenever isImportant is false.`;

const KEYWORDS = [
  'urgent', 'asap', 'deadline', 'due', 'today', 'tomorrow', 'payment', 'pay',
  'invoice', 'budget', 'advance', 'fee', 'fees', 'approve', 'approval', 'confirm',
  'confirmation', 'headcount', 'reminder', 'immediately', 'escalate', 'complaint',
];

function heuristic(body = '') {
  const lower = body.toLowerCase();
  const hits = KEYWORDS.filter(k => lower.includes(k));
  const isImportant = hits.length > 0;
  return {
    isImportant,
    priority: hits.length >= 2 ? 'high' : isImportant ? 'medium' : 'low',
    reason: isImportant ? `Mentions: ${hits.slice(0, 3).join(', ')}` : 'No action signals',
    tags: hits.slice(0, 3),
    source: 'heuristic',
  };
}

function normalize(parsed) {
  return {
    isImportant: !!parsed.isImportant,
    priority: ['high', 'medium', 'low'].includes(parsed.priority)
      ? parsed.priority
      : (parsed.isImportant ? 'medium' : 'low'),
    reason: String(parsed.reason || '').slice(0, 120),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => String(t).toLowerCase()).slice(0, 5) : [],
    source: 'llm',
  };
}

async function classifyWithLLM(message) {
  const res = await fetch(`${LLM.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM.key}`,
    },
    body: JSON.stringify({
      model: LLM.model,
      temperature: 0,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `From: ${message.contact?.name || message.contactId || 'unknown'}
Direction: ${message.direction}
Message: """${message.body}"""`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return normalize(extractJson(content));
}

async function classifyMessage(message) {
  if (message.direction === 'outbound') {
    return { isImportant: false, priority: 'low', reason: 'Outbound message', tags: [], source: 'rule' };
  }
  if (cache.has(message.id)) return cache.get(message.id);

  let result;
  if (LLM.key) {
    try {
      result = await classifyWithLLM(message);
    } catch (err) {
      console.warn(`[Classifier] LLM call failed (${err.message}); using heuristic`);
      result = heuristic(message.body);
    }
  } else {
    result = heuristic(message.body);
  }

  if (message.id) cache.set(message.id, result);
  return result;
}

// Classify a list, bounded concurrency, returns a Map keyed by message id.
async function classifyMany(messages, concurrency = 4) {
  const out = new Map();
  const queue = [...messages];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const m = queue.shift();
      out.set(m.id, await classifyMessage(m));
    }
  });
  await Promise.all(workers);
  return out;
}

function classifierMode() {
  return LLM.key ? `llm:${LLM.model}` : 'heuristic';
}

module.exports = { classifyMessage, classifyMany, classifierMode };
