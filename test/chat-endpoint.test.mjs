/* The chat endpoint, tested against the environment the site actually runs in.
 *
 * The point of these tests is the thing that broke last time: the chat was a
 * separate Worker you had to deploy and paste a URL for, so on a fresh
 * deployment the page did nothing. This endpoint runs on the site's own origin
 * with the AI binding the project already declares, and these cases pin that
 * contract down.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost, onRequestGet } from '../functions/api/chat.js';

const post = (body, env = {}, headers = {}) => onRequestPost({
  request: new Request('https://veridellindo.pages.dev/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }),
  env,
});

const aiEnv = () => ({
  AI: {
    run: async (model, input) => {
      assert.ok(Array.isArray(input.messages), 'messages must reach the model');
      return { response: `Answer from ${model}` };
    },
  },
});

test('a chat turn is answered by Workers AI with no key configured', async () => {
  const res = await post({ messages: [{ role: 'user', content: 'hello' }] }, aiEnv());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.provider, 'workers-ai');
  assert.match(body.choices[0].message.content, /Answer from @cf\//);
});

test('the endpoint reports what the deployment can do', async () => {
  const res = await onRequestGet({ env: aiEnv() });
  const body = await res.json();
  assert.equal(body.workersAI, true);
  assert.equal(body.openRouter, false);
  assert.ok(Array.isArray(body.models) && body.models.length >= 3);
  assert.ok(body.models.includes('@cf/google/gemma-4-26b-a4b-it'));
  assert.ok(!body.models.includes('@cf/meta/llama-3.2-3b-instruct'));
});

test('a deployment without the binding says so instead of hanging', async () => {
  const res = await post({ messages: [{ role: 'user', content: 'hello' }] }, {});
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error, 'assistant_unavailable');
  assert.match(body.message, /Workers AI/i);
});

test('a cross-origin caller is refused', async () => {
  const res = await post(
    { messages: [{ role: 'user', content: 'hello' }] },
    aiEnv(),
    { origin: 'https://someone-else.example' },
  );
  assert.equal(res.status, 403);
});

test('a same-origin caller is allowed', async () => {
  const res = await post(
    { messages: [{ role: 'user', content: 'hello' }] },
    aiEnv(),
    { origin: 'https://veridellindo.pages.dev' },
  );
  assert.equal(res.status, 200);
});

test('a body that is not JSON is refused before it is parsed', async () => {
  const res = await post({ messages: [] }, aiEnv(), { 'content-type': 'text/plain' });
  assert.equal(res.status, 415);
});

test('messages must be well formed', async () => {
  const bad = await post({ messages: [{ role: 'wizard', content: 'hi' }] }, aiEnv());
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, 'invalid_messages');

  const empty = await post({ messages: [] }, aiEnv());
  assert.equal(empty.status, 400);
});

test('an oversized body is refused', async () => {
  const huge = JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(300 * 1024) }] });
  const res = await post(huge, aiEnv());
  assert.equal(res.status, 413);
});

test('a streamed turn arrives as SSE frames', async () => {
  const env = {
    AI: {
      run: async () => new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode('data: {"response":"Hel"}\n\n'));
          controller.enqueue(enc.encode('data: {"response":"lo"}\n\n'));
          controller.close();
        },
      }),
    },
  };
  const res = await post({ messages: [{ role: 'user', content: 'hi' }], stream: true }, env);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/event-stream/);
  const text = await res.text();
  assert.match(text, /"type":"delta"/);
  assert.match(text, /"type":"done"/);
  assert.match(text, /Hello/);
});


test('the Gemma 4 replacement can be selected explicitly', async () => {
  const calls = [];
  const env = {
    AI: {
      run: async (model, input) => {
        calls.push({ model, input });
        return { response: 'Gemma route works' };
      },
    },
  };
  const selected = '@cf/google/gemma-4-26b-a4b-it';
  const res = await post({
    messages: [{ role: 'user', content: 'hello' }],
    model: selected,
    provider: 'workers-ai',
  }, env);
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, selected);
  assert.equal((await res.json()).model, selected);
});
