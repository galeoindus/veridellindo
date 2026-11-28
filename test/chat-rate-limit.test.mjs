/* The chat endpoint's caller limit, and the OpenRouter key rotation.
 *
 * Two defects pinned here:
 *   1. the 429 built by `json(body, 429, { 'retry-after': '60' })` dropped the
 *      header, because `json()` took no third argument — the client was told to
 *      wait and never told how long;
 *   2. `openRouterKeys()` advances a shared cursor every time it is called, and
 *      it was the only way to read the list, so one request advanced it twice
 *      and a GET health check advanced it as well.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost, onRequestGet, openRouterKeys, listOpenRouterKeys } from '../functions/api/chat.js';

const envWithKeys = (n) => {
  const env = {};
  for (let i = 1; i <= n; i += 1) env[`OPENROUTER_API_KEY_${i}`] = `key-${i}`;
  return env;
};

const post = (ip) => onRequestPost({
  request: new Request('https://veridellindo.pages.dev/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
  }),
  // No AI binding and no OpenRouter key: every allowed call fails fast with 503,
  // which is what makes the limit itself the thing under test.
  env: {},
});

test('the thirteenth message in a minute is refused with a Retry-After', async () => {
  const ip = '203.0.113.9';
  let last = null;
  for (let i = 0; i < 13; i += 1) last = await post(ip);
  assert.equal(last.status, 429);
  assert.equal(last.headers.get('retry-after'), '60', 'the client must be told how long to wait');
});

test('two callers do not share one allowance', async () => {
  let status = 0;
  for (let i = 0; i < 13; i += 1) status = (await post('198.51.100.4')).status;
  assert.equal(status, 429);
  const other = await post('198.51.100.5');
  assert.notEqual(other.status, 429, 'a second caller starts with its own count');
});

test('listOpenRouterKeys has no side effect, so asking twice gives the same order', () => {
  const env = envWithKeys(3);
  const first = listOpenRouterKeys(env);
  const second = listOpenRouterKeys(env);
  assert.deepEqual(first, ['key-1', 'key-2', 'key-3']);
  assert.deepEqual(second, first);
});

test('openRouterKeys rotates once per call', () => {
  const env = envWithKeys(3);
  const a = openRouterKeys(env);
  const b = openRouterKeys(env);
  assert.notEqual(a[0], b[0]);
  assert.deepEqual(new Set(a), new Set(['key-1', 'key-2', 'key-3']));
});

test('a GET health check does not disturb the rotation', async () => {
  const env = envWithKeys(3);
  const before = listOpenRouterKeys(env);
  await onRequestGet({ env });
  await onRequestGet({ env });
  assert.deepEqual(listOpenRouterKeys(env), before);
  const response = await onRequestGet({ env });
  const body = await response.json();
  assert.equal(body.openRouter, true);
});

test('a caller cannot pick its own rate-limit bucket through X-Forwarded-For', async () => {
  const send = (xff) => onRequestPost({
    request: new Request('https://veridellindo.pages.dev/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': xff },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    }),
    env: {},
  });
  let last = null;
  // Same caller, a different forged chain each time: the bucket is the first
  // entry, so all thirteen land in one count.
  for (let i = 0; i < 13; i += 1) last = await send(`203.0.113.7, 10.0.0.${i}`);
  assert.equal(last.status, 429);
});
