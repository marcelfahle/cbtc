// The live Q&A sessions for the February 2027 camp (open house on Google Meet).
// Single source for the page, the client script and /api/rsvp.
// Edit `sessions` to move a date. `utc` is the start in UTC; Spain is CET (UTC+1)
// in November, so 18:00 in Dénia is 17:00Z. The label is what we print.
// `link` is optional per session; otherwise /api/rsvp uses the QA_MEET_URL env var for all four.
export const camp = {
  id: 'february',
  name: 'February camp',
  window: '2–7 February 2027',
  page: 'https://www.costablancatrailcamp.com/camp/2027/02/qa',
};

export const DURATION_MIN = 45;
export const HOST_TZ = 'Europe/Madrid';

export const sessions = [
  { id: 'tue-10', utc: '2026-11-10T17:00:00Z', weekday: 'Tuesday',   day: '10', month: 'November', time: '18:00', tz: 'CET', tag: 'First one' },
  { id: 'thu-12', utc: '2026-11-12T17:00:00Z', weekday: 'Thursday',  day: '12', month: 'November', time: '18:00', tz: 'CET' },
  { id: 'wed-18', utc: '2026-11-18T17:00:00Z', weekday: 'Wednesday', day: '18', month: 'November', time: '18:00', tz: 'CET' },
  { id: 'fri-20', utc: '2026-11-20T17:00:00Z', weekday: 'Friday',    day: '20', month: 'November', time: '18:00', tz: 'CET', tag: 'Last one' },
];

export const sessionById = id => sessions.find(s => s.id === id);
export const sessionLabel = s => `${s.weekday} ${s.day} ${s.month}, ${s.time} ${s.tz}`;
export const endUtc = s => new Date(new Date(s.utc).getTime() + DURATION_MIN * 60000).toISOString();

export const eventTitle = 'Costa Blanca Trail Camp · Live Q&A with Monika and Anna';
export const eventDescription = zoom =>
  [
    'A live, small-group Q&A about the February camp (2–7 February 2027).',
    'The week day by day, the trails, rooms, prices, travel and whatever you want to ask.',
    'No payment, nothing to decide on the call.',
    zoom ? `Join on Google Meet: ${zoom}` : 'The Google Meet link is in your confirmation email.',
    `Page: ${camp.page}`,
  ].join('\n');

// Compact ISO stamp for iCalendar: 20261110T170000Z
const stamp = iso => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = s => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

// An iCalendar "REQUEST" so mail clients show it as an invitation, not just a file.
export function buildIcs(session, { zoom = '', organizerEmail = '', organizerName = 'Costa Blanca Trail Camp', attendeeEmail = '', attendeeName = '' } = {}) {
  const uid = `qa-${session.id}-${camp.id}-2027@costablancatrailcamp.com`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Costa Blanca Trail Camp//Live Q&A//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(session.utc)}`,
    `DTEND:${stamp(endUtc(session))}`,
    `SUMMARY:${icsText(eventTitle)}`,
    `DESCRIPTION:${icsText(eventDescription(zoom))}`,
    `LOCATION:${icsText(zoom || 'Google Meet')}`,
    zoom && `URL:${zoom}`,
    organizerEmail && `ORGANIZER;CN=${icsText(organizerName)}:mailto:${organizerEmail}`,
    attendeeEmail && `ATTENDEE;CN=${icsText(attendeeName || attendeeEmail)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${attendeeEmail}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Live Q&A starts in 30 minutes',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n') + '\r\n';
}

export function googleCalendarUrl(session, zoom = '') {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${stamp(session.utc)}/${stamp(endUtc(session))}`,
    details: eventDescription(zoom),
    location: zoom || 'Google Meet',
    ctz: HOST_TZ,
  });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}
