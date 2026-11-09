import './style.css';
import './showcase-effects.css';
import './revision.css';
import { mountViewer } from './viewer.js';
import { confirmPrototypeLead } from './calculator.js';
import { impactMarkup, mountImpact } from './impact.js';
import { processCards, showcaseMarkup, mountShowcase, mountStoryCards } from './showcase.js';

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const logo = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M12 3H5v7M20 3h7v7M27 22v7h-7M12 29H5v-7" stroke="currentColor" stroke-width="1.6"/><path d="M16 8v16M8 16h16" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="16" r="7" stroke="currentColor" stroke-opacity=".35"/></svg>';

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
      <div class="hero-top"><span class="eyebrow"><span class="status-dot"></span> ИИ-ассистент радиолога</span><span class="hero-coordinate">ВНИМАНИЕ К ДЕТАЛЯМ. ЗАБОТА О ЧЕЛОВЕКЕ.</span></div>
      <div class="hero-layout">
        <div class="hero-copy">
          <h1 id="hero-title">Второе мнение.<br><span>Больше<br class="desktop-break"> уверенности.</span></h1>
          <p class="hero-description">На <strong>40% меньше времени</strong> на описание снимков.<sup>1</sup> Больше внимания тому, что действительно важно.</p>
          <p class="hero-explanation">NeuroScan отмечает зоны внимания и готовит черновик заключения. Решение принимает врач.</p>
          <div class="hero-actions"><a class="button button-primary" href="#demo">Попробовать 14 дней ${arrow}</a><a class="text-link" href="#scan-viewer">Посмотреть анализ <span aria-hidden="true">↗</span></a></div>
          <p class="microcopy">Демо для клиник · Требуется подтверждение статуса</p>
          <div class="hero-proof"><div><span class="proof-symbol" aria-hidden="true">+</span><span>Не заменяет врача.<br><strong>Помогает увидеть больше.</strong></span></div><span class="prototype-label">КОНЦЕПТ / 2026</span></div>
        </div>
        <div class="hero-visual"><div class="visual-caption"><span><span class="status-dot"></span> NEUROSCAN VISION</span><span>ИНТЕРАКТИВНАЯ ТОМОГРАФИЯ</span></div><div id="scan-viewer" aria-label="Интерактивная демонстрация томографического объёма"><p class="viewer-loading">Подготавливаем визуализацию томографического объёма…</p></div><div class="visual-footnote"><span>Томографические данные. Условная разметка.</span><span>Не для диагностики</span></div></div>
      </div>
      <div class="hero-bottom"><span>МЕНЬШЕ РУТИНЫ. БОЛЬШЕ КЛИНИЧЕСКОГО ВНИМАНИЯ.</span><span class="scroll-cue">Исследуйте возможности <span aria-hidden="true">↓</span></span></div>
    </section>

    <section id="technology" class="section wrap reveal" aria-labelledby="technology-title">
      <div class="section-heading"><p class="eyebrow">В привычном процессе</p><h2 id="technology-title">От снимка к решению.<br><span>Врач остаётся главным.</span></h2><p>Один дополнительный взгляд между исследованием и заключением. Без смены привычной логики работы.</p></div>
      <div class="process">${processCards()}</div>
    </section>

    ${showcaseMarkup()}

    ${impactMarkup(arrow)}

    <section id="security" class="section wrap reveal" aria-labelledby="security-title"><div class="security-layout"><div><p class="eyebrow">Доверие начинается с прозрачности</p><h2 id="security-title">Ответственность.<br><span>По умолчанию.</span></h2><p class="security-intro">Медицинский ИИ требует не громких обещаний, а проверяемых результатов и контроля данных.</p><div class="security-note">Учебный концепт, не сертифицированный медицинский сервис. Регистрационные документы предоставляются до внедрения.</div></div><div class="security-list"><article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 7 51 15v14c0 13-9 22-19 28C22 51 13 42 13 29V15Z"/><rect x="24" y="28" width="16" height="14" rx="3"/><path d="M28 28v-5a4 4 0 0 1 8 0v5"/><circle class="security-pulse" cx="32" cy="35" r="2"/></svg></div><div><h3>Закрытый контур</h3><p>В проекте предусмотрены VPN, обезличивание исследований и хранение на территории РФ. Архитектура и соответствие требованиям проверяются до запуска.</p></div></article><article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="15" y="9" width="34" height="46" rx="5"/><path d="M23 19h18M23 26h12M23 34h7"/><path class="security-draw" d="m26 43 5 5 12-13"/></svg></div><div><h3>Контроль врача на каждом этапе</h3><p>Подсказки алгоритма не являются диагнозом. Окончательное заключение формирует и подписывает специалист.</p></div></article><article tabindex="0"><div class="security-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12v40h42"/><path class="security-draw" d="m19 41 11-12 10 5 13-17"/><circle class="security-pulse" cx="40" cy="34" r="3"/></svg></div><div><h3>Цифры, которым нужен контекст</h3><p>Показатели ниже взяты из условий кейса. Это не результаты проведённого нами клинического исследования.</p></div></article></div></div><div class="metrics"><div><strong>94,8<span>%</span></strong><span>Замечает изменения <sup>2</sup></span><p>Доля случаев с изменениями, которые алгоритм находит. Вводная кейса: 94,8 из 100.</p><span class="metric-term">Чувствительность</span></div><div><strong>92,1<span>%</span></strong><span>Верно распознаёт норму <sup>2</sup></span><p>Доля случаев без изменений, которые алгоритм не помечает как подозрительные.</p><span class="metric-term">Специфичность</span></div><div><strong>+35<span>%</span></strong><span>Больше исследований за день <sup>2</sup></span><p>Ожидаемый рост числа описанных исследований при той же нагрузке на команду.</p><span class="metric-term">Пропускная способность</span></div><p>Все три показателя взяты из учебного задания. На этом сайте они не измерялись и не подтверждены клиническими испытаниями.</p></div></section>

    <section id="demo" class="demo-section wrap reveal" aria-labelledby="demo-title">
      <div class="demo-copy"><p class="eyebrow"><span class="status-dot"></span> Начните со знакомства</p><h2 id="demo-title">Увидеть больше.<br><span>Начать с демо.</span></h2><p>Обсудим задачи отделения и сценарий пилота на 14 дней. Без обещаний, которые нельзя проверить.</p><span class="demo-notice">Интерактивный макет: форма ничего не отправляет. Не вводите реальные персональные данные.</span></div>
      <form id="lead-form" class="lead-form">
        <div class="form-row"><label>Ваше имя<input name="name" autocomplete="given-name" required maxlength="80" placeholder="Как к вам обращаться"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel" required minlength="7" maxlength="25" pattern="[+0-9 \\(\\)−–\\-]{7,25}" placeholder="+7 (___) ___-__-__"></label></div>
        <label>Клиника и должность<input name="clinic" autocomplete="organization" required maxlength="160" placeholder="Название клиники, ваша роль"></label>
        <label>Корпоративный email<input name="email" type="email" autocomplete="email" required maxlength="160" placeholder="name@clinic.ru"></label>
        <label class="consent"><input name="consent" type="checkbox" required><span>Я ознакомился с <a href="#privacy">условиями демонстрационной формы</a> и понимаю, что данные не отправляются.</span></label>
        <button class="button button-primary" type="submit">Посмотреть систему в действии ${arrow}</button><p id="form-status" class="form-status" role="status" hidden></p><button class="reset-form" type="reset">Очистить поля</button>
      </form>
    </section>
  </main>
  <footer class="footer wrap"><div class="footer-top"><a class="brand" href="#">${logo}<span>NeuroScan</span></a><span>Технология помогает. Решает человек.</span><a href="#main">Наверх ↑</a></div><div class="footer-notes"><p><sup>1</sup> Снижение времени на 40% и ориентир чувствительности 95% являются вводными учебного кейса, а не подтверждёнными характеристиками продукта. <sup>2</sup> 94,8%, 92,1% и +35% также приведены в задании; независимая валидация отсутствует.</p><p id="privacy">Демонстрационная форма работает только в браузере: введённые данные не отправляются и не сохраняются в localStorage. Реальные персональные и медицинские данные вводить не следует.</p></div><div class="footer-bottom"><span>© 2026 NeuroScan · Учебный прототип</span><span>Не медицинское изделие. Не для постановки диагноза.</span></div></footer>
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
