import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const contextFor = (url, response) => ({
  request: new Request(url),
  next: async () => response,
});

test('API responses receive explicit security and no-store headers', async () => {
  const original = new Response('{"ok":true}', {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
  const response = await onRequest(contextFor('https://example.com/api/chat', original));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.match(response.headers.get('strict-transport-security'), /max-age=31536000/);
  assert.equal(await response.text(), '{"ok":true}');
});

test('HTML Function responses are not cached and retain page marker', async () => {
  const original = new Response('<!doctype html><title>Hi</title>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const response = await onRequest(contextFor('https://example.com/special', original));
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(response.headers.get('x-veridellindo-page'), 'function');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('static assets are left untouched by the Function middleware', async () => {
  const original = new Response('body', { headers: { 'content-type': 'text/css' } });
  const response = await onRequest(contextFor('https://example.com/assets/site.css', original));
  assert.equal(response, original);
  assert.equal(response.headers.get('x-frame-options'), null);
});

test('SSE bodies remain streamable while API headers are added', async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('data: {"type":"delta"}\n\n'));
      controller.close();
    },
  });
  const original = new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
  const response = await onRequest(contextFor('https://example.com/api/chat', original));
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  assert.match(await response.text(), /delta/);
});
