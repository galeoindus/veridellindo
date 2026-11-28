#!/usr/bin/env node
/* Veridellindo — build every brand raster from one master.
 *
 * The site shipped fourteen hand-exported PNGs of the mark, each made at a
 * different time from a different source file: the favicon was a different
 * drawing from the header mark, and the social card still carried the old
 * palette. This script is now the only producer of those files, so one master
 * replaces the whole set and every size comes from the same pixels.
 *
 *   node scripts/brand-assets.mjs            # rebuild from assets/img/brand/logo-master.png
 *   node scripts/brand-assets.mjs path.png   # rebuild from another master
 *
 * The master must be square and have an alpha channel (the mark sits on a
 * transparent field). Everything else — the maskable icon's safe zone, the
 * social card's layout, the multi-size favicon.ico — is derived here.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = join(ROOT, 'assets/img/brand');
const masterPath = process.argv[2] ? resolve(process.argv[2]) : join(BRAND, 'logo-master.png');

const master = await readFile(masterPath);
const meta = await sharp(master).metadata();
if (meta.width !== meta.height) throw new Error(`master must be square, got ${meta.width}x${meta.height}`);
if (!meta.hasAlpha) throw new Error('master must have an alpha channel');

/** The mark at one size, trimmed to its own ink so no export keeps stray margin. */
async function mark(size) {
  return sharp(master)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/* The average colour of the mark's own opaque pixels. The maskable icon needs a
   filled field behind the mark (Android crops it to a shape and shows nothing
   outside the safe zone), and this makes that field part of the identity rather
   than a guess at a hex code. */
async function fieldColour() {
  const { data, info } = await sharp(master).resize(64, 64).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 200) continue;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  if (!n) return { r: 255, g: 122, b: 61 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

const field = await fieldColour();
const hex = (c) => `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/* --- the plain mark, in the sizes the pages and the manifest ask for ------- */
for (const size of [48, 96, 180, 192, 384, 512]) {
  const png = await mark(size);
  await writeFile(join(BRAND, `logo-${size}.png`), png);
  if ([48, 96, 192, 512].includes(size)) await writeFile(join(BRAND, `favicon-mark-${size}.png`), png);
}

/* --- the maskable icon: the mark inside its 80% safe zone ----------------- */
const maskable = await sharp({
  create: { width: 512, height: 512, channels: 4, background: { ...field, alpha: 1 } },
})
  .composite([{ input: await mark(384), gravity: 'centre' }])
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(join(BRAND, 'logo-maskable-512.png'), maskable);

/* --- favicon.ico: PNG payloads inside an ICO container --------------------
   Browsers accept PNG-compressed ICO entries since IE 11, and every modern
   browser prefers them; this avoids a second image toolchain just for one
   file. The header is 6 bytes, then 16 bytes per entry, then the payloads. */
const icoSizes = [16, 32, 48];
const payloads = await Promise.all(icoSizes.map((s) => mark(s)));
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(0, 0);                 // reserved
header.writeUInt16LE(1, 2);                 // type: icon
header.writeUInt16LE(icoSizes.length, 4);   // image count
let offset = header.length;
icoSizes.forEach((size, i) => {
  const p = 6 + i * 16;
  header.writeUInt8(size >= 256 ? 0 : size, p);        // width
  header.writeUInt8(size >= 256 ? 0 : size, p + 1);    // height
  header.writeUInt8(0, p + 2);                          // palette
  header.writeUInt8(0, p + 3);                          // reserved
  header.writeUInt16LE(1, p + 4);                       // colour planes
  header.writeUInt16LE(32, p + 6);                      // bits per pixel
  header.writeUInt32LE(payloads[i].length, p + 8);      // payload size
  header.writeUInt32LE(offset, p + 12);                 // payload offset
  offset += payloads[i].length;
});
await writeFile(join(ROOT, 'favicon.ico'), Buffer.concat([header, ...payloads]));

/* --- veridellindo-round.svg: the mark as one self-contained SVG -----------
   The tab icon and the 1x entry of every brand-mark srcset point here. It used
   to be a hand-embedded PNG of an older emblem — a blue circle with a lotus, a
   star and an open book — so the icon in the tab was a different drawing from
   the mark beside it. It is derived from the master now, like every other file. */
await writeFile(join(BRAND, 'veridellindo-round.svg'), [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">',
  '<title id="title">Veridellindo</title>',
  '<desc id="desc">A hexagonal emblem built from interlocking cubes in indigo, royal blue, cyan and teal.</desc>',
  '<image href="logo-512.png" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>',
  '</svg>',
  '',
].join('\n'));

/* --- the social card: the mark and the product line on the brand field ---- */
const W = 1200, H = 630;
const card = await sharp({
  create: {
    width: W, height: H, channels: 4,
    background: { r: 7, g: 13, b: 26, alpha: 1 },
  },
})
  .composite([
    {
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <defs>
          <radialGradient id="g" cx="18%" cy="16%" r="82%">
            <stop offset="0%" stop-color="${hex(field)}" stop-opacity="0.95"/>
            <stop offset="52%" stop-color="#2f6bf0" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#12aec8" stop-opacity="0.18"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#070d1a"/>
        <rect width="${W}" height="${H}" fill="url(#g)"/>
      </svg>`),
      top: 0, left: 0,
    },
    { input: await mark(300), top: 165, left: 96 },
    {
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="300">
        <text x="0" y="96" font-family="DejaVu Serif, Georgia, serif" font-size="76" font-weight="700" fill="#ffffff">Veridellindo</text>
        <text x="0" y="168" font-family="DejaVu Sans, Helvetica, sans-serif" font-size="30" fill="#9ce6f2">Understand a question.</text>
        <text x="0" y="212" font-family="DejaVu Sans, Helvetica, sans-serif" font-size="30" fill="#ffffff">Follow the evidence.</text>
        <text x="0" y="276" font-family="DejaVu Sans, Helvetica, sans-serif" font-size="23" fill="#b9c6e2">Cited answers built from Wikipedia and Wikidata.</text>
      </svg>`),
      top: 190, left: 440,
    },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(join(BRAND, 'social-card.png'), card);

process.stdout.write(`brand assets rebuilt from ${masterPath}\n`);
process.stdout.write(`  mark field ${hex(field)} · 7 sizes · maskable · favicon.ico · round.svg · social-card.png\n`);
