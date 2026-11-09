import './style.css';
import './showcase-effects.css';
import './revision.css';
import { mountViewer } from './viewer.js';
import { confirmPrototypeLead } from './calculator.js';
import { impactMarkup, mountImpact } from './impact.js';
import { brandMark as logo } from './brand.js';
import { mountSpotlight } from './spotlight.js';
import { processCards, showcaseMarkup, mountShowcase, mountStoryCards } from './showcase.js';

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const scanIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3H4v5a5 5 0 0 0 10 0V3h-2M9 13v3a4 4 0 0 0 8 0v-3"/></svg>';

document.querySelector('#app').innerHTML = `
  <a class="skip-link" href="#main">К содержанию</a>
  <div class="ambient" aria-hidden="true"></div>
  <div class="cursor-glow" aria-hidden="true"></div>
  <header class="header wrap">
    <a class="brand" href="#" aria-label="NeuroScan, на главную">${logo}<span>NeuroScan</span></a>
    <nav class="navigation" aria-label="Основная навигация">
      <a href="#technology">Технология</a><a href="#security">Безопасность</a><a href="#clinics">Для клиник</a>
    </nav>
    <a class="button button-small button-outline header-cta" href="#demo">Получить демо ${arrow}</a>
  </header>
  <main id="main">
    <section class="hero wrap" aria-labelledby="hero-title">
      <div class="hero-top"><span class="eyebrow hero-badge">${scanIcon} ИИ-ассистент врача-рентгенолога</span></div>
      <div class="hero-layout">
        <div class="hero-copy">
          <h1 id="hero-title">Сократите время на описание снимков КТ и рентгена <span>на 40%</span> с помощью продукта «NeuroScan»</h1>
          <p class="hero-positioning">AI-Радиолог: Второе мнение для региональной медицины</p>
          <p class="hero-description">Цель модели: находить до 95% скрытых патологий и автоматически готовить черновик заключения. Решение принимает врач-рентгенолог.</p>
          <div class="hero-actions"><a class="button button-primary" href="#demo">Получить демо-доступ на 14 дней ${arrow}</a><a class="text-link" href="#scan-viewer">Посмотреть систему в действии</a></div>
          <p class="hero-access-note">Требуется подтверждение статуса клиники</p>
        </div>
        <div class="hero-visual"><div id="scan-viewer" aria-label="Интерактивная демонстрация томографического объёма"><p class="viewer-loading">Загрузка исследования…</p></div></div>
      </div>
    </section>

    <section id="technology" class="section reveal" aria-labelledby="technology-title">
      <div class="process-band"><div class="wrap"><h2 id="technology-title">От снимка <span>к заключению.</span></h2></div></div>
      <div class="wrap"><div class="process">${processCards()}</div></div>
    </section>

    ${showcaseMarkup()}

    ${impactMarkup()}

    <section id="security" class="section wrap reveal" aria-labelledby="security-title">
      <div class="security-layout"><div class="security-heading"><div><p class="eyebrow">Доверие. Точность. Безопасность.</p><h2 id="security-title">Второе мнение.<br><span>Не замена врачу.</span></h2></div><div class="security-caption"><p class="security-flow-title">Как защищаются данные пациента</p><div class="security-flow" role="group" aria-label="Снимок обезличивается перед отправкой на сервер в РФ"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H5v20h14V7Zm0 0v5h5M8 12h8M8 16h6"/></svg>Снимок</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 12h17m-6-6 6 6-6 6"/></svg><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 7l5 5m0-5-5 5"/></svg>Обезличивание</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 12h17m-6-6 6 6-6 6"/></svg><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6v1m0 10v1M11 6h6m-6 11h6"/></svg>Сервер в РФ</span></div><p class="security-flow-note">Имена и контакты удаляются до передачи снимка.</p><p class="security-targets">Целевые показатели модели</p><dl class="security-quality"><div><dt>Чувствительность</dt><dd>94,8%</dd></div><div><dt>Специфичность</dt><dd>92,1%</dd></div></dl></div></div>
      <div class="security-list">
        <article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 7 51 15v14c0 13-9 22-19 28C22 51 13 42 13 29V15Z"/><rect x="24" y="28" width="16" height="14" rx="3"/><path d="M28 28v-5a4 4 0 0 1 8 0v5"/><circle class="security-pulse" cx="32" cy="35" r="2"/></svg></div><div><h3>Серверы в РФ</h3><p>Обезличивание снимков, доступ по ролям и защищённый канал. Требования к обработке данных: ФЗ-152.</p></div></article>
        <article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="15" y="9" width="34" height="46" rx="5"/><path d="M23 19h18M23 26h12M23 34h7"/><path class="security-draw" d="m26 43 5 5 12-13"/></svg></div><div><h3>Разметка врачами</h3><p>Обучающую выборку размечают практикующие врачи-рентгенологи. Качество разметки проверяют специалисты.</p></div></article>
        <article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="26" cy="19" r="9"/><path d="M10 53v-7a16 16 0 0 1 30-7"/><path class="security-draw" d="m38 45 6 6 12-15"/></svg></div><div><h3>Контроль специалиста</h3><p>ИИ формирует предварительное описание. Врач проверяет, редактирует и подписывает заключение.</p></div></article>
      </div></div>
    </section>

    <section id="demo" class="demo-section wrap reveal" aria-labelledby="demo-title">
      <div class="demo-copy"><p class="eyebrow">Для клиник</p><h2 id="demo-title">Закажите персональную онлайн-демонстрацию <span>для вашей клиники</span></h2><p>Обсудим задачи вашего отделения.</p><span class="demo-notice">Демонстрационная форма. Данные не отправляются.</span></div>
      <form id="lead-form" class="lead-form">
        <div class="form-row"><label>Имя<input name="name" autocomplete="given-name" required maxlength="80" placeholder="Как к вам обращаться"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel" required minlength="7" maxlength="25" pattern="[+0-9 \\(\\)−–\\-]{7,25}" placeholder="+7 (___) ___-__-__"></label></div>
        <label>Название клиники/Должность<input name="clinic" autocomplete="organization" required maxlength="160" placeholder="Название клиники, ваша роль"></label>
        <label>Корпоративный Email<input name="email" type="email" autocomplete="email" required maxlength="160" placeholder="name@clinic.ru"></label>
        <label class="consent"><input name="consent" type="checkbox" required><span>Согласен с <a href="#privacy">условиями формы</a>.</span></label>
        <button class="button button-primary" type="submit">Посмотреть систему в действии ${arrow}</button><p id="form-status" class="form-status" role="status" hidden></p><button class="reset-form" type="reset">Очистить поля</button>
      </form>
    </section>
  </main>
  <footer class="footer wrap"><div class="footer-top"><a class="brand" href="#">${logo}<span>NeuroScan</span></a><a href="#main">Наверх ↑</a></div><div class="footer-notes"><p>Демонстрационный интерфейс. Показатели описывают целевую модель продукта; анализ и расчёты иллюстративны, не предназначены для диагностики.</p><p id="privacy">Медицинские данные на сайте не обрабатываются. Форма не отправляет и не сохраняет данные.</p></div><div class="footer-bottom"><span>© 2026 NeuroScan</span><span>Решение остаётся за врачом.</span></div></footer>
`;

mountShowcase(document.querySelector('.showcase'));
mountSpotlight(document.querySelector('.cursor-glow'));
mountStoryCards(document.querySelectorAll('.process-card'));
mountImpact(document.querySelector('#clinics'));

const form = document.querySelector('#lead-form');
const formStatus = document.querySelector('#form-status');
form.addEventListener('submit', event => confirmPrototypeLead(event, form, formStatus));
form.addEventListener('reset', () => { formStatus.hidden = true; formStatus.textContent = ''; });

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

try {
  await mountViewer(document.querySelector('#scan-viewer'));
} catch (error) {
  console.error('Не удалось запустить просмотр томографического объёма:', error);
  const message = document.createElement('p');
  message.className = 'viewer-error';
  message.setAttribute('role', 'alert');
  message.textContent = 'Не удалось загрузить томографический объём. Обновите страницу или попробуйте браузер с поддержкой WebGL.';
  document.querySelector('#scan-viewer').replaceChildren(message);
}
