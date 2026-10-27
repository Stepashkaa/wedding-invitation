const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { countdown, calendarRows, normalizedReply, replyText, calendarFile } = require('../core.js');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../config.js'), 'utf8'), sandbox);
const config = sandbox.window.WEDDING_CONFIG;

test('Дата свадьбы — пятница; календарь начинается с понедельника', () => {
  const rows = calendarRows('2027-07-02');
  assert.equal(rows.flat().filter(Boolean).length, 31);
  assert.equal(rows[0][3].day, 1);
  assert.equal(rows[0][4].day, 2);
  assert.equal(rows[0][4].selected, true);
  assert.equal(rows.flat().filter(cell => cell?.selected).length, 1);
});
test('Календарь корректно строится для високосного февраля и шести недель', () => {
  assert.equal(calendarRows('2028-02-29').flat().filter(Boolean).length, 29);
  assert.equal(calendarRows('2026-08-31').length, 6);
});
test('Обратный отсчёт учитывает +04:00 и не уходит в минус', () => {
  assert.deepEqual(countdown(config.startsAt, Date.parse('2027-07-01T08:28:57Z')), { days: 1, hours: 1, minutes: 1, seconds: 3, finished: false });
  assert.deepEqual(countdown(config.startsAt, Date.parse('2027-07-03T00:00:00Z')), { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true });
});
test('ICS содержит реальное UTC-время, CRLF и строки не длиннее 75 байт', () => {
  const ics = calendarFile(config, new Date('2026-10-18T10:00:00Z'));
  assert.ok(ics.includes('DTSTART:20270702T093000Z\r\n'));
  assert.ok(ics.includes('DTSTAMP:20261018T100000Z\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!ics.includes('DTEND:'));
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.ok(ics.replace(/\r\n /g, '').includes('Свадьба — Олег и Анастасия'));
});
test('ICS экранирует пользовательский текст и поддерживает завершение события', () => {
  const text = calendarFile({ ...config, groom: 'Имя; фамилия, строка\nдва', endsAt: '2027-07-02T23:00:00+04:00' }).replace(/\r\n /g, '');
  assert.ok(text.includes('Имя\\; фамилия\\, строка\\nдва'));
  assert.ok(text.includes('DTEND:20270702T190000Z'));
});
test('Отказ не отправляет старые значения числа гостей, попутчиков и напитков', () => {
  const data = { name: '  Анна  ', attendance: 'no', guests: '4', companions: 'Иван', drinks: ['Вино'], wishes: 'Обнимаю!' };
  assert.deepEqual(normalizedReply(data), { name: 'Анна', phone: '', attendance: 'К сожалению, не смогу', guests: '0', companions: '', drinks: '', wishes: 'Обнимаю!' });
  const message = replyText(data, config);
  assert.ok(!message.includes('Иван')); assert.ok(!message.includes('Вино')); assert.ok(message.includes('Обнимаю!'));
});
test('Ответ группы включает имена и напитки; одиночный ответ не включает старые имена', () => {
  const data = { name: 'Анна', attendance: 'yes', guests: '2', companions: 'Иван', drinks: ['Без алкоголя'], phone: '+79990000000' };
  const message = replyText(data, config);
  assert.ok(message.includes('Гостей, включая меня: 2')); assert.ok(message.includes('Будут со мной: Иван')); assert.ok(message.includes('Напитки: Без алкоголя'));
  assert.equal(normalizedReply({ ...data, guests: '1' }).companions, '');
});
