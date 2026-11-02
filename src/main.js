import './style.css';
import { mountViewer } from './viewer.js';
import { calculateHours, confirmPrototypeLead } from './calculator.js';
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

    <section id="clinics" class="business-section reveal"><div class="wrap business-layout"><div class="business-copy"><p class="eyebrow">Время для самого важного</p><h2>Меньше нагрузки.<br><span>Больше возможностей.</span></h2><div class="segment" role="group" aria-label="Тип клиники"><button type="button" data-segment="public" aria-pressed="true">Госклиника</button><button type="button" data-segment="private" aria-pressed="false">Частный центр</button></div><h3 id="segment-title">Разгрузите отделение, а не врача.</h3><p id="segment-copy" aria-live="polite">Меньше времени на рутинное описание, больше ресурса на сложные исследования и сокращение очереди пациентов.</p><p class="business-note">Сценарий внедрения: пилот на обезличенных исследованиях → оценка врачами → решение о подключении.</p></div><div class="calculator"><div class="calculator-top"><span class="eyebrow">Потенциал вашего отделения</span><span aria-hidden="true">↗</span></div><label for="scans">Исследований в день <output id="scans-output" for="scans">60</output></label><input id="scans" type="range" min="10" max="200" step="5" value="60"><div class="range-ends"><span>10 исследований</span><span>200 исследований</span></div><div class="calculation-result"><span>До</span><output id="hours" for="scans">88</output><span>часов в месяц<br>для работы с пациентами</span></div><p class="calculator-formula">60 × 10 мин × 40% × 22 дня ÷ 60</p><p class="microcopy">Модель, не прогноз: 10 минут на описание, экономия 40%, 22 рабочих дня. Фактический эффект определяется на пилоте.</p><a class="text-link" href="#demo">Обсудить пилот для клиники ${arrow}</a></div></div></section>

    <section id="security" class="section wrap reveal" aria-labelledby="security-title"><div class="security-layout"><div><p class="eyebrow">Доверие начинается с прозрачности</p><h2 id="security-title">Ответственность.<br><span>По умолчанию.</span></h2><p class="security-intro">Медицинский ИИ требует не громких обещаний, а проверяемых результатов и контроля данных.</p><div class="security-note">Учебный концепт, не сертифицированный медицинский сервис. Регистрационные документы предоставляются до внедрения.</div></div><div class="security-list"><article><span class="security-icon" aria-hidden="true">⌁</span><div><h3>Закрытый контур</h3><p>В проекте предусмотрены VPN, обезличивание исследований и хранение на территории РФ. Архитектура и соответствие требованиям проверяются до запуска.</p></div></article><article><span class="security-icon" aria-hidden="true">+</span><div><h3>Контроль врача на каждом этапе</h3><p>Подсказки алгоритма не являются диагнозом. Окончательное заключение формирует и подписывает специалист.</p></div></article><article><span class="security-icon" aria-hidden="true">↗</span><div><h3>Цифры, которым нужен контекст</h3><p>Показатели ниже взяты из условий кейса. Это не результаты проведённого нами клинического исследования.</p></div></article></div></div><div class="metrics"><div><strong>94,8<span>%</span></strong><span>Чувствительность <sup>2</sup></span></div><div><strong>92,1<span>%</span></strong><span>Специфичность <sup>2</sup></span></div><div><strong>+35<span>%</span></strong><span>Пропускная способность <sup>2</sup></span></div><p>Вводные учебного кейса.<br>Не клиническая гарантия.</p></div></section>

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

const segmentCopy = {
  public: ['Разгрузите отделение, а не врача.', 'Меньше времени на рутинное описание, больше ресурса на сложные исследования и сокращение очереди пациентов.'],
  private: ['Больше внимания каждому пациенту.', 'Сократите ожидание заключений и оцените потенциал отделения без увеличения рутинной нагрузки на специалистов.'],
};
mountShowcase(document.querySelector('.showcase'));
mountStoryCards(document.querySelectorAll('.process-card'));
document.querySelectorAll('[data-segment]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-segment]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const [title, copy] = segmentCopy[button.dataset.segment];
    document.querySelector('#segment-title').textContent = title;
    document.querySelector('#segment-copy').textContent = copy;
  });
});

const scans = document.querySelector('#scans');
scans.addEventListener('input', () => {
  const value = Number(scans.value);
  document.querySelector('#scans-output').value = value;
  document.querySelector('#hours').value = calculateHours(value);
  document.querySelector('.calculator-formula').textContent = `${value} × 10 мин × 40% × 22 дня ÷ 60`;
  scans.style.setProperty('--range-progress', `${(value - 10) / 190 * 100}%`);
});
scans.dispatchEvent(new Event('input'));

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
