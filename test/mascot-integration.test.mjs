import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(join(root, path), 'utf8');
const poses = ['idle', 'wave', 'think', 'warm', 'celebrate', 'explain', 'welcome', 'listen', 'joy'];

test('Veri has a complete, optimized, transparent pose set', () => {
  for (const pose of poses) {
    const path = `assets/img/mascot/veri-${pose}.webp`;
    assert.ok(existsSync(join(root, path)), `${path} is missing`);
    const bytes = readFileSync(join(root, path));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `${path} is not WebP`);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `${path} is not WebP`);
    assert.ok(bytes.length < 100_000, `${path} is unexpectedly large`);
  }
});

test('the main knowledge home page introduces Veri before its search hero', () => {
  const home = read('assets/js/views/home.js');
  assert.match(home, /veri-home-welcome/);
  assert.match(home, /veri-welcome\.webp/);
  assert.match(home, /Hello, curious mind/);
  assert.match(home, /trace back to its source/);
});

test('Amigo gives every assistant turn an avatar and maps request states to poses', () => {
  const app = read('amigo/app.js');
  assert.match(app, /className = "veri-chat-avatar"/);
  assert.match(app, /function setVeriMood/);
  assert.match(app, /thinking: "think", responding: "explain", done: "warm"/);
  assert.match(app, /setVeriMood\(bubWrap, "celebrate"\)/);
  assert.match(app, /Hi, I’m Veri!/);
});

test('the experience layer handles mobile layouts, reduced motion and wider article panels', () => {
  const css = read('assets/css/experience.css');
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 420px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /max-width: min\(100%, 860px\)/);
  assert.match(css, /max-width: 82ch/);
  assert.ok(css.includes('body.amigo-chat .msg.ai .bubble { flex: 1 1 0; min-width: 0; }'));
});

test('the build stamp adds the shared experience stylesheet to future pages', () => {
  const stamp = read('scripts/stamp-build.mjs');
  assert.match(stamp, /experience\.css/);
});
