import test from 'node:test';
import assert from 'node:assert/strict';

import { openRouterKeys } from '../functions/api/chat.js';

/** An env with the given numbered slots filled. */
const envWith = (slots, legacy = '') => {
  const env = {};
  for (const [n, key] of Object.entries(slots)) env[`OPENROUTER_API_KEY_${n}`] = key;
  if (legacy) env.OPENROUTER_API_KEY = legacy;
  return env;
};

test('every slot from one to twelve is read', () => {
  const slots = {};
  for (let i = 1; i <= 12; i += 1) slots[i] = `key-${i}`;
  const keys = openRouterKeys(envWith(slots));
  assert.equal(keys.length, 12, 'a key in slot 7..12 used to be ignored');
  for (let i = 1; i <= 12; i += 1) assert.ok(keys.includes(`key-${i}`), `key-${i} is missing`);
});

test('a slot past twelve is not read', () => {
  const keys = openRouterKeys(envWith({ 13: 'key-13' }));
  assert.deepEqual(keys, []);
});

test('the legacy unnumbered key is still accepted', () => {
  const keys = openRouterKeys(envWith({ 1: 'key-1' }, 'legacy-key'));
  assert.deepEqual(new Set(keys), new Set(['key-1', 'legacy-key']));
});

test('a key pasted into two slots is used once', () => {
  const keys = openRouterKeys(envWith({ 1: 'same', 2: 'same', 3: 'other' }));
  assert.equal(keys.length, 2);
  assert.equal(keys.filter((k) => k === 'same').length, 1);
});

test('blank and missing slots are skipped', () => {
  assert.deepEqual(openRouterKeys(envWith({ 1: '', 2: '   ', 3: 'real' })), ['real']);
  assert.deepEqual(openRouterKeys({}), []);
  assert.deepEqual(openRouterKeys(undefined), []);
});

test('the list rotates, so one key does not take every call', () => {
  const env = envWith({ 1: 'a', 2: 'b', 3: 'c' });
  const first = openRouterKeys(env);
  const second = openRouterKeys(env);
  assert.notEqual(first[0], second[0], 'two calls in a row started on the same key');
  assert.deepEqual(new Set(first), new Set(['a', 'b', 'c']));
  assert.deepEqual(new Set(second), new Set(['a', 'b', 'c']));
});

test('a single key is returned as-is, with no rotation bookkeeping', () => {
  const env = envWith({ 5: 'only' });
  assert.deepEqual(openRouterKeys(env), ['only']);
  assert.deepEqual(openRouterKeys(env), ['only']);
});
