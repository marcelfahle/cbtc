// Transplants the ploy snapshot into public/index.html as a complete document.
// Served verbatim (no Astro templating touches it) — faithful by construction.
// Only substitutions: assets → self-hosted, ploy runtime scripts → removed,
// forms → tagged for our own handler (+ honeypot), our forms.js appended.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = join(root, 'ploy-snapshot/2026-07-05-v2/site.html');
const html = readFileSync(SNAP, 'utf8');

const GCS = 'https://storage.googleapis.com/ployai/92f654e6-4219-47e1-bfcb-aaae16b4c0cd/user/';
const IMAGE_MAP = {
  [`${GCS}362c96ed-ai-generated-1783245070200.png`]: '/images/hero.webp',
  [`${GCS}7844c515-slurp-annaberglind.webp`]: '/images/anna.webp',
  [`${GCS}efd25b63-slurp-monikafahle.webp`]: '/images/monika.webp',
};

const stripScripts = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, '');
const swapImages = (s) =>
  Object.entries(IMAGE_MAP).reduce((acc, [from, to]) => acc.split(from).join(to), s);

// ---- html attrs ----
const htmlAttrs = html.match(/<html([^>]*)>/i)[1].trim();

// ---- head ----
let head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
head = stripScripts(head);
head = head.replace(/href="\/_ploy_static\/[^"]*\.css"/, 'href="/styles/site.css"');
// og:image must be an absolute URL on our own domain
head = swapImages(head).replace(
  'https://www.costablancatrailcamp.com/images/hero.webp',
  'https://www.costablancatrailcamp.com/images/og.jpg'
);

// ---- body ----
const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
const bodyAttrs = bodyMatch[1].trim().replace(/\s+/g, ' ');
let body = stripScripts(bodyMatch[2]);
body = swapImages(body);

// Tag the two forms for our handler and slip a honeypot into each.
const HONEYPOT =
  '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;height:0;width:0;opacity:0">';
let formCount = 0;
body = body.replace(/<form([^>]*)>/g, (m, attrs) => {
  formCount++;
  const name = attrs.includes('max-w-[420px]') ? 'routes' : 'apply';
  return `<form${attrs} data-form="${name}">${HONEYPOT}`;
});

const doc = `<!doctype html>
<html ${htmlAttrs}>
<head>${head}</head>
<body ${bodyAttrs}>${body}
<script src="/scripts/forms.js" defer></script>
</body>
</html>
`;

mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public/index.html'), doc);

console.log(`ported: ${doc.length}b → public/index.html, forms tagged: ${formCount}`);
if (formCount !== 2) console.warn('WARNING: expected 2 forms — snapshot layout may have changed');
