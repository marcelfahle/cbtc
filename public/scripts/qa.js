// /camp/2027/02/qa: localise session times, handle the RSVP form, show the calendar step. `zoom` is the meeting link (Google Meet).
import { sessions, sessionById, googleCalendarUrl, buildIcs, sessionLabel } from '/scripts/qa-sessions.js';

const $ = (s, r = document) => r.querySelector(s);

// "Your time": the viewer's local time for each session, only when it differs from Spain's.
try {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz });
  const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: tz });
  const hostFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Madrid' });
  for (const s of sessions) {
    const el = $(`[data-local="${s.id}"]`);
    if (!el) continue;
    const d = new Date(s.utc);
    const local = fmt.format(d), host = hostFmt.format(d);
    if (local === host) { el.hidden = true; continue; }
    const sameDay = dayFmt.format(d).toLowerCase() === s.weekday.slice(0, 3).toLowerCase();
    el.textContent = `${local} your time` + (sameDay ? '' : ` (${dayFmt.format(d)})`);
  }
  const zone = $('[data-your-zone]');
  if (zone) zone.textContent = tz.replace(/_/g, ' ');
} catch (_) {}

// Pre-select from ?s=tue-10 so emails can deep-link a session.
try {
  const pre = new URLSearchParams(location.search).get('s');
  const input = pre && $(`input[name="session"][value="${pre}"]`);
  if (input) input.checked = true;
} catch (_) {}

const form = $('form[data-rsvp]');
if (form) {
  const button = $('button[type="submit"]', form);
  const errorBox = $('[data-error]', form);
  const nudge = $('[data-pick-nudge]', form);

  form.addEventListener('change', () => { if (form.session.value && nudge) nudge.hidden = true; });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.dataset.busy) return;
    errorBox.hidden = true;
    const session = form.session.value;
    if (!session) { nudge.hidden = false; $('.slots').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    const fields = {
      name: form.name.value, email: form.email.value, question: form.question.value, website: form.website.value,
    };
    form.dataset.busy = '1';
    const label = button.textContent;
    button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'Saving your seat…';

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, pageUrl: location.href, fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) throw new Error(data.error || '');
      showDone(sessionById(session), data.zoom || '', fields);
      try { window.plausible && plausible('QA RSVP', { props: { session } }); } catch (_) {}
    } catch (err) {
      delete form.dataset.busy;
      button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = label;
      errorBox.textContent = (err && err.message) || 'We couldn’t save your seat. Please try again.';
      errorBox.hidden = false;
    }
  });
}

function showDone(s, zoom, fields) {
  const done = $('#done');
  $('[data-done-when]', done).textContent = sessionLabel(s);
  $('[data-done-email]', done).textContent = fields.email;
  $('[data-gcal]', done).href = googleCalendarUrl(s, zoom);

  const ics = buildIcs(s, { zoom, attendeeEmail: fields.email, attendeeName: fields.name });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = $('[data-ics]', done);
  a.href = URL.createObjectURL(blob);
  a.download = 'costa-blanca-trail-camp-qa.ics';

  const z = $('[data-zoom]', done);
  if (zoom) { z.href = zoom; z.hidden = false; }

  // Stamp the chosen stub, hide the rest, swap the form for the done card.
  document.querySelectorAll('.slot').forEach(el => {
    const mine = $('input', el).value === s.id;
    el.classList.toggle('chosen', mine);
    el.classList.toggle('faded', !mine);
    $('input', el).disabled = true;
  });
  form.hidden = true;
  done.hidden = false;
  done.focus({ preventScroll: true });
  done.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
