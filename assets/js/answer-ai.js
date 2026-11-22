/* Veridellindo — asking Workers AI to organise an answer, and nothing more.
 *
 * The page has already read the article and split it into sentences. This module
 * asks /api/answer (a Pages Function on this site, backed by the Workers AI
 * binding) to say which section answers the question and in what order its
 * sentences should be read. The model never supplies text that is shown as
 * fact: every sentence on the page still comes from the source.
 *
 * Everything here fails soft. If the deployment has no AI binding, if the
 * request is slow, if the reply is malformed, or if the browser is offline, the
 * caller gets `null` and keeps its own keyword ranking — the page never waits on
 * this and never shows an error for it.
 */

const ENDPOINT = '/api/answer';
const TIMEOUT_MS = 12_000;
const MAX_SECTIONS = 8;
const MAX_SENTENCES = 40;
const MAX_SENTENCE_CHARS = 400;
const MAX_TOTAL_CHARS = 24_000;

/** The sections we are willing to send: bounded, so a long article stays small. */
export function buildAnswerPayload({ question, title = '', lang = 'en', sections = [] } = {}) {
  const out = [];
  let budget = MAX_TOTAL_CHARS;
  for (const section of sections.slice(0, MAX_SECTIONS)) {
    const id = String(section?.id ?? '');
    if (!id) continue;
    const sentences = (Array.isArray(section.points) ? section.points : section.sentences || [])
      .filter((s) => typeof s === 'string' && s.trim())
      .slice(0, MAX_SENTENCES)
      .map((s) => s.trim().slice(0, MAX_SENTENCE_CHARS));
    const kept = [];
    for (const sentence of sentences) {
      if (budget - sentence.length < 0) break;
      budget -= sentence.length;
      kept.push(sentence);
    }
    if (!kept.length) continue;
    out.push({ id: id.slice(0, 80), title: String(section.title || '').slice(0, 160), sentences: kept });
  }
  return {
    question: String(question || '').trim().slice(0, 400),
    title: String(title || '').slice(0, 200),
    lang: String(lang || 'en').slice(0, 12),
    sections: out,
  };
}

/**
 * Check a reply against what was asked before any of it is used.
 * Unknown ids, a partial or duplicated order, or a question that is not
 * grounded in its section are all dropped — the section keeps its own title
 * and its own order.
 */
export function readAnswerReply(data, sections = []) {
  const byId = new Map(sections.map((s) => [s.id, s]));
  const items = Array.isArray(data?.sections) ? data.sections : [];
  const out = new Map();
  for (const item of items) {
    const section = byId.get(String(item?.id ?? ''));
    if (!section) continue;
    const entry = {};
    const question = String(item?.question ?? '').trim().replace(/\s+/g, ' ');
    if (question && question.length <= 160 && /\?\s*$/.test(question)) entry.question = question;
    const order = Array.isArray(item?.order) ? item.order.map(Number) : null;
    if (order
      && order.length === section.sentences.length
      && new Set(order).size === order.length
      && order.every((n) => Number.isInteger(n) && n >= 0 && n < section.sentences.length)) {
      entry.order = order;
    }
    if (entry.question || entry.order) out.set(section.id, entry);
  }
  return out;
}

/** Ask the endpoint. Resolves to a Map of { id → { question?, order? } }, or null. */
export async function requestAiAnswer(args, { fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const payload = buildAnswerPayload(args);
  if (!payload.question || !payload.sections.length) return null;
  if (typeof fetchImpl !== 'function') return null;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.ok === false) return null;
    const map = readAnswerReply(data, payload.sections);
    return map.size ? map : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Apply an organisation to the topic blocks the page is about to render.
 * A section's heading becomes the question it answers, and its lines take the
 * order the model chose. Both are optional and both are already validated.
 */
export function applyOrganisation(topics = [], organised = null) {
  if (!organised || !organised.size) return topics;
  return topics.map((topic) => {
    const entry = organised.get(topic.id);
    if (!entry) return topic;
    const next = { ...topic };
    if (entry.question) next.title = entry.question;
    if (entry.order) {
      const points = topic.points || [];
      next.points = entry.order.map((i) => points[i]).filter((p) => typeof p === 'string');
      // The block's short read and its full read are the same lines at two
      // lengths, so both follow the new order.
      next.short = next.points.slice(0, 2);
      if (Array.isArray(topic.full)) next.full = next.points;
    }
    return next;
  });
}
