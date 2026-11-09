import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { caseAssumptions, calculateHours } from '../src/calculator.js';
import { impactData, impactMarkup, mountImpact } from '../src/impact.js';

function harness(t, reduced = false) {
  const keys = ['window', 'IntersectionObserver', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const previous = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  t.after(() => keys.forEach((key, index) => {
    if (previous[index]) Object.defineProperty(globalThis, key, previous[index]);
    else delete globalThis[key];
  }));
  const frames = new Map();
  let id = 0;
  let intersection;
  let motionChange;
  let observed;
  const motion = { matches: reduced, addEventListener(_, callback) { motionChange = callback; } };
  class Observer {
    constructor(callback) { intersection = callback; }
    observe(target) { observed = target; }
    disconnect() {}
  }
  globalThis.window = { matchMedia: () => motion, IntersectionObserver: Observer };
  globalThis.IntersectionObserver = Observer;
  globalThis.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  globalThis.cancelAnimationFrame = frame => frames.delete(frame);
  const controls = ['manual', 'assisted'].map(scenario => ({
    dataset: { scenario }, events: {},
    addEventListener(name, callback) { this.events[name] = callback; },
    setAttribute(name, value) { this[name] = value; },
  }));
  const dots = ['manual', 'assisted'].map(kind => ({
    dataset: { impactDot: kind }, setAttribute(name, value) { this[name] = value; },
  }));
  const nodes = Object.fromEntries(['value', 'scenario', 'detail', 'accessible'].map(key => [`[data-impact-${key}]`, { textContent: key === 'value' ? '360' : '' }]));
  const figure = {};
  const classes = new Set();
  const root = {
    dataset: { highlight: 'assisted' },
    querySelector: selector => selector === '.impact-figure' ? figure : nodes[selector],
    querySelectorAll: selector => selector === '[data-scenario]' ? controls : dots,
    classList: { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)) },
  };
  mountImpact(root);
  return {
    root, controls, dots, classes, frames, figure,
    value: nodes['[data-impact-value]'],
    label: nodes['[data-impact-scenario]'],
    get observed() { return observed; },
    intersect: entries => intersection(entries),
    reduce() { motion.matches = true; motionChange({ matches: true }); },
    flush(time = performance.now() + 1000) {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(time));
    },
  };
}

test('impact model has consistent case arithmetic', () => {
  assert.deepEqual(caseAssumptions, { minutesPerStudy: 10, savingRate: .4, workdays: 22 });
  assert.deepEqual(impactData, { studies: 60, manualMinutes: 600, assistedMinutes: 360, savedMinutes: 240, monthlyHours: 88 });
  assert.equal(impactData.manualMinutes - impactData.assistedMinutes, impactData.savedMinutes);
  assert.equal(impactData.savedMinutes * 22 / 60, calculateHours(60));
});

test('chart exposes both lines and labels as controls, with one numeric readout and no scenario tiles', () => {
  const html = impactMarkup('');
  assert.match(html, /role="group" aria-labelledby="impact-chart-title impact-chart-desc"/);
  assert.equal((html.match(/class="impact-hit"/g) || []).length, 2);
  assert.equal((html.match(/data-scenario=/g) || []).length, 4);
  assert.equal((html.match(/data-impact-value>/g) || []).length, 1);
  assert.equal((html.match(/role="button"/g) || []).length, 2);
  assert.match(html, /class="impact-line-label impact-label-manual"/);
  assert.match(html, /class="impact-line-label impact-label-assisted"/);
  assert.match(html, /pathLength="1" d="M80 310L800 30"/);
  assert.match(html, /pathLength="1" d="M80 310L800 142"/);
  assert.match(html, /600 минут, с ассистентом 360 минут/);
  assert.match(html, /88 часов за 22 рабочих дня/);
  assert.doesNotMatch(html, /impact-scenarios|impact-scenario"|data-impact-count|<input|data-segment/);
  assert.equal((html.match(/href="#demo"/g) || []).length, 1);
});

test('hover and focus select the line and interpolate one readout; rapid reselection cancels old animation', t => {
  const h = harness(t);
  h.controls[0].events.pointerenter({ pointerType: 'mouse' });
  assert.equal(h.root.dataset.highlight, 'manual');
  assert.equal(h.controls[0]['aria-pressed'], 'true');
  assert.equal(h.label.textContent, 'Без NeuroScan');
  assert.equal(h.value.textContent, '360');
  h.flush(performance.now() + 100);
  assert(Number(h.value.textContent) > 360 && Number(h.value.textContent) < 600);
  h.controls[1].events.focus();
  assert.equal(h.frames.size, 1);
  h.flush();
  assert.equal(h.value.textContent, '360');
  assert.equal(h.frames.size, 0);
  h.controls[0].events.keydown({ key: 'Enter', preventDefault() {} });
  h.flush();
  assert.equal(h.value.textContent, '600');
});

test('touch selects on click, not on pointerenter, and reduced motion switches immediately', t => {
  const h = harness(t, true);
  h.controls[0].events.pointerenter({ pointerType: 'touch' });
  assert.equal(h.value.textContent, '360');
  h.controls[0].events.click();
  assert.equal(h.value.textContent, '600');
  assert.equal(h.frames.size, 0);
  h.controls[1].events.keydown({ key: ' ', preventDefault() {} });
  assert.equal(h.value.textContent, '360');
});

test('intro waits for visibility and settles both paths without changing the selected readout', t => {
  const h = harness(t);
  assert.equal(h.observed, h.figure);
  assert.equal(h.frames.size, 0);
  h.intersect([{ isIntersecting: false }]);
  assert.equal(h.frames.size, 0);
  h.intersect([{ isIntersecting: true }]);
  assert.equal(h.classes.has('impact-running'), true);
  h.flush(performance.now() + 1500);
  assert.equal(h.classes.has('impact-complete'), true);
  assert.equal(h.value.textContent, '360');
  assert.deepEqual(h.dots.map(({ cx, cy }) => [cx, cy]), [['800', '30'], ['800', '142']]);
});

test('enabling reduced motion cancels in-flight number animation and settles the exact selected value', t => {
  const h = harness(t);
  h.controls[0].events.click();
  assert.equal(h.frames.size, 1);
  h.reduce();
  assert.equal(h.frames.size, 0);
  assert.equal(h.value.textContent, '600');
});

test('hub integration keeps local form handling and no old sliders', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /data-segment|#scans|#hours|segmentCopy|calculator-formula/);
  assert.match(main, /mountImpact\(document.querySelector\('#clinics'\)\)/);
});
