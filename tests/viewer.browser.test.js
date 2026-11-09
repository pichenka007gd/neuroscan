import test from 'node:test';
import assert from 'node:assert/strict';

const url = process.env.VIEWER_URL;

test('viewer pointer, annotation and motion regressions', { skip: !url }, async t => {
  const { firefox } = await import('../.verification/node_modules/playwright/index.mjs');
  const browser = await firefox.launch({
    executablePath: '/home/pichenka/.cache/ms-playwright/firefox-1543/firefox/firefox',
    headless: true,
    firefoxUserPrefs: { 'webgl.force-enabled': true },
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForSelector('#scan-viewer[data-state=loaded]');
    const viewer = page.locator('#scan-viewer');
    const range = viewer.locator('.scan-range');
    const angle = () => viewer.getAttribute('data-rotation-y').then(Number);

    await t.test('default rotation and no obsolete pause/reset buttons', async () => {
      assert.equal(await viewer.locator('.scan-pause, .scan-reset').count(), 0);
      assert.equal(await viewer.getAttribute('data-points'), '55000');
      const start = await angle();
      await page.waitForFunction(value => Number(document.querySelector('#scan-viewer').dataset.rotationY) > value + .025, start);
    });

    await t.test('central divider line does not intercept geometry drag; capture survives leaving scene', async () => {
      const bounds = await viewer.locator('canvas').boundingBox();
      const x = bounds.x + bounds.width * .47;
      const y = bounds.y + bounds.height * .28;
      assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y).tagName, { x, y }), 'CANVAS');
      await page.mouse.move(x, y);
      const start = await angle();
      await page.mouse.down();
      await page.mouse.move(x + 90, y + 20, { steps: 8 });
      assert(Number(await angle()) > start + .5);
      assert.equal(await viewer.getAttribute('data-rotating'), 'false');
      assert.equal(await range.inputValue(), '47');
      await page.mouse.move(bounds.x - 15, y, { steps: 4 });
      await page.mouse.up();
      assert.equal(await viewer.getAttribute('data-rotating'), 'true');
      const released = await angle();
      await page.waitForFunction(value => Number(document.querySelector('#scan-viewer').dataset.rotationY) > value + .02, released);
    });

    await t.test('native range and round divider handle still control comparison', async () => {
      const handle = await viewer.locator('.scan-wipe > span').boundingBox();
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(handle.x + 90, handle.y + handle.height / 2, { steps: 5 });
      await page.mouse.up();
      assert.notEqual(await range.inputValue(), '47');
      await range.press('Home');
      assert.equal(await range.inputValue(), '0');
    });

    await t.test('Space pauses and resumes ambient movement without extra buttons', async () => {
      const canvas = viewer.locator('canvas');
      await canvas.focus();
      await page.keyboard.press('Space');
      assert.equal(await viewer.getAttribute('data-motion-paused'), 'true');
      assert.equal(await viewer.getAttribute('data-rotating'), 'false');
      const paused = await angle();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await angle(), paused);
      await page.keyboard.press('Space');
      assert.equal(await viewer.getAttribute('data-rotating'), 'true');
    });

    await t.test('continuous native slider and divider dragging do not reset the rotation clock', async () => {
      await page.mouse.move(0, 0);
      const handle = await viewer.locator('.scan-wipe > span').boundingBox();
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      const start = await angle();
      for (let i = 0; i < 50; i++) {
        await page.mouse.move(handle.x + handle.width / 2 + i * 2, handle.y + handle.height / 2);
        await page.waitForTimeout(8);
      }
      assert.equal(await viewer.getAttribute('data-rotating'), 'true');
      assert(await angle() > start + .035);
      await page.mouse.up();
      await range.press('Home');
      const nativeStart = await angle();
      for (let i = 0; i < 45; i++) {
        await range.press('ArrowRight');
        await page.waitForTimeout(8);
      }
      assert(await angle() > nativeStart + .035);
      await range.press('Home');
    });

    await t.test('ROI hover generates visual text once, freezes target, Escape closes; original-only hides analysis', async () => {
      const hotspot = viewer.locator('.scan-roi-box');
      const bounds = await hotspot.boundingBox();
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      assert.equal(await hotspot.getAttribute('aria-expanded'), 'true');
      assert.equal(await viewer.getAttribute('data-rotating'), 'false');
      const generatingHeight = (await viewer.locator('.scan-analysis').boundingBox()).height;
      assert.notEqual(await hotspot.evaluate(element => getComputedStyle(element).backgroundImage), 'none');
      const style = await hotspot.evaluate(element => ({
        border: getComputedStyle(element).borderTopWidth,
        outline: getComputedStyle(element).outlineStyle,
        shadow: getComputedStyle(element).boxShadow,
      }));
      assert.equal(style.border, '0px');
      assert.equal(style.outline, 'none');
      assert.equal(style.shadow, 'none');
      await page.waitForFunction(() => document.querySelector('#scan-viewer').dataset.analysisState === 'complete');
      assert.match(await viewer.locator('.scan-analysis-text').innerText(), /Требуется оценка специалиста/);
      assert.match(await viewer.locator('.scan-analysis').innerText(), /Отклонение от нормы · 18,6%/);
      assert.match(await viewer.locator('.scan-analysis').innerText(), /Черновик ИИ/);
      assert.match(await viewer.locator('.scan-analysis').innerText(), /Демо/);
      assert.equal(await viewer.locator('.analysis-heading svg').count(), 1);
      await viewer.screenshot({ path: '.verification/new-roi.png' });
      assert.equal(await viewer.locator('.scan-analysis [aria-live]').count(), 0);
      const held = await angle();
      const heldCamera = [await viewer.getAttribute('data-camera-x'), await viewer.getAttribute('data-camera-y')];
      const panel = viewer.locator('.scan-analysis');
      const originalHeight = (await panel.boundingBox()).height;
      assert.equal(originalHeight, generatingHeight);
      const panelBounds = await panel.boundingBox();
      await page.mouse.move(panelBounds.x + panelBounds.width / 2, panelBounds.y + panelBounds.height / 2);
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)));
      assert.equal(await panel.isVisible(), true);
      assert.equal(await angle(), held);
      assert.deepEqual([await viewer.getAttribute('data-camera-x'), await viewer.getAttribute('data-camera-y')], heldCamera);
      assert.equal((await panel.boundingBox()).height, originalHeight);
      await page.mouse.move(0, 0);
      await hotspot.focus();
      assert.equal(await angle(), held);
      await page.keyboard.press('Escape');
      assert.equal(await hotspot.getAttribute('aria-expanded'), 'false');
      await hotspot.focus();
      await range.press('End');
      assert.equal(await range.inputValue(), '100');
      assert.equal(await viewer.locator('.scan-annotation').isHidden(), true);
      assert.equal(await viewer.locator('.scan-analysis').isHidden(), true);
    });
    await t.test('dragging through ROI retains capture and does not open analysis', async () => {
      await range.press('Home');
      await viewer.locator('canvas').focus();
      await page.keyboard.press('Space');
      const bounds = await viewer.locator('.scan-roi-box').boundingBox();
      const y = bounds.y + bounds.height / 2;
      await page.mouse.move(bounds.x - 40, y);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width / 2, y, { steps: 6 });
      assert.equal(await viewer.getAttribute('data-analysis-state'), 'closed');
      await page.mouse.up();
      await page.mouse.move(0, 0);
      await viewer.locator('canvas').focus();
      await page.keyboard.press('Space');
    });
    await t.test('initial reduced-motion preference prevents autoplay', async () => {
      const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await reduced.goto(url);
      await reduced.waitForSelector('#scan-viewer[data-state=loaded]');
      const stillViewer = reduced.locator('#scan-viewer');
      assert.equal(await stillViewer.getAttribute('data-rotating'), 'false');
      assert.equal(await stillViewer.getAttribute('data-rotation-y'), '-0.5500');
      await stillViewer.locator('.scan-range').press('Home');
      await stillViewer.locator('.scan-roi-box').focus();
      assert.equal(await stillViewer.getAttribute('data-analysis-state'), 'complete');
      const paragraph = stillViewer.locator('.scan-analysis p');
      assert.equal(await paragraph.evaluate(element => element.scrollHeight <= element.clientHeight), true);
      await reduced.close();
    });

    await t.test('reduced motion stops ambient work, keeps arrows/drag and reveals text immediately', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await range.press('Home');
      const before = await angle();
      await viewer.locator('canvas').focus();
      await page.keyboard.press('ArrowRight');
      assert(Math.abs(await angle() - before - .08) < .0002);
      assert.equal(await viewer.getAttribute('data-rotating'), 'false');
      await viewer.locator('.scan-roi-box').focus();
      assert.equal(await viewer.getAttribute('data-analysis-state'), 'complete');
      assert.equal(await viewer.locator('.scan-analysis-text').innerText(), await viewer.locator('.scan-analysis-accessible').innerText());
      await page.keyboard.press('Escape');
      assert.equal(await viewer.getAttribute('data-camera-x'), '0.0000');
      assert.equal(await viewer.getAttribute('data-camera-y'), '0.0000');
      const still = await angle();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await angle(), still);
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
