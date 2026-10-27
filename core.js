/* Чистые функции без DOM: используются сайтом и проверками в Node.js. */
(function (root) {
  'use strict';
  function countdown(target, now = Date.now()) {
    const total = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
    return { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24,
      minutes: Math.floor(total / 60) % 60, seconds: total % 60, finished: total === 0 };
  }
  function calendarRows(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells = Array.from({ length: Math.ceil((last + offset) / 7) * 7 }, (_, i) => {
      const number = i - offset + 1;
      return number < 1 || number > last ? null : { day: number, selected: number === day };
    });
    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  }
  function normalizedReply(data) {
    const attending = data.attendance === 'yes';
    return {
      name: String(data.name || '').trim(), phone: String(data.phone || '').trim(),
      attendance: attending ? 'С радостью буду' : 'К сожалению, не смогу',
      guests: attending ? String(data.guests || '1') : '0',
      companions: attending && Number(data.guests) > 1 ? String(data.companions || '').trim() : '',
      drinks: attending ? (data.drinks || []).join(', ') : '',
      wishes: String(data.wishes || '').trim()
    };
  }
  function replyText(data, config) {
    const r = normalizedReply(data);
    const lines = [`Ответ на приглашение: ${config.groom} и ${config.bride}`, `Дата: ${config.date.split('-').reverse().join('.')}`, '', `Имя: ${r.name}`, `Участие: ${r.attendance}`];
    if (r.phone) lines.push(`Телефон: ${r.phone}`);
    if (data.attendance === 'yes') {
      lines.push(`Гостей, включая меня: ${r.guests === '6' ? '6 и больше' : r.guests}`);
      if (r.companions) lines.push(`Будут со мной: ${r.companions}`);
      if (r.drinks) lines.push(`Напитки: ${r.drinks}`);
    }
    if (r.wishes) lines.push(`Пожелания: ${r.wishes}`);
    return lines.join('\n');
  }
  const escapeICS = text => String(text).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const utcStamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  // RFC 5545: максимум 75 октетов в строке, без разрыва UTF-8 символов.
  function foldLine(line) {
    const encoder = new TextEncoder();
    let result = '', bytes = 0;
    for (const char of line) {
      const length = encoder.encode(char).length;
      if (bytes + length > 75) { result += '\r\n '; bytes = 1; }
      result += char; bytes += length;
    }
    return result;
  }
  function calendarFile(config, now = new Date()) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:wedding-${config.date}@invitation.local`, `DTSTAMP:${utcStamp(now)}`, `DTSTART:${utcStamp(config.startsAt)}`];
    if (config.endsAt) lines.push(`DTEND:${utcStamp(config.endsAt)}`);
    lines.push(`SUMMARY:${escapeICS(`Свадьба — ${config.groom} и ${config.bride}`)}`,
      `LOCATION:${escapeICS(config.ceremony.name + ', ' + config.ceremony.address)}`,
      `DESCRIPTION:${escapeICS(`Сбор гостей: ${config.ceremony.time}, ${config.ceremony.name}. Праздничный ужин: ${config.reception.time}, ${config.reception.name}.`)}`,
      'END:VEVENT', 'END:VCALENDAR');
    return lines.map(foldLine).join('\r\n') + '\r\n';
  }
  const api = { countdown, calendarRows, normalizedReply, replyText, calendarFile, foldLine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WeddingUtils = api;
})(typeof window !== 'undefined' ? window : globalThis);
