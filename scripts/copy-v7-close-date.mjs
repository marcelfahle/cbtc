// Copy v7 (2026-09-11): applications close moves 13 -> 27 Sep (ads run
// 14-27 Sep), cohort confirmed by 30 Sep, balance 1 -> 9 Oct. Deposit is
// "within a week of your yes" instead of "on acceptance". Flights spelled
// out as self-booked in a friendly way. Prep-arc labels lose the week
// counts because late joiners get four weeks, early ones seven.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

const one = [
  ['Applications close 13 September; the eight are confirmed by 14 September.',
   'Applications close 27 September; the eight are confirmed by 30 September.'],
  ['">13 September</dd>', '">27 September</dd>'],
  ['">14 September</dd>', '">30 September</dd>'],
  ['Fly to Alicante; we handle everything after the arrivals door.',
   'Fly to Alicante on your own ticket; we handle everything after the arrivals door.'],
  ['If it&#x27;s a yes, you&#x27;ll know exactly why we picked you.',
   'If it&#x27;s a yes, you&#x27;ll know exactly why we picked you. Say yes back, pay the €350 deposit within the week, and the spot is yours.'],
  ['Deposit €350 on acceptance; the balance by 1 October, in one or two payments, your choice.',
   'A €350 deposit within a week of your yes holds the spot; the balance by 9 October, in one or two payments, your choice.'],
  ['Not included: flights, insurance (mandatory), alcohol, race entries.',
   'Not included: your flight to Alicante (book whichever is cheapest, we meet every arrival), insurance (mandatory), alcohol, race entries.'],
  ['>Weeks 1–6</p>', '>Until you fly</p>'],
  ['>Around week 4</p>', '>Two weeks out</p>'],
  ['The eight weeks before, the months after', 'The weeks before, the months after'],
  ['the eight weeks before and the plan you leave with', 'the weeks before and the plan you leave with'],
];

for (const [from, to] of one) {
  const parts = html.split(from);
  if (parts.length !== 2) {
    console.error(`FAIL (found ${parts.length - 1}x, need 1): ${from.slice(0, 60)}…`);
    process.exit(1);
  }
  html = parts.join(to);
}

writeFileSync(FILE, html);
console.log('copy-v7-close-date applied.');
