/* The identity of the site, checked as data rather than trusted as prose.
 *
 * Everything here was a real defect at some point in this tree's history: a
 * page shipped without a skip link, a stylesheet nobody linked, a stale
 * wordmark in a social card, a bundle referenced by nothing. Each check reads
 * the files that actually ship.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.wrangler']);

function walk(dir, ext) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, ext));
    else if (full.endsWith(ext)) out.push(full);
  }
  return out;
}

const pages = walk(ROOT, '.html');
const rel = (p) => relative(ROOT, p).split('\\').join('/');

test('every shipped page has a skip link that points at a real landmark', () => {
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    const link = html.match(/class="skip-link"[^>]*href="#([^"]+)"/);
    assert.ok(link, `${rel(page)} has no skip link`);
    // The target has to exist, or the link drops the reader at the top of the
    // document while pretending to skip the navigation.
    assert.match(html, new RegExp(`id="${link[1]}"`), `${rel(page)} skips to #${link[1]}, which is not there`);
  }
});

test('every page but the 404 declares a canonical address', () => {
  for (const page of pages) {
    if (rel(page) === '404.html') continue;
    const html = readFileSync(page, 'utf8');
    const tag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/);
    assert.ok(tag, `${rel(page)} has no canonical`);
    assert.match(tag[0], /https:\/\/veridellindo\.pages\.dev\//, `${rel(page)} canonically points somewhere else`);
  }
});

test('every page but the 404 carries structured data', () => {
  for (const page of pages) {
    if (rel(page) === '404.html') continue;
    const html = readFileSync(page, 'utf8');
    assert.match(html, /application\/ld\+json/, `${rel(page)} has no JSON-LD`);
  }
});

test('no stylesheet ships that no page asks for', () => {
  const sheets = readdirSync(join(ROOT, 'assets/css')).filter((f) => f.endsWith('.css'));
  const bundles = sheets.filter((f) => f.startsWith('bundle-'));
  const linked = new Set();
  for (const page of pages) {
    for (const m of readFileSync(page, 'utf8').matchAll(/assets\/css\/([a-z0-9.-]+\.css)/g)) {
      linked.add(m[1]);
    }
  }
  for (const bundle of bundles) {
    assert.ok(linked.has(bundle), `bundle ${bundle} is referenced by no page`);
  }
});

test('the old product name is gone from everything that ships', () => {
  const gone = ['Encyclopaedia Mundi', 'encyclopaediamundi', 'EncyclopaediaMundi'];
  const shipped = [...pages, ...walk(ROOT, '.js'), ...walk(ROOT, '.css'),
    ...walk(ROOT, '.json'), ...walk(ROOT, '.webmanifest'), ...walk(ROOT, '.txt')]
    .filter((p) => !rel(p).startsWith('test/'));
  for (const file of shipped) {
    const body = readFileSync(file, 'utf8');
    for (const word of gone) {
      assert.ok(!body.includes(word), `${rel(file)} still says "${word}"`);
    }
  }
});

test('the mark exists at every size the manifest and the icons ask for', () => {
  // The site ships the mark as PNG only — one source image, every size drawn
  // from it — so a stray SVG reference would be a broken image, not a fallback.
  const sizes = ['logo-48.png', 'logo-96.png', 'logo-180.png',
    'logo-192.png', 'logo-512.png', 'logo-maskable-512.png', 'social-card.png'];
  for (const name of sizes) {
    const file = join(ROOT, 'assets/img/brand', name);
    assert.ok(existsSync(file), `missing brand asset ${name}`);
    assert.ok(statSync(file).size > 200, `brand asset ${name} is suspiciously small`);
  }
  assert.ok(!existsSync(join(ROOT, 'assets/img/brand/facet.svg')),
    'the retired SVG mark is still on disk');
});

test('no page asks for the retired SVG mark', () => {
  for (const file of [...pages, ...walk(ROOT, '.js'), ...walk(ROOT, '.webmanifest')]) {
    if (rel(file).startsWith('test/')) continue;
    const body = readFileSync(file, 'utf8');
    assert.ok(!body.includes('facet.svg'), `${rel(file)} still points at facet.svg`);
  }
});

test('every page shows the mark as an image, at a size the header can use', () => {
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    const marks = [...html.matchAll(/<img[^>]*assets\/img\/brand\/logo-[0-9]+\.png[^>]*>/g)];
    assert.ok(marks.length >= 1, `${rel(page)} shows no brand mark`);
    for (const tag of marks) {
      assert.match(tag[0], /width="\d+"/, `${rel(page)}: the mark has no width`);
      assert.match(tag[0], /height="\d+"/, `${rel(page)}: the mark has no height`);
    }
  }
});

test('brand icons are never cached as immutable', () => {
  // The stale tab icon: the mark keeps its filename across releases, so an
  // `immutable` year meant every browser that had seen the old logo kept it.
  const headers = readFileSync(join(ROOT, '_headers'), 'utf8');
  const block = headers.match(/\/assets\/img\/brand\/\*\n([\s\S]*?)(?:\n\n|$)/);
  assert.ok(block, 'no cache rule for the brand icons');
  assert.ok(!/immutable/.test(block[1]), 'brand icons must not be immutable');
  const maxAge = Number((block[1].match(/max-age=(\d+)/) || [])[1] || 0);
  assert.ok(maxAge > 0 && maxAge <= 604800, `brand icon max-age is ${maxAge}, expected a week or less`);
});

test('no page competes with the PNG icons by linking the .ico', () => {
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    assert.ok(!/rel="icon"[^>]*favicon\.ico/.test(html), `${rel(page)} still links favicon.ico`);
  }
});

test('the package and the deployment agree on one name', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'veridellindo');
  assert.equal(pkg.repository.url, 'https://github.com/galeoindus/veridellindo.git');
  assert.equal(pkg.homepage, 'https://veridellindo.pages.dev/');

  const wrangler = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8');
  assert.match(wrangler, /^name = "veridellindo"$/m, 'wrangler.toml names another project');

  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert.match(manifest.name, /^Veridellindo/, 'the manifest names another product');
});

test('one version reaches the page and the package', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const home = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const stamped = home.match(/\?v=(\d+\.\d+\.\d+)/);
  assert.ok(stamped, 'index.html carries no build stamp');
  assert.equal(stamped[1], pkg.version, 'the page and the package disagree on the version');
});

test('every page states which build it is, and the statement is current', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    const shown = html.match(/id="appVersion"[^>]*>v(\d+\.\d+\.\d+)</);
    assert.ok(shown, `${rel(page)} does not state its version`);
    assert.equal(shown[1], pkg.version, `${rel(page)} states v${shown[1]}, package.json says ${pkg.version}`);
    assert.match(html, /id="appBuild"/, `${rel(page)} has no place to show the build time`);
  }
});

test('the version endpoint the pages check against is the one that shipped', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const info = JSON.parse(readFileSync(join(ROOT, 'assets/version.json'), 'utf8'));
  assert.equal(info.version, pkg.version, 'assets/version.json names another version');
  assert.match(String(info.commit || ''), /^[0-9a-f]{7,40}$/, 'version.json carries no commit');
  assert.ok(Date.parse(info.built), 'version.json carries no build time');
});

test('the promise line is the same everywhere it is written', () => {
  const promise = 'Every answer, with its source';
  const home = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const config = readFileSync(join(ROOT, 'assets/js/config.js'), 'utf8');
  assert.ok(home.includes(promise), 'the home page does not carry the promise');
  assert.ok(config.includes(promise), 'config.js does not carry the promise');
});
