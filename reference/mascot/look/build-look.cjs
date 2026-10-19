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
const ROW_ORDER = ["b1", "a1", "b2", "a2", "a3", "b3", "a4", "b4"];
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
  // Cut each frame out: only its own cell's pixels, and only the figure itself (the largest
  // connected shape) plus its soft anti-aliased edge. A neighbour's hair tip crossing the cut, or
  // any stray speck, is dropped.
  const cutOut = (c) => {
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
    const figure = sizes.indexOf(Math.max(...sizes));
    const buf = Buffer.alloc(w * h * 4);
    for (let k = 0; k < w * h; k++) {
      const x = k % w, y = (k / w) | 0, i = ((c.top + y) * W + c.left + x) * 4;
      const onFigure = label[k] === figure ||
        (label[k] < 0 && [k - 1, k + 1, k - w, k + w].some((n) => n >= 0 && n < w * h && label[n] === figure));
      if (onFigure && data[i + 3] >= 16) data.copy(buf, k * 4, i, i + 4);
    }
    return { buf, w, h };
  };

  // Bounds of the opaque figure, and the cloak's width a little above its bottom edge.
  const measure = ({ buf, w, h }) => {
    let minY = h, maxY = 0;
    for (let k = 0; k < w * h; k++) if (buf[k * 4 + 3] > 128) { const y = (k / w) | 0; minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const y = maxY - Math.round((maxY - minY) * 0.1);
    let left = w, right = 0;
    for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > 128) { left = Math.min(left, x); right = Math.max(right, x); }
    return { minY, maxY, cloakWidth: right - left };
  };

  // The rows weren't all drawn at the same size (the looking-down rows are ~6% bigger), so every
  // row is scaled to the same cloak width: otherwise the head swells and shrinks as it turns.
  const median = (list) => [...list].sort((a, b) => a - b)[list.length >> 1];
  const cutRows = ROW_ORDER.map((id) => cells[id].map(cutOut));
  const rowWidths = cutRows.map((row) => median(row.map((f) => measure(f).cloakWidth)));
  const targetWidth = median(rowWidths);
  const frames = [];
  for (const [r, row] of cutRows.entries()) {
    const scale = targetWidth / rowWidths[r];
    for (const f of row) {
      const w = Math.round(f.w * scale), h = Math.round(f.h * scale);
      const buf = await sharp(f.buf, { raw: { width: f.w, height: f.h, channels: 4 } }).resize(w, h).raw().toBuffer();
      const m = measure({ buf, w, h });
      // Shoulder anchor: the centre of the cloak's bottom rows and the bottom edge.
      let sumX = 0, n = 0;
      for (let y = m.maxY - Math.round((m.maxY - m.minY) * 0.08); y <= m.maxY; y++) for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > 128) { sumX += x; n++; }
      frames.push({ buf, w, h, anchorX: sumX / n, anchorY: m.maxY, height: m.maxY - m.minY });
    }
  }

  // One shared square window that fits every frame (with room for the alignment shifts below).
  const SHIFT = { x: 10, y: 6 };
  const size = Math.max(...frames.map((f) => Math.max(f.w, f.height))) + 2 * SHIFT.x + 8;
  const place = (f) => ({ left: Math.round(size / 2 - f.anchorX), top: Math.round(size - 4 - SHIFT.y - f.anchorY) });
  const alphaIn = (f, left, top, x, y) => {
    const fx = x - left, fy = y - top;
    return fx < 0 || fy < 0 || fx >= f.w || fy >= f.h ? 0 : f.buf[(fy * f.w + fx) * 4 + 3];
  };

  // Align every frame on the cloak of the level, front-facing frame: try small shifts around the
  // shoulder anchor and keep the one where the cloaks overlap best. The body then stays exactly
  // still and only the head turns.
  const reference = frames[LEVEL_ROW * COLS + (COLS - 1) / 2];
  const ref = place(reference);
  const bandTop = ref.top + reference.anchorY - Math.round(reference.height * 0.28);
  const bandBottom = ref.top + reference.anchorY;
  for (const f of frames) {
    const start = place(f);
    let best = { cost: Infinity, left: start.left, top: start.top };
    for (let dy = -SHIFT.y; dy <= SHIFT.y; dy++) for (let dx = -SHIFT.x; dx <= SHIFT.x; dx++) {
      let cost = 0;
      for (let y = bandTop; y <= bandBottom; y += 2) for (let x = 0; x < size; x += 2) {
        cost += Math.abs(alphaIn(f, start.left + dx, start.top + dy, x, y) - alphaIn(reference, ref.left, ref.top, x, y));
      }
      if (cost < best.cost) best = { cost, left: start.left + dx, top: start.top + dy };
    }
    f.left = best.left;
    f.top = best.top;
  }

  const tiles = await Promise.all(frames.map((f) =>
    sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: f.buf, raw: { width: f.w, height: f.h, channels: 4 }, left: f.left, top: f.top }])
      .png().toBuffer()
      .then((square) => sharp(square).resize(CELL, CELL).png().toBuffer()),
  ));

  const rows = ROW_ORDER.length;
  await sharp({ create: { width: CELL * COLS, height: CELL * rows, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * CELL, top: Math.floor(i / COLS) * CELL })))
    .webp({ quality: 72, alphaQuality: 80, effort: 6 })
    .toFile(`${OUT}/look.webp`);
  // The level, front-facing frame on its own: shown immediately, before the sprite is loaded.
  await sharp(tiles[LEVEL_ROW * COLS + (COLS - 1) / 2]).webp({ quality: 82, alphaQuality: 88, effort: 6 }).toFile(`${OUT}/look-center.webp`);
  console.log(`${COLS}×${rows} frames, window ${size}px → ${CELL}px cells, level row ${LEVEL_ROW}, row scales`, rowWidths.map((w) => (targetWidth / w).toFixed(3)).join(" "));
})();
