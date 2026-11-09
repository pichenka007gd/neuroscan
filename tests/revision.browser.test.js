import test from 'node:test';
import assert from 'node:assert/strict';

test('foreground arc, interactive graph, security SVGs and infinite mobile stories', { skip: !process.env.REVISION_URL }, async () => {
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
    await page.locator('.impact-figure').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#clinics').classList.contains('impact-complete'));
    await page.locator('[data-scenario="manual"]').hover();
    await page.waitForTimeout(550);
    assert.equal(await page.locator('#clinics').getAttribute('data-highlight'), 'manual');
    assert.equal(await page.locator('.impact-series-assisted').evaluate(e => getComputedStyle(e).opacity), '0.18');
    assert.notEqual(await page.locator('.impact-series-manual').evaluate(e => getComputedStyle(e).transform), 'none');
    await page.locator('[data-scenario="assisted"]').focus();
    assert.equal(await page.locator('#clinics').getAttribute('data-highlight'), 'assisted');
    await page.locator('[data-scenario="assisted"]').press('Escape');
    assert.equal(await page.locator('#clinics').getAttribute('data-highlight'), '');
    await page.locator('#clinics').screenshot({ path: '.verification/new-impact.png' });
    await page.locator('.showcase').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.ring-back').first().evaluate(e => getComputedStyle(e).display), 'none');
    assert.equal(await page.locator('.showcase-stage').evaluate(e => getComputedStyle(e).height), '330px');
    await page.locator('.showcase').screenshot({ path: '.verification/new-arc.png' });
    await page.locator('.security-list article').nth(1).hover();
    assert.equal(await page.locator('.security-list .security-art svg').count(), 3);
    assert.equal(await page.locator('.security-list article').nth(1).locator('.security-draw').evaluate(e => getComputedStyle(e).animationName), 'security-draw');
    await page.locator('#security').screenshot({ path: '.verification/new-security.png' });
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations);
      assert.deepEqual(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    }
    const mobile = await browser.newPage({ viewport: { width: 390, height: 850 }, hasTouch: true, isMobile: true });
    await mobile.goto(process.env.REVISION_URL);
    await mobile.locator('.process').scrollIntoViewIfNeeded();
    assert.equal(await mobile.locator('.process').evaluate(e => getComputedStyle(e).display), 'flex');
    const originals = mobile.locator('.process-card:not([data-clone])');
    await mobile.waitForTimeout(500);
    assert.equal(await originals.first().getAttribute('data-visible'), 'true');
    assert.equal(await originals.first().locator('.sheet-front').evaluate(e => getComputedStyle(e).animationName), 'story-front');
    const align = async selector => {
      await mobile.locator(selector).evaluate(card => {
        const rail = card.parentElement;
        rail.scrollLeft += card.getBoundingClientRect().left - rail.getBoundingClientRect().left;
      });
      await mobile.waitForTimeout(650);
    };
    const nearest = () => mobile.locator('.process').evaluate(rail => {
      const x = rail.getBoundingClientRect().left;
      const card = [...rail.children].sort((a, b) => Math.abs(a.getBoundingClientRect().left - x) - Math.abs(b.getBoundingClientRect().left - x))[0];
      return { clone: card.dataset.clone || '', title: card.querySelector('h3').textContent };
    });
    await align('[data-clone="-before"]');
    assert.deepEqual(await nearest(), { clone: '', title: 'Примите решение' });
    await align('[data-clone="-after"]');
    assert.deepEqual(await nearest(), { clone: '', title: 'Снимок из PACS' });
    await mobile.screenshot({ path: '.verification/new-mobile-stories.png' });
    await mobile.locator('[data-scenario="assisted"]').tap();
    assert.equal(await mobile.locator('#clinics').getAttribute('data-highlight'), 'assisted');
    await mobile.locator('[data-scenario="manual"]').tap();
    assert.equal(await mobile.locator('#clinics').getAttribute('data-highlight'), 'manual');
    const reduced = await browser.newPage({ viewport: { width: 390, height: 850 }, hasTouch: true, reducedMotion: 'reduce' });
    await reduced.goto(process.env.REVISION_URL);
    await reduced.locator('.process').scrollIntoViewIfNeeded();
    assert.equal(await reduced.locator('.sheet-front').first().evaluate(e => getComputedStyle(e).animationName), 'none');
    assert.equal(await reduced.locator('.showcase-ring').evaluate(e => getComputedStyle(e).animationName), 'none');
    assert.equal(await reduced.locator('[data-impact-count]').textContent(), '88');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
