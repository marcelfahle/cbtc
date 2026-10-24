import fs from 'node:fs';
import { camps, statuses, campLabel } from '../public/scripts/camps.js';
let html = fs.readFileSync('src/home.html', 'utf8');

// Ticket per camp. Confirmed dates get a postmark on the photo, open camps a rubber stamp.
const mark = c => c.dates
  ? `<span class="postmark" aria-hidden="true"><b>${c.dates.days}</b><span>${c.dates.month} ${c.year}</span></span>`
  : `<span class="rubber" aria-hidden="true">Details<br>soon</span>`;
// Prices sit in calm body type on the ticket, never display type.
const price = c => c.price ? `<div class="price"><table><caption class="sr">${c.month} prices per person</caption><tbody>${c.price.rows.map(([room, amount]) => `<tr><th scope="row">${room}</th><td>${amount}</td></tr>`).join('')}</tbody></table><p class="friend">${c.price.friend}</p></div>` : '';
const rows = camps.map(c => { const s = statuses[c.status]; return `<article class="camp ticket ${c.variant}${s.soon ? ' is-soon' : ''}" id="${c.id}" aria-labelledby="${c.id}-h"><div class="media"><img src="/images/${c.photo}" alt="" width="${c.width}" height="${c.height}" loading="lazy" decoding="async" style="object-position:${c.position}">${mark(c)}</div><div class="body"><div class="top"><span class="status${s.soon ? ' soon' : ''}">${s.label}</span></div><h3 class="month" id="${c.id}-h">${c.month}<small>${c.dates ? c.dates.span + ', ' + c.year : c.window || c.year}</small></h3><div class="facts">${c.facts.map(f => `<p>${f}</p>`).join('')}<p class="note">${c.note}</p></div>${price(c)}<div class="act"><a class="btn${s.soon ? ' ghost' : ''}" href="/?camp=${c.id}#interest" data-camp="${c.id}">${s.action} ${c.month}${s.actionSuffix || ''}</a><span class="fine">No payment or commitment</span></div></div></article>`; }).join('');

const options = camps.map(c => `<label class="check"><input type="checkbox" name="camps" value="${c.id}"><span><b>${campLabel(c)}</b><span>${statuses[c.status].detail}</span></span></label>`).join('');

// Hero stub: the next camp with confirmed dates, then whatever follows.
const next = camps.find(c => c.dates);
const after = camps.filter(c => c !== next).map(c => c.season || c.month).join(' and ');
const stub = next ? `<a class="stub-line" href="/?camp=${next.id}#interest" data-camp="${next.id}"><span class="lbl">Next camp</span><span class="when"><b>${next.dates.days} ${next.month}</b> ${next.year}</span><span class="go">Get the details <span aria-hidden="true">→</span></span></a>` : '';
const then = next && after ? `<p class="then">Then ${after}. Dates coming soon.</p>` : '';

html = html.replace('<!-- CAMP_ROWS -->', rows).replace('<!-- CAMP_OPTIONS -->', options).replace('<!-- NEXT_CAMP -->', stub).replace('<!-- THEN_LINE -->', then);
fs.writeFileSync('public/index.html', '<!-- Generated from src/home.html and public/scripts/camps.js. Run npm run build:home. -->' + html);
