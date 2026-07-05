// v3.2 "alpha-humanizer" pass over public/index.html.
// Kills every em dash (varied punctuation instead), de-templates the repeated
// "Not X — Y" construction, breaks exact-3 lists, keeps voice and facts.
// Usage: node scripts/copy-v32-human.mjs --check | (no flag to apply)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(root, 'public/index.html');
const CHECK = process.argv.includes('--check');
let html = readFileSync(FILE, 'utf8');

const enc = (s) => s.replaceAll('&', '&amp;').replaceAll("'", '&#x27;');
const count = (h, s) => h.split(s).length - 1;

const PAIRS = [
  // ---- head (title separator, meta triad) ----
  ['<title>Costa Blanca Trail Camp — Women-Only Trail Running Camp in Spain</title>', '<title>Costa Blanca Trail Camp · Women-Only Trail Running Camp in Spain</title>', 1],
  ['property="og:title" content="Costa Blanca Trail Camp — Women-Only Trail Running Camp in Spain"', 'property="og:title" content="Costa Blanca Trail Camp · Women-Only Trail Running Camp in Spain"', 1],
  ["Eight women, two national-team athletes, four days in Spain's Marina Alta. Technical trail skills, warm November terrain, and a race plan you'll actually use. Applications open.", "Eight women, two national-team athletes, four days in Spain's Marina Alta. Technical skills, November sun, honest coaching, and a race plan you'll actually use. Applications open.", 3],
  // ---- body: every em-dash string, rewritten ----
  ['A camp-prep layer on top of your normal training: two focused sessions a week — vertical strength, downhill work, time on feet. Three group calls: kickoff, fuelling & kit, final logistics. And a weekly voice note from Monika and Anna — less webinar, more your fast friend checking in.', 'A camp-prep layer on top of your normal training: two focused sessions a week (one for vertical strength, one for downhill work) plus honest time on feet. Three group calls: one to kick off, one on fuelling and kit, and a final logistics call the week you fly. And a weekly voice note from Monika and Anna. Less webinar, more your fast friend checking in.', 1],
  ['A follow-up call once your legs are back. The group chat stays open until your goal race — and the night before it, check your phone.', 'A follow-up call once your legs are back. The group chat stays open until your goal race, and the night before it, check your phone.', 1],
  ["Assembled separately — this much time with athletes at this level, video analysis, massage, transfers, board — you're past €3,000. We charge €1,350 and get to choose who comes. We like that trade.", "Buy all this separately (this much time with athletes at this level, video analysis, massage, transfers, board) and you're past €3,000. We charge €1,350 and get to choose who comes. We like that trade.", 1],
  ["Because eight is the most people two athletes can genuinely coach. You'll never be a bib number here — you'll be the one whose descent line gets shouted compliments.", "Because eight is the most people two athletes can genuinely coach. You'll never be a bib number here. You'll be the one whose descent line gets shouted compliments.", 1],
  ['Breakfasts, trail snacks, and group dinners. Airport transfers driven by one of us, on purpose — best Q&A slot of the week.', 'Breakfasts, trail snacks, and group dinners. Airport transfers driven by one of us, on purpose: best Q&A slot of the week.', 1],
  ["Comfortable running 15 km on rolling ground and happy to hike the steep stuff. The Long Day adapts to the group — this is a real training camp, but 'real' measures seriousness, not speed.", "Comfortable running 15 km on rolling ground and happy to hike the steep stuff. The Long Day adapts to the group. This is a real training camp, but 'real' measures seriousness, not speed.", 1],
  ["Deposit €350 on acceptance; the balance by 1 November, in one or two payments — your choice. If we don't offer you a spot, you pay nothing.", "Deposit €350 on acceptance; the balance by 1 November, in one or two payments, your choice. If we don't offer you a spot, you pay nothing.", 1],
  ['Easy scenic loop, mobility, a proper breakfast, then the handover: your race notes, printed — plan, fueling numbers, technique cues, next twelve weeks. Then the airport, annoyingly.', 'Easy scenic loop, mobility, a proper breakfast, then the handover: your race notes, printed. Your plan, your fueling numbers, your technique cues, your next twelve weeks. Then the airport, annoyingly.', 1],
  ["Eight women. Two minutes. Costs nothing — payment only happens if we offer you a spot and you take it. Tell us about your running and we'll tell you honestly whether this fits, in both directions. And if you're hesitating because you think you're not fast enough: the application asks about your running, not your PRs. Fit matters here. Speed doesn't.", "Eight women. Two minutes. Costs nothing, because payment only happens if we offer you a spot and you take it. Tell us about your running and we'll tell you honestly whether this fits, in both directions. And if you're hesitating because you think you're not fast enough: the application asks about your running, not your PRs. Fit matters here. Speed doesn't.", 1],
  ["Every edition's Long Day is a different line — Bèrnia this time, Benigembla another, some editions a race bib — and every one goes in the camp logbook: the route, the weather, the eight names. You take the day's profile home on a locally made tile. Earned on the day. Not for sale.", "Every edition's Long Day is a different line. Bèrnia this time, Benigembla another year, some editions a race bib. Each one goes in the camp logbook, with the weather and all eight names. You take the day's profile home on a locally made tile. Earned on the day. Not for sale.", 1],
  ['First refusal on every future edition — 48 hours before anyone else.', 'First refusal on every future edition, 48 hours before anyone else.', 1],
  ['For women who can run — and want to run mountains. Real Marina Alta terrain, coached properly: line choice, foot placement, braking, poles, fueling, race planning. Every single run has a job.', 'For women who can run and want to run mountains. Real Marina Alta terrain, coached properly: line choice, foot placement, braking, poles, fueling, race planning. Every single run has a job.', 1],
  ["Get comfortable running 15 km first — then apply for Edition 2. We'll be here.", "Get comfortable running 15 km first, then apply for Edition 2. We'll be here.", 1],
  ["How you move on technical ground — descending, braking, and line choice are skills, and skills move fast with expert eyes on eight people. You'll also leave with a race plan, your fueling numbers, and video of your own feet. What four days can't do: make you fitter by Sunday. Fitness takes months — that's what the eight weeks before and the plan you leave with are for. We're careful about which one we promise.", "How you move on technical ground. Descending is a skill, braking is a skill, line choice is a skill, and skills move fast when expert eyes watch eight people instead of eighty. You'll also leave with a race plan, your fueling numbers, and video of your own feet. What four days can't do: make you fitter by Sunday. Fitness takes months. That's what the eight weeks before and the plan you leave with are for. We're careful about which one we promise.", 1],
  ['Ice and headlamps at home — dry ridges, a swimmable sea, and your spring-season base block here. Fly to Alicante; we handle everything after the arrivals door.', 'Ice and headlamps at home. Here: dry ridges and a sea you can still swim in, plus the base block that sets up your whole spring. Fly to Alicante; we handle everything after the arrivals door.', 1],
  ['Icelandic national team, 3rd woman at Laugavegur 2025 — and the W45 winner, which is the stat that should give you ideas. Sub-3 marathoner. Explains hard things plainly, like a teacher.', 'Icelandic national team. Third woman at Laugavegur 2025, and the W45 winner, which is the stat that should give you ideas. Sub-3 marathoner. Explains hard things plainly, like a teacher.', 1],
  ["Monika has raced Worlds for Lithuania and lives on these trails. Anna is Icelandic national team with a Laugavegur podium and sub-3 marathon speed. Neither has any interest in impressing you — they're here to make you better.", "Monika has raced Worlds for Lithuania and lives on these trails. Anna is Icelandic national team with a Laugavegur podium and sub-3 marathon speed. Neither has any interest in impressing you. They're here to make you better.", 1],
  ["Nobody taught you the technical stuff — you've been surviving it. Four days in the Spanish mountains with two national-team athletes and seven other women fixes that. You'll come home knowing exactly what your legs can do.", "Nobody taught you the technical stuff. You've been surviving it. Four days in the Spanish mountains with two national-team athletes and seven other women fixes that. You'll come home knowing exactly what your legs can do.", 1],
  ['Not celebrity worship — access. Two national-team athletes who coach you all four days, in a group small enough that every question gets answered. Usually at dinner, usually with strong opinions.', "This isn't celebrity worship, it's access: two national-team athletes who coach you all four days, in a group small enough that every question gets answered. Usually at dinner. Usually with strong opinions.", 1],
  ["Not one heroic summit — there isn't one here. The Marina Alta works differently: it accumulates. Everything from days one and two — lines, feet, poles, fuelling, pacing — at effort, for hours.", "No heroic summit, because there isn't one here. The Marina Alta works differently: it accumulates. Everything from days one and two (lines, feet, poles, fuelling, pacing) at effort, for hours.", 1],
  ['On any climb, always. Two of us, eight of you — the ratio is the point.', 'On any climb, always. Two of us, eight of you. The ratio is the point.', 1],
  ["On the evening of day three. Included — because 'optional recovery' is camp-speak for 'pay extra'.", "On the evening of day three. Included, because 'optional recovery' is camp-speak for 'pay extra'.", 1],
  ['One nomination per edition — someone you vouch for skips the queue, €100 off for each of you.', 'One nomination per edition: someone you vouch for skips the queue, and you both get €100 off.', 1],
  ["Some climbs here are meant to be hiked. That's not weakness — that's racecraft.", "Some climbs here are meant to be hiked. That isn't weakness. It's racecraft.", 1],
  ["Sounds woo-woo. Isn't. The last two hours of your ultra will be exactly this quiet — better to meet that silence before race day.", "Sounds woo-woo. Isn't. The last two hours of your ultra will be exactly this quiet, and it's better to meet that silence before race day.", 1],
  ['The Long Day — it gets its own section below. Fueling on schedule, real pacing decisions, poles where they help, and the answer to whether you can move well for hours. (You can. With snacks.)', 'The Long Day. It gets its own section below. Fueling on schedule, real pacing decisions, poles where they help, and the answer to whether you can move well for hours. (You can. With snacks.)', 1],
  ["The discount isn't generosity — it's a bet you're making on our first edition, and we pay for the bet. Founding runners agree to:", "The discount isn't generosity. It's a bet you're making on our first edition, and we pay for the bet. Founding runners agree to:", 1],
  ['The price on the page is the price — shared twin in the villa. Your own room is +€120: our actual cost, not a single-traveler penalty.', 'The price on the page is the price: shared twin in the villa. Your own room is +€120, our actual cost, not a single-traveler penalty.', 1],
  ['The rocky stuff, coached hard: lines, feet, cadence, braking. We film you on the technical section — then you and one of us watch your tape that evening, one on one. Slightly weird, wildly useful.', 'The rocky stuff, coached hard: lines, feet, cadence, braking. We film you on the technical section, then you and one of us watch your tape that evening, one on one. Slightly weird, wildly useful.', 1],
  ['This edition: Serra de Bèrnia — ~22 km, 1,400 m of climbing.', 'This edition: Serra de Bèrnia. About 22 km, with 1,400 m of climbing.', 1],
  ['Trail shoes, hydration vest, wind shell, sun protection, emergency blanket, phone, personal meds. The full list — with our honest shoe opinions — arrives before you fly.', 'Trail shoes, hydration vest, wind shell, sun protection, emergency blanket, phone, personal meds. The full list arrives before you fly, with our honest shoe opinions in it.', 1],
  ['Yes — almost everyone does. Shared rooms are matched by preference, and by day two the strangers thing is over.', 'Yes, almost everyone does. Shared rooms are matched by preference, and by day two the strangers thing is over.', 1],
  ['Yes — this edition is women-only. Coaches included.', 'Yes. This edition is women-only, coaches included.', 1],
  ["You can hold your own on 15k, but rocky descents turn you into a very careful tourist. Not a fitness problem — a skills gap, and it closes fast with the right eyes on you.", "You can hold your own on 15k, but rocky descents turn you into a very careful tourist. That isn't a fitness problem, it's a skills gap, and it closes fast with the right eyes on you.", 1],
  ["You're booking four months — the camp is just the loud part in the middle.", "You're booking four months. The camp is just the loud part in the middle.", 1],
  ['Your goal race, your history, your dodgy ankle, your shoes — send a photo before you drop €180 on the wrong pair. We start your runner card: one page about you, updated until race day.', 'Your goal race, your history, your dodgy ankle, your shoes (send a photo before you drop €180 on the wrong pair). We start your runner card: one page about you, updated until race day.', 1],
  // ---- image alts ----
  ['alt="Anna Berglind Palmadottir — trail running"', 'alt="Anna Berglind Palmadottir racing"', 1],
  ['alt="Monika Fahle — trail running"', 'alt="Monika Fahle running on a coastal road"', 1],
];

let failures = 0;
for (const [oldPlain, newPlain, expected] of PAIRS) {
  const oldS = oldPlain.startsWith('<') || oldPlain.startsWith('property=') ? oldPlain : enc(oldPlain);
  const newS = newPlain.startsWith('<') || newPlain.startsWith('property=') ? newPlain : enc(newPlain);
  const n = count(html, oldS);
  if (n !== expected) {
    failures++;
    console.log(`MISMATCH (${n} found, ${expected} expected): ${oldPlain.slice(0, 70)}...`);
  } else {
    html = html.split(oldS).join(newS);
  }
}

const remaining = count(html, '—');
console.log(`pairs: ${PAIRS.length}, failures: ${failures}, em dashes remaining after pass: ${remaining}`);
if (CHECK) process.exit(failures ? 1 : 0);
if (failures) { console.log('aborted, nothing written'); process.exit(1); }
if (remaining > 0) console.log('WARNING: em dashes still present, inspect manually');
writeFileSync(FILE, html);
console.log('written');
