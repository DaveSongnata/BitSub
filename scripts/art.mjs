/**
 * Turns the raw ChatGPT art in docs/art-src/ into the app's final assets.
 *   node scripts/art.mjs
 *
 * docs/art-src/bitsub-mascot.png         → public/illustrations/mascot.png (transparent, SLSO8 colors)
 * docs/art-src/bitsub-icon-master.png    → public/icons/icon-{192,512}.png, apple-touch-icon.png, icon-maskable-{192,512}.png
 * docs/art-src/bitsub-favicon-master.png → public/favicon.ico, public/icons/favicon-{16,32}.png
 * docs/art-src/state-ai-thinking.png     → public/illustrations/ai-thinking.png (optional)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'docs/art-src/';
const SLSO8 = ['#ffecd6', '#ffd4a3', '#ffaa5e', '#d08159', '#8d697a', '#544e68', '#203c56', '#0d2b45'].map((h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);

mkdirSync('public/icons', { recursive: true });
mkdirSync('public/illustrations', { recursive: true });

const nearest = (r, g, b) => {
  let best = SLSO8[0];
  let bd = Infinity;
  for (const c of SLSO8) {
    const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2;
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
};

/** Transparent sprite: snap colors to SLSO8, hard alpha, remove white/near-white backdrop, trim, pad. */
async function sprite(file, out, size, hook) {
  const { data, info } = await sharp(SRC + file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Backdrop removal by flood fill from the borders (handles a white or checkerboard-free light backdrop)
  const isBackdrop = (i) => data[i + 3] < 128 || (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235);
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBackdrop(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (data[i + 3] < 128) {
      data[i + 3] = 0;
      continue;
    }
    const [r, g, b] = nearest(data[i], data[i + 1], data[i + 2]);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
    const x = p % w;
    const y = (p / w) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const extra = hook ? hook(data, w, h) : undefined;
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const side = Math.round(Math.max(cw, ch) * 1.1);
  const offX = Math.round((side - cw) / 2);
  const offY = Math.round((side - ch) / 2);
  const pct = (v) => Math.round(v * 10000) / 100;
  // Maps a box in source pixels to percentages of the final square image
  const map = (b) => ({
    left: pct((b.x0 - minX + offX) / side),
    top: pct((b.y0 - minY + offY) / side),
    width: pct((b.x1 - b.x0 + 1) / side),
    height: pct((b.y1 - b.y0 + 1) / side),
  });
  const trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .png()
    .toBuffer();
  await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: trimmed, left: offX, top: offY }])
    .png()
    .toBuffer()
    .then((buf) => sharp(buf).resize(size, size, { kernel: 'nearest' }).png({ compressionLevel: 9 }).toFile(out));
  console.log('wrote', out);
  return { dots: extra, map };
}

async function icons() {
  const master = sharp(SRC + 'bitsub-icon-master.png').removeAlpha();
  const { data, info } = await master.clone().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => {
    const i = (y * w + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };

  for (const [name, size] of [
    ['icon-512.png', 512],
    ['icon-192.png', 192],
    ['apple-touch-icon.png', 180],
  ]) {
    await master.clone().resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`public/icons/${name}`);
    console.log('wrote', name);
  }

  // Maskable: rebuild the scanline backdrop from the left edge, lift the artwork off it and shrink it
  // into the 80% safe circle, so nothing gets cut by round/squircle masks.
  const bgRow = Array.from({ length: h }, (_, y) => px(8, y));
  const bg = Buffer.alloc(w * h * 3);
  const fg = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const [br, bgc, bb] = bgRow[y];
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      bg[i * 3] = br;
      bg[i * 3 + 1] = bgc;
      bg[i * 3 + 2] = bb;
      const [r, g, b] = px(x, y);
      const diff = Math.abs(r - br) + Math.abs(g - bgc) + Math.abs(b - bb);
      fg[i * 4] = r;
      fg[i * 4 + 1] = g;
      fg[i * 4 + 2] = b;
      fg[i * 4 + 3] = diff > 36 ? 255 : 0;
    }
  }
  const scale = 0.78;
  const fw = Math.round(w * scale);
  const art = await sharp(fg, { raw: { width: w, height: h, channels: 4 } })
    .resize(fw, fw, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const maskable = await sharp(bg, { raw: { width: w, height: h, channels: 3 } })
    .composite([{ input: art, left: Math.round((w - fw) / 2), top: Math.round((h - fw) / 2) }])
    .png()
    .toBuffer();
  for (const size of [512, 192]) {
    await sharp(maskable)
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toFile(`public/icons/icon-maskable-${size}.png`);
    console.log('wrote', `icon-maskable-${size}.png`);
  }
}

/** ICO with embedded PNGs (supported by every current browser). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.buf)]);
}

async function favicon() {
  // Crop the empty navy margin so the bubble fills the tiny tile.
  const src = sharp(SRC + 'bitsub-favicon-master.png').removeAlpha();
  const { width: w } = await src.metadata();
  const crop = Math.round(w * 0.18);
  const base = await src
    .extract({ left: crop, top: crop, width: w - crop * 2, height: w - crop * 2 })
    .png()
    .toBuffer();
  const out = [];
  for (const size of [16, 32, 48]) {
    const buf = await sharp(base).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
    out.push({ size, buf });
    if (size !== 48) writeFileSync(`public/icons/favicon-${size}.png`, buf);
  }
  writeFileSync('public/favicon.ico', ico(out));
  console.log('wrote favicon.ico + favicon-16/32');
}

/**
 * "AI thinking" art: the three orange dots inside the thought bubble are erased from the image
 * and their positions saved, so the app can draw them on top and animate them (blink in turn).
 */
async function thinking() {
  const file = 'state-ai-thinking.png';
  const out = 'public/illustrations/ai-thinking.png';
  await sprite(file, out, 512, (data, w, h) => {
    const ORANGE = SLSO8[2];
    const isOrange = (p) =>
      data[p * 4 + 3] === 255 && data[p * 4] === ORANGE[0] && data[p * 4 + 1] === ORANGE[1] && data[p * 4 + 2] === ORANGE[2];
    const seen = new Uint8Array(w * h);
    const dots = [];
    for (let p = 0; p < w * h; p++) {
      if (seen[p] || !isOrange(p)) continue;
      // Collect one orange blob
      const blob = [];
      const stack = [p];
      seen[p] = 1;
      while (stack.length) {
        const q = stack.pop();
        blob.push(q);
        const x = q % w;
        const y = (q / w) | 0;
        for (const n of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, y > 0 ? q - w : -1, y < h - 1 ? q + w : -1]) {
          if (n >= 0 && !seen[n] && isOrange(n)) {
            seen[n] = 1;
            stack.push(n);
          }
        }
      }
      let x0 = w,
        y0 = h,
        x1 = 0,
        y1 = 0;
      for (const q of blob) {
        const x = q % w;
        const y = (q / w) | 0;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
      // A dot sits inside the bubble: the ring around it is a single light color (the bubble), not the navy outline.
      const ring = [];
      const R = 6; // sample the bubble a few pixels away, past the soft edge of the dot
      for (let x = x0 - R; x <= x1 + R; x++) ring.push([x, y0 - R], [x, y1 + R]);
      for (let y = y0 - R; y <= y1 + R; y++) ring.push([x0 - R, y], [x1 + R, y]);
      const counts = new Map();
      for (const [x, y] of ring) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = (y * w + x) * 4;
        const key = data[i + 3] ? `${data[i]},${data[i + 1]},${data[i + 2]}` : 'none';
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const light = new Set(['255,236,214', '255,212,163']); // cream, peach (the bubble)
      const onlyBubble = [...counts.keys()].every((k) => light.has(k));
      if (onlyBubble && blob.length > 50) {
        const fill = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])[0][0]
          .split(',')
          .map(Number);
        dots.push({ x0, y0, x1, y1, fill });
      }
    }
    dots.sort((a, b) => a.x0 - b.x0);
    if (dots.length !== 3) throw new Error(`expected 3 dots in the bubble, found ${dots.length}`);
    for (const d of dots) {
      for (let y = d.y0 - 4; y <= d.y1 + 4; y++)
        for (let x = d.x0 - 4; x <= d.x1 + 4; x++) {
          const i = (y * w + x) * 4;
          data[i] = d.fill[0];
          data[i + 1] = d.fill[1];
          data[i + 2] = d.fill[2];
        }
    }
    return dots;
  }).then(({ dots, map }) => {
    const meta = dots.map((d) => map(d));
    writeFileSync('src/assets/ai-thinking.json', JSON.stringify({ dots: meta }, null, 2) + '\n');
    console.log('wrote src/assets/ai-thinking.json', JSON.stringify(meta));
  });
}

/** Connected blobs of one exact color (4-neighbour flood fill). */
function blobs(data, w, h, color) {
  const is = (p) =>
    data[p * 4 + 3] === 255 && data[p * 4] === color[0] && data[p * 4 + 1] === color[1] && data[p * 4 + 2] === color[2];
  const seen = new Uint8Array(w * h);
  const out = [];
  for (let p = 0; p < w * h; p++) {
    if (seen[p] || !is(p)) continue;
    const pixels = [];
    const stack = [p];
    seen[p] = 1;
    let x0 = w,
      y0 = h,
      x1 = 0,
      y1 = 0;
    while (stack.length) {
      const q = stack.pop();
      pixels.push(q);
      const x = q % w;
      const y = (q / w) | 0;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const n of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, y > 0 ? q - w : -1, y < h - 1 ? q + w : -1]) {
        if (n >= 0 && !seen[n] && is(n)) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    out.push({ pixels, x0, y0, x1, y1 });
  }
  return out;
}

/**
 * Mascot without its eyes (they're drawn and animated by the app: they follow the cursor and blink).
 * Eyes = the two roundish cream blobs on the navy screen; the subtitle lines are wide, so they're skipped.
 */
async function mascotEyes() {
  const [CREAM, NAVY] = [SLSO8[0], SLSO8[7]];
  const { dots, map } = await sprite('bitsub-mascot.png', 'public/illustrations/mascot-eyeless.png', 512, (data, w, h) => {
    const eyes = blobs(data, w, h, CREAM)
      .filter((b) => b.pixels.length > 200)
      .filter((b) => {
        const bw = b.x1 - b.x0 + 1;
        const bh = b.y1 - b.y0 + 1;
        return bw / bh > 0.6 && bw / bh < 1.6;
      })
      .sort((a, b) => b.pixels.length - a.pixels.length)
      .slice(0, 2)
      .sort((a, b) => a.x0 - b.x0);
    if (eyes.length !== 2) throw new Error(`expected 2 eyes, found ${eyes.length}`);
    // Screen = the navy area around the eyes: erase a slightly bigger box so no soft edge remains
    for (const e of eyes)
      for (let y = e.y0 - 3; y <= e.y1 + 3; y++)
        for (let x = e.x0 - 3; x <= e.x1 + 3; x++) {
          const i = (y * w + x) * 4;
          [data[i], data[i + 1], data[i + 2]] = NAVY;
        }
    return eyes;
  });
  const meta = dots.map((d) => map(d));
  writeFileSync('src/assets/mascot-eyes.json', JSON.stringify({ eyes: meta }, null, 2) + '\n');
  console.log('wrote src/assets/mascot-eyes.json', JSON.stringify(meta));
}

/** Pixel-art cursors (arrow + hand), 1x and 2x, orange with a navy outline. */
async function cursors() {
  const ART = {
    arrow: [
      'X...........',
      'XX..........',
      'XOX.........',
      'XOOX........',
      'XOOOX.......',
      'XOOOOX......',
      'XOOOOOX.....',
      'XOOOOOOX....',
      'XOOOOOOOX...',
      'XOOOOOOOOX..',
      'XOOOOOOOOOX.',
      'XOOOOOOXXXXX',
      'XOOOXOOX....',
      'XOOX.XOOX...',
      'XOX..XOOX...',
      'XX....XOOX..',
      'X.....XOOX..',
      '.......XX...',
    ],
    hand: [
      '.....XX.........',
      '....XOOX........',
      '....XOOX........',
      '....XOOX........',
      '....XOOXXX......',
      '....XOOXOOXXX...',
      '.XX.XOOXOOXOOXX.',
      'XOOXXOOOOOOOOOX.',
      'XOOOXOOOOOOOOOX.',
      '.XOOOOOOOOOOOOX.',
      '..XOOOOOOOOOOOX.',
      '..XOOOOOOOOOOX..',
      '...XOOOOOOOOOX..',
      '...XOOOOOOOOX...',
      '....XOOOOOOOX...',
      '....XXXXXXXXX...',
    ],
  };
  const COLORS = { X: [13, 43, 69, 255], O: [255, 170, 94, 255], '.': [0, 0, 0, 0] };
  mkdirSync('public/cursors', { recursive: true });
  for (const [name, rows] of Object.entries(ART)) {
    const cols = Math.max(...rows.map((r) => r.length));
    for (const [suffix, scale] of [
      ['', 2],
      ['@2x', 4],
    ]) {
      const w = cols * scale;
      const h = rows.length * scale;
      const buf = Buffer.alloc(w * h * 4);
      rows.forEach((row, y) =>
        [...row.padEnd(cols, '.')].forEach((ch, x) => {
          const c = COLORS[ch] ?? COLORS['.'];
          for (let dy = 0; dy < scale; dy++)
            for (let dx = 0; dx < scale; dx++) buf.set(c, ((y * scale + dy) * w + x * scale + dx) * 4);
        })
      );
      await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
        .png()
        .toFile(`public/cursors/${name}${suffix}.png`);
    }
    console.log('wrote cursor', name);
  }
}

mkdirSync('src/assets', { recursive: true });
await sprite('bitsub-mascot.png', 'public/illustrations/mascot.png', 512);
await mascotEyes();
await cursors();
if (existsSync(SRC + 'state-ai-thinking.png')) await thinking();
await icons();
await favicon();
