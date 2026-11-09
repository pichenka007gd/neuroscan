import test from 'node:test';
import assert from 'node:assert/strict';

test('compact UI, interactive graph, corner ROI and bounded native mobile stories', { skip: !process.env.REVISION_URL }, async () => {
  const { firefox } = await import('../.verification/node_modules/playwright/index.mjs');
  const { default: axe } = await import('../.verification/node_modules/axe-core/axe.js');
  const browser = await firefox.launch({
    executablePath: '/home/pichenka/.cache/ms-playwright/firefox-1543/firefox/firefox',
    headless: true,
    firefoxUserPrefs: { 'webgl.force-enabled': true },
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.REVISION_URL);
    assert.doesNotMatch(await page.locator('body').innerText(), /из кейса|условиям кейса|учебного|Вводная кейса|СИНТЕТИЧЕСКАЯ/);
    assert.equal(await page.locator('.hero-badge svg').count(), 1);
    assert.match(await page.locator('.hero-badge').innerText(), /врача-рентгенолога/i);
    assert.equal(await page.locator('.metrics, sup').count(), 0);
    assert.equal(await page.locator('.logo-mark').count(), 2);
    assert.equal(await page.locator('.logo-mark').first().innerHTML(), await page.locator('.logo-mark').last().innerHTML());
    assert.match(await page.locator('h1').innerText(), /Сократите время на описание снимков КТ и рентгена на 40%/);
    assert.match(await page.locator('.hero-access-note').innerText(), /подтверждение статуса клиники/);
    assert.match(await page.locator('#security').innerText(), /Серверы в РФ/);
    assert.match(await page.locator('#security').innerText(), /Разметка врачами/);
    assert.match(await page.locator('.impact-saving').innerText(), /около 90 часов/);
    assert.equal(await page.locator('.impact-footer').count(), 0);
    assert.equal(await page.locator('.hero-badge circle').count(), 0);
    await page.mouse.move(300, 220);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.cursor-glow')).opacity === '1');
    assert.equal(await page.locator('.cursor-glow').evaluate(e => getComputedStyle(e).opacity), '1');
    assert.equal(await page.locator('.cursor-glow').evaluate(e => getComputedStyle(e).pointerEvents), 'none');
    assert.equal(await page.locator('.cursor-glow').evaluate(e => getComputedStyle(e).zIndex), '-1');
    await page.locator('.impact-figure').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#clinics').classList.contains('impact-complete'));
    assert.equal(await page.locator('.impact-readout button, .impact-scenarios').count(), 0);
    assert.equal(await page.locator('[data-impact-value]').textContent(), '360');
    await page.locator('.impact-series-manual .impact-hit').hover({ force: true });
    await page.waitForTimeout(100);
    const intermediate = Number(await page.locator('[data-impact-value]').textContent());
    assert(intermediate > 360 && intermediate < 600);
    await page.waitForTimeout(550);
    assert.equal(await page.locator('#clinics').getAttribute('data-highlight'), 'manual');
    assert.equal(await page.locator('.impact-series-assisted').evaluate(e => getComputedStyle(e).opacity), '0.18');
    assert.notEqual(await page.locator('.impact-series-manual').evaluate(e => getComputedStyle(e).transform), 'none');
    assert.equal(await page.locator('[data-impact-value]').textContent(), '600');
    await page.locator('.impact-label-assisted').focus();
    assert.equal(await page.locator('#clinics').getAttribute('data-highlight'), 'assisted');
    await page.waitForTimeout(500);
    assert.equal(await page.locator('[data-impact-value]').textContent(), '360');
    await page.locator('.impact-series-manual').focus();
    await page.locator('.impact-series-manual').press('Enter');
    assert.equal(await page.locator('#clinics').getAttribute('data-highlight'), 'manual');
    assert.equal(await page.locator('.impact-series-manual .impact-line').evaluate(e => getComputedStyle(e).strokeWidth), '5px');
    await page.locator('.impact-series-assisted .impact-hit').hover({ force: true });
    await page.waitForTimeout(500);
    await page.locator('#clinics').screenshot({ path: '.verification/new-impact.png' });
    await page.locator('.showcase').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.ring-back').first().evaluate(e => getComputedStyle(e).display), 'none');
    assert.equal(await page.locator('.showcase-stage').evaluate(e => getComputedStyle(e).height), '280px');
    await page.locator('.showcase').screenshot({ path: '.verification/new-arc.png' });
    const card = page.locator('.ring-front').first();
    for (let i = 0; i < 4; i++) {
      await card.hover({ force: true });
      await page.waitForTimeout(800);
      assert.equal(await card.locator('img').evaluate(e => getComputedStyle(e).filter), 'blur(3px)');
      assert.equal(await card.locator('.ring-glass').evaluate(e => getComputedStyle(e).opacity), '1');
      assert.equal(await card.locator('.ring-glass').evaluate(e => getComputedStyle(e).backdropFilter), 'none');
      assert.equal(await page.locator('.showcase-ring').evaluate(e => getComputedStyle(e).animationPlayState), 'running');
    }
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    assert.equal(await card.locator('img').evaluate(e => getComputedStyle(e).filter), 'none');
    const securityCard = page.locator('.security-list article').nth(1);
    await securityCard.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(750);
    const securityBefore = await securityCard.boundingBox();
    await page.locator('.security-list article').nth(1).hover();
    await page.waitForTimeout(400);
    assert.deepEqual(await securityCard.boundingBox(), securityBefore);
    assert.equal(await page.locator('.security-list .security-art svg').count(), 3);
    assert.equal(await securityCard.locator('.security-draw').evaluate(e => getComputedStyle(e).animationName), 'none');
    await page.locator('#security').screenshot({ path: '.verification/new-security.png' });
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      assert.equal(await page.locator('.process-band').evaluate(e => Math.round(e.getBoundingClientRect().width)), width);
      for (const tile of await page.locator('.impact-business > div').all()) {
        assert.equal(await tile.evaluate(e => e.firstElementChild.tagName), 'SPAN');
      }
      for (const mark of await page.locator('.logo-mark').all()) {
        const box = await mark.boundingBox();
        assert(Math.abs(box.width - box.height) < .1);
      }
      for (const selector of ['#technology', '.showcase', '#clinics', '#security', '#demo']) {
        assert.equal(await page.locator(selector).evaluate(e => getComputedStyle(e).borderTopStyle), 'solid');
      }
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations);
      assert.deepEqual(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    }
    const mobile = await browser.newPage({ viewport: { width: 390, height: 850 }, hasTouch: true, isMobile: true });
    await mobile.goto(process.env.REVISION_URL);
    await mobile.waitForSelector('#scan-viewer[data-state=loaded]');
    await mobile.screenshot({ path: '.verification/compact-mobile-hero.png', fullPage: false });
    await mobile.locator('#scan-viewer').scrollIntoViewIfNeeded();
    await mobile.locator('.scan-roi-box').tap({ force: true });
    await mobile.waitForFunction(() => document.querySelector('#scan-viewer').dataset.analysisState === 'complete');
    assert.equal(await mobile.locator('#scan-viewer').getAttribute('data-rotating'), 'false');
    assert.equal(await mobile.locator('.scan-hint').isVisible(), false);
    const held = await mobile.locator('#scan-viewer').getAttribute('data-rotation-y');
    await mobile.waitForTimeout(200);
    assert.equal(await mobile.locator('#scan-viewer').getAttribute('data-rotation-y'), held);
    const panelBounds = await mobile.locator('.scan-analysis').boundingBox();
    const controlsBounds = await mobile.locator('.scan-bottom').boundingBox();
    assert(panelBounds.y + panelBounds.height <= controlsBounds.y);
    await mobile.locator('#scan-viewer').screenshot({ path: '.verification/compact-mobile-report.png' });
    await mobile.keyboard.press('Escape');
    await mobile.locator('.process').scrollIntoViewIfNeeded();
    await mobile.waitForSelector('#scan-viewer[data-scene-visible="false"]');
    assert.equal(await mobile.locator('.process').evaluate(e => getComputedStyle(e).display), 'flex');
    assert.equal(await mobile.locator('.process-card').count(), 3);
    assert.equal(await mobile.locator('[data-clone]').count(), 0);
    assert.equal(await mobile.locator('.process-card').first().evaluate(e => getComputedStyle(e).scrollSnapStop), 'always');
    const originals = mobile.locator('.process-card:not([data-clone])');
    await mobile.waitForTimeout(500);
    assert.equal(await originals.first().getAttribute('data-visible'), 'true');
    assert.equal(await originals.first().locator('.sheet-front').evaluate(e => getComputedStyle(e).animationName), 'story-front');
    const nearest = () => mobile.locator('.process').evaluate(rail => {
      const x = rail.getBoundingClientRect().left;
      const card = [...rail.children].sort((a, b) => Math.abs(a.getBoundingClientRect().left - x) - Math.abs(b.getBoundingClientRect().left - x))[0];
      return { clone: card.dataset.clone || '', title: card.querySelector('h3').textContent };
    });
    const railBounds = await mobile.locator('.process').boundingBox();
    await mobile.mouse.move(railBounds.x + 100, Math.max(10, railBounds.y + 100));
    const swipe = async delta => { await mobile.mouse.wheel(delta, 0); await mobile.waitForTimeout(700); };
    await swipe(1200);
    assert.deepEqual(await nearest(), { clone: '', title: 'Второй взгляд ИИ' });
    await swipe(1200);
    assert.deepEqual(await nearest(), { clone: '', title: 'Примите решение' });
    await mobile.locator('.process').screenshot({ path: '.verification/compact-decision.png' });
    await swipe(1200);
    assert.deepEqual(await nearest(), { clone: '', title: 'Примите решение' });
    await swipe(-1200);
    assert.deepEqual(await nearest(), { clone: '', title: 'Второй взгляд ИИ' });
    await swipe(-1200);
    assert.deepEqual(await nearest(), { clone: '', title: 'Снимок из PACS' });
    await mobile.screenshot({ path: '.verification/new-mobile-stories.png' });
    const contentBounds = await originals.first().locator('.step-tag').boundingBox();
    const artBounds = await originals.first().locator('.story-art').boundingBox();
    assert(artBounds.y >= contentBounds.y + contentBounds.height);
    await mobile.locator('.impact-label-assisted').tap();
    assert.equal(await mobile.locator('#clinics').getAttribute('data-highlight'), 'assisted');
    await mobile.locator('.impact-series-manual .impact-hit').tap({ force: true });
    assert.equal(await mobile.locator('#clinics').getAttribute('data-highlight'), 'manual');
    await mobile.waitForTimeout(500);
    assert.equal(await mobile.locator('[data-impact-value]').textContent(), '600');
    const reduced = await browser.newPage({ viewport: { width: 390, height: 850 }, hasTouch: true, reducedMotion: 'reduce' });
    await reduced.goto(process.env.REVISION_URL);
    assert.equal(await reduced.locator('.cursor-glow').evaluate(e => getComputedStyle(e).display), 'none');
    await reduced.locator('.process').scrollIntoViewIfNeeded();
    assert.equal(await reduced.locator('.sheet-front').first().evaluate(e => getComputedStyle(e).animationName), 'none');
    assert.equal(await reduced.locator('.showcase-ring').evaluate(e => getComputedStyle(e).animationName), 'none');
    assert.equal(await reduced.locator('[data-impact-value]').textContent(), '360');
    await reduced.locator('.impact-label-manual').tap();
    assert.equal(await reduced.locator('[data-impact-value]').textContent(), '600');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
