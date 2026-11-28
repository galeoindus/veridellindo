/* In-page anchors are not routes.
 *
 * Every citation marker in an article is `<a href="#ref-3">`, and Wikipedia
 * body text also carries section links like `<a href="#Design">`. The router
 * owns `location.hash`, so a click on one of those replaced the current route
 * with a fragment that matches no route in ROUTES — and `parse()` answered
 * `notfound`. Every [1] in every article sent the reader to the not-found
 * view, which is the one thing a site built on "click the source" cannot do.
 *
 * These tests fail if the click handler stops intercepting them.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
  `<!doctype html><html><body>
     <p>Ashoka was crowned in 269 BCE<sup class="cite"><a id="marker" href="#ref-3">[3]</a></sup>.</p>
     <p><a id="section" href="#Design">Design</a></p>
     <p><a id="route" href="#/article/Chess">Chess</a></p>
     <ol><li id="ref-3">Thapar, Romila. <i>Aśoka and the Decline of the Mauryas</i>.</li></ol>
   </body></html>`,
  { url: 'https://veridellindo.pages.dev/#/article/Ashoka' },
);

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
// jsdom has no layout, so it ships no scrollIntoView.
dom.window.Element.prototype.scrollIntoView = function scrollIntoView() {};

const { parse, initLinkBehaviour } = await import('../assets/js/router.js');
const { routeHref } = await import('../assets/js/parse.js');

initLinkBehaviour({ prefetch: null });

const click = (id) => {
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  document.getElementById(id).dispatchEvent(event);
  return event;
};

test('a citation fragment is not a route', () => {
  assert.equal(parse('#ref-3').name, 'notfound', 'the router itself cannot route a fragment');
  assert.deepEqual(routeHref('#ref-3'), { internal: true, href: '#ref-3' });
});

test('clicking a citation marker keeps the route and does not navigate', () => {
  const before = window.location.hash;
  const event = click('marker');
  assert.equal(event.defaultPrevented, true, 'the browser default would replace the route with #ref-3');
  assert.equal(window.location.hash, before, 'the reader must stay on the article');
});

test('a citation click lands focus on the reference it points at', () => {
  click('marker');
  assert.equal(document.activeElement?.id, 'ref-3');
});

test('an in-page section link with no matching element is swallowed, not routed', () => {
  const before = window.location.hash;
  const event = click('section');
  assert.equal(event.defaultPrevented, true, 'a missing anchor must not become a 404');
  assert.equal(window.location.hash, before);
});

test('a real in-app link still navigates', () => {
  const event = click('route');
  assert.equal(event.defaultPrevented, false, 'the router must not swallow its own links');
});
