// Self-hosts the snapshot images. The hero PNG (5.3MB) becomes a ~300KB webp —
// same pixels, sane weight — plus a 1200x630 og.jpg for link previews.
import sharp from 'sharp';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const snap = join(root, 'ploy-snapshot/2026-07-05-v2');
const out = join(root, 'public/images');
mkdirSync(out, { recursive: true });

const hero = join(snap, '362c96ed-ai-generated-1783245070200.png');
const meta = await sharp(hero).metadata();
console.log(`hero source: ${meta.width}x${meta.height}`);

await sharp(hero)
  .resize({ width: Math.min(meta.width, 2560), withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(join(out, 'hero.webp'));

await sharp(hero)
  .resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 84 })
  .toFile(join(out, 'og.jpg'));

copyFileSync(join(snap, '7844c515-slurp-annaberglind.webp'), join(out, 'anna.webp'));
copyFileSync(join(snap, 'efd25b63-slurp-monikafahle.webp'), join(out, 'monika.webp'));
copyFileSync(join(snap, 'favicon.ico'), join(root, 'public/favicon.ico'));
copyFileSync(join(snap, 'robots.txt'), join(root, 'public/robots.txt'));

mkdirSync(join(root, 'public/styles'), { recursive: true });
copyFileSync(join(snap, 'site.css'), join(root, 'public/styles/site.css'));

console.log('images + static assets in place');
