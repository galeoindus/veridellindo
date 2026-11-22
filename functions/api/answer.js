/**
 * Veridellindo — the answer organiser, on this site.
 *
 * The Ask page already reads a real article and shows its sentences one per
 * line. What it could not do on its own was decide which section actually
 * answers the question, or put that section's lines in the order a reader wants
 * them — keyword overlap only counts words, so "What did Ashoka do after
 * Kalinga?" ranked the edicts and the war itself equally.
 *
 * This Function asks Workers AI to do that one job, and nothing else:
 *
 *   in   { question, title?, lang?, sections: [{ id, title, sentences[] }] }
 *   out  { ok, provider, model, sections: [{ id, question, order: [index] }] }
 *
 * It never writes the article. Every sentence the page shows is the sentence
 * that came from the source; the model only chooses an order and phrases a
 * question for a section. The reply is checked before it is used: unknown
 * section ids are dropped, an `order` that is not a permutation of the section's
 * own sentence indexes is dropped, a "question" that shares no content word with
 * the section it heads is dropped, and anything left over falls back to the
 * page's own ranking. A wrong or hostile model reply therefore degrades the
 * page, it cannot rewrite it.
 *
 * When the `AI` binding is absent the Function answers 503 and the page keeps
 * its deterministic ranking — no key, no error, no empty page.
 *
 * Nothing about the caller is stored. The text sent is the public article the
 * page just read.
 */

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const MAX_BODY_BYTES = 96 * 1024;
const MAX_SECTIONS = 8;
const MAX_SENTENCES = 40;
const MAX_SENTENCE_CHARS = 400;
const MAX_TOTAL_CHARS = 24_000;
const MAX_QUESTION_CHARS = 160;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

/** A request from this site's own pages, or one with no Origin (curl, tests). */
function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function readJsonLimited(request, maxBytes) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared && declared > maxBytes) return { tooLarge: true };
  if (!request.body) return { text: '' };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { tooLarge: true };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes) };
}

/** The sections the page may ask about, cut down to what the model can hold. */
export function normaliseSections(input) {
  if (!Array.isArray(input) || !input.length) return [];
  const out = [];
  let budget = MAX_TOTAL_CHARS;
  for (const raw of input.slice(0, MAX_SECTIONS)) {
    if (!raw || typeof raw.id !== 'string' || !raw.id) continue;
    const sentences = (Array.isArray(raw.sentences) ? raw.sentences : [])
      .filter((s) => typeof s === 'string' && s.trim())
      .slice(0, MAX_SENTENCES)
      .map((s) => s.trim().slice(0, MAX_SENTENCE_CHARS));
    if (!sentences.length) continue;
    const kept = [];
    for (const sentence of sentences) {
      if (budget - sentence.length < 0) break;
      budget -= sentence.length;
      kept.push(sentence);
    }
    if (!kept.length) break;
    out.push({
      id: raw.id.slice(0, 80),
      title: String(raw.title || '').slice(0, 160),
      sentences: kept,
    });
  }
  return out;
}

/** The prompt. Numbered sentences, so an order can be asked for and checked. */
export function buildPrompt({ question, title = '', lang = 'en', sections }) {
  const blocks = sections.map((section) => {
    const lines = section.sentences.map((s, i) => `${i}. ${s}`).join('\n');
    return `SECTION ${section.id} — ${section.title || '(untitled)'}\n${lines}`;
  }).join('\n\n');

  const system = [
    'You organise a reference article for a reader. You never write new facts.',
    'You are given a question and numbered sentences grouped by section.',
    'For each section, do two things:',
    '1. Write the question that this section answers, in the reader\'s language,',
    '   in at most 16 words, ending with a question mark. It must be answerable',
    '   from that section alone. Do not add facts the sentences do not contain.',
    '2. Order that section\'s sentence numbers from most to least useful for the',
    '   reader\'s question. Use every number exactly once, no others.',
    'Reply with JSON only, no prose and no code fence:',
    '{"sections":[{"id":"<section id>","question":"<question>","order":[<numbers>]}]}',
  ].join(' ');

  const user = `Question: ${question}\nArticle: ${title || '(untitled)'}\nLanguage: ${lang}\n\n${blocks}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'was', 'were', 'are', 'his', 'her', 'its', 'they', 'their', 'have', 'has', 'had', 'not', 'but', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 'did', 'does', 'do', 'of', 'in', 'on', 'to', 'a', 'an', 'is', 'it', 'as', 'by', 'at', 'be', 'or']);

function contentWords(text) {
  return new Set(String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w)));
}

/** Does this question actually come from the section it is put above? */
export function questionIsGrounded(question, section) {
  const asked = contentWords(question);
  if (!asked.size) return false;
  const body = contentWords(`${section.title || ''} ${section.sentences.join(' ')}`);
  let shared = 0;
  for (const word of asked) if (body.has(word)) shared += 1;
  // Two shared content words, or one when the question is very short: enough to
  // stop an invented topic, few enough to allow a paraphrase.
  return shared >= 2 || (shared >= 1 && asked.size <= 2);
}

/** Accept only the parts of the model's reply that check out. */
export function validateReply(reply, sections) {
  const byId = new Map(sections.map((s) => [s.id, s]));
  const items = Array.isArray(reply?.sections) ? reply.sections : [];
  const out = [];
  for (const item of items) {
    const section = byId.get(String(item?.id ?? ''));
    if (!section) continue;
    const result = { id: section.id };

    const question = String(item?.question ?? '').trim().replace(/\s+/g, ' ');
    if (question
      && question.length <= MAX_QUESTION_CHARS
      && /\?\s*$/.test(question)
      && questionIsGrounded(question, section)) {
      result.question = question;
    }

    const order = Array.isArray(item?.order) ? item.order.map(Number) : null;
    if (order
      && order.length === section.sentences.length
      && new Set(order).size === order.length
      && order.every((n) => Number.isInteger(n) && n >= 0 && n < section.sentences.length)) {
      result.order = order;
    }

    if (result.question || result.order) out.push(result);
  }
  return out;
}

function textOf(result) {
  if (typeof result === 'string') return result;
  if (!result || typeof result !== 'object') return '';
  if (typeof result.response === 'string') return result.response;
  if (typeof result.output_text === 'string') return result.output_text;
  const choice = result.choices?.[0];
  if (choice?.message && typeof choice.message.content === 'string') return choice.message.content;
  return '';
}

/** The model is asked for JSON; a code fence or a stray sentence still happens. */
export function parseReply(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function organise(env, messages) {
  const models = [MODEL, FALLBACK_MODEL];
  let lastError = null;
  for (const model of models) {
    try {
      const result = await env.AI.run(model, {
        messages,
        max_tokens: 900,
        temperature: 0.2,
        stream: false,
      });
      const text = textOf(result);
      if (!String(text).trim()) throw new Error('empty reply');
      return { text: String(text), model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Workers AI did not answer');
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Cross-origin request refused' }, 403);

  const body = await readJsonLimited(request, MAX_BODY_BYTES);
  if (body.tooLarge) return json({ ok: false, error: 'Request too large' }, 413);

  let payload;
  try {
    payload = JSON.parse(body.text || '{}');
  } catch {
    return json({ ok: false, error: 'Body must be JSON' }, 400);
  }

  const question = String(payload?.question ?? '').trim().slice(0, 400);
  if (!question) return json({ ok: false, error: 'A question is required' }, 400);

  const sections = normaliseSections(payload?.sections);
  if (!sections.length) return json({ ok: false, error: 'No sections to organise' }, 400);

  if (!env?.AI || typeof env.AI.run !== 'function') {
    // No binding: the page keeps its own ranking. This is not an error state.
    return json({ ok: false, configured: false, error: 'Workers AI is not bound to this deployment' }, 503);
  }

  const messages = buildPrompt({
    question,
    title: String(payload?.title ?? '').slice(0, 200),
    lang: String(payload?.lang ?? 'en').slice(0, 12),
    sections,
  });

  try {
    const { text, model } = await organise(env, messages);
    const reply = parseReply(text);
    const organised = validateReply(reply, sections);
    return json({
      ok: organised.length > 0,
      provider: 'workers-ai',
      model,
      sections: organised,
    });
  } catch (error) {
    return json({ ok: false, configured: true, error: String(error?.message || error) }, 502);
  }
}

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    configured: Boolean(env?.AI && typeof env.AI.run === 'function'),
    model: MODEL,
  });
}
