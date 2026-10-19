/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) script, not app code */
// Usage: node reference/mascot/look/build-look.cjs
// Slices the owner's two transparent "look direction" sheets (sheet-a.png, sheet-b.png: 4 rows ×
// 9 columns each, every row running from looking up to looking down) into frames, sorts the 8
// rows by how far the head tilts (ROW_ORDER), aligns every frame on the shoulders (so only the
// head moves when frames switch), and packs them into public/mascot/look.webp: a 9-column ×
// 8-row sprite with square cells (row = up→down, column = left→right from the viewer), plus
// look-center.webp, the level front-facing frame on its own.
// COLS, ROWS and LEVEL_ROW must match components/MascotFace.tsx.
const sharp = require("sharp");

const SHEETS = ["sheet-a.png", "sheet-b.png"];
const COLS = 9;
const ROWS_PER_SHEET = 4;
/**
 * The two sheets cover the same range, at slightly different tilts. Sorted by tilt (measured from
 * the height of the glasses above the shoulders), from looking furthest up to looking down;
 * "b3" = sheet b, row 3.
 */
const ROW_ORDER = ["b1", "a1", "a2", "b2", "a3", "b3", "a4", "b4"];
const LEVEL_ROW = ROW_ORDER.indexOf("b3"); // looking straight ahead
const OUT = process.argv[2] ?? `${__dirname}/../../../public/mascot`;
const CELL = 96; // output cell size in px; the header shows a frame at ~53px, so this is crisp on 2x screens

(async () => {
  const cells = {}; // "a1" → [{ sheet, left, right, top, bottom }, … one per column]
  const sheets = {};
  for (const [s, file] of SHEETS.entries()) {
    const key = "ab"[s];
    const { data, info } = await sharp(`${__dirname}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const ink = (x, y) => data[(y * W + x) * 4 + 3] > 40;
    sheets[key] = { data, W, H, ink };

    // Rows are separated by transparent gutters.
    const rows = []; let start = -1;
    for (let y = 0; y < H; y++) {
      let n = 0; for (let x = 0; x < W; x++) n += ink(x, y);
      if (n > 2 && start < 0) start = y;
      if (n <= 2 && start >= 0) { rows.push([start, y - 1]); start = -1; }
    }
    if (start >= 0) rows.push([start, H - 1]);
    const bands = rows.filter(([a, b]) => b - a > 30);
    if (bands.length !== ROWS_PER_SHEET) throw new Error(`${file}: expected ${ROWS_PER_SHEET} rows, found ${bands.length}`);

    // Columns are evenly spaced, but hair spikes of neighbouring heads can touch, so instead of
    // looking for gaps, cut at the line with the least ink near each expected boundary.
    let contentLeft = W, contentRight = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink(x, y)) { contentLeft = Math.min(contentLeft, x); contentRight = Math.max(contentRight, x); }
    const pitch = (contentRight - contentLeft) / COLS;
    const searchWidth = Math.round(pitch * 0.3);
    bands.forEach(([top, bottom], r) => {
      const inkInColumn = (x) => { let n = 0; for (let y = top; y <= bottom; y++) n += ink(x, y); return n; };
      const cuts = [contentLeft - 1];
      for (let k = 1; k < COLS; k++) {
        const expected = Math.round(contentLeft + k * pitch);
        let best = expected, bestInk = Infinity;
        for (let x = expected - searchWidth; x <= expected + searchWidth; x++) { const n = inkInColumn(x); if (n < bestInk) { bestInk = n; best = x; } }
        cuts.push(best);
      }
      cuts.push(contentRight + 1);
      cells[`${key}${r + 1}`] = Array.from({ length: COLS }, (_, k) => ({ sheet: key, left: cuts[k] + 1, right: cuts[k + 1] - 1, top, bottom }));
    });
  }

  // Cut each frame out: only its own cell's pixels, keeping the figure and the parts connected to
  // it (a neighbour's hair tip crossing the cut, or a stray speck, is dropped).
  const frames = ROW_ORDER.flatMap((id) => cells[id]).map((c) => {
    const { data, W, ink } = sheets[c.sheet];
    const w = c.right - c.left + 1, h = c.bottom - c.top + 1;
    const label = new Int32Array(w * h).fill(-1);
    const sizes = [];
    for (let k = 0; k < w * h; k++) {
      if (label[k] >= 0 || !ink(c.left + (k % w), c.top + ((k / w) | 0))) continue;
      const id = sizes.length; let size = 0; const stack = [k]; label[k] = id;
      while (stack.length) {
        const j = stack.pop(), x = j % w, y = (j / w) | 0; size++;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy, n = ny * w + nx;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || label[n] >= 0 || !ink(c.left + nx, c.top + ny)) continue;
          label[n] = id; stack.push(n);
        }
      }
      sizes.push(size);
    }
    const keep = sizes.map((s) => s >= Math.max(...sizes) * 0.03);
    const buf = Buffer.alloc(w * h * 4);
    let minY = h, maxY = 0;
    for (let k = 0; k < w * h; k++) {
      const x = k % w, y = (k / w) | 0, i = ((c.top + y) * W + c.left + x) * 4;
      // Faint anti-aliasing next to a kept part stays; everything else outside the figure is cleared.
      const near = label[k] >= 0 ? keep[label[k]] : [k - 1, k + 1, k - w, k + w].some((n) => n >= 0 && n < w * h && label[n] >= 0 && keep[label[n]]);
      if (!near || data[i + 3] < 16) continue;
      data.copy(buf, k * 4, i, i + 4);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    // Shoulder anchor: the centre of the cloak's bottom rows and the bottom edge. Aligning on it
    // keeps the body still while the head turns.
    let sumX = 0, n = 0;
    for (let y = maxY - Math.round((maxY - minY) * 0.08); y <= maxY; y++) for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > 40) { sumX += x; n++; }
    return { buf, w, h, anchorX: sumX / n, anchorY: maxY, height: maxY - minY };
  });

  // One shared square window (relative to the anchor) that fits every frame.
  const size = Math.max(...frames.map((f) => Math.max(f.w, f.height))) + 8;
  const tiles = await Promise.all(frames.map((f) => {
    const left = Math.round(size / 2 - f.anchorX), top = Math.round(size - 4 - f.anchorY);
    return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: f.buf, raw: { width: f.w, height: f.h, channels: 4 }, left, top }])
      .png().toBuffer()
      .then((square) => sharp(square).resize(CELL, CELL).png().toBuffer());
  }));

  const rows = ROW_ORDER.length;
  await sharp({ create: { width: CELL * COLS, height: CELL * rows, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * CELL, top: Math.floor(i / COLS) * CELL })))
    .webp({ quality: 72, alphaQuality: 80, effort: 6 })
    .toFile(`${OUT}/look.webp`);
  // The level, front-facing frame on its own: shown immediately, before the sprite is loaded.
  await sharp(tiles[LEVEL_ROW * COLS + (COLS - 1) / 2]).webp({ quality: 82, alphaQuality: 88, effort: 6 }).toFile(`${OUT}/look-center.webp`);
  console.log(`${COLS}×${rows} frames, window ${size}px → ${CELL}px cells, level row ${LEVEL_ROW}`);
})();
