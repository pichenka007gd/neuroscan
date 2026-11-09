import test from 'node:test';
import assert from 'node:assert/strict';
import { mountSpotlight } from '../src/spotlight.js';

test('cursor glow coalesces pointer events, stays behind content and stops on leave or preference change', t => {
  const keys = ['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const previous = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  t.after(() => keys.forEach((key, index) => {
    if (previous[index]) Object.defineProperty(globalThis, key, previous[index]);
    else delete globalThis[key];
  }));
  const events = {};
  let changed;
  let callback;
  let scheduled = 0;
  let cancelled = 0;
  const media = { matches: true, addEventListener(_, fn) { changed = fn; } };
  globalThis.window = { matchMedia: () => media, addEventListener() {} };
  globalThis.document = { addEventListener(name, fn) { events[name] = fn; } };
  globalThis.requestAnimationFrame = fn => { callback = fn; return ++scheduled; };
  globalThis.cancelAnimationFrame = () => cancelled++;
  const glow = { style: {} };
  mountSpotlight(glow);
  events.pointermove({ pointerType: 'touch', clientX: 1, clientY: 2 });
  assert.equal(scheduled, 0);
  events.pointermove({ pointerType: 'mouse', clientX: 200, clientY: 200 });
  events.pointermove({ pointerType: 'mouse', clientX: 400, clientY: 300 });
  assert.equal(scheduled, 1);
  callback();
  assert.equal(glow.style.transform, 'translate3d(240px, 140px, 0)');
  assert.equal(glow.style.opacity, '1');
  events.pointerleave();
  assert.equal(glow.style.opacity, '0');
  assert.equal(cancelled, 1);
  media.matches = false;
  changed();
  events.pointermove({ pointerType: 'mouse', clientX: 100, clientY: 100 });
  assert.equal(scheduled, 1);
});
