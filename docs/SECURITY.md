# Security

## What this site holds

Nothing about you. There is no account, no sign-in, no analytics script and no
server-side history. Chat threads, saved answers and memory notes live in your
browser's own storage.

When Amigo is used, the message context (and any attached content needed for the request) is sent to this site's `/api/chat` Pages Function, which forwards it to the configured model runtime. The Function does not persist chat history; the browser stores the conversation locally. The model provider receives the submitted content and handles it under its own terms. Two more Functions use the same Workers AI binding: `/api/answer` sends the selected article's own section headings and sentences so the model can order them for the question, and `/api/image` sends an image prompt. Neither stores anything either. Search and article requests are separate and go directly to Wikimedia APIs.

## Reporting a problem

Open an issue with the `security` label, or write to the address on the GitHub
profile. Please do not open a public issue for anything that would let someone
else exploit it before it is fixed.

## What is deliberately not here

- No API key in the client. The model keys are Cloudflare secrets, server-side.
- No tracking script. No page ships an analytics tag, a cookie or a beacon, and
  there is no third-party code whose job is to watch the reader. The content
  policy is **not** `'self'`-only, and this file should say so plainly rather
  than claim otherwise: `script-src` allows `'self'`, `'wasm-unsafe-eval'`,
  `https://cdn.jsdelivr.net` and `https://static.cloudflareinsights.com`.
  - `cdn.jsdelivr.net` is the optional Hugging Face Transformers runtime that
    `assets/js/rank.js` loads to re-rank results in the browser.
  - `static.cloudflareinsights.com` is permitted for Cloudflare's own edge
    tooling. Nothing in this repository loads a beacon from it; if Web Analytics
    is switched on in the Cloudflare dashboard, Cloudflare injects that beacon at
    the edge, and the policy above is what lets it run.
- No `innerHTML` with model output: markdown is escaped first, then our own tags
  are introduced, and links are limited to http(s).
