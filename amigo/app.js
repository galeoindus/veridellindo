"use strict";

/* Modern line icons, drawn inline. The emoji that used to sit in these slots
 * rendered differently on every platform and looked dated beside the rest of the
 * interface; these inherit the text colour and stay sharp at any size. */
const ICON_PATHS = {
  /* one line icon per emoji the skill data uses, so nothing falls back to a
     glyph the phone cannot draw (which rendered as an empty box) */
  "\u{1F3A8}": '<path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H13a2 2 0 0 1 0-4h4a4 4 0 0 0 4-4 5 5 0 0 0-5-5Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/>',
  "\u{1F4CA}": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  "\u{1F4C8}": '<path d="M3 17l6-6 4 3 7-8M17 6h4v4"/>',
  "\u{1F3AC}": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 9 18-4M8 5l2 4M14 4l2 4"/>',
  "\u{1F39E}\uFE0F": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 9 18-4M8 5l2 4M14 4l2 4"/>',
  "\u{1F4FD}\uFE0F": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 9 18-4M8 5l2 4M14 4l2 4"/>',
  "\u{1F4FA}": '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="m8 3 4 3 4-3"/>',
  "\u2705": '<path d="m4 12.5 5 5L20 6.5"/>',
  "\u{1F4AC}": '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"/>',
  "\u270D\uFE0F": '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  "\u{1F4DD}": '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  "\u{1F4C4}": '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  "\u{1F4D6}": '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
  "\u{1F4D7}": '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
  "\u{1F50D}": '<circle cx="11" cy="11" r="6.5"/><path d="m19.5 19.5-4-4"/>',
  "\u{1F50E}": '<circle cx="11" cy="11" r="6.5"/><path d="m19.5 19.5-4-4"/>',
  "\u{1F9ED}": '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  "\u{1F5C2}\uFE0F": '<path d="M3 7h6l2 2h10v10H3z"/><path d="M3 7V5h6l2 2"/>',
  "\u{1F5C4}\uFE0F": '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  "\u{1F6E0}\uFE0F": '<path d="M14 6a3 3 0 1 0 4 4l-9 9-4-4z"/><path d="m3 21 3-3"/>',
  "\u{1F9E9}": '<path d="M9 3h6v3a2 2 0 1 0 4 0h2v6h-3a2 2 0 1 0 0 4h3v6H9v-3a2 2 0 1 0-4 0H3V9h3a2 2 0 1 0 0-4H3V3h6z"/>',
  "\u{1F5A5}\uFE0F": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
  "\u{1F5BC}\uFE0F": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 17 5-4 4 3 3-2 4 3"/>',
  "\u{1F310}": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
  "\u{1F578}\uFE0F": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
  "\u{1F3D7}\uFE0F": '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/>',
  "\u{1F3B2}": '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/>',
  "\u{1F3A4}": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  "\u{1F5CC}\uFE0F": '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  "\u{1F58C}\uFE0F": '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  "\u{1F4D0}": '<path d="M4 20 20 4M8 4h4M4 8v4M16 20h4M20 16v4"/>',
  "\u23F1\uFE0F": '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  "\u{1F9EA}": '<path d="M9 3h6v5l4 9a3 3 0 0 1-2.7 4H7.7A3 3 0 0 1 5 17l4-9z"/><path d="M7.5 14h9"/>',
  "\u{1FA9E}": '<rect x="5" y="3" width="14" height="18" rx="7"/><path d="M12 7v6"/>',
};
function iconFor(value, size){
  const d = ICON_PATHS[String(value || "").trim()] || ICON_PATHS["\u{1F4AC}"];
  const px = size || 18;
  return '<svg class="ic" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" '
    + 'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" '
    + 'aria-hidden="true">' + d + '</svg>';
}

const SKILLS = {"design-critique": {"icon": "🎨", "name": "Design Critique", "tag": "Rigorous, structured design critique — quick and deep modes", "chips": ["Give my design a tough critique", "Top issues on my landing page", "Review in quick mode", "Check against my design system"], "hero": "generic", "analytics": false, "helpline": false}, "presentation-agent": {"icon": "🎤", "name": "Presentation Agent", "tag": "Narrative-driven decks — presentations that stand on their own", "chips": ["Build an investor pitch narrative", "Suggest a board deck structure", "Plan a QBR presentation flow", "Review my slides' story arc"], "hero": "generic", "analytics": false, "helpline": false}, "pptx-master": {"icon": "📽️", "name": "PPTX Master", "tag": "Professional PowerPoint decks — build, edit, QA", "chips": ["Structure a 10-slide sales deck", "Give me a deck QA checklist", "Write slide copy and speaker notes", "Review my deck's visual hierarchy"], "hero": "generic", "analytics": false, "helpline": false}, "skill-creator": {"icon": "🛠️", "name": "Skill Creator", "tag": "Create, improve and test new skills", "chips": ["Help me build a new skill", "Create an evals set for my skill", "Improve my skill's description", "Review my skill's structure"], "hero": "generic", "analytics": false, "helpline": false}, "mixpanel-analyst": {"icon": "📈", "name": "Mixpanel Analyst", "tag": "Product data analyst — retention, activation, data-dictionary thinking", "chips": ["Explain why retention dropped", "How should we define the activation metric", "What does my event data say", "Pick metrics for a KPI dashboard"], "hero": "generic", "analytics": true, "helpline": false}, "product-analytics": {"icon": "🔍", "name": "Product Analytics", "tag": "Funnel, retention, cohort, activation, adoption, churn", "chips": ["Run a funnel analysis — CSV already uploaded", "How do I read cohort retention", "What are early churn signals", "How do we measure activation"], "hero": "generic", "analytics": true, "helpline": false}, "metric-reasoning": {"icon": "📐", "name": "Metric Reasoning", "tag": "The right KPI/metric definition — identity, grain, rate vs count", "chips": ["DAU dropped — write the identity first", "Give me the right conversion-rate definition", "Why does revenue differ across two sources", "Read this KPI's numerator/denominator"], "hero": "generic", "analytics": true, "helpline": false}, "descriptive-stats": {"icon": "📊", "name": "Descriptive Statistics", "tag": "Distributions, outliers, missing data — and when not to say mean", "chips": ["Profile my data — CSV uploaded", "Mean or median — which is right", "How do I spot outliers", "How do I report skewed data"], "hero": "generic", "analytics": true, "helpline": false}, "file-organizer": {"icon": "🗂️", "name": "File Organizer", "tag": "A trusted system for files and folders — taxonomy + naming", "chips": ["Plan how to organize my Drive", "Suggest a file naming convention", "Build a taxonomy for my folders", "Review my existing structure"], "hero": "generic", "analytics": false, "helpline": false}, "time-series": {"icon": "⏱️", "name": "Time Series", "tag": "Trend, baseline, anomaly, change point — answering \"when did it start\"", "chips": ["I see a WoW drop — fix the baseline first", "Is this spike an anomaly or a trend", "When did it start — find the change point", "CSV uploaded — pull the trend"], "hero": "generic", "analytics": true, "helpline": false}, "analytical-planning": {"icon": "🧭", "name": "Analytical Planning", "tag": "Hard business question → investigation plan first, analysis second", "chips": ["Revenue dropped — build an investigation plan", "Structure this KPI question", "I need a plan before starting an RCA", "Turn this vague question analysis-ready"], "hero": "generic", "analytics": true, "helpline": false}, "analysis-validation": {"icon": "✅", "name": "Analysis Validation", "tag": "The last gate before the final answer — baseline, denominator, Simpson", "chips": ["Critique my analysis hard", "Where is this conclusion weak?", "Run the validation checklist", "Challenge this KPI claim"], "hero": "generic", "analytics": true, "helpline": false}, "data-dictionary": {"icon": "📖", "name": "Data Dictionary", "tag": "Governed metric definitions — entities, grains, joins, source of truth", "chips": ["Show the governed definition of this metric", "Explain the entities and joins", "I need to define a new metric — review it", "Two definitions clash — which is right?"], "hero": "generic", "analytics": true, "helpline": false}, "schema-crawler": {"icon": "🕸️", "name": "Data Schema Crawler", "tag": "A method for understanding data sources and building semantic schemas", "chips": ["Help me understand my data source", "Help me build a semantic schema", "How to explore the warehouse", "The crawl protocol for schemas"], "hero": "generic", "analytics": false, "helpline": false}, "dashboard-design": {"icon": "📺", "name": "Dashboard Design", "tag": "KPI narrative and hierarchy — a story, not a pile of charts", "chips": ["Build the KPI hierarchy for an exec dashboard", "Design a weekly digest board", "Improve my dashboard's narrative", "How to surface anomalies on a dashboard"], "hero": "generic", "analytics": false, "helpline": false}, "changelog": {"icon": "📝", "name": "Changelog Reporter", "tag": "Branded changelogs from GitHub activity for non-technical readers", "chips": ["Write a changelog from my merged PRs", "Release notes in non-technical language", "Review my changelog format", "Help write a user-facing entry"], "hero": "generic", "analytics": false, "helpline": false}, "deck-standards": {"icon": "🏗️", "name": "Deck Build Standards", "tag": "Content contract → checkable build rules — consistent decks every time", "chips": ["Give me the deck build-rules checklist", "Keep decks consistent across runs", "Make the content contract checkable", "Explain the deck review rules"], "hero": "generic", "analytics": false, "helpline": false}, "brand-pptx": {"icon": "🖌️", "name": "Brand for PPTX", "tag": "Sarvam AI brand guidelines — everything for on-brand presentations", "chips": ["Build a deck in Sarvam brand", "Rules for on-brand slides", "Run brand QA on my deck", "Explain the brand colours and layout"], "hero": "generic", "analytics": false, "helpline": false}, "root-cause": {"icon": "🔎", "name": "Root Cause Analysis", "tag": "Why it happened — build, rank and test hypotheses with evidence", "chips": ["Revenue dropped — find the cause", "Build and rank hypotheses", "What moved this metric", "Say it in evidence language"], "hero": "generic", "analytics": true, "helpline": false}, "visualization": {"icon": "🖼️", "name": "Visualization", "tag": "One result = one right chart — chart selection and quality", "chips": ["Which chart fits this result?", "Suggest a funnel chart", "How do I show a retention curve", "Run a quality check on my chart"], "hero": "generic", "analytics": true, "helpline": false}, "stat-inference": {"icon": "🎲", "name": "Statistical Inference", "tag": "A/B tests, significance, confidence intervals, effect size — the math lives here", "chips": ["Is this A/B test result valid?", "Is this lift real or noise?", "Explain confidence intervals", "Comparing two rates — significant?"], "hero": "generic", "analytics": true, "helpline": false}, "metabase": {"icon": "🗄️", "name": "Metabase MCP", "tag": "Protocol for Metabase MCP tools — query, MBQL, execute", "chips": ["How do I build a Metabase query", "Explain MBQL", "How do I search tables", "The query execution protocol"], "hero": "generic", "analytics": false, "helpline": false}, "ui-critique": {"icon": "🪞", "name": "UI Design Critique", "tag": "UI and design screenshot review — Apple HIG + UX writing", "chips": ["Critique my UI hard", "Review against Apple HIG", "Improve my UX writing", "Review my landing page"], "hero": "generic", "analytics": false, "helpline": false}, "segmentation": {"icon": "🧩", "name": "Segmentation Drilldown", "tag": "Which segment moved the metric — contribution, Pareto, Simpson's", "chips": ["Which segment drove the drop?", "Run a contribution analysis", "Build a Pareto ranking of causes", "Check for Simpson's paradox"], "hero": "generic", "analytics": true, "helpline": false}, "sarvam-presentation": {"icon": "🎞️", "name": "Sarvam Presentation", "tag": "Professional .pptx decks — consulting, report and bold pitch looks", "chips": ["Build a 10-slide investor deck", "Make it a consulting-style deck", "A bold big-type pitch deck", "Edit my existing .pptx"], "hero": "generic", "analytics": false, "helpline": false}, "sarvam-html-presentation": {"icon": "🖥️", "name": "HTML Presentation", "tag": "Self-contained HTML slide decks you can open in any browser", "chips": ["Make an HTML deck on AI in India", "Turn my report into slides", "Convert my PPTX to HTML", "An executive briefing deck"], "hero": "generic", "analytics": false, "helpline": false}, "sarvam-doc-coauthoring": {"icon": "✍️", "name": "Doc Co-Authoring", "tag": "Ask first, plan as todos, then write — specs, proposals, PRDs, RFCs", "chips": ["Help me write a PRD", "Draft a project proposal", "Write a technical spec", "Co-author a decision doc"], "hero": "generic", "analytics": false, "helpline": false}, "sarvam-pdf": {"icon": "📄", "name": "PDF Studio", "tag": "Create, read and edit PDFs — extract text, merge, split, watermark", "chips": ["Extract the text from a PDF", "Create a PDF report", "Merge or split my PDFs", "Add a watermark"], "hero": "generic", "analytics": false, "helpline": false}, "sarvam-xlsx": {"icon": "📗", "name": "Excel & CSV", "tag": "Build and fix spreadsheets — formulas, formatting, cleaning", "chips": ["Build a budget spreadsheet", "Fix my formula errors", "Clean up this messy table", "Convert CSV to Excel"], "hero": "generic", "analytics": false, "helpline": false}, "sarvam-slides": {"icon": "🎨", "name": "Sarvam Slides", "tag": "Standalone HTML decks — five design systems, or your own brand", "chips": ["Build a pitch deck as HTML", "Make it in the Tatva style", "A deck in our brand colours", "Turn my report into slides"], "hero": "generic", "analytics": false, "helpline": false}, "assistant": {"icon": "💬", "name": "General Assistant", "tag": "Professional help with anything — clear, precise, to the point", "chips": ["Ask me anything", "Help me write or edit something", "Explain this clearly", "Compare my options", "Plan this out for me"], "hero": "generic", "analytics": false, "helpline": false}};
/* Original Amigo companion — embedded so the app stays one-file portable. */
/* The mark is versioned with the build, like every other brand URL: the
 * file name never changes, so without the query a browser or the CDN edge
 * keeps serving the previous artwork. */
const BUILD_ID = (document.querySelector('meta[name="veridell-build"]') || {}).content || "";
const AMIGO_BRAND_URI = "/assets/img/brand/logo-192.png" + (BUILD_ID ? "?v=" + BUILD_ID : "");
function darkNow(){ return document.body.classList.contains("dark"); }
function heroMarkHTML(){ return '<img class="lgimg" alt="Veridellindo logo" src="' + AMIGO_BRAND_URI + '">'; }
function dharmaHTML(){ return '<span class="typing-mascot" aria-label="Amigo is thinking"><i></i><i></i><i></i></span>'; }

const AMP = String.fromCharCode(38);
const $ = s => document.querySelector(s);

/* The Amigo character is a state indicator, not decoration: one pose per
 * interface state, and never the only signal of what is happening. */
const AMIGO_POSE = {
  wave: "/assets/img/amigo/amigo-wave.webp",
  think: "/assets/img/amigo/amigo-think.webp",
  insight: "/assets/img/amigo/amigo-insight.webp",
  reading: "/assets/img/amigo/amigo-reading.webp",
  celebrate: "/assets/img/amigo/amigo-celebrate.webp",
  help: "/assets/img/amigo/amigo-help.webp"
};
function amigoPoseImg(state, cls){
  const img = document.createElement("img");
  img.src = AMIGO_POSE[state] || AMIGO_POSE.wave;
  img.alt = "";
  img.className = "amigo-mascot " + (cls || "");
  img.width = 128; img.height = 128;
  img.decoding = "async";
  return img;
}


/* A swallowed error is a bug nobody can see later. These are not fatal paths —
 * a blocked storage write, a failed optional fetch — but they are recorded so a
 * problem can be diagnosed instead of guessed at. The list is bounded so it can
 * never grow without limit. */
const RECENT_ERRORS = [];
function noteError(err, where){
  try {
    RECENT_ERRORS.push({ at: new Date().toISOString(), where: String(where || "unknown"),
      message: String((err && err.message) || err || "error") });
    if (RECENT_ERRORS.length > 40) RECENT_ERRORS.shift();
    if (window.__amigoDebug) console.warn("[amigo]", where, err);
  } catch(e) { /* the recorder must never throw */ }
}

const chatEl = $("#chatMessages") || $("#chat"), inputEl = $("#input"), sendEl = $("#send");

/* One short status region, separate from the message log, so token-by-token
 * output does not make a screen reader announce every partial update. */
const statusEl = $("#chatStatus");
function announce(text){
  if (!statusEl) return;
  statusEl.textContent = "";
  setTimeout(() => { statusEl.textContent = String(text || ""); }, 40);
}

/* All model credentials live server-side in Cloudflare Worker secrets.
   This browser app never receives or stores the OpenRouter or SerpApi keys. */

const DEFAULTS = {
  workerUrl: "",
  aiModel: "auto",
  skill: "auto", imageMode: false,
  deepSearch: false,
  connectors: { web: true, google: false, gkey: "", gcx: "", stack: true, hn: true, books: true, github: true, weather: true, trends: true, ghToken: "" },
  liveMode: false,
  voiceLang: "auto"
};
let settings = Object.assign({}, DEFAULTS);
let busy = false;
let dataState = null;
let curSkill = "assistant";

/* ---------------- persistence ---------------- */
const hKey = id => "amigo2_h_" + id;
function dedupeHistory(a){
  /* collapse repeated identical user messages that sit back-to-back with no reply in between */
  const out = [];
  for (const m of (Array.isArray(a) ? a : [])){
    if (!m || !m.content) continue;
    const p = out[out.length - 1];
    if (p && p.role === "user" && m.role === "user" && String(p.content).trim() === String(m.content).trim()) continue;
    out.push(m);
  }
  return out;
}

/* ── P4-05: durable conversation storage ───────────────────────────────────
 * localStorage is synchronous, small and silent when it fills up: a full quota
 * throws inside a try/catch and the conversation simply stops being saved.
 * Histories now live in IndexedDB, which is asynchronous, far larger, and can
 * report a failure we can show. localStorage keeps only small preferences.
 *
 * The migration is non-destructive: an existing record is copied into the
 * database the first time it is seen, and the local copy is only removed after
 * the write has actually succeeded. */
const IDB_NAME = "veridellindo-amigo";
const IDB_STORE = "history";
let _idbPromise = null;

function idbOpen(){
  if (_idbPromise) return _idbPromise;
  _idbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB is not available")); return; }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB could not be opened"));
  });
  return _idbPromise;
}

async function idbGet(key){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const request = tx.objectStore(IDB_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(key, value){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB write failed"));
  });
}

/* A storage failure must be visible: silence is how a reader loses a
   conversation without ever being told. */
let _storageWarned = false;
function storageProblem(message){
  if (_storageWarned) return;
  _storageWarned = true;
  announce("Conversations could not be saved on this device.");
  try {
    const note = document.createElement("div");
    note.className = "fallbacknote";
    note.textContent = "This conversation could not be saved on this device: " + message
      + " — export anything you need to keep.";
    const host = document.querySelector("#chatMessages") || document.querySelector("#chat");
    if (host) host.append(note);
  } catch(e){ noteError(e, "silent path"); }
}

/* Move a legacy localStorage record into the database, once, without deleting
   anything until the write has succeeded. */
async function migrateHistory(key){
  try {
    const existing = await idbGet(key);
    if (existing) return existing;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    await idbPut(key, parsed);
    localStorage.removeItem(key);          // only after the write landed
    return parsed;
  } catch(e){ return null; }
}

async function historyRefresh(id){
  try {
    const stored = await migrateHistory(hKey(id));
    if (Array.isArray(stored)) _histories[id] = dedupeHistory(stored);
  } catch(e){ /* the local copy stays in use */ }
}

function histLoad(id){
  try { const h = JSON.parse(localStorage.getItem(hKey(id)) || "[]"); return dedupeHistory(Array.isArray(h) ? h : []); }
  catch(e){ return []; }
}
function histSave(){
  try {
    const h = curHistory().slice(-80).map(m => {
      if (m && typeof m.image === "string" && m.image.length > 250000){
        const c = Object.assign({}, m); delete c.image; c.imageDropped = true; return c;
      }
      if (m && Array.isArray(m.attachments) && m.attachments.length){
        const c = Object.assign({}, m);
        c.attachments = m.attachments.map(a => {
          const b = Object.assign({}, a);
          delete b.url;                                   /* the raw file stays in this session only */
          if (b.image && b.image.length > 250000) b.image = null;
          return b;
        });
        return c;
      }
      return m;
    });
    idbPut(hKey(curSkill), h).catch((err) => {
      // keep the local copy as a fallback, but tell the reader it happened
      try { localStorage.setItem(hKey(curSkill), JSON.stringify(h)); } catch(e){ noteError(e, "silent path"); }
      storageProblem(err && err.message ? err.message : "storage error");
    });
  } catch(e){ noteError(e, "silent path"); }
  try { sideListRender(); } catch(e){ noteError(e, "silent path"); }
}
let _histories = {};
function curHistory(){ return _histories[curSkill]; }
/* Long-lived user credentials are not written to browser storage. IndexedDB and
 * localStorage are origin storage, not a vault: anything here is readable by any
 * script on this origin and survives on the device. Personal tokens stay in
 * memory for this session only, and the product says so instead of implying the
 * field is secure. Provider keys belong in Cloudflare secrets, server-side. */
const SESSION_SECRETS = { ghToken: "", gkey: "" };

function stripSecrets(source){
  const copy = JSON.parse(JSON.stringify(source || {}));
  if (copy.connectors && typeof copy.connectors === "object"){
    for (const key of Object.keys(SESSION_SECRETS)){
      if (key in copy.connectors){
        SESSION_SECRETS[key] = String(copy.connectors[key] || "");
        delete copy.connectors[key];
      }
    }
  }
  return copy;
}

function withSecrets(source){
  const copy = JSON.parse(JSON.stringify(source || {}));
  copy.connectors = copy.connectors || {};
  for (const key of Object.keys(SESSION_SECRETS)){
    if (SESSION_SECRETS[key]) copy.connectors[key] = SESSION_SECRETS[key];
  }
  return copy;
}

function saveAllSettings(){
  try { localStorage.setItem("amigo2_settings", JSON.stringify(stripSecrets(settings))); } catch(e){ noteError(e, "silent path"); }
}

/* ---------------- auto skill routing ---------------- */
function routeSkill(t){
  t = String(t).toLowerCase();
  const has = re => re.test(t);
  if (has(/tatva|meridian|plain[- ]work|indigo (deck|slides)|sarvam slides|1920\s*[x×]\s*1080|desi design|our brand deck/)) return "sarvam-slides";
  if (has(/html (deck|presentation|slides?)|deck in html|web deck|self-contained deck|html deck/)) return "sarvam-html-presentation";
  if (has(/consulting deck|report deck|bold pitch|big[- ]type|sarvam presentation|sarvam deck|professional deck/)) return "sarvam-presentation";
  if (has(/\bpdf\b|merge pdf|split pdf|watermark|pdf report|extract .{0,12}pdf|pdf .{0,12}extract/)) return "sarvam-pdf";
  if (has(/xlsx|xls\b|excel|spreadsheet|workbook|pivot table|formula|स्प्रेडशीट|एक्सेल/)) return "sarvam-xlsx";
  if (has(/\bprd\b|\brfc\b|technical spec|design doc|decision doc|co-?author|proposal likh|spec likh|प्रस्ताव लिख|स्पेक लिख/)) return "sarvam-doc-coauthoring";
  if (has(/pptx|powerpoint|slide|deck|pitch|presentation|board deck|qbr|keynote|प्रेजेंटेशन|स्लाइड|पिच/)) return has(/brand|sarvam|on-brand/) ? "brand-pptx" : "pptx-master";
  if (has(/changelog|release note|pull request|merged pr|रिलीज/)) return "changelog";
  if (has(/metabase|mbql/)) return "metabase";
  if (has(/mixpanel/)) return "mixpanel-analyst";
  if (has(/schema|warehouse|data dictionary|semantic|crawl|data source|sql table|डेटा सोर्स/)) return "schema-crawler";
  if (has(/organiz|folder|drive|file naming|taxonomy|फ़ाइल|फाइल सँभाल|फोल्डर/)) return "file-organizer";
  if (has(/skill (बनान|creat|improv)|new skill|नई skill|evals|eval set/)) return "skill-creator";
  if (has(/ui|ux|screenshot|landing page|hig|interface|mockup|इंटरफ़ेस|डिज़ाइन समीक्षा|design critique/)) return "ui-critique";
  if (has(/dashboard|kpi board|weekly digest|executive board|डैशबोर्ड/)) return "dashboard-design";
  if (has(/root cause|rca|क्यों गिर|क्यों हुआ|वजह|कारण पता/)) return "root-cause";
  if (has(/trend|baseline|anomaly|spike|कब से शुरू|time series|vs yesterday|wow|mom/)) return "time-series";
  if (has(/segment|pareto|contribution|किसने|drilldown|which plan|which geo|which channel/)) return "segmentation";
  if (has(/funnel|retention|cohort|churn|activation|adoption|फ़नल/)) return "product-analytics";
  if (has(/metric|kpi|dau|conversion rate|revenue definition|identity|numerator|denominator/)) return "metric-reasoning";
  if (has(/investigat|investigation plan|कहाँ से शुरू करूँ|जाँच योजना/)) return "analytical-planning";
  if (has(/a\/b|ab test|significan|p[- ]?value|lift|experiment|treatment|control group/)) return "stat-inference";
  if (has(/validate|critique my analysis|simpson|double check|सही है क्या/)) return "analysis-validation";
  if (has(/chart|graph|visuali|plot|चार्ट|ग्राफ/)) return "visualization";
  if (has(/mean|median|outlier|skew|distribution|percentile|statistic|summary of data/)) return "descriptive-stats";
  if (has(/csv|data|analytics|analysis|गिर|drop|revenue|users|इवेंट|event data/)) return "product-analytics";
  return "assistant";
}

/* ---------------- rendering ---------------- */
function esc(t){
  t = String(t);
  return t.replace(/&/g, AMP + "amp;")
    .replace(/</g, AMP + "lt;")
    .replace(/>/g, AMP + "gt;")
    // quotes matter: a value dropped into a quoted attribute could otherwise
    // close it and add its own attributes
    .replace(/"/g, AMP + "quot;")
    .replace(/'/g, AMP + "#39;");
}

/* Only http(s) without credentials is allowed as a link target. Anything else
 * (javascript:, vbscript:, file:, data:) is refused and the label is rendered
 * as inert text instead. */
function safeExternalHref(raw){
  try {
    const url = new URL(String(raw), window.location.origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch (e) { return null; }
}
const EMOJI = {smile:"\u{1F604}",grin:"\u{1F601}",joy:"\u{1F602}",wink:"\u{1F609}",heart:"\u2764\uFE0F",thumbsup:"\u{1F44D}",thumbsdown:"\u{1F44E}",fire:"\u{1F525}",rocket:"\u{1F680}",star:"\u2B50",sparkles:"\u2728",check:"\u2705",x:"\u274C",warning:"\u26A0\uFE0F",bulb:"\u{1F4A1}",book:"\u{1F4D8}",memo:"\u{1F4DD}",chart:"\u{1F4CA}",lock:"\u{1F512}",globe:"\u{1F310}",tada:"\u{1F389}",eyes:"\u{1F440}",thinking:"\u{1F914}",pray:"\u{1F64F}",wave:"\u{1F44B}",point_right:"\u{1F449}",zap:"\u26A1",clock:"\u{1F550}",calendar:"\u{1F4C5}",email:"\u2709\uFE0F",phone:"\u{1F4DE}",search:"\u{1F50D}",link:"\u{1F517}",gear:"\u2699\uFE0F",bug:"\u{1F41B}",package:"\u{1F4E6}",pin:"\u{1F4CC}",note:"\u{1F5D2}\uFE0F",info:"\u2139\uFE0F"};

function mdLite(t){
  const src = String(t == null ? "" : t).replace(/\r\n?/g, "\n");
  const codes = [];
  let s = src.replace(/```([a-zA-Z0-9+#._-]*)\n?([\s\S]*?)```/g, function(m, lang, code){
    codes.push({lang: (lang || "").toLowerCase(), code: code.replace(/\n$/, "")});
    return "\u0001C" + (codes.length - 1) + "\u0001";
  });
  s = esc(s);

  /* footnotes: gather the definitions, then turn the markers into little links */
  const notes = [];
  s = s.replace(/^\[\^([^\]]+)\]:[ \t]*([\s\S]*?)(?=\n\[\^|\n\n|$)/gm, function(m, id, body){
    notes.push({id: id, body: body.trim().replace(/\n/g, " ")});
    return "";
  });
  const noteIndex = function(id){ return notes.findIndex(function(n){ return n.id === id; }); };

  const inl = function(x){
    x = x.replace(/`([^`]+)`/g, "<code>$1</code>");
    x = x.replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, '<img class="mdimg" src="$2" alt="$1" loading="lazy">');
    x = x.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
      const safe = safeExternalHref(href);
      return safe ? '<a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' : label;
    });
    x = x.replace(/\[\^([^\]]+)\]/g, function(m, id){
      const k = noteIndex(id);
      return k < 0 ? m : '<sup class="fnref"><a href="#fn-' + k + '" title="' + id + '">' + (k + 1) + "</a></sup>";
    });
    x = x.replace(/==([^=]+)==/g, "<mark>$1</mark>");
    x = x.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    x = x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    x = x.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    x = x.replace(/(^|[^_\w])_([^_\n]+)_/g, "$1<em>$2</em>");
    x = x.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    x = x.replace(/:([a-z0-9_+-]+):/g, function(m, n){ return EMOJI[n] || m; });
    return x;
  };
  const codeBlk = function(o){
    return '<div class="codeblk"><div class="codehead"><span class="codelang">' + esc(o.lang || "code") +
      '</span><button type="button" class="codecopy">Copy</button></div><pre><code>' + esc(o.code) + '</code></pre></div>';
  };
  const lines = s.split("\n");
  let out = "", i = 0, buf = [];
  const flush = function(){ if (buf.length){ out += "<p>" + inl(buf.join("<br>")) + "</p>"; buf = []; } };
  const listRx = function(ordered){ return ordered ? /^(\s*)(\d+)[.)]\s+(.*)$/ : /^(\s*)[-*\u2022]\s+(.*)$/; };
  const itemHtml = function(txt){
    const task = txt.match(/^\[( |x|X)\]\s+([\s\S]*)$/);
    if (task){
      const on = task[1].toLowerCase() === "x";
      return '<li class="task"><span class="tick' + (on ? " on" : "") + '"></span><span' +
        (on ? ' class="done"' : "") + ">" + inl(task[2]) + "</span></li>";
    }
    return "<li>" + inl(txt) + "</li>";
  };
  const takeList = function(start, ordered){
    const rx = listRx(ordered), rxAny = /^(\s*)(?:[-*\u2022]|\d+[.)])\s+(.*)$/;
    let k = start, base = null, html = "";
    while (k < lines.length){
      const m = lines[k].match(rxAny);
      if (!m) break;
      const ind = m[1].length;
      if (base === null) base = ind;
      if (ind >= base + 2){
        let sub = "";
        while (k < lines.length){
          const m2 = lines[k].match(rxAny);
          if (!m2 || m2[1].length < base + 2) break;
          sub += itemHtml(m2[2]); k++;
        }
        if (sub) html = html.replace(/<\/li>$/, '<ul class="sub">' + sub + "</ul></li>");
        continue;
      }
      if (!lines[k].match(rx)) break;
      html += itemHtml(m[2]); k++;
    }
    return {html: html, next: k};
  };
  while (i < lines.length){
    const L = lines[i], codeM = L.match(/^\u0001C(\d+)\u0001$/);
    if (codeM){ flush(); out += codeBlk(codes[+codeM[1]]); i++; continue; }
    if (!L.trim()){ flush(); i++; continue; }
    let m;
    if ((m = L.match(/^(#{1,6})\s+(.*)$/))){
      flush(); const lv = Math.min(6, 1 + m[1].length);
      out += "<h" + lv + ">" + inl(m[2]) + "</h" + lv + ">"; i++; continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(L)){ flush(); out += "<hr>"; i++; continue; }
    if ((m = L.match(/^\s*(?:>|&gt;)\s?(.*)$/))){
      flush();
      const block = [];
      while (i < lines.length){
        const mm = lines[i].match(/^\s*(?:>|&gt;)\s?(.*)$/);
        if (!mm) break;
        block.push(mm[1]); i++;
      }
      const renderQ = function(arr){
        let html = "", k = 0;
        while (k < arr.length){
          if (/^\s*(?:>|&gt;)/.test(arr[k])){
            const sub = [];
            while (k < arr.length && /^\s*(?:>|&gt;)/.test(arr[k])){
              sub.push(arr[k].replace(/^\s*(?:>|&gt;)\s?/, "")); k++;
            }
            html += "<blockquote>" + renderQ(sub) + "</blockquote>";
          } else {
            const para = [];
            while (k < arr.length && !/^\s*(?:>|&gt;)/.test(arr[k])){ para.push(arr[k]); k++; }
            html += "<p>" + inl(para.join("<br>")) + "</p>";
          }
        }
        return html;
      };
      out += "<blockquote>" + renderQ(block) + "</blockquote>";
      continue;
    }
    if (L.indexOf("|") > -1 && i + 1 < lines.length && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[i + 1])){
      flush();
      const cells = function(row){ return row.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(function(c){ return c.trim(); }); };
      const aligns = cells(lines[i + 1]).map(function(c){
        const l = c.charAt(0) === ":", r = c.charAt(c.length - 1) === ":";
        return l && r ? "center" : (r ? "right" : (l ? "left" : ""));
      });
      const head = cells(L); i += 2;
      let body = "";
      while (i < lines.length && lines[i].trim() && lines[i].indexOf("|") > -1){
        body += "<tr>" + cells(lines[i]).map(function(c, ci){
          return '<td' + (aligns[ci] ? ' style="text-align:' + aligns[ci] + '"' : "") + ">" + inl(c) + "</td>";
        }).join("") + "</tr>"; i++;
      }
      out += '<div class="tblwrap"><table><thead><tr>' + head.map(function(c, ci){
        return "<th" + (aligns[ci] ? ' style="text-align:' + aligns[ci] + '"' : "") + ">" + inl(c) + "</th>";
      }).join("") + "</tr></thead><tbody>" + body + "</tbody></table></div>";
      continue;
    }
    if (listRx(false).test(L)){ flush(); const r = takeList(i, false); out += "<ul>" + r.html + "</ul>"; i = r.next; continue; }
    if (listRx(true).test(L)){
      flush();
      const st = L.match(listRx(true))[2];
      const r = takeList(i, true);
      out += "<ol" + (st && +st !== 1 ? ' start="' + (+st) + '"' : "") + ">" + r.html + "</ol>";
      i = r.next; continue;
    }
    buf.push(L); i++;
  }
  flush();
  if (notes.length){
    out += '<div class="fnlist"><ol>' + notes.map(function(n, k){
      return '<li id="fn-' + k + '">' + inl(n.body) + "</li>";
    }).join("") + "</ol></div>";
  }
  return out || esc(src);
}

chatEl.addEventListener("click", function(e){
  const b = e.target && e.target.closest ? e.target.closest(".codecopy") : null;
  if (!b) return;
  const blk = b.closest(".codeblk"), code = blk ? blk.querySelector("code") : null;
  copyToClipboard(code ? code.textContent : "", b);
});
/* While the answer streams in, the view keeps the newest line in sight — unless the
   reader has deliberately scrolled up to re-read something, in which case it leaves them be. */
let _follow = true, _userScrolledAt = 0;
if (chatEl){
  ["wheel", "touchmove", "keydown", "mousedown"].forEach(function(ev){
    chatEl.addEventListener(ev, function(){ _userScrolledAt = Date.now(); }, { passive: true });
  });
  chatEl.addEventListener("scroll", function(){
    if (Date.now() - _userScrolledAt > 500) return;          /* a scroll we caused ourselves */
    const gap = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight;
    _follow = gap < 120;
  }, { passive: true });
}
function scrollDown(force){
  if (!chatEl) return;
  if (force) _follow = true;
  if (!_follow) return;
  if (force){
    try {
      chatEl.style.scrollBehavior = "smooth";
      chatEl.scrollTop = chatEl.scrollHeight;
      setTimeout(function(){ chatEl.style.scrollBehavior = ""; }, 600);
    } catch(e){ chatEl.scrollTop = chatEl.scrollHeight; }
  } else {
    chatEl.style.scrollBehavior = "auto";                    /* instant, so it never lags */
    chatEl.scrollTop = chatEl.scrollHeight;
  }
}

/* Writes the finished answer out word by word, with the formatting already in place. */
function typeInto(bub, text, prefixHTML){
  return new Promise(function(resolve){
    bub.innerHTML = (prefixHTML || "") + mdLite(text);
    const nodes = [];
    const walk = function(n){
      for (let i = 0; i < n.childNodes.length; i++){
        const c = n.childNodes[i];
        if (c.nodeType === 3){ if (c.nodeValue) nodes.push([c, c.nodeValue]); }
        else if (c.nodeType === 1 && !(c.classList && c.classList.contains("skillchip"))) walk(c);
      }
    };
    walk(bub);
    let total = 0;
    nodes.forEach(function(x){ total += x[1].length; });
    if (!total || !nodes.length){ resolve(); return; }
    nodes.forEach(function(x){ x[0].nodeValue = ""; });
    const per = Math.max(2, Math.ceil(total / 150));
    let shown = 0;
    const timer = setInterval(function(){
      shown = Math.min(total, shown + per);
      let left = shown;
      for (let i = 0; i < nodes.length; i++){
        const node = nodes[i][0], full = nodes[i][1];
        if (left <= 0){ node.nodeValue = ""; }
        else if (left >= full.length){ node.nodeValue = full; left -= full.length; }
        else { node.nodeValue = full.slice(0, left); left = 0; }
      }
      scrollDown();
      if (shown >= total){ clearInterval(timer); resolve(); }
    }, 14);
  });
}

function addMsg(role, text, opts){
  const wrap = document.createElement("div");
  wrap.className = "msg " + (role === "user" ? "me" : "ai");
  const bub = document.createElement("div"); bub.className = "bubble";
  if (opts && opts.typing){ bub.innerHTML = '<span class="typing">'
    + '<img class="amigo-mascot mascot-status" src="' + AMIGO_POSE.think + '" alt="" width="48" height="48" decoding="async">'
    + dharmaHTML() + '<span class="sr-only">Amigo is thinking</span></span>'; }
  else if (opts && opts.raw){ bub.textContent = text || ""; bub.style.whiteSpace = "pre-wrap"; }
  else { bub.innerHTML = mdLite(text); }
  if (opts && opts.attachments && opts.attachments.length) addMsgAtt(bub, opts.attachments);
  if (opts && opts.image) addImage(bub, opts.image, opts.prompt);
  if (opts && opts.sources && opts.sources.length) addSources(bub, opts.sources);
  wrap.append(bub); chatEl.append(wrap);
  if (!(opts && opts.typing)) addCopy(wrap, text, role === "assistant");
  scrollDown();
  return bub;
}

function copyToClipboard(text, btn){
  const done = () => { const old = btn.innerHTML; btn.innerHTML = "\u2713 Copied"; btn.classList.add("ok");
    setTimeout(() => { btn.innerHTML = old; btn.classList.remove("ok"); }, 1500); };
  const fallback = () => {
    const ta = document.createElement("textarea"); ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch(e){ noteError(e, "silent path"); } ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
}
let activeSpeechButton = null;
function resetSpeechButton(button){
  if (!button) return;
  button.classList.remove("speaking");
  button.title = "Read this answer aloud";
  button.setAttribute("aria-label", "Read this answer aloud");
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg> Listen';
}
function speechLanguageFor(text){
  const selected = String(settings.voiceLang || "auto");
  if (selected && selected !== "auto") return selected;
  const value = String(text || "");
  if (/[\u0900-\u097f]/.test(value)) return "hi-IN";
  if (/[\u0980-\u09ff]/.test(value)) return "bn-IN";
  if (/[\u0b80-\u0bff]/.test(value)) return "ta-IN";
  if (/[\u0c00-\u0c7f]/.test(value)) return "te-IN";
  if (/[\u0600-\u06ff]/.test(value)) return "ur-PK";
  const device = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  return /^hi/i.test(device) ? "hi-IN" : "en-IN";
}
function speechPlainText(value){
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/[>*_`~|]/g, " ")
    .replace(/\s+/g, " ").trim();
}
function speakAnswer(value, button){
  const synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance){ announce("Speech playback is not supported in this browser."); return; }
  if (activeSpeechButton === button && synth.speaking){
    synth.cancel(); resetSpeechButton(button); activeSpeechButton = null; announce("Stopped reading."); return;
  }
  if (activeSpeechButton) resetSpeechButton(activeSpeechButton);
  synth.cancel();
  const text = speechPlainText(value);
  if (!text){ announce("There is no text to read."); return; }
  const lang = speechLanguageFor(text);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; utterance.rate = 1; utterance.pitch = 1; utterance.volume = 1;
  const voices = synth.getVoices ? synth.getVoices() : [];
  const voice = voices.find(v => String(v.lang || "").toLowerCase() === lang.toLowerCase())
    || voices.find(v => String(v.lang || "").toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (voice) utterance.voice = voice;
  activeSpeechButton = button;
  button.classList.add("speaking"); button.title = "Stop reading";
  button.setAttribute("aria-label", "Stop reading");
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> Stop';
  utterance.onend = () => { resetSpeechButton(button); if (activeSpeechButton === button) activeSpeechButton = null; announce("Finished reading the answer."); };
  utterance.onerror = (event) => { resetSpeechButton(button); if (activeSpeechButton === button) activeSpeechButton = null; if (event && event.error !== "canceled" && event.error !== "interrupted") announce("Could not play speech on this device."); };
  try { synth.speak(utterance); announce("Reading the answer aloud."); }
  catch (err){ noteError(err, "speech playback"); resetSpeechButton(button); activeSpeechButton = null; announce("Could not start speech playback."); }
}

function addCopy(wrap, text, withSpeech){
  if (!wrap || !text) return;
  const row = document.createElement("div"); row.className = "copyrow";

  const btn = document.createElement("button"); btn.className = "copybtn"; btn.type = "button"; btn.title = "Copy this message";
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M6 15H5.5A2.5 2.5 0 0 1 3 12.5v-7A2.5 2.5 0 0 1 5.5 3h7A2.5 2.5 0 0 1 15 5.5V6"/></svg> Copy';
  btn.addEventListener("click", () => copyToClipboard(text, btn));

  if (withSpeech){
    const speak = document.createElement("button");
    speak.className = "copybtn speakbtn"; speak.type = "button";
    speak.title = "Read this answer aloud"; speak.setAttribute("aria-label", "Read this answer aloud");
    speak.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg> Listen';
    const supported = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
    speak.disabled = !supported;
    if (!supported){ speak.title = "Speech playback is not supported in this browser"; speak.setAttribute("aria-label", speak.title); }
    else speak.addEventListener("click", () => speakAnswer(text, speak));
    row.append(speak);
  }

  const thumbs = '<path d="M7 21V10.5l4.4-6.9A1.7 1.7 0 0 1 14.3 4.5V10h4.1a1.8 1.8 0 0 1 1.8 2.2l-1.2 6.2A2 2 0 0 1 17 21H7Z"/><path d="M7 10.5H4.6A1.6 1.6 0 0 0 3 12.1v7.3A1.6 1.6 0 0 0 4.6 21H7"/>';
  const up = document.createElement("button"); up.className = "copybtn vote"; up.type = "button"; up.title = "Good answer";
  up.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + thumbs + '</svg>';
  const dn = document.createElement("button"); dn.className = "copybtn vote"; dn.type = "button"; dn.title = "Not helpful";
  dn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(180 12 12)">' + thumbs + '</g></svg>';
  up.addEventListener("click", () => { up.classList.toggle("on"); dn.classList.remove("on"); });
  dn.addEventListener("click", () => { dn.classList.toggle("on"); up.classList.remove("on"); });

  row.insertBefore(btn, row.firstChild);
  row.append(up, dn);
  wrap.append(row);
}

function addImage(bub, src, prompt){
  const wrap = document.createElement("div"); wrap.className = "imgwrap";
  const img = document.createElement("img");
  img.className = "genimg"; img.src = src; img.alt = prompt || "generated image"; img.loading = "lazy";
  wrap.append(img);
  const cap = document.createElement("div"); cap.className = "imgcap";
  const t = document.createElement("span");
  t.textContent = "🎨 " + (prompt ? (prompt.length > 70 ? prompt.slice(0, 70) + "…" : prompt) : "image");
  const dl = document.createElement("a");
  dl.className = "dlbtn"; dl.href = src; dl.download = "amigo-image.jpg";
  dl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4.5 20.5h15"/></svg> Download';
  cap.append(t); cap.append(dl);
  wrap.append(cap);
  bub.append(wrap);
}

function addSources(bub, groups){
  const sites = groups.length;
  const total = groups.reduce((n, g) => n + (g.items ? g.items.length : 0), 0);

  const wrap = document.createElement("div"); wrap.className = "srcwrap";
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "srcbtn";
  btn.title = "Show the sources this answer used";
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4a13.4 13.4 0 0 1 0 17.2 13.4 13.4 0 0 1 0-17.2Z"/></svg>' +
    '<span class="srclabel">Web search</span>' +
    '<span class="srccount">' + total + ' result' + (total === 1 ? "" : "s") + ' \u00b7 ' + sites + ' source' + (sites === 1 ? "" : "s") + '</span>' +
    '<svg class="srcchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  const panel = document.createElement("div"); panel.className = "srcpanel";
  const meta = document.createElement("div");
  meta.className = "srcmeta";
  meta.textContent = "Checked " + total + " results from " + sites + " source" + (sites === 1 ? "" : "s") + " just now";
  const row = document.createElement("div"); row.className = "sources";
  let shown = 0;
  groups.forEach(g => (g.items || []).forEach(it => {
    if (!it || !it.url || shown >= 12) return;
    shown++;
    const a2 = document.createElement("a");
    a2.className = "src"; a2.href = it.url; a2.target = "_blank"; a2.rel = "noopener";
    let host = ""; try { host = new URL(it.url).hostname.replace(/^www\./, ""); } catch(e){ noteError(e, "silent path"); }
    const t = String(it.title || "source");
    a2.textContent = "\u{1F517} " + (t.length > 42 ? t.slice(0, 42) + "\u2026" : t) + (host ? " \u00b7 " + host : "");
    row.append(a2);
  }));
  panel.append(meta);
  if (row.children.length) panel.append(row);

  btn.addEventListener("click", () => {
    wrap.classList.toggle("open");
    btn.title = wrap.classList.contains("open") ? "Hide the sources" : "Show the sources this answer used";
  });
  wrap.append(btn, panel);
  bub.append(wrap);
}

/* Rebuild a saved data card from its values. Every cell goes in as text, so a
 * CSV cell containing markup stays visible text instead of becoming nodes. */
/* One place that turns an analysed dataset into a stored record. The values are
 * kept; the rendered markup is not, because a stored HTML string that is later
 * assigned to innerHTML is executable markup waiting for a reason. */
function pushDataCard(ds, text){
  const cols = Array.isArray(ds && ds.cols) ? ds.cols : [];
  const rows = Array.isArray(ds && ds.rows) ? ds.rows : [];
  curHistory().push({
    kind: "data",
    content: text,
    data: {
      schemaVersion: 1,
      title: String((ds && ds.fileName) || "Imported data"),
      columns: cols.map(String),
      rows: rows.slice(0, 200).map((row) => cols.map((c) => String((row || {})[c] ?? "")))
    }
  });
  histSave();
}

function renderDataCard(m){
  const card = document.createElement("div");
  card.className = "datacard";
  const data = m.data && typeof m.data === "object" ? m.data : null;
  if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)){
    // an older record that only carries an HTML string: never inject it
    const note = document.createElement("div");
    note.className = "fnote";
    note.textContent = "This older data card cannot be safely restored. Re-import the original file to rebuild it.";
    card.append(note);
    return card;
  }
  const head = document.createElement("div");
  head.className = "dhead";
  head.textContent = "\u{1F4CA} " + String(data.title || "Imported data") + " \u2014 "
    + data.rows.length + " rows \u00b7 " + data.columns.length + " columns";
  card.append(head);
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const hrow = document.createElement("tr");
  for (const column of data.columns){
    const th = document.createElement("th");
    th.textContent = String(column);
    hrow.append(th);
  }
  thead.append(hrow);
  table.append(thead);
  const tbody = document.createElement("tbody");
  for (const row of data.rows){
    const tr = document.createElement("tr");
    for (const cell of row){
      const td = document.createElement("td");
      td.textContent = String(cell ?? "");
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  // A wide table scrolls inside its own region instead of widening the page.
  // The wrapper is built with DOM calls, so the safe rendering from Phase 1 is
  // untouched: no value is ever turned back into an HTML string.
  const tableScroll = document.createElement("div");
  tableScroll.className = "datacard__table-scroll";
  tableScroll.setAttribute("role", "region");
  tableScroll.setAttribute("aria-label", "Scrollable data table");
  tableScroll.append(table);
  card.append(tableScroll);
  return card;
}

function renderMsg(m){
  if (m.kind === "data"){
    chatEl.append(renderDataCard(m));
  } else if (m.role === "user" || m.role === "assistant"){
    const o = {};
    if (m.sources) o.sources = m.sources;
    if (m.image){ o.image = m.image; o.prompt = m.imagePrompt; }
    if (m.attachments && m.attachments.length) o.attachments = m.attachments;
    if (m.imageDropped) addMsg(m.role, "🎨 (image not saved — browser storage was full)", null);
    else {
      const rendered = addMsg(m.role, m.content, Object.keys(o).length ? o : null);
      if (m.role === "assistant") addAmigoSignature(rendered, m.provider || "", m.model || "");
    }
  }
}

function fmt(n){
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (typeof n === "number"){
    const r = Math.round(n * 100) / 100;
    if (Math.abs(r) >= 1e6) return (r/1e6).toFixed(2) + "M";
    if (Math.abs(r) >= 1e3) return (r/1e3).toFixed(2) + "k";
    return String(r);
  }
  return String(n);
}

function showHero(){
  const d = document.createElement("div"); d.className = "hero";
  d.innerHTML =
    '<div class="hstar">' + heroMarkHTML() + "</div>" +
    '<h2><span class="g">A little help, a lot of clarity.</span></h2>' +
    "<p>Your thoughtful AI companion for writing, research, ideas and everyday work.</p>" +
    (workerBase() ? '' : '<div class="worker-note">Using this site\'s own endpoint. <button type="button" data-open-settings="1">Open settings</button></div>') +
    '<div class="gcards">' +
      '<button class="gcard"><span class="gi">' + iconFor('\u{1F4AC}') + '</span><span class="gt">Ask me anything — writing, research or a quick decision</span></button>' +
      '<button class="gcard"><span class="gi">' + iconFor('\u{1F4CA}') + '</span><span class="gt">Analyze my data — funnel, trend or segments</span></button>' +
      '<button class="gcard"><span class="gi">' + iconFor('\u{1F4FD}\uFE0F') + '</span><span class="gt">Help me build a presentation or pitch deck</span></button>' +
      '<button class="gcard"><span class="gi">' + iconFor('\u{1F9EA}') + '</span><span class="gt">Check an A/B test result</span></button>' +
    "</div>" +
    '';
  chatEl.append(d);
  d.querySelectorAll(".gcard").forEach(c => c.addEventListener("click", () => { inputEl.value = c.querySelector(".gt").textContent; send(); }));
}

function renderAll(){
  chatEl.innerHTML = "";
  const h = curHistory();
  if (h.length === 0) showHero();
  else h.forEach(renderMsg);
  scrollDown();
}

function updateHeader(){
  const s = SKILLS[curSkill] || SKILLS.assistant;
  $("#helpline").style.display = s.helpline ? "" : "none";
  updateEngineStatus();
}
function updateEngineStatus(){
  const el = $("#engineStatus"); if (!el) return;
  if (!workerConfigured()){ el.textContent = "Connect Cloudflare"; return; }
  const route = selectedAiRoute();
  el.textContent = route.provider === "auto" ? "Workers AI · Auto fallback" : engineLabel(route.provider, route.model);
}


/* ── P4-06: the prompt corpus loads on demand ──────────────────────────────
 * The skill catalogue above is a manifest: names, icons, chips and flags. The
 * prompt text itself lives in assets/amigo/skills/<id>.json and is fetched the
 * first time that skill is actually used. Three quarters of this file used to
 * be prompt text that a selected conversation downloaded and parsed without
 * ever reading. */
const SKILL_PROMPT_CACHE = Object.create(null);

async function loadSkillPrompt(id){
  const key = String(id || "assistant");
  if (SKILL_PROMPT_CACHE[key] !== undefined) return SKILL_PROMPT_CACHE[key];
  try {
    const response = await fetch("/assets/amigo/skills/" + encodeURIComponent(key) + ".json",
      { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("prompt asset missing");
    const data = await response.json();
    SKILL_PROMPT_CACHE[key] = String(data && data.sys ? data.sys : "");
  } catch (e) {
    // a missing asset must not silence the assistant: it answers without the
    // skill preamble rather than failing the whole request
    SKILL_PROMPT_CACHE[key] = "";
  }
  return SKILL_PROMPT_CACHE[key];
}

/* ---------------- system prompt ---------------- */
async function buildSystemPrompt(){
  const s = SKILLS[curSkill] || SKILLS.assistant;
  let sys = "You are 'Amigo', a unified AI assistant. ";
  if (settings.skill === "auto")
    sys += "The active skill was auto-selected from the user's message: '" + s.name + "' (" + s.tag + "). Apply it. If the conversation moves outside it, stay helpful and clear. ";
  // the skill prompt is fetched here, once, and cached
  const skillPrompt = await loadSkillPrompt(curSkill);
  if (skillPrompt) sys += skillPrompt + "\n\n";
  sys += "Tone: warm, thoughtful, respectful and natural. Reply in the same language and script as the user.\n\n";
  sys += "Formatting rules (important): use clean, semantic Markdown. Start with the answer, not a greeting or preamble. For substantial answers, use a single clear level-2 heading (##) for each major section and level-3 headings (###) only for grouped subsections. Keep related points under the same heading; do not scatter repeated hashtags/headings or create a heading for every sentence. Use concise bullets for parallel points, numbered steps for sequences, fenced code blocks with a language label, and Markdown tables only when comparison or structured data benefits from a table. Keep paragraphs short, add whitespace between sections, and avoid unnecessary decoration. Preserve any stricter structure required by the active skill. Never output a wall of text.\n\n" + s.sys;
  sys += "\n\nFinal presentation instruction: keep the answer visually and semantically organised. Use a small number of meaningful Markdown headings, group related hashtags or topics together, avoid repeated or isolated headings, and keep the heading hierarchy consistent. When an active skill requires a specific output structure, keep that structure while formatting it cleanly.";
  return sys;
}

/* ---------------- Cloudflare Worker AI gateway ---------------- */
const WORKER_DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const WORKER_VISION_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
function workerBase(){ return String(settings.workerUrl || "").trim().replace(/\/+$/, ""); }

/* Veridellindo serves the assistant itself, on /api/chat and /api/image, from
 * the Pages Function that holds the Workers AI binding. So an empty Worker URL
 * is not a broken state — it means "use this site". A Worker URL still works
 * for anyone who wants to point the page at their own deployment. */
const SITE_ROUTES = [
  [/^\/v1\/chat\/completions/, "/api/chat"],
  [/^\/v1\/images\/generations/, "/api/image"],
  [/^\/health/, "/api/chat"]
];
function siteRoute(path){
  if (String(path).indexOf("/api/search") === 0) return null;   // no search provider here
  for (const pair of SITE_ROUTES) if (pair[0].test(path)) return pair[1];
  return path;
}
function workerConfigured(){ return true; }

async function workerRequest(path, options){
  const base = workerBase();
  const target = base ? (base + path) : siteRoute(path);
  if (target === null) return { results: [], configured: false };
  if (!target) throw new Error("This endpoint is not available on the site.");
  const init = Object.assign({ method: "GET", headers: { "Accept": "application/json" } }, options || {});
  if (init.body && typeof init.body !== "string"){
    init.headers = Object.assign({}, init.headers || {}, { "Content-Type": "application/json" });
    init.body = JSON.stringify(init.body);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 150000);
  init.signal = controller.signal;
  try {
    const response = await fetch(target, init);
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch(e){ data = { error: raw.slice(0, 400) }; }
    if (!response.ok) throw new Error((data && (data.error || data.message)) || ("Worker request failed (" + response.status + ")"));
    return data;
  } catch(err){
    if (err && err.name === "AbortError") throw new Error("AI request timed out. Please try again.");
    throw err;
  } finally { clearTimeout(timer); }
}
function selectedAiRoute(){
  const id = String(settings.aiModel || "auto");
  if (id === "auto") return { provider: "auto", model: WORKER_DEFAULT_MODEL };
  if (id.indexOf("@cf/") === 0) return { provider: "workers-ai", model: id };
  return { provider: "openrouter", model: id };
}

/* ── P4-03: one owner for the active request ───────────────────────────────
 * idle → thinking → responding → done | stopped | error. Only this object holds
 * the controller, so Stop always aborts the request that is actually running and
 * a late reply cannot land in a different conversation. */
const REQUEST = { state: "idle", id: 0, controller: null, chatId: null, startedAt: 0 };

function nextRequestId(){ REQUEST.id += 1; return REQUEST.id; }
function isCurrentRequest(id){ return REQUEST.id === id; }

function setRequestState(state){
  REQUEST.state = state;
  const stopEl = document.getElementById("stop");
  if (stopEl) stopEl.hidden = !(state === "thinking" || state === "responding");
  if (state === "thinking") announce("Amigo is thinking");
  else if (state === "responding") announce("Amigo is responding");
  else if (state === "stopped") announce("Response stopped");
  else if (state === "error") announce("Amigo could not answer");
}

function stopActiveRequest(){
  if (!REQUEST.controller) return;
  REQUEST.id += 1;          // invalidate anything still in flight
  REQUEST.controller.abort();
  REQUEST.controller = null;
}

/* Real streaming: the endpoint already speaks SSE, so deltas render as they
 * arrive instead of the whole answer appearing after a long silence. */
async function streamAmigoAI(messages, onDelta){
  const route = selectedAiRoute();
  const controller = new AbortController();
  const requestId = nextRequestId();
  REQUEST.controller = controller;
  REQUEST.startedAt = Date.now();
  const target = siteRoute("/v1/chat/completions") || "/api/chat";
  const response = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
    body: JSON.stringify({
      messages: messages,
      provider: route.provider,
      model: route.model,
      temperature: 0.65,
      max_tokens: 4096,
      stream: true
    }),
    signal: controller.signal
  });

  if (!response.ok){
    const raw = await response.text().catch(() => "");
    let message = "AI request failed (" + response.status + ")";
    try { const parsed = JSON.parse(raw); message = parsed.message || parsed.error || message; } catch(e){ noteError(e, "silent path"); }
    throw new Error(message);
  }

  const contentType = String(response.headers.get("content-type") || "");
  if (contentType.indexOf("text/event-stream") === -1){
    // a deployment that answered with plain JSON: hand it back to the caller
    const data = await response.json().catch(() => ({}));
    const text = data && data.choices && data.choices[0] && data.choices[0].message
      && data.choices[0].message.content;
    if (text) return { reply: String(text), provider: data.provider || route.provider, model: data.model || route.model, streamed: false };
    throw new Error("AI returned an empty answer.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let meta = {};
  for (;;){
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";
    for (const frame of frames){
      const line = frame.split("\n").find(l => l.indexOf("data:") === 0);
      if (!line) continue;
      let event;
      try { event = JSON.parse(line.slice(5).trim()); } catch(e){ continue; }
      if (!isCurrentRequest(requestId)) break;   // superseded or cancelled
      if (event.type === "delta" && event.text){
        answer += event.text;
        if (onDelta) onDelta(answer);
      } else if (event.type === "done"){
        if (event.answer) answer = event.answer;
        meta = event;
      } else if (event.type === "error"){
        throw new Error(event.message || "The assistant could not answer.");
      }
    }
  }
  if (!answer.trim()) throw new Error("AI returned an empty answer.");
  // `streamed` comes from the server: false means the provider produced the
  // whole answer at once, which is a completed response, not a stream.
  return {
    reply: answer,
    provider: meta.provider || route.provider,
    model: meta.model || route.model,
    streamed: meta.streamed !== false
  };
}

async function callAmigoAI(messages, overrides){
  const route = selectedAiRoute();
  const extra = overrides || {};
  const data = await workerRequest("/v1/chat/completions", {
    method: "POST",
    body: {
      messages: messages,
      provider: extra.provider || route.provider,
      model: extra.model || route.model,
      temperature: 0.65,
      max_tokens: 4096
    }
  });
  const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!text || !String(text).trim()) throw new Error("AI returned an empty answer.");
  return { reply: String(text), provider: data.provider || route.provider, model: data.model || route.model, fallbackReason: data.fallbackReason || "" };
}
function engineLabel(provider, model){
  const p = String(provider || "").toLowerCase(), m = String(model || "");
  if (m.indexOf("flux") >= 0) return "Workers AI · FLUX image";
  if (p.indexOf("workers") >= 0 || m.indexOf("@cf/") === 0) return "Workers AI · " + (m.indexOf("llama-4") >= 0 ? "Llama 4 Scout" : m.indexOf("llama-3.2") >= 0 ? "Llama 3.2" : "Llama 3.3");
  if (p.indexOf("openrouter") >= 0 || m.indexOf("openrouter/") === 0 || m.indexOf("meta-llama/") === 0) return "OpenRouter · " + (m === "openrouter/free" ? "Free Router" : "Llama");
  if (p === "workers-ai") return "Workers AI";
  return "AI";
}
function addAmigoSignature(bub, provider, model){
  if (!bub || bub.querySelector(".amigo-signature")) return;
  const row = document.createElement("div"); row.className = "amigo-signature";
  const img = document.createElement("img"); img.src = AMIGO_BRAND_URI; img.alt = "Veridellindo"; img.loading = "lazy";
  const name = document.createElement("span"); name.className = "amigo-name"; name.textContent = "Amigo";
  const label = document.createElement("span"); label.className = "engine-label"; label.textContent = engineLabel(provider, model);
  row.append(img, name, label); bub.append(row);
}

/* ---------------- connectors & deep search ---------------- */
const KEYLESS = { web: true, stack: true, hn: true, books: true, github: true, weather: true, trends: true };
const getConn = () => Object.assign({}, DEFAULTS.connectors, settings.connectors || {}, KEYLESS);
async function fetchJSON(url, opts, ms){
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms || 9000);
  try {
    const r = await fetch(url, Object.assign({ signal: ctl.signal }, opts || {}));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
async function wikiSearch(q){
  const u = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srlimit=4&srsearch=" + encodeURIComponent(q);
  const j = await fetchJSON(u);
  return ((j.query && j.query.search) || []).map(h => ({
    title: h.title,
    snippet: String(h.snippet || "").replace(/<[^>]*>/g, ""),
    url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(String(h.title).replace(/ /g, "_"))
  }));
}
async function wikiSummary(title){
  const u = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(String(title).replace(/ /g, "_"));
  const j = await fetchJSON(u);
  return {
    title: j.title || title,
    text: j.extract || "",
    url: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || ("https://en.wikipedia.org/wiki/" + encodeURIComponent(String(title).replace(/ /g, "_")))
  };
}
async function ddg(q){
  const j = await fetchJSON("https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=" + encodeURIComponent(q));
  const out = [];
  if (j.AbstractText) out.push({ title: j.Heading || "DuckDuckGo", text: j.AbstractText, url: j.AbstractURL || "https://duckduckgo.com/?q=" + encodeURIComponent(q) });
  ((j.RelatedTopics) || []).slice(0, 5).forEach(t => {
    if (t && t.Text && t.FirstURL) out.push({ title: t.Text.slice(0, 70), text: t.Text, url: t.FirstURL });
  });
  return out;
}
async function ghSearch(q){
  const h = { "Accept": "application/vnd.github+json" };
  if (getConn().ghToken) h.Authorization = "Bearer " + getConn().ghToken;
  const j = await fetchJSON("https://api.github.com/search/repositories?per_page=3&sort=stars&q=" + encodeURIComponent(q), { headers: h });
  return ((j.items) || []).map(r => ({
    title: r.full_name,
    text: (r.description || "") + " · stars " + r.stargazers_count + (r.language ? " · " + r.language : ""),
    url: r.html_url
  }));
}
async function ghIssues(q){
  const h = { "Accept": "application/vnd.github+json" };
  if (getConn().ghToken) h.Authorization = "Bearer " + getConn().ghToken;
  const j = await fetchJSON("https://api.github.com/search/issues?per_page=3&q=" + encodeURIComponent(q), { headers: h });
  return ((j.items) || []).map(i => ({ title: "#" + i.number + " " + i.title, text: (i.state || "") + " · " + (i.repository_url || "").replace("https://api.github.com/repos/", ""), url: i.html_url }));
}
const CITY_FALLBACK = {
  delhi:[28.61,77.21], "new delhi":[28.61,77.21], mumbai:[19.08,72.88], bengaluru:[12.97,77.59], bangalore:[12.97,77.59],
  hyderabad:[17.39,78.49], chennai:[13.08,80.27], kolkata:[22.57,88.36], pune:[18.52,73.86], ahmedabad:[23.02,72.57],
  jaipur:[26.91,75.79], lucknow:[26.85,80.95], patna:[25.59,85.14], bhopal:[23.26,77.41], indore:[22.72,75.86],
  chandigarh:[30.73,76.78], kochi:[9.93,76.27], guwahati:[26.14,91.74], bhubaneswar:[20.30,85.82], raipur:[21.25,81.63],
  varanasi:[25.32,82.97], agra:[27.18,78.01], surat:[21.17,72.83], nagpur:[21.15,79.09], ranchi:[23.34,85.31],
  dehradun:[30.32,78.03], shimla:[31.10,77.17], srinagar:[34.08,74.80], goa:[15.30,74.12], noida:[28.57,77.32],
  gurugram:[28.46,77.03], london:[51.51,-0.13], "new york":[40.71,-74.01], dubai:[25.20,55.27], singapore:[1.35,103.82],
  tokyo:[35.68,139.69], paris:[48.86,2.35], "san francisco":[37.77,-122.42], sydney:[-33.87,151.21], toronto:[43.65,-79.38]
};
async function weatherFor(city){
  let loc = null;
  try {
    const g = await fetchJSON("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(city));
    loc = g.results && g.results[0];
  } catch(e){ loc = null; }
  if (!loc){
    const key = String(city).toLowerCase().trim();
    const fb = CITY_FALLBACK[key];
    if (fb) loc = { name: String(city).replace(/\b\w/g, c => c.toUpperCase()), country: "", latitude: fb[0], longitude: fb[1] };
  }
  if (!loc) throw new Error("city not found");
  const j = await fetchJSON("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m" +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto");
  const c = j.current || {}, d = j.daily || {};
  let txt = "right now " + c.temperature_2m + "°C (feels like " + c.apparent_temperature + "°C), humidity " + c.relative_humidity_2m + "%, wind " + c.wind_speed_10m + " km/h";
  if (d.time && d.time.length){
    txt += ". Next days: " + d.time.map((t, i) => t + " " + d.temperature_2m_min[i] + "-" + d.temperature_2m_max[i] + "°C" +
      (d.precipitation_probability_max ? ", rain " + d.precipitation_probability_max[i] + "%" : "")).join("; ");
  }
  return { title: "Weather — " + loc.name + (loc.country ? ", " + loc.country : ""), text: txt, url: "https://open-meteo.com/" };
}
async function webItems(q){
  const items = [];
  try {
    const hits = await wikiSearch(q);
    for (const h of hits.slice(0, 3)){
      try { const sm = await wikiSummary(h.title); if (sm.text) items.push(sm); }
      catch(e){ if (h.snippet) items.push({ title: h.title, text: h.snippet, url: h.url }); }
    }
  } catch(e){ noteError(e, "silent path"); }
  try { (await wikidataSearch(q)).slice(0, 2).forEach(x => items.push(x)); } catch(e){ noteError(e, "silent path"); }
  try { (await ddg(q)).slice(0, 4).forEach(x => items.push(x)); } catch(e){ noteError(e, "silent path"); }
  return items;
}
/* Wikidata — quick factual entities (keyless) */
async function wikidataSearch(q){
  const u = "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=en&limit=3&search=" + encodeURIComponent(q);
  const j = await fetchJSON(u);
  return (j.search || []).map(x => ({
    title: x.label || x.id,
    text: (x.description || "Wikidata entity") + " · " + x.id,
    url: "https://www.wikidata.org/wiki/" + x.id
  }));
}
/* GDELT — worldwide news coverage, keyless (a broad Google-News-like sweep) */
async function gdeltSearch(q){
  const u = "https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=4&sort=hybridrel&query=" + encodeURIComponent(q);
  const j = await fetchJSON(u);
  return (j.articles || []).map(a => ({
    title: a.title || "News article",
    text: (a.domain ? a.domain + " · " : "") + (a.seendate ? String(a.seendate).slice(0, 8) : ""),
    url: a.url
  })).filter(x => x.url);
}
/* Optional Google search is proxied through the Worker; the SerpApi secret never reaches this page. */
async function serpSearch(q){
  if (!workerConfigured()) return [];
  const j = await workerRequest("/api/search?q=" + encodeURIComponent(q));
  return Array.isArray(j.results) ? j.results : [];
}
/* Google Programmable Search — the official way to get Google results in an app */
async function googleSearch(q){
  const c = getConn();
  if (!c.gkey || !c.gcx) return [];
  const u = "https://www.googleapis.com/customsearch/v1?num=6&key=" + encodeURIComponent(c.gkey) + "&cx=" + encodeURIComponent(c.gcx) + "&q=" + encodeURIComponent(q);
  const j = await fetchJSON(u);
  return (j.items || []).map(it => ({
    title: it.title,
    text: (it.snippet || "") + (it.displayLink ? " · " + it.displayLink : ""),
    url: it.link
  }));
}
/* Stack Overflow / Stack Exchange */
async function stackSearch(q){
  const u = "https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&pagesize=4&site=stackoverflow&q=" + encodeURIComponent(q);
  const j = await fetchJSON(u);
  return (j.items || []).map(it => ({
    title: it.title,
    text: (String(it.body_markdown || "").replace(/[#*`>\[\]]/g, " ").slice(0, 260)) + " · score " + it.score + (it.is_answered ? " · answered" : ""),
    url: it.link
  }));
}
/* Hacker News (Algolia) */
async function hnSearch(q){
  const u = "https://hn.algolia.com/api/v1/search?hitsPerPage=5&query=" + encodeURIComponent(q);
  const j = await fetchJSON(u);
  return (j.hits || []).map(h => ({
    title: h.title || (h.story_title || "HN discussion"),
    text: (h.story_text || h.comment_text || "").replace(/<[^>]*>/g, " ").slice(0, 220) + (h.points ? " · " + h.points + " points" : ""),
    url: h.url || ("https://news.ycombinator.com/item?id=" + h.objectID)
  }));
}
/* Books & research papers */
async function booksSearch(q){
  const items = [];
  try {
    const j = await fetchJSON("https://openlibrary.org/search.json?limit=3&q=" + encodeURIComponent(q));
    (j.docs || []).slice(0, 3).forEach(d => items.push({
      title: (d.title || "Book") + (d.author_name ? " — " + d.author_name[0] : ""),
      text: "Open Library" + (d.first_publish_year ? " · first published " + d.first_publish_year : ""),
      url: "https://openlibrary.org" + (d.key || "")
    }));
  } catch(e){ noteError(e, "silent path"); }
  try {
    const j = await fetchJSON("https://api.crossref.org/works?rows=3&query=" + encodeURIComponent(q));
    ((j.message && j.message.items) || []).slice(0, 3).forEach(w => {
      const t = (w.title && w.title[0]) || "Research paper";
      const host = (w["container-title"] && w["container-title"][0]) || "";
      items.push({ title: t, text: (host ? host + " · " : "") + (w.published && w.published["date-parts"] ? w.published["date-parts"][0][0] : ""), url: w.URL || ("https://doi.org/" + w.DOI) });
    });
  } catch(e){ noteError(e, "silent path"); }
  try {
    const j = await fetchJSON("https://api.openalex.org/works?per-page=3&search=" + encodeURIComponent(q));
    (j.results || []).slice(0, 3).forEach(w => {
      const src = (w.primary_location && w.primary_location.source && w.primary_location.source.display_name) || "";
      items.push({
        title: w.title || "Research paper",
        text: (src ? src + " · " : "") + (w.publication_year || ""),
        url: (w.doi && String(w.doi).startsWith("http")) ? w.doi : (w.id || "")
      });
    });
  } catch(e){ noteError(e, "silent path"); }
  return items;
}
async function trendItems(){
  const out = [];
  try {
    const d = new Date(Date.now() - 2 * 864e5);
    const y = d.getUTCFullYear(), m = String(d.getUTCMonth() + 1).padStart(2, "0"), dd = String(d.getUTCDate()).padStart(2, "0");
    const j = await fetchJSON("https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/" + y + "/" + m + "/" + dd);
    const arts = (((j.items || [])[0] || {}).articles) || [];
    arts.filter(a => a.article && !/^(Main_Page|Special:|Wikipedia:|Portal:)/.test(a.article))
        .slice(0, 5).forEach(a => out.push({
          title: a.article.replace(/_/g, " "),
          text: "Wikipedia · most-read today · " + Number(a.views || 0).toLocaleString() + " views",
          url: "https://en.wikipedia.org/wiki/" + a.article
        }));
  } catch(e){ noteError(e, "silent path"); }
  try {
    const j = await fetchJSON("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5");
    (j.hits || []).slice(0, 5).forEach(h => out.push({
      title: h.title || h.story_title || "Hacker News story",
      text: "Hacker News · front page" + (h.points ? " · " + h.points + " points" : ""),
      url: h.url || ("https://news.ycombinator.com/item?id=" + h.objectID)
    }));
  } catch(e){ noteError(e, "silent path"); }
  try { (await gdeltSearch("trending OR breaking")).slice(0, 3).forEach(x => out.push(x)); } catch(e){ noteError(e, "silent path"); }
  return out;
}
const wantsLive = t => /\b(latest|current|today|tonight|right now|nowadays|this (week|month|year)|recent|breaking|news|update|price|rate|score|match|trend|trending|live)\b|\u0906\u091c|\u0905\u092d\u0940|\u0924\u093e\u091c\u093c\u093e|\u0916\u093c\u092c\u0930|\u0938\u092e\u093e\u091a\u093e\u0930|\u0926\u093e\u092e|\u092d\u093e\u0935/i.test(t);
const wantsTrends = t => /trend|trending|what'?s (hot|new|going on|happening)|latest news|in the news|viral|aaj kya|\u0906\u091c \u0915\u094d\u092f\u093e|\u091f\u094d\u0930\u0947\u0902\u0921|\u0924\u093e\u091c\u093c\u093e \u0916\u093c\u092c\u0930|kya chal raha/i.test(t);
const wantsWeather = t => /weather|temperature|forecast|how (hot|cold)|mausam|मौसम|बारिश|rain|humidity|garmi|sardi/i.test(t);
const wantsGithub  = t => /github|\brepo(sitory)?\b|pull request|\bpr\b|issue|commit|open source|stars?\b/i.test(t);

function stripTags(t){
  return String(t).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}
async function readUrl(url){
  const t9 = ms => (AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);
  // 1. direct (works for APIs and CORS-friendly sites)
  try {
    const r = await fetch(url, { signal: t9(8000) });
    if (r.ok) { const text = stripTags(await r.text()); if (text.length > 120) return { title: url.replace(/^https?:\/\//, "").slice(0, 60), text: text.slice(0, 4000), url: url }; }
  } catch(e){ noteError(e, "silent path"); }
  // 2. Wikipedia articles: read them through the CORS-enabled REST API
  const wm = url.match(/^https?:\/\/([a-z-]+)\.wikipedia\.org\/wiki\/(.+)$/i);
  if (wm){
    try {
      const sm = await wikiSummary(decodeURIComponent(wm[2]).replace(/_/g, " "));
      if (sm.text) return { title: sm.title, text: sm.text, url: sm.url };
    } catch(e){ noteError(e, "silent path"); }
  }
  // 3. public CORS proxies as a last resort
  const proxies = ["https://api.allorigins.win/raw?url=", "https://corsproxy.io/?"];
  for (const px of proxies){
    try {
      const r = await fetch(px + encodeURIComponent(url), { signal: t9(9000) });
      if (!r.ok) continue;
      const text = stripTags(await r.text());
      if (text.length > 120) return { title: url.replace(/^https?:\/\//, "").slice(0, 60), text: text.slice(0, 4000), url: url };
    } catch(e){ noteError(e, "silent path"); }
  }
  throw new Error("could not read that page");
}
async function runConnectors(text, deep){
  const c = getConn();
  const q = String(text).slice(0, 220);
  const jobs = [];
  const add = (label, pr) => jobs.push(pr.then(items => (items && items.length) ? { label: label, items: items } : null).catch(() => null));
  if (deep){
    if (workerConfigured()) add("Google (SerpApi)", serpSearch(q));
    if (c.google && c.gkey && c.gcx) add("Google Search", googleSearch(q));
    if (c.web) add("Wikipedia, Wikidata & DuckDuckGo", webItems(q));
    if (c.stack) add("Stack Overflow / Stack Exchange", stackSearch(q));
    if (c.hn) add("News — Hacker News + GDELT", Promise.all([hnSearch(q).catch(() => []), gdeltSearch(q).catch(() => [])]).then(a => a[0].concat(a[1])));
    if (c.books) add("Books & research papers", booksSearch(q));
  }
  if (c.github && (deep || wantsGithub(text))){
    const gq = q.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
    jobs.push(Promise.all([ghSearch(gq).catch(() => []), wantsGithub(text) ? ghIssues(gq).catch(() => []) : Promise.resolve([])])
      .then(([repos, issues]) => { const items = repos.concat(issues); return items.length ? { label: "GitHub", items: items } : null; })
      .catch(() => null));
  }
  if (c.trends && (deep || settings.liveMode || wantsTrends(text))) jobs.push(trendItems().then(items => items.length ? { label: "Trending right now", items: items } : null).catch(() => null));
  if (c.weather && wantsWeather(text)){
    const m = text.match(/(?:in|at|for|of|ka|ki)\s+([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F .-]{1,28})/i);
    const city = (m && m[1] ? m[1] : "Delhi").trim().replace(/[.?!,]$/, "");
    jobs.push(weatherFor(city).then(w => ({ label: "Weather (Open-Meteo)", items: [w] })).catch(() => null));
  }
  const link = (String(text).match(/https?:\/\/[^\s)]+/) || [])[0];
  if (link) jobs.push(readUrl(link).then(it => it ? { label: "Page you linked", items: [{ title: it.title, text: it.text.slice(0, 1800), url: it.url }] } : null).catch(() => null));
  const out = (await Promise.all(jobs)).filter(Boolean);
  return out.length ? out : null;
}
function researchBlock(res){
  if (!res || !res.length) return "";
  let out = "\n\n---\n\n# Live data fetched from the internet just now (verified)\n\n";
  out += "These results were fetched moments ago through the app from " + res.length + " different sources. Cross-check them against each other: use what several sources agree on, and if they disagree, say so and show both. Cite with markdown links [title](url). Keep the user's own numbers separate from this data. If it does not answer the question, say so plainly instead of guessing.\n";
  res.forEach(g => {
    out += "\n## " + g.label + "\n";
    g.items.forEach(it => { out += "\n- " + it.title + " — " + it.text + " (" + it.url + ")\n"; });
  });
  return out;
}

/* ---------------- send flow ---------------- */
function setBusy(b){ busy = b; sendEl.disabled = b; inputEl.disabled = b; $("#attach").disabled = b; $("#abBtn").disabled = b; }

async function send(){
  const text = inputEl.value.trim();
  if ((!text && !_pending.length) || busy) return;
  if (settings.skill === "auto" && curHistory().length === 0){
    curSkill = routeSkill(text);
    updateHeader();
  }
  inputEl.value = "";
  inputEl.style.height = "auto";
  const _h = curHistory();
  const _last = _h[_h.length - 1];
  const isRetry = !!(_last && _last.role === "user" && String(_last.content).trim() === text);
  if (_h.length === 0) chatEl.innerHTML = "";
  const atts = _pending.slice();
  _pending = []; renderAttBar();
  if (!isRetry){ _h.push({ role: "user", content: text || "Please look at what I attached.", attachments: atts.length ? atts : undefined }); addMsg("user", text || "Please look at what I attached.", atts.length ? { attachments: atts } : null); }
  histSave(); setBusy(true); scrollDown(true);

  announce("Amigo is thinking");
  const bub = addMsg("assistant", "", { typing: true });
  const bubWrap = bub.parentElement; if (bubWrap) bubWrap.classList.add("answering");

  /* image generation: if the user wants a picture (or 🎨 is on), draw it and stop here */
  if (!!settings.imageMode || wantsImage(text)){
    bub.innerHTML = '<span class="searching">' + dharmaHTML() + ' 🎨 Drawing your image…</span>';
    try {
      const src = await genImage(text);
      const cap = "🎨 Here is your image.";
      bub.innerHTML = mdLite(cap);
      addImage(bub, src, text);
      addAmigoSignature(bub, "workers-ai", "@cf/black-forest-labs/flux-1-schnell");
      if (bubWrap) addCopy(bubWrap, text, false);
      curHistory().push({ role: "assistant", content: cap, image: src, imagePrompt: text, provider: "workers-ai", model: "@cf/black-forest-labs/flux-1-schnell" });
      histSave();
    } catch(err){
      bub.classList.add("err");
      bub.textContent = "⚠️ " + (err && err.message ? err.message : "Image generation failed.");
      const rb = document.createElement("button");
      rb.className = "retrybtn"; rb.textContent = "↻ Try again";
      rb.onclick = () => { inputEl.value = text; send(); };
      bub.append(document.createElement("br")); bub.append(rb);
    } finally {
      if (bubWrap) bubWrap.classList.remove("answering");
      setBusy(false); inputEl.focus();
    }
    scrollDown();
    return;
  }

  /* connectors: pull live data before answering */
  let sources = null;
  try {
    const deep = !!settings.deepSearch;
    if (deep || wantsWeather(text) || wantsGithub(text) || wantsTrends(text) || wantsLive(text) || settings.liveMode || /https?:\/\//.test(text)){
      bub.innerHTML = '<span class="searching">' + dharmaHTML() + ' Researching live sources…</span>';
      sources = await runConnectors(text, deep);
      if (!sources) bub.innerHTML = '<span class="typing">'
        + '<img class="amigo-mascot mascot-status" src="' + AMIGO_POSE.think + '" alt="" width="48" height="48" decoding="async">'
        + dharmaHTML() + '<span class="sr-only">Amigo is responding</span></span>';
    }
  } catch(e){ sources = null; }
  const sys = (await buildSystemPrompt()) + researchBlock(sources);
  const msgs = [{ role: "system", content: sys }].concat(
    curHistory().slice(-30).map(m => {
      if (m.kind === "data") return { role: "user", content: m.content };
      let c = m.content || "";
      (m.attachments || []).forEach(a => {
        if (a.kind === "text") c += "\n\n--- File: " + a.name + " ---\n" + a.text;
        else if (a.kind === "unsupported") c += "\n\n[The user attached " + a.name + ", which could not be read in the browser — say so honestly if it matters.]";
      });
      const imgs = (m.attachments || []).filter(a => a.kind === "image" && a.image);
      if (imgs.length){
        const parts = [{ type: "text", text: c || "Please look at this image." }];
        imgs.forEach(a => parts.push({ type: "image_url", image_url: { url: a.image } }));
        return { role: m.role, content: parts };
      }
      return { role: m.role, content: c };
    })
  );
  let reply = "";
  let partial = "";
  let usedProvider = "workers-ai";
  let usedModel = settings.aiModel || WORKER_DEFAULT_MODEL;
  let fallbackReason = "";
  try {
    setRequestState("thinking");
    const result = await streamAmigoAI(msgs, (text) => {
      // deltas render as they arrive; the typing placeholder is replaced by the
      // first real token rather than waiting for the whole answer
      setRequestState("responding");
      partial = text;
      bub.innerHTML = mdLite(text);
      scrollDown(false);
    });
    reply = result.reply;
    usedProvider = result.provider;
    usedModel = result.model;
    fallbackReason = result.fallbackReason || "";
    const _chip = (reply && curSkill !== "assistant") ? skillChipHTML() : "";
    // A completed response is rendered at once. Revealing it word by word made
    // a single payload look like a progressive stream, which the contract says
    // it is not, and it kept long answers unreadable for seconds.
    bub.innerHTML = mdLite(reply) + _chip;
    setRequestState("done");
    if (fallbackReason){
      const fn = document.createElement("div"); fn.className = "fallbacknote";
      fn.textContent = "Workers AI was unavailable, so Amigo used OpenRouter instead.";
      bub.append(fn);
    }
    if (sources) addSources(bub, sources);
    addAmigoSignature(bub, usedProvider, usedModel);
    if (bubWrap) addCopy(bubWrap, reply, true);
    if (curHistory().length <= 3) autoTitle(curSkill);
    curHistory().push({ role: "assistant", content: reply, sources: sources || null, provider: usedProvider, model: usedModel });
    histSave();
  } catch(err){
    if (err && err.name === "AbortError"){
      // stopped by the reader: keep whatever arrived, say so, do not shout error
      setRequestState("stopped");
      bub.classList.remove("err");
      const kept = (partial || "").trim();
      bub.innerHTML = (kept ? mdLite(kept) : "")
        + '<div class="fallbacknote">Response stopped.</div>';
      if (kept) curHistory().push({ role: "assistant", content: kept, sources: sources || null, provider: usedProvider, model: usedModel });
      histSave();
      setBusy(false); setRequestState("idle"); inputEl.focus();
      return;
    }
    setRequestState("error");
    bub.classList.add("err");
    bub.textContent = "⚠️ " + (err && err.message ? err.message : "Something went wrong.") + "\n\nCheck the Cloudflare Worker URL, Worker deployment, AI binding and OpenRouter secret in Settings.";
    const rb = document.createElement("button");
    rb.className = "retrybtn";
    rb.textContent = "↻ Try again";
    rb.onclick = () => {
      const h = curHistory();
      for (let i = h.length - 1; i >= 0; i--){ if (h[i].role === "user"){ inputEl.value = h[i].content; break; } }
      send();
    };
    bub.append(document.createElement("br"));
    bub.append(rb);
  } finally {
    if (bubWrap) bubWrap.classList.remove("answering");
    setBusy(false); inputEl.focus();
  }
  scrollDown();
}

/* ---------------- attachments: any file, any photo ---------------- */
let _pending = [];
const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|jsonl|xml|html?|css|js|mjs|ts|jsx|tsx|py|java|c|cpp|h|cs|rb|go|rs|php|sh|sql|yml|yaml|ini|conf|log|srt|vtt)$/i;

function renderAttBar(){
  const bar = $("#attBar"); if (!bar) return;
  bar.innerHTML = "";
  _pending.forEach((a, i) => {
    const chip = document.createElement("span"); chip.className = "attchip";
    if (a.kind === "image" && a.image){ const im = document.createElement("img"); im.src = a.image; chip.append(im); }
    const nm = document.createElement("span");
    nm.textContent = a.name + (a.kind === "unsupported" ? " — can't read this one" : "");
    chip.append(nm);
    const opener = a.image || a.url;
    if (opener){
      chip.style.cursor = "pointer";
      chip.title = "Open " + a.name;
      chip.addEventListener("click", (ev) => { if (!ev.target.classList.contains("x")) window.open(opener, "_blank"); });
    }
    const x = document.createElement("button"); x.type = "button"; x.className = "x"; x.textContent = "\u2715"; x.title = "Remove";
    x.addEventListener("click", () => { _pending.splice(i, 1); renderAttBar(); });
    chip.append(x); bar.append(chip);
  });
}
const readAsDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
const readAsText = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(f); });

async function shrinkImage(dataUrl){
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
    const max = 1200, w = img.width, h = img.height;
    if (w <= max && h <= max && dataUrl.length < 900000) return dataUrl;
    const r = Math.min(max / w, max / h, 1);
    const c = document.createElement("canvas"); c.width = Math.round(w * r); c.height = Math.round(h * r);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } catch(e){ return dataUrl; }
}

/* pull the words out of a PDF, right here in the browser (no library) */
function findBytes(hay, needle, from){
  const n = needle.length;
  outer:
  for (let i = from; i <= hay.length - n; i++){
    for (let j = 0; j < n; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}
async function inflateBytes(u8, fmt){
  const ds = new DecompressionStream(fmt);
  const w = ds.writable.getWriter();
  try { w.write(u8); } catch(e){ noteError(e, "silent path"); }
  try { w.close(); } catch(e){ noteError(e, "silent path"); }
  const rd = ds.readable.getReader(); const chunks = [];
  try {
    while (true){ const { done, value } = await rd.read(); if (done) break; if (value) chunks.push(value); }
  } catch(e){ /* the stream may end with a few stray bytes — keep what we already decoded */ }
  let len = 0; chunks.forEach(c => { len += c.length; });
  const out = new Uint8Array(len); let o = 0;
  chunks.forEach(c => { out.set(c, o); o += c.length; });
  return new TextDecoder("utf-8", { fatal: false }).decode(out);
}
async function extractPdfText(file){
  const bytes = new Uint8Array(await file.arrayBuffer());
  const S = [115,116,114,101,97,109], E = [101,110,100,115,116,114,101,97,109];
  let out = "", pos = 0;
  while (true){
    const a = findBytes(bytes, S, pos); if (a < 0) break;
    let start = a + S.length;
    if (bytes[start] === 13) start++;
    if (bytes[start] === 10) start++;
    const e = findBytes(bytes, E, start); if (e < 0) break;
    let end = e;
    while (end > start && (bytes[end - 1] === 10 || bytes[end - 1] === 13)) end--;
    const chunk = bytes.slice(start, end);
    let text = "";
    try { text = await inflateBytes(chunk, "deflate"); }
    catch(err){ try { text = await inflateBytes(chunk.slice(2), "deflate-raw"); } catch(e2){ text = ""; } }
    if (text){
      const parts = text.match(/\((?:\\.|[^\\()])*\)/g);
      if (parts) out += parts.map(x => x.slice(1, -1).replace(/\\([()\\])/g, "$1")).join(" ") + "\n";
    }
    pos = e + E.length;
  }
  const clean = out.replace(/\s+/g, " ").trim();
  // keep only if it actually looks like words
  const letters = (clean.match(/[A-Za-z\u0900-\u097F]/g) || []).length;
  return (clean.length > 40 && letters / clean.length > 0.45) ? clean : "";
}

/* the full PDF reader, loaded only when a PDF is actually attached */
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
function loadPdfJs(){
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = PDFJS + "pdf.min.js";
    sc.onload = () => {
      try { if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; } catch(e){ noteError(e, "silent path"); }
      res(window.pdfjsLib);
    };
    sc.onerror = () => rej(new Error("pdf.js could not load"));
    document.head.append(sc);
  });
}
async function pdfTextWithLib(file){
  const lib = await loadPdfJs();
  if (!lib || !lib.getDocument) throw new Error("no pdf.js");
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let out = "";
  const n = Math.min(doc.numPages || 1, 40);
  for (let i = 1; i <= n; i++){
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    out += (tc.items || []).map(it => it.str).join(" ") + "\n";
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

async function handleFiles(files){
  for (const file of files){
    if (file.size > 8 * 1024 * 1024){ alert(file.name + " is too large — 8MB is the limit."); continue; }
    const isCsv = /\.(csv|tsv)$/i.test(file.name) || file.type === "text/csv";
    if (isCsv){ loadCSVFile(file); continue; }
    const isImg = /^image\//i.test(file.type) || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
    if (isImg){
      const raw = await readAsDataURL(file);
      _pending.push({ name: file.name, kind: "image", image: await shrinkImage(raw) });
      continue;
    }
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)){
      let _u = ""; try { _u = await readAsDataURL(file); } catch(e){ noteError(e, "silent path"); }
      let t = "";
      try { t = await pdfTextWithLib(file); } catch(e){ t = ""; }
      if (!t || t.length < 60){ try { const t2 = await extractPdfText(file); if (t2 && t2.length > (t || "").length) t = t2; } catch(e){ noteError(e, "silent path"); } }
      if (t && t.length > 60) _pending.push({ name: file.name, kind: "text", text: t.slice(0, 60000), url: _u });
      else _pending.push({ name: file.name, kind: "unsupported", url: _u });
      continue;
    }
    if (TEXT_EXT.test(file.name) || /^text\//i.test(file.type)){
      const t = await readAsText(file);
      let _u = ""; try { _u = await readAsDataURL(file); } catch(e){ noteError(e, "silent path"); }
      _pending.push({ name: file.name, kind: "text", text: String(t).slice(0, 60000), url: _u });
      continue;
    }
    let _u2 = ""; try { _u2 = await readAsDataURL(file); } catch(e){ noteError(e, "silent path"); }
    _pending.push({ name: file.name, kind: "unsupported", url: _u2 });
  }
  renderAttBar();
}
function addMsgAtt(bub, atts){
  const wrap = document.createElement("div"); wrap.className = "msgatt";
  atts.forEach(a => {
    if (a.kind === "image" && a.image){
      const im = document.createElement("img"); im.src = a.image; im.alt = a.name || "photo";
      im.addEventListener("click", () => window.open(a.image, "_blank"));
      wrap.append(im);
    } else {
      const c = document.createElement(a.url ? "a" : "span"); c.className = "fchip";
      if (a.url){ c.href = a.url; c.target = "_blank"; c.rel = "noopener"; c.download = a.name || "file"; }
      c.textContent = "\u{1F4CE} " + (a.name || "file") + (a.kind === "unsupported" ? " (could not be read)" : "");
      wrap.append(c);
    }
  });
  if (wrap.children.length) bub.append(wrap);
}

/* ---------------- image generation via Cloudflare Workers AI / FLUX ---------------- */
const wantsImage = t => {
  const s = String(t);
  return /(generate|create|make|draw|design|paint|render|show me|bana|banao|बनाओ|बनाइए)\s+(me\s+)?(an?\s+|ek\s+)?(image|picture|photo|poster|logo|illustration|artwork|art|sketch|drawing|thumbnail|wallpaper|चित्र|तस्वीर|फ़ोटो|फोटो|पोस्टर|लोगो)/i.test(s)
    || /^(draw|paint|sketch|illustrate)\b/i.test(s)
    || /\b(image|picture|photo|poster|logo|illustration|thumbnail|wallpaper)\b[^.]{0,40}\b(of|for|showing|with|that)\b/i.test(s)
    || /(चित्र|तस्वीर|फ़ोटो|फोटो|पोस्टर|लोगो)\s*(बनाओ|बना|बनाइए|चाहिए|चाहिये)/.test(s);
};
async function genImage(prompt){
  const data = await workerRequest("/v1/images/generations", { method: "POST", body: { prompt: String(prompt || "").slice(0, 1800) } });
  const src = data && (data.dataURI || data.image || (data.data && data.data[0] && data.data[0].url));
  if (!src) throw new Error("Cloudflare image generation returned no image.");
  return src;
}

/* ---------------- CSV data tool ---------------- */
function parseCSV(text, delim){
  const rows = []; let row = [], field = "", inQ = false;
  const d = delim || (text.split("\n")[0].includes("\t") ? "\t" : ",");
  for (let i = 0; i < text.length; i++){
    const c = text[i];
    if (inQ){
      if (c === '"'){ if (text[i+1] === '"'){ field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === d){ row.push(field); field = ""; }
      else if (c === "\n"){ row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
  }
  if (field !== "" || row.length){ row.push(field); rows.push(row); }
  if (rows.length && rows[rows.length-1].length === 1 && rows[rows.length-1][0] === "") rows.pop();
  return rows;
}
function isNum(v){ if (v === "" || v === null || v === undefined) return false; return !isNaN(Number(String(v).replace(/[,\s₹]/g,""))); }

function analyze(rows, cols){
  const prof = {};
  for (const c of cols){
    const vals = rows.map(r => r[c]);
    const nonEmpty = vals.filter(v => v !== "" && v !== null && v !== undefined);
    const numeric = nonEmpty.length > 0 && nonEmpty.every(isNum);
    if (numeric){
      const xs = nonEmpty.map(v => Number(String(v).replace(/[,\s₹]/g,""))).sort((a,b) => a-b);
      const n = xs.length;
      const mean = xs.reduce((a,b)=>a+b,0)/n;
      const q1 = xs[Math.floor(0.25*(n-1))], med = xs[Math.floor(0.5*(n-1))], q3 = xs[Math.floor(0.75*(n-1))], p90 = xs[Math.floor(0.9*(n-1))];
      const iqr = q3 - q1;
      const outliers = xs.filter(x => x < q1 - 1.5*iqr || x > q3 + 1.5*iqr).length;
      const stdev = n > 1 ? Math.sqrt(xs.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(n-1)) : 0;
      let skew = "mild";
      if (mean > 1.5*med && med > 0) skew = "right";
      else if (med > 1.5*mean && mean > 0) skew = "left";
      prof[c] = { type:"num", n, missing: vals.length - n, min: xs[0], q1, med, q3, p90, max: xs[n-1],
                  mean, stdev, iqr, outliers, skew };
    } else {
      const counts = {};
      nonEmpty.forEach(v => { counts[v] = (counts[v]||0) + 1; });
      const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
      prof[c] = { type:"txt", n: nonEmpty.length, missing: vals.length - nonEmpty.length,
                  unique: Object.keys(counts).length, top };
    }
  }
  return prof;
}

function loadCSVFile(file){
  if (file.size > 5*1024*1024){ alert("फ़ाइल बहुत बड़ी है (5MB तक ही)।"); return; }
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const raw = parseCSV(String(fr.result));
      if (raw.length < 2) throw new Error("CSV में data rows नहीं मिले।");
      const header = raw[0].map((h,i) => (h || "col"+(i+1)).trim());
      const seen = {}; header.forEach((h,i)=>{ seen[h]=(seen[h]||0)+1; if(seen[h]>1) header[i]=h+"_"+seen[h]; });
      const rows = raw.slice(1).filter(r => r.some(v => v !== "")).slice(0, 50000)
        .map(r => { const o = {}; header.forEach((h,i)=>{ o[h] = (r[i]===undefined?"":r[i]).trim(); }); return o; });
      if (!rows.length) throw new Error("खाली CSV।");
      const prof = analyze(rows, header);
      dataState = { fileName: file.name, rows, cols: header, prof };
      const { html, text } = dataCardHTML(dataState);
      const h = curHistory();
      if (h.length === 0) chatEl.innerHTML = "";
      // Persist the values, not a rendered HTML blob: a stored string that is
      // later assigned to innerHTML is executable markup waiting for a reason.
      h.push({
        kind: "data",
        content: text,
        data: {
          schemaVersion: 1,
          title: String(dataState.fileName || "Imported data"),
          columns: dataState.cols.map(String),
          rows: dataState.rows.slice(0, 200).map((row) => dataState.cols.map((c) => String(row[c] ?? "")))
        }
      });
      histSave();
      renderAll();
    } catch(err){ alert("CSV पढ़ने में दिक़्क़त: " + err.message); }
  };
  fr.readAsText(file);
}

function dataCardHTML(ds){
  const p = ds.prof;
  const numCols = ds.cols.filter(c => p[c].type === "num");
  const txtCols = ds.cols.filter(c => p[c].type === "txt");
  let html = '<div class="dhead">📊 ' + esc(ds.fileName) + " — " + fmt(ds.rows.length) + " rows · " + ds.cols.length + " columns</div><div class='dbody'>";
  if (numCols.length){
    html += "<table><tr><th>Column</th><th>Missing</th><th>Mean</th><th>Median</th><th>P90</th><th>Stdev</th><th>Outliers</th><th>Skew</th></tr>";
    for (const c of numCols){
      const s = p[c];
      html += "<tr><td>" + esc(c) + "</td><td>" + (s.missing ? s.missing : "0") + "</td><td>" + fmt(s.mean) + "</td><td>" + fmt(s.med) + "</td><td>" + fmt(s.p90) + "</td><td>" + fmt(s.stdev) + "</td><td>" + s.outliers + "</td><td>" + s.skew + "</td></tr>";
    }
    html += "</table>";
  }
  if (txtCols.length){
    html += "<table class='ttxt'><tr><th>Column</th><th>Missing</th><th>Unique</th><th>Top values</th></tr>";
    for (const c of txtCols){
      const s = p[c];
      html += "<tr><td>" + esc(c) + "</td><td>" + (s.missing ? s.missing : "0") + "</td><td>" + s.unique + "</td><td>" + s.top.map(t => esc(t[0]) + " (" + t[1] + ")").join(", ") + "</td></tr>";
    }
    html += "</table>";
  }
  html += '<div class="fnote">Skew = right हो तो median report करें, mean नहीं। Outliers = IQR (1.5×) rule। यह computation आपके browser में हुआ है — नीचे funnel भी निकाल सकते हैं।</div>';
  const guess = guessEventCols(ds);
  if (guess){
    html += '<div class="fbox"><div class="flabel">🔻 Funnel निकालें (ordered steps, comma से अलग)</div><div class="frow">' +
      '<select id="fnUser">' + ds.cols.map(c => '<option' + (c===guess.user?' selected':'') + '>' + esc(c) + '</option>').join("") + "</select>" +
      '<select id="fnEvent">' + ds.cols.map(c => '<option' + (c===guess.event?' selected':'') + '>' + esc(c) + '</option>').join("") + "</select>" +
      '<input id="fnSteps" placeholder="steps, comma-separated — e.g. signup, onboarding, activation" value="' + esc(guess.suggested.join(", ")) + '">' +
      '<button class="fgo" id="fnGo">Calculate</button></div>' +
      '<div class="fnote" style="margin-top:7px">First select = user/id column, second = event column</div></div>';
  }
  const tg = guessTrendCols(ds);
  if (tg){
    html += '<div class="fbox" style="margin-top:10px"><div class="flabel">📈 Trend / time-series analysis (chart के साथ)</div><div class="frow">' +
      '<select id="tsDate">' + ds.cols.map(c => '<option' + (c===tg.date?' selected':'') + '>' + esc(c) + '</option>').join("") + "</select>" +
      '<select id="tsVal">' + tg.numC.map(c => '<option' + (c===tg.value?' selected':'') + '>' + esc(c) + '</option>').join("") + "</select>" +
      '<button class="fgo" id="tsGo">Analyze</button></div>' +
      '<div class="fnote" style="margin-top:7px">First select = date column (ISO dates), second = value column — get WoW, weekday baseline, anomalies and a chart</div></div>';
  }
  const sg = guessSegmentCols(ds);
  if (sg){
    html += '<div class="fbox" style="margin-top:10px"><div class="flabel">🧩 Segment analysis — किस segment ने क्या किया (bar chart के साथ)</div><div class="frow">' +
      '<select id="sgDim">' + ds.cols.map(c => '<option' + (c===sg.dim?' selected':'') + '>' + esc(c) + '</option>').join("") + "</select>" +
      '<select id="sgVal">' + sg.numC.map(c => '<option' + (c===sg.value?' selected':'') + '>' + esc(c) + '</option>').join("") + "</select>" +
      '<select id="sgAgg"><option>mean</option><option>median</option><option>sum</option><option>count</option></select>' +
      '<button class="fgo" id="sgGo">Analyze</button></div>' +
      '<div class="fnote" style="margin-top:7px">First select = segment/dimension column, second = value column, third = aggregation</div></div>';
  }
  html += "</div>";

  let text = "[Browser data analysis — file: " + ds.fileName + ", rows: " + ds.rows.length + ", columns: " + ds.cols.length + "]\n";
  for (const c of numCols){
    const s = p[c];
    text += "Numeric column '" + c + "': n=" + s.n + ", missing=" + s.missing + ", mean=" + fmt(s.mean) + ", median=" + fmt(s.med) +
            ", q1=" + fmt(s.q1) + ", q3=" + fmt(s.q3) + ", p90=" + fmt(s.p90) + ", min=" + fmt(s.min) + ", max=" + fmt(s.max) +
            ", stdev=" + fmt(s.stdev) + ", IQR-outliers=" + s.outliers + ", skew=" + s.skew + "\n";
  }
  for (const c of txtCols){
    const s = p[c];
    text += "Categorical column '" + c + "': n=" + s.n + ", missing=" + s.missing + ", unique=" + s.unique +
            ", top=" + s.top.map(t => t[0] + " (" + t[1] + ")").join("; ") + "\n";
  }
  return { html, text };
}

function guessTrendCols(ds){
  let dateC = null;
  for (const c of ds.cols){
    const s = ds.prof[c];
    if (s.type !== "txt") continue;
    const vals = ds.rows.slice(0, 80).map(r => r[c]).filter(v => v !== "");
    if (vals.length < 8) continue;
    const ok = vals.filter(v => /^\d{4}-\d{2}-\d{2}/.test(v)).length;
    if (ok / vals.length > 0.8){ dateC = c; break; }
  }
  if (!dateC) return null;
  const numC = ds.cols.filter(c => ds.prof[c].type === "num" && c !== dateC);
  if (!numC.length) return null;
  return { date: dateC, value: numC[0], numC };
}

function drawSpark(canvas, series, roll){
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600, h = canvas.clientHeight || 150;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const pad = { l: 8, r: 8, t: 16, b: 20 };
  const vs = series.map(p => p.v);
  let mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
  if (mx === mn) mx = mn + 1;
  const X = i => pad.l + (w - pad.l - pad.r) * (series.length === 1 ? 0.5 : i / (series.length - 1));
  const Y = v => pad.t + (h - pad.t - pad.b) * (1 - (v - mn) / (mx - mn));
  ctx.strokeStyle = "#e8eaed"; ctx.lineWidth = 1;
  for (let g = 0; g <= 2; g++){
    const y = pad.t + (h - pad.t - pad.b) * g / 2;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
  }
  ctx.strokeStyle = "#9b72cb"; ctx.setLineDash([4, 3]); ctx.beginPath();
  roll.forEach((v, i) => { i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)); });
  ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = "#1a73e8"; ctx.lineWidth = 2; ctx.beginPath();
  series.forEach((p, i) => { i ? ctx.lineTo(X(i), Y(p.v)) : ctx.moveTo(X(i), Y(p.v)); });
  ctx.stroke();
  ctx.fillStyle = "#d93025";
  series.forEach((p, i) => { if (p.anom !== undefined){ ctx.beginPath(); ctx.arc(X(i), Y(p.v), 3.5, 0, 6.283); ctx.fill(); } });
  ctx.fillStyle = "#5f6368"; ctx.font = "10px 'DM Sans', sans-serif";
  const lbl = (i, txt) => { ctx.textAlign = i === 0 ? "left" : (i === series.length - 1 ? "right" : "center"); ctx.fillText(txt, X(i), h - 6); };
  lbl(0, series[0].d);
  if (series.length > 2) lbl(Math.floor((series.length - 1) / 2), series[Math.floor((series.length - 1) / 2)].d);
  lbl(series.length - 1, series[series.length - 1].d);
  ctx.textAlign = "left";
  ctx.fillText(fmt(mx), pad.l + 2, 10);
  ctx.fillText(fmt(mn), pad.l + 2, h - pad.b - 4);
}

function computeTrend(card){
  const ds = dataState;
  if (!ds){ alert("पहले 📎 से CSV upload करें।"); return; }
  const root = card || document;
  const dateC = root.querySelector("#tsDate") ? root.querySelector("#tsDate").value : null;
  const valC = root.querySelector("#tsVal") ? root.querySelector("#tsVal").value : null;
  if (!dateC || !valC) return;
  const byDay = {};
  let bad = 0;
  ds.rows.forEach(r => {
    const d = String(r[dateC] || "").slice(0, 10);
    const v = r[valC];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)){ if (d) bad++; return; }
    if (v === "" || v === undefined || isNaN(Number(String(v).replace(/[,\s₹]/g, "")))){ bad++; return; }
    byDay[d] = Number(String(v).replace(/[,\s₹]/g, ""));
  });
  const days = Object.keys(byDay).sort();
  const n = days.length;
  if (n < 4){ alert("Date+value points काफ़ी नहीं मिले (ISO dates चाहिए, जैसे 2026-01-15)।"); return; }
  const series = days.map(d => ({ d, v: byDay[d] }));
  const wk = [[], [], [], [], [], [], []];
  const anomalies = [];
  series.forEach(p => {
    const dow = new Date(p.d + "T00:00:00Z").getUTCDay();
    const hist = wk[dow];
    if (hist.length){
      const base = hist.slice(-4).reduce((a, b) => a + b, 0) / Math.min(4, hist.length);
      p.base = base;
      if (base !== 0 && Math.abs((p.v - base) / base) > 0.2){
        p.anom = (p.v - base) / base;
        anomalies.push({ d: p.d, v: p.v, vs: p.anom });
      }
    }
    hist.push(p.v);
  });
  const last = series[n - 1], first = series[0];
  const prevKey = new Date(new Date(last.d + "T00:00:00Z").getTime() - 7 * 864e5).toISOString().slice(0, 10);
  const wow = (byDay[prevKey] !== undefined && byDay[prevKey] !== 0) ? (last.v - byDay[prevKey]) / byDay[prevKey] : null;
  const chg = first.v !== 0 ? (last.v - first.v) / first.v : null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  series.forEach((p, i) => { sx += i; sy += p.v; sxy += i * p.v; sxx += i * i; });
  const den = n * sxx - sx * sx;
  const slope = den !== 0 ? (n * sxy - sx * sy) / den : 0;
  const roll = series.map((_, i) => {
    const w = series.slice(Math.max(0, i - 3), i + 1).map(p => p.v).sort((a, b) => a - b);
    return w[Math.floor((w.length - 1) / 2)];
  });
  const pct = x => (x === null || x === undefined) ? "—" : ((x >= 0 ? "+" : "") + (x * 100).toFixed(1) + "%");
  const dir = slope > 0.0001 ? "up" : (slope < -0.0001 ? "down" : "flat");
  let html = '<div class="dhead">📈 Time Series — ' + esc(valC) + " by " + esc(dateC) + "</div><div class='dbody'>";
  html += '<canvas class="tschart"></canvas>';
  html += "<table><tr><th>What</th><th>Value</th></tr>";
  html += "<tr><td>Latest (" + last.d + ")</td><td>" + fmt(last.v) + "</td></tr>";
  html += "<tr><td>WoW (same weekday last week)</td><td>" + pct(wow) + "</td></tr>";
  html += "<tr><td>Trailing 4-week weekday mean</td><td>" + (last.base !== undefined ? fmt(last.base) : "—") + "</td></tr>";
  html += "<tr><td>Overall change (first → last)</td><td>" + pct(chg) + "</td></tr>";
  html += "<tr><td>Linear trend</td><td>" + dir + " (slope " + fmt(slope) + "/day)</td></tr>";
  html += "<tr><td>Anomalies (>20% vs weekday mean)</td><td>" + anomalies.length + "</td></tr></table>";
  if (anomalies.length){
    html += '<div class="fnote"><b>Anomaly days:</b><br>' + anomalies.slice(0, 10).map(a => esc(a.d) + ": " + fmt(a.v) + " (" + pct(a.vs) + " vs weekday mean)").join("<br>") + (anomalies.length > 10 ? " …" : "") + "</div>";
  }
  html += '<div class="fnote">नीली line = value · purple dashed = rolling median (spike vs level shift) · लाल dot = anomaly। यह computation browser में हुआ है।</div></div>';
  let text = "[Browser data analysis — time series on file " + ds.fileName + "; date column '" + dateC + "', value column '" + valC + "'; " + n + " daily points from " + first.d + " to " + last.d + "; skipped rows: " + bad + "]\n";
  text += "Latest (" + last.d + "): " + fmt(last.v) + ". WoW vs same weekday last week: " + pct(wow) + ".";
  if (last.base !== undefined) text += " Trailing 4-week same-weekday mean: " + fmt(last.base) + ".";
  text += "\nOverall change first→last: " + pct(chg) + " (" + fmt(first.v) + " → " + fmt(last.v) + "). Linear trend: " + dir + " (slope " + fmt(slope) + " per day).\n";
  text += "Rolling 7-point median: first " + fmt(roll[0]) + ", last " + fmt(roll[n-1]) + " (separates spike vs level shift).\n";
  if (anomalies.length){
    text += "Anomalies (>20% vs trailing 4-week same-weekday mean): " + anomalies.slice(0, 10).map(a => a.d + ": " + fmt(a.v) + " (" + pct(a.vs) + " vs mean)").join("; ") + (anomalies.length > 10 ? " …" : "") + "\n";
  }
  pushDataCard(ds, text);
  const tcard = document.createElement("div"); tcard.className = "datacard"; tcard.innerHTML = html;
  chatEl.append(tcard);
  drawSpark(tcard.querySelector("canvas"), series, roll);
  scrollDown();
}

function guessSegmentCols(ds){
  let dim = null;
  for (const c of ds.cols){
    const s = ds.prof[c];
    if (s.type !== "txt") continue;
    const sample = ds.rows.map(r => r[c]).find(v => v !== "");
    if (sample && /^\d{4}-\d{2}-\d{2}/.test(sample)) continue;
    if (s.unique >= 2 && s.unique <= 30 && s.unique < ds.rows.length * 0.5){ dim = c; break; }
  }
  if (!dim) return null;
  const numC = ds.cols.filter(c => ds.prof[c].type === "num");
  if (!numC.length) return null;
  return { dim, value: numC[0], numC };
}

function drawBars(canvas, labels, values){
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600;
  const rowH = 30, top = 8;
  const h = top + rowH * labels.length + 6;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const labelW = Math.min(150, w * 0.32);
  const maxV = Math.max.apply(null, values.map(Math.abs).concat([1]));
  labels.forEach((lab, i) => {
    const y = top + i * rowH;
    ctx.fillStyle = "#1f1f1f"; ctx.font = "11px 'DM Sans', sans-serif"; ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(lab.length > 18 ? lab.slice(0, 17) + "…" : lab, labelW - 8, y + rowH/2);
    const bw = Math.max(2, (w - labelW - 70) * Math.abs(values[i]) / maxV);
    ctx.fillStyle = "#1a73e8";
    ctx.beginPath();
    if (ctx.roundRect){ ctx.roundRect(labelW, y + 6, bw, rowH - 12, 5); ctx.fill(); }
    else ctx.fillRect(labelW, y + 6, bw, rowH - 12);
    ctx.fillStyle = "#5f6368"; ctx.textAlign = "left";
    ctx.fillText(fmt(values[i]), labelW + bw + 8, y + rowH/2);
  });
}

function computeSegments(card){
  const ds = dataState;
  if (!ds){ alert("पहले 📎 से CSV upload करें।"); return; }
  const root = card || document;
  const dimC = root.querySelector("#sgDim") ? root.querySelector("#sgDim").value : null;
  const valC = root.querySelector("#sgVal") ? root.querySelector("#sgVal").value : null;
  const agg = root.querySelector("#sgAgg") ? root.querySelector("#sgAgg").value : "mean";
  if (!dimC || !valC) return;
  const groups = {};
  ds.rows.forEach(r => {
    const k = r[dimC];
    if (k === "" || k === undefined) return;
    const v = r[valC];
    (groups[k] = groups[k] || []).push(v === "" || v === undefined ? null : Number(String(v).replace(/[,\s₹]/g, "")));
  });
  const keys = Object.keys(groups);
  if (!keys.length){ alert("Segment data नहीं मिला।"); return; }
  const stats = keys.map(k => {
    const vals = groups[k].filter(v => v !== null && !isNaN(v));
    const sorted = vals.slice().sort((a, b) => a - b);
    const sum = vals.reduce((a, b) => a + b, 0);
    return {
      seg: k, n: groups[k].length, numericN: vals.length,
      mean: vals.length ? sum / vals.length : null,
      median: sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null,
      sum: sum
    };
  });
  const aggVal = s => agg === "mean" ? s.mean : (agg === "median" ? s.median : (agg === "sum" ? s.sum : s.n));
  stats.sort((a, b) => (aggVal(b) || 0) - (aggVal(a) || 0));
  const top = stats.slice(0, 12);
  const total = stats.reduce((a, s) => a + (aggVal(s) || 0), 0);
  let html = '<div class="dhead">🧩 Segments — ' + esc(agg) + " of " + esc(agg === "count" ? "rows" : valC) + " by " + esc(dimC) + "</div><div class='dbody'>";
  html += '<canvas class="barchart"></canvas>';
  html += "<table><tr><th>Segment</th><th>n</th><th>" + (agg === "count" ? "count" : esc(valC) + " mean") + "</th><th>median</th><th>sum</th><th>share</th></tr>";
  top.forEach(s => {
    const av = aggVal(s);
    const share = total ? (av / total * 100) : 0;
    html += "<tr><td>" + esc(s.seg) + "</td><td>" + s.n + "</td><td>" + (s.mean === null ? "—" : fmt(s.mean)) + "</td><td>" + (s.median === null ? "—" : fmt(s.median)) + "</td><td>" + fmt(s.sum) + "</td><td>" + share.toFixed(1) + "%</td></tr>";
  });
  html += "</table>";
  html += '<div class="fnote">Segments ranked by ' + esc(agg) + ". यह computation browser में हुआ है — AI इन numbers पर बात करेगा।</div></div>";
  let text = "[Browser data analysis — segmentation on file " + ds.fileName + "; dimension '" + dimC + "', value '" + (agg === "count" ? "(count)" : valC) + "', aggregation: " + agg + "]\n";
  top.forEach((s, i) => {
    text += (i+1) + ". " + s.seg + ": n=" + s.n + ", mean=" + (s.mean === null ? "—" : fmt(s.mean)) + ", median=" + (s.median === null ? "—" : fmt(s.median)) + ", sum=" + fmt(s.sum) + ", share of total " + (total ? (aggVal(s)/total*100).toFixed(1) : "0") + "% of " + agg + "\n";
  });
  if (stats.length > 12) text += "(" + (stats.length - 12) + " more segments not shown)\n";
  pushDataCard(ds, text);
  const scard = document.createElement("div"); scard.className = "datacard"; scard.innerHTML = html;
  chatEl.append(scard);
  drawBars(scard.querySelector("canvas"), top.map(s => s.seg), top.map(s => aggVal(s) || 0));
  scrollDown();
}

function erf(x){
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

function abFormCard(){
  const html = '<div class="dhead">🧪 A/B Test — two-proportion z-test</div><div class="dbody"><div class="abrow">' +
    '<input id="abC" type="number" placeholder="Control successes (e.g. 120)">' +
    '<input id="abCn" type="number" placeholder="Control n (e.g. 1000)">' +
    '<input id="abT" type="number" placeholder="Treatment successes (e.g. 150)">' +
    '<input id="abTn" type="number" placeholder="Treatment n (e.g. 1000)">' +
    '<button class="fgo" id="abGo">Calculate</button></div>' +
    '<div class="fnote">Conversion-style A/B test: rates, lift, 95% Wald CI और p-value browser में ही निकलेगा।</div></div>';
  const card = document.createElement("div"); card.className = "datacard"; card.innerHTML = html;
  if (curHistory().length === 0) chatEl.innerHTML = "";
  chatEl.append(card);
  scrollDown();
}

function computeAB(card){
  const root = card || document;
  const c = Number(root.querySelector("#abC").value);
  const cn = Number(root.querySelector("#abCn").value);
  const t = Number(root.querySelector("#abT").value);
  const tn = Number(root.querySelector("#abTn").value);
  if (!(c >= 0 && t >= 0 && cn > 0 && tn > 0 && c <= cn && t <= tn)){ alert("सही numbers डालें: successes ≥ 0 और n से ज़्यादा नहीं।"); return; }
  const pc = c / cn, pt = t / tn;
  const pp = (c + t) / (cn + tn);
  const se = Math.sqrt(pp * (1 - pp) * (1 / cn + 1 / tn));
  let z = 0, pv = 1;
  if (se > 0){
    z = (pt - pc) / se;
    pv = 2 * (1 - 0.5 * (1 + erf(Math.abs(z) / Math.SQRT2)));
  }
  const absLift = pt - pc;
  const relLift = pc !== 0 ? (pt - pc) / pc : null;
  const seW = Math.sqrt(pc * (1 - pc) / cn + pt * (1 - pt) / tn);
  const Z95 = 1.959963984540054;
  const ci = [absLift - Z95 * seW, absLift + Z95 * seW];
  const sig = pv < 0.05;
  const pct = x => (x >= 0 ? "+" : "") + (x * 100).toFixed(2) + "%";
  let html = '<div class="dhead">🧪 A/B Test Result</div><div class="dbody"><table><tr><th>What</th><th>Value</th></tr>';
  html += "<tr><td>Control rate</td><td>" + (pc * 100).toFixed(2) + "% (" + c + "/" + cn + ")</td></tr>";
  html += "<tr><td>Treatment rate</td><td>" + (pt * 100).toFixed(2) + "% (" + t + "/" + tn + ")</td></tr>";
  html += "<tr><td>Absolute lift</td><td>" + pct(absLift) + "</td></tr>";
  html += "<tr><td>Relative lift</td><td>" + (relLift === null ? "—" : pct(relLift)) + "</td></tr>";
  html += "<tr><td>95% CI (diff)</td><td>[" + pct(ci[0]) + ", " + pct(ci[1]) + "]</td></tr>";
  html += "<tr><td>z-statistic</td><td>" + z.toFixed(3) + "</td></tr>";
  html += "<tr><td>p-value (two-sided)</td><td>" + pv.toFixed(4) + "</td></tr>";
  html += "<tr><td>Significant at α=0.05</td><td>" + (sig ? "हाँ ✅" : "नहीं ❌") + "</td></tr></table>";
  html += '<div class="fnote">Two-proportion z-test (pooled), Wald 95% CI। Browser में computed — AI इसी पर बात करेगा।</div></div>';
  let text = "[Browser data analysis — A/B two-proportion z-test: control " + c + "/" + cn + " (" + (pc*100).toFixed(2) + "%), treatment " + t + "/" + tn + " (" + (pt*100).toFixed(2) + "%). Absolute lift " + pct(absLift) + ", relative lift " + (relLift === null ? "—" : pct(relLift)) + ", Wald 95% CI on difference [" + pct(ci[0]) + ", " + pct(ci[1]) + "], z=" + z.toFixed(3) + ", two-sided p=" + pv.toFixed(4) + ", significant at 0.05: " + (sig ? "yes" : "no") + "]";
  pushDataCard(ds, text);
  const rcard = document.createElement("div"); rcard.className = "datacard"; rcard.innerHTML = html;
  chatEl.append(rcard);
  scrollDown();
}

function guessEventCols(ds){
  let user = null, event = null;
  for (const c of ds.cols){
    const s = ds.prof[c];
    if (s.type !== "txt") continue;
    const ratio = s.unique / Math.max(1, s.n);
    const uname = /^(user.?id|userid|user|customer.?id|uid|id)$/i.test(c);
    const ename = /^(event|event.?name|action|activity)$/i.test(c);
    if (uname) user = c;
    else if (ename) event = c;
    else if (ratio > 0.9 && !user) user = c;
    else if (ratio < 0.5 && s.unique <= 60 && !event) event = c;
  }
  if (!user || !event) return null;
  const counts = {};
  ds.rows.forEach(r => { const v = r[event]; if (v) counts[v] = (counts[v]||0)+1; });
  const suggested = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(e=>e[0]);
  return { user, event, suggested };
}

function computeFunnel(card){
  const ds = dataState;
  if (!ds){ alert("पहले 📎 से CSV upload करें।"); return; }
  const root = card || document;
  const userC = root.querySelector("#fnUser") ? root.querySelector("#fnUser").value : null;
  const evC = root.querySelector("#fnEvent") ? root.querySelector("#fnEvent").value : null;
  const stepsRaw = root.querySelector("#fnSteps") ? root.querySelector("#fnSteps").value : "";
  if (!userC || !evC) return;
  const steps = stepsRaw.split(",").map(s => s.trim()).filter(Boolean);
  if (steps.length < 2){ alert("कम से कम 2 steps लिखें।"); return; }
  const sets = {};
  ds.rows.forEach(r => {
    const u = r[userC], e = r[evC];
    if (u === "" || e === "") return;
    (sets[u] = sets[u] || []).push(e);
  });
  const pop = Object.keys(sets).length;
  let remaining = new Set(Object.keys(sets));
  const res = [];
  for (const st of steps){
    remaining = new Set([...remaining].filter(u => sets[u].includes(st)));
    res.push({ step: st, users: remaining.size });
  }
  let text = "[Browser data analysis — funnel on file " + ds.fileName + "; user column '" + userC + "', event column '" + evC + "']\n";
  text += "Population (unique users with events): " + pop + "\n";
  let html = '<div class="dhead">🔻 Funnel — ' + esc(steps.join(" → ")) + "</div><div class='dbody'>";
  let prev = pop;
  res.forEach((r, i) => {
    const cr = prev ? r.users/prev : 0;
    text += "Step " + (i+1) + " '" + r.step + "': " + r.users + " users, " + (cr*100).toFixed(1) + "% from previous (drop-off " + (prev - r.users) + ")\n";
    html += '<div class="fstep"><div class="fname">' + esc(r.step) + '</div><div class="fbar" style="width:' + Math.max(2, (pop ? r.users/pop*100 : 0)*2.4) + 'px"></div><div class="fmeta">' + r.users + " · " + (cr*100).toFixed(1) + "% · drop " + (prev - r.users) + "</div></div>";
    prev = r.users;
  });
  const overall = pop ? res[res.length-1].users/pop : 0;
  text += "Overall conversion: " + (overall*100).toFixed(1) + "%\n";
  html += '<div class="fnote">Overall conversion: <b>' + (overall*100).toFixed(1) + "%</b> · population " + pop + " users</div></div>";
  pushDataCard(ds, text);
  const fcard = document.createElement("div"); fcard.className = "datacard"; fcard.innerHTML = html;
  chatEl.append(fcard); scrollDown();
}

/* ---------------- ui wiring ---------------- */
sendEl.addEventListener("click", send);
$("#stop")?.addEventListener("click", () => stopActiveRequest());
inputEl.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); send(); } });
inputEl.addEventListener("input", () => { inputEl.style.height = "auto"; inputEl.style.height = Math.min(inputEl.scrollHeight, 130) + "px"; });
$("#attach").addEventListener("click", () => $("#fileInput").click());
function syncDeepBtn(){
  const b = $("#btnDeep");
  b.classList.toggle("on", !!settings.deepSearch);
  b.title = settings.deepSearch ? "Deep Search is ON — the AI will research the web before answering" : "Deep Search — research the web and live sources before answering";
}
$("#plusBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const m = $("#toolMenu"); if (m) m.classList.toggle("open");
});
$("#toolMenu").addEventListener("click", (e) => {
  if (e.target.closest(".mitem")) setTimeout(() => { const m = $("#toolMenu"); if (m) m.classList.remove("open"); }, 60);
});
document.addEventListener("click", (e) => {
  const m = $("#toolMenu"); if (!m || !m.classList.contains("open")) return;
  if (e.target.closest("#toolMenu") || e.target.closest("#plusBtn")) return;
  m.classList.remove("open");
});
/* Voice input — native browser recognition, with clear permission/error feedback. */
(function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const b = $("#micBtn"); if (!b || !SR) return;
  b.style.display = ""; b.hidden = false;
  const rec = new SR();
  rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;
  let on = false;
  function reset(){
    on = false; b.classList.remove("on"); b.setAttribute("aria-pressed", "false");
    b.title = "Speak your question"; b.setAttribute("aria-label", "Speak your question");
  }
  b.addEventListener("click", () => {
    if (on){ try { rec.stop(); } catch(e){ noteError(e, "speech stop"); reset(); } return; }
    rec.lang = speechLanguageFor(inputEl.value || "");
    try { rec.start(); }
    catch(e){ noteError(e, "speech start"); announce("Microphone could not start. Check browser permission and try again."); reset(); }
  });
  rec.onstart = () => {
    on = true; b.classList.add("on"); b.setAttribute("aria-pressed", "true");
    b.title = "Listening… tap to stop"; b.setAttribute("aria-label", "Stop listening");
    announce("Listening. Speak your question now.");
  };
  rec.onend = reset;
  rec.onerror = (event) => {
    const code = String(event && event.error || "");
    if (code === "not-allowed" || code === "service-not-allowed") announce("Microphone permission is blocked. Allow microphone access in your browser settings.");
    else if (code === "no-speech") announce("No speech was detected. Tap the microphone and try again.");
    else if (code === "audio-capture") announce("No microphone was found on this device.");
    else if (code !== "aborted") announce("Speech recognition failed. Please try again.");
    reset();
  };
  rec.onresult = (e) => {
    const t = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
    if (t){
      inputEl.value = (inputEl.value ? inputEl.value.replace(/\s+$/, "") + " " : "") + t.trim();
      inputEl.style.height = "auto"; inputEl.style.height = Math.min(inputEl.scrollHeight, 130) + "px";
      inputEl.focus(); announce("Voice input added to your message.");
    }
  };
})();
$("#btnMenu").addEventListener("click", () => {
  const sd = $("#side"); if (sd) sd.classList.toggle("open");
  const sc = $("#scrim"); if (sc) sc.classList.toggle("show", !!(sd && sd.classList.contains("open")));
});
$("#sideClose").addEventListener("click", closeDrawer);
$("#sideSearch").addEventListener("input", sideListRender);
$("#scrim").addEventListener("click", closeDrawer);
$("#sideNew").addEventListener("click", () => { closeDrawer(); $("#btnNew").click(); });
$("#sideSet")?.addEventListener("click", () => { closeDrawer(); $("#btnSet").click(); });
$("#btnDeep").addEventListener("click", () => {
  settings.deepSearch = !settings.deepSearch;
  saveAllSettings(); syncDeepBtn();
});
function syncLiveBtn(){
  const b = $("#btnLive"); if (!b) return;
  b.classList.toggle("on", !!settings.liveMode);
  b.title = settings.liveMode ? "Live is ON — every reply will include what is trending right now" : "Live — include what is trending right now (free, no key)";
}
$("#btnLive").addEventListener("click", () => {
  settings.liveMode = !settings.liveMode;
  saveAllSettings(); syncLiveBtn();
});
function syncImgBtn(){
  const b = $("#btnImg"); if (!b) return;
  b.classList.toggle("on", !!settings.imageMode);
  b.title = settings.imageMode ? "Image generation is ON — your next message will be drawn as a picture" : "Image generation — powered by Cloudflare Workers AI";
}
$("#btnImg").addEventListener("click", () => {
  settings.imageMode = !settings.imageMode;
  saveAllSettings(); syncImgBtn();
});
$("#abBtn").addEventListener("click", abFormCard);
$("#fileInput").addEventListener("change", e => {
  const fs = Array.from(e.target.files || []);
  if (fs.length) handleFiles(fs);
  e.target.value = "";
});
document.addEventListener("click", e => {
  if (e.target && e.target.id === "fnGo") computeFunnel(e.target.closest(".datacard"));
  if (e.target && e.target.id === "tsGo") computeTrend(e.target.closest(".datacard"));
  if (e.target && e.target.id === "sgGo") computeSegments(e.target.closest(".datacard"));
  if (e.target && e.target.id === "abGo") computeAB(e.target.closest(".datacard"));
});

$("#btnNew").addEventListener("click", () => {
  if (busy) return;
  const h = curHistory();
  if (h.length && !confirm("Start a new chat? The current conversation will be cleared.")) return;
  _histories[curSkill] = []; histSave(); dataState = null;
  if (settings.skill === "auto") curSkill = "assistant";
  updateHeader(); renderAll();
});

/* settings modal */
const overlay = $("#overlay");
function syncSettingsFields(){
  const cn = getConn();
  $("#inGKey").value = cn.gkey || ""; $("#inGCx").value = cn.gcx || ""; $("#inGhTok").value = cn.ghToken || "";
  const worker = $("#inWorkerUrl"), model = $("#inAiModel"), voice = $("#inVoiceLang");
  if (worker) worker.value = settings.workerUrl || "";
  if (model) model.value = settings.aiModel || "auto";
  if (voice) voice.value = settings.voiceLang || "auto";
}
$("#btnSet").addEventListener("click", () => { syncSettingsFields(); chatListRender(); overlay.classList.add("open"); });
$("#btnClose").addEventListener("click", () => overlay.classList.remove("open"));
overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("open"); });
$("#btnSave").addEventListener("click", () => {
  const _ib = $("#btnImg"); settings.imageMode = !!(_ib && _ib.classList.contains("on"));
  settings.workerUrl = $("#inWorkerUrl").value.trim().replace(/\/+$/, "");
  settings.aiModel = $("#inAiModel").value || "auto";
  settings.voiceLang = $("#inVoiceLang") ? $("#inVoiceLang").value : "auto";
  settings.connectors = {
    gkey: $("#inGKey").value.trim(), gcx: $("#inGCx").value.trim(),
    google: !!(($("#inGKey").value.trim()) && ($("#inGCx").value.trim())),
    web: true, stack: true, hn: true, books: true,
    github: true, weather: true, trends: true, ghToken: $("#inGhTok").value.trim()
  };
  settings.skill = "auto";
  saveAllSettings(); overlay.classList.remove("open"); updateEngineStatus();
});
$("#btnClear").addEventListener("click", () => {
  if (confirm("This permanently deletes this skill's entire conversation. Are you sure?")){
    _histories[curSkill] = []; histSave(); dataState = null; renderAll(); chatListRender(); overlay.classList.remove("open");
  }
});

/* ---------------- saved chats: list + delete ---------------- */
const titleKey = id => "amigo2_t_" + id;
function chatTitle(id){
  let t = "";
  try { t = localStorage.getItem(titleKey(id)) || ""; } catch(e){ noteError(e, "silent path"); }
  if (!t){
    const h = _histories[id] || [];
    const m = h.find(x => x && x.role === "user" && x.content);
    t = m ? String(m.content).replace(/\s+/g, " ").trim() : "";
    if (!t) t = (SKILLS[id] || {}).name || id;
  }
  return t.length > 36 ? t.slice(0, 36) + "\u2026" : t;
}

/* Thread-titling agent: reads the first message (and the reply), works out the core topic,
   and renames this chat to a concise 3-5 word title in the user's own language. */
async function autoTitle(id){
  try {
    if (localStorage.getItem(titleKey(id))) return;
    const h = _histories[id] || [];
    const first = h.find(x => x && x.role === "user" && x.content);
    if (!first || !workerConfigured()) return;
    const reply = h.find(x => x && x.role === "assistant" && x.content);
    const ask = "Create a concise 3–5 word chat title in the same language and script as the user's message. Return only the title.\n\nMessage: " + String(first.content).replace(/\s+/g, " ").slice(0, 500) + (reply ? "\nReply: " + String(reply.content).replace(/\s+/g, " ").slice(0, 220) : "");
    const result = await callAmigoAI([{ role: "user", content: ask }]);
    let t = String(result.reply || "").replace(/["'\u2018\u2019\u201c\u201d]/g, "").replace(/\s+/g, " ").trim();
    t = t.split(" ").slice(0, 6).join(" ").replace(/[.,;:]+$/, "");
    if (t){ localStorage.setItem(titleKey(id), t); sideListRender(); }
  } catch(e){ noteError(e, "silent path"); }
}
function skillChipHTML(){
  const sk = SKILLS[curSkill]; if (!sk) return "";
  return '<div class="skillchip"><span class="scicon">' + iconFor(sk.icon) + '</span><span>' +
    esc(sk.name || "") + "</span></div>";
}
function sideListRender(){
  const box = $("#sideList"); if (!box) return;
  const q = ($("#sideSearch") && $("#sideSearch").value || "").trim().toLowerCase();
  box.innerHTML = "";
  let ids = Object.keys(SKILLS).filter(id => (_histories[id] || []).length > 0);
  if (q) ids = ids.filter(id => chatTitle(id).toLowerCase().includes(q));
  if (!ids.length){
    box.innerHTML = '<div class="sEmpty">' + (q ? "No chats match that." : "No chats yet \u2014 start one below.") + '</div>';
    return;
  }
  ids.forEach(id => {
    const sk = SKILLS[id] || {};
    const row = document.createElement("button");
    row.type = "button";
    row.className = "srow" + (id === curSkill ? " on" : "");
    row.innerHTML = '<span class="si"><img class="triMark" alt="" src="' + AMIGO_BRAND_URI + '"></span><span class="sn">' + esc(chatTitle(id)) + '</span>';
    row.addEventListener("click", () => openChat(id));
    box.append(row);
  });
}
function closeDrawer(){
  const sd = $("#side"); if (sd) sd.classList.remove("open");
  const sc = $("#scrim"); if (sc) sc.classList.remove("show");
}
function openChat(id){
  if (!_histories[id]) return;
  curSkill = id; settings.skill = id; saveAllSettings();
  dataState = null; updateHeader(); renderAll(); chatListRender(); closeDrawer();
}
function chatListRender(){
  const box = $("#chatList"); if (!box) return;
  box.innerHTML = "";
  const ids = Object.keys(SKILLS).filter(id => (_histories[id] || []).length > 0);
  if (!ids.length){ box.innerHTML = '<div class="empty">No saved chats yet.</div>'; return; }
  ids.forEach(id => {
    const sk = SKILLS[id] || {}, n = (_histories[id] || []).length;
    const row = document.createElement("div"); row.className = "chatrow";
    const nm = document.createElement("div"); nm.className = "cn";
    nm.innerHTML = (sk.icon ? iconFor(sk.icon, 16) + " " : "") + (sk.name || id);
    const ct = document.createElement("div"); ct.className = "cc";
    ct.textContent = n + (n === 1 ? " msg" : " msgs");
    const del = document.createElement("button");
    del.className = "cdel"; del.title = "Delete this chat"; del.textContent = "🗑";
    del.addEventListener("click", () => deleteChat(id));
    row.append(nm, ct, del); box.append(row);
  });
  const all = document.createElement("button");
  all.className = "delall"; all.textContent = "Delete all chats";
  all.addEventListener("click", () => {
    if (!confirm("Delete ALL saved chats? This cannot be undone.")) return;
    Object.keys(SKILLS).forEach(id => {
      _histories[id] = [];
      try { localStorage.removeItem(hKey(id)); } catch(e){ noteError(e, "silent path"); }
    });
    dataState = null; renderAll(); chatListRender();
  });
  box.append(all);
  sideListRender();
}
function deleteChat(id){
  const sk = SKILLS[id] || {};
  if (!confirm('Delete the chat "' + (sk.name || id) + '"? This cannot be undone.')) return;
  _histories[id] = [];
  try { localStorage.removeItem(hKey(id)); } catch(e){ noteError(e, "silent path"); }
  if (id === curSkill){ dataState = null; renderAll(); }
  chatListRender();
}
$("#btnDel").addEventListener("click", () => {
  if (!curHistory().length) return;
  deleteChat(curSkill);
});

/* connection test — verifies the Worker and performs a small inference */
$("#btnTest").addEventListener("click", async () => {
  const out = $("#testOut");
  out.style.display = "block"; out.textContent = "Checking Cloudflare Worker…";
  try {
    const health = await workerRequest("/health");
    const result = await callAmigoAI([{ role: "user", content: "Reply with exactly: OK" }]);
    const lines = [
      "✅ Cloudflare Worker reachable",
      "Workers AI binding: " + (health.workersAI ? "available" : "not configured"),
      "OpenRouter secret: " + (health.openRouterConfigured ? "available" : "not configured"),
      "Image generation: " + (health.imageGeneration ? "available" : "not configured"),
      "✅ Test answer: " + result.reply.slice(0, 60),
      "Engine: " + engineLabel(result.provider, result.model)
    ];
    out.textContent = lines.join("\n"); updateEngineStatus();
  } catch(err){ out.textContent = "❌ " + (err && err.message ? err.message : "Worker test failed"); }
});

/* ---------------- init ---------------- */
(function init(){
  try {
    const _raw = localStorage.getItem("amigo2_settings");
    const s = JSON.parse(_raw || "null");
    if (s){
      // a secret saved by an older build is lifted into this session and then
      // removed from storage, so the device stops carrying it
      settings = Object.assign({}, DEFAULTS, withSecrets(s));
    }
  } catch(e){ noteError(e, "silent path"); }
  if (!SKILLS[settings.skill] && settings.skill !== "auto") settings.skill = "auto";
  settings.skill = "auto";
  if (!["auto", "@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/meta/llama-3.2-3b-instruct", "openrouter/free", "meta-llama/llama-3.3-70b-instruct:free"].includes(settings.aiModel)) settings.aiModel = "auto";
  // Remove legacy browser-side provider credentials; all model keys now belong in Cloudflare Secrets.
  ["apiKey", "apiKeys", "openrouterKey", "openRouterKey", "provider", "baseUrl", "model"].forEach(k => { try { delete settings[k]; } catch(e){ noteError(e, "silent path"); } });
  try { localStorage.setItem("amigo2_settings", JSON.stringify(stripSecrets(settings))); } catch(e){ noteError(e, "silent path"); }
  curSkill = "assistant";
  for (const id of Object.keys(SKILLS)) _histories[id] = histLoad(id);
  /* the synchronous local copy paints the page immediately; the database then
     becomes the source of truth, and the migration runs for each skill */
  for (const id of Object.keys(SKILLS)) {
    historyRefresh(id).then(() => { try { sideListRender(); } catch(e){ noteError(e, "silent path"); } });
  }
  /* one-time repair: write the de-duplicated history back so old repeats stay gone */
  for (const id of Object.keys(SKILLS)){
    try {
      const raw = JSON.parse(localStorage.getItem(hKey(id)) || "[]");
      const clean = dedupeHistory(raw);
      if (Array.isArray(raw) && clean.length !== raw.length) localStorage.setItem(hKey(id), JSON.stringify(clean));
    } catch(e){ noteError(e, "silent path"); }
  }
  /* One-time import of a very old chat store. It must never run twice: if it did,
     a chat the user had deleted would reappear on every visit. */
  if (!localStorage.getItem("amigo_migrated_v1")){
    try {
      if (_histories.assistant && _histories.assistant.length === 0){
        const old = JSON.parse(localStorage.getItem(hKey("amigo")) || localStorage.getItem("amigo_history") || "[]");
        if (Array.isArray(old) && old.length){
          _histories.assistant = dedupeHistory(old.filter(m => m && (m.role === "user" || m.role === "assistant") && m.content));
          histSave();
        }
      }
      localStorage.removeItem(hKey("amigo"));
      localStorage.removeItem("amigo_history");
      localStorage.setItem("amigo_migrated_v1", "1");
    } catch(e){ noteError(e, "silent path"); }
  }
  updateHeader();
  syncDeepBtn();
  syncImgBtn();
  syncLiveBtn();
  renderAttBar();
  sideListRender();
  const _bl = $("#brandLogo"); if (_bl) _bl.src = AMIGO_BRAND_URI;
  renderAll();
  updateEngineStatus();
  inputEl.focus();
})();