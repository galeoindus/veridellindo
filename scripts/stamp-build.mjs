#!/usr/bin/env node
/* Stamp every HTML entry point with the same build id and cache-bust URL. */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const version = String(pkg.version || '').trim();
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error(`Invalid package version: ${version}`);
let commit = String(process.env.BUILD_COMMIT || '').trim();
let revisionType = commit ? 'git' : '';
const excluded = new Set(['.git', 'node_modules', '.wrangler', 'dist', 'build']);

function metaAttribute(tag, attribute) {
  const match = tag.match(new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : '';
}

/** Set a build meta tag whatever the attribute order, and collapse duplicates. */
function upsertMeta(html, name, content) {
  let found = false;
  html = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (metaAttribute(tag, 'name').toLowerCase() !== name.toLowerCase()) return tag;
    if (found) return '';
    found = true;
    return `<meta name="${name}" content="${content}">`;
  });
  if (!found && /<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (head) => `${head}\n  <meta name="${name}" content="${content}">`);
  }
  return html;
}

async function walk(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(full);
  }
  return output;
}

async function walkFiles(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walkFiles(full));
    else if (entry.isFile()) output.push(full);
  }
  return output;
}

/* A downloaded source ZIP has no .git directory. Keep `npm run release` usable
 * there too: use a deterministic seven-character snapshot fingerprint instead
 * of failing. Git checkouts still use their real HEAD SHA, and CI may override
 * it with BUILD_COMMIT. Generated build metadata and cache-busters are ignored
 * and generated content-hash CSS bundles are excluded because they are derived
 * from the source stylesheets already included in the hash. */
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    revisionType = 'git';
  } catch {
    const hash = createHash('sha256').update(version).update('\0');
    const generated = new Set(['assets/version.json', 'sitemap.xml']);
    const files = (await walkFiles(ROOT)).sort((a, b) => relative(ROOT, a).localeCompare(relative(ROOT, b)));
    for (const file of files) {
      const name = relative(ROOT, file).replace(/\\/g, '/');
      if (generated.has(name) || /^assets\/css\/bundle-[0-9a-f]+\.css$/i.test(name)) continue;
      let contents = await readFile(file, 'utf8').catch(() => '');
      if (name.endsWith('.html')) {
        contents = contents.replace(/<meta\b[^>]*>/gi, (tag) => (
          metaAttribute(tag, 'name').toLowerCase() === 'veridell-build'
            ? tag.replace(/(\bcontent\s*=\s*["'])[^"']+/i, '$1__BUILD__')
            : tag
        ));
      }
      if (name.endsWith('.html') || name.endsWith('.webmanifest')) {
        contents = contents.replace(/([?&]v=)[^&"'\s<>]+/g, '$1__BUILD__');
      }
      hash.update(name).update('\0').update(contents).update('\0');
    }
    commit = hash.digest('hex').slice(0, 7);
    revisionType = 'snapshot';
  }
}
commit = commit.slice(0, 7);
if (!/^[0-9a-f]{7}$/i.test(commit)) throw new Error('BUILD_COMMIT must be a 7-character git SHA or snapshot fingerprint');
const build = `${version}-${commit}`;

let changed = 0;
for (const file of await walk(ROOT)) {
  let html = await readFile(file, 'utf8');
  const before = html;
  // Once a page loads one bundled stylesheet, the individual sheets must not be
  // re-injected below, or a second build would undo the bundling.
  const hasBundle = /assets\/css\/bundle-/.test(html);
  html = html.replace(/([?&]v=)[^&"'\s<>]+/g, `$1${build}`);
  // Move legacy article inline scripts into an external file permitted by script-src 'self'.
  html = html.replace(/<script>\s*\/\* Read the article the way the breakdown reads:[\s\S]*?<\/script>/gi, `<script type="module" src="/assets/js/article-points.js?v=${build}" defer></script>`);
  // The image failure handler has to be listening before the first <img> in
  // the body is requested, so it is installed here for every page — the static
  // article pages as well as the single-page app.
  if (!/assets\/js\/image-fallback\.js/.test(html) && /<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <script src="/assets/js/image-fallback.js?v=${build}"></script>\n</head>`);
  }
  html = upsertMeta(html, 'veridell-version', version);
  html = upsertMeta(html, 'veridell-build', build);
  // The shared design layer: type, spacing, controls, focus, print. Loaded
  // last so it settles every page onto the same system.
  if (!hasBundle && !/assets\/css\/system\.css/.test(html) && /<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="/assets/css/system.css?v=${build}">\n</head>`);
  }
  // The reading column and the phone sheet. Both load after everything else
  // because they are corrections to the layout rather than part of the paint,
  // and both are added here so a page created later gets them without anyone
  // having to remember.
  for (const sheet of ['article-layout.css', 'mobile.css', 'polish.css']) {
    if (hasBundle) break;
    if (new RegExp(`assets/css/${sheet.replace('.', '\\.')}`).test(html)) continue;
    if (!/<\/head>/i.test(html)) continue;
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="/assets/css/${sheet}?v=${build}">\n</head>`);
  }
  // The global design system is the final visual authority on every page: it
  // owns the semantic tokens the older sheets read from.
  if (!hasBundle && !/assets\/css\/design-system\.css/.test(html) && /<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="/assets/css/design-system.css?v=${build}">\n</head>`);
  }
  // Amigo's shared refinement layer follows the design tokens on every route.
  if (!hasBundle && !/assets\/css\/amigo-ui\.css/.test(html) && /<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="/assets/css/amigo-ui.css?v=${build}">\n</head>`);
  }
  // Cross-route reading width, text scale and safe morphic surface presets.
  if (!hasBundle && !/assets\/css\/preferences\.css/.test(html) && /<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="/assets/css/preferences.css?v=${build}">\n</head>`);
  }
  // One theme controller for the whole site, including static articles and
  // utility pages, so a reader's choice follows them across every route.
  if (!/assets\/js\/global-theme\.js/.test(html) && /<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <script src="/assets/js/global-theme.js?v=${build}"></script>\n</head>`);
  }
  // The phone navigation belongs on every page: the article pages had no way
  // out of a 113,000 px document except the brand mark, because the header's
  // text links are hidden below 860 px.
  // The guard has to match the class as a prefix: the app shell's bar is
  // `class="bottom-nav glass"`, which the exact-string test below did not see,
  // so a second bar was appended to the home page on every single build and the
  // phone rendered two stacked navigation bars.
  // /amigo/ is its own interface with its own layout and composer. Injecting the
  // site's phone bar there put Ask / Explore / Topics / Library / Saved on top of
  // the message box, which is exactly what a reader saw.
  const standalone = /(^|\/)amigo\/index\.html$/.test(file.replace(/\\/g, '/'));
  // A floating way into the assistant, on every page of the site but the
  // assistant's own. The chat lives at its own address, so this is a link, not
  // a panel: it opens the page rather than growing a second chat inside the site.
  if (!standalone && !/amigo-launcher/.test(html) && /<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  <a class="amigo-launcher" href="/amigo/" aria-label="Open Amigo, the assistant">
    <img src="/assets/img/brand/logo-96.png" srcset="/assets/img/brand/veridellindo-round.svg 1x" alt="" width="24" height="24" loading="lazy" decoding="async">
    <span>Amigo</span>
  </a>\n</body>`);
  }
  // The launcher can be dragged out of the way (up or down) and remembers where
  // it was put; the script is small and only touches that one element.
  if (!standalone && /amigo-launcher/.test(html) && !/launcher-drag\.js/.test(html) && /<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  <script src="/assets/js/launcher-drag.js?v=${build}" defer></script>\n</body>`);
  }
  if (!standalone && !/class="bottom-nav(\s|")/.test(html) && /<\/body>/i.test(html)) {
    const nav = `  <nav class="bottom-nav" aria-label="Primary (phone)">
    <a href="/#/ask"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg><span>Ask</span></a>
    <a href="/#/explore"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M15 9l-2 4-4 2 2-4z"/></svg><span>Explore</span></a>
    <a href="/topics/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg><span>Topics</span></a>
    <a href="/#/library"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h5v14H4zM11 5h5v14h-5zM18 6l3 12-3 1z"/></svg><span>Library</span></a>
    <a href="/#/bookmarks"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg><span>Saved</span></a>
  </nav>
</body>`;
    html = html.replace(/<\/body>/i, nav);
  }
  // The body is marked only where a bottom navigation actually exists, so the
  // reserved mobile space follows the structure instead of every route paying it.
  if (/class="bottom-nav(\s|")/.test(html) && !/has-bottom-nav/.test(html)) {
    html = html.replace(/<body([^>]*)>/i, (m, attrs) => (
      /class="/.test(attrs)
        ? `<body${attrs.replace(/class="([^"]*)"/, 'class="$1 has-bottom-nav"')}>`
        : `<body${attrs} class="has-bottom-nav">`
    ));
  }
  // A phone with a notch needs the safe-area insets the sheets rely on.
  if (/name=["']viewport["']/i.test(html) && !/viewport-fit=cover/i.test(html)) {
    html = html.replace(/(<meta\s+name=["']viewport["'][^>]*content=["'])([^"']*)(["'])/i, '$1$2, viewport-fit=cover$3');
  }
  if (!/assets\/js\/build-watch\.js/.test(html) && /<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  <script type="module" src="/assets/js/build-watch.js?v=${build}"></script>\n</body>`);
  }
  /* Error reporting: inert unless this deployment supplies a DSN. This sits
     outside the first-build guard above, because that guard is skipped once
     build-watch is already present — which is why the first attempt injected
     nothing at all. */
  const sentryDsn = String(process.env.SENTRY_DSN || '').trim();
  if (sentryDsn && /<\/head>/i.test(html) && !/name="sentry-dsn"/.test(html)) {
    html = html.replace(/<\/head>/i, `  <meta name="sentry-dsn" content="${sentryDsn}">\n</head>`);
  }
  if (/<\/body>/i.test(html) && !/error-report\.js/.test(html)) {
    html = html.replace(/<\/body>/i, `  <script src="/assets/js/error-report.js?v=${build}"></script>\n</body>`);
  }

  // The standalone article pages get the Translate control from
  // article-points.js, the module they already load — a separate tag for it
  // was fetched but never evaluated, so the button never appeared.
  html = html.replace(/[ \t]*<script type="module" src="\/assets\/js\/article-translate-page\.js[^"]*"[^>]*><\/script>\r?\n?/gi, '');
  html = html.replace(/veridell v\d+\.\d+\.\d+/gi, `Veridellindo v${version}`);
  // The footer prints the version inside a span, so "Veridellindo v5.0.0" alone
  // never matched it and the no-JS footer drifted a release behind.
  html = html.replace(/(id=["']appVersion["'][^>]*>v)\d+\.\d+\.\d+/gi, `$1${version}`);
  if (html !== before) {
    await writeFile(file, html);
    changed += 1;
  }
}


// ── stylesheet bundling ───────────────────────────────────────────────────
// Every page used to request ten or eleven separate stylesheets, all of them
// render-blocking: the browser could not paint a single character until the
// last one arrived. Pages are grouped by the exact order they load their
// sheets, that order is concatenated verbatim (so the cascade is byte-for-byte
// what it was), and each group is written once as a single file. A page's
// sheets collapse into one request.
//
// The individual sheets stay in the repository as the source of truth; this is
// a build output, and it is regenerated on every stamp.
const CSS_DIR = join(ROOT, 'assets/css');
const LINK_RE = /[ \t]*<link\b[^>]*href="\/assets\/css\/(?!bundle-)([a-z0-9-]+\.css)[^"]*"[^>]*>\r?\n?/gi;

async function readSheet(name) {
  try {
    let css = await readFile(join(CSS_DIR, name), 'utf8');
    // @charset is only legal as the first bytes of a file, so it is dropped
    // from every sheet before they are concatenated.
    css = css.replace(/^\s*@charset[^;]*;\s*/i, '');
    return `/* ── ${name} ── */\n${css.trimEnd()}\n`;
  } catch {
    return '';
  }
}

const bundles = new Map(); // hash -> { name, sheets, css }
let bundledPages = 0;

/* A page that already links a bundle used to be skipped outright, which meant
 * a bundle could never be rebuilt: edit a sheet, run the stamp, and the site
 * kept serving the CSS frozen at the moment the bundle was first made. That is
 * why a layout fix could pass every test and change nothing on screen.
 *
 * A bundle records the sheets it was built from, in order, in its own header.
 * That list is read back here and the bundle is rebuilt from the sheets as
 * they are now — so the sheets are the source of truth on every build, and the
 * hash still names the bundle by its sheet list. */
const BUNDLE_RE = /assets\/css\/(bundle-[0-9a-f]+\.css)/;

/* Phase 2 — one cascade-layer contract for every stylesheet the site ships.
 * The same prelude must appear in each generated bundle and in the page sheets
 * that load before a bundle, because normal unlayered rules outrank layered
 * ones: layering only one side would silently reverse the intended order. */
const LAYER_ORDER = 'reset, tokens, base, components, layout, pages, responsive, utilities, overrides';
const LAYER_PRELUDE = `/* Veridellindo CSS cascade contract — keep identical across bundles. */\n@layer ${LAYER_ORDER};\n`;

const SHEET_LAYER = {
  'system.css': 'base',
  'design-system.css': 'components',
  'amigo-ui.css': 'components',
  'article-layout.css': 'layout',
  'preferences.css': 'pages',
  'mobile.css': 'responsive',
  'responsive.css': 'responsive',
  'polish.css': 'utilities',
  'refine.css': 'utilities',
  'styles.css': 'base',
  'app.css': 'components',
  'home-morph.css': 'pages',
  'research-chat.css': 'pages',
  'research-desk.css': 'pages',
  'research-morph.css': 'pages',
};

function layerOf(sheet) {
  const layer = SHEET_LAYER[sheet];
  if (layer) return layer;
  // A new sheet must be classified on purpose. Defaulting it to `pages` made a
  // shared stylesheet silently outrank the layer it belonged to.
  throw new Error(`stylesheet ${sheet} has no assigned cascade layer — add it to SHEET_LAYER`);
}

/** Wrap a source sheet's rules in its assigned layer, keeping its marker. */
function layeredSheet(sheet, css) {
  const body = String(css).replace(/^@charset[^;]+;\s*/i, '');
  return `@layer ${layerOf(sheet)} {\n${body}\n}`;
}

async function sheetsOfBundle(name) {
  try {
    const head = (await readFile(join(CSS_DIR, name), 'utf8')).split('*/')[0];
    const m = /cascade order:\s*\n\s*\*\s*(.+)/.exec(head);
    if (!m) return null;
    return m[1].split('>').map((x) => x.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

for (const file of await walk(ROOT)) {
  let html = await readFile(file, 'utf8');
  const existing = BUNDLE_RE.exec(html);
  if (existing) {
    // Rebuild the bundle this page already points at, from its own sheet list.
    const name = existing[1];
    const sheets = await sheetsOfBundle(name);
    if (sheets && sheets.length > 1) {
      if (!bundles.has(name)) {
        const parts = [];
        for (const sheet of sheets) parts.push(layeredSheet(sheet, await readSheet(sheet)));
        const css = `/* Veridellindo — generated stylesheet bundle. Do not edit.\n`
          + ` * Built from ${sheets.length} sheets in cascade order:\n`
          + ` * ${sheets.join(' > ')}\n */\n` + LAYER_PRELUDE + parts.join('\n');
        bundles.set(name, { name, sheets, css });
      }
      html = html.replace(/(href="\/assets\/css\/bundle-[0-9a-f]+\.css)\?v=[^"]*"/, `$1?v=${build}"`);
      await writeFile(file, html);
      bundledPages += 1;
    }
    continue;
  }
  const sheets = [...html.matchAll(LINK_RE)].map((m) => m[1]);
  if (sheets.length < 2) continue;

  const key = sheets.join('|');
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 10);
  const bundleName = `bundle-${hash}.css`;

  if (!bundles.has(hash)) {
    const parts = [];
    for (const name of sheets) parts.push(layeredSheet(name, await readSheet(name)));
    const css = `/* Veridellindo — generated stylesheet bundle. Do not edit.\n`
      + ` * Built from ${sheets.length} sheets in cascade order:\n`
      + ` * ${sheets.join(' > ')}\n */\n` + LAYER_PRELUDE + parts.join('\n');
    bundles.set(hash, { name: bundleName, sheets, css });
  }

  // Keep the first link's position (it is where the cascade starts) and drop
  // the rest, so nothing else in the head moves.
  let first = true;
  html = html.replace(LINK_RE, () => {
    if (!first) return '';
    first = false;
    return `  <link rel="stylesheet" href="/assets/css/${bundleName}?v=${build}">\n`;
  });

  await writeFile(file, html);
  bundledPages += 1;
}

// The manifest carries brand image URLs, and those files keep their names when
// the artwork changes — so the manifest's `?v=` has to move with the build, or a
// phone keeps its old home-screen icon.
try {
  const manifestPath = join(ROOT, 'manifest.webmanifest');
  const manifest = await readFile(manifestPath, 'utf8');
  const restamped = manifest.replace(/([?&]v=)[^&"'\s]+/g, `$1${build}`);
  if (restamped !== manifest) await writeFile(manifestPath, restamped);
} catch { /* no manifest on a stripped checkout */ }

for (const { name, css } of bundles.values()) {
  await writeFile(join(CSS_DIR, name), css);
}

// Old bundles are kept, not deleted.
//
// They used to be removed here, on the reasoning that a bundle no page asks
// for is dead weight. That reasoning is wrong in production: the stylesheet
// filename carries a content hash, so every content change produces a new
// name — and a browser (or a CDN edge) holding a cached HTML page still asks
// for the old name. Deleting it turned a cache hit into a 404, and a page with
// no stylesheet renders as raw HTML, which is exactly what a reader on a
// phone saw.
//
// A few hundred kilobytes of stale stylesheet is a fair price for never
// serving an unstyled page. The count is reported so it stays visible.
const onDisk = (await readdir(CSS_DIR)).filter((entry) => /^bundle-[0-9a-f]+\.css$/.test(entry));
const referenced = new Set();
for (const file of await walk(ROOT)) {
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(/assets\/css\/(bundle-[0-9a-f]+\.css)/g)) referenced.add(m[1]);
}
const stale = onDisk.filter((entry) => !referenced.has(entry));
if (stale.length) {
  process.stdout.write(`Kept ${stale.length} earlier bundle(s) so cached pages still resolve their CSS.\n`);
}

if (bundledPages) {
  process.stdout.write(`Bundled ${bundledPages} pages into ${bundles.size} stylesheet file(s).\n`);
}

const configPath = join(ROOT, 'assets/js/config.js');
let config = await readFile(configPath, 'utf8');
config = config.replace(/(\bversion:\s*')[^']+(')/, `$1${version}$2`);
await writeFile(configPath, config);

await writeFile(join(ROOT, 'assets/version.json'), `${JSON.stringify({ version, commit, revisionType, built: new Date().toISOString() }, null, 2)}\n`);
process.stdout.write(`Build ${build}: stamped ${changed} HTML files, config.js and assets/version.json.\n`);

// ── sitemap ────────────────────────────────────────────────────────────────
// The build used to write its own sitemap here: every URL stamped with the
// deploy date, no changefreq, no priority, no images. It also silently
// overwrote the generated one, which is how a richer sitemap could be committed
// and then thrown away by the next build. The generator is now the only writer.
execFileSync(process.execPath, [join(ROOT, 'scripts', 'gen-sitemap.mjs')], { cwd: ROOT, stdio: 'inherit' });
