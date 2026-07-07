// Copy v4 "six-day shape" pass (2026-07-07):
// - H1 broadens to the general promise; "Downhill is a skill." demoted to concept kicker
// - Dates 26–29 Nov -> 25–30 Nov: arrival day (Wed) + 4 coached days + departure day (Mon)
// - Sold as "five nights, four coached days" (never as buffer days)
// - New FAQ: late-flight arrival anxiety
// Standing copy rules apply: zero em dashes, no "Not X, Y" template, no exact-3 parallel lists.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

const replacements = [
  // 1 · Hero H1
  ['>Downhill is a skill.</h1>', '>Get good at mountains.</h1>'],

  // 2 · Concept section: keep the old H1 as a kicker
  [
    'text-ploy-text-secondary">For women who can run and want to run mountains. Real Marina Alta terrain, coached properly:',
    'text-ploy-text-secondary">Downhill is a skill, and skills can be taught. For women who can run and want to run mountains. Real Marina Alta terrain, coached properly:',
  ],

  // 3 · Hero stats card
  ['>26–29 Nov 2026</dd>', '>25–30 Nov 2026</dd>'],

  // 4 · Dates section eyebrow
  ['>Edition 1 · 26–29 November 2026</p>', '>Edition 1 · 25–30 November 2026</p>'],

  // 5 · Dates section body: name the shape
  [
    'plus the base block that sets up your whole spring. Fly to Alicante; we handle everything after the arrivals door.</p>',
    'plus the base block that sets up your whole spring. Five nights, four coached days. Fly to Alicante; we handle everything after the arrivals door.</p>',
  ],

  // 6 · Timeline camp item date
  ['>26–29 November</p>', '>25–30 November</p>'],

  // 7 · Timeline camp item body
  [
    '>One of us meets you at arrivals; the trail talk starts in the car.</p>',
    '>One of us meets you at arrivals, whatever time you land; the trail talk starts in the car. Wednesday is for landing. The running starts Thursday.</p>',
  ],

  // 8 · Itinerary intro: arrival/departure days exist
  [
    'and fly home sharper than you landed.</p>',
    'and fly home sharper than you landed. You arrive the Wednesday before, whenever your flight gets in, and leave the Monday after. These four days are pure running.</p>',
  ],

  // 9 · Day 1 card (arrival moved to the day before)
  ['>Arrival, shakeout &amp; kit check</strong>', '>Shakeout &amp; the goals circle</strong>'],
  [
    '>Alicante transfer, check-in near Denia, an easy coastal run to shake out the flight, then dinner and the goals circle: everyone names her race and one fear, and we answer both.</p>',
    '>You landed yesterday and actually slept. Day one is gentle: an easy coastal run to loosen travel legs and a kit check before dinner. Then the goals circle: everyone names her race and one fear, and we answer both.</p>',
  ],

  // 10 · Day 4 card (departure moved to the day after, handover to the evening)
  ['>Recovery run, workshop &amp; departure</strong>', '>Recovery run &amp; the handover</strong>'],
  [
    '>Easy scenic loop, mobility, a proper breakfast, then the handover: your race notes, printed. Your plan, your fueling numbers, your technique cues, your next twelve weeks. Then the airport, annoyingly.</p>',
    '>Easy scenic loop, mobility, a proper breakfast. That evening, the handover: your race notes, printed. Your plan, your fueling numbers, your technique cues, your next twelve weeks. Flights are tomorrow&#x27;s problem.</p>',
  ],

  // 11 · Value stack: nights count
  ['>Three nights in the villa</strong>', '>Five nights in the villa</strong>'],
  [
    '>Breakfasts, trail snacks, and group dinners. Airport transfers driven by one of us, on purpose: best Q&amp;A slot of the week.</p>',
    '>Wednesday to Monday. Breakfasts, trail snacks, and group dinners. Airport transfers driven by one of us, on purpose: best Q&amp;A slot of the week.</p>',
  ],

  // 12 · Footer
  [
    'Edition 1 · 26–29 November 2026 · Marina Alta',
    'Edition 1 · 25–30 November 2026 · Marina Alta',
  ],

  // 13 · New FAQ after "Can I come alone?"
  [
    'by day two the strangers thing is over.</p></details><details class="group py-5"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold [&amp;::-webkit-details-marker]:hidden">What kit is mandatory?',
    'by day two the strangers thing is over.</p></details><details class="group py-5"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold [&amp;::-webkit-details-marker]:hidden">My flight lands at 11pm. Is that a problem?<span class="shrink-0 text-ploy-accent-primary transition group-open:rotate-45">+</span></summary><p class="mt-3 max-w-[64ch] text-ploy-text-secondary">No. Wednesday is arrival day: no training, no schedule, a pickup whenever you land, and dinner kept warm if it&#x27;s late. The running starts Thursday morning, once everyone has slept. Monday works the same in reverse, so book whichever flight home is cheapest.</p></details><details class="group py-5"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold [&amp;::-webkit-details-marker]:hidden">What kit is mandatory?',
  ],
];

let applied = 0;
for (const [from, to] of replacements) {
  const parts = html.split(from);
  if (parts.length !== 2) {
    console.error(`FAIL (found ${parts.length - 1}x, need exactly 1): ${from.slice(0, 80)}…`);
    process.exit(1);
  }
  html = parts.join(to);
  applied++;
}

writeFileSync(FILE, html);
console.log(`copy-v4-sixday: ${applied}/${replacements.length} replacements applied.`);
