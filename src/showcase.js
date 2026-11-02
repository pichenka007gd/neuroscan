const diagonalArrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function sheet(extraClass, content) {
  return `<svg class="story-sheet ${extraClass}" viewBox="0 0 176 210" fill="none"><rect x=".5" y=".5" width="175" height="209" rx="8" fill="#dce7df" stroke="#f0f5ef" stroke-opacity=".55"/><path d="M21 25h42M21 34h25" stroke="#5a756b" stroke-width="3" stroke-linecap="round"/>${content}<path d="M21 166h126M21 176h107M21 186h69" stroke="#7c9388" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/></svg>`;
}

const scanContent = '<rect x="20" y="52" width="136" height="98" rx="3" fill="#263b36"/><ellipse cx="88" cy="101" rx="45" ry="37" fill="#c3d0c5" fill-opacity=".5"/><ellipse cx="88" cy="101" rx="31" ry="27" fill="#738c7b"/><ellipse cx="76" cy="95" rx="12" ry="18" fill="#314d40"/><ellipse cx="101" cy="95" rx="12" ry="18" fill="#314d40"/><path d="M88 69v63M53 101h70" stroke="#d3e5d7" stroke-opacity=".22"/>';
const reportContent = '<path d="M21 59h88M21 69h129M21 79h116M21 98h61M21 108h131M21 118h111M21 137h86M21 147h120" stroke="#71887c" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>';

export function processCards() {
  const stories = [
    ['Снимок из PACS', 'Обезличенное исследование поступает из архива клиники по защищённому каналу. Интеграция предусмотрена в проекте.', 'КТ · МРТ · РЕНТГЕН', `<div class="story-art story-upload" aria-hidden="true">${sheet('sheet-back', scanContent)}${sheet('sheet-middle', scanContent)}${sheet('sheet-front', scanContent)}<span class="story-orbit"></span></div>`],
    ['Второй взгляд ИИ', 'Алгоритм выделяет зоны внимания. До 30 секунд на анализ по условиям учебного кейса, не измеренная скорость сервиса.', 'УСЛОВНАЯ РАЗМЕТКА', `<div class="story-art story-analysis" aria-hidden="true"><svg class="analysis-image" viewBox="0 0 260 180" fill="none"><defs><pattern id="analysis-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" stroke="#b6dbcf" stroke-opacity=".12"/></pattern></defs><rect width="260" height="180" fill="url(#analysis-grid)"/><ellipse cx="130" cy="112" rx="78" ry="62" fill="#b2c9bb" fill-opacity=".1" stroke="#b6dbcf" stroke-opacity=".23"/><ellipse cx="130" cy="112" rx="59" ry="46" fill="#b6dbcf" fill-opacity=".08"/><path d="M114 80c-28-19-47 35-21 46 15 6 28-14 21-46Zm32 0c28-19 47 35 21 46-15 6-28-14-21-46Z" fill="#a4c5b1" fill-opacity=".26"/><path d="M130 65v99M66 112h128" stroke="#b6dbcf" stroke-opacity=".15"/><g class="analysis-roi" stroke="#b6dbcf" stroke-width="1.5"><path d="M152 75h-9v9m28-9h9v9m0 23v9h-9m-28-9v9h9"/><circle cx="162" cy="96" r="6" stroke-opacity=".6"/></g></svg><span class="analysis-beam"></span><span class="analysis-readout">Зона внимания <span>01</span></span></div>`],
    ['Примите решение', 'Проверьте подсказки и отредактируйте черновик. Финальное слово за специалистом.', 'КОНТРОЛЬ СПЕЦИАЛИСТА', `<div class="story-art story-decision" aria-hidden="true">${sheet('sheet-back', reportContent)}${sheet('sheet-front', reportContent)}<span class="document-check"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="document-stamp">Проверено врачом</span></div>`],
  ];
  return stories.map(([title, copy, tag, art], index) => `<article class="process-card"><div class="story-meta"><span class="step-number">0${index + 1}</span>${diagonalArrow}</div><h3>${title}</h3><p>${copy}</p><a class="story-link" href="#scan-viewer">${index === 2 ? 'Посмотреть результат' : 'К демонстрации'}<span class="sr-only">: ${title}</span></a><span class="step-tag">${tag}</span>${art}</article>`).join('');
}

const slices = [24, 38, 52, 66, 80, 94];

export function showcaseMarkup() {
  return `<section class="showcase wrap reveal" aria-labelledby="showcase-title" aria-roledescription="карусель"><div class="showcase-heading"><div><p class="eyebrow">От детали к общей картине</p><h2 id="showcase-title">Каждый срез.<br><span>В контексте.</span></h2></div><div class="showcase-intro"><p>Рассмотрите серию, а не один кадр. Соседние срезы помогают увидеть пространственную связь деталей.</p><span>Демонстрационный объём · условная разметка</span></div></div><div class="showcase-track" tabindex="0" role="group" aria-label="Срезы томографического объёма. Используйте стрелки влево и вправо.">${slices.map((slice, index) => `<figure class="slice-card${index === 0 ? ' is-active' : ''}" aria-label="Срез ${slice} из 113"><div class="slice-image"><img src="/showcase/slice-${slice}.png" alt="Томографический срез ${slice} демонстрационного объёма" width="256" height="256" loading="lazy" draggable="false"><span class="slice-crosshair" aria-hidden="true"></span><span class="slice-position" aria-hidden="true">Z / ${String(slice).padStart(3, '0')}</span><svg class="slice-marker" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M19 8H8v11m37-11h11v11m0 26v11H45M8 45v11h11" stroke="currentColor" stroke-width="1.2"/></svg></div><figcaption><span>Срез ${String(slice).padStart(2, '0')} <span>/ 113</span></span><span>AXIAL · ДЕМО</span></figcaption></figure>`).join('')}</div><div class="showcase-footer"><p>Одна серия. Несколько точек зрения.<br><span>Иллюстрация процесса, не диагностическое заключение.</span></p><div class="showcase-controls"><span class="showcase-count" aria-hidden="true">01 <span>/ 06</span></span><button type="button" class="carousel-prev" aria-label="Предыдущий срез" disabled><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" class="carousel-next" aria-label="Следующий срез"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div><p class="sr-only showcase-status" aria-live="polite" aria-atomic="true"></p></section>`;
}

export function boundedIndex(index, length) {
  return Math.max(0, Math.min(length - 1, index));
}

export function mountStoryCards(cards) {
  const allowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  cards.forEach(card => {
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
}

export function mountShowcase(section) {
  const track = section.querySelector('.showcase-track');
  const cards = [...section.querySelectorAll('.slice-card')];
  const previous = section.querySelector('.carousel-prev');
  const next = section.querySelector('.carousel-next');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let index = 0;
  let cancelled = false;
  let scrollTimer;

  const cancelAuto = () => {
    cancelled = true;
    timers.forEach(clearTimeout);
    timers.clear();
  };
  const targetLeft = card => Math.max(0, Math.min(track.scrollWidth - track.clientWidth, card.offsetLeft - cards[0].offsetLeft - (track.clientWidth - card.clientWidth) / 2));
  const update = value => {
    index = boundedIndex(value, cards.length);
    cards.forEach((card, position) => card.classList.toggle('is-active', position === index));
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    section.querySelector('.showcase-count').innerHTML = `${String(index + 1).padStart(2, '0')} <span>/ 06</span>`;
  };
  const select = (value, userInitiated = false) => {
    if (userInitiated) cancelAuto();
    update(value);
    track.scrollTo({ left: targetLeft(cards[index]), behavior: motion.matches ? 'instant' : 'smooth' });
    if (userInitiated) section.querySelector('.showcase-status').textContent = `Срез ${slices[index]} из 113, изображение ${index + 1} из ${cards.length}`;
  };

  previous.addEventListener('click', () => select(index - 1, true));
  next.addEventListener('click', () => select(index + 1, true));
  track.addEventListener('keydown', event => {
    const destinations = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: cards.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    select(destinations[event.key], true);
  });
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const nearest = cards.reduce((best, card, position) => Math.abs(targetLeft(card) - track.scrollLeft) < Math.abs(targetLeft(cards[best]) - track.scrollLeft) ? position : best, 0);
      update(nearest);
    }, 140);
  }, { passive: true });
  for (const event of ['pointerenter', 'focusin', 'pointerdown', 'touchstart', 'wheel']) {
    section.addEventListener(event, cancelAuto, { passive: true });
  }
  motion.addEventListener('change', cancelAuto);
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    if (motion.matches || cancelled) return;
    for (const [delay, destination] of [[1400, 1], [3000, 2]]) {
      timers.add(setTimeout(() => { if (!cancelled && !document.hidden) select(destination); }, delay));
    }
  }, { threshold: .3 });
  observer.observe(section);
  window.addEventListener('pagehide', () => { cancelAuto(); clearTimeout(scrollTimer); observer.disconnect(); }, { once: true });
}
