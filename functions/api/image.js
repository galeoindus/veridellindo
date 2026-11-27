/**
 * Veridellindo — image generation on Workers AI.
 *
 * FLUX.1 schnell uses the `AI` binding this Pages project already has. No
 * provider key is needed, but only the daily included Workers AI allocation
 * is free; usage and plan limits still apply.
 *
 * What it refuses, and why: a request from another origin, a body that is not
 * JSON or is larger than a prompt could need, a prompt that is empty or too
 * long, and more than a few pictures a minute from one caller. The counters are
 * per isolate — a fast guard, not a global limit. Put a Cloudflare WAF rate
 * limit in front of /api/* if this ever gets real traffic.
 */
const MODEL = '@cf/black-forest-labs/flux-1-schnell';
const MAX_PROMPT = 400;
const MAX_BODY_BYTES = 4 * 1024;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const PER_CALLER_MS = 8_000;
const PER_CALLER_MINUTE = 12;
const DAILY_LIMIT = 200;

const callerHits = new Map();
let day = { key: '', count: 0 };

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extra,
    },
  });
}

const clean = (value, max) => String(value || '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const dayKey = () => new Date().toISOString().slice(0, 10);

function callerId(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

function throttle(request) {
  const now = Date.now();
  const key = callerId(request);
  const today = dayKey();
  if (day.key !== today) day = { key: today, count: 0 };
  if (day.count >= DAILY_LIMIT) {
    return json({ error: 'daily_quota_reached', message: 'The daily image allowance is used up.' }, 429, { 'retry-after': '3600' });
  }
  const entry = callerHits.get(key) || { minute: [], last: 0 };
  entry.minute = entry.minute.filter((at) => now - at < 60_000);
  if (entry.last && now - entry.last < PER_CALLER_MS) {
    callerHits.set(key, entry);
    const wait = Math.ceil((PER_CALLER_MS - (now - entry.last)) / 1000) || 1;
    return json({ error: 'rate_limited', message: 'One picture at a time — give it a few seconds.' }, 429, { 'retry-after': String(wait) });
  }
  if (entry.minute.length >= PER_CALLER_MINUTE) {
    callerHits.set(key, entry);
    return json({ error: 'rate_limited', message: 'That is a lot of pictures in a minute.' }, 429, { 'retry-after': '60' });
  }
  entry.minute.push(now);
  entry.last = now;
  callerHits.set(key, entry);
  day.count += 1;
  if (callerHits.size > 500) {
    for (const [k, v] of callerHits) if (!v.minute.length || now - v.last > 300_000) callerHits.delete(k);
  }
  return null;
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

/** Base64 without Node's Buffer: Pages runs on the Workers runtime. */
function toBase64(bytes) {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env = {} }) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    return json({ error: 'not_configured', message: 'Image generation is not available on this deployment.' }, 501);
  }
  if (!sameOrigin(request)) return json({ error: 'forbidden_origin' }, 403);

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
  if (!body || typeof body.prompt !== 'string') {
    return json({ error: 'invalid_prompt', message: 'Send { "prompt": "…" }.' }, 400);
  }

  const prompt = clean(body.prompt, MAX_PROMPT);
  if (prompt.length < 3) return json({ error: 'invalid_prompt', message: 'Describe the picture you want.' }, 400);

  const blocked = throttle(request);
  if (blocked) return blocked;

  try {
    const result = await env.AI.run(MODEL, { prompt, steps: 4 });
    let image = '';
    if (typeof result === 'string') image = result;
    else if (result?.image) image = result.image;
    else if (result instanceof ArrayBuffer || ArrayBuffer.isView(result)) {
      const bytes = result instanceof ArrayBuffer
        ? new Uint8Array(result)
        : new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
      if (bytes.byteLength > MAX_IMAGE_BYTES) return json({ error: 'image_too_large' }, 502);
      image = toBase64(bytes);
    }
    if (!image) return json({ error: 'no_image', message: 'The model returned no picture.' }, 502);
    if (!image.startsWith('data:image/')) image = `data:image/png;base64,${image}`;
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(image)) {
      return json({ error: 'not_an_image' }, 502);
    }
    // `image` for this site's own client, `dataURI` for the Amigo interface
    // that was supplied and expects that name.
    return json({ ok: true, image, dataURI: image, model: MODEL, prompt });
  } catch (error) {
    return json({ error: 'image_failed', message: error?.message || 'Image generation failed.' }, 502);
  }
}

export async function onRequest({ request, env = {} }) {
  if (request.method === 'POST') return onRequestPost({ request, env });
  if (request.method === 'GET') {
    return json({ ok: true, configured: Boolean(env?.AI && typeof env.AI.run === 'function'), model: MODEL });
  }
  return json({ error: 'method_not_allowed' }, 405);
}
