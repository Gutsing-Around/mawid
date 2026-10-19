/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) script, not app code */
// Usage: node reference/mascot/face.cjs   (regenerates public/mascot/face.webp, the header avatar)
// Builds public/mascot/face.webp: the celebrating head, centred, background removed, round-masked.
const sharp = require("sharp");
const SRC = `${__dirname}/celebrate.png`;
const OUT = process.argv[2] ?? `${__dirname}/../../public/mascot`;
const [L, T, S] = [395, 48, 446]; // square crop on the 1254px original, centred on the face
const isPaper = (r, g, b) => Math.min(r, g, b) >= 196 && Math.max(r, g, b) - Math.min(r, g, b) <= 28;
(async () => {
  const { data, info } = await sharp(SRC).extract({ left: L, top: T, width: S, height: S }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, n = W * H, bg = new Uint8Array(n), st = [];
  const push = (i) => { if (!bg[i] && isPaper(data[i * 3], data[i * 3 + 1], data[i * 3 + 2])) { bg[i] = 1; st.push(i); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (st.length) { const i = st.pop(), x = i % W, y = (i / W) | 0; if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (y > 0) push(i - W); if (y < H - 1) push(i + W); }
  const out = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) { out[i * 4] = data[i * 3]; out[i * 4 + 1] = data[i * 3 + 1]; out[i * 4 + 2] = data[i * 3 + 2]; out[i * 4 + 3] = bg[i] ? 0 : 255; }
  // Lens boxes (for the glints), as % of the crop
  const seen = new Uint8Array(n), lenses = [];
  const white = (i) => !bg[i] && data[i * 3] > 238 && data[i * 3 + 1] > 238 && data[i * 3 + 2] > 238;
  for (let s = 0; s < n; s++) {
    if (seen[s] || !white(s)) continue;
    const q = [s]; seen[s] = 1; let a = W, b = H, c = 0, d = 0;
    for (let k = 0; k < q.length; k++) { const i = q[k], x = i % W, y = (i / W) | 0; a = Math.min(a, x); c = Math.max(c, x); b = Math.min(b, y); d = Math.max(d, y);
      for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < n && !seen[j] && white(j)) { seen[j] = 1; q.push(j); } }
    if (q.length > 1200) lenses.push([a, b, c, d].map((v) => +(v / W * 100).toFixed(1)));
  }
  console.log("lens boxes % [left, top, right, bottom]:", JSON.stringify(lenses));
  const mask = Buffer.from(`<svg width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="#fff"/></svg>`);
  const masked = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  await sharp(masked).resize(256, 256).webp({ quality: 88, alphaQuality: 95 }).toFile(`${OUT}/face.webp`);
  console.log("ok");
})();
