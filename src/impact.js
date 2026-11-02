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
        <div><p class="eyebrow">Для клиник / время в масштабе дня</p><h2 id="impact-title">Верните время<br><span>врачу.</span></h2><p class="impact-intro">Меньше рутинного описания.<br>Больше внимания сложным случаям.</p></div>
        <div class="impact-stat"><span class="impact-model-label">МОДЕЛЬ ПО УСЛОВИЯМ КЕЙСА</span><p class="impact-number"><span data-impact-count aria-hidden="true">${monthlyHours}</span><span class="sr-only">${monthlyHours} часов</span><span aria-hidden="true">часов</span></p><p>в месяц вне рутины</p><span class="impact-daily">${savedMinutes} минут в день при ${studies} исследованиях</span></div>
      </div>
      <figure class="impact-figure" aria-labelledby="impact-chart-caption">
        <figcaption id="impact-chart-caption"><span>Накопленное время на описание</span><span>Один рабочий день</span></figcaption>
        <div class="impact-plot">
          <svg class="impact-chart" viewBox="0 0 1000 350" preserveAspectRatio="none" role="img" aria-labelledby="impact-chart-title impact-chart-desc">
            <title id="impact-chart-title">Модель рутинной нагрузки за день</title><desc id="impact-chart-desc">60 исследований: без ассистента 600 минут, с ассистентом 360 минут. Разница 240 минут в день, или 88 часов за 22 рабочих дня. Допущения: 10 минут на описание и снижение времени на 40 процентов. Это модель учебного кейса, не клинический результат и не прогноз.</desc>
            <g class="impact-grid"><path d="M80 30H800 M80 170H800 M80 310H800"/></g>
            <path class="impact-gap" d="M80 310L800 30L800 142Z"/>
            <path class="impact-line impact-line-manual" pathLength="1" d="M80 310L800 30"/>
            <path class="impact-line impact-line-assisted" pathLength="1" d="M80 310L800 142"/>
            <circle class="impact-trace impact-trace-manual" data-impact-dot="manual" cx="800" cy="30" r="4"/>
            <circle class="impact-trace impact-trace-assisted" data-impact-dot="assisted" cx="800" cy="142" r="4"/>
          </svg>
          <div class="impact-y-axis" aria-hidden="true"><span>600</span><span>300</span><span>0</span></div>
          <span class="impact-unit" aria-hidden="true">мин</span>
          <div class="impact-end impact-end-manual" aria-hidden="true"><strong>${manualMinutes} мин</strong><span>Без ассистента</span></div>
          <div class="impact-end impact-end-assisted" aria-hidden="true"><strong>${assistedMinutes} мин</strong><span>С NeuroScan</span></div>
          <div class="impact-x-axis" aria-hidden="true">${[0, 15, 30, 45, studies].map(value => `<span>${value}</span>`).join('')}</div>
        </div>
        <p class="impact-axis-caption">Исследований за день</p>
      </figure>
      <div class="impact-footer"><div><p class="impact-assumptions">60 исследований/день · 10 мин/описание · 22 дня · модель −40%</p><p class="impact-disclaimer">Модель, не прогноз и не клинический результат. Фактический эффект проверяется на пилоте.</p></div><a class="text-link" href="#demo">Обсудить пилот ${arrow}</a></div>
    </div>
  </section>`;
}

export function mountImpact(root) {
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
