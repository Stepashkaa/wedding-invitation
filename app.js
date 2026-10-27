(function () {
  'use strict';
  const config = window.WEDDING_CONFIG;
  const utils = window.WeddingUtils;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const formatDate = (date, options) => new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', ...options }).format(new Date(date + 'T12:00:00Z'));
  const [year, month, day] = config.date.split('-');
  const fullDate = formatDate(config.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, '');
  const bindings = {
    ...config, day, month, year, groomInitial: config.groom[0], brideInitial: config.bride[0],
    numericDate: `${day}.${month}.${year}`, fullDate: fullDate[0].toUpperCase() + fullDate.slice(1),
    replyDate: formatDate(config.replyBy, { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, '')
  };
  for (const element of $$('[data-bind]')) {
    const value = element.dataset.bind.split('.').reduce((data, key) => data?.[key], bindings);
    if (value !== undefined) element.textContent = value;
  }
  document.title = `${config.groom} & ${config.bride} — ${bindings.numericDate}`;
  const coupleNames = `${config.groom} и ${config.bride}`;
  $('.monogram').setAttribute('aria-label', `${coupleNames}, начало`);
  $('.couple-photo').dataset.caption = coupleNames;
  $('.couple-photo').setAttribute('aria-label', `Увеличить фотографию: ${coupleNames}`);
  $('.couple-photo img').alt = `${coupleNames} вместе под узорчатым куполом`;
  $('#reply-dialog > p').textContent = `Скопируйте сообщение и отправьте его нам в привычном мессенджере. Пока вы этого не сделаете, мы не получим ответ.`;
  $('meta[name="description"]').content = `${coupleNames} приглашают вас на свадьбу ${bindings.fullDate.toLowerCase()}. Разделите с нами наш счастливый день.`;

  // Места: точная карточка при настройке mapUrl, иначе честный поиск.
  for (const key of ['ceremony', 'reception']) {
    const venue = config[key];
    const link = $(`#${key}-map`);
    let directURL = null;
    try { const url = new URL(venue.mapUrl); if (url.protocol === 'https:') directURL = url.href; } catch (_) { /* Поиск — штатный вариант. */ }
    link.href = directURL || `https://yandex.ru/maps/?text=${encodeURIComponent(venue.mapQuery)}`;
    if (directURL) link.firstChild.textContent = 'Открыть на карте ';
  }

  // Календарь: неделя с понедельника, выделен реальный день из config.js.
  const calendar = $('#calendar');
  const monthName = formatDate(config.date, { month: 'long' });
  $('#calendar-month').replaceChildren(document.createTextNode(monthName[0].toUpperCase() + monthName.slice(1) + ' '));
  const calendarYear = document.createElement('em'); calendarYear.textContent = year; $('#calendar-month').append(calendarYear);
  calendar.setAttribute('aria-label', `${monthName} ${year}`);
  const header = document.createElement('div'); header.className = 'calendar-row'; header.setAttribute('role', 'row');
  for (const weekday of ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']) {
    const cell = document.createElement('span'); cell.setAttribute('role', 'columnheader'); cell.textContent = weekday; header.append(cell);
  }
  calendar.append(header);
  for (const week of utils.calendarRows(config.date)) {
    const row = document.createElement('div'); row.className = 'calendar-row'; row.setAttribute('role', 'row');
    for (const date of week) {
      const cell = document.createElement('span'); cell.setAttribute('role', 'cell');
      if (date) { cell.textContent = date.day; if (date.selected) { cell.className = 'wedding-day'; cell.setAttribute('aria-label', `${bindings.fullDate}, день нашей свадьбы`); } }
      row.append(cell);
    }
    calendar.append(row);
  }

  function updateCountdown() {
    const remaining = utils.countdown(config.startsAt);
    for (const unit of ['days', 'hours', 'minutes', 'seconds']) $(`#count-${unit}`).textContent = String(remaining[unit]).padStart(2, '0');
    if (remaining.finished) {
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: config.timeZone }).format(new Date());
      $('#countdown-label').textContent = today === config.date ? 'Наш счастливый день настал!' : 'Этот день — навсегда в наших сердцах';
    }
    return remaining.finished;
  }
  if (!updateCountdown()) {
    const timer = window.setInterval(() => { if (updateCountdown()) window.clearInterval(timer); }, 1000);
  }

  let toastTimer;
  function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500); }
  $('#calendar-download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([utils.calendarFile(config)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `wedding-${config.date}.ics`; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast('Откройте скачанный файл и сохраните событие в календаре.');
  });

  // Небольшие линейные иллюстрации вместо сторонней библиотеки иконок.
  const paths = {
    spark: '<path d="M16 2l3.8 10.2L30 16l-10.2 3.8L16 30l-3.8-10.2L2 16l10.2-3.8Z"/>',
    rings: '<circle cx="11" cy="19" r="8"/><circle cx="21" cy="19" r="8"/><path d="M7 9l-2-4 5-3 5 3-2 4M19 9l-2-4 5-3 5 3-2 4"/>',
    camera: '<rect x="3" y="9" width="26" height="18" rx="2"/><path d="M10 9l2-5h8l2 5"/><circle cx="16" cy="18" r="6"/><path d="M25 12h1"/>',
    glass: '<path d="M6 3h8v9a4 4 0 01-8 0ZM10 16v13M5 29h10M6 8h8M20 3h8v9a4 4 0 01-8 0ZM24 16v13M19 29h10M20 8h8"/>',
    music: '<path d="M13 25V8l15-5v19M13 12l15-5"/><ellipse cx="8" cy="26" rx="5" ry="3"/><ellipse cx="23" cy="23" rx="5" ry="3"/>'
  };
  $('#timeline').replaceChildren();
  for (const event of config.schedule) {
    const item = document.createElement('li'); item.className = 'timeline-item reveal';
    const time = document.createElement('time'); time.className = 'timeline-time'; time.textContent = event.time; time.dateTime = `${config.date}T${event.time}`;
    const node = document.createElement('span'); node.className = 'timeline-node'; node.setAttribute('aria-hidden', 'true'); node.innerHTML = `<svg viewBox="0 0 32 32">${paths[event.icon] || paths.spark}</svg>`;
    const copy = document.createElement('div'); copy.className = 'timeline-copy'; const heading = document.createElement('h3'); heading.textContent = event.title; const paragraph = document.createElement('p'); paragraph.textContent = event.text; copy.append(heading, paragraph); item.append(time, node, copy); $('#timeline').append(item);
  }

  const toggle = $('.menu-toggle'), menu = $('#mobile-menu');
  function closeMenu(returnFocus = false) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Открыть меню'); if (returnFocus) toggle.focus(); }
  toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); menu.hidden = !open; });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) closeMenu(true); });
  document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); }, { passive: true });

  // Нативные dialog: Escape, удержание фокуса и возврат на кнопку-источник.
  function openDialog(dialog) { dialog.showModal(); document.body.classList.add('modal-open'); }
  for (const dialog of $$('dialog')) {
    dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) { const box = dialog.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  }
  for (const trigger of $$('[data-lightbox]')) trigger.addEventListener('click', () => {
    $('#lightbox-image').src = trigger.dataset.lightbox; $('#lightbox-image').alt = trigger.querySelector('img').alt;
    $('#lightbox-caption').textContent = trigger.dataset.caption; openDialog($('#lightbox'));
  });

  const form = $('#rsvp-form');
  const submit = $('#submit-rsvp');
  const endpoint = String(config.rsvp.endpoint || '').trim();
  let submitted = false;
  let submitting = false;
  // Отправка привязана только к явно настроенному Formspree endpoint.
  const directSend = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint);
  const buttonLabel = directSend ? 'Отправить ответ' : 'Подготовить ответ';
  function resetButton() { submit.replaceChildren(document.createTextNode(buttonLabel + ' ')); const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); submit.append(arrow); }
  resetButton();
  if (directSend) $('#form-note').textContent = 'Ответ будет отправлен организаторам через Formspree. Нажимая кнопку, вы соглашаетесь передать указанные данные для подготовки праздника.';
  function syncAttendance() {
    const attending = form.elements.attendance.value === 'yes';
    $('#attendance-fields').hidden = !attending;
    for (const input of $$('#attendance-fields input, #attendance-fields select')) input.disabled = !attending;
    const companionsNeeded = attending && Number($('#guests').value) > 1;
    $('#companions-field').hidden = !companionsNeeded; $('#companions').disabled = !companionsNeeded; $('#companions').required = companionsNeeded;
  }
  form.addEventListener('change', syncAttendance); syncAttendance();
  form.addEventListener('input', () => { if (submitted) { submitted = false; submit.disabled = false; resetButton(); $('#form-status').textContent = ''; } });
  function readForm() { const values = new FormData(form); return { name: values.get('name'), phone: values.get('phone'), attendance: values.get('attendance'), guests: values.get('guests'), companions: values.get('companions'), drinks: values.getAll('drinks'), wishes: values.get('wishes') }; }
  function prepareResponse() {
    if (!form.reportValidity()) return;
    $('#reply-text').value = utils.replyText(readForm(), config); $('#copy-status').textContent = ''; $('#copy-response').textContent = 'Скопировать ответ ↗';
    $('#share-response').hidden = typeof navigator.share !== 'function'; openDialog($('#reply-dialog'));
  }
  $('#fallback-response').addEventListener('click', prepareResponse);
  $('#guest-name').addEventListener('input', () => $('#guest-name').setCustomValidity(''));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitting || submitted) return;
    if (!$('#guest-name').value.trim()) { $('#guest-name').setCustomValidity('Пожалуйста, укажите имя.'); $('#guest-name').reportValidity(); return; }
    if (!form.reportValidity()) return;
    if ($('#website').value) return;
    if (!directSend) { prepareResponse(); return; }
    const status = $('#form-status'); status.className = 'form-status'; status.textContent = ''; $('#fallback-response').hidden = true;
    const payload = utils.normalizedReply(readForm()); payload._subject = `Свадьба ${config.groom} и ${config.bride}: ${payload.name}`;
    submitting = true; submit.disabled = true; submit.textContent = 'Отправляем…'; form.setAttribute('aria-busy', 'true');
    const lockedFields = [...form.querySelectorAll('input, select, textarea')].map(field => ({ field, disabled: field.disabled }));
    for (const item of lockedFields) item.field.disabled = true;
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      if (!response.ok) throw new Error('Ответ не принят сервисом');
      submitted = true; status.textContent = 'Спасибо! Ваш ответ отправлен. Очень ценим, что вы дали нам знать ♡'; submit.textContent = 'Ответ отправлен ♡';
    } catch (_) {
      status.className = 'form-status error'; status.textContent = 'Не удалось подтвердить отправку. Ваши данные остались в форме. Можно повторить попытку или подготовить сообщение для мессенджера.';
      $('#fallback-response').hidden = false;
    } finally {
      clearTimeout(timeout); submitting = false; form.removeAttribute('aria-busy');
      for (const item of lockedFields) item.field.disabled = item.disabled;
      submit.disabled = submitted; if (!submitted) resetButton();
    }
  });
  $('#copy-response').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Нет доступа к буферу');
      await navigator.clipboard.writeText($('#reply-text').value);
      $('#copy-status').textContent = 'Скопировано! Теперь отправьте сообщение нам.'; $('#copy-response').textContent = 'Ответ скопирован ✓';
    } catch (_) { $('#reply-text').focus(); $('#reply-text').select(); $('#copy-status').textContent = 'Текст выделен. Нажмите Ctrl+C (на Mac — ⌘C) или выберите «Копировать» на телефоне.'; }
  });
  $('#share-response').addEventListener('click', async () => {
    try { await navigator.share({ title: 'Ответ на свадебное приглашение', text: $('#reply-text').value }); }
    catch (error) { if (error.name !== 'AbortError') $('#copy-status').textContent = 'Не удалось открыть отправку. Скопируйте текст сообщения.'; }
  });

  submit.disabled = false;

  // JS не прячет контент, пока остальные функции не инициализированы.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }, { threshold: 0.06, rootMargin: '0px 0px 20px 0px' });
    for (const item of $$('.reveal')) observer.observe(item);
    document.documentElement.classList.add('motion-ready');
    // Раскрытые details также должны проявляться, если были вне области просмотра.
    for (const details of $$('details')) details.addEventListener('toggle', () => { if (details.open) details.classList.add('is-visible'); });
  }
  let scheduled = false;
  function updateProgress() { const range = document.documentElement.scrollHeight - window.innerHeight; $('.reading-progress').style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0})`; scheduled = false; }
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateProgress); } }, { passive: true });
  updateProgress();
})();
