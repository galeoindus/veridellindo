/**
 * Veridellindo — the Amigo chat endpoint, on this site.
 *
 * Why this exists: the chat used to need a separate Cloudflare Worker deployed
 * by hand, with its URL pasted into a settings box. If you had not done that,
 * the page did nothing — which is exactly what "it is not connected" looked
 * like. This Function runs on the same origin as the page and uses the
 * `AI` binding the Pages project already declares, so the chat works the
 * moment the site is deployed, with no Worker to create and no key to paste.
 *
 * Providers, in order:
 *   1. Cloudflare Workers AI — no provider key required; daily included usage applies.
 *   2. OpenRouter `:free` models — only if OPENROUTER_API_KEY_* is set.
 *
 * Contract: POST { messages, model?, max_tokens?, temperature?, stream? }
 *   → JSON { choices: [{ message: { content } }], provider, model }
 *   → or an SSE stream of { type: "delta" | "done" | "error" } frames
 *
 * Nothing about the caller is stored, and no key ever reaches the browser.
 */

const WORKERS_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const WORKERS_SMALL = '@cf/google/gemma-4-26b-a4b-it';
const WORKERS_VISION = '@cf/meta/llama-4-scout-17b-16e-instruct';

const WORKERS_MODELS = new Set([WORKERS_MODEL, WORKERS_SMALL, WORKERS_VISION]);

/* Free OpenRouter ids, tried in order. The router picks whatever is free and
   available; the explicit ids are fallbacks for when it is busy. */
const OPENROUTER_FREE = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen-2.5-72b-instruct:free',
];

const MAX_MESSAGES = 40;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_CHARS = 60_000;

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

function normaliseMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) throw new Error('messages must be a non-empty array');
  if (messages.length > MAX_MESSAGES) throw new Error(`messages must contain at most ${MAX_MESSAGES} items`);
  const roles = new Set(['system', 'user', 'assistant']);
  return messages.map((message) => {
    if (!message || !roles.has(message.role)) throw new Error('Each message needs a valid role');
    if (typeof message.content === 'string') {
      return { role: message.role, content: message.content.slice(0, MAX_CHARS) };
    }
    if (Array.isArray(message.content)) {
      const parts = message.content.slice(0, 12).map((part) => {
        if (part && part.type === 'image_url' && part.image_url?.url?.startsWith('data:image/')) {
          return { type: 'image_url', image_url: { url: part.image_url.url } };
        }
        return { type: 'text', text: String(part?.text ?? '').slice(0, MAX_CHARS) };
      });
      return { role: message.role, content: parts };
    }
    throw new Error('Each message needs text content');
  });
}

function hasImage(messages) {
  return messages.some((m) => Array.isArray(m.content)
    && m.content.some((p) => p?.type === 'image_url'));
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

/* Twelve keys, not six.
 *
 * A free OpenRouter tier is rate-limited per key, and the chat used to stop at
 * OPENROUTER_API_KEY_6 — anything past it was silently ignored, which looked
 * like "the extra keys do nothing". Every slot from 1 to 12 is read now, plus
 * the unnumbered legacy name.
 *
 * The list is also rotated per request: with several keys configured, every
 * call used to start at key 1, so key 1 took the rate limit for the whole site
 * while the rest sat idle. Each request now starts one slot further along, and
 * the fallback still walks the whole list from there. */
const MAX_OPENROUTER_KEYS = 12;
let keyCursor = 0;

export function openRouterKeys(env) {
  const keys = [];
  for (let i = 1; i <= MAX_OPENROUTER_KEYS; i += 1) {
    const key = String(env?.[`OPENROUTER_API_KEY_${i}`] || '').trim();
    if (key && !keys.includes(key)) keys.push(key);
  }
  const legacy = String(env?.OPENROUTER_API_KEY || '').trim();
  if (legacy && !keys.includes(legacy)) keys.push(legacy);
  if (keys.length < 2) return keys;
  keyCursor = (keyCursor + 1) % keys.length;
  return [...keys.slice(keyCursor), ...keys.slice(0, keyCursor)];
}

/* ── Workers AI ─────────────────────────────────────────────────────────── */

async function runWorkersAI(env, messages, model, maxTokens, temperature) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    throw new Error('Workers AI is not bound to this deployment');
  }
  const vision = hasImage(messages);
  const chosen = vision
    ? WORKERS_VISION
    : (WORKERS_MODELS.has(model) ? model : WORKERS_MODEL);
  const result = await env.AI.run(chosen, {
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: false,
  });
  const text = textOf(result);
  if (!String(text).trim()) throw new Error('Workers AI returned an empty answer');
  return { text: String(text), provider: 'workers-ai', model: chosen };
}

async function streamWorkersAI(env, messages, model, maxTokens, temperature, send) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    throw new Error('Workers AI is not bound to this deployment');
  }
  const vision = hasImage(messages);
  const chosen = vision ? WORKERS_VISION : (WORKERS_MODELS.has(model) ? model : WORKERS_MODEL);
  const stream = await env.AI.run(chosen, {
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });
  let full = '';
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const event = JSON.parse(payload);
        const piece = event.response ?? event.delta ?? '';
        if (piece) {
          full += piece;
          send({ type: 'delta', text: piece });
        }
      } catch { /* a partial frame; the next read completes it */ }
    }
  }
  // The stream can close without a trailing newline, which left a complete
  // final frame sitting in the buffer and turned a good answer into "empty".
  buffer += decoder.decode();
  for (const line of buffer.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const event = JSON.parse(payload);
      const piece = event.response ?? event.delta ?? '';
      if (piece) { full += piece; send({ type: 'delta', text: piece }); }
    } catch { /* a genuinely malformed tail is ignored, not fatal */ }
  }
  if (!full.trim()) throw new Error('Workers AI streamed an empty answer');
  return { text: full, provider: 'workers-ai', model: chosen };
}

/* ── OpenRouter, free models only ───────────────────────────────────────── */

async function runOpenRouter(env, messages, maxTokens, temperature, request) {
  const keys = openRouterKeys(env);
  if (!keys.length) throw new Error('No OpenRouter key is configured');
  const origin = request.headers.get('origin') || `https://${new URL(request.url).host}`;
  let lastError = 'OpenRouter did not answer';

  for (const model of OPENROUTER_FREE) {
   for (const key of keys) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
          // OpenRouter uses these for attribution and rate-limit tiering.
          'HTTP-Referer': origin,
          'X-Title': 'Amigo — Veridellindo',
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature, stream: false }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(60_000) : undefined,
      });
      if (!response.ok) {
        lastError = `OpenRouter ${response.status} on ${model}`;
        continue; // a retired or busy free id is a reason to try the next one
      }
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text || !String(text).trim()) {
        lastError = `OpenRouter returned an empty answer for ${model}`;
        continue;
      }
      return { text: String(text), provider: 'openrouter', model: data.model || model };
    } catch (error) {
      lastError = error?.message || lastError;
    }
   }
  }
  throw new Error(lastError);
}


/* ── F-03: a caller rate limit ─────────────────────────────────────────────
 * The same-origin check stops ordinary cross-site browser requests, but a
 * script outside a browser can omit the Origin header entirely. These counters
 * are per isolate — a fast local guard, not a global quota. A Cloudflare WAF
 * rate limit in front of /api/* is still required for real traffic. */
const CHAT_WINDOW_MS = 60_000;
const CHAT_PER_MINUTE = 12;
const chatHits = new Map();

function callerKey(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || 'unknown';
}

function overLimit(request) {
  const key = callerKey(request);
  const now = Date.now();
  const recent = (chatHits.get(key) || []).filter((t) => now - t < CHAT_WINDOW_MS);
  recent.push(now);
  chatHits.set(key, recent);
  if (chatHits.size > 5000) chatHits.clear();   // bounded memory
  return recent.length > CHAT_PER_MINUTE;
}

/* ── the handler ────────────────────────────────────────────────────────── */

export async function onRequestPost({ request, env = {} }) {
  if (!sameOrigin(request)) return json({ error: 'forbidden_origin' }, 403);
  if (overLimit(request)) {
    return json({ error: 'rate_limited', message: 'Too many messages in a minute. Give it a moment.' },
      429, { 'retry-after': '60' });
  }

  const type = String(request.headers.get('content-type') || '').toLowerCase();
  if (!type.includes('application/json')) return json({ error: 'unsupported_media_type' }, 415);

  const limited = await readJsonLimited(request, MAX_BODY_BYTES);
  if (limited.tooLarge) return json({ error: 'payload_too_large' }, 413);

  let body;
  try {
    body = JSON.parse(limited.text || '{}');
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  let messages;
  try {
    messages = normaliseMessages(body.messages);
  } catch (error) {
    return json({ error: 'invalid_messages', message: error.message }, 400);
  }

  // A 1024 default truncated long answers mid-sentence. The ceiling is what
  // the free models can actually emit, not an arbitrary small number.
  const maxTokens = Math.max(256, Math.min(Number(body.max_tokens) || 2048, 8192));
  // Number(undefined) is NaN, and NaN is not nullish, so `?? 0.6` never fired and
  // the provider received NaN. Validate after conversion, then clamp.
  const rawTemperature = Number(body.temperature);
  const temperature = Number.isFinite(rawTemperature)
    ? Math.max(0, Math.min(rawTemperature, 1.5))
    : 0.6;
  const model = String(body.model || '').slice(0, 120);
  const wantsStream = Boolean(body.stream);

  /* Auto: Workers AI first, OpenRouter only if Workers AI is unavailable.
     Workers AI needs no provider key, but its included daily allocation is
     capped; usage beyond it can require a paid Workers plan. */
  /* The picker in the UI sends provider and model. They used to be ignored: a
     non-Workers model was quietly replaced by the default Workers model, so the
     label could show one thing and the answer come from another. The requested
     provider is honoured against server-owned allowlists now. */
  const requestedProvider = String(body.provider || 'auto').toLowerCase();
  const hasOpenRouter = openRouterKeys(env).length > 0;
  let deltaSent = false;
  const sawDelta = () => deltaSent;

  const runWorkers = async (send) => (wantsStream && send
    ? streamWorkersAI(env, messages, model, maxTokens, temperature, send)
    : runWorkersAI(env, messages, model, maxTokens, temperature));

  const runOnce = async (send) => {
    if (requestedProvider === 'openrouter') {
      if (!hasOpenRouter) throw new Error('OpenRouter was requested but no key is configured');
      return runOpenRouter(env, messages, maxTokens, temperature, request);
    }
    if (requestedProvider === 'workers-ai') {
      return runWorkers(send);   // an explicit choice does not fall back silently
    }
    try {
      return await runWorkers(send);
    } catch (workersError) {
      if (!hasOpenRouter) throw workersError;
      // F-08: once a delta has been shown, swapping to another provider would
      // replace one answer with a different one under the same bubble. Stop and
      // say so instead of pretending the text came from one place.
      if (sawDelta()) throw new Error('The model stopped mid-answer. Send again to retry.');
      return runOpenRouter(env, messages, maxTokens, temperature, request);
    }
  };

  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        const sendTracked = (event) => {
          if (event && event.type === 'delta') deltaSent = true;
          send(event);
        };
        try {
          // A provider that returns the whole answer at once is a completed
          // response, not a progressive stream. The flag tells the client which
          // one it received, so it never pretends one is the other.
          send({ type: 'meta', streaming: true, requestId: crypto.randomUUID().slice(0, 12) });
          const result = await runOnce(sendTracked);
          send({ type: 'done', answer: result.text, provider: result.provider,
                 model: result.model, streamed: deltaSent });
        } catch (error) {
          send({ type: 'error', message: error?.message || 'The assistant could not answer.' });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store',
        connection: 'keep-alive',
      },
    });
  }

  try {
    const result = await runOnce(null);
    return json({
      choices: [{ message: { role: 'assistant', content: result.text } }],
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    return json({ error: 'assistant_unavailable', message: error?.message || 'The assistant could not answer.' }, 503);
  }
}

export async function onRequestGet({ env = {} }) {
  return json({
    ok: true,
    workersAI: Boolean(env?.AI && typeof env.AI.run === 'function'),
    openRouter: openRouterKeys(env).length > 0,
    models: [...WORKERS_MODELS],
  });
}

export async function onRequest({ request, env = {} }) {
  if (request.method === 'POST') return onRequestPost({ request, env });
  if (request.method === 'GET') return onRequestGet({ env });
  return json({ error: 'method_not_allowed' }, 405);
}
