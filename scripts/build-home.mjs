import fs from 'node:fs';
import { camps, statuses, campLabel } from '../public/scripts/camps.js';
let html = fs.readFileSync('src/home.html', 'utf8');

// Ticket per camp. Confirmed dates get a postmark on the photo, open camps a rubber stamp.
const mark = c => c.dates
  ? `<span class="postmark" aria-hidden="true"><b>${c.dates.days}</b><span>${c.dates.month} ${c.year}</span></span>`
  : `<span class="rubber" aria-hidden="true">Details<br>soon</span>`;
// Ticket photos ship at 600, 800 and 1200 wide; a ticket fills the row on phones and about half of it from 64rem.
const srcset = photo => /-1200\.webp$/.test(photo) ? ` srcset="${[600, 800, 1200].map(w => `/images/${photo.replace('-1200', '-' + w)} ${w}w`).join(', ')}" sizes="(min-width:64rem) 52vw, 100vw"` : '';
// Prices sit in calm body type on the ticket, never display type.
const price = c => c.price ? `<div class="price"><table><caption class="sr">${c.month} prices per person</caption><tbody>${c.price.rows.map(([room, amount]) => `<tr><th scope="row">${room}</th><td>${amount}</td></tr>`).join('')}</tbody></table><p class="friend">${c.price.friend}</p></div>` : '';
const rows = camps.map(c => { const s = statuses[c.status]; return `<article class="camp ticket ${c.variant}${s.soon ? ' is-soon' : ''}" id="${c.id}" aria-labelledby="${c.id}-h"><div class="media"><img src="/images/${c.photo}"${srcset(c.photo)} alt="${c.alt || ''}" width="${c.width}" height="${c.height}" loading="lazy" decoding="async" style="object-position:${c.position}">${mark(c)}</div><div class="body"><div class="top"><span class="status${s.soon ? ' soon' : ''}">${s.label}</span></div><h3 class="month" id="${c.id}-h">${c.month}<small>${c.dates ? c.dates.span + ', ' + c.year : c.window || c.year}</small></h3><div class="facts">${c.facts.map(f => `<p>${f}</p>`).join('')}<p class="note">${c.note}</p></div>${price(c)}<div class="act"><a class="btn${s.soon ? ' ghost' : ''}" href="/?camp=${c.id}#interest" data-camp="${c.id}">${s.action} ${c.month}${s.actionSuffix || ''}</a><span class="fine">No payment or commitment</span></div></div></article>`; }).join('');

const options = camps.map(c => `<label class="check"><input type="checkbox" name="camps" value="${c.id}"><span><b>${campLabel(c)}</b><span>${statuses[c.status].detail}</span></span></label>`).join('');

// Hero stub: the next camp with confirmed dates, then whatever follows.
const next = camps.find(c => c.dates);
const after = camps.filter(c => c !== next).map(c => c.season || c.month).join(' and ');
const stub = next ? `<a class="stub-line" href="/?camp=${next.id}#interest" data-camp="${next.id}"><span class="lbl">Next camp</span><span class="when"><b>${next.dates.days} ${next.month}</b> ${next.year}</span><span class="go">Get the details <span aria-hidden="true">→</span></span></a>` : '';
const then = next && after ? `<p class="then">Then ${after}. Dates coming soon.</p>` : '';

// Structured data: the business, the site, every camp with confirmed dates, and the questions section.
// Built from camps.js and the <details> in src/home.html so it can't drift from what the page says.
const site = 'https://www.costablancatrailcamp.com';
const place = { '@type': 'PostalAddress', addressLocality: 'Dénia', addressRegion: 'Alicante', addressCountry: 'ES' };
const strip = t => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const graph = [
  { '@type': 'Organization', '@id': site + '/#org', name: 'Costa Blanca Trail Camp', url: site + '/', logo: site + '/apple-touch-icon.png', email: 'hello@costablancatrailcamp.com', address: place, sameAs: ['https://www.instagram.com/costablancatrailcamp/'] },
  { '@type': 'WebSite', '@id': site + '/#website', name: 'Costa Blanca Trail Camp', url: site + '/', inLanguage: 'en', publisher: { '@id': site + '/#org' } },
  ...camps.filter(c => c.dates?.start).map(c => ({
    '@type': 'Event', name: `Costa Blanca Trail Camp · ${c.month} ${c.year}`,
    description: `Women’s trail running camp in the mountains behind Dénia on the Costa Blanca, Spain. ${c.dates.span}, ${c.year}.`,
    startDate: c.dates.start, endDate: c.dates.end,
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: 'Dénia, Costa Blanca', address: place },
    image: [site + '/images/' + c.photo], organizer: { '@id': site + '/#org' },
    ...(c.price && { offers: c.price.rows.map(([room, amount]) => ({ '@type': 'Offer', name: room, price: amount.replace(/\D/g, ''), priceCurrency: 'EUR', url: site + '/#interest' })) }),
  })),
];
const faqs = [...html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)];
if (faqs.length) graph.push({ '@type': 'FAQPage', '@id': site + '/#questions', mainEntity: faqs.map(([, q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) });
const jsonld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;

html = html.replace('<!-- CAMP_ROWS -->', rows).replace('<!-- CAMP_OPTIONS -->', options).replace('<!-- NEXT_CAMP -->', stub).replace('<!-- THEN_LINE -->', then).replace('<!-- JSON_LD -->', jsonld);
fs.writeFileSync('public/index.html', '<!-- Generated from src/home.html and public/scripts/camps.js. Run npm run build:home. -->' + html);
