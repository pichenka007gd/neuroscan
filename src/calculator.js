export function calculateHours(scansPerDay) {
  if (!Number.isFinite(scansPerDay) || scansPerDay < 0) {
    throw new RangeError('Количество исследований должно быть неотрицательным числом');
  }
  return Math.round(scansPerDay * 10 * 0.4 * 22 / 60);
}

export function confirmPrototypeLead(event, form, status) {
  event.preventDefault();
  if (!form.reportValidity()) return false;
  status.textContent = 'Макет: данные не отправлены. В рабочей версии здесь появится подтверждение заявки. Вы можете очистить заполненные поля кнопкой ниже.';
  status.hidden = false;
  return true;
}
