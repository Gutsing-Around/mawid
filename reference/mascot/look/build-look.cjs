/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) script, not app code */
// Usage: node reference/mascot/look/build-look.cjs
// Slices the N×N "look direction" sheet into frames, removes the white background, aligns
// every frame on the shoulders (so only the head moves when frames switch), and packs them
// into public/mascot/look.webp: an N×N sprite with square cells (row = up→down, column =
// left→right from the viewer), plus look-center.webp, the front frame on its own.
// GRID must match components/MascotFace.tsx.
const sharp = require("sharp");

const GRID = 9;
const SHEET = `${__dirname}/sheet-${GRID}x${GRID}.png`;
const OUT = process.argv[2] ?? `${__dirname}/../../../public/mascot`;
const CELL = 84; // output cell size in px; the header shows a frame at ~53px, so this is crisp on 2x screens

const isPaper = (r, g, b) => Math.min(r, g, b) >= 200 && Math.max(r, g, b) - Math.min(r, g, b) <= 30;

(async () => {
  const { data, info } = await sharp(SHEET).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const ink = (x, y) => !isPaper(data[(y * W + x) * 3], data[(y * W + x) * 3 + 1], data[(y * W + x) * 3 + 2]);

  // Bands of ink separated by white gutters: rows over the whole sheet, columns within each row.
  const bands = (from, to, count) => {
    const runs = []; let start = -1;
    for (let i = from; i <= to; i++) {
      const on = count(i) > 2;
      if (on && start < 0) start = i;
      if (!on && start >= 0) { runs.push([start, i - 1]); start = -1; }
    }
    if (start >= 0) runs.push([start, to]);
    return runs.filter(([a, b]) => b - a > 30);
  };
  const rows = bands(0, H - 1, (y) => { let n = 0; for (let x = 0; x < W; x++) n += ink(x, y); return n; });
  if (rows.length !== GRID) throw new Error(`expected ${GRID} rows, found ${rows.length}`);

  // Columns are evenly spaced, but hair spikes of neighbouring heads can touch, so instead of
  // looking for white gaps, cut at the line with the least ink near each expected boundary.
  const contentLeft = (() => { for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (ink(x, y)) return x; return 0; })();
  const contentRight = (() => { for (let x = W - 1; x >= 0; x--) for (let y = 0; y < H; y++) if (ink(x, y)) return x; return W - 1; })();
  const pitch = (contentRight - contentLeft) / GRID;
  const searchWidth = Math.round(pitch * 0.3);
  const cells = [];
  for (const [top, bottom] of rows) {
    const inkInColumn = (x) => { let n = 0; for (let y = top; y <= bottom; y++) n += ink(x, y); return n; };
    const cuts = [contentLeft - 1];
    for (let k = 1; k < GRID; k++) {
      const expected = Math.round(contentLeft + k * pitch);
      let best = expected, bestInk = Infinity;
      for (let x = expected - searchWidth; x <= expected + searchWidth; x++) { const n = inkInColumn(x); if (n < bestInk) { bestInk = n; best = x; } }
      cuts.push(best);
    }
    cuts.push(contentRight + 1);
    for (let k = 0; k < GRID; k++) cells.push({ left: cuts[k] + 1, right: cuts[k + 1] - 1, top, bottom });
  }

  // Shoulder anchor per cell: the horizontal centre of the cloak's widest bottom rows and the
  // bottom edge. Aligning on it keeps the body still while the head turns.
  // A row that touches the bottom edge of the sheet has its shoulders cut off; estimate its real
  // shoulder line from the typical row height of the rows above it.
  const fullHeights = rows.filter(([, b]) => b < H - 1).map(([t, b]) => b - t).slice(-3);
  const typicalHeight = fullHeights.reduce((a, b) => a + b, 0) / fullHeights.length;
  for (const c of cells) {
    let sumX = 0, n = 0;
    for (let y = c.bottom - Math.round((c.bottom - c.top) * 0.08); y <= c.bottom; y++) for (let x = c.left; x <= c.right; x++) if (ink(x, y)) { sumX += x; n++; }
    c.anchorX = sumX / n;
    c.anchorY = c.bottom >= H - 1 ? Math.round(c.top + typicalHeight) : c.bottom;
  }

  // One shared crop window (relative to the anchor) that fits every cell's head.
  const size = Math.max(...cells.map((c) => Math.max(c.right - c.left, c.bottom - c.top))) + 8;
  const tiles = [];
  for (const c of cells) {
    const left = Math.round(c.anchorX - size / 2), top = Math.round(c.anchorY - size + 4);
    // Copy the cell (only its own pixels, so neighbours never bleed in) onto a transparent square.
    const buf = Buffer.alloc(size * size * 4);
    const bg = new Uint8Array(size * size);
    const inCell = (x, y) => x >= c.left && x <= c.right && y >= c.top && y <= c.bottom;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const sx = left + x, sy = top + y, o = (y * size + x) * 4;
      if (sx < 0 || sy < 0 || sx >= W || sy >= H || !inCell(sx, sy)) { bg[y * size + x] = 1; continue; }
      const i = (sy * W + sx) * 3;
      buf[o] = data[i]; buf[o + 1] = data[i + 1]; buf[o + 2] = data[i + 2]; buf[o + 3] = 255;
    }
    // Flood the white paper from the window edges (keeps the enclosed white lenses).
    const stack = [];
    const paperAt = (k) => { const o = k * 4; return isPaper(buf[o], buf[o + 1], buf[o + 2]); };
    const push = (k) => { if (!bg[k] && paperAt(k)) { bg[k] = 1; stack.push(k); } };
    for (let k = 0; k < size; k++) { push(k); push((size - 1) * size + k); push(k * size); push(k * size + size - 1); }
    for (let k = 0; k < size * size; k++) if (bg[k]) stack.push(k); // spread from out-of-cell area too
    while (stack.length) {
      const k = stack.pop(), x = k % size, y = (k / size) | 0;
      for (const j of [x > 0 ? k - 1 : -1, x < size - 1 ? k + 1 : -1, y > 0 ? k - size : -1, y < size - 1 ? k + size : -1]) if (j >= 0) push(j);
    }
    for (let k = 0; k < size * size; k++) {
      const o = k * 4;
      if (bg[k]) { buf[o + 3] = 0; continue; }
      // Soften light anti-aliased edge pixels next to the background (no white halo).
      const x = k % size, y = (k / size) | 0;
      const edge = [k - 1, k + 1, k - size, k + size].some((j, idx) => (idx === 0 ? x > 0 : idx === 1 ? x < size - 1 : idx === 2 ? y > 0 : y < size - 1) && bg[j]);
      if (edge) {
        const L = (buf[o] + buf[o + 1] + buf[o + 2]) / 3;
        if (L > 120) {
          const a = Math.max(0, Math.min(1, (255 - L) / 135));
          buf[o + 3] = Math.round(a * 255);
          if (a > 0.05) for (let ch = 0; ch < 3; ch++) buf[o + ch] = Math.max(0, Math.min(255, (buf[o + ch] - 255 * (1 - a)) / a));
        }
      }
    }
    tiles.push(await sharp(buf, { raw: { width: size, height: size, channels: 4 } }).resize(CELL, CELL).png().toBuffer());
  }

  await sharp({ create: { width: CELL * GRID, height: CELL * GRID, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(tiles.map((input, i) => ({ input, left: (i % GRID) * CELL, top: Math.floor(i / GRID) * CELL })))
    .webp({ quality: 70, alphaQuality: 80, effort: 6 })
    .toFile(`${OUT}/look.webp`);
  // The front-facing frame on its own: shown immediately, before the sprite is loaded.
  await sharp(tiles[Math.floor((GRID * GRID) / 2)]).webp({ quality: 82, alphaQuality: 88, effort: 6 }).toFile(`${OUT}/look-center.webp`);
  console.log(`window ${size}px → ${CELL}px cells; anchors x:`, cells.map((c) => Math.round(c.anchorX)).join(","));
})();
