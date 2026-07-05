// Generates the favicon set from the site's logo mark (circle/mountains/waves).
// Dark brand-ink coin + cream strokes → legible in light and dark tabs.
// Outputs: favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180).
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
mkdirSync(pub, { recursive: true });

const INK = '#18211C'; // --ploy-neutral-dark
const CREAM = '#F4EFE3'; // --ploy-neutral-primary

const MARK = `
  <circle cx="20" cy="20" r="18.5" stroke="${CREAM}" stroke-width="2" fill="none"/>
  <path d="M9 24.5L16.5 14l5 6.5 3-3.5L31 24.5" stroke="${CREAM}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M8 28.5c2.4 0 2.4-1.8 4.8-1.8s2.4 1.8 4.8 1.8 2.4-1.8 4.8-1.8 2.4 1.8 4.8 1.8 2.4-1.8 4.8-1.8" stroke="${CREAM}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"/>`;

// Round coin on transparent — browser tab favicon.
const coin = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 44 44">
  <circle cx="20" cy="20" r="22" fill="${INK}"/>${MARK}
</svg>`;

// Solid square — iOS home screen (Apple rounds the corners itself).
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 52 52">
  <rect x="-6" y="-6" width="52" height="52" fill="${INK}"/>${MARK}
</svg>`;

writeFileSync(join(pub, 'favicon.svg'), coin);

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

const [p16, p32, p48, p180] = await Promise.all([
  png(coin, 16),
  png(coin, 32),
  png(coin, 48),
  png(square, 180),
]);

writeFileSync(join(pub, 'favicon.ico'), await pngToIco([p16, p32, p48]));
writeFileSync(join(pub, 'apple-touch-icon.png'), p180);

console.log('favicon set written: favicon.svg, favicon.ico, apple-touch-icon.png');
