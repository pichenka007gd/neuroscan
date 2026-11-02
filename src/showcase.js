const diagonalArrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function sheet(extraClass, content) {
  return `<svg class="story-sheet ${extraClass}" viewBox="0 0 176 210" fill="none"><rect x=".5" y=".5" width="175" height="209" rx="8" fill="#dce7df" stroke="#f0f5ef" stroke-opacity=".55"/><path d="M21 25h42M21 34h25" stroke="#5a756b" stroke-width="3" stroke-linecap="round"/>${content}<path d="M21 166h126M21 176h107M21 186h69" stroke="#7c9388" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/></svg>`;
}

const scanContent = '<rect x="20" y="52" width="136" height="98" rx="3" fill="#263b36"/><ellipse cx="88" cy="101" rx="45" ry="37" fill="#c3d0c5" fill-opacity=".5"/><ellipse cx="88" cy="101" rx="31" ry="27" fill="#738c7b"/><ellipse cx="76" cy="95" rx="12" ry="18" fill="#314d40"/><ellipse cx="101" cy="95" rx="12" ry="18" fill="#314d40"/><path d="M88 69v63M53 101h70" stroke="#d3e5d7" stroke-opacity=".22"/>';
const reportContent = '<path d="M21 59h88M21 69h129M21 79h116M21 98h61M21 108h131M21 118h111M21 137h86M21 147h120" stroke="#71887c" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>';

function attentionFrame() {
  return '<span class="attention-frame" aria-hidden="true"><span class="attention-rays"></span><svg viewBox="0 0 80 80" fill="none"><rect class="attention-border" x="1" y="1" width="78" height="78" rx="7"/><rect class="attention-runner" x="1" y="1" width="78" height="78" rx="7" pathLength="100"/></svg></span>';
}

export function processCards() {
  const stories = [
    ['Снимок из PACS', 'Обезличенное исследование поступает из архива клиники по защищённому каналу. Интеграция предусмотрена в проекте.', 'КТ · МРТ · РЕНТГЕН', `<div class="story-art story-upload" aria-hidden="true">${sheet('sheet-back', scanContent)}${sheet('sheet-middle', scanContent)}${sheet('sheet-front', scanContent)}<span class="story-orbit"></span></div>`],
    ['Второй взгляд ИИ', 'Алгоритм выделяет зоны внимания. До 30 секунд на анализ по условиям учебного кейса, не измеренная скорость сервиса.', 'УСЛОВНАЯ РАЗМЕТКА', `<div class="story-art story-analysis" aria-hidden="true"><svg class="analysis-image" viewBox="0 0 260 180" fill="none"><defs><pattern id="analysis-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" stroke="#b6dbcf" stroke-opacity=".12"/></pattern></defs><rect width="260" height="180" fill="url(#analysis-grid)"/><ellipse cx="130" cy="112" rx="78" ry="62" fill="#b2c9bb" fill-opacity=".1" stroke="#b6dbcf" stroke-opacity=".23"/><ellipse cx="130" cy="112" rx="59" ry="46" fill="#b6dbcf" fill-opacity=".08"/><path d="M114 80c-28-19-47 35-21 46 15 6 28-14 21-46Zm32 0c28-19 47 35 21 46-15 6-28-14-21-46Z" fill="#a4c5b1" fill-opacity=".26"/><path d="M130 65v99M66 112h128" stroke="#b6dbcf" stroke-opacity=".15"/></svg>${attentionFrame()}<span class="analysis-beam"></span><span class="analysis-readout">Зона внимания <span>01 · ДЕМО</span></span></div>`],
    ['Примите решение', 'Проверьте подсказки и отредактируйте черновик. Финальное слово за специалистом.', 'КОНТРОЛЬ СПЕЦИАЛИСТА', `<div class="story-art story-decision" aria-hidden="true">${sheet('sheet-back', reportContent)}${sheet('sheet-front', reportContent)}<span class="document-check"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="document-stamp">Проверено врачом</span></div>`],
  ];
  return stories.map(([title, copy, tag, art], index) => `<article class="process-card" data-visible="false"><div class="story-meta"><span class="step-number">0${index + 1}</span>${diagonalArrow}</div><h3>${title}</h3><p>${copy}</p><a class="story-link" href="#scan-viewer">${index === 2 ? 'Посмотреть результат' : 'К демонстрации'}<span class="sr-only">: ${title}</span></a><span class="step-tag">${tag}</span>${art}</article>`).join('');
}

export const ringSlices = Array.from({ length: 32 }, (_, index) => 12 + index * 3);

export function showcaseMarkup() {
  const cards = ringSlices.map((slice, index) => `<div class="ring-slot" style="--angle: ${index * 360 / ringSlices.length}deg"><figure class="ring-front"><img src="${import.meta.env?.BASE_URL || '/'}showcase/slice-${slice}.png" alt="Томографический срез ${slice} демонстрационного объёма" width="256" height="256" loading="lazy" draggable="false"><figcaption>Срез ${String(slice).padStart(3, '0')}</figcaption><span class="ring-glass" aria-hidden="true"><span>NEUROSCAN</span><strong>${String(slice).padStart(3, '0')}<small> / 113</small></strong><span>Томографическая серия</span></span></figure><div class="ring-back" aria-hidden="true"><img src="${import.meta.env?.BASE_URL || '/'}showcase/slice-${slice}.png" alt="" width="256" height="256" loading="lazy" draggable="false"></div></div>`).join('');
  return `<section class="showcase wrap reveal" data-motion="paused" aria-labelledby="showcase-title"><div class="showcase-heading"><div><p class="eyebrow">От детали к общей картине</p><h2 id="showcase-title">Вся серия.<br><span>В одной орбите.</span></h2></div><div class="showcase-intro"><p>32 среза одного объёма. Непрерывная последовательность, в которой каждая деталь остаётся частью целого.</p><span>Демонстрационный объём · не диагностическое заключение</span></div></div><div class="showcase-stage" tabindex="0" role="group" aria-label="Вращающееся кольцо из 32 томографических срезов" aria-describedby="ring-motion-hint"><div class="showcase-tilt"><div class="showcase-ring">${cards}</div></div></div><div class="showcase-footer"><p>Одна серия. 32 точки зрения.<br><span>Наведите на снимок, чтобы проявить стеклянную панель.</span></p><span class="ring-hint" id="ring-motion-hint" aria-live="polite">Пробел: остановить движение</span></div></section>`;
}

export function mountStoryCards(cards) {
  const allowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.target.dataset.visible = String(entry.isIntersecting); });
  }, { threshold: .1 });
  const updateVisibility = () => {
    cards.forEach(card => { card.dataset.pageHidden = String(document.hidden); });
  };
  document.addEventListener('visibilitychange', updateVisibility);
  updateVisibility();
  cards.forEach(card => {
    observer.observe(card);
    let frame = 0;
    let pointer;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      card.style.removeProperty('--story-x');
      card.style.removeProperty('--story-y');
      card.style.removeProperty('--story-tilt');
    };
    card.addEventListener('pointermove', event => {
      if (!allowed.matches || event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = card.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (pointer.x - bounds.left) / bounds.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (pointer.y - bounds.top) / bounds.height * 2 - 1));
        card.style.setProperty('--story-x', `${x * 5}px`);
        card.style.setProperty('--story-y', `${y * 5}px`);
        card.style.setProperty('--story-tilt', `${x * 3}deg`);
      });
    });
    card.addEventListener('pointerleave', reset);
    allowed.addEventListener('change', reset);
  });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}

export function mountShowcase(section) {
  const stage = section.querySelector('.showcase-stage');
  const hint = section.querySelector('.ring-hint');
  const sizeStage = () => section.style.setProperty('--showcase-viewport-width', `${document.documentElement.clientWidth}px`);
  sizeStage();
  window.addEventListener('resize', sizeStage);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let paused = false;
  const update = () => {
    section.dataset.motion = visible && !paused && !document.hidden && !motion.matches ? 'running' : 'paused';
    hint.hidden = motion.matches;
    hint.textContent = paused ? 'Пробел: продолжить движение' : 'Пробел: остановить движение';
  };
  stage.addEventListener('keydown', event => {
    if (event.code !== 'Space') return;
    event.preventDefault();
    if (event.repeat) return;
    paused = !paused;
    update();
  });
  motion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) stage.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
    update();
  }, { threshold: .05 });
  observer.observe(section);
  update();
  window.addEventListener('pagehide', () => {
    visible = false;
    update();
    observer.disconnect();
  }, { once: true });
}
