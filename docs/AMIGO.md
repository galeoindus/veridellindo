# Amigo — chat interface

The assistant lives at `/amigo/` and answers from this site's own Pages Function.
No Worker URL, no key in the browser.

## How a request flows

1. `amigo/index.html` renders the shell. Messages go into `#chatMessages`
   (`role="log"`), and short status text goes into `#chatStatus`
   (`role="status"`, `aria-live="polite"`). The two are separate on purpose: a
   log would otherwise announce every streamed token.
2. `amigo/app.js` calls `/api/chat`. `functions/api/chat.js` runs Workers AI
   first and falls back to OpenRouter free models only when a key exists.
3. `/api/image` draws pictures with FLUX.1 schnell.
4. `/api/answer` is a separate, narrower Function: it sends one article's own
   section headings and sentences so the model can order them for the question.
   It never writes a sentence — a reply that is not a permutation of the
   section's own indexes is dropped and the page keeps its own ranking.

## Appearance

`assets/js/global-theme.js` is the only theme owner. It stores auto/light/dark
under `veridell:theme`, resolves `auto`, and paints `html[data-theme]`. For this
page only it mirrors the resolved theme onto `body.dark`, because the page
stylesheet still reads that class. `amigo/boot.js` does not own theme state.

## The character

Six poses in `assets/img/amigo/`, one per state, never decoration on every
message: `amigo-wave` (empty conversation), `amigo-think` (request pending),
`amigo-insight` (answer carries evidence), `amigo-reading` (a document is being
processed), `amigo-celebrate` (a meaningful completion), `amigo-help`
(recoverable failure). Sizes follow the integration note: 128/108 px hero,
48/40 status, 64/56 context.

## CSS

Everything is inside the layer contract declared at the top of `amigo/app.css`
and of every generated bundle: reset, tokens, base, components, layout, pages,
responsive, utilities, overrides. Page composition sits in `pages`, geometry in
`layout`, breakpoints in `responsive`. Stacking uses the `--z-*` tokens; there is
no second numeric scale.

## Checks

- `npm test` — unit and source-contract tests, including
  `amigo-document`, `amigo-theme`, `amigo-rendering`, `amigo-layout`,
  `amigo-accessibility` and `css-layers`.
- `npm run check:layout` — real browser geometry at six device sizes; fails on
  horizontal overflow, a hidden composer, a stream that cannot scroll, or an
  oversized drawer.
- `npm run doctor` — modules, pages, deep audit, health, drift.

## Storage

Conversation history lives in IndexedDB (`veridellindo-amigo`, store `history`),
keyed by skill. It is asynchronous and large enough to hold a real conversation,
and a failed write is shown to the reader instead of being swallowed — silence is
how someone loses a conversation without being told.

The migration from the old localStorage records is non-destructive: a record is
copied into the database the first time it is seen, and the local copy is removed
only after the write has succeeded.

Small preferences stay in localStorage. Personal credentials (the GitHub token,
the Google key) are held in memory for the session only and are never written to
localStorage, IndexedDB, exports or logs. Provider keys belong in Cloudflare
secrets, server-side.

## Streaming contract

The endpoint emits `meta`, `delta`, `done` and `error` frames. `done` carries
`streamed: true` only when deltas were actually emitted, so a provider that
returns the whole answer at once is described as a completed response rather than
a progressive stream. The client honours that flag instead of inventing a typing
animation.
