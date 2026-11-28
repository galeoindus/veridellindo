/* Every host the browser actually fetches must be in the page's own CSP.
 *
 * Amigo's live research calls DuckDuckGo, the GitHub search API, Open-Meteo
 * (weather and its geocoder) and HN Algolia. None of them were in
 * `connect-src`, so the site's own Content-Security-Policy blocked every one of
 * those lookups in production and the feature failed silently — the request
 * never left the browser.
 *
 * This test reads the hosts out of the client code and checks them against
 * `_headers`, so the next provider added cannot be forgotten.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(js|mjs)$/.test(entry)) out.push(path);
  }
  return out;
}

/** The connect-src directive of the site's Content-Security-Policy. */
function connectSrc() {
  const headers = readFileSync(join(ROOT, '_headers'), 'utf8');
  const policy = (headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m) || [])[1] || '';
  const directive = (policy.match(/(?:^|;\s*)connect-src\s+([^;]+)/) || [])[1] || '';
  return directive.trim().split(/\s+/).filter(Boolean);
}

/** Hosts a client module fetches directly, as `https://host`. */
function fetchedHosts() {
  const hosts = new Set();
  for (const file of [...walk(join(ROOT, 'assets', 'js')), ...walk(join(ROOT, 'amigo'))]) {
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(/(?:fetch|fetchJSON)\(\s*[`'"](https:\/\/[a-z0-9.-]+)/gi)) {
      hosts.add(m[1].toLowerCase());
    }
  }
  return [...hosts].sort();
}

/** Does an allow-list entry cover this origin? `https://*.x.org` covers any one label. */
function covered(origin, allowed) {
  const host = origin.replace(/^https:\/\//, '');
  return allowed.some((entry) => {
    const value = entry.replace(/^https:\/\//, '');
    if (value === host) return true;
    if (value.startsWith('*.')) {
      const suffix = value.slice(1);           // ".x.org"
      return host.endsWith(suffix) && host.length > suffix.length;
    }
    return false;
  });
}

test('the policy has a connect-src', () => {
  assert.ok(connectSrc().length > 0, 'no connect-src in _headers');
});

test('every host the client fetches is allowed by connect-src', () => {
  const allowed = connectSrc();
  const missing = fetchedHosts().filter((origin) => !covered(origin, allowed));
  assert.deepEqual(missing, [], `these fetch targets are blocked by the site's own CSP: ${missing.join(', ')}`);
});

test('the research providers Amigo calls are named explicitly', () => {
  const allowed = connectSrc();
  for (const origin of [
    'https://api.duckduckgo.com',
    'https://api.github.com',
    'https://api.open-meteo.com',
    'https://geocoding-api.open-meteo.com',
    'https://hn.algolia.com',
  ]) {
    assert.ok(covered(origin, allowed), `${origin} is missing from connect-src`);
  }
});
