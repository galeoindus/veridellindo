import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const retired = '@cf/meta/llama-3.2-3b-instruct';
const replacement = '@cf/google/gemma-4-26b-a4b-it';

test('the replacement Workers AI model is consistent across all active surfaces', async () => {
  const [api, page, app, worker] = await Promise.all([
    read('../functions/api/chat.js'),
    read('../amigo/index.html'),
    read('../amigo/app.js'),
    read('../amigo-worker/worker.js'),
  ]);
  assert.match(api, new RegExp(replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(page.includes(`value="${replacement}"`));
  assert.ok(worker.includes(replacement));
  assert.ok(app.includes(`settings.aiModel === "${retired}"`));
  assert.ok(app.includes(`settings.aiModel = "${replacement}"`));
  assert.ok(app.includes('m.indexOf("gemma-4") >= 0 ? "Gemma 4"'));
});
