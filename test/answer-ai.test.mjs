import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAnswerPayload,
  readAnswerReply,
  requestAiAnswer,
  applyOrganisation,
} from '../assets/js/answer-ai.js';

import {
  normaliseSections,
  buildPrompt,
  validateReply,
  parseReply,
  onRequestPost,
} from '../functions/api/answer.js';

const topic = (id, points, title = id) => ({ id, title, points });

test('the payload is bounded and keeps each section’s sentences', () => {
  const sections = Array.from({ length: 12 }, (_, i) => topic(`s${i}`, ['One sentence.', 'Two sentence.']));
  const payload = buildAnswerPayload({ question: 'What is Ashoka known for?', title: 'Ashoka', sections });
  assert.equal(payload.sections.length, 8, 'more than eight sections should not be sent');
  assert.equal(payload.sections[0].sentences.length, 2);
  assert.equal(payload.question, 'What is Ashoka known for?');
});

test('a section with no sentences is not sent at all', () => {
  const payload = buildAnswerPayload({
    question: 'q',
    sections: [topic('a', []), topic('b', ['Real sentence here.'])],
  });
  assert.deepEqual(payload.sections.map((s) => s.id), ['b']);
});

test('an order must be a full permutation of that section’s sentences', () => {
  const sections = [{ id: 'a', title: 'A', sentences: ['one.', 'two.', 'three.'] }];
  const good = readAnswerReply({ sections: [{ id: 'a', order: [2, 0, 1] }] }, sections);
  assert.deepEqual(good.get('a').order, [2, 0, 1]);

  for (const bad of [[0, 0, 1], [0, 1], [0, 1, 5], [0, 1, 2, 3]]) {
    const map = readAnswerReply({ sections: [{ id: 'a', order: bad }] }, sections);
    assert.equal(map.has('a'), false, `order ${JSON.stringify(bad)} should be refused`);
  }
});

test('an unknown section id and a non-question are refused', () => {
  const sections = [{ id: 'a', title: 'A', sentences: ['one.'] }];
  assert.equal(readAnswerReply({ sections: [{ id: 'zzz', order: [0] }] }, sections).size, 0);
  assert.equal(readAnswerReply({ sections: [{ id: 'a', question: 'A heading' }] }, sections).size, 0);
});

test('the organisation reorders the lines and can replace the heading', () => {
  const topics = [topic('a', ['first.', 'second.', 'third.'], 'Edicts')];
  const organised = new Map([['a', { question: 'What do the edicts say?', order: [2, 0, 1] }]]);
  const [next] = applyOrganisation(topics, organised);
  assert.equal(next.title, 'What do the edicts say?');
  assert.deepEqual(next.points, ['third.', 'first.', 'second.']);
  assert.deepEqual(next.short, ['third.', 'first.']);
});

test('with nothing organised the topics come back untouched', () => {
  const topics = [topic('a', ['first.'])];
  assert.equal(applyOrganisation(topics, null), topics);
});

test('a failed, refused or slow request resolves to null, never throws', async () => {
  const args = { question: 'q', sections: [topic('a', ['one.'])] };
  const failing = async () => { throw new Error('offline'); };
  assert.equal(await requestAiAnswer(args, { fetchImpl: failing }), null);

  const refused = async () => ({ ok: false, status: 503, json: async () => ({}) });
  assert.equal(await requestAiAnswer(args, { fetchImpl: refused }), null);

  const garbage = async () => ({ ok: true, json: async () => ({ ok: true, sections: [{ id: 'nope' }] }) });
  assert.equal(await requestAiAnswer(args, { fetchImpl: garbage }), null);

  const good = async () => ({ ok: true, json: async () => ({ ok: true, sections: [{ id: 'a', order: [0] }] }) });
  const map = await requestAiAnswer(args, { fetchImpl: good });
  assert.deepEqual(map.get('a').order, [0]);
});

test('the function refuses a question that is not grounded in its section', () => {
  const sections = [{ id: 'a', title: 'Edicts', sentences: ['Ashoka carved his edicts on pillars and rocks.'] }];
  const invented = validateReply({ sections: [{ id: 'a', question: 'What did the Mauryan navy do in Sri Lanka?' }] }, sections);
  assert.equal(invented.length, 0, 'a question about an unmentioned subject must be dropped');

  const grounded = validateReply({ sections: [{ id: 'a', question: 'Where did Ashoka carve his edicts?' }] }, sections);
  assert.equal(grounded[0].question, 'Where did Ashoka carve his edicts?');
});

test('the reply parser survives a code fence and a stray sentence', () => {
  assert.deepEqual(parseReply('```json\n{"sections":[]}\n```'), { sections: [] });
  assert.deepEqual(parseReply('Here you go: {"sections":[{"id":"a"}]} — done'), { sections: [{ id: 'a' }] });
  assert.equal(parseReply('no json here'), null);
  assert.equal(parseReply(''), null);
});

test('the prompt numbers every sentence so an order can be checked', () => {
  const messages = buildPrompt({
    question: 'What is Ashoka known for?',
    sections: [{ id: 'a', title: 'Edicts', sentences: ['First.', 'Second.'] }],
  });
  const user = messages.find((m) => m.role === 'user').content;
  assert.match(user, /SECTION a — Edicts/);
  assert.match(user, /0\. First\./);
  assert.match(user, /1\. Second\./);
  assert.match(messages[0].content, /JSON only/);
});

test('the endpoint answers 503 without a binding and 200 with one', async () => {
  const body = JSON.stringify({
    question: 'What is Ashoka known for?',
    sections: [{ id: 'a', title: 'Edicts', sentences: ['Ashoka carved his edicts on pillars.'] }],
  });
  const request = () => new Request('https://veridellindo.pages.dev/api/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });

  const unbound = await onRequestPost({ request: request(), env: {} });
  assert.equal(unbound.status, 503);

  const env = {
    AI: {
      run: async () => ({
        response: JSON.stringify({ sections: [{ id: 'a', question: 'Where are Ashoka’s edicts carved?', order: [0] }] }),
      }),
    },
  };
  const bound = await onRequestPost({ request: request(), env });
  assert.equal(bound.status, 200);
  const data = await bound.json();
  assert.equal(data.ok, true);
  assert.equal(data.provider, 'workers-ai');
  assert.equal(data.sections[0].order[0], 0);
});

test('a model that returns prose instead of JSON yields no organisation', async () => {
  const request = new Request('https://veridellindo.pages.dev/api/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'q', sections: [{ id: 'a', sentences: ['Ashoka carved his edicts.'] }] }),
  });
  const env = { AI: { run: async () => ({ response: 'I think the answer is the edicts section.' }) } };
  const response = await onRequestPost({ request, env });
  const data = await response.json();
  assert.equal(data.ok, false);
  assert.deepEqual(data.sections, []);
});

test('sections are capped before they reach the model', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({ id: `s${i}`, title: 't', sentences: ['x.'] }));
  assert.equal(normaliseSections(many).length, 8);
  assert.equal(normaliseSections([]).length, 0);
  assert.equal(normaliseSections(null).length, 0);
});
