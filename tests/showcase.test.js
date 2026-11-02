import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { boundedIndex, processCards, showcaseMarkup } from '../src/showcase.js';

test('carousel navigation stays inside the six-slide series', () => {
  assert.equal(boundedIndex(-1, 6), 0);
  assert.equal(boundedIndex(0, 6), 0);
  assert.equal(boundedIndex(3, 6), 3);
  assert.equal(boundedIndex(6, 6), 5);
  assert.equal(boundedIndex(1, 1), 0);
});

test('each story links to the real viewer and decorative scenes are hidden from assistive technology', () => {
  const html = processCards();
  assert.equal((html.match(/href="#scan-viewer"/g) || []).length, 3);
  assert.equal((html.match(/class="story-art [^"]+" aria-hidden="true"/g) || []).length, 3);
  assert.match(html, /Примите решение/);
});

test('carousel references six real local PNGs with reserved dimensions', async () => {
  const html = showcaseMarkup();
  const images = [...html.matchAll(/src="(\/showcase\/[^\"]+\.png)"/g)];
  assert.equal(images.length, 6);
  for (const [, path] of images) {
    const buffer = await readFile(new URL(`../public${path}`, import.meta.url));
    assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
  }
  assert.equal((html.match(/width="256" height="256" loading="lazy"/g) || []).length, 6);
  assert.match(html, /Демонстрационный объём · условная разметка/);
});

test('production background excludes the expensive masked grid and animated full-page rings', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.doesNotMatch(main + css, /ambient-grid|ambient-orbit|mask-image/);
  assert.match(main, /class="ambient" aria-hidden="true"><\/div>/);
});
