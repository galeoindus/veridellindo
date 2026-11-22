import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

function collectHtml(directory = rootPath) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.wrangler') continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...collectHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) found.push(relative(rootPath, absolute).replaceAll('\\', '/'));
  }
  return found;
}

test('the supplied Veridellindo logo is the shared source for site and chat branding', () => {
  for (const name of ['logo-master.png', 'logo-48.png', 'logo-96.png', 'logo-180.png', 'logo-192.png', 'logo-384.png', 'logo-512.png', 'logo-maskable-512.png', 'favicon-mark-48.png', 'favicon-mark-96.png', 'favicon-mark-192.png', 'favicon-mark-512.png', 'social-card.png']) {
    const path = `assets/img/brand/${name}`;
    assert.ok(existsSync(new URL(path, root)), `${path} is missing`);
    assert.ok(readFileSync(new URL(path, root)).length > 500, `${path} looks empty`);
  }
  const home = read('index.html');
  const chat = read('amigo/index.html');
  const app = read('amigo/app.js');
  assert.match(home, /brand-refresh\.css/, 'home launcher redesign is not loaded');
  assert.match(home, /<img src="\/assets\/img\/brand\/logo-96\.png(?:\?v=[^"]*)?"/, 'home assistant launcher does not use the supplied logo');
  assert.match(chat, /redesign\.css/, 'chat redesign is not loaded');
  assert.match(chat, /\/assets\/img\/brand\/logo-96\.png(?:\?v=[^"]*)?/, 'chat rail does not use the supplied logo');
  assert.match(app, /AMIGO_BRAND_URI\s*=\s*"\/assets\/img\/brand\/logo-192\.png"/, 'chat application does not use the supplied brand asset');
});

test('every assistant launcher across root and article pages uses the supplied logo', () => {
  const pages = collectHtml();
  let launcherCount = 0;
  for (const page of pages) {
    const html = read(page);
    const launcher = html.match(/<a\s+class="amigo-launcher"[\s\S]*?<\/a>/i)?.[0];
    if (!launcher) continue;
    launcherCount += 1;
    assert.match(launcher, /<img src="\/assets\/img\/brand\/logo-96\.png(?:\?v=[^"]*)?"/, `${page} launcher does not use the supplied logo`);
    assert.doesNotMatch(launcher, /<svg/i, `${page} launcher still embeds the old bubble glyph`);
    assert.match(html, /brand-refresh\.css/, `${page} does not load the shared brand system`);
  }
  assert.ok(launcherCount >= 20, `expected site-wide launchers, found ${launcherCount}`);
  const chat = read('amigo/index.html');
  assert.doesNotMatch(chat, /id="gem"/, 'unused Gemini gradient remains in chat markup');
});

test('article social cards use the generated supplied-logo card', () => {
  for (const page of ['articles/index.html', 'articles/Artificial_intelligence/index.html']) {
    const html = read(page);
    assert.match(html, /assets\/img\/brand\/social-card\.png/);
    assert.doesNotMatch(html, /og-card\.png/);
  }
});
