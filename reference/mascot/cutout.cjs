// Usage: node reference/mascot/cutout.cjs   (regenerates public/mascot/*.webp)
// Removes the white background from the mascot images and writes transparent WebPs.
// Flood-fills "paper" pixels from the image border (so enclosed whites like the glasses
// survive), softens the edge pixels with an alpha ramp and removes the white fringe.
const sharp = require("sharp");
const fs = require("fs");

const SRC = __dirname; // the original white-background PNGs next to this script
const OUT = process.argv[2] ?? `${__dirname}/../../public/mascot`;
const FILES = { "celebrate.png": "celebrate", "fix.png": "fix", "confused.png": "confused", "sleepy.png": "sleepy", "cool.png": "cool" };
// Height (fraction of the image) below which enclosed white regions are cleared; the lenses sit above it.
const KEEP_ABOVE = { cool: 0.31 };

const isPaper = (r, g, b) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return min >= 196 && max - min <= 28; // white paper and the light grey floor shadow
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [file, name] of Object.entries(FILES)) {
    const { data, info } = await sharp(`${SRC}/${file}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const n = W * H;
    const bg = new Uint8Array(n);
    const stack = [];
    const push = (i) => { if (!bg[i] && isPaper(data[i * 3], data[i * 3 + 1], data[i * 3 + 2])) { bg[i] = 1; stack.push(i); } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (stack.length) {
      const i = stack.pop(), x = i % W, y = (i / W) | 0;
      if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (y > 0) push(i - W); if (y < H - 1) push(i + W);
    }

    // Enclosed paper regions (gaps between legs, holes in the cape) aren't reached from the
    // border. The white glasses lenses are enclosed too, but always sit on the head, so only
    // enclosed regions whose centre is below the head area are cleared.
    const seen = new Uint8Array(n);
    for (let start = 0; start < n; start++) {
      if (bg[start] || seen[start] || !isPaper(data[start * 3], data[start * 3 + 1], data[start * 3 + 2])) continue;
      const region = [start]; seen[start] = 1;
      let sumY = 0;
      for (let k = 0; k < region.length; k++) {
        const i = region[k], x = i % W, y = (i / W) | 0;
        sumY += y;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j >= 0 && !seen[j] && !bg[j] && isPaper(data[j * 3], data[j * 3 + 1], data[j * 3 + 2])) { seen[j] = 1; region.push(j); }
        }
      }
      if (sumY / region.length / H > (KEEP_ABOVE[name] ?? 0.42)) for (const i of region) bg[i] = 1;
    }

    const out = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
      let r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2], a = 255;
      if (bg[i]) a = 0;
      else {
        // Edge pixel (touching background): fade light anti-aliasing to transparent and
        // remove the white it was blended with, so there's no halo on the dark site.
        const x = i % W, y = (i / W) | 0;
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H && bg[yy * W + xx]) { edge = true; break; }
        }
        if (edge) {
          const L = (r + g + b) / 3;
          if (L > 120) {
            const alpha = Math.max(0, Math.min(1, (255 - L) / (255 - 120)));
            a = Math.round(alpha * 255);
            if (alpha > 0.05) {
              r = Math.max(0, Math.min(255, (r - 255 * (1 - alpha)) / alpha));
              g = Math.max(0, Math.min(255, (g - 255 * (1 - alpha)) / alpha));
              b = Math.max(0, Math.min(255, (b - 255 * (1 - alpha)) / alpha));
            }
          }
        }
      }
      out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
    }

    await sharp(out, { raw: { width: W, height: H, channels: 4 } })
      .trim({ threshold: 1 })
      .resize({ width: 640, height: 640, fit: "inside" })
      .webp({ quality: 84, alphaQuality: 90, effort: 6 })
      .toFile(`${OUT}/${name}.webp`);
    const meta = await sharp(`${OUT}/${name}.webp`).metadata();
    console.log(name, `${meta.width}x${meta.height}`, `${(fs.statSync(`${OUT}/${name}.webp`).size / 1024).toFixed(0)} KB`);
  }
})();
