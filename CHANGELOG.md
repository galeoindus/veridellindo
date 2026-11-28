# Changelog

Every release that changed the shipped site. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[semantic versioning](https://semver.org/): a major version means the reading
model or the identity changed, a minor means a surface was added, a patch means
something was fixed.

The build id on every page is `<version>-<commit>`, written by
`npm run stamp:build`. If the two disagree, the page was hand-edited.

## [Unreleased]

### Changed
- **The supplied hexagonal mark is the logo, everywhere.** `logo-master.png` is
  now the supplied artwork, cut from its white field and carried on a
  transparent one; every icon, app icon, maskable icon, favicon, tab SVG and
  social card is generated from it by `npm run brand-assets`. The old
  `veridellindo-round.svg` — a hand-embedded blue circle with a lotus, a star
  and an open book — is produced from the master too, so the icon in the tab is
  the same drawing as the mark beside it. It also stopped shipping 312 KB of
  base64 and references the raster instead.
- **The palette follows the mark.** Indigo `#4338ca`, blue `#2f4bd8` and
  `#1a63d8` replace the orange–coral–magenta–violet identity; cyan `#12aec8`
  and teal are the secondary family. Cool white `#f5f8fd` and deep navy
  `#070d1a` replace the lilac and plum fields, and the design-system tokens,
  the research desk, the chat surfaces and the generated social card were
  retuned with them.
- **Pink is gone from every gradient**, including the launcher, primary buttons,
  the send button, the download button and the microphone's recording state,
  which is a true red now rather than a crimson-pink.
- Gradient stops that carry white text end at `#1a63d8`: the previous cyan end
  measured 2.2:1 against white.
- The default accent family is labelled **Indigo** instead of **Forest** — it
  has been blue since the mark changed. The stored value stays `forest`, so no
  reader's saved choice is reset.
- `docs/DESIGN.md` and the README describe the new mark and palette.

### Fixed
- **A citation marker no longer leaves the article.** Every `<sup>` marker is
  `<a href="#ref-3">`, and the hash router treated any fragment as a route, so
  pressing `[1]` replaced the article with the not-found view. In-page anchors
  are now scrolled to (and focused) instead of routed, and a fragment with no
  matching element is swallowed rather than parsed as an address.
- **Amigo's live research reached none of its providers.** The
  `Content-Security-Policy` in `_headers` had no `connect-src` entry for
  DuckDuckGo, the GitHub search API, Open-Meteo (weather and geocoding) or HN
  Algolia, so the browser blocked every one of those lookups. All five are
  allowed now, and `test/csp-connect-src.test.mjs` fails if a provider is added
  to the client without being added to the policy.
- **The 429 from `/api/chat` advertised no wait.** `json(body, status, extra)`
  took only two arguments, so the `Retry-After` the caller passed was dropped.
- **The OpenRouter key rotation advanced more than once per request.** The only
  accessor had the rotation as a side effect and was called for the
  `hasOpenRouter` check, again inside `runOpenRouter`, and once per GET health
  check. `listOpenRouterKeys()` is the pure read; `openRouterKeys()` rotates.
- **`X-Forwarded-For` was used whole as the rate-limit bucket**, so a client
  could send its own chain and get a fresh allowance per request. The first
  entry is the caller.
- **A non-list in local storage crashed the views.** `getBookmarks()` and
  `getHistory()` returned whatever JSON was stored; an object made `.some`
  throw inside `isBookmarked`. Both now return a list or nothing.
- **The active bottom-nav tab lost its colour.** `mobile.css` used
  `var(--accent-ink)`, a token no theme defines, with no fallback — invalid at
  computed-value time, so the label inherited the muted grey.
- Removed a duplicated `og:image` and `twitter:image` from nine pages.

## [6.11.0] — 28 November 2026

### Added
- Introduced **Veri**, a non-human, non-robot botanical companion based on the
  supplied leaf mascot. Nine transparent WebP poses cover welcome, idle, wave,
  thinking, warmth, explanation, celebration, listening and joy.
- Added a large character-led greeting to the knowledge home page and Amigo's
  empty state, plus a compact character avatar on every assistant message.
- Linked the mascot's pose to request lifecycle states (thinking, responding,
  completed, stopped and error); image generation gets a separate celebration
  pose. All motion respects `prefers-reduced-motion`.
- Added `assets/css/experience.css` as the site-wide, cache-busted experience
  layer and widened desktop article panels modestly while preserving the TOC
  rail, one-column mobile flow and readable line measure.
- Added dependency-free regression tests for the mascot assets, state mapping,
  responsive rules, reduced motion and build-stamp integration.

### Changed
- Updated `docs/DESIGN.md` to distinguish the product mark, assistant name and
  Veri mascot. The supplied Veridellindo logo remains the product identity.
- Added the 6.11.0 audit record to `docs/` and the documentation index.

### Verified
- `npm run doctor`: all six checks passed. `npm run check`: all 40 modules parsed,
  all imports resolved, and 22 HTML pages / 47 JavaScript files passed the site audit.
- The five new Veri integration tests pass. The full suite reports 215 passing
  tests; six test files cannot load because `jsdom` is absent after the local
  dependency-install attempt timed out. This is an environment limitation, not
  a passing full-suite claim; details are in `docs/DEEP-AUDIT-6.11.0.md`.
- `npm run audit:deep` reports no problems and one existing warning: 73
  `!important` rules in `assets/css/mobile.css`.

## [6.10.67] — 27 November 2026

### Fixed
- Replaced the retired Workers AI `@cf/meta/llama-3.2-3b-instruct` selection with
  Cloudflare’s recommended `@cf/google/gemma-4-26b-a4b-it` model across the
  Pages API, Amigo selector and optional standalone Worker. Existing browser
  settings that selected the retired model are migrated automatically.
- Corrected the Amigo engine label so Gemma 4 is not displayed as Llama 3.3.
- Added shared security and no-cache headers to Pages Function responses;
  `_headers` alone does not cover Functions-generated responses.
- Refined the rounded glass composer and suggestion panel across the main
  search surface, themes and Amigo chat, including reduced-transparency fallbacks.
- Corrected Workers AI comments so the included daily allocation is not
  described as unlimited/free usage.
- Made build stamping work from downloaded source archives without `.git` by
  assigning a deterministic snapshot fingerprint while preserving real Git SHAs
  in normal checkouts.

### Verified
- Added regression coverage for the Gemma model catalogue/routing, legacy
  setting migration, Pages Function response headers and SSE preservation.
- Full source review and final test/audit results are recorded in
  `docs/REVIEW-2026-11-27.md`.

## [6.10.65] — 27 November 2026

### Security
- **`ci` declares its token scope.** The workflow had no `permissions` block, so
  it ran with whatever the repository default grants. It now asks for
  `contents: read` — all it has ever needed, since it only checks out and tests.
- **`ci` and `deploy` jobs now have a wall clock.** `verify` stops at 20 minutes,
  `browser` at 30 and the manual `deploy` job at 15. A hung browser install or a
  stalled `pages deploy` used to hold a runner for up to six hours.

### Verified
- All five workflows now carry an explicit least-privilege `permissions` block
  and a per-job timeout; each file was parsed as YAML after the edit.
- `npm run verify` passes (234 tests) on the stamped tree.

## [6.10.57] — 25 November 2026

### Changed
- Bump the site version so this maintenance update is visible in the footer and build stamp.
- Keep the package manifest, lockfile and site configuration on the same semantic version.

### Verified
- Version workflow checks the package, lockfile, site configuration and every generated HTML build marker against the exact commit.

## [6.10.54] — 22 November 2026

The release where the reading model, the surfaces and the brand were settled.

### Changed
- **Answers and articles read in Q&A lines**: one sentence per line, ending at
  its full stop. The Core answer and Key points sections were removed from every
  surface; a sentence over ~360 characters is broken at a semicolon or comma.
- **Multimorphism is one system** in one sheet, applied by default (`soft`),
  with each preset carrying its own face, shadow, border, blur and corner
  radius. It reaches every container surface and no reading surface.
- **Brand**: one master produces every icon size, the maskable icon, the
  favicon and the social card; every brand URL carries the build, so a cached
  copy cannot outlive a logo change.
- **Ask page**: Workers AI (Pages Function `/api/answer`) phrases the question
  each section answers and orders its lines, with a strict grounding check and
  the page's own ranking as the fallback.

### Fixed
- The floating Amigo launcher is shown at every width and can be dragged up or
  down; the chat rail has one working control per layout.
- The send arrow is centred on the circle's centre, not beside the label.
- Contributor initials no longer print through a logo; a failed avatar falls
  back to the initials instead of an empty circle.
- Thirteen article pages said "Veridellindo" — the retired name — in their titles,
  structured data, header and footer.
- Dead weight removed: six unused exports, two unreferenced modules
  (`library-search.js`, `ollama-client.js`), seven orphaned mascot images, and
  the key-points CSS the removal orphaned.

### Note
Releases 6.2.0 – 6.10.43 were shipped without changelog entries; their commits
are in the git log, and this file resumes here.

## [6.1.0] — 14 November 2026

The release that makes the repository as orderly as the site. No reading
behaviour changed; everything here is about finding things, keeping them
consistent, and noticing drift before a reader does.

### Added

- **`npm run doctor`** — one command that runs the push-time checks in the
  order that fails fastest and prints a single verdict. `npm run doctor:full`
  adds the 270-test suite. Wired into CI and into the weekly health run.
- **`docs/`** — the working documents in one folder with an index
  (`docs/README.md`), so the repository root holds the front door, the licence
  and the changelog rather than eight loose markdown files.
- **`docs/MAINTENANCE.md`** — the runbook: what to run, how often, what each
  failure means, how to add an article, how to release, and what must never be
  committed.
- **`CODE_OF_CONDUCT.md`** — including the one rule specific to this project:
  a change that lets the product present an uncited claim as sourced is out of
  scope.
- **`.editorconfig`** — two-space indent, LF, a final newline, and the one
  exception that matters: markdown keeps its trailing double spaces, because
  they are hard line breaks.
- **`CHANGELOG.md`** — this file.

### Changed

- `CONTRIBUTING.md`, `DESIGN.md`, `AUDIT.md`, `QUALITY.md` and `SECURITY.md`
  moved into `docs/`. Git history follows them; the old root paths are gone
  rather than duplicated, so there is one copy of each document.
- The README now carries a repository map and a short "keeping it organised"
  section that points at the runbook instead of restating it.

### Removed

- Four empty directories (`data/`, `src/`, `styles/`, `tests/`) left behind by
  the previous rewrite. Git never tracked them, but they made a fresh checkout
  look like it had two of everything.

### Verified

`npm run check` — 48 modules, 22 pages, one version. `npm test` — 270 passed,
0 failed. `npm run doctor:full` — all green.

## [6.0.0] — 14 November 2026

The rebuild. The whole site was brought onto one identity and one checked set of
pages, on the capability set of the earlier Encyclopaedia Mundi tree, under the
repository name that was already published.

### Added

- **A new mark** — a faceted V on the forest-to-copper tile, with a single dot
  beneath the point for the source. Shipped as SVG and at 48, 96, 180, 192 and
  512 px, plus a maskable icon and a 1200×630 social card drawn from the same
  geometry.
- **`test/identity.test.mjs`** — nine checks that read the files that ship and
  fail if a page loses its skip link or its canonical, if a stylesheet ships
  unreferenced, if the old product name returns, if a brand asset goes missing,
  or if the package, the manifest and `wrangler.toml` disagree on one name.
- **Preconnect** to the three Wikimedia hosts a page actually calls, from the
  document head.
- **Structured data** on `articles/`, `chat/`, `help/`, `how-it-works/` and
  `research/`, matching the shape the article and topic pages already used.

### Changed

- **One name everywhere** — product, package, Pages project, manifest, storage
  keys, meta tags and canonical host are all `veridell`; the repository stays
  `galeoindus/veridellindo`.
- **One promise** — *Every answer, with its source.* replaces *From question to
  understanding* in the manifest, `config.js`, `i18n.js` and the structured
  data.
- **All 22 pages** now carry a skip link that lands on a landmark that exists.
  `research/` gained the addressable `<main>` it never had.
- The site now ships the full capability set of the earlier tree: the research
  desk, the library across sister projects, on-this-day, topics, the twelve
  content languages and the Amigo chat surface.

### Fixed

- The social card read `indusmova`, with a wordmark two renames out of date. It
  was shipping on every link preview.

## Earlier

The site ran as Encyclopaedia Mundi through 5.29–5.34 before this repository
carried it. Those releases added the AI Mode chat surface, question-aware model
routing, the site guide that answers questions about the product itself from the
product's own facts, and free-only OpenRouter routing. Their detail lives in
`docs/AUDIT.md`, which is append-only.
