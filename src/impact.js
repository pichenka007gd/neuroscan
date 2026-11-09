import { calculateHours, caseAssumptions } from './calculator.js';

export const impactData = Object.freeze({
  studies: 60,
  manualMinutes: 60 * caseAssumptions.minutesPerStudy,
  assistedMinutes: 60 * caseAssumptions.minutesPerStudy * (1 - caseAssumptions.savingRate),
  savedMinutes: 60 * caseAssumptions.minutesPerStudy * caseAssumptions.savingRate,
  monthlyHours: calculateHours(60),
});

const scenarios = {
  manual: { label: 'Без NeuroScan', minutes: impactData.manualMinutes, detail: 'Описание вручную' },
  assisted: { label: 'С NeuroScan', minutes: impactData.assistedMinutes, detail: 'ИИ готовит черновик' },
};

export function impactMarkup() {
  return `<section id="clinics" class="impact-section" data-highlight="assisted" aria-labelledby="impact-title">
    <div class="wrap">
      <div class="impact-heading"><div><p class="eyebrow">Экономика клиники</p><h2 id="impact-title">Меньше рутины.<br><span>Больше времени врачу.</span></h2></div><div class="impact-saving"><span class="saving-caption"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Экономия времени на описании</span><div class="saving-flow"><span><strong>4 часа</strong><small>в день</small></span><svg viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12h34m-8-8 8 8-8 8"/></svg><span><strong>около 90 часов</strong><small>в месяц</small></span></div><span class="saving-note">В среднем при 22 рабочих днях</span></div></div>
      <figure class="impact-figure" aria-labelledby="impact-chart-caption">
        <figcaption id="impact-chart-caption"><span>Время на описание 60 исследований</span><span>Выберите линию</span></figcaption>
        <div class="impact-comparison"><div class="impact-plot">
          <svg class="impact-chart" viewBox="0 0 1000 350" preserveAspectRatio="none" role="group" aria-labelledby="impact-chart-title impact-chart-desc">
            <title id="impact-chart-title">С NeuroScan и без</title><desc id="impact-chart-desc">Пример расчёта. 60 исследований: без ассистента 600 минут, с ассистентом 360 минут. Разница 240 минут в день, или 88 часов за 22 рабочих дня. Наведите на линию или выберите её клавишей Enter.</desc>
            <g class="impact-grid"><path d="M80 30H800 M80 170H800 M80 310H800"/></g>
            <path class="impact-gap" d="M80 310L800 30L800 142Z"/>
            ${Object.entries(scenarios).map(([key, item]) => {
              const y = key === 'manual' ? 30 : 142;
              return `<g class="impact-series impact-series-${key}" data-scenario="${key}" tabindex="0" role="button" aria-label="${item.label}: ${item.minutes} минут" aria-pressed="${key === 'assisted'}"><path class="impact-line impact-line-${key}" pathLength="1" d="M80 310L800 ${y}"/><circle class="impact-trace impact-trace-${key}" data-impact-dot="${key}" cx="800" cy="${y}" r="4"/><path class="impact-hit" d="M80 310L800 ${y}"/></g>`;
            }).join('')}
          </svg>
          <div class="impact-y-axis" aria-hidden="true"><span>600</span><span>300</span><span>0</span></div><span class="impact-unit" aria-hidden="true">мин</span>
          <button class="impact-line-label impact-label-manual" data-scenario="manual" aria-pressed="false">Без NeuroScan</button><button class="impact-line-label impact-label-assisted" data-scenario="assisted" aria-pressed="true">С NeuroScan</button>
          <div class="impact-x-axis" aria-hidden="true">${[0, 15, 30, 45, 60].map(value => `<span>${value}</span>`).join('')}</div>
        </div>
        <div class="impact-readout"><span class="impact-readout-label" data-impact-scenario>С NeuroScan</span><p class="impact-value" aria-hidden="true"><span data-impact-value>360</span><span>минут</span></p><p class="sr-only" data-impact-accessible role="status">С NeuroScan: 360 минут на 60 исследований.</p><span class="impact-detail" data-impact-detail>ИИ готовит черновик</span></div></div>
        <p class="impact-axis-caption">Исследований за день</p>
      </figure>
      <div class="impact-business"><div><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 17V7m0 0h10M4 7l8 8m8-8v10m0 0H10m10 0-8-8"/></svg>Пропускная способность отделения</span><strong>+35%</strong></div><div><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 8 4v6c0 4-5 7-8 9-3-2-8-5-8-9V7Zm-4 9 3 3 5-6"/></svg>Снижение риска врачебной ошибки</span><strong>в 2,5 раза</strong></div><div><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M8 2h8m-4 0v3m7 0 2 2M12 9v5l3 2"/><circle cx="12" cy="14" r="8"/></svg>Окупаемость внедрения в клинику</span><strong>от 3 месяцев</strong></div></div>
    </div>
  </section>`;
}

export function mountImpact(root) {
  const controls = root.querySelectorAll('[data-scenario]');
  const value = root.querySelector('[data-impact-value]');
  const label = root.querySelector('[data-impact-scenario]');
  const detail = root.querySelector('[data-impact-detail]');
  const accessible = root.querySelector('[data-impact-accessible]');
  const dots = root.querySelectorAll('[data-impact-dot]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'assisted';
  let numberFrame = 0;
  let introFrame = 0;
  let observer;
  const choose = key => {
    if (key === selected) return;
    selected = key;
    const item = scenarios[key];
    root.dataset.highlight = key;
    controls.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.scenario === key)));
    label.textContent = item.label;
    detail.textContent = item.detail;
    accessible.textContent = `${item.label}: ${item.minutes} минут на 60 исследований.`;
    cancelAnimationFrame(numberFrame);
    const from = Number(value.textContent);
    const started = performance.now();
    const tick = now => {
      const progress = motion.matches ? 1 : Math.min(1, (now - started) / 420);
      value.textContent = String(Math.round(from + (item.minutes - from) * (1 - (1 - progress) ** 3)));
      numberFrame = progress < 1 ? requestAnimationFrame(tick) : 0;
    };
    if (motion.matches) value.textContent = String(item.minutes);
    else numberFrame = requestAnimationFrame(tick);
  };
  controls.forEach(control => {
    control.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') choose(control.dataset.scenario); });
    control.addEventListener('focus', () => choose(control.dataset.scenario));
    control.addEventListener('click', () => choose(control.dataset.scenario));
    control.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      choose(control.dataset.scenario);
    });
  });
  const finish = () => {
    cancelAnimationFrame(introFrame);
    root.classList.remove('impact-ready', 'impact-running');
    root.classList.add('impact-complete');
    dots.forEach(dot => {
      dot.setAttribute('cx', '800');
      dot.setAttribute('cy', dot.dataset.impactDot === 'manual' ? '30' : '142');
    });
  };
  if (!motion.matches && 'IntersectionObserver' in window) {
    root.classList.add('impact-ready');
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      root.classList.add('impact-running');
      const started = performance.now();
      const tick = now => {
        const progress = Math.min(1, (now - started) / 1400);
        dots.forEach(dot => {
          dot.setAttribute('cx', String(80 + 720 * progress));
          dot.setAttribute('cy', String(310 - (dot.dataset.impactDot === 'manual' ? 280 : 168) * progress));
        });
        if (progress < 1) introFrame = requestAnimationFrame(tick);
        else finish();
      };
      introFrame = requestAnimationFrame(tick);
    }, { threshold: .25 });
    observer.observe(root.querySelector('.impact-figure'));
  } else finish();
  motion.addEventListener('change', event => {
    if (!event.matches) return;
    observer?.disconnect();
    finish();
    cancelAnimationFrame(numberFrame);
    value.textContent = String(scenarios[selected].minutes);
  });
}
