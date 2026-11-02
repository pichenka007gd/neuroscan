import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mountShowcase, processCards, showcaseMarkup, ringSlices } from '../src/showcase.js';

test('ring places 32 images at unique rigid ring positions without slider controls', () => {
  const html = showcaseMarkup();
  assert.deepEqual([...html.matchAll(/--angle: ([\d.]+)deg/g)].map(match => Number(match[1])), ringSlices.map((_, index) => index * 11.25));
  assert.match(html, /class="showcase-ring"/);
  assert.doesNotMatch(html, /showcase-track|carousel-prev|carousel-next|showcase-count/);
  assert.doesNotMatch(html, /<button/);
  assert.match(html, /class="showcase-stage" tabindex="0"/);
  assert.match(html, /aria-describedby="ring-motion-hint"/);
});

test('decorative attention frames use bounded rays and an actual SVG perimeter runner', () => {
  const html = showcaseMarkup() + processCards();
  assert.equal((html.match(/class="attention-frame" aria-hidden="true"/g) || []).length, 1);
  assert.equal((html.match(/class="attention-rays"/g) || []).length, 1);
  assert.equal((html.match(/class="attention-runner"/g) || []).length, 1);
  assert.doesNotMatch(html, /analysis-roi|slice-marker/);
});

test('effects keep real depth, bounded slow rays, and a static reduced-motion layout', async () => {
  const css = await readFile(new URL('../src/showcase-effects.css', import.meta.url), 'utf8');
  assert.match(css, /transform-style: preserve-3d/);
  assert.match(css, /rotateY\(var\(--angle\)\) translateZ\(var\(--ring-radius\)\)/);
  assert.match(css, /animation: attention-rays 24s ease-in-out infinite alternate/);
  assert.match(css, /\.attention-frame\s*\{[^}]*overflow: hidden/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.showcase \.showcase-ring \{ display: grid/);
  assert.doesNotMatch(css, /mask-image|(?<!backdrop-)filter: blur/);
  assert.doesNotMatch(css, /\.showcase:focus-within|:has\(\.showcase-stage:hover\)/);
  assert.match(css, /\.ring-front:hover \.ring-glass/);
  assert.doesNotMatch(css, /font-size: [7-9]px/);
});

test('focused Space toggle changes actual ring animation and mobile stage fits viewport', { skip: !process.env.SHOWCASE_URL }, async () => {
  const { firefox } = await import('../.verification/node_modules/playwright/index.mjs');
  process.env.TMPDIR = new URL('../.verification/browser-tmp', import.meta.url).pathname;
  const browser = await firefox.launch({
    executablePath: '/home/pichenka/.cache/ms-playwright/firefox-1543/firefox/firefox',
    headless: true,
  });
  try {
    for (const width of [360, 768, 900, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'no-preference' });
      await page.goto(process.env.SHOWCASE_URL);
      const section = page.locator('.showcase');
      await section.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await page.waitForFunction(() => document.querySelector('.showcase').dataset.motion === 'running');
      const stage = page.locator('.showcase-stage');
      const ring = page.locator('.showcase-ring');
      const animation = () => ring.evaluate(element => getComputedStyle(element).animationPlayState);
      await stage.focus();
      assert.equal(await animation(), 'running');
      await stage.press('Space');
      assert.equal(await animation(), 'paused');
      assert.equal(await page.locator('.ring-hint').textContent(), 'Пробел: продолжить движение');
      await stage.press('Space');
      assert.equal(await stage.evaluate(element => document.activeElement === element), true);
      assert.equal(await animation(), 'running');
      assert.equal(await page.locator('.ring-hint').textContent(), 'Пробел: остановить движение');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      const geometry = await section.evaluate(element => ({
        stage: element.querySelector('.showcase-stage').getBoundingClientRect().width,
        client: document.documentElement.clientWidth,
        front: element.querySelectorAll('.ring-front')[0].getBoundingClientRect().width,
        back: element.querySelectorAll('.ring-front')[16].getBoundingClientRect().width,
      }));
      assert(geometry.stage <= geometry.client);
      assert(geometry.front > geometry.back * 1.25);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test('ring pauses offscreen, in hidden tabs, for reduced motion, and by user choice; visibility resumes it', t => {
  const events = () => {
    const listeners = new Map();
    return { addEventListener: (name, callback) => listeners.set(name, callback), emit: (name, event) => listeners.get(name)?.(event) };
  };
  const media = { ...events(), matches: false };
  const images = Array.from({ length: 6 }, () => ({ loading: 'lazy' }));
  const stage = { ...events(), querySelectorAll: () => images };
  const hint = {};
  const properties = {};
  const section = { dataset: {}, style: { setProperty(name, value) { properties[name] = value; } }, querySelector: selector => selector === '.showcase-stage' ? stage : hint };
  const space = { code: 'Space', preventDefault() {} };
  let intersection;
  globalThis.window = { ...events(), matchMedia: () => media };
  globalThis.document = { ...events(), hidden: false, documentElement: { clientWidth: 768 } };
  globalThis.IntersectionObserver = class {
    constructor(callback) { intersection = callback; }
    observe(target) { assert.equal(target, section); }
    disconnect() {}
  };
  t.after(() => { delete globalThis.window; delete globalThis.document; delete globalThis.IntersectionObserver; });
  mountShowcase(section);
  assert.equal(properties['--showcase-viewport-width'], '768px');
  document.documentElement.clientWidth = 900;
  window.emit('resize');
  assert.equal(properties['--showcase-viewport-width'], '900px');
  assert.equal(section.dataset.motion, 'paused');
  intersection([{ isIntersecting: true }]);
  assert.equal(section.dataset.motion, 'running');
  assert(images.every(image => image.loading === 'eager'));
  stage.emit('keydown', space);
  assert.equal(section.dataset.motion, 'paused');
  assert.equal(hint.textContent, 'Пробел: продолжить движение');
  stage.emit('keydown', { ...space, repeat: true });
  assert.equal(section.dataset.motion, 'paused');
  stage.emit('keydown', space);
  assert.equal(section.dataset.motion, 'running');
  document.hidden = true;
  document.emit('visibilitychange');
  assert.equal(section.dataset.motion, 'paused');
  document.hidden = false;
  document.emit('visibilitychange');
  assert.equal(section.dataset.motion, 'running');
  intersection([{ isIntersecting: false }]);
  assert.equal(section.dataset.motion, 'paused');
  intersection([{ isIntersecting: true }]);
  assert.equal(section.dataset.motion, 'running');
  media.matches = true;
  media.emit('change');
  assert.equal(section.dataset.motion, 'paused');
  assert.equal(hint.hidden, true);
  media.matches = false;
  media.emit('change');
  assert.equal(section.dataset.motion, 'running');
});

test('each story links to the real viewer and decorative scenes are hidden from assistive technology', () => {
  const html = processCards();
  assert.equal((html.match(/href="#scan-viewer"/g) || []).length, 3);
  assert.equal((html.match(/class="story-art [^"]+" aria-hidden="true"/g) || []).length, 3);
  assert.match(html, /Примите решение/);
});

test('carousel references 32 unique real local PNGs with reserved dimensions', async () => {
  const html = showcaseMarkup();
  const images = [...html.matchAll(/src="(\/showcase\/[^\"]+\.png)"/g)];
  assert.equal(images.length, 64);
  assert.equal(new Set(images.map(match => match[1])).size, 32);
  for (const [, path] of images) {
    const buffer = await readFile(new URL(`../public${path}`, import.meta.url));
    assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
  }
  assert.equal((html.match(/width="256" height="256" loading="lazy"/g) || []).length, 64);
  assert.match(html, /Демонстрационный объём · не диагностическое заключение/);
});

test('production background excludes the expensive masked grid and animated full-page rings', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.doesNotMatch(main + css, /ambient-grid|ambient-orbit|mask-image/);
  assert.match(main, /class="ambient" aria-hidden="true"><\/div>/);
});
