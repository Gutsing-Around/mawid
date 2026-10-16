// Helpers shared by the design mockups: data, Arabic counting rules, formatting, logos, watchlist, ticker.
(function () {
  const M = window.MAWID;
  const nowSec = () => Math.floor(Date.now() / 1000);
  // Rebase the snapshot so the first episode is always just ahead of "now".
  const shift = nowSec() - M.snapshotAt;
  const items = M.items.map((i) => ({ ...i, airingAt: i.airingAt + shift }));

  const LOCALE = "ar-u-nu-latn";
  const BRAND = {
    Crunchyroll: "#F47521", Netflix: "#E50914", YouTube: "#FF2D2D", HIDIVE: "#00BAFF",
    "Amazon Prime Video": "#1A98FF", "Prime Video": "#1A98FF", "Bilibili TV": "#00AEEC", Bilibili: "#00AEEC",
    iQ: "#00CC36", iQIYI: "#00CC36", "Tencent Video": "#FF8A00", WeTV: "#FF6A00", Crackle: "#F79C1F",
    "Tubi TV": "#FFE600", Hulu: "#1CE783", "Disney Plus": "#4F8BFF", Max: "#5B7CFF", "Apple TV": "#F4F1F1",
    Funimation: "#9B5CFF",
  };
  // Brands without a logo in Simple Icons are shown as a short wordmark.
  const WORDMARK = {
    Hulu: "hulu", HIDIVE: "HIDIVE", iQ: "iQIYI", iQIYI: "iQIYI", WeTV: "WeTV", "Tencent Video": "Tencent",
    Crackle: "crackle", OceanVeil: "OceanVeil", "Disney Plus": "Disney+",
  };
  const GENRE_AR = {
    Action: "أكشن", Adventure: "مغامرة", Comedy: "كوميدي", Drama: "دراما", Ecchi: "إيحاءات للكبار",
    Fantasy: "فانتازيا", Horror: "رعب", "Mahou Shoujo": "فتيات سحريات", Mecha: "ميكا", Music: "موسيقى",
    Mystery: "غموض", Psychological: "نفسي", Romance: "رومانسي", "Sci-Fi": "خيال علمي",
    "Slice of Life": "شريحة من الحياة", Sports: "رياضي", Supernatural: "خارق للطبيعة", Thriller: "إثارة",
  };

  // 1 ساعة، 2 ساعتين، 3–10 ساعات، 11+ ساعة
  const FORMS = {
    d: ["يوم", "يومين", "أيام"], h: ["ساعة", "ساعتين", "ساعات"],
    m: ["دقيقة", "دقيقتين", "دقائق"], s: ["ثانية", "ثانيتين", "ثوانٍ"], ep: ["حلقة", "حلقتين", "حلقات"],
  };
  const noun = (n, u) => (n === 2 ? FORMS[u][1] : n >= 3 && n <= 10 ? FORMS[u][2] : FORMS[u][0]);
  const count = (n, u) => (n === 1 || n === 2 ? noun(n, u) : `${n} ${noun(n, u)}`);
  const pad2 = (n) => String(n).padStart(2, "0");
  const parts = (sec) => {
    sec = Math.max(0, sec);
    return { d: Math.floor(sec / 86400), h: Math.floor((sec % 86400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
  };
  function countdownText(sec) {
    if (sec <= 0) return sec > -1800 ? "تُعرض الآن" : "عُرضت";
    const p = parts(sec);
    if (p.d) return p.h ? `بعد ${count(p.d, "d")} و${count(p.h, "h")}` : `بعد ${count(p.d, "d")}`;
    if (p.h) return p.m ? `بعد ${count(p.h, "h")} و${count(p.m, "m")}` : `بعد ${count(p.h, "h")}`;
    return `بعد ${pad2(p.m)}:${pad2(p.s)}`;
  }
  function clockText(sec) {
    if (sec <= 0) return sec > -1800 ? "تُعرض الآن" : "عُرضت";
    const p = parts(sec);
    if (p.d) return `بعد ${count(p.d, "d")}`;
    return `${pad2(p.h)}:${pad2(p.m)}:${pad2(p.s)}`;
  }

  const fmtCache = {};
  const fmt = (locale, opts) => (fmtCache[locale + JSON.stringify(opts)] ??= new Intl.DateTimeFormat(locale, opts));
  const time = (t) => fmt(LOCALE, { hour: "numeric", minute: "2-digit" }).format(t * 1000);
  const weekday = (t) => fmt(LOCALE, { weekday: "long" }).format(t * 1000);
  const weekdayTime = (t) => fmt(LOCALE, { weekday: "long", hour: "numeric", minute: "2-digit" }).format(t * 1000);
  const dateLabel = (t) => fmt(LOCALE, { day: "numeric", month: "long" }).format(t * 1000);
  const dayKey = (t) => fmt("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(t * 1000);
  const hourOfDay = (t) => { const d = new Date(t * 1000); return d.getHours() + d.getMinutes() / 60; };

  const WIDE = new Set(["Amazon Prime Video", "Prime Video", "Tubi TV", "Max"]);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function logo(p, size = "") {
    const path = M.logos[p.site];
    const inner = path ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>` : esc(WORDMARK[p.site] || p.site);
    return `<a class="logo ${path ? (WIDE.has(p.site) ? "wide" : "") : "word"} ${size}" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"
      style="--brand:${BRAND[p.site] || "#2bd97c"}" title="${esc(p.site)}" aria-label="شاهد على ${esc(p.site)}">${inner}</a>`;
  }
  const logos = (platforms, size) => `<div class="logos">${platforms.map((p) => logo(p, size)).join("")}</div>`;
  const genres = (list) => list.map((g) => GENRE_AR[g] || g);

  // Days present in the data, relative to the visitor's today.
  function days() {
    const keys = [...new Set(items.map((i) => dayKey(i.airingAt)))].sort();
    const today = dayKey(nowSec());
    return keys.filter((k) => k >= today).map((key, i) => {
      const sample = items.find((x) => dayKey(x.airingAt) === key).airingAt;
      return { key, label: i === 0 ? "اليوم" : i === 1 ? "غدًا" : weekday(sample), date: dateLabel(sample) };
    });
  }

  // Watchlist (per browser)
  let favs;
  try { favs = new Set(JSON.parse(localStorage.getItem("mawid.designs.favs") || "[]")); } catch { favs = new Set(); }
  function toggleFav(mediaId) {
    if (favs.has(mediaId)) favs.delete(mediaId);
    else favs.add(mediaId);
    try { localStorage.setItem("mawid.designs.favs", JSON.stringify([...favs])); } catch {}
  }
  const star = (i) => `<button class="star" data-fav="${i.mediaId}" aria-pressed="${favs.has(i.mediaId)}" aria-label="أضف إلى قائمتي">★</button>`;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav]");
    if (!b) return;
    toggleFav(+b.dataset.fav);
    document.querySelectorAll(`[data-fav="${b.dataset.fav}"]`).forEach((x) => x.setAttribute("aria-pressed", String(favs.has(+b.dataset.fav))));
    document.dispatchEvent(new Event("mawid:favs"));
  });

  // One ticker for every countdown on the page. Modes: text, clock, boxes.
  function tick() {
    const now = nowSec();
    document.querySelectorAll("[data-cd]").forEach((el) => {
      const left = +el.dataset.cd - now;
      const mode = el.dataset.mode || "text";
      if (mode === "boxes") {
        const p = parts(left);
        el.querySelectorAll("[data-u]").forEach((box) => {
          const v = p[box.dataset.u];
          box.querySelector(".num").textContent = pad2(v);
          box.querySelector(".lab").textContent = noun(v, box.dataset.u);
        });
        return;
      }
      el.textContent = mode === "clock" ? clockText(left) : countdownText(left);
      el.classList.toggle("soon", left > 0 && left < 3600);
      el.classList.toggle("live", left <= 0 && left > -1800);
    });
    document.dispatchEvent(new CustomEvent("mawid:tick", { detail: now }));
  }
  const boxes = (t, cls = "") => `<div class="${cls}" data-cd="${t}" data-mode="boxes" role="timer">
      ${["d", "h", "m", "s"].map((u) => `<div class="box" data-u="${u}"><b class="num">00</b><small class="lab"></small></div>`).join("")}</div>`;

  // Bottom switcher between mockups
  function nav(current) {
    const pages = [["poster.html", "ملصقات"], ["tickets.html", "تذاكر"], ["spotlight.html", "أضواء"], ["index.html", "كل التصاميم"]];
    document.body.insertAdjacentHTML("beforeend", `<nav class="designs-nav" aria-label="التصاميم">${pages
      .map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`);
  }

  window.Mawid = {
    items, nowSec, count, noun, pad2, parts, countdownText, clockText, time, weekday, weekdayTime, dateLabel,
    dayKey, hourOfDay, esc, logo, logos, genres, days, favs, star, boxes, tick, nav,
  };
  setInterval(tick, 1000);
})();
