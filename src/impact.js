import { calculateHours, caseAssumptions } from './calculator.js';

export const impactData = Object.freeze({
  studies: 60,
  manualMinutes: 60 * caseAssumptions.minutesPerStudy,
  assistedMinutes: 60 * caseAssumptions.minutesPerStudy * (1 - caseAssumptions.savingRate),
  savedMinutes: 60 * caseAssumptions.minutesPerStudy * caseAssumptions.savingRate,
  monthlyHours: calculateHours(60),
});

export function impactMarkup(arrow) {
  const { studies, manualMinutes, assistedMinutes, savedMinutes, monthlyHours } = impactData;
  return `<section id="clinics" class="impact-section" aria-labelledby="impact-title">
    <div class="wrap">
      <div class="impact-heading">
        <div><p class="eyebrow">Для клиник</p><h2 id="impact-title">Верните время<br><span>врачу.</span></h2></div>
        <div class="impact-stat"><span class="impact-model-label">ПРИМЕР ЭКОНОМИИ</span><p class="impact-number"><span data-impact-count aria-hidden="true">${monthlyHours}</span><span class="sr-only">${monthlyHours} часов</span><span aria-hidden="true">часов</span></p><p>на описание исследований за месяц</p><span class="impact-daily">4 часа в день × 22 рабочих дня = 88 часов</span></div>
      </div>
      <figure class="impact-figure" aria-labelledby="impact-chart-caption">
        <figcaption id="impact-chart-caption"><span>Накопленное время на описание</span><span>Один рабочий день</span></figcaption>
        <div class="impact-comparison"><div class="impact-plot">
          <svg class="impact-chart" viewBox="0 0 1000 350" preserveAspectRatio="none" role="img" aria-labelledby="impact-chart-title impact-chart-desc">
            <title id="impact-chart-title">Время на описание исследований</title><desc id="impact-chart-desc">Пример расчёта. 60 исследований: без ассистента 600 минут, с ассистентом 360 минут. Разница 240 минут в день, или 88 часов за 22 рабочих дня.</desc>
            <g class="impact-grid"><path d="M80 30H800 M80 170H800 M80 310H800"/></g>
            <path class="impact-gap" d="M80 310L800 30L800 142Z"/>
            <g class="impact-series impact-series-manual"><path class="impact-line impact-line-manual" pathLength="1" d="M80 310L800 30"/><circle class="impact-trace impact-trace-manual" data-impact-dot="manual" cx="800" cy="30" r="4"/></g>
            <g class="impact-series impact-series-assisted"><path class="impact-line impact-line-assisted" pathLength="1" d="M80 310L800 142"/><circle class="impact-trace impact-trace-assisted" data-impact-dot="assisted" cx="800" cy="142" r="4"/></g>
          </svg>
          <div class="impact-y-axis" aria-hidden="true"><span>600</span><span>300</span><span>0</span></div>
          <span class="impact-unit" aria-hidden="true">мин</span>
          <div class="impact-x-axis" aria-hidden="true">${[0, 15, 30, 45, studies].map(value => `<span>${value}</span>`).join('')}</div>
        </div>
        <div class="impact-scenarios" role="group" aria-label="Выделить линию на графике"><button class="impact-scenario" data-scenario="manual" aria-pressed="false"><span class="scenario-key">Без NeuroScan</span><strong>600 <span>мин</span></strong><span>10 минут на исследование</span><small>Всё описание — вручную</small></button><button class="impact-scenario" data-scenario="assisted" aria-pressed="false"><span class="scenario-key">С NeuroScan</span><strong>360 <span>мин</span></strong><span>6 минут на исследование</span><small>Врач проверяет подсказки ИИ</small></button></div></div><p class="impact-axis-caption">Исследований за день</p>
      </figure>
      <div class="impact-footer"><p class="impact-assumptions">60 исследований в день · 10 → 6 минут на описание</p><a class="text-link" href="#demo">Обсудить пилот ${arrow}</a></div>
    </div>
  </section>`;
}

export function mountImpact(root) {
  const buttons = root.querySelectorAll('[data-scenario]');
  let selected = '';
  const highlight = value => {
    root.dataset.highlight = value;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === value)));
  };
  buttons.forEach(button => {
    button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') highlight(button.dataset.scenario); });
    button.addEventListener('pointerleave', () => highlight(selected));
    button.addEventListener('focus', () => highlight(button.dataset.scenario));
    button.addEventListener('blur', () => highlight(selected));
    button.addEventListener('click', () => {
      selected = selected === button.dataset.scenario ? '' : button.dataset.scenario;
      highlight(selected);
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape') { selected = ''; highlight(''); }
    });
  });
  const count = root.querySelector('[data-impact-count]');
  const dots = root.querySelectorAll('[data-impact-dot]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  let frame;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    root.classList.add('impact-running');
    const started = performance.now();
    const tick = now => {
      const progress = motion.matches ? 1 : Math.min(1, (now - started) / 1800);
      count.textContent = String(Math.max(1, Math.round(impactData.monthlyHours * progress)));
      dots.forEach(dot => {
        dot.setAttribute('cx', String(80 + 720 * progress));
        dot.setAttribute('cy', String(310 - (dot.dataset.impactDot === 'manual' ? 280 : 168) * progress));
      });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else root.classList.replace('impact-running', 'impact-complete');
    };
    frame = requestAnimationFrame(tick);
  }, { threshold: 0.25 });
  root.classList.add('impact-ready');
  count.textContent = '1';
  observer.observe(root.querySelector('.impact-figure'));
  motion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    cancelAnimationFrame(frame);
    root.classList.remove('impact-ready', 'impact-running');
    count.textContent = String(impactData.monthlyHours);
    dots.forEach(dot => {
      dot.setAttribute('cx', '800');
      dot.setAttribute('cy', dot.dataset.impactDot === 'manual' ? '30' : '142');
    });
  });
}
