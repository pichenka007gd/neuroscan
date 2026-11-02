import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateHours, confirmPrototypeLead } from '../src/calculator.js';

test('calculator uses 10 minutes, 40 percent and 22 workdays', () => {
  assert.equal(calculateHours(60), 88);
  assert.equal(calculateHours(0), 0);
  assert.equal(calculateHours(10), 15);
  assert.equal(calculateHours(200), 293);
});

test('calculator rejects negative and non-finite values', () => {
  for (const value of [-1, NaN, Infinity, '60']) {
    assert.throws(() => calculateHours(value), RangeError);
  }
});

test('valid form prevents submission and explicitly confirms no data was sent', () => {
  let prevented = false;
  const status = { hidden: true, textContent: '' };
  const accepted = confirmPrototypeLead({ preventDefault() { prevented = true; } }, { reportValidity: () => true }, status);
  assert.equal(accepted, true);
  assert.equal(prevented, true);
  assert.equal(status.hidden, false);
  assert.match(status.textContent, /Макет: данные не отправлены/);
});

test('invalid form never shows a successful confirmation', () => {
  const status = { hidden: true, textContent: '' };
  assert.equal(confirmPrototypeLead({ preventDefault() {} }, { reportValidity: () => false }, status), false);
  assert.equal(status.hidden, true);
  assert.equal(status.textContent, '');
});

test('lead handling contains no network or persistent personal data writes', async () => {
  const source = await readFile(new URL('../src/calculator.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage)\b/);
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /\b(fetch|XMLHttpRequest|sendBeacon)\s*\(|\b(localStorage|sessionStorage)\s*\.\s*(setItem|getItem|removeItem|clear)\s*\(/);
  assert.match(main, /name="consent" type="checkbox" required/);
});

test('phone pattern compiles with browser Unicode sets and accepts formatted numbers', async () => {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const pattern = JSON.parse(`"${source.match(/pattern="([^"]+)"/)[1]}"`);
  const expression = new RegExp(`^(?:${pattern})$`, 'v');
  assert.equal(expression.test('+7 (999) 123-45-67'), true);
  assert.equal(expression.test('not a phone'), false);
});
