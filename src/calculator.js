export const caseAssumptions = Object.freeze({ minutesPerStudy: 10, savingRate: 0.4, workdays: 22 });

export function calculateHours(scansPerDay) {
  if (!Number.isFinite(scansPerDay) || scansPerDay < 0) {
    throw new RangeError('Количество исследований должно быть неотрицательным числом');
  }
  const { minutesPerStudy, savingRate, workdays } = caseAssumptions;
  return Math.round(scansPerDay * minutesPerStudy * savingRate * workdays / 60);
}

export function confirmPrototypeLead(event, form, status) {
  event.preventDefault();
  if (!form.reportValidity()) return false;
  status.textContent = 'Макет: данные не отправлены. В рабочей версии здесь появится подтверждение заявки. Вы можете очистить заполненные поля кнопкой ниже.';
  status.hidden = false;
  return true;
}
