// Single source for homepage statuses, interest options and notification labels.
export const statuses = {
  interest_open: { label: 'Dates coming soon', action: 'Send me', actionSuffix: ' dates', detail: 'Dates coming soon', soon: false },
  details_soon: { label: 'Details soon', action: 'Tell me about', detail: 'Details soon', soon: true },
  dates_set: { label: 'Dates confirmed', action: 'Send me the', actionSuffix: ' details', detail: 'Dates confirmed', soon: false },
};
// Timing changed 23 Oct 2026 (Monika): no January camp; February, and late March to early April 2027.
// Only general camp facts here until Monika confirms days, hotel, sauna and prices for each camp.
// 24 Oct 2026 (Marcel): February confirmed as 2–7 February 2027: arrive Tuesday, four running days
// Wednesday to Saturday, fly home Sunday so runners are back at work on Monday. `window` drives labels in the
// form and notification emails; `dates` drives the ticket and hero display.
export const camps = [
  { id: 'february', month: 'February', year: 2027, window: '2–7 February 2027', dates: { days: '2–7', month: 'Feb', span: 'Tuesday 2 to Sunday 7', start: '2027-02-02', end: '2027-02-07' }, status: 'dates_set', photo: 'coastal-golden-hour-1200.webp', alt: 'Golden evening light over the coast and town below a rocky mountain ridge near Dénia', width: 1200, height: 802, position: '50% 42%', variant: 'a', facts: ['<b>Arrive Tuesday, home on Sunday.</b> Four mountain days in between on the trails behind Dénia, with a small women’s group to share them', '<b>For women who already run trails.</b> Climbs, rocky descents, hiking the steep bits'], note: 'Hotel to be confirmed.',
    // Prices per person (Marcel, 24 Oct 2026). Bring a friend: 10% off for each of you.
    price: { rows: [['Shared room', '€1,800'], ['Single room', '€2,200']], friend: 'Per person. Bring a friend and you each get 10% off.' } },
  { id: 'spring', month: 'Spring', window: 'Late March to early April 2027', season: 'late March to early April', year: 2027, status: 'details_soon', photo: 'sunlit-rocky-trail-1200.webp', alt: 'A rocky mountain trail through green scrub towards a limestone ridge in low sun', width: 1200, height: 802, position: '50% 55%', variant: 'c', facts: ['<b>More mountain days to look forward to.</b> Dates and details are on their way.'], note: 'Exact dates, duration, hosts, rooms and prices are still to be announced.' },
];
// Earlier options. Old links and submissions that still carry these ids keep working.
const legacy = {
  january: 'January 2027 (earlier option, no longer offered)',
  march: 'March 2027 (earlier option, now late March to early April)',
};
const linkAliases = { march: 'spring' };
export const campLabel = c => c.window || c.month + ' ' + c.year;
export const seasonLine = () => camps.map(c => c.season || c.month).join(' and ') + ' 2027';
export function validatePreferences(value) {
  if (value === undefined) return [];
  const known = [...camps.map(c => c.id), ...Object.keys(legacy), 'later'];
  if (!Array.isArray(value) || value.length > 4 || value.some(id => typeof id !== 'string' || !known.includes(id))) throw new Error('Please select valid camp preferences.');
  const ids = [...new Set(value)];
  if (ids.includes('later') && ids.length > 1) throw new Error('Choose listed months or later camps, not both.');
  return ids;
}
export function preferenceSummary(ids) {
  return ids.length ? ids.map(id => id === 'later' ? 'Later camps only (none of the listed months)' : legacy[id] || campLabel(camps.find(c => c.id === id))).join(', ') : 'Month preference not specified';
}
export function queryPreferences(search) {
  const raw = new URLSearchParams(search).get('camp');
  return raw ? [...new Set(raw.split(',').map(id => linkAliases[id] || id).filter(id => camps.some(c => c.id === id)))] : [];
}
