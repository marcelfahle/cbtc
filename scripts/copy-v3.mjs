// Applies copy v3 (Shaan/Sam voice, women-first, coach-title softened) to
// public/index.html. Pairs are written in plain text; enc() converts to the
// file's entity encoding (' → &#x27;, & → &amp;).
// Usage: node scripts/copy-v3.mjs --check   (report matches, write nothing)
//        node scripts/copy-v3.mjs           (apply)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(root, 'public/index.html');
const CHECK = process.argv.includes('--check');
let html = readFileSync(FILE, 'utf8');

const enc = (s) => s.replaceAll('&', '&amp;').replaceAll("'", '&#x27;');
const count = (h, s) => h.split(s).length - 1;

// [plain old, plain new, expected occurrences]
const PAIRS = [
  // ---- head ----
  ['<title>Costa Blanca Trail Camp</title>', '<title>Costa Blanca Trail Camp — Women-Only Trail Running Camp in Spain</title>', 1],
  ["A women-only trail-running retreat on Spain's Costa Blanca. Four days of coached technical trail skills and practical race prep, hosted by Monika Fahle and Anna Berglind Palmadottir.", "Eight women, two national-team athletes, four days in Spain's Marina Alta. Technical trail skills, warm November terrain, and a race plan you'll actually use. Applications open.", 3],
  ['property="og:title" content="Costa Blanca Trail Camp"', 'property="og:title" content="Costa Blanca Trail Camp — Women-Only Trail Running Camp in Spain"', 1],
  // ---- hero ----
  ['Women-only trail running retreat · Costa Blanca', 'Women-only trail camp · Costa Blanca, Spain', 1],
  ['Technical trails. No theatre.', 'Downhill is a skill.', 1],
  ["Four days in the Marina Alta with two national-team coaches and seven other runners who take this as seriously as you do. November — when your trails go dark and ours don't.", "Nobody taught you the technical stuff — you've been surviving it. Four days in the Spanish mountains with two national-team athletes and seven other women fixes that. You'll come home knowing exactly what your legs can do.", 1],
  // ---- november ----
  ["November — when your trails go dark and ours don't.", 'Dark at 4pm where you live. Nineteen degrees here.', 1],
  ['Marina Alta, Costa Blanca. Fly to Alicante; we do the rest.', 'Ice and headlamps at home — dry ridges, a swimmable sea, and your spring-season base block here. Fly to Alicante; we handle everything after the arrivals door.', 1],
  // ---- concept ----
  ['A practical camp.', "A training camp, not a spa week. (There's still paella.)", 1],
  ['This is a practical trail-running camp for women who want to become calmer, stronger, and more capable in mountain terrain. You run real Marina Alta trails, work on the skills that matter when the ground gets rocky and technical, and leave with clearer habits for race day.', 'For women who can run — and want to run mountains. Real Marina Alta terrain, coached properly: line choice, foot placement, braking, poles, fueling, race planning. Every single run has a job.', 1],
  ["Monika brings deep Costa Blanca trail knowledge and has raced for Lithuania at the World Championships. Anna brings current Icelandic national-team credibility, a Laugavegur podium, sub-3 marathon speed, and a teacher's instinct for explaining hard things plainly.", "Monika has raced Worlds for Lithuania and lives on these trails. Anna is Icelandic national team with a Laugavegur podium and sub-3 marathon speed. Neither has any interest in impressing you — they're here to make you better.", 1],
  ['Small because small works.', 'Why only eight?', 1],
  ['Eight runners keeps the group coachable, safer, and personal. The point is direct feedback, not being another bib in the pack.', "Because eight is the most people two athletes can genuinely coach. You'll never be a bib number here — you'll be the one whose descent line gets shouted compliments.", 1],
  // ---- timeline ----
  ['This is the shape of it — the camp is the middle, not the whole.', "You're booking four months — the camp is just the loud part in the middle.", 1],
  ["If it's a yes, you'll know why.", "If it's a yes, you'll know exactly why we picked you.", 1],
  ['Your goal race, your history, your injuries, your shoes — photograph them before you buy new ones. We start your runner card: one page about you we keep updating until your race.', 'Your goal race, your history, your dodgy ankle, your shoes — send a photo before you drop €180 on the wrong pair. We start your runner card: one page about you, updated until race day.', 1],
  ['A camp-prep layer on top of your normal training: two focused sessions a week — vertical strength, downhill work, time on feet. Three group calls: kickoff, fuelling & kit, final logistics. A short voice note from your coaches every week.', 'A camp-prep layer on top of your normal training: two focused sessions a week — vertical strength, downhill work, time on feet. Three group calls: kickoff, fuelling & kit, final logistics. And a weekly voice note from Monika and Anna — less webinar, more your fast friend checking in.', 1],
  ["The fuelling you'll use on the Long Day, so your gut trains with it too. There's other stuff in there.", "The exact fuelling you'll use on the Long Day, so your gut starts training now. There's other stuff in the box. We're not saying what.", 1],
  ['A coach meets you at arrivals; the trail talk starts in the car.', 'One of us meets you at arrivals; the trail talk starts in the car.', 1],
  ["A follow-up call once your legs are back. The group chat stays open until your goal race — and the night before it, you'll hear from us.", 'A follow-up call once your legs are back. The group chat stays open until your goal race — and the night before it, check your phone.', 1],
  // ---- arc ----
  ['Enough structure to make the trip worth the money. Enough space to recover, ask questions, eat well, and come home sharper than you arrived.', 'Enough structure to be worth the money. Enough space to recover, ask everything, eat well, and fly home sharper than you landed.', 1],
  ['Alicante transfer window, check-in near Denia, an easy coastal trail run, dinner, group goals, and route briefing.', 'Alicante transfer, check-in near Denia, an easy coastal run to shake out the flight, then dinner and the goals circle: everyone names her race and one fear, and we answer both.', 1],
  ['Rocky, technical Marina Alta trails with coached line choice, foot placement, cadence, braking, and confidence on rough ground.', 'The rocky stuff, coached hard: lines, feet, cadence, braking. We film you on the technical section — then you and one of us watch your tape that evening, one on one. Slightly weird, wildly useful.', 1],
  ['A longer route with fueling practice, heat management, pacing decisions, poles where useful, and a proper recovery meal. The goal is to learn how to move well for hours.', 'The Long Day — it gets its own section below. Fueling on schedule, real pacing decisions, poles where they help, and the answer to whether you can move well for hours. (You can. With snacks.)', 1],
  ['Short scenic loop, mobility, breakfast, personal next-race notes, group Q&A with both hosts, and the Alicante transfer window.', 'Easy scenic loop, mobility, a proper breakfast, then the handover: your race notes, printed — plan, fueling numbers, technique cues, next twelve weeks. Then the airport, annoyingly.', 1],
  // ---- long day ----
  ['Not a mindfulness exercise — practice. The last two hours of your race will be exactly this quiet.', "Sounds woo-woo. Isn't. The last two hours of your ultra will be exactly this quiet — better to meet that silence before race day.", 1],
  ['Ten minutes away, seventeen degrees, non-negotiable.', "Ten minutes away, seventeen degrees. You'll swear a little. Everyone talks about it at dinner. Non-negotiable.", 1],
  // ---- who it's for ----
  ['The first cohort stays narrow: women with a running base who want practical trail skills, warm winter terrain, and direct access to athletes who race internationally.', 'The first cohort stays narrow: women with a running base, a race worth training for, and zero patience for being talked down to.', 1],
  ['You can run, but technical descents, loose ground, poles, and fueling still feel like a second language.', 'You can hold your own on 15k, but rocky descents turn you into a very careful tourist. Not a fitness problem — a skills gap, and it closes fast with the right eyes on you.', 1],
  ['You have a mountain race on the calendar and want a focused training block with honest feedback.', "There's an ultra on your calendar and a quiet feeling you're winging it. You'll fly home with the plan written down.", 1],
  ['You want winter or spring vertical without flying to the other side of the world for it.', "Your trails are under ice until April. Ours aren't.", 1],
  ['You should already be able to run 15 km comfortably. This is not a couch-to-trail weekend.', "Get comfortable running 15 km first — then apply for Edition 2. We'll be here.", 1],
  ['No one can guarantee a podium or a breakthrough race. The promise is better skill and better decisions.', 'We promise better skills and better decisions, not miracles. Anyone promising you a podium is selling something.', 1],
  ["This is serious work, but the goal is learning. Some climbs are meant to be hiked because that's the smarter mountain decision.", "Some climbs here are meant to be hiked. That's not weakness — that's racecraft.", 1],
  // ---- hosts (softened) ----
  ["The point is not celebrity worship. It's access: two serious runners, direct coaching, and a small group where questions actually get answered.", 'Not celebrity worship — access. Two national-team athletes who coach you all four days, in a group small enough that every question gets answered. Usually at dinner, usually with strong opinions.', 1],
  ['Icelandic national-team mountain and trail runner, WMTRC athlete, Laugavegur 2025 3rd woman and W45 winner, and sub-3 marathoner who knows the Costa Blanca trails intimately.', 'Icelandic national team, 3rd woman at Laugavegur 2025 — and the W45 winner, which is the stat that should give you ideas. Sub-3 marathoner. Explains hard things plainly, like a teacher.', 1],
  ['Costa Blanca local with deep Marina Alta trail knowledge, former Lithuanian national-team runner who has raced at the World Championships, and hands-on coach for technical mountain confidence.', 'Lithuanian national team, raced Worlds, lives on these trails. Knows which lines go and which ones cliff out. Your footwork will be rebuilt by Tuesday.', 1],
  // ---- stack ----
  ['No guest-athlete rotation, no assistant guides. The ratio is the product.', 'No guest-athlete cameos, no assistant guides. The women on the website are the women on the trail.', 1],
  ['We film you on technical ground on day two and sit down with you the same evening, one to one. We found exactly one other camp in Europe that offers this.', 'Filmed on day two, watched together the same evening, one on one. Exactly one other camp in Europe offers this. We checked.', 1],
  ['On the evening of day three. Included, not an upsell.', "On the evening of day three. Included — because 'optional recovery' is camp-speak for 'pay extra'.", 1],
  ['Breakfasts, trail snacks, and group dinners. Airport transfers — driven by a coach, on purpose.', 'Breakfasts, trail snacks, and group dinners. Airport transfers driven by one of us, on purpose — best Q&A slot of the week.', 1],
  ["Assembled separately — that much coaching from athletes at this level, video analysis, massage, transfers, board — you're past €3,000. We'd rather charge €1,350 and choose who comes.", "Assembled separately — this much time with athletes at this level, video analysis, massage, transfers, board — you're past €3,000. We charge €1,350 and get to choose who comes. We like that trade.", 1],
  // ---- terms ----
  ['Per person. <!-- -->€1,800<!-- --> from Edition 2 onward. Eight runners only.', 'Per person. <!-- -->€1,800<!-- --> from Edition 2 onward. Eight women only.', 1],
  ["The discount isn't generosity, it's a trade. Edition 1 runners agree to:", "The discount isn't generosity — it's a bet you're making on our first edition, and we pay for the bet. Founding runners agree to:", 1],
  // ---- solo ----
  ['Most trail runners do.', 'You probably are. So is everyone else.', 1],
  ['The price on the page is the price — shared twin room in the villa. Your own room: +€120, which is what it costs us, not a penalty.', 'The price on the page is the price — shared twin in the villa. Your own room is +€120: our actual cost, not a single-traveler penalty.', 1],
  ["You'll arrive with zero people you know and leave with seven numbers in your phone.", 'Day 1 you know nobody. Day 4 you have seven numbers in your phone and a group chat that will not shut up, in the best way.', 1],
  // ---- faq ----
  ['Serious runners want pace, terrain, rooms, food, insurance, and risk explained before they apply.', "The stuff you'd ask us over coffee, answered before you apply.", 1],
  ['You should be comfortable running 15 km on rolling terrain and open to hiking steep climbs. The long day can be adapted, but this is not a beginner weekend.', "Comfortable running 15 km on rolling ground and happy to hike the steep stuff. The Long Day adapts to the group — this is a real training camp, but 'real' measures seriousness, not speed.", 1],
  ["Some trail experience helps, but you don't need to be an expert. This is a good fit if you have road fitness and want to move better on rougher ground.", "Some helps. If you've got road fitness and rocky ground makes you nervous, you're exactly who this is for.", 1],
  ['Yes — this edition is women-only.', 'Yes — this edition is women-only. Coaches included.', 1],
  ['Yes. The retreat is designed for solo travelers. Shared rooms are matched by preference where possible.', 'Yes — almost everyone does. Shared rooms are matched by preference, and by day two the strangers thing is over.', 1],
  ['Trail shoes, hydration vest, phone, emergency blanket, wind shell, sun protection, personal medication, and route-specific extras sent before arrival.', 'Trail shoes, hydration vest, wind shell, sun protection, emergency blanket, phone, personal meds. The full list — with our honest shoe opinions — arrives before you fly.', 1],
  // ---- routes band + final ----
  ['Five Marina Alta routes, free.', 'Steal our homework: five Marina Alta routes, free.', 1],
  ["Eight spots. Applications open before payment — tell us a little about your running and we'll be in touch with dates, logistics, and next steps.", "Eight women. Two minutes. Costs nothing — payment only happens if we offer you a spot and you take it. Tell us about your running and we'll tell you honestly whether this fits, in both directions. And if you're hesitating because you think you're not fast enough: the application asks about your running, not your PRs. Fit matters here. Speed doesn't.", 1],
];

// ---- check / apply pairs ----
// Replacements are simulated in order even in check mode, so pairs whose old
// string is contained in an earlier pair's match count correctly.
let failures = 0;
for (const [oldPlain, newPlain, expected] of PAIRS) {
  const oldS = oldPlain.startsWith('<') ? oldPlain : enc(oldPlain);
  const newS = newPlain.startsWith('<') ? newPlain : enc(newPlain);
  const n = count(html, oldS);
  if (n !== expected) {
    failures++;
    console.log(`MISMATCH (${n} found, ${expected} expected): ${oldPlain.slice(0, 70)}...`);
  } else {
    html = html.split(oldS).join(newS);
  }
}

// ---- FAQ inserts: clone the first <details> block as a template ----
const tplMatch = html.match(/<details[\s\S]*?<\/details>/);
if (!tplMatch) { failures++; console.log('MISMATCH: no <details> template found'); }

const NEW_FAQS = [
  ["I'm scared I'll be the slowest.", "Someone will be. She gets one of us beside her on every climb and the same paella at dinner. This camp doesn't do dropped runners."],
  ['What can four days actually change?', "How you move on technical ground — descending, braking, and line choice are skills, and skills move fast with expert eyes on eight people. You'll also leave with a race plan, your fueling numbers, and video of your own feet. What four days can't do: make you fitter by Sunday. Fitness takes months — that's what the eight weeks before and the plan you leave with are for. We're careful about which one we promise."],
];

if (tplMatch && !CHECK) {
  const tpl = tplMatch[0];
  // template Q/A — post-replacement values of the first FAQ item
  const tplQ = enc('How fit do I need to be?');
  const tplA = enc("Comfortable running 15 km on rolling ground and happy to hike the steep stuff. The Long Day adapts to the group — this is a real training camp, but 'real' measures seriousness, not speed.");
  if (!tpl.includes(tplQ) || !tpl.includes(tplA)) { failures++; console.log('MISMATCH: template Q/A not in first details block'); }
  else {
    const minted = NEW_FAQS.map(([q, a]) =>
      tpl.split(tplQ).join(enc(q)).split(tplA).join(enc(a)).replace(/ id="[^"]*"/g, '').replace(/ aria-controls="[^"]*"/g, '')
    ).join('');
    html = html.replace(tpl, minted + tpl);
  }
}

if (CHECK) {
  console.log(failures ? `${failures} mismatches — fix before applying` : `all ${PAIRS.length} pairs match; template OK`);
  process.exit(failures ? 1 : 0);
}
if (failures) { console.log('aborted, nothing written'); process.exit(1); }
writeFileSync(FILE, html);
console.log(`applied ${PAIRS.length} replacements + ${NEW_FAQS.length} FAQ inserts`);
