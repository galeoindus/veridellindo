const DEFAULT_WORKERS_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const VISION_WORKERS_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const MAX_REQUEST_CHARS = 16 * 1024 * 1024;
const MAX_MESSAGES = 40;

function allowedOrigin(origin, env) {
  if (!origin) return true;
  const configured = String(env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean);
  if (!configured.length || configured.includes("*")) return true;
  return configured.includes(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const configured = String(env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean);
  const allowOrigin = !origin ? "*" : (!configured.length || configured.includes("*") ? "*" : origin);
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...corsHeaders(request, env), "Content-Type": "application/json; charset=utf-8" }
  });
}

function hasImages(messages) {
  return messages.some(message => Array.isArray(message.content) && message.content.some(part =>
    part && part.type === "image_url" && part.image_url && typeof part.image_url.url === "string"
  ));
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) {
    throw new Error(`messages must contain between 1 and ${MAX_MESSAGES} items`);
  }
  const roles = new Set(["system", "user", "assistant", "tool"]);
  return messages.map((message) => {
    if (!message || !roles.has(message.role)) throw new Error("Invalid message role");
    const content = message.content;
    if (typeof content === "string") return { role: message.role, content: content.slice(0, 60000) };
    if (Array.isArray(content)) {
      const parts = content.slice(0, 12).map(part => {
        if (!part || typeof part !== "object") return { type: "text", text: "" };
        if (part.type === "image_url" && part.image_url && typeof part.image_url.url === "string") {
          const url = part.image_url.url;
          if (!url.startsWith("data:image/")) throw new Error("Only embedded image data is accepted for vision input");
          if (url.length > 10 * 1024 * 1024) throw new Error("Image attachment is too large");
          return { type: "image_url", image_url: { url } };
        }
        if (part.type === "text") return { type: "text", text: String(part.text || "").slice(0, 60000) };
        return { type: "text", text: "" };
      });
      return { role: message.role, content: parts };
    }
    throw new Error("Each message must include text or supported content parts");
  });
}

function extractWorkersText(result) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  if (typeof result.response === "string") return result.response;
  if (typeof result.output_text === "string") return result.output_text;
  const choice = result.choices && result.choices[0];
  if (choice && choice.message && typeof choice.message.content === "string") return choice.message.content;
  if (result.result && typeof result.result.response === "string") return result.result.response;
  return "";
}

async function runWorkersAI(env, messages, requestedModel, maxTokens, temperature) {
  if (!env.AI || typeof env.AI.run !== "function") throw new Error("Workers AI binding (AI) is not configured");
  const imageInput = hasImages(messages);
  const allowedModels = new Set([
    DEFAULT_WORKERS_MODEL,
    VISION_WORKERS_MODEL,
    "@cf/google/gemma-4-26b-a4b-it"
  ]);
  let model = allowedModels.has(requestedModel) ? requestedModel : DEFAULT_WORKERS_MODEL;
  if (imageInput) model = VISION_WORKERS_MODEL;
  const result = await env.AI.run(model, {
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: false
  });
  const text = extractWorkersText(result);
  if (!text.trim()) throw new Error("Workers AI returned an empty response");
  return { text, model };
}

async function runOpenRouter(env, messages, requestedModel, maxTokens, temperature, request) {
  const apiKey = env.OPENROUTER_API_KEY || env.OPENROUTER_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY secret is not configured on this Worker");
  // Free ids come and go on OpenRouter. The router id is the durable choice,
  // and these are the explicit fallbacks tried in order if it is rejected.
  const FREE_FALLBACKS = [
    DEFAULT_OPENROUTER_MODEL,
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "qwen/qwen-2.5-72b-instruct:free"
  ];
  const knownModels = new Set(FREE_FALLBACKS);
  // The free router automatically picks a model with vision when the prompt contains images.
  const selected = hasImages(messages) ? DEFAULT_OPENROUTER_MODEL : requestedModel;
  const model = knownModels.has(selected) ? selected : (env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL);
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
  // OpenRouter reads HTTP-Referer and X-Title for attribution and rate-limit
  // tiering. A browser sends Origin, but a same-origin fetch or curl sends
  // neither, so fall back to the configured site origin rather than omitting
  // the header entirely.
  const origin = request.headers.get("Origin");
  const referer = (origin && /^https?:\/\//i.test(origin)) ? origin : String(env.SITE_ORIGIN || "").trim();
  if (/^https?:\/\//i.test(referer)) headers["HTTP-Referer"] = referer;
  headers["X-Title"] = "Amigo AI";
  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature, stream: false }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(85000) : undefined
  });
  const raw = await upstream.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = {}; }
  if (!upstream.ok) {
    const message = data && data.error && (data.error.message || data.error) || raw.slice(0, 350) || `HTTP ${upstream.status}`;
    throw new Error(`OpenRouter error ${upstream.status}: ${String(message).slice(0, 350)}`);
  }
  const choice = data.choices && data.choices[0];
  const text = choice && choice.message && (choice.message.content || choice.message.reasoning);
  if (!text || !String(text).trim()) throw new Error("OpenRouter returned an empty response");
  return { text: String(text), model: data.model || model };
}

async function handleChat(request, env) {
  const raw = await request.text();
  if (raw.length > MAX_REQUEST_CHARS) return json({ error: "Request is too large. Reduce the attached file or image size." }, 413, request, env);
  let body;
  try { body = JSON.parse(raw || "{}"); } catch (_) { return json({ error: "Invalid JSON request" }, 400, request, env); }

  try {
    const messages = validateMessages(body.messages);
    const maxTokens = Math.max(128, Math.min(Number(body.max_tokens) || 4096, 8192));
    const temperature = Math.max(0, Math.min(Number(body.temperature) || 0.65, 1.5));
    const provider = ["auto", "workers-ai", "openrouter"].includes(body.provider) ? body.provider : "auto";
    const requestedModel = String(body.model || DEFAULT_WORKERS_MODEL).slice(0, 140);
    const imageInput = hasImages(messages);

    if (provider === "openrouter") {
      const result = await runOpenRouter(env, messages, requestedModel, maxTokens, temperature, request);
      return json({ choices: [{ message: { role: "assistant", content: result.text } }], provider: "openrouter", model: result.model }, 200, request, env);
    }

    if (provider === "workers-ai") {
      const result = await runWorkersAI(env, messages, requestedModel, maxTokens, temperature);
      return json({ choices: [{ message: { role: "assistant", content: result.text } }], provider: "workers-ai", model: result.model }, 200, request, env);
    }

    try {
      const result = await runWorkersAI(env, messages, requestedModel, maxTokens, temperature);
      return json({ choices: [{ message: { role: "assistant", content: result.text } }], provider: "workers-ai", model: result.model }, 200, request, env);
    } catch (workersError) {
      if (!(env.OPENROUTER_API_KEY || env.OPENROUTER_KEY)) throw workersError;
      const fallbackModel = imageInput ? DEFAULT_OPENROUTER_MODEL : (env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL);
      const result = await runOpenRouter(env, messages, fallbackModel, maxTokens, temperature, request);
      return json({
        choices: [{ message: { role: "assistant", content: result.text } }],
        provider: "openrouter",
        model: result.model,
        fallbackReason: "Workers AI was unavailable"
      }, 200, request, env);
    }
  } catch (error) {
    return json({ error: error && error.message ? error.message : "AI request failed" }, 502, request, env);
  }
}

async function handleImage(request, env) {
  if (!env.AI || typeof env.AI.run !== "function") return json({ error: "Workers AI binding (AI) is not configured" }, 503, request, env);
  const raw = await request.text();
  if (raw.length > 12000) return json({ error: "Image prompt is too long" }, 413, request, env);
  let body;
  try { body = JSON.parse(raw || "{}"); } catch (_) { return json({ error: "Invalid JSON request" }, 400, request, env); }
  const prompt = String(body.prompt || "").trim().slice(0, 1800);
  if (!prompt) return json({ error: "Please provide an image prompt" }, 400, request, env);
  try {
    const result = await env.AI.run(IMAGE_MODEL, { prompt, steps: 4 });
    if (!result || !result.image) throw new Error("Image model returned no image data");
    return json({ dataURI: `data:image/jpeg;charset=utf-8;base64,${result.image}`, model: IMAGE_MODEL, provider: "workers-ai" }, 200, request, env);
  } catch (error) {
    return json({ error: error && error.message ? error.message : "Image generation failed" }, 502, request, env);
  }
}

async function handleSearch(url, request, env) {
  const apiKey = env.SERPAPI_KEY;
  if (!apiKey) return json({ results: [], configured: false }, 200, request, env);
  const q = String(url.searchParams.get("q") || "").trim().slice(0, 220);
  if (!q) return json({ results: [] }, 200, request, env);
  try {
    const endpoint = new URL("https://serpapi.com/search.json");
    endpoint.searchParams.set("engine", "google");
    endpoint.searchParams.set("num", "6");
    endpoint.searchParams.set("q", q);
    endpoint.searchParams.set("api_key", apiKey);
    const response = await fetch(endpoint.toString(), { signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `SerpApi error ${response.status}`);
    const results = (data.organic_results || []).slice(0, 6).map(item => ({
      title: item.title || "Search result",
      text: (item.snippet || "") + (item.displayed_link ? ` · ${item.displayed_link}` : ""),
      url: item.link
    })).filter(item => item.url);
    return json({ results, configured: true }, 200, request, env);
  } catch (error) {
    return json({ error: error && error.message ? error.message : "Search failed", results: [] }, 502, request, env);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!allowedOrigin(request.headers.get("Origin"), env)) {
      return json({ error: "Origin is not allowed. Add this app domain to ALLOWED_ORIGINS." }, 403, request, env);
    }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        app: "Amigo AI",
        workersAI: !!env.AI,
        openRouterConfigured: !!(env.OPENROUTER_API_KEY || env.OPENROUTER_KEY),
        imageGeneration: !!env.AI,
        serpApiConfigured: !!env.SERPAPI_KEY,
        defaultModel: DEFAULT_WORKERS_MODEL,
        visionModel: VISION_WORKERS_MODEL
      }, 200, request, env);
    }
    if (request.method === "POST" && url.pathname === "/v1/chat/completions") return handleChat(request, env);
    if (request.method === "POST" && url.pathname === "/v1/images/generations") return handleImage(request, env);
    if (request.method === "GET" && url.pathname === "/api/search") return handleSearch(url, request, env);
    return json({ error: "Not found" }, 404, request, env);
  }
};
