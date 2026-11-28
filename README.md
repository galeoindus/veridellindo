# Veridellindo

**Every answer, with its source.**

Veridellindo is a Wikimedia knowledge research and discovery platform. Ask a question, or open a topic, and get a direct answer in question-by-question lines, a topic-wise breakdown, the facts from the infobox, and every source with a link back to Wikipedia.

It is a **static single-page application** — plain HTML, CSS and ES modules with no frontend bundler — plus Cloudflare Pages Functions for Amigo chat and image generation. Amigo gathers optional live research sources in the browser before sending the conversation to the model endpoint. Cloudflare Pages runs a small Node build step to stamp each deployment and bundle the stylesheets. Search, article and Wikidata data are fetched live in the reader's browser from the public Wikimedia APIs, which need no key. The AI endpoint's OpenRouter credentials are Cloudflare encrypted Secrets and never reach the browser.

---

## What this release changes

Veridellindo 6.0 is the whole site rebuilt on one identity, one stylesheet layer and
one checked set of pages. The reading model — a question in, a sourced answer
out — is unchanged, because it was the right one. What changed is everything
around it.

**One name, everywhere.** The product, the Pages project, the manifest, the meta
tags and the canonical host are all `veridellindo` — the Pages project name in
`wrangler.toml`, the host `https://veridellindo.pages.dev` and the repository
`galeoindus/veridellindo` included. The one deliberate exception is the npm
package name, `veridell`, which `test/identity.test.mjs` pins so that renaming it
is a decision rather than a drift.

**A unified mark.** The supplied Veridellindo lotus-and-gradient logo now appears
throughout the site and Amigo, including browser/app icons and the social card.
The original transparent artwork is kept as the master; responsive PNG sizes and
a maskable app icon are generated from it.

**Every page checked, not just the home page.** All 22 HTML entry points now
carry a skip link that lands on a real landmark, a canonical address, and
structured data. The 404 is the one exception to the canonical rule, because a
missing page has no address to claim.

**Fewer round trips before the first pixel.** The three Wikimedia hosts a page
actually calls are preconnected from the document head, so the first search does
not pay for a DNS lookup and a TLS handshake it could have started earlier.

**Tests that hold the identity still.** `test/identity.test.mjs` reads the files
that ship and fails if a page loses its skip link or its canonical, if a
stylesheet ships that no page asks for, if the old product name comes back, if a
brand asset goes missing, or if the package, the manifest and `wrangler.toml`
disagree about who this site is.

---

## What it does

| Feature | Where |
|---|---|
| **Ask** — a question in your own words, answered from the best-matching article | `#/ask?q=…` |
| **Search** — matching articles as cards | `#/search?q=…` |
| **Article** — opens as a Veridellindo **breakdown**, not a Wikipedia page: evidence, numbered topic blocks whose lines run one sentence each, facts, sources, method. Two more tabs carry the full re-set text and the Markdown. | `#/article/<Title>` |
| **On this day** — events, births, deaths and holidays for any date, as a timeline | `#/today` |
| **Explore** — categories and the most-read articles right now | `#/explore` |
| **Saved / Bookmarks** — kept on the device | `#/bookmarks` |
| **Reading history** | `#/history` |
| **Articles** — thirteen topics published as complete, indexable article pages: lead, quick facts, numbered table of contents, sections with inline citations, references, related topics | `/articles/<slug>/` |
| **Library** — one search across every free, keyless source Veridellindo knows, grouped by source and named | `#/library?q=…` |
| **Work** — a book, paper or archive item, rendered in the same architecture as an article | `#/work?src=…&id=…` |
| **Sources** — every source, what it is, and under which licence | `#/sources` |
| **Markdown export** — copy or download any answer or article as Markdown | answer & article views |
| **Two languages of chrome** — English and हिन्दी, plus 12 content languages | header buttons |
| **Light / dark / system theme**, one preference shared by every page; reading comfort and a reading-progress bar | header button on every route |
| **Credits** — a logo-led attribution page: project identity, maker, the knowledge and infrastructure it runs on, AI-development acknowledgement, contributors and the licences | `#/credits` |
| **Voice search**, where the browser supports it | composer |
| **Amigo chat** — a separate conversational interface with saved local history, streaming responses, attachments, theme controls and a same-origin Pages Function | `/amigo/` |
| **Site guide** — product help can use the repository's curated site facts; keep this separate from model-generated answers | `/amigo/`, `assets/js/site-knowledge.js` |
| **PWA** — installable; the shell loads offline (no service worker: caching is done with `_headers`) | `manifest.webmanifest`, `_headers` |

### The answer architecture

Every answer — asked or opened — is laid out the same way, from components the
design system already defines:

```
.evidence      how the answer was ranked, and from how much
.qa-answer     the sentences that answer it (.line-list)
.qa-line       one sentence per line (.qa-lines)
.topic-block   numbered topics, short by default, each extendable
.factbox       the infobox, as label/value rows
.src-group     sources as cards, with licences
.method-note   exactly how the answer was produced
.fb-row        emoji feedback
```

**Answer depth acts immediately.** Quick answer, Detailed and Deep dive
re-compose the open answer the moment they are clicked — no second submit, no
reload. Deep dive also opens every topic block extended. A thin `.depth-bar`
shows which level is active.

### How an answer is built

1. **Ask** — the question goes to the Wikipedia search API.
2. **Research** — the best-matching article is fetched in full, with its sections.
3. **Filter** — the article is cleaned (navigation boxes, edit links, footnote markers and MathML annotations dropped), split into a lead and topic sections, and its sentences are scored against the question.
4. **Understand** — a direct answer in lines, topic blocks, facts and sources are laid out.

The default ranker is keyword overlap with a rough IDF weighting. The optional **Understand meaning** switch loads a small open sentence-embedding model (`Xenova/all-MiniLM-L6-v2`, about 23 MB, once) via transformers.js and re-orders the same sentences by cosine similarity. In this extractive mode nothing is generated — every sentence is quoted from the article, and the ranking only chooses the order.

The current Pages Function at `/api/chat` tries Cloudflare Workers AI first and can fall back to OpenRouter free models when a key is configured. It also supports explicit provider selection from a server-owned allowlist. Do not assume that Google Gemini or Google Search grounding is integrated: this checkout contains no Gemini API adapter. Amigo keeps conversation history in IndexedDB on the reader's device; site search and article requests go to Wikimedia directly and are not sent to a model.

### Reading progress in the contents

The contents panel follows the current practice for long articles: it stays
collapsed until asked for (the header button, or the button above the tabs),
shows how much is left — *"12 of 34 sections · about 25 min left"* — marks each
section unread, being read or read, and marks the current item with
`aria-current`. Choosing a section scrolls to it, opens it, records it in the
address bar as `?s=…`, and closes the panel.

### Knowing which build you are on

The footer shows the package version and the exact build commit. The
Cloudflare Pages production build runs `npm run stamp:build` before publishing:
it stamps every HTML entry point, updates versioned asset URLs and writes
`assets/version.json` from the commit being deployed. The GitHub Actions
`version` workflow runs the same build step and fails unless the JSON stamp
and every HTML build marker match that commit. This makes the published stamp
a verified build output rather than a stale file left over from an earlier
source commit. The page reads the stamp on load; if the deployed build differs
from the one already running, it clears the relevant caches and reloads once.

### Tests and checks

```bash
npm run check     # parse every module, verify every import, catch debug leftovers
npm test          # unit tests: routing, query keys, parsing, slugs, links,
                  # chat streaming, API limits and the interface dictionary (duplicate keys, missing
                  # translations, English copy left in the Hindi block)
npm run verify    # both
```

`npm run check` exists because the audit found the previous check script ran
`node --check` on the entry module alone. It now covers every file, and — more
usefully — verifies that each named import is really exported by the module it
comes from, which is the mistake that reaches a browser as "does not provide an
export named…" and leaves a blank page.

### Open sources

Everything Veridellindo reads is free, public and needs **no API key**. They are
called straight from the browser, so each one has to send CORS headers — arXiv
and Google Books do not, and are deliberately absent.

| Family | Sources |
|---|---|
| Wikimedia | Wikipedia, Wikiquote, Wikisource, Wikinews, Wikibooks, Wikiversity, Wikivoyage, Wiktionary, Wikidata, Wikimedia Commons |
| Books | Project Gutenberg (Gutendex), Open Library, Internet Archive |
| Research | Crossref, OpenAlex, Europe PMC, PubMed, DOAJ |
| Metrics | Wikimedia pageviews (the "most read right now" list) |

The Library searches all of them at once and names the source on every result.
A source that is unreachable or rate-limited is reported as such and the rest
still render. Wikipedia's sister projects use the same API shape, so they get
the same full breakdown as an article; the others render as a *work* — title,
summary, metadata as facts, and a link to the source.

### The Evidence Desk redesign

The interface follows the redesign proposal's "Evidence Desk" direction — a
calm, source-forward research surface.

**One clear starting point.** The home page leads with one labelled field and a
two-option mode control, *Ask a question* / *Find an article*, each with a
one-line explanation of what it will do. The submit button and the helper line
change with the mode; the text you have typed is kept when you switch. An
example prompt fills the field rather than firing a navigation you did not ask
for, and submitting an empty field says so instead of doing nothing.

**Evidence before decoration.** An answer reads: the query, the article it came
from, *Passages selected from this Wikipedia article — not newly written*, the
the topic blocks (one sentence per line), facts, sources, then the method.
Citation markers carry a name a screen reader can use ("Open source 2, section
'Causes'"), the facts panel says the facts come from the infobox and may be
incomplete, and the method note keeps its headline counts visible while the
detail stays disclosed. Ranking is described as relevance, never as truth.

**Navigation around the task, not the feature list.** The sidebar is grouped
Discover / My library / About; the header keeps four destinations; the phone bar
carries four. Saved content is labelled *On this device*, and the sidebar says
plainly that it does not sync. Language controls name their setting — "Wikipedia
edition" and "Interface language" — because they are two different things.

**Recovery designed as part of the product.** Offline, rate-limited, not found,
no results and storage-blocked states each say what happened in plain language,
keep the query on screen, and offer one next step. A failed lookup never erases
the question.

### The article template

Every article — the static pages and the in-app view — follows one structure:

```
breadcrumbs        Home > Topics > <Title>, every crumb a real link
lead               one H1, a short sourced lead, source and revision metadata
quick facts        the infobox, as label/value rows
contents           a numbered, nested table of contents with stable anchors
sections           Wikipedia's own numbering (2, 2.1), never a heading-only stub
inline citations   [1] [2] [3] in reading order, each linking to its reference
references         the numbered list the markers point at
related topics     internal links, plus the other language editions
footer             attribution, licence and the modification notice
```

**Attribution is explicit.** Reused text carries the source, the licence, a link
to the original and a statement that Veridellindo reformats and condenses it —
which the licence requires and which the audit asked for. Pictures are checked
**one at a time**: each gallery image asks Wikimedia Commons for its own licence
and author, because a text licence does not cover the media.

### Stable article URLs

`/articles/<slug>/` is a real path. Cloudflare Pages serves the thirteen
generated pages from disk and rewrites everything else under `/articles/*` to
the app shell, which reads the slug out of the address bar. So a link can be
shared, pasted, refreshed and crawled, and the canonical URL always matches
what the reader sees.

### The section jumper

An article's whole structure is available from a **Jump to a section** panel
that stays collapsed until it is asked for — the jump button in the header
(next to the language buttons), or the button above the tabs. Choosing a
section scrolls to it and opens it; the panel closes itself.

---

## Project layout

```
veridellindo/
├── index.html                 the app shell (one document, hash-routed)
├── 404.html                   Cloudflare Pages not-found page
├── topics/                    crawlable index pages (static, no JS needed)
├── questions/
├── how-it-works/
├── help/
├── manifest.webmanifest       PWA manifest
├── robots.txt · sitemap.xml
├── _headers · _redirects      Cloudflare Pages configuration
├── assets/
│   ├── css/styles.css         the base design language (kept intact)
│   ├── css/app.css            components and corrections on top of it
│   ├── css/design-system.css  the shared tokens every layer reads (loaded last)
│   ├── img/                   favicon, icons, Open Graph image
│   └── js/
│       ├── app.js             entry point: context, header, router, rail
│       ├── global-theme.js    the one theme controller, on every route
│       ├── config.js          site constants, categories, depths, sources
│       ├── api.js             the Wikimedia client (cache, retry, errors)
│       ├── parse.js           clean Wikipedia HTML, split into parts
│       ├── answer.js          compose an answer from a question + article
│       ├── rank.js            keyword ranking + optional meaning model
│       ├── markdown.js        Markdown export
│       ├── i18n.js            English + Hindi chrome strings
│       ├── store.js           localStorage: bookmarks, history, prefs
│       ├── theme.js           reading comfort and progress (theme lives in global-theme.js)
│       ├── router.js          hash router
│       ├── answerui.js        the shared answer architecture
│       ├── ui.js · icons.js · components.js · composer.js
│       └── views/             home, search, ask, article, pages
├── functions/api/             the Pages Functions (ask, models, speech, image)
├── scripts/                   build, audit, release and maintenance scripts
├── test/                      the suite, one file per concern
├── docs/                      design, quality, audit, contribution, runbook
├── CHANGELOG.md               what changed, release by release
└── package.json
```

---

## Keeping it organised

The repository is meant to stay readable a year from now, so the rules are
short and they are enforced rather than remembered.

**One command tells you whether the tree is still well:**

```bash
npm run doctor        # modules, pages, deep audit, drift — about 35 seconds
npm run doctor:full   # the same, then the full Node test suite
```

It runs the checks in the order that fails fastest and prints one verdict. CI
runs it on every push and the weekly health workflow runs the full version on
Mondays, so drift is caught by a machine before a reader finds it.

**The variables that run the deployed site** are pasted into Cloudflare, not
uploaded as a file: Cloudflare Pages has no `.env` at runtime. `cloudflare.env.example`
is the paste-ready list — `NAME=value` lines, no comments, because the bulk
editor imports every line it is given. The steps and what each name does are in
[docs/MAINTENANCE.md](docs/MAINTENANCE.md#setting-the-variables-on-cloudflare).

**Where things are written down.** [docs/](docs/README.md) is the index.
[docs/MAINTENANCE.md](docs/MAINTENANCE.md) is the runbook — what to run, how
often, what each failure means, how to add an article, how to release, and what
must never be committed. [docs/QUALITY.md](docs/QUALITY.md) names the command
and the commit behind every check it claims, and says plainly which checks were
not run. [docs/AUDIT.md](docs/AUDIT.md) is append-only: a new release prepends a
section and old ones are never rewritten.

**The rules the tree holds itself to.**

- One version, written by `npm run stamp:build`, in `package.json`, every page,
  `config.js` and `assets/version.json`. `npm run check` fails if they disagree.
- One name, in the package, the manifest, `wrangler.toml`, the canonical host
  and the meta tags. `test/identity.test.mjs` fails if a second one appears.
- Every page carries a skip link that lands on an id that exists, a canonical
  address and structured data. The same test checks all three, on all 22 pages.
- Generated files — the four CSS bundles, `sitemap.xml`, `assets/version.json` —
  are written by scripts. A diff in one of them means a script ran, not that
  someone typed.
- A key never enters the tree. `weekly-audit.mjs` scans every text file for the
  shapes of one.

---

## Running it locally

There is nothing to build. Serve the folder over HTTP:

```bash
npm start            # python3 -m http.server 4173
npm run dev          # the same site through wrangler pages dev, with functions/
```

Then open <http://localhost:4173/>. (`npx serve .` also works, but it picks its
own port — usually 3000 — so read the URL it prints.)

> Open it over `http://localhost`, not `file://` — ES modules and the Wikimedia APIs need a real origin.

## Deploying to Cloudflare Pages

**Option A — Git integration.** Push this repository to GitHub, then in the Cloudflare dashboard create a Pages project and connect the repo. Use:

- **Framework preset:** None
- **Build command:** *(leave empty)*
- **Build output directory:** `/` (the repository root)

**Option B — direct upload / Wrangler.**

```bash
npm run deploy          # creates the project if it is missing, then uploads
```

`npm run deploy` reads the project name from `wrangler.toml`, creates the Pages
project when the account has none, stamps the build and uploads. By hand it is
two commands, and the first one is the one people forget:

```bash
npx wrangler pages project create veridellindo --production-branch=main
npx wrangler pages deploy . --project-name=veridellindo
```

**A fresh Cloudflare account has no Pages projects.** A project belongs to the
account that made it, so a new account starts empty and `pages deploy` answers
`Project not found` until the project exists — that message is not a broken
repository. `npm run deploy`, the deploy workflow and the two commands above
all create it first.

The project name, `SITE.origin` in `assets/js/config.js`, the canonical and
Open Graph URLs in `index.html`, `robots.txt`, `sitemap.xml`, `llms.txt` and
the crawlable pages are one identity: `https://veridellindo.pages.dev`.
If you deploy under a different name, change them together in one commit,
otherwise the canonical URLs point at a host that is not serving the site.

`_headers` and `_redirects` are read automatically.

---

## Accessibility

Targets WCAG 2.2 AA. Keyboard-navigable throughout, a skip link, visible focus rings, `aria-current` on the active navigation item, live regions for voice and toasts, and a reading-comfort switch that makes translucent surfaces opaque. Motion is reduced under `prefers-reduced-motion`.

## Privacy

No accounts, no analytics, no cookies, no tracking. Bookmarks, reading preferences and saved answers live in `localStorage`; Amigo conversation history lives in IndexedDB, on the device. Search and article requests go from your browser directly to Wikimedia. When you use Amigo, your message is sent to this site's own `/api/chat` function and on to the configured AI provider; nothing else about you is sent, and no provider credential is ever exposed to the page.

## Licences

- **This project's code** — MIT (see `LICENSE`).
- **Wikipedia article text** — CC BY-SA 4.0.
- **Wikidata data** — CC0 1.0.
- **Wikimedia Commons files** — their own licences, shown with each image.

Veridellindo is an independent reader and is **not affiliated with or endorsed by the Wikimedia Foundation**.


### Conversation continuity and reader preferences

Amigo now stores multi-turn conversations as local sessions with resumable checkpoints. Follow-up context is scoped to the selected chat and sent in a bounded window; research answers still require support from the fresh Wikipedia passages for that turn. Sessions are stored in the current browser profile only and do not sync across devices. Avoid entering sensitive personal data or credentials.

The shared preferences panel offers system/light/dark appearance, Balanced/Glass/Soft/Clay surface styles, compact/comfortable/wide reading width and standard/large/extra-large article text. Glass and clay effects are intentionally limited to interface chrome and focal cards; reading content stays opaque for legibility.
