import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { caseAssumptions, calculateHours } from '../src/calculator.js';
import { impactData, impactMarkup, mountImpact } from '../src/impact.js';

test('impact model exposes case assumptions and consistent daily and monthly totals', () => {
  assert.deepEqual(caseAssumptions, { minutesPerStudy: 10, savingRate: 0.4, workdays: 22 });
  assert.deepEqual(impactData, { studies: 60, manualMinutes: 600, assistedMinutes: 360, savedMinutes: 240, monthlyHours: 88 });
  assert.equal(impactData.manualMinutes - impactData.assistedMinutes, impactData.savedMinutes);
  assert.equal(impactData.savedMinutes * caseAssumptions.workdays / 60, calculateHours(impactData.studies));
});

test('impact chart has accessible static totals, linear cumulative paths and a single real CTA', () => {
  const markup = impactMarkup('');
  assert.doesNotMatch(markup, /<p\b[^>]*class="impact-number"[^>]*aria-label=/);
  assert.match(markup, /<p class="impact-number"><span data-impact-count aria-hidden="true">88<\/span><span class="sr-only">88 часов<\/span><span aria-hidden="true">часов<\/span><\/p>/);
  assert.match(markup, /role="img" aria-labelledby="impact-chart-title impact-chart-desc"/);
  assert.match(markup, /60 исследований: без ассистента 600 минут, с ассистентом 360 минут/);
  assert.match(markup, /240 минут в день, или 88 часов за 22 рабочих дня/);
  assert.match(markup, /не клинический результат и не прогноз/);
  assert.match(markup, /pathLength="1" d="M80 310L800 30"/);
  assert.match(markup, /pathLength="1" d="M80 310L800 142"/);
  for (const tick of [0, 15, 30, 45, 60]) assert.ok(markup.includes(`<span>${tick}</span>`));
  assert.equal((markup.match(/href="#demo"/g) || []).length, 1);
  assert.doesNotMatch(markup, /<input|data-segment|type="range"/);
  assert.equal((markup.match(/class="impact-scenario"/g) || []).length, 2);
  assert.match(markup, /4 часа в день × 22 рабочих дня = 88 часов/);
});

test('reduced motion leaves final static number and does not observe or schedule animation', () => {
  const previous = globalThis.window;
  const count = { textContent: '88' };
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  try {
    mountImpact({ querySelector: () => count, querySelectorAll: () => [] });
    assert.equal(count.textContent, '88');
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('graph highlights hover and focus, supports persistent touch selection and Escape', () => {
  const previous = globalThis.window;
  const buttons = ['manual', 'assisted'].map(scenario => ({
    dataset: { scenario }, events: {},
    addEventListener(name, callback) { this.events[name] = callback; },
    setAttribute(name, value) { this[name] = value; },
  }));
  const root = {
    dataset: {},
    querySelector: () => ({ textContent: '88' }),
    querySelectorAll: selector => selector === '[data-scenario]' ? buttons : [],
  };
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  try {
    mountImpact(root);
    buttons[0].events.pointerenter({ pointerType: 'mouse' });
    assert.equal(root.dataset.highlight, 'manual');
    assert.equal(buttons[1]['aria-pressed'], 'false');
    buttons[0].events.pointerleave();
    assert.equal(root.dataset.highlight, '');
    buttons[1].events.click();
    buttons[1].events.pointerleave();
    assert.equal(root.dataset.highlight, 'assisted');
    assert.equal(buttons[1]['aria-pressed'], 'true');
    buttons[0].events.focus();
    assert.equal(root.dataset.highlight, 'manual');
    buttons[0].events.blur();
    assert.equal(root.dataset.highlight, 'assisted');
    buttons[1].events.keydown({ key: 'Escape' });
    assert.equal(root.dataset.highlight, '');
    buttons[0].events.pointerenter({ pointerType: 'touch' });
    assert.equal(root.dataset.highlight, '');
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('chart waits for viewport entry, counts once and settles at both exact endpoints', () => {
  const keys = ['window', 'IntersectionObserver', 'requestAnimationFrame'];
  const previous = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const classes = new Set();
  const count = { textContent: '88' };
  const figure = {};
  const dots = ['manual', 'assisted'].map(kind => ({
    dataset: { impactDot: kind },
    setAttribute(name, value) { this[name] = value; },
  }));
  let intersect, tick, observed, disconnected = false, scheduled = 0;
  class Observer {
    constructor(callback) { intersect = callback; }
    observe(target) { observed = target; }
    disconnect() { disconnected = true; }
  }
  globalThis.window = { matchMedia: () => ({ matches: false, addEventListener() {} }), IntersectionObserver: Observer };
  globalThis.IntersectionObserver = Observer;
  globalThis.requestAnimationFrame = callback => { tick = callback; return ++scheduled; };
  const root = {
    querySelector: selector => selector === '.impact-figure' ? figure : count,
    querySelectorAll: selector => selector === '[data-scenario]' ? [] : dots,
    classList: {
      add: name => classes.add(name),
      replace(from, to) { classes.delete(from); classes.add(to); },
    },
  };
  try {
    mountImpact(root);
    assert.equal(observed, figure);
    assert.equal(scheduled, 0);
    assert.equal(count.textContent, '1');
    intersect([{ isIntersecting: false }]);
    assert.equal(scheduled, 0);
    intersect([{ isIntersecting: true }]);
    assert.equal(disconnected, true);
    assert.equal(classes.has('impact-running'), true);
    tick(performance.now() + 2000);
    assert.equal(scheduled, 1);
    assert.equal(count.textContent, '88');
    assert.equal(classes.has('impact-complete'), true);
    assert.deepEqual(dots.map(({ cx, cy }) => [cx, cy]), [['800', '30'], ['800', '142']]);
  } finally {
    keys.forEach((key, index) => {
      if (previous[index]) Object.defineProperty(globalThis, key, previous[index]);
      else delete globalThis[key];
    });
  }
});

test('old segment and slider hub handlers are removed and showcase integration remains', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /data-segment|#scans|#hours|segmentCopy|calculator-formula/);
  assert.match(main, /import '\.\/style\.css';\s*import '\.\/showcase-effects\.css';/);
  assert.match(main, /mountImpact\(document\.querySelector\('#clinics'\)\)/);
});
