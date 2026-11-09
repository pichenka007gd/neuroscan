import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { brandMark } from '../src/brand.js';

test('brand has one square SVG source, reused by header and footer only', async () => {
  assert.match(brandMark, /width="32" height="32" viewBox="0 0 32 32"/);
  assert.match(brandMark, /M11 4H4v7M21 4h7v7M28 21v7h-7M11 28H4v-7/);
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /import \{ brandMark as logo \} from '\.\/brand.js'/);
  assert.equal((main.match(/\$\{logo\}/g) || []).length, 2);
  assert.doesNotMatch(main, /class="logo-mark"/);
});

test('site carries the requested second-opinion, access, training and security content without fabricated registration', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  for (const copy of ['Сократите время на описание снимков КТ и рентгена', 'на 40%', 'Получить демо-доступ на 14 дней', 'Требуется подтверждение статуса клиники', 'Посмотреть систему в действии', 'Не замена врачу', 'Серверы в РФ', 'ФЗ-152', 'Разметка врачами', 'практикующие врачи-рентгенологи', 'Закажите персональную онлайн-демонстрацию']) {
    assert(main.includes(copy), copy);
  }
  assert.doesNotMatch(main, /Зарегистрированная медицинская|наличие регистрационного удостоверения|ИИ ставит диагноз|робот заменит врача/i);
});
