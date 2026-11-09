import './style.css';
import './showcase-effects.css';
import './revision.css';
import { mountViewer } from './viewer.js';
import { confirmPrototypeLead } from './calculator.js';
import { impactMarkup, mountImpact } from './impact.js';
import { processCards, showcaseMarkup, mountShowcase, mountStoryCards } from './showcase.js';

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const logo = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M12 3H5v7M20 3h7v7M27 22v7h-7M12 29H5v-7" stroke="currentColor" stroke-width="1.6"/><path d="M16 8v16M8 16h16" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="16" r="7" stroke="currentColor" stroke-opacity=".35"/></svg>';
const scanIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m8 0h4a1 1 0 0 0 1-1v-4M7 12h10"/><circle cx="12" cy="12" r="3"/></svg>';

document.querySelector('#app').innerHTML = `
  <a class="skip-link" href="#main">К содержанию</a>
  <div class="ambient" aria-hidden="true"></div>
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
          <h1 id="hero-title">Второе мнение.<br><span>Больше<br class="desktop-break"> уверенности.</span></h1>
          <p class="hero-description">Зоны внимания на снимке.<br>Черновик заключения под вашим контролем.</p>
          <div class="hero-actions"><a class="button button-primary" href="#scan-viewer">Посмотреть анализ ${arrow}</a><a class="text-link" href="#demo">Обсудить внедрение</a></div>
        </div>
        <div class="hero-visual"><div id="scan-viewer" aria-label="Интерактивная демонстрация томографического объёма"><p class="viewer-loading">Загрузка исследования…</p></div></div>
      </div>
    </section>

    <section id="technology" class="section wrap reveal" aria-labelledby="technology-title">
      <div class="section-heading"><h2 id="technology-title">От снимка<br><span>к заключению.</span></h2></div>
      <div class="process">${processCards()}</div>
    </section>

    ${showcaseMarkup()}

    ${impactMarkup(arrow)}

    <section id="security" class="section wrap reveal" aria-labelledby="security-title">
      <div class="security-layout"><div><p class="eyebrow">Безопасность</p><h2 id="security-title">Технология помогает.<br><span>Решает врач.</span></h2></div>
      <div class="security-list">
        <article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 7 51 15v14c0 13-9 22-19 28C22 51 13 42 13 29V15Z"/><rect x="24" y="28" width="16" height="14" rx="3"/><path d="M28 28v-5a4 4 0 0 1 8 0v5"/><circle class="security-pulse" cx="32" cy="35" r="2"/></svg></div><div><h3>Данные под контролем</h3><p>Размещение и доступ согласуются с клиникой до подключения.</p></div></article>
        <article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="15" y="9" width="34" height="46" rx="5"/><path d="M23 19h18M23 26h12M23 34h7"/><path class="security-draw" d="m26 43 5 5 12-13"/></svg></div><div><h3>Заключение проверяет врач</h3><p>Подсказки ИИ можно изменить. Подпись ставит специалист.</p></div></article>
        <article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12v40h42"/><path class="security-draw" d="m19 41 11-12 10 5 13-17"/><circle class="security-pulse" cx="40" cy="34" r="3"/></svg></div><div><h3>Проверка на пилоте</h3><p>Точность и экономию времени оценивают на задачах отделения.</p></div></article>
      </div></div>
    </section>

    <section id="demo" class="demo-section wrap reveal" aria-labelledby="demo-title">
      <div class="demo-copy"><p class="eyebrow">Для клиник</p><h2 id="demo-title">Начните<br><span>со знакомства.</span></h2><p>Обсудим задачи вашего отделения.</p><span class="demo-notice">Демонстрационная форма. Данные не отправляются.</span></div>
      <form id="lead-form" class="lead-form">
        <div class="form-row"><label>Ваше имя<input name="name" autocomplete="given-name" required maxlength="80" placeholder="Как к вам обращаться"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel" required minlength="7" maxlength="25" pattern="[+0-9 \\(\\)−–\\-]{7,25}" placeholder="+7 (___) ___-__-__"></label></div>
        <label>Клиника и должность<input name="clinic" autocomplete="organization" required maxlength="160" placeholder="Название клиники, ваша роль"></label>
        <label>Корпоративный email<input name="email" type="email" autocomplete="email" required maxlength="160" placeholder="name@clinic.ru"></label>
        <label class="consent"><input name="consent" type="checkbox" required><span>Согласен с <a href="#privacy">условиями формы</a>.</span></label>
        <button class="button button-primary" type="submit">Посмотреть систему в действии ${arrow}</button><p id="form-status" class="form-status" role="status" hidden></p><button class="reset-form" type="reset">Очистить поля</button>
      </form>
    </section>
  </main>
  <footer class="footer wrap"><div class="footer-top"><a class="brand" href="#">${logo}<span>NeuroScan</span></a><a href="#main">Наверх ↑</a></div><div class="footer-notes"><p>Демонстрационный интерфейс. Анализ и расчёты иллюстративны, не предназначены для диагностики.</p><p id="privacy">Форма не отправляет и не сохраняет данные. Не вводите реальные персональные сведения.</p></div><div class="footer-bottom"><span>© 2026 NeuroScan</span><span>Решение остаётся за врачом.</span></div></footer>
`;

mountShowcase(document.querySelector('.showcase'));
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
