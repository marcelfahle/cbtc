// Single source for homepage statuses, interest options and notification labels.
export const statuses = {
  interest_open: { label: 'Interest list open', action: "I'm interested in", detail: 'Interest list open · exact dates to be announced', soon: false },
  details_soon: { label: 'Details soon', action: 'Tell me about', detail: 'Details soon', soon: true },
};
export const camps = [
  { id: 'january', month: 'January', year: 2027, status: 'interest_open', photo: 'coastal-golden-hour-1200.webp', width: 1200, height: 802, position: '50% 42%', variant: 'a', facts: ['<b>Four mountain days.</b> Around 2–4 hours on the trails each day', '<b>For women who already run trails.</b> Climbs, rocky descents, hiking the steep bits', '<b>Shared room from €1,800 · Private room from €2,200</b>'], note: "Provisional. Boutique hotel, sauna and spa planned, not confirmed. Final prices and inclusions to come." },
  { id: 'february', month: 'February', year: 2027, status: 'details_soon', photo: 'sunlit-rocky-trail-1200.webp', width: 1200, height: 802, position: '50% 62%', variant: 'b', facts: ['<b>A February camp is in the plans.</b> Exact dates and camp details will follow.'], note: 'Duration, hosts, rooms and prices are still to be announced.' },
  { id: 'march', month: 'March', year: 2027, status: 'details_soon', photo: 'cliff-and-valley-800.webp', width: 800, height: 1198, position: '50% 38%', variant: 'c', facts: ['<b>Looking ahead to March.</b> Exact dates and camp details will follow.'], note: 'Duration, hosts, rooms and prices are still to be announced.' },
];
export function validatePreferences(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 4 || value.some(id => typeof id !== 'string' || ![...camps.map(c => c.id), 'later'].includes(id))) throw new Error('Please select valid camp preferences.');
  const ids = [...new Set(value)];
  if (ids.includes('later') && ids.length > 1) throw new Error('Choose listed months or later camps, not both.');
  return ids;
}
export function preferenceSummary(ids) {
  return ids.length ? ids.map(id => id === 'later' ? 'Later camps only (none of the listed months)' : camps.find(c => c.id === id)).map(c => typeof c === 'string' ? c : c.month + ' ' + c.year).join(', ') : 'Month preference not specified';
}
export function queryPreferences(search) {
  const raw = new URLSearchParams(search).get('camp');
  return raw ? [...new Set(raw.split(',').filter(id => camps.some(c => c.id === id)))] : [];
}
