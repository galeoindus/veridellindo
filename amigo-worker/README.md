# Amigo Worker (optional)

> **You do not need this to use the chat.** The site now answers from its own
> `/api/chat` and `/api/image` Pages Functions, on the `AI` binding the Pages
> project already declares. Nothing to deploy, no URL to paste.
>
> Keep this Worker only if you want the assistant reachable from a *different*
> origin, or if you would rather keep the AI calls on a Worker you control.

The backend for the Amigo interface at `/amigo/`. It is a separate Cloudflare
Worker because the site itself is static: the keys live here, in Worker
secrets, and never in the browser.

```
worker.js          the whole backend — chat, vision, images, optional search
wrangler.jsonc     binding, allowed origins, site origin
package.json       wrangler, nothing else
```

## How this relates to the Pages Function

The maintained path is `functions/api/chat.js`. This Worker is a **reduced**
implementation of the same contract: it answers chat, vision and image requests
on Workers AI with the same model ids (Gemma 4, Llama 3.3 70B, Llama 4 Scout,
FLUX.1 schnell), but it does not carry the Function's request-size guards, its
model allowlist validation, its OpenRouter key rotation across twelve slots, or
its structured error codes. If you deploy this Worker, expect those differences —
or point the page at `/api/chat` instead, which needs no deployment at all.

## What it serves

| Route | What it does |
|---|---|
| `GET /health` | Which bindings and secrets this Worker can see. |
| `POST /v1/chat/completions` | Workers AI first, OpenRouter free models as the fallback. Vision when an image is attached. |
| `POST /v1/images/generations` | FLUX.1 schnell on Workers AI. |
| `GET /api/search?q=…` | Optional SerpApi proxy; returns `configured: false` when no key is set. |

## Deploy

```bash
cd amigo-worker
npm install
npx wrangler secret put OPENROUTER_API_KEY   # optional; Workers AI works without it
npm run deploy
```

The Worker answers on `https://amigo-ai.<your-subdomain>.workers.dev`.

## Then point the page at it

Open `/amigo/` → **Settings** → paste that URL → choose a model → **Save** →
**Test connection**. The URL is stored in the browser, not in the repository,
because it differs per Cloudflare account.

## What was fixed before this shipped

- **`ALLOWED_ORIGINS`** was the placeholder `https://your-amigo-site.example`,
  which would have rejected every call from the real site with a 403. It now
  lists `https://veridellindo.pages.dev` and `http://localhost:4173`.
- **`HTTP-Referer`** was only sent when the browser sent an `Origin`. A
  same-origin fetch does not, so OpenRouter saw no referer at all. It falls back
  to `SITE_ORIGIN` now.
- **Free model ids** come and go on OpenRouter. The router id is tried first,
  then three explicit free models, instead of failing the whole turn.

## Secrets, and what not to do

`OPENROUTER_API_KEY` and `SERPAPI_KEY` belong in `wrangler secret put`, never in
`wrangler.jsonc`, never in the page, never in this repository. Secrets are
per-Worker: a key stored on another Worker is not visible here.

Rate limiting on this Worker is Cloudflare's job — put a WAF rate-limit rule in
front of `/v1/*` before pointing a lot of traffic at it. CORS is not
authentication.
