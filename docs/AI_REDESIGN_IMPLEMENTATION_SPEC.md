# Veridellindo — AI-Ready Product Audit and Redesign Specification

**Audit date:** 20 November 2026  
**Repository version:** 6.10.34  
**Live site inspected:** <https://veridellindo.pages.dev/>  
**Requested product direction:** Google AI Mode-inspired research and answer experience; not a Wikipedia-style article clone.  
**Brand constraint:** Preserve the current Veridellindo logo artwork. Do not redraw, replace, recolour, crop, or rename the logo assets.

---

## 1. Executive direction

Veridellindo should evolve from a Wikimedia article reader with a separate assistant into a **source-led AI research product**. The defining experience should be:

1. A person asks a question in natural language.
2. The system identifies what needs fresh research, searches appropriate sources, and reads the relevant evidence.
3. The system writes a concise answer in its own editorial structure, not a copied encyclopedia article.
4. Each material factual claim is connected to one or more specific source records and, where possible, to the supporting passage.
5. The user can inspect sources, understand uncertainty, ask follow-up questions, save the conversation, and continue research on desktop, tablet, or phone.

Use the interaction pattern of an AI research/search answer engine: answer first, evidence next, optional deep dives and follow-up questions. Do **not** clone Google's logo, proprietary visual assets, private interface internals, or use an undocumented consumer Google AI Mode endpoint. A supported Gemini API integration with Google Search grounding is the recommended Google technology route.

A full replacement of all 245 files in one pass would create unnecessary route, history, provider, and deployment risk. The recommended approach is an incremental redesign with explicit compatibility contracts and feature flags. Retain the working Wikimedia reader, history store, Amigo streaming/client behaviour, image endpoint, and current logo while new answer, source, and article layers are introduced.

## 2. Repository baseline

The supplied source archive contains approximately 245 files, including:

- 46 JavaScript files;
- 20 CSS files;
- 22 HTML entry pages;
- 13 generated article directories;
- a vanilla JavaScript single-page application;
- Cloudflare Pages Functions under `functions/api/`;
- a dedicated `/amigo/` application;
- an optional, separately deployable `amigo-worker/` project;
- scripts and tests for static audits, generated pages, layout and behaviour.

The application is not a blank or failed project. It already has a meaningful implementation: route handling, search rows, Wikimedia API access, article parsing, local preferences, Amigo conversation history in IndexedDB, streaming, file/image features, live-source connectors, theme controls, and deployment checks. Those capabilities should be preserved and consolidated, not discarded.

### 2.1 What static checks establish

The supplied checkout passed the repository's static site audit, deep audit, and six-stage `doctor` checks. These checks found no static import, asset-path, page-build-stamp, or file-structure failures in the audited scope.

The full test suite did not complete in the supplied environment. The observed run reported 181 passing tests and six test files unable to load because the `jsdom` dependency was not properly installed. An `npm ci` attempt did not complete in the available execution window. This is an environment/dependency blocker, not evidence that the six affected test areas contain six confirmed application defects. Re-run a clean install and the full suite in CI before deployment.

Passing static checks do not prove that all browser interactions, external APIs, provider secrets, Google Search, citations, or real mobile layouts work in production.

## 3. Confirmed findings and defects

### V-01 — Generated articles still look and read like Wikipedia

**Severity:** High / product-direction blocker  
**Evidence:** The live Photosynthesis article identifies Wikipedia as its source, carries the original article's dense prose and section hierarchy, includes many inline entity links, and ends with a large numbered reference dump. The static generator retains the source article's section titles and much of its source HTML.

**Why it matters:** The current output remains recognisably an encyclopedia article. It is not the conversational, structured research brief requested for Veridellindo. Styling alone will not solve this because the content architecture is still the source article.

**Required change:** Replace the default article body with a Veridellindo-authored *topic brief* assembled from structured facts and evidence. Retain a clear “Open original source”/attribution link and the applicable licence notice. The original Wikimedia content can remain available as an optional source view, not the default reading experience.

### V-02 — The generated reference list loses external source links

**Severity:** Critical for trust  
**Evidence:** `scripts/gen_articles.py` reads each reference using `li.get_text(...)`, which converts the entry to plain text. The generated HTML later writes `<li id="ref-N">plain text</li>`; it does not preserve the source's DOI, publisher, journal, or original hyperlink as a clickable URL.

**Why it matters:** A citation marker can jump to a reference entry, but the reader cannot reliably open the underlying evidence. A bibliography-like string is not a usable source card.

**Required change:** Make references structured records, not strings. Preserve canonical outbound source URLs, DOI links, publisher links, author, title, publication date, source type and access date where available. Sanitize external URLs and render them as visible, keyboard-accessible links. Never fabricate a URL when the source markup does not supply one.

### V-03 — Explanatory footnotes are mixed with evidence citations

**Severity:** Critical for trust  
**Evidence:** On the live Photosynthesis page, the first visible `[1]` marker links to a pronunciation note, rather than an identifiable source supporting the opening scientific claim. The generator reads all `li[id^=cite_note]` entries together and renumbers them as one reference sequence.

**Why it matters:** A marker can be technically valid while semantically misleading. The current article tests check that `#ref-N` exists; they do not check whether the linked record is evidence for the claim.

**Required change:** Distinguish explanatory notes, page locators, quotations, and evidence sources. Notes must appear as notes; source-backed claims must cite source records. Add claim/source validation tests. Do not count an explanatory note as a source merely because MediaWiki stores it in a citation list.

### V-04 — Citation mapping is positional, not claim-aware

**Severity:** Critical for trust  
**Evidence:** `assets/js/parse.js` extracts reference text and renumbers superscript markers by reading order. The static generator does the same. These mechanisms maintain anchor integrity but do not record which text fragment or claim a source supports.

**Why it matters:** Correct anchor numbering does not prove citation accuracy. Reordering paragraphs, deleting a note, or inserting an unrelated reference can make a marker misleading without creating a broken HTML anchor.

**Required change:** Store explicit claim-to-source relationships. A citation should attach to a claim block or text range, not merely to the next number in a list.

### V-05 — Search autocomplete bypasses the Search page's local submit handler

**Severity:** Medium / reproducible from source  
**Evidence:** `composerForm()` supports a per-view `onSubmit` override. The Search page uses that override to select Search or Ask based on the active mode. However, `attachSuggest()` previously called `ctx.onSubmit()` directly when a suggestion was selected. That bypassed the Search page's override and could route a suggestion differently from pressing Enter or the Send button.

**Change made in this patch:** `attachSuggest()` now accepts an optional `onSelect` callback, and the Search page passes its own submit handler to both the form and autocomplete. A regression test has been added to assert that selecting a suggestion follows the Search page route.

**Remaining validation:** Run the `jsdom` test suite and reproduce the reported card/box-opening behaviour on the actual browser and device. The exact visual symptom could not be reproduced from the static source archive alone.

### V-06 — Search result rows are not currently a nested-button card grid

**Severity:** Investigation item, not a confirmed defect  
**Evidence:** `assets/js/views/search.js` renders one `.sres-row` anchor per result. The row contains image, source, title and snippet; it does not intentionally nest buttons or links. Existing tests assert that results are rows and that no four-column `.grid` is rendered.

**Interpretation:** The supplied source does not establish that every result row has a nested-click target that opens a box. Do not rewrite the click system on speculation. Use browser instrumentation to record the clicked element, route, focus target, and any dialog/popover state when the user reports the issue. The autocomplete callback defect above is real but may not be the only cause.

### V-07 — Product and privacy documentation contradicts the deployed chat architecture

**Severity:** High / user-trust issue  
**Evidence:** The About/Privacy content, `llms.txt`, README and maintenance guide contained incompatible statements about whether AI chat exists, which endpoint serves it, and which provider is active. The actual first-party Pages Function is `functions/api/chat.js` and the dedicated chat surface is `/amigo/`; `/api/ask` is not present in the supplied function tree. The legacy `/chat/` URL redirects to the home page.

**Change made in this patch:** The About/Privacy descriptions, `llms.txt`, selected README/runbook text, Pages endpoint comments and config examples were updated to identify `/amigo/` and `/api/chat` and to avoid describing the Amigo output as verbatim Wikimedia text.

**Remaining validation:** Compare these statements against the actual Cloudflare production and preview settings, data-retention settings, and any optional external Worker that is still in use. Update privacy statements if deployment configuration differs.

### V-08 — Google Gemini / Google Search grounding is not integrated in the supplied runtime

**Severity:** High / requested capability absent  
**Evidence:** No Gemini SDK/API adapter, `generativelanguage` request, `GoogleGenAI`, Interactions API call, or `google_search` tool configuration was found in the runtime Functions or Amigo app. The Amigo client has optional Google Programmable Search (Custom Search JSON API) configuration and a SerpApi path through the optional Worker; these are search-result connectors, not Gemini grounding.

**Required change:** Add a server-side Gemini provider adapter using the supported Gemini Interactions API and the Google Search tool. Keep credentials in Cloudflare secrets. Parse returned `url_citation` annotations and source metadata into the site's own structured evidence model. Do not claim this integration is complete until a real preview request returns citations and passes validation.

### V-09 — Amigo has two backend deployment paths

**Severity:** High / connection-preservation risk  
**Evidence:** The current Pages route maps Amigo requests to `/api/chat` and `/api/image`. The optional `amigo-worker/` project exposes its own Worker endpoints (`/v1/chat/completions`, `/v1/images/generations`, `/api/search`) and has its own secrets/configuration. The client can also accept a custom Worker URL.

**Why it matters:** Two backends with different route and configuration contracts make it difficult to know which endpoint is active. Removing the Worker without checking current user settings or external links could break an existing connection.

**Required change:** Define one canonical client API contract and keep the Pages Function as the default. Keep the optional Worker as an explicit adapter only while it has a verified consumer. Add route-level health tests and a migration note before retiring any legacy endpoint.

### V-10 — Amigo research sources are gathered separately from model-native grounding

**Severity:** High for citation reliability  
**Evidence:** `amigo/app.js` runs client-side connectors for sources such as Wikimedia/Wikidata, DuckDuckGo, GitHub, Stack Exchange, Hacker News/GDELT, books and research services. Optional Google Custom Search requires its own search configuration. The collected result groups are appended to the model prompt with instructions to cite Markdown links. The Pages chat handler itself does not call Google Search grounding and does not return a structured claim/source annotation model.

**Why it matters:** A prompt asking a model to cite links is not equivalent to structured search-grounding metadata. The model may cite a URL that is not the evidence for the exact sentence, or omit a source. The source drawer at the end of a message is not enough to prove which individual claims are supported.

**Required change:** Move critical search/retrieval orchestration behind a server-side adapter or a controlled retrieval service. Return source records and claim citations as separate structured data. Render only URLs returned by trusted retrieval/grounding metadata, not URLs invented by model prose.

### V-11 — AI provider environment templates contain stale controls

**Severity:** Medium / operations risk  
**Evidence:** The active `functions/api/chat.js` reads `env.AI`, `OPENROUTER_API_KEY_1..12`, and the legacy `OPENROUTER_API_KEY`; it hard-codes its current model ids and OpenRouter free-model list. Root sample templates and older documentation also mention controls such as `AI_PROVIDER`, `WORKERS_AI_MODEL`, `ENABLE_PAID_AI`, and `OPENROUTER_MODEL_TIER`, which this Pages Function does not read.

**Change made in this patch:** The checked-in local and Cloudflare examples were simplified to the secrets actually read by the current Pages Function. The maintenance documentation now distinguishes Pages Functions from the separately deployable optional Worker.

**Remaining validation:** Confirm whether the Cloudflare project still has dashboard-only legacy variables used by any other deployment target before removing them from the dashboard.

### V-12 — Styling and application ownership are fragmented

**Severity:** Medium / maintainability  
**Evidence:** The main SPA, generated static pages, Research Desk and standalone Amigo page have separate CSS and JavaScript entry points. The project also ships generated CSS bundles. `amigo/app.js` is a large single-file application and `amigo/app.css` is a separate stylesheet. There is already a design-token and cascade-layer system; the issue is governance and duplicated ownership, not the absence of any design system.

**Required change:** Make source stylesheets the editable source of truth, define one shared token layer, separate page-specific modules, and treat generated bundles as build artifacts. Never hand-edit a generated bundle. Consolidate repeated component behaviour only where contract tests show that the shared implementation is safe.

### V-13 — API protection needs production-level rate limiting

**Severity:** High / security hardening  
**Evidence:** The Pages chat handler has a request-size limit, message-count limit, same-origin check and an in-isolate `Map` rate limiter. The code itself documents that the `Map` is a local guard and that Cloudflare WAF rate limiting is required for real traffic. Requests without an `Origin` header are intentionally allowed, so same-origin is not authentication.

**Required change:** Add a Cloudflare WAF rate-limit rule and an account-level usage budget. Consider a shared durable rate-limit primitive for authenticated/high-volume use. Add maximum concurrent streams and provider timeouts. Keep secret keys server-side and redact user content from logs.

---

## 4. Target user experience

### 4.1 Home screen

- One clear question box as the primary action.
- Two explicit intents: **Ask** and **Search**. Do not let autocomplete selection silently change the intent.
- A small number of useful example questions, recent topics and saved conversations.
- No decorative content that pushes the main composer below the fold on phone screens.
- Do not use Wikipedia's brand or an encyclopedia-like headline as Veridellindo's own product identity.

### 4.2 Search results

Each result should be a clear, spacious result row/card with:

- a stable, optional thumbnail;
- title;
- source/publisher label;
- short, factual description;
- publication/updated date when known;
- a clear primary action;
- a separate “Ask about this” action only if it is not nested inside another interactive link.

Interaction rules:

- The whole result surface may be one link, or the card may contain independent controls—but never nest an anchor/button inside another anchor.
- Suggestions must have correct `role="combobox"`, `listbox`, `option`, `aria-expanded`, arrow-key, Enter and Escape behaviour.
- A suggestion click must call the same view-level submit callback as pressing Enter.
- Close suggestions on Escape, outside pointer interaction, route change and successful selection.
- Do not allow delayed blur timers to hide a suggestion before its click/pointer event is processed.
- No unexpected modal, dialog or side panel should open when a result row is selected.

### 4.3 Answer page

Recommended hierarchy:

1. **Direct answer** — answer the actual question in a short opening block.
2. **Key points** — 3–7 points, not an article outline copied from Wikipedia.
3. **Evidence by claim** — each important sentence or claim has one or more source links.
4. **What is uncertain / disputed** — clearly label gaps, disagreements and estimates.
5. **Explore further** — related questions and expandable topic sections.
6. **Sources** — source cards with title, publisher, author/date, type and access link.
7. **Method and freshness** — explain when the information was retrieved and whether it used live search.

Do not make every paragraph a list item. Maintain readable paragraph rhythm. Do not show long infoboxes, raw Wikipedia reference markup, giant lists of footnotes, or a sidebar TOC by default.

### 4.4 Topic brief / article page

The default article-like page should become a **Topic Brief**:

- What it is;
- Why it matters;
- Key concepts;
- How it works / timeline / process where relevant;
- Important facts and figures;
- Competing explanations or open questions;
- Supporting sources;
- Related questions.

The topic brief must be authored as a fresh synthesis from evidence, with the underlying source records visible. A link to the original Wikimedia page must remain available for attribution and readers who want the unmodified source. Preserve licence notices and attribution obligations for any reused Wikimedia text or data.

### 4.5 Amigo Chat

Keep Amigo as the dedicated conversational surface at `/amigo/`, but bring it into the shared site design system.

**Desktop:**
- Left conversation rail with search and New Chat.
- Main conversation column with a readable maximum width.
- Composer anchored to the bottom of the conversation area.
- Optional source/evidence side panel that does not cover message content.

**Tablet:**
- Collapsible conversation drawer.
- One main conversation column.
- Sticky composer that respects safe-area insets.

**Phone:**
- Full-width conversation, no hidden horizontal overflow.
- Drawer opens as a sheet and closes after selecting a conversation.
- Composer remains visible above the system keyboard and home indicator.
- Attachment chips and send/stop controls remain reachable with one hand.
- Avoid a second navigation bar overlapping the composer.

Preserve existing capabilities when their contracts pass tests: local chat history, attachments, streaming, stop/cancel, image generation, theme selection, and research connectors. Add clear error/retry states, copy/share, response regeneration, source expansion, and explicit model/search status. Never show “Connected” merely because a settings object exists; show the result of a real health check or a carefully worded “Using this site's endpoint” state.

---

## 5. Evidence and citation architecture

This is the most important data-model change.

### 5.1 Source record

Use one canonical source object per unique URL/document:

```json
{
  "sourceId": "src_01H...",
  "title": "A real source title",
  "url": "https://publisher.example/article",
  "canonicalUrl": "https://publisher.example/article",
  "publisher": "Publisher or journal",
  "author": ["Author name"],
  "publishedAt": "2026-01-15",
  "retrievedAt": "2026-11-20T00:00:00Z",
  "sourceType": "journal | primary-document | government | reference | news | dataset | other",
  "license": null,
  "evidenceExcerpt": "A short, accurately copied supporting passage",
  "trustTier": "primary | authoritative | secondary | community | unknown"
}
```

Optional fields may be absent. Do not invent author, date, publisher, licence, excerpt or canonical URL. Preserve the original URL and redirect information for audit where relevant.

### 5.2 Claim record

```json
{
  "claimId": "clm_01H...",
  "answerBlockId": "answer_intro_1",
  "text": "The factual claim shown to the reader.",
  "claimType": "fact | statistic | interpretation | estimate | disputed",
  "sourceIds": ["src_01H..."],
  "supportStatus": "supported | partially_supported | contradicted | unverified",
  "supportNote": "Why this evidence supports or limits the claim.",
  "confidence": null
}
```

Do not show a numerical confidence score until it has a defensible calibration method. The support status should describe the evidence available, not the model's feeling of certainty.

### 5.3 Citation rules

- A claim cannot cite a source that is absent from the `sources` array.
- A source card cannot appear unless the source URL passed URL validation.
- A claim should link to the exact source(s) supporting it, not a general bibliography.
- If evidence supports only part of a claim, rewrite the claim or mark it partially supported.
- If sources conflict, show both and describe the disagreement.
- If no source supports a claim, label it unverified or omit it.
- Explanatory notes and pronunciation notes must not be displayed as evidence sources.
- Do not let the model invent reference numbers. The renderer creates markers from structured source IDs.
- Preserve access date, source revision/version and content licence where required.

### 5.4 Citation tests

Add tests for:

1. Every citation ID resolves to an existing source record.
2. Every rendered source record has a safe, openable URL.
3. Every cited source ID is attached to a specific claim/block.
4. A note/footnote cannot be promoted to a source without evidence classification.
5. Removing or reordering an answer block preserves its claim/source mapping.
6. A source's displayed title and publisher come from source metadata, not free-form model text.
7. Empty or missing grounding metadata produces an explicit “No verified sources returned” state—never fabricated citations.

---

## 6. Google AI / Gemini integration proposal

### 6.1 Correct interpretation of “Google AI Mode based”

Build a Google AI Mode-inspired interaction: conversational search, multi-step research, an answer with inline citations, source cards and natural follow-up questions. The underlying supported API should be Gemini, not a consumer UI scraping technique or undocumented private endpoint.

As checked on 20 November 2026, Google's official Gemini documentation states that the **Interactions API** became its default interface in June 2026 and recommends it for new projects. Google's official JavaScript getting-started example enables Google Search grounding with `tools: [{ type: "google_search" }]` and extracts `url_citation` annotations from model-output text blocks. These annotations include a source title/URL and start/end indices for the text they annotate.

### 6.2 Recommended server adapter

Create a server-side provider module, for example:

```text
functions/
  api/
    chat.js                 stable public chat contract
    research.js             optional dedicated research endpoint
  _shared/
    providers/
      gemini-interactions.js
      workers-ai.js
      openrouter.js
    evidence/
      normalize-source.js
      map-claims.js
      validate-citations.js
```

The stable browser contract should remain same-origin. Existing Amigo client calls to `/api/chat` must continue to work while the provider implementation is replaced behind the route.

The Gemini adapter should:

1. Read `GEMINI_API_KEY` from Cloudflare encrypted secret storage.
2. Validate user input, message count, content type and maximum request size.
3. Call the current supported Gemini Interactions API and select a currently supported model based on the user's allowed mode and server policy.
4. Enable the `google_search` tool for requests requiring fresh web research.
5. Stream supported response events to the client without inventing token progress.
6. Extract `url_citation` annotations and their text offsets from `model_output` blocks.
7. Normalize sources and citations into the source/claim schema above.
8. Reject unsafe URLs and deduplicate canonical URLs.
9. Return provider/model metadata and a stable, documented error shape.
10. Log operational metadata only; do not log conversation content or secrets.

### 6.3 Provider policy

- Default new deployment path: Gemini + Google Search grounding after key, quota, privacy and preview validation.
- Fallback: keep Workers AI as an explicitly labelled fallback if approved; do not silently fall back to a provider that cannot return equivalent citations while still showing a “grounded” badge.
- OpenRouter: keep only if the owner still needs it. Its free model list is not a substitute for a grounded research provider.
- Provider/model identity must be visible in diagnostics and available in response metadata, but avoid overwhelming end users with internal model strings.

### 6.4 Quota and cost control

Google's pricing page currently lists Gemini 3-and-newer Google Search grounding with 5,000 free search requests per month, then $14 per 1,000 requests, with a default daily cap of 1,500 requests per day per project on the Gemini Developer API. Prices and quotas can change. Re-check the official pricing page before launch; set a daily budget, per-user/IP limit, cache policy and admin alert first. Do not enable unrestricted deep search on every keystroke.

### 6.5 Cloudflare boundary

Use Cloudflare Pages Functions as the same-origin server boundary. API keys belong in encrypted Cloudflare secrets, not `vars`, source files, localStorage, IndexedDB, query strings or browser bundles. Verify the `AI` binding and secret availability in both production and preview environments after redeploy.

---

## 7. Technical architecture and file ownership

### 7.1 Keep the current platform while refactoring

The current project is plain HTML, CSS and ES modules with Cloudflare Pages Functions. A framework migration is not required to achieve the desired UX. First establish clear modules and contracts. Introduce a build tool only if it provides a concrete benefit and after route, asset and cache behaviour is covered by tests.

### 7.2 Suggested ownership boundaries

```text
assets/js/
  app.js                     route shell and lifecycle only
  router.js                  route parsing and compatibility redirects
  views/
    home.js
    search.js
    answer.js
    topic-brief.js
    research.js
  components/
    composer.js
    result-card.js
    source-card.js
    claim-block.js
    conversation-list.js
  data/
    wikipedia-client.js
    research-client.js
    history-store.js
    preferences-store.js
  evidence/
    source-normalizer.js
    citation-renderer.js
    claim-validator.js

functions/
  api/chat.js                stable public API
  api/image.js               existing image endpoint
  _shared/providers/         Gemini, Workers AI, optional OpenRouter adapters
  _shared/security/          validation, limits, origin and abuse controls

amigo/
  app.js or modular entry    chat controller only
  modules/                   history, attachments, stream, research, settings
  app.css                    chat-only layout and components

assets/css/
  tokens.css                 semantic design tokens
  base.css                   reset/type/focus
  components.css             reusable UI
  app-layout.css             shell and major layout
  responsive.css             breakpoints and safe area
  pages/                     narrowly scoped page styles
```

This is a target organisation, not a demand to move every existing file in one commit. Use compatibility re-exports while modules move so imports and tests remain stable.

### 7.3 CSS and asset rules

- Keep the existing logo files exactly as supplied.
- Edit source CSS, not generated CSS bundles.
- Keep cascade-layer ordering explicit and documented.
- Ensure generated bundles contain one copy of each source layer and one shared token definition.
- Scope component styles to classes, not broad element selectors that leak into Amigo or static article pages.
- Use design tokens for colour, typography, spacing, radius, border, surface, focus and z-index.
- Remove dead CSS only after a repository-wide selector audit and screenshot comparison.
- Do not delete an image/font/icon asset because it appears unused in one HTML page; check dynamic imports and `srcset` references first.

### 7.4 Data and history

Keep local conversation history in IndexedDB with a versioned schema and non-destructive migration. Keep small preferences in localStorage. Do not silently discard histories when new data models are introduced. Add export/import and clear-history controls with explicit confirmation.

---

## 8. Route and connection compatibility

Before changing navigation or API code, create automated route-contract tests for the existing active destinations:

- `/` and `/#/`;
- `/#/search?q=...`;
- `/#/ask?q=...`;
- `/#/article/<encoded-title>`;
- `/articles/<slug>/`;
- `/topics/`, `/questions/`, `/how-it-works/`, `/help/`;
- `/research/`;
- `/amigo/`;
- `/api/chat`;
- `/api/image`.

Preserve existing hash routes and canonical URLs until an explicit migration is ready. `/chat/` currently redirects to the home page; `/amigo/` is the active assistant URL in this checkout. Keep old redirects documented and do not point buttons to a route that does not exist.

For every API route, test GET health behaviour, valid POST, invalid JSON, oversized body, missing binding, missing provider key, provider failure, stream completion, stream interruption, browser cancellation and CORS/origin handling. Keep the public request/response contract stable while internal provider code changes.

Do not remove the optional `amigo-worker/` project until a search of production settings, saved client preferences and external links proves it has no active consumers.

---

## 9. Responsive and accessibility acceptance matrix

Test every major page at the following viewport widths, in both light and dark themes:

| Device class | Width | Minimum acceptance |
|---|---:|---|
| Small phone | 320–360 px | No horizontal scroll; composer, menu and source cards fit |
| Common Android phone | 360–432 px | Touch controls reachable; keyboard does not cover input |
| Large phone | 430–480 px | No stretched text measure or giant empty gaps |
| Small tablet | 600–768 px | Drawer and answer layout remain readable |
| Tablet / small laptop | 768–1024 px | Two-column layout only where it helps |
| Desktop | 1280–1440 px | Balanced content width and stable source panel |
| Wide desktop | 1600 px+ | Text does not become excessively wide |

Accessibility requirements:

- WCAG 2.2 AA colour contrast for text and interactive states;
- visible keyboard focus on every control;
- semantic buttons and links with non-duplicate accessible names;
- correct dialog/drawer focus management and Escape handling;
- combobox/listbox semantics and keyboard navigation;
- message log announces completed messages without reading every streamed token;
- `aria-live` for loading/error/complete status, not the entire streaming transcript;
- reduced-motion support;
- minimum 44×44 CSS-pixel touch targets where practical;
- zoom to 200% without loss of function;
- safe-area support for notched phones and virtual keyboards.

---

## 10. Performance, security and reliability

### Performance

- Keep the home hero and first interactive composer as the smallest critical path.
- Lazy-load deep research, source panels, images, article extras and optional feature modules.
- Cache search/source metadata with a short, explicit freshness TTL; never cache user-specific AI answers publicly.
- Use stable asset versioning and verify every generated page uses one build ID.
- Measure Core Web Vitals and Lighthouse after the new design has been deployed to preview.

### Security

- Store Gemini/OpenRouter/SerpApi keys only as encrypted secrets in the environment that actually uses them.
- Validate request body size, number of messages, attachment size, MIME type and maximum extracted text length.
- Apply Cloudflare WAF rate limiting to `/api/chat` and image generation.
- Avoid model-output HTML insertion. Render Markdown through a strict renderer with sanitised `http`/`https` links.
- Keep a host allowlist for provider and redirect URLs; protect against SSRF in any page-fetch endpoint.
- Avoid logging prompts, attached document text, API keys or private history.
- Use CSP and security headers; test all newly added provider endpoints under the existing policy.
- Document what data leaves the browser and which provider receives it.

### Reliability

- Distinguish search failure, model failure, unsupported attachment, timeout, rate limit and citation failure.
- If live search fails, label the answer as not live-grounded; do not show a live research badge.
- If a model returns no citation annotations, show no fabricated citations.
- Preserve user input on retry and provide Stop/Cancel for long requests.
- Do not silently swap providers after stream output has already been shown.

---

## 11. Phased implementation plan

### Phase 0 — Baseline and contracts

- Clean install using the declared Node engine.
- Run `npm run doctor`, `npm run verify`, browser checks and mobile layout checks.
- Capture screenshots of the current home, Search, Ask, article, Research Desk and Amigo routes.
- Record all production/preview bindings, secrets names, custom Worker URLs and redirect behaviour.
- Freeze the current logo files and active route/API contracts.

**Exit gate:** all existing routes and APIs have passing contract tests; known test blockers are resolved.

### Phase 1 — Search and navigation stabilisation

- Keep result rows as the primary Search result shape.
- Fix suggestion selection to use the local view submit handler (included in this patch).
- Add pointer/focus tests for suggestion selection, blur, Escape, Enter, outside click and mode switches.
- Instrument the reported card-open bug in a preview browser and remove only the proven offending event handler/state transition.
- Remove duplicate CTA links and stale routes from generated templates.

**Exit gate:** a user can search, pick a suggestion, open a result, use browser back and switch Search/Ask without accidental route changes or overlay collisions.

### Phase 2 — Evidence data model

- Introduce source and claim types.
- Preserve outbound URLs and metadata in the article generator.
- Separate footnotes/notes from sources.
- Add semantic citation tests and a validator that refuses missing or invalid source records.
- Render source cards with canonical links.

**Exit gate:** every visible citation resolves to an existing source and a specific claim; no note is labelled as evidence.

### Phase 3 — Gemini research adapter

- Add the server-side Gemini Interactions API adapter.
- Enable Google Search grounding for research requests.
- Parse citation annotations and map offsets to answer blocks.
- Add server-side key management, quota, timeout, rate limit and preview diagnostics.
- Keep Workers AI fallback only with a visible non-grounded or separately grounded state.

**Exit gate:** a preview conversation returns an answer, sources and claim/source mappings; error and no-grounding cases are tested.

### Phase 4 — New answer and topic brief UI

- Rebuild Answer/Topic Brief views on structured data.
- Replace raw article clone presentation with the topic-brief hierarchy.
- Keep original Wikipedia source view as an optional source link, with attribution and licence treatment.
- Add useful follow-up chips and expandable evidence details.

**Exit gate:** no default article page resembles a raw Wikipedia page; all facts and source metadata are traceable.

### Phase 5 — Amigo unification

- Reorganise the large chat script into modules while retaining its UI/IndexedDB contract.
- Apply shared tokens and components from the main site.
- Finish responsive drawer/composer/message layout and keyboard behaviour.
- Consolidate provider diagnostics; keep optional Worker path explicit until retired.
- Add source/evidence rendering from the structured backend data, not generated Markdown URLs.

**Exit gate:** Amigo passes desktop/tablet/mobile checks, history migration, attachment/stream/retry and citation tests.

### Phase 6 — Cleanup and optimisation

- Audit duplicate/dead CSS selectors and dynamic asset references.
- Consolidate bundle generation and version stamping.
- Lazy-load optional research features.
- Run Lighthouse, accessibility scans, visual diffs, and real-device tests.
- Delete only files proven unused by route, import, dynamic asset and deployment scans.

**Exit gate:** performance and accessibility targets are met with no route or asset regression.

### Phase 7 — Controlled rollout

- Deploy to Cloudflare Pages preview first.
- Enable Gemini behind a feature flag for internal testing.
- Validate costs, quota, provider status, privacy disclosure, logging and WAF rules.
- Gradually enable the new answer experience.
- Keep the old reader route available for rollback until the new experience is stable.

**Exit gate:** production preview checklist signed off, rollback path tested, existing connections confirmed.

---

## 12. Verification checklist for each pull request

- [ ] Logo assets are byte-for-byte unchanged.
- [ ] Existing active routes still resolve.
- [ ] No button or link points to a removed route.
- [ ] Search autocomplete and result selection use the correct view-local callback.
- [ ] No nested interactive controls inside clickable cards.
- [ ] No default article page renders raw Wikipedia section structure as its primary experience.
- [ ] Every rendered claim citation resolves to a structured source record.
- [ ] Every source record has a safe URL or is explicitly marked as an unlinked bibliographic record.
- [ ] No note/pronunciation footnote is displayed as evidence for a factual claim.
- [ ] Gemini key exists only in Cloudflare encrypted secret storage.
- [ ] No API key is present in JS, HTML, CSS, JSON, Markdown or browser storage.
- [ ] Provider, streaming, retry, stop and error contracts pass.
- [ ] Amigo history migration is non-destructive.
- [ ] Layout tests pass at phone, tablet and desktop breakpoints.
- [ ] Keyboard navigation and screen-reader status behaviour pass.
- [ ] `npm run doctor`, `npm run verify`, browser checks and layout checks pass.
- [ ] Production and preview bindings/secrets are verified after deployment.

---

## 13. Instructions for an AI coding agent

The following prompt can be used as the implementation contract. The agent must read the actual files before editing and must not assume this document describes code that has already been implemented.

> You are modifying the Veridellindo repository. First inspect the full source tree, all route definitions, all HTML entry points, all JavaScript modules, all CSS source layers, all generated bundles, Cloudflare Pages Functions, Amigo, the optional `amigo-worker/`, config templates and tests. Do not begin by replacing files wholesale.
>
> Product goal: transform Veridellindo into a responsive, source-led AI research experience inspired by the interaction pattern of Google AI Mode. The product must not look or read like Wikipedia. The default response should be a concise, original topic brief with structured facts, claim-level citations, useful follow-up questions and expandable source evidence. Keep Wikimedia attribution/licensing wherever Wikimedia content is reused.
>
> Technology goal: use a supported Gemini Interactions API integration with Google Search grounding. Do not scrape Google AI Mode or call undocumented/private endpoints. Keep `GEMINI_API_KEY` in Cloudflare encrypted secrets. Parse official citation annotations and map each source to the exact answer claim/block. Never invent source URLs, titles, dates, publishers or citation numbers.
>
> Brand constraint: preserve every existing Veridellindo logo asset exactly. Do not change the logo or favicon artwork. Reuse the current mark in the redesigned components.
>
> Compatibility constraint: preserve `/`, all active hash routes, `/articles/<slug>/`, `/research/`, `/amigo/`, `/api/chat` and `/api/image` until a tested migration proves otherwise. Preserve local Amigo history and perform non-destructive schema migrations. Do not delete `amigo-worker/` or any asset until every production consumer and dynamic reference has been checked.
>
> Search constraint: every result must have one predictable click target. Do not nest anchors/buttons. Autocomplete selection must call the same view-level submit callback as Enter/Send. Fix the exact browser-reproducible cause of the reported box-opening issue; do not guess.
>
> Citation constraint: use structured source and claim records, separating footnotes/notes from evidence. Anchor existence alone is not a passing citation test. Add tests for claim/source support mappings, URL validity, source rendering, note classification, and failure/no-grounding states.
>
> Responsive constraint: test at 320, 360, 390, 430, 768, 1024, 1280 and 1440 px, with light/dark theme, Android/iOS keyboard-safe composer, reduced motion and keyboard-only navigation. No horizontal overflow and no overlay may hide the composer.
>
> Build constraint: edit source files, not generated CSS bundles. Keep the CSS layer order and build stamp consistent. Run the complete test suite, static audits, browser checks, layout checks and visual regressions. If a test cannot run because a dependency is missing, report that as a blocker; do not mark it as passed.
>
> Delivery: provide (1) a concise change summary, (2) a file-by-file change log, (3) migration and secret setup instructions, (4) tests run and results, (5) known limitations, and (6) rollback instructions. Do not claim the site has been deployed or that Gemini is connected unless a real Cloudflare preview request has confirmed it.

---

## 14. External technical references checked on 20 November 2026

- Google Gemini API documentation: <https://ai.google.dev/gemini-api/docs> — identifies the Interactions API as the default interface from June 2026.
- Google Gemini API getting started: <https://ai.google.dev/gemini-api/docs/get-started> — demonstrates `tools: [{ type: "google_search" }]` and extraction of `url_citation` annotations.
- Google Gemini pricing: <https://ai.google.dev/gemini-api/docs/pricing> — current model and Google Search grounding quota/pricing details; verify again before launch.
- Cloudflare Pages Functions bindings: <https://developers.cloudflare.com/pages/functions/bindings/> — documents Pages Function access to platform bindings and encrypted secrets.
- Cloudflare Workers AI bindings: <https://developers.cloudflare.com/workers-ai/configuration/bindings/> — documents the `env.AI` binding and model invocation.

All prices, quotas, API defaults and supported models are time-sensitive. The implementer must verify them against the official documentation during implementation.


## 15. What was changed in this audit patch

This section separates verified source edits from the larger redesign that remains to be implemented.

### 15.1 Source files changed

| File | Change |
|---|---|
| `assets/js/composer.js` | Added an optional view-level autocomplete selection callback; kept the existing fallback for other views. |
| `assets/js/views/search.js` | Passed the Search page's own submit handler to the composer and suggestion selector so selected suggestions follow the same route logic as Enter/Send. |
| `test/search-view.test.mjs` | Added a regression test for selecting an autocomplete suggestion in Search. The test file still requires `jsdom` to execute. |
| `assets/js/views/pages.js` | Corrected About and Privacy descriptions so they distinguish Wikimedia reader requests from Amigo messages sent through `/api/chat`, and describe local chat history. |
| `assets/js/api.js` | Corrected an obsolete endpoint comment. |
| `llms.txt` | Corrected crawler-facing product and data-flow descriptions, including the `/amigo/` and `/api/chat` routes. |
| `README.md` | Corrected the Amigo route and clarified that Gemini/Google Search grounding is not present in this checkout. |
| `docs/MAINTENANCE.md`, `docs/README.md`, `docs/SECURITY.md` | Aligned maintenance, setup and security guidance with the code currently in the repository. |
| `.env.example`, `.dev.vars.example`, `cloudflare.env.example` | Removed stale example controls that are not read by the active Pages Function; retained the currently read optional OpenRouter key names. |
| `wrangler.toml` | Corrected the endpoint comment and removed a misleading runtime variable declaration. |
| `docs/AI_REDESIGN_IMPLEMENTATION_SPEC.md` | Added this full audit and AI-agent implementation specification. |

No logo, favicon, mascot or other brand artwork was edited. No route file, Pages Function implementation, AI provider, database schema, or Cloudflare production setting was replaced by this patch.

### 15.2 Validation actually run after the patch

| Check | Result |
|---|---|
| `node --check` on the changed JavaScript modules | Passed for `composer.js`, `views/search.js`, `views/pages.js` and `api.js`. |
| `npm run audit:site` | Passed: 46 JavaScript files parsed, 22 HTML entry pages checked, local asset paths/build IDs consistent. |
| `npm run audit:deep` | Passed: 22 HTML, 46 JavaScript, 20 CSS and 246 files in the patched tree; zero reported problems or warnings. |
| `npm run doctor` | Passed all six checks: modules, pages, deep, scan, health and drift. |
| `npm test` | 181 passed; 6 test files could not start because `jsdom` could not be resolved from the incomplete `node_modules` directory. No conclusion is made about the assertions inside those six files. |
| Live UI browser reproduction | Not completed. The live page's route shell was inspected, but the dynamic `/#/search` click sequence and the reported surprise box opening were not reproduced in a real browser session. |
| Cloudflare production deployment | Not performed. No Cloudflare account or deployment credentials were supplied. |

The static checks are strong repository-consistency evidence, not a production sign-off. Before deployment, install dependencies from the lockfile in a clean Node 20.19+ environment, run the full suite, perform browser/device checks, and verify the actual Cloudflare preview bindings and secrets.

### 15.3 Explicitly not completed

- The complete search, answer, article and Amigo visual redesign is specified but is not yet implemented in this patch.
- The Wikipedia-style generated article template and reference renderer still require the Phase 2/4 work described above.
- The Gemini Interactions API and Google Search grounding adapter is proposed, not installed or connected.
- The exact search-card “box opens” symptom remains unverified at runtime; only the source-confirmed autocomplete callback defect has been patched.
- Cloudflare dashboard variables, WAF rules, production secrets and live caches have not been changed.

This is an intentional safety boundary: the patch fixes verified low-risk defects and supplies a complete implementation contract without pretending that an untested wholesale rewrite or live deployment has occurred.
