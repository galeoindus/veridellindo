/* Veridellindo — the Ask view.
 *
 * A question goes in; a source-backed answer comes out, laid out in the app's
 * own architecture rather than as a Wikipedia page:
 *
 *   .evidence     how the answer was ranked, and from how much
 *   .topic-block  the article broken up topic by topic, numbered, one sentence
 *                 per line — the Q&A shape — short by default with a control
 *                 that extends each one
 *   .factbox      the infobox, as label/value rows
 *   .src-group    the sources, as cards, with licences
 *   .method-note  exactly how the answer was produced
 *   .fb-*         emoji feedback
 *
 * Changing the answer depth or the meaning switch re-composes the answer in
 * place — the options act the moment they are clicked, with no second submit.
 */

import { el, clamp } from '../ui.js';
import { icon } from '../icons.js';
import { t } from '../i18n.js';
import { clean } from '../parse.js';
import { composeAnswer } from '../answer.js';
import { answerToMarkdown } from '../markdown.js';
import {
  evidenceStrip, pointsBlocks, methodNote, factsBox, sourcesGroup,
  scopeNote, feedback, markdownActions,
} from '../answerui.js';
import { sectionHead, card, errorBox, emptyState, toast } from '../components.js';
import { mountOpenSources } from './library.js';
import { composerForm, depthControl, attachSuggest } from '../composer.js';
import { requestAiAnswer, applyOrganisation } from '../answer-ai.js';
import { articleHref, searchHref } from '../router.js';
import { jumper, toggleContents } from './article.js';

export async function renderAsk(ctx, route) {
  const wrap = el('div', { class: 'wrap-narrow' });
  const question = (route.query.q || route.params.title || '').replace(/_/g, ' ').trim();

  wrap.append(el('span', { class: 'kicker', text: t('heroBadge') }));
  wrap.append(askHead(ctx, question));
  wrap.append(composerBlock(ctx, question));

  if (!question) {
    wrap.append(emptyState({
      iconName: 'ask', title: t('askQuestion'), body: t('askQuestionBlurb'),
      cta: t('explore'), ctaHref: '#/explore',
    }));
    return wrap;
  }

  const mount = el('div', { class: 'qa qa-wide' });
  wrap.append(mount);
  mount.append(el('div', { class: 'state', html: `<span class="spinner" aria-hidden="true"></span><p>${esc(t('loading'))}</p>` }));

  const state = {
    question,
    lang: route.query?.lang || ctx.state.contentLang,
    data: null,
    root: null,
    answer: null,
  };

  // The depth and meaning controls call this, so the open answer updates at once.
  ctx.optionsChanged = () => { if (state.data) paint(ctx, mount, state); };
  ctx.toggleToc = () => toggleContents(mount);
  ctx.onCleanup(() => { ctx.optionsChanged = () => {}; ctx.toggleToc = null; });

  load(ctx, mount, state);
  return wrap;
}

function askHead(ctx, question) {
  const head = el('div', { class: 'ask-head' });
  const qa = el('div', { class: 'qa-q' });
  qa.append(el('span', { class: 'qa-label', text: t('ask') }));
  qa.append(el('h1', { class: 'qa-question', text: question || t('askQuestion') }));
  const alt = el('p', { class: 'qa-alt' });
  alt.append(el('a', { href: searchHref(question, { lang: ctx.state.contentLang }), text: `${t('searchMode')}: ${question}` }));
  qa.append(alt);
  head.append(qa);
  return head;
}

function composerBlock(ctx, question) {
  const composer = el('div', { class: 'composer', style: 'margin:0 0 22px' });
  const form = composerForm(ctx, { placeholderKey: 'askPlaceholder', autofocus: !question, initialMode: 'ask', labelled: true });
  composer.append(form);
  composer.append(el('p', { class: 'voice-status', role: 'status', 'aria-live': 'polite' }));
  attachSuggest(form.querySelector('textarea'), ctx);
  if (question) form.querySelector('textarea').value = question;
  composer.append(depthControl(ctx));
  return composer;
}

/* ------------------------------------------------------------------ load */

async function load(ctx, mount, state, retry = 0) {
  try {
    const title = await ctx.api.resolveTitle(state.lang, state.question);
    if (!title) {
      mount.innerHTML = '';
      mount.append(emptyState({
        iconName: 'search', title: t('noResults'), body: t('askQuestionBlurb'),
        cta: t('searchMode'), ctaHref: searchHref(state.question, { lang: state.lang }),
      }));
      return;
    }
    state.data = await ctx.api.article(state.lang, title);
    state.title = state.data.title;
    state.wikiUrl = `https://${state.lang}.wikipedia.org/wiki/${encodeURIComponent(state.data.title.replace(/ /g, '_'))}`;
    state.root = clean(state.data.html);
    paint(ctx, mount, state);
    ctx.pushHistory({
      id: `ask:${state.lang}:${state.data.title}`, kind: 'ask',
      title: state.data.title, question: state.question, lang: state.lang,
      url: articleHref(state.data.title, state.lang),
    });
  } catch (err) {
    mount.innerHTML = '';
    const message = err?.status === 404 ? t('notFoundBody') : err?.message;
    mount.append(errorBox(message, { onRetry: () => load(ctx, mount, state, retry + 1), query: state.question, searchHref: searchHref(state.question) }));
    if (err?.name === 'ApiError' && err.status !== 404 && retry === 0) {
      setTimeout(() => load(ctx, mount, state, 1), 600);
    }
  }
}

/* ---------------------------------------------------------------- paint */

/* Ranking by meaning is asynchronous, so two paints can be in flight at once —
 * ask a second question while the first is still ranking and the slower answer
 * would land last, overwriting the newer one. Each paint takes a generation
 * number and refuses to draw if a newer paint has started since. */
let paintGeneration = 0;

async function paint(ctx, mount, state) {
  const generation = ++paintGeneration;
  mount.innerHTML = '';
  mount.append(el('div', { class: 'state', html: `<span class="spinner" aria-hidden="true"></span><p>${esc(t('loading'))}</p>` }));

  let answer;
  try {
    answer = await composeAnswer({
      question: state.question,
      root: state.root,
      sections: state.data.sections,
      depth: ctx.state.depth,
      deep: ctx.state.deepRank,
      lang: state.lang,
      title: state.data.title,
      mode: 'ask',
    });
  } catch (err) {
    mount.innerHTML = '';
    mount.append(errorBox(err, { query: state.question, searchHref: searchHref(state.question) }));
    return;
  }
  if (generation !== paintGeneration) return;   // a newer paint already started
  answer.wikiUrl = state.wikiUrl;
  answer.revid = state.data.revid;
  state.answer = answer;

  mount.innerHTML = '';

  // Contents and actions live in the rail beside the answer; the answer itself
  // is the reading column. Same shape as the article view, because the reader
  // asked for one architecture across the whole site.
  // One clean row of controls, the contents panel at the top, and the answer
  // full width — the same shape as the article view.
  const row = el('div', { class: 'art-actions' });
  row.append(...articleActions(ctx, answer).children);
  mount.append(row);
  const toc = el('div', { class: 'toc-top', id: 'tocTop-topic', hidden: true });
  toc.append(jumper(state, answer, 'topic'));
  mount.append(toc);
  const content = el('div', { class: 'panel panel-wide' });
  mount.append(content);

  content.append(evidenceStrip({
    matched: answer.rankedCount,
    considered: answer.method.sentencesConsidered,
    sections: answer.method.sectionsRead,
    title: answer.title,
    deep: ctx.state.deepRank,
  }));

  // The topic-wise breakdown: short by default, extended at deep-dive depth.
  // The article in the Q&A shape — one sentence per line, under the question
  // that section answers. The question and the line order come from Workers AI
  // when the deployment has the binding (see answer-ai.js); without it the
  // page's own ranking stands, and the reader sees the same layout either way.
  const topicsHost = el('div', { class: 'topic-host' });
  if (answer.topics.length) {
    topicsHost.append(pointsBlocks(answer.topics, { idPrefix: 'topic' }));
    content.append(topicsHost);
  }

  // Facts.
  const facts = factsBox(answer.facts, answer.title);
  if (facts) content.append(facts);

  /* Sources, in the answer column — part 6 of the answer architecture.
     They used to be reachable only from an action in the rail, so the page that
     claims "every answer with its source" was the one page where the source was
     not on the page. The group states plainly what was read and what was only
     linked, and it carries the licence and the revision the answer came from. */
  content.append(sourcesGroup({
    lang: state.lang,
    title: answer.title,
    wikiUrl: answer.wikiUrl,
    citations: state.root?.citations || [],
    project: 'wikipedia',
    revision: state.data?.revid ? { revid: state.data.revid } : null,
  }));

  // How it was made, and what it does not claim. The numbered Wikipedia
  // reference list is deliberately not repeated here — it belongs to the full
  // article, not to the breakdown.
  content.append(methodNote(answer.method, { revid: answer.revid, lang: state.lang, title: answer.title, wikiUrl: answer.wikiUrl }));
  content.append(scopeNote(t('scopeAnswer')));
  content.append(feedback(ctx, `ask:${state.lang}:${answer.title}`));

  /* Progressive, never blocking: the answer is on screen before this is sent,
     and a slow, missing or refused model simply leaves the page as it is. */
  if (answer.topics.length) {
    requestAiAnswer({
      question: state.question,
      title: answer.title,
      lang: state.lang,
      sections: answer.topics,
    }).then((organised) => {
      if (!organised || generation !== paintGeneration) return;
      topicsHost.replaceChildren(pointsBlocks(applyOrganisation(answer.topics, organised), { idPrefix: 'topic' }));
    }).catch(() => { /* the deterministic ranking already stands */ });
  }

  loadRelated(ctx, mount, { title: answer.title, lang: state.lang });
}

/* -------------------------------------------------------------- actions */

function articleActions(ctx, answer) {
  const actions = el('div', { class: 'article-actions' });
  const id = `ask:${answer.lang}:${answer.title}`;

  const saveBtn = el('button', {
    type: 'button', class: `btn btn-ghost${ctx.isBookmarked(id) ? ' is-on' : ''}`,
    html: `${icon('bookmark')}<span>${esc(ctx.isBookmarked(id) ? t('savedOnDevice') : t('bookmarks'))}</span>`,
  });
  saveBtn.addEventListener('click', () => {
    const saved = ctx.toggleBookmark({
      id, title: answer.title, question: answer.question, lang: answer.lang,
      url: articleHref(answer.title, answer.lang), extract: clamp(answer.leadText, 160),
    });
    saveBtn.innerHTML = `${icon('bookmark')}<span>${esc(saved ? t('saved') : t('bookmarks'))}</span>`;
    saveBtn.classList.toggle('is-on', saved);
    toast(saved ? t('savedOnDevice') : t('removedFromSaved'));
  });
  actions.append(saveBtn);

  actions.append(markdownActions({
    getText: () => answerToMarkdown(answer, { url: answer.wikiUrl }),
    filename: answer.title,
  }));

  const shareBtn = el('button', { type: 'button', class: 'btn btn-ghost', html: `${icon('share')}<span>${esc(t('share'))}</span>` });
  shareBtn.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#/article/${encodeURIComponent(answer.title.replace(/ /g, '_'))}`;
    if (navigator.share) { try { await navigator.share({ title: answer.title, url }); } catch { /* cancelled */ } }
    else { try { await navigator.clipboard.writeText(url); toast(t('linkCopied')); } catch { /* ignore */ } }
  });
  actions.append(shareBtn);

  actions.append(el('a', {
    class: 'btn btn-ghost', href: articleHref(answer.title, answer.lang),
    html: `${icon('book')}<span>${esc(t('readArticle'))}</span>`,
  }));
  return actions;
}

async function loadRelated(ctx, mount, { title, lang }) {
  try {
    const related = await ctx.api.related(lang, title);
    if (!related.length) return;
    const section = el('section', { class: 'sec' });
    section.append(sectionHead({ title: t('related'), more: searchHref(title, { lang }) }));
    const grid = el('div', { class: 'grid' });
    related.slice(0, 6).forEach((page) => grid.append(card(page, { lang })));
    section.append(grid);
    mount.append(section);
  } catch { /* related is a bonus */ }
  // The source cards are a bonus too: a failure here must not reject the
  // promise chain that rendered the answer.
  try { mountOpenSources(ctx, mount, title); } catch { /* no sources block */ }
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
