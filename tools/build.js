/* ============================================================
   Kürt Yöresel — Statik Site Üretici
   Kullanım: node tools/build.js
   Girdi:  tools/data/products.json, tools/data/blog.json
   Çıktı:  docs/  (GitHub Pages kaynağı)
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

/* ---------------- Yapılandırma ---------------- */
const SITE_URL = "https://kurtyoresel.com"; // özel alan adı
const SITE_NAME = "Kürt Yöresel";
const SITE_TAGLINE = "Kirasfistan, Şal û Şepik ve Yöresel Kürt Kıyafetleri";
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const ROOT_DIR = path.join(__dirname, "..");
const OUT = path.join(ROOT_DIR, "docs");
const DATA = path.join(__dirname, "data");
const ASSETS_SRC = path.join(__dirname, "assets");
const PHOTOS_DIR = path.join(__dirname, "photos"); // buraya <slug>.jpg koyarsan SVG yerine fotoğraf kullanılır

const CATEGORIES = {
  kirasfistan: {
    name: "Kirasfistan",
    title: "Kirasfistan Modelleri – Yöresel Kürt Elbiseleri",
    desc: "Botan'dan Serhat'a, kadifeden pul payete yöresel kirasfistan modelleri. El işçiliğiyle hazırlanan Kürt kadın elbiselerini keşfedin, ön sipariş talebinizi bırakın.",
    intro: "Kirasfistan; kiras (iç elbise) ve fistan (üst elbise) ile şûtik kuşağından oluşan geleneksel Kürt kadın kıyafetidir. Düğünlerin, nişanların ve özel günlerin vazgeçilmezi olan kirasfistanları; yöresine, kumaşına ve işlemesine göre bu sayfada bir arada bulabilirsiniz."
  },
  "sal-u-sepik": {
    name: "Şal û Şepik",
    title: "Şal û Şepik Takımları – Geleneksel Kürt Erkek Kıyafeti",
    desc: "Yün dokuma şal û şepik takımları: şepik ceket, şal pantolon ve şûtik kuşak. Geleneksel Kürt erkek kıyafetlerinde yöresel dokuma kalitesini keşfedin.",
    intro: "Şal û şepik; şepik adı verilen ceket ile şal adı verilen geniş kesim pantolondan oluşan, bele şûtik kuşak sarılarak tamamlanan geleneksel Kürt erkek takımıdır. Tiftik ve yün dokuma kumaşlarıyla hem şık hem dayanıklıdır."
  },
  pusi: {
    name: "Puşi",
    title: "Puşi Modelleri – Otantik Kürt Şalı ve Poşu",
    desc: "Siyah-beyaz, kırmızı-beyaz ve renkli puşi (poşu) modelleri. Püsküllü, yumuşak dokuma otantik puşileri inceleyin ve ön sipariş talebi bırakın.",
    intro: "Puşi (poşu), omuza atılan ya da başa sarılan püsküllü geleneksel örtüdür. Hem günlük kombinlere otantik bir dokunuş katar hem de halay başında ve özel günlerde geleneği yaşatır."
  },
  aksesuar: {
    name: "Aksesuar",
    title: "Kofi, Şûtik ve Heybe – Yöresel Aksesuarlar",
    desc: "Kofi başlıklar, şûtik kuşaklar, kilim desenli heybeler ve el örgüsü yöresel çoraplar. Kürt yöresel kıyafetlerini tamamlayan aksesuarları keşfedin.",
    intro: "Bir kirasfistanı ya da şal û şepiği tamamlayan şey detaylardır: pullu kofiler, ipek şûtikler, kilim desenli heybeler ve el örgüsü çoraplar. Yöresel aksesuar koleksiyonumuz bu sayfada."
  }
};

/* ---------------- Yardımcılar ---------------- */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fmtPrice(n) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n) + " TL";
}
function writeFile(rel, content) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/* Renk yardımcıları */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function shade(hex, pct) { // pct: -100..100 (negatif koyulaştırır)
  const [r, g, b] = hexToRgb(hex);
  if (pct >= 0) return rgbToHex(r + (255 - r) * pct / 100, g + (255 - g) * pct / 100, b + (255 - b) * pct / 100);
  const f = 1 + pct / 100;
  return rgbToHex(r * f, g * f, b * f);
}
function mixWhite(hex, pct) { return shade(hex, pct); }

/* Deterministik rastgelelik (git diff kararlılığı için) */
function seededRand(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/* Quadratic bezier üzerinde nokta */
function qPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
  ];
}

/* ============================================================
   SVG SANAT MOTORU
   ============================================================ */
const MOTIFS = {
  diamond: '<path d="M0-9L7 0 0 9-7 0Z" fill="none" stroke="CUR" stroke-width="2"/><circle r="2.4" fill="CUR"/>',
  star: '<path d="M0-9L2.2-2.9 8.6-2.8 3.5 1.1 5.3 7.3 0 3.6-5.3 7.3-3.5 1.1-8.6-2.8-2.2-2.9Z" fill="CUR"/>',
  zigzag: '<path d="M-9 3L-4.5-3 0 3 4.5-3 9 3" fill="none" stroke="CUR" stroke-width="2.4" stroke-linecap="round"/>',
  rose: '<circle cx="0" cy="-5" r="3.2" fill="CUR"/><circle cx="5" cy="0" r="3.2" fill="CUR"/><circle cx="0" cy="5" r="3.2" fill="CUR"/><circle cx="-5" cy="0" r="3.2" fill="CUR"/><circle r="2.2" fill="CUR" opacity="0.6"/>',
  tulip: '<path d="M0-8C3-5 6-4 5 1 3 5 0 6 0 6 0 6-3 5-5 1-6-4-3-5 0-8Z" fill="CUR"/><path d="M0 6V9" stroke="CUR" stroke-width="2"/>',
  sun: '<circle r="4" fill="CUR"/><g stroke="CUR" stroke-width="1.8" stroke-linecap="round"><path d="M0-9V-6"/><path d="M0 9V6"/><path d="M-9 0H-6"/><path d="M9 0H6"/><path d="M-6.4-6.4-4.2-4.2"/><path d="M6.4 6.4 4.2 4.2"/><path d="M-6.4 6.4-4.2 4.2"/><path d="M6.4-6.4 4.2-4.2"/></g>',
  chevron: '<path d="M-8-2L0-8 8-2" fill="none" stroke="CUR" stroke-width="2.4" stroke-linecap="round"/><path d="M-8 5L0-1 8 5" fill="none" stroke="CUR" stroke-width="2.4" stroke-linecap="round"/>',
  paisley: '<path d="M2-8C7-6 8 0 5 4 2 8-4 8-6 4-7 1-5-1-3-1-1-1 0 1-1 3" fill="none" stroke="CUR" stroke-width="2.2" stroke-linecap="round"/>'
};

function motifDef(id, motif, color) {
  const shape = (MOTIFS[motif] || MOTIFS.diamond).split("CUR").join(color);
  return `<g id="${id}">${shape}</g>`;
}

function svgOpen(w, h, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">`;
}

function bgLayer(w, h, base, accent, motif, seed) {
  const soft = mixWhite(base, 88);
  const soft2 = mixWhite(base, 78);
  const rand = seededRand(seed + "-bg");
  let dots = "";
  for (let i = 0; i < 10; i++) {
    const x = 40 + rand() * (w - 80);
    const y = 40 + rand() * (h - 80);
    const sc = 0.9 + rand() * 0.9;
    dots += `<use href="#bgm" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${sc.toFixed(2)})" opacity="0.35"/>`;
  }
  const archW = w * 0.66, archX = (w - archW) / 2;
  return `
  <defs>
    <linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mixWhite(base, 93)}"/>
      <stop offset="1" stop-color="${soft}"/>
    </linearGradient>
    ${motifDef("bgm", motif, soft2)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bgg)"/>
  ${dots}
  <path d="M ${archX} ${h * 0.92} V ${h * 0.30} Q ${archX} ${h * 0.13} ${w / 2} ${h * 0.13} Q ${w - archX} ${h * 0.13} ${w - archX} ${h * 0.30} V ${h * 0.92}"
        fill="none" stroke="${mixWhite(accent, 45)}" stroke-width="3" opacity="0.5"/>`;
}

function sparklesLayer(seed, count, region) {
  const rand = seededRand(seed + "-spark");
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = region.x + rand() * region.w;
    const y = region.y + rand() * region.h;
    const s = 2.4 + rand() * 3.4;
    const o = 0.35 + rand() * 0.5;
    out += `<path d="M${x.toFixed(0)} ${(y - s).toFixed(0)}L${(x + s * 0.32).toFixed(1)} ${(y - s * 0.32).toFixed(1)} ${(x + s).toFixed(0)} ${y.toFixed(0)} ${(x + s * 0.32).toFixed(1)} ${(y + s * 0.32).toFixed(1)} ${x.toFixed(0)} ${(y + s).toFixed(0)} ${(x - s * 0.32).toFixed(1)} ${(y + s * 0.32).toFixed(1)} ${(x - s).toFixed(0)} ${y.toFixed(0)} ${(x - s * 0.32).toFixed(1)} ${(y - s * 0.32).toFixed(1)}Z" fill="#fff" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

/* -------- Kirasfistan çizimi -------- */
function svgKirasfistan(p, title) {
  const { p1, p2, ac } = p.art.palette;
  const motif = p.art.motif || "diamond";
  const sleeve = p.art.sleeve || "dökümlü";
  const seed = p.slug;
  const d1 = shade(p1, -22), l1 = shade(p1, 22), l2 = shade(p1, 40);
  const acL = shade(ac, 20);

  /* Kol varyantları (sol kol; sağ kol aynalanır) */
  const sleeves = {
    "dökümlü": `M340 214 C270 240 200 330 168 432 C150 486 138 520 126 556 C162 544 198 520 226 488 C264 444 298 378 324 318 C332 288 338 248 340 214 Z`,
    "klasik": `M340 214 C282 240 224 322 196 420 C184 462 176 492 168 522 C198 510 226 490 248 462 C280 422 306 366 326 314 C334 284 338 248 340 214 Z`,
    "dar": `M340 214 C312 246 296 300 290 360 C286 402 286 434 290 462 C306 458 320 448 330 434 C338 402 342 356 344 314 C344 280 342 244 340 214 Z`
  };
  const sleevePath = sleeves[sleeve] || sleeves["dökümlü"];

  /* Etek kıvrım çizgileri */
  let folds = "";
  const foldXs = [330, 362, 400, 438, 470];
  foldXs.forEach((fx, i) => {
    const spread = (fx - 400) * 1.9;
    folds += `<path d="M${fx} 400 C ${fx + spread * 0.25} 540, ${400 + spread * 0.75} 700, ${400 + spread} 862" stroke="${l2}" stroke-width="3" fill="none" opacity="${i === 2 ? 0.5 : 0.38}"/>`;
  });

  /* Etek ucu bordür motifleri (kavis boyunca) */
  const hp0 = [190, 838], hp1 = [400, 872], hp2 = [610, 838];
  let hemMotifs = "";
  for (let i = 0; i <= 10; i++) {
    const [mx, my] = qPoint(hp0, hp1, hp2, i / 10);
    hemMotifs += `<use href="#hm" transform="translate(${mx.toFixed(0)} ${my.toFixed(0)}) scale(0.95)"/>`;
  }

  /* Kuşak saçakları */
  let fringes = "";
  for (let i = 0; i < 4; i++) {
    const fx = 370 + i * 9;
    fringes += `<path d="M${fx} 404 C ${fx - 6} 440, ${fx - 2} 460, ${fx - 8} 486" stroke="${acL}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }

  /* Gerdanlık pulları */
  let coins = "";
  for (let i = 0; i < 5; i++) {
    const cx = 368 + i * 16;
    const cy = 246 + Math.abs(i - 2) * -4 + 8;
    coins += `<circle cx="${cx}" cy="${cy}" r="4.2" fill="${ac}"/>`;
  }

  const spark = p.art.sparkle ? sparklesLayer(seed, 30, { x: 240, y: 300, w: 320, h: 520 }) : "";

  return `${svgOpen(800, 1000, title)}
  ${bgLayer(800, 1000, p1, ac, motif, seed)}
  <defs>
    <linearGradient id="skirt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${l1}"/>
      <stop offset="0.55" stop-color="${p1}"/>
      <stop offset="1" stop-color="${d1}"/>
    </linearGradient>
    <linearGradient id="bodice" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${l1}"/>
      <stop offset="1" stop-color="${p1}"/>
    </linearGradient>
    <linearGradient id="slv" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(p2, 14)}"/>
      <stop offset="1" stop-color="${shade(p2, -18)}"/>
    </linearGradient>
    <linearGradient id="belt" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${acL}"/>
      <stop offset="0.5" stop-color="${ac}"/>
      <stop offset="1" stop-color="${shade(ac, -18)}"/>
    </linearGradient>
    ${motifDef("hm", motif, shade(ac, -6))}
    ${motifDef("cm", motif, acL)}
  </defs>
  <ellipse cx="400" cy="912" rx="215" ry="26" fill="#26190f" opacity="0.13"/>
  <!-- Etek -->
  <path d="M345 392 C322 520 246 700 168 870 Q 400 912 632 870 C554 700 478 520 455 392 Z" fill="url(#skirt)"/>
  <path d="M345 392 C322 520 246 700 168 870 Q 260 886 320 890 C 300 700 320 520 352 392 Z" fill="${d1}" opacity="0.35"/>
  <path d="M455 392 C478 520 554 700 632 870 Q 540 886 480 890 C 500 700 480 520 448 392 Z" fill="${d1}" opacity="0.35"/>
  ${folds}
  <path d="M190 838 Q 400 878 610 838" fill="none" stroke="${ac}" stroke-width="6" opacity="0.9"/>
  ${hemMotifs}
  <!-- Kollar -->
  <path d="${sleevePath}" fill="url(#slv)"/>
  <path d="${sleevePath}" fill="url(#slv)" transform="translate(800 0) scale(-1 1)"/>
  <!-- Beden -->
  <path d="M338 206 C330 280 336 340 346 392 L454 392 C464 340 470 280 462 206 C438 194 416 190 400 190 C384 190 362 194 338 206 Z" fill="url(#bodice)"/>
  <path d="M368 204 C378 236 390 258 400 268 C410 258 422 236 432 204 C420 198 410 196 400 196 C390 196 380 198 368 204 Z" fill="${shade(p1, -48)}"/>
  <path d="M368 204 C378 236 390 258 400 268 C410 258 422 236 432 204" fill="none" stroke="${ac}" stroke-width="3.4"/>
  ${coins}
  <use href="#cm" transform="translate(400 322) scale(1.5)"/>
  <!-- Şûtik kuşak -->
  <rect x="332" y="374" width="136" height="32" rx="9" fill="url(#belt)"/>
  <path d="M340 382 H 462 M340 396 H 462" stroke="${shade(ac, -30)}" stroke-width="1.6" opacity="0.6"/>
  <path d="M394-9 402 0 394 9 386 0Z" transform="translate(6 390)" fill="${shade(ac, -35)}"/>
  ${fringes}
  ${spark}
</svg>`;
}

/* -------- Şal û Şepik çizimi -------- */
function svgSalSepik(p, title) {
  const { p1, p2, ac } = p.art.palette;
  const motif = p.art.motif || "chevron";
  const seed = p.slug;
  const d1 = shade(p1, -24), l1 = shade(p1, 16);
  return `${svgOpen(800, 1000, title)}
  ${bgLayer(800, 1000, p1, ac, motif, seed)}
  <defs>
    <linearGradient id="jak" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${l1}"/><stop offset="1" stop-color="${p1}"/>
    </linearGradient>
    <linearGradient id="pant" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p1}"/><stop offset="1" stop-color="${d1}"/>
    </linearGradient>
    <pattern id="weave" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" fill="none"/>
      <path d="M0 0H14" stroke="${shade(p1, 30)}" stroke-width="1" opacity="0.35"/>
    </pattern>
    <linearGradient id="belt2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${shade(ac, 18)}"/><stop offset="1" stop-color="${shade(ac, -14)}"/>
    </linearGradient>
    ${motifDef("hm2", motif, shade(ac, -8))}
  </defs>
  <ellipse cx="400" cy="912" rx="200" ry="24" fill="#26190f" opacity="0.13"/>
  <!-- Şal (pantolon) -->
  <path d="M320 500 C300 600 292 700 288 830 C288 852 300 862 322 862 L364 862 C382 862 390 852 392 832 L400 640 L408 832 C410 852 418 862 436 862 L478 862 C500 862 512 852 512 830 C508 700 500 600 480 500 Z" fill="url(#pant)"/>
  <path d="M320 500 C300 600 292 700 288 830 C288 852 300 862 322 862 L364 862 C382 862 390 852 392 832 L400 640 L408 832 C410 852 418 862 436 862 L478 862 C500 862 512 852 512 830 C508 700 500 600 480 500 Z" fill="url(#weave)"/>
  <rect x="292" y="838" width="96" height="18" rx="6" fill="${d1}"/>
  <rect x="412" y="838" width="96" height="18" rx="6" fill="${d1}"/>
  <!-- Gömlek -->
  <path d="M360 230 L440 230 L432 330 L368 330 Z" fill="${mixWhite(p2, 60)}"/>
  <!-- Şepik (ceket) -->
  <path d="M330 218 C310 300 306 400 314 500 L378 500 L372 350 L390 250 L360 226 Z" fill="url(#jak)"/>
  <path d="M470 218 C490 300 494 400 486 500 L422 500 L428 350 L410 250 L440 226 Z" fill="url(#jak)"/>
  <path d="M330 218 C310 300 306 400 314 500 L378 500 L372 350 L390 250 L360 226 Z" fill="url(#weave)"/>
  <path d="M470 218 C490 300 494 400 486 500 L422 500 L428 350 L410 250 L440 226 Z" fill="url(#weave)"/>
  <!-- Yaka -->
  <path d="M360 226 L390 250 L400 232 L410 250 L440 226 L420 210 L400 216 L380 210 Z" fill="${d1}"/>
  <!-- Kollar -->
  <path d="M330 222 C296 250 274 320 262 420 C258 452 258 478 262 502 C286 500 304 490 316 472 C322 400 326 310 334 240 Z" fill="url(#jak)"/>
  <path d="M470 222 C504 250 526 320 538 420 C542 452 542 478 538 502 C514 500 496 490 484 472 C478 400 474 310 466 240 Z" fill="url(#jak)"/>
  <!-- Şûtik kuşak -->
  <rect x="318" y="486" width="164" height="40" rx="10" fill="url(#belt2)"/>
  <path d="M326 498 H 474 M326 512 H 474" stroke="${shade(ac, -32)}" stroke-width="2" opacity="0.55"/>
  <use href="#hm2" transform="translate(400 506) scale(1.05)"/>
  <path d="M452 522 C460 560 456 590 464 622" stroke="${shade(ac, -10)}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M466 522 C476 556 472 586 480 614" stroke="${shade(ac, 8)}" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>`;
}

/* -------- Puşi çizimi -------- */
function svgPusi(p, title) {
  const { p1, p2, ac } = p.art.palette;
  const seed = p.slug;
  const light = mixWhite(p2, 72);
  let tassels = "";
  for (let i = 0; i < 13; i++) {
    const tx = 252 + i * 25;
    tassels += `<path d="M${tx} 742 C ${tx - 3} 768, ${tx + 2} 780, ${tx - 2} 800" stroke="${p1}" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="${tx}" cy="744" r="4" fill="${shade(p1, -18)}"/>`;
  }
  return `${svgOpen(800, 1000, title)}
  ${bgLayer(800, 1000, p1, ac, "diamond", seed)}
  <defs>
    <pattern id="check" width="36" height="36" patternUnits="userSpaceOnUse">
      <rect width="36" height="36" fill="${light}"/>
      <rect width="18" height="18" fill="${p1}" opacity="0.85"/>
      <rect x="18" y="18" width="18" height="18" fill="${p1}" opacity="0.85"/>
      <path d="M0 0H36M0 18H36M0 36H36" stroke="${shade(p1, -22)}" stroke-width="1" opacity="0.35"/>
      <path d="M0 0V36M18 0V36M36 0V36" stroke="${shade(p1, -22)}" stroke-width="1" opacity="0.35"/>
    </pattern>
    <linearGradient id="foldsh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="0.2" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Askı çubuğu -->
  <rect x="150" y="150" width="500" height="16" rx="8" fill="#8a6a48"/>
  <circle cx="158" cy="158" r="12" fill="#6f5439"/><circle cx="642" cy="158" r="12" fill="#6f5439"/>
  <!-- Arka kat -->
  <path d="M236 158 L580 158 C588 320 596 500 588 700 C586 726 574 736 552 736 L270 736 C248 736 236 726 234 700 C228 500 230 320 236 158 Z" fill="url(#check)" opacity="0.55" transform="translate(24 14)"/>
  <!-- Ön kat -->
  <path d="M236 158 L580 158 C590 330 596 520 586 706 C584 728 572 740 550 740 L266 740 C244 740 232 728 230 706 C224 520 228 330 236 158 Z" fill="url(#check)"/>
  <path d="M236 158 L580 158 C590 330 596 520 586 706 C584 728 572 740 550 740 L266 740 C244 740 232 728 230 706 C224 520 228 330 236 158 Z" fill="url(#foldsh)"/>
  <path d="M300 160 C296 360 296 560 302 738" stroke="${shade(p1, -25)}" stroke-width="3" opacity="0.28" fill="none"/>
  <path d="M410 160 C408 360 408 560 412 738" stroke="${shade(p1, -25)}" stroke-width="3" opacity="0.28" fill="none"/>
  <path d="M516 160 C514 360 516 560 520 738" stroke="${shade(p1, -25)}" stroke-width="3" opacity="0.28" fill="none"/>
  ${tassels}
  <ellipse cx="400" cy="880" rx="230" ry="24" fill="#26190f" opacity="0.10"/>
</svg>`;
}

/* -------- Aksesuar çizimleri -------- */
function svgAksesuar(p, title) {
  const kind = p.art.kind || "kofi";
  const { p1, p2, ac } = p.art.palette;
  const motif = p.art.motif || "diamond";
  const seed = p.slug;
  const d1 = shade(p1, -22), l1 = shade(p1, 18);
  let body = "";
  if (kind === "kofi") {
    let dangles = "";
    for (let i = 0; i < 9; i++) {
      const dx = 268 + i * 33;
      dangles += `<path d="M${dx} 560 V 596" stroke="${ac}" stroke-width="2.4"/><circle cx="${dx}" cy="604" r="7" fill="${ac}"/>`;
    }
    body = `
    <path d="M400 940 V 640" stroke="#8a6a48" stroke-width="10"/>
    <ellipse cx="400" cy="940" rx="90" ry="14" fill="#8a6a48"/>
    <path d="M262 420 C262 360 320 320 400 320 C480 320 538 360 538 420 L538 540 C538 560 520 570 500 570 L300 570 C280 570 262 560 262 540 Z" fill="${p1}"/>
    <ellipse cx="400" cy="420" rx="138" ry="46" fill="${l1}" opacity="0.5"/>
    <rect x="262" y="500" width="276" height="44" fill="${d1}"/>
    <use href="#am" transform="translate(320 522)"/><use href="#am" transform="translate(400 522)"/><use href="#am" transform="translate(480 522)"/>
    ${dangles}`;
  } else if (kind === "sutik") {
    body = `
    <g transform="translate(340 430)">
      <ellipse rx="150" ry="120" fill="${p1}"/>
      <ellipse rx="112" ry="88" fill="${shade(p1, 12)}"/>
      <ellipse rx="76" ry="58" fill="${p1}"/>
      <ellipse rx="42" ry="30" fill="${shade(p1, 18)}"/>
      <ellipse rx="16" ry="11" fill="${d1}"/>
    </g>
    <path d="M470 490 C 560 480 620 520 650 600 C 664 640 668 680 664 720 L 610 714 C 612 676 606 644 590 616 C 566 576 520 556 462 560 Z" fill="${shade(p1, 6)}"/>
    <path d="M610 714 L 664 720 M600 690 L 656 696" stroke="${ac}" stroke-width="4" opacity="0.8"/>
    <path d="M614 726 C 612 752 618 766 612 788 M634 728 C 634 752 640 768 636 790 M654 730 C 656 754 662 768 658 788" stroke="${ac}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <use href="#am" transform="translate(340 430) scale(1.4)"/>`;
  } else if (kind === "corap") {
    const sock = (x, rot) => `
    <g transform="translate(${x} 0) rotate(${rot} 400 560)">
      <path d="M352 300 L448 300 L448 560 C448 600 470 620 510 626 C544 632 560 652 556 684 C552 716 520 736 478 730 C420 722 380 690 368 640 C356 600 352 560 352 520 Z" fill="${p1}"/>
      <rect x="352" y="300" width="96" height="42" rx="8" fill="${d1}"/>
      <path d="M352 380 H448 M352 410 H448" stroke="${ac}" stroke-width="7"/>
      <path d="M356 448 L376 430 396 448 416 430 436 448" stroke="${mixWhite(p2, 40)}" stroke-width="5" fill="none"/>
      <use href="#am" transform="translate(400 510) scale(0.9)"/>
      <path d="M480 726 C 500 730 520 726 540 712" stroke="${shade(p1, -30)}" stroke-width="4" fill="none" opacity="0.5"/>
    </g>`;
    body = sock(-70, -6) + sock(70, 6);
  } else { /* heybe */
    let stripeRows = "";
    const cols = [p1, ac, shade(p2, 0), shade(p1, -18)];
    for (let i = 0; i < 4; i++) {
      stripeRows += `<rect x="240" y="${430 + i * 64}" width="320" height="30" fill="${cols[i % cols.length]}" opacity="0.9"/>`;
    }
    let tas = "";
    for (let i = 0; i < 8; i++) {
      const tx = 262 + i * 40;
      tas += `<path d="M${tx} 700 C ${tx - 4} 730, ${tx + 3} 744, ${tx - 2} 766" stroke="${ac}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${tx}" cy="700" r="6" fill="${shade(ac, -18)}"/>`;
    }
    body = `
    <path d="M280 240 C 320 180 480 180 520 240" fill="none" stroke="${d1}" stroke-width="14" stroke-linecap="round"/>
    <rect x="240" y="240" width="320" height="460" rx="18" fill="${shade(p1, 8)}"/>
    ${stripeRows}
    <path d="M240 240 H 560 L 560 330 C 480 372 320 372 240 330 Z" fill="${d1}"/>
    <use href="#am" transform="translate(400 300) scale(1.3)"/>
    ${tas}`;
  }
  return `${svgOpen(800, 1000, title)}
  ${bgLayer(800, 1000, p1, ac, motif, seed)}
  <defs>${motifDef("am", motif, mixWhite(ac, 30))}</defs>
  <ellipse cx="400" cy="908" rx="200" ry="24" fill="#26190f" opacity="0.12"/>
  ${body}
</svg>`;
}

function productSvg(p) {
  const title = p.alt || p.name;
  if (p.category === "kirasfistan") return svgKirasfistan(p, title);
  if (p.category === "sal-u-sepik") return svgSalSepik(p, title);
  if (p.category === "pusi") return svgPusi(p, title);
  return svgAksesuar(p, title);
}

/* -------- Blog kapak görseli -------- */
function svgBlogCover(post) {
  const motif = post.heroMotif || "diamond";
  const pal = { p1: "#8e1f2e", ac: "#c08a1d" };
  const rand = seededRand(post.slug);
  let scatter = "";
  for (let i = 0; i < 16; i++) {
    const x = 40 + rand() * 1120;
    const y = 40 + rand() * 590;
    const sc = 0.8 + rand() * 1.6;
    scatter += `<use href="#bm" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${sc.toFixed(2)})" opacity="${(0.10 + rand() * 0.16).toFixed(2)}"/>`;
  }
  return `${svgOpen(1200, 675, post.title)}
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6e1522"/><stop offset="0.6" stop-color="#8e1f2e"/><stop offset="1" stop-color="#a63042"/>
    </linearGradient>
    ${motifDef("bm", motif, "#f6e3c8")}
    ${motifDef("bigm", motif, "#f2c66d")}
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  ${scatter}
  <use href="#bigm" transform="translate(600 315) scale(9)" opacity="0.9"/>
  <use href="#bigm" transform="translate(600 315) scale(14)" opacity="0.25"/>
  <rect y="655" width="1200" height="20" fill="${pal.ac}"/>
</svg>`;
}

/* -------- Logo & favicon -------- */
function logoMarkSvg(cls) {
  return `<svg class="${cls || "logo-mark"}" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="9" fill="#8e1f2e"/><path d="M24 12l9 12-9 12-9-12z" fill="none" stroke="#f2c66d" stroke-width="2.6"/><path d="M24 19l5.2 5L24 29l-5.2-5z" fill="#f2c66d"/></svg>`;
}
function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#8e1f2e"/><path d="M24 9l11.5 15L24 39 12.5 24z" fill="none" stroke="#f2c66d" stroke-width="3"/><path d="M24 17.5L29 24l-5 6.5L19 24z" fill="#f2c66d"/></svg>`;
}
function ogDefaultSvg() {
  let border = "";
  for (let i = 0; i < 25; i++) {
    border += `<use href="#om" transform="translate(${48 + i * 46} 46) scale(1.15)"/><use href="#om" transform="translate(${48 + i * 46} 584) scale(1.15)"/>`;
  }
  return `${svgOpen(1200, 630, SITE_NAME)}
  <defs>
    <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5d1220"/><stop offset="0.55" stop-color="#8e1f2e"/><stop offset="1" stop-color="#a63042"/>
    </linearGradient>
    ${motifDef("om", "diamond", "#f2c66d")}
  </defs>
  <rect width="1200" height="630" fill="url(#og)"/>
  ${border}
  <g transform="translate(150 200)"><rect width="120" height="120" rx="26" fill="#f2c66d"/><path d="M60 22l30 38-30 38-30-38z" fill="none" stroke="#8e1f2e" stroke-width="7"/><path d="M60 44l13 16-13 16-13-16z" fill="#8e1f2e"/></g>
  <text x="330" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="bold" fill="#ffffff">Kürt Yöresel</text>
  <text x="332" y="360" font-family="Verdana, Arial, sans-serif" font-size="30" fill="#f3ddd3">Kirasfistan · Şal û Şepik · Puşi</text>
  <text x="332" y="412" font-family="Verdana, Arial, sans-serif" font-size="24" fill="#e8b9a8">Yöresel Kürt kıyafetleri yakında satışta — talep bırakın</text>
</svg>`;
}

/* ============================================================
   HTML ŞABLONLARI
   ============================================================ */
function navLinks(root, current) {
  const items = [
    ["", "Anasayfa"],
    ["kirasfistan/", "Kirasfistan"],
    ["sal-u-sepik/", "Şal û Şepik"],
    ["pusi/", "Puşi"],
    ["aksesuar/", "Aksesuar"],
    ["blog/", "Blog"],
    ["sozluk/", "Sözlük"],
    ["sss/", "SSS"]
  ];
  return items.map(([href, label]) => {
    const cur = current === href ? ' aria-current="page"' : "";
    return `<a href="${root}/${href}"${cur}>${label}</a>`;
  }).join("");
}

function layout(opts) {
  const {
    root, title, desc, canonicalPath, ogImage, jsonld = [], content,
    noindex = false, current = "", ogType = "website"
  } = opts;
  const canonical = SITE_URL + canonicalPath;
  const ogImg = ogImage || SITE_URL + "/images/og/og-default.jpg";
  const jsonldTags = jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n  ");
  return `<!DOCTYPE html>
<html lang="tr" data-root="${root}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${GA_SNIPPET}
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="${noindex ? "noindex, follow" : "index, follow"}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#8e1f2e">
  <meta name="author" content="${SITE_NAME}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImg}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${ogImg}">
  <link rel="icon" href="${root}/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;650;700;800&family=Playfair+Display:wght@700;800&display=swap">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;650;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;650;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet"></noscript>
  <link rel="stylesheet" href="${root}/assets/css/style.css">
  ${jsonldTags}
</head>
<body>
  <a class="skip-link" href="#icerik">İçeriğe atla</a>
  <div class="topbar">🧵 <strong>Ön talep dönemi:</strong> Beğendiğiniz ürünlere talep bırakın, site açıldığında öncelikli haber verelim.</div>
  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="${root}/" aria-label="${SITE_NAME} anasayfa">${logoMarkSvg()}<span>Kürt <em>Yöresel</em></span></a>
      <button class="nav-toggle icon-btn" aria-label="Menüyü aç/kapat" aria-expanded="false" aria-controls="ana-menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <nav class="main-nav" id="ana-menu" aria-label="Ana menü">${navLinks(root, current)}</nav>
      <div class="header-actions">
        <form class="search-form" role="search" action="${root}/arama/">
          <label class="visually-hidden" for="q">Ürün ara</label>
          <input type="search" id="q" name="q" placeholder="Kirasfistan ara…" autocomplete="off">
          <button type="submit" aria-label="Ara"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </form>
        <a class="icon-btn" href="${root}/favoriler/" aria-label="Favorilerim">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s-7.5-4.8-10-9.3C.5 8 2.4 4.5 6 4.5c2.2 0 3.7 1.2 4.6 2.6l1.4 2 1.4-2c.9-1.4 2.4-2.6 4.6-2.6 3.6 0 5.5 3.5 4 7.2C19.5 16.2 12 21 12 21z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
          <span class="badge-count" id="wish-count"></span>
        </a>
      </div>
    </div>
  </header>
  <main id="icerik">
${content}
  </main>
  <footer class="site-footer">
    <div class="footer-motif" aria-hidden="true"></div>
    <div class="footer-inner">
      <div>
        <div class="f-brand">${logoMarkSvg()}<span>Kürt Yöresel</span></div>
        <p>Kirasfistandan şal û şepiğe, puşiden kofiye… Yöresel Kürt kıyafetlerini özenle seçilmiş bir koleksiyonda buluşturuyoruz. Şu an ön talep topluyoruz; yeterli ilgi oluştuğunda satışa başlayacağız.</p>
      </div>
      <div>
        <h2 class="f-head">Kategoriler</h2>
        <ul>
          <li><a href="${root}/kirasfistan/">Kirasfistan</a></li>
          <li><a href="${root}/sal-u-sepik/">Şal û Şepik</a></li>
          <li><a href="${root}/pusi/">Puşi</a></li>
          <li><a href="${root}/aksesuar/">Aksesuar</a></li>
        </ul>
      </div>
      <div>
        <h2 class="f-head">Kurumsal</h2>
        <ul>
          <li><a href="${root}/hakkimizda/">Hakkımızda</a></li>
          <li><a href="${root}/blog/">Blog</a></li>
          <li><a href="${root}/sozluk/">Terimler Sözlüğü</a></li>
          <li><a href="${root}/sss/">Sıkça Sorulan Sorular</a></li>
          <li><a href="${root}/iletisim/">İletişim</a></li>
          <li><a href="${root}/gorsel-kaynaklari/">Görsel Kaynakları</a></li>
        </ul>
      </div>
      <div>
        <h2 class="f-head">Alışveriş</h2>
        <ul>
          <li><a href="${root}/favoriler/">Favorilerim</a></li>
          <li><a href="${root}/#talep">Talep Bırak</a></li>
          <li><a href="${root}/sss/#on-siparis">Ön Sipariş Nasıl Çalışır?</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">© ${new Date().getFullYear()} ${SITE_NAME} · Bu site şu an ön talep toplama amaçlı bir tanıtım vitrinidir; henüz satış yapılmamaktadır.</div>
  </footer>
  <script src="${root}/assets/js/config.js"></script>
  <script src="${root}/assets/js/site.js" defer></script>
</body>
</html>`;
}

function productCard(p, root) {
  const url = `${root}/urun/${p.slug}/`;
  const img = `${root}/${p._img}`;
  const cardAlt = p._photoFile && photoByFile[p._photoFile] ? photoByFile[p._photoFile].alt : (p.alt || p.name);
  const badge = p.oldPrice
    ? '<span class="p-badge badge-sale">%' + Math.round((1 - p.price / p.oldPrice) * 100) + ' İndirim</span>'
    : (p.isNew ? '<span class="p-badge badge-new">Yeni</span>' : '<span class="p-badge">Ön Sipariş</span>');
  const old = p.oldPrice ? `<span class="price-old">${fmtPrice(p.oldPrice)}</span>` : "";
  return `<article class="product-card" data-region="${esc(p.region)}" data-fabric="${esc(p.fabric)}" data-price="${p.price}">
  <div class="product-media">${badge}
    <button class="wish-btn" type="button" data-slug="${p.slug}" aria-label="${esc(p.name)} ürününü favorilere ekle" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s-7.5-4.8-10-9.3C.5 8 2.4 4.5 6 4.5c2.2 0 3.7 1.2 4.6 2.6l1.4 2 1.4-2c.9-1.4 2.4-2.6 4.6-2.6 3.6 0 5.5 3.5 4 7.2C19.5 16.2 12 21 12 21z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
    <img src="${img}" alt="${esc(cardAlt)}" loading="lazy" width="800" height="1000">
  </div>
  <div class="product-body">
    <span class="p-region">${esc(p.region)}</span>
    <h3><a href="${url}">${esc(p.name)}</a></h3>
    <div class="p-price"><span class="price-now">${fmtPrice(p.price)}</span>${old}</div>
  </div>
</article>`;
}

function breadcrumb(root, items) {
  const lis = items.map(([label, href]) =>
    href ? `<li><a href="${href}">${esc(label)}</a></li>` : `<li aria-current="page">${esc(label)}</li>`
  ).join("");
  return `<nav class="breadcrumb" aria-label="Sayfa yolu"><ol>${lis}</ol></nav>`;
}

function breadcrumbJsonld(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map(([name, url], i) => ({
      "@type": "ListItem", "position": i + 1, "name": name,
      ...(url ? { "item": url } : {})
    }))
  };
}

function demandSection(root, compact) {
  return `<section class="section" id="talep" aria-labelledby="talep-baslik">
  <div class="container">
    <div class="demand-section">
      <svg class="demand-motifs" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><g id="dm"><path d="M0-12L9 0 0 12-9 0Z" fill="none" stroke="#fff" stroke-width="2"/></g></defs><use href="#dm" transform="translate(100 80) scale(2)"/><use href="#dm" transform="translate(300 300) scale(3)"/><use href="#dm" transform="translate(600 60) scale(2.4)"/><use href="#dm" transform="translate(900 320) scale(2)"/><use href="#dm" transform="translate(1100 120) scale(3.2)"/></svg>
      <h2 id="talep-baslik">Bu sitenin açılmasını ister misiniz?</h2>
      <p>${compact ? "Koleksiyonumuzu beğendiyseniz tek tıkla talep bırakın; yeterli talep oluştuğunda satışa başlıyoruz." : "Kürt Yöresel şu an ön talep döneminde. Kirasfistan, şal û şepik ve puşi koleksiyonumuzun satışa açılmasını istiyorsanız aşağıdaki butona tıklayın. Talepler bizim için en değerli işaret — yeterli ilgi oluştuğunda site gerçek bir mağazaya dönüşecek ve talep bırakanlara öncelik tanınacak."}</p>
      <button class="btn btn-gold btn-lg" type="button" data-demand-btn>🎉 Evet, Talep Bırakıyorum</button>
      <div class="demand-status" data-demand-status aria-live="polite"></div>
    </div>
  </div>
</section>`;
}

/* ============================================================
   VERİ YÜKLEME + DOĞRULAMA
   ============================================================ */
/* Google Analytics ölçüm kimliği — config.js tek kaynak, build sırasında head'e gömülür */
const GA_ID = (function () {
  const cfg = fs.readFileSync(path.join(ASSETS_SRC, "js", "config.js"), "utf8");
  const i = cfg.indexOf("gaId");
  if (i === -1) return "";
  const a = cfg.indexOf(String.fromCharCode(34), i);
  const b = cfg.indexOf(String.fromCharCode(34), a + 1);
  if (a === -1 || b === -1) return "";
  const id = cfg.slice(a + 1, b);
  return /^G-[A-Z0-9]+$/i.test(id) ? id : "";
})();
const GA_SNIPPET = GA_ID ? `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}', { anonymize_ip: true });
  </script>` : "";

/* Kültür fotoğrafları (Wikimedia Commons, serbest lisanslı) */
const PHOTOS = JSON.parse(fs.readFileSync(path.join(DATA, "photos.json"), "utf8"));
const SOZLUK = JSON.parse(fs.readFileSync(path.join(DATA, "sozluk.json"), "utf8"));
const photoByFile = Object.fromEntries(PHOTOS.map(p => [p.file, p]));
function photoCredit(file) {
  const p = photoByFile[file];
  return p ? `Fotoğraf: ${p.author} · ${p.license}` : "";
}
/* Blog kapak fotoğrafı eşlemesi (yoksa üretilen SVG kapak kullanılır) */
const BLOG_COVERS = {
  "kirasfistan-nedir": "kultur-kadin-dans.jpg",
  "kurt-dugun-kiyafetleri": "dugun-vintage.jpg",
  "sal-u-sepik-rehberi": "sal-sepik-ikili.jpg",
  "pusi-nasil-baglanir": "sal-sepik-mavi-pusi.jpg",
  "kirasfistan-bakimi-ve-yikama": "urun-manken-vitrin.jpg",
  "kina-gecesi-kiyafeti-rehberi": "u-td-kirmizi1.jpg",
  "yoresel-kiyafet-kumas-rehberi": "u-kumas-toplari.jpg",
  "yoresel-aksesuar-rehberi": "urun-kofi-altin.jpg",
  "yoresel-elbise-beden-olcu-rehberi": "u-dortlu-kadife.jpg",
  "dugun-nisan-kina-ne-giyilir": "sal-sepik-halay.jpg",
  "kadife-elbise-secim-rehberi": "u-k01-siyah.jpg",
  "yoresel-kiyafette-renk-rehberi": "u-k08-pembe.jpg",
  "el-isi-mi-makine-isi-mi": "u-k05-gri.jpg",
  "yoresel-kiyafet-saklama-rehberi": "u-k13-siyah.jpg",
  "terzide-olcu-ve-prova-rehberi": "u-muze-manken.jpg"
};

/* Blog yazısı sonu "Kültürden Kareler" galerileri */
const BLOG_GALLERY = {
  "kirasfistan-nedir": ["hawrami-girls.jpg", "kultur-mesale-ritueli.jpg"],
  "kurt-dugun-kiyafetleri": ["kultur-kadin-dans.jpg", "sal-sepik-halay.jpg"],
  "sal-u-sepik-rehberi": ["sal-sepik-grup.jpg", "palangan-village.jpg"],
  "pusi-nasil-baglanir": ["sal-sepik-cizgili.jpg", "hawrami-man.jpg"],
  "kirasfistan-bakimi-ve-yikama": ["u-k02-kirmizi.jpg", "u-k08-pembe.jpg"],
  "kina-gecesi-kiyafeti-rehberi": ["u-td-kirmizi2.jpg", "kultur-kadin-dans.jpg"],
  "yoresel-kiyafet-kumas-rehberi": ["u-k05-gri.jpg", "u-k13-siyah.jpg"],
  "yoresel-aksesuar-rehberi": ["hawraman-headdress.jpg", "urun-klash.jpg"],
  "yoresel-elbise-beden-olcu-rehberi": ["urun-manken-vitrin.jpg", "u-k01-beyaz.jpg"],
  "dugun-nisan-kina-ne-giyilir": ["dugun-vintage.jpg", "u-sepik-uclu.jpg"],
  "kadife-elbise-secim-rehberi": ["u-k01-kirmizi.jpg", "u-td-bordo.jpg"],
  "yoresel-kiyafette-renk-rehberi": ["urun-elbise-renkli.jpg", "u-k08-mavi.jpg"],
  "el-isi-mi-makine-isi-mi": ["u-k12d.jpg", "u-k02d-kirmizi.jpg"],
  "yoresel-kiyafet-saklama-rehberi": ["u-k13-altin.jpg", "sal-sepik-cizgili.jpg"],
  "terzide-olcu-ve-prova-rehberi": ["urun-manken-vitrin.jpg", "u-k01-beyaz.jpg"]
};

/* Kategori sayfası banner fotoğrafları (crop odağı ile) */
const CAT_PHOTOS = {
  kirasfistan: { file: "palangan-women.jpg", pos: "center 30%" },
  "sal-u-sepik": { file: "hawrami-man.jpg", pos: "center 42%" },
  pusi: { file: "sal-sepik-mavi-pusi.jpg", pos: "center 16%" },
  aksesuar: { file: "hawraman-headdress.jpg", pos: "center 44%" }
};

/* Ürün → temsili fotoğraf eşlemesi (tools/assign-product-photos.js üretir) */
const PRODUCT_PHOTOS = fs.existsSync(path.join(DATA, "product-photo-map.json"))
  ? JSON.parse(fs.readFileSync(path.join(DATA, "product-photo-map.json"), "utf8"))
  : {};

/* Anasayfa kültür bölümü kareleri */
const CULTURE_STRIP = [
  "kultur-mesale-ritueli.jpg", "kultur-tef-gosterisi.jpg", "sal-sepik-halay.jpg",
  "hawrami-girls.jpg", "senneh-kilim.jpg", "palangan-village.jpg"
];

function loadData() {
  const products = JSON.parse(fs.readFileSync(path.join(DATA, "products.json"), "utf8"));
  const blog = JSON.parse(fs.readFileSync(path.join(DATA, "blog.json"), "utf8"));

  const errors = [];
  const slugs = new Set();
  const slugRe = /^[a-z0-9-]+$/;
  const hexRe = /^#[0-9a-fA-F]{6}$/;

  for (const p of products) {
    if (!slugRe.test(p.slug || "")) errors.push(`Geçersiz slug: ${p.slug}`);
    if (slugs.has(p.slug)) errors.push(`Tekrarlanan slug: ${p.slug}`);
    slugs.add(p.slug);
    if (!CATEGORIES[p.category]) errors.push(`${p.slug}: bilinmeyen kategori ${p.category}`);
    for (const f of ["name", "region", "fabric", "shortDesc", "longDescHtml", "metaTitle", "metaDesc", "alt"]) {
      if (!p[f] || typeof p[f] !== "string") errors.push(`${p.slug}: eksik alan ${f}`);
    }
    if (typeof p.price !== "number" || p.price <= 0) errors.push(`${p.slug}: geçersiz fiyat`);
    if (!p.art || !p.art.palette) errors.push(`${p.slug}: art.palette eksik`);
    else {
      for (const k of ["p1", "p2", "ac"]) {
        if (!hexRe.test(p.art.palette[k] || "")) errors.push(`${p.slug}: geçersiz renk ${k}`);
      }
    }
  }
  const kCount = products.filter(p => p.category === "kirasfistan").length;
  if (process.env.KY_SKIP_MIN !== "1") {
    if (products.length < 100) errors.push(`Toplam ürün ${products.length} < 100`);
    if (kCount < 80) errors.push(`Kirasfistan sayısı ${kCount} < 80`);
  }

  for (const b of blog) {
    if (!slugRe.test(b.slug || "")) errors.push(`Blog geçersiz slug: ${b.slug}`);
    for (const f of ["title", "metaTitle", "metaDesc", "excerpt", "html"]) {
      if (!b[f]) errors.push(`Blog ${b.slug}: eksik alan ${f}`);
    }
  }

  if (errors.length) {
    console.error("VERİ HATALARI:\n" + errors.join("\n"));
    process.exit(1);
  }
  return { products, blog };
}

/* ============================================================
   SAYFA ÜRETİMİ
   ============================================================ */
function build() {
  const { products, blog } = loadData();

  /* Temizlik + iskelet */
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  writeFile(".nojekyll", "");
  writeFile("CNAME", "kurtyoresel.com\n");  // GitHub Pages özel alan adı
  copyDir(path.join(ASSETS_SRC, "css"), path.join(OUT, "assets", "css"));
  copyDir(path.join(ASSETS_SRC, "js"), path.join(OUT, "assets", "js"));
  copyDir(path.join(ASSETS_SRC, "img"), path.join(OUT, "assets", "img"));
  writeFile("favicon.svg", faviconSvg());
  writeFile("images/og/og-default.svg", ogDefaultSvg());
  const ogJpg = path.join(ASSETS_SRC, "og", "og-default.jpg");
  if (fs.existsSync(ogJpg)) {
    fs.mkdirSync(path.join(OUT, "images", "og"), { recursive: true });
    fs.copyFileSync(ogJpg, path.join(OUT, "images", "og", "og-default.jpg"));
  }

  /* Ürün görselleri — öncelik: 1) tools/photos/<slug>.jpg (kendi fotoğrafın)
     2) havuzdan temsili fotoğraf (product-photo-map.json)  3) üretilen SVG çizim */
  for (const p of products) {
    const photo = path.join(PHOTOS_DIR, p.slug + ".jpg");
    if (fs.existsSync(photo)) {
      p._img = `images/products/${p.slug}.jpg`;
      fs.mkdirSync(path.join(OUT, "images", "products"), { recursive: true });
      fs.copyFileSync(photo, path.join(OUT, "images", "products", p.slug + ".jpg"));
    } else if (PRODUCT_PHOTOS[p.slug] && photoByFile[PRODUCT_PHOTOS[p.slug]]) {
      p._photoFile = PRODUCT_PHOTOS[p.slug];
      p._img = `assets/img/${p._photoFile}`;
    } else {
      p._img = `images/products/${p.slug}.svg`;
      writeFile(`images/products/${p.slug}.svg`, productSvg(p));
    }
  }

  /* Blog kapakları */
  for (const b of blog) {
    writeFile(`images/blog/${b.slug}.svg`, svgBlogCover(b));
  }

  /* Arama verisi */
  const searchData = products.map(p => ({
    slug: p.slug, name: p.name, category: p.category, region: p.region,
    fabric: p.fabric, price: p.price, oldPrice: p.oldPrice || null,
    alt: p._photoFile ? photoByFile[p._photoFile].alt : p.alt,
    img: p._img, tags: p.tags || []
  }));
  writeFile("assets/data/urunler.json", JSON.stringify(searchData));

  const byCat = {};
  for (const key of Object.keys(CATEGORIES)) byCat[key] = products.filter(p => p.category === key);

  /* ---------- Anasayfa ---------- */
  const featured = [
    ...byCat.kirasfistan.filter(p => p.featured).slice(0, 8),
    ...byCat.kirasfistan.filter(p => !p.featured)
  ].slice(0, 8);
  const heroProduct = byCat.kirasfistan[0];

  const catCards = Object.entries(CATEGORIES).map(([key, cat]) => {
    const first = byCat[key][0];
    const img = first ? first._img : "";
    return `<a class="category-card" href="./${key}/">
    <span class="cat-count">${byCat[key].length} ürün</span>
    <div class="cat-art"><img src="./${img}" alt="" loading="lazy" width="800" height="1000" style="width:100%;height:100%;object-fit:cover;object-position:top;"></div>
    <div class="cat-body"><h3>${cat.name}</h3><p>${esc(cat.desc.split(".")[0])}.</p></div>
  </a>`;
  }).join("\n");

  const blogCover = (b, root) => BLOG_COVERS[b.slug]
    ? `${root}/assets/img/${BLOG_COVERS[b.slug]}`
    : `${root}/images/blog/${b.slug}.svg`;

  const blogCards = blog.slice(0, 3).map(b => `<article class="blog-card">
    <a href="./blog/${b.slug}/" aria-label="${esc(b.title)}"><div class="blog-art"><img src="${blogCover(b, ".")}" alt="${esc(b.title)}" loading="lazy" width="1200" height="675" style="width:100%;height:100%;object-fit:cover;"></div></a>
    <div class="blog-body"><h3><a href="./blog/${b.slug}/">${esc(b.title)}</a></h3><p>${esc(b.excerpt)}</p></div>
  </article>`).join("\n");

  const homeContent = `
<section class="hero">
  <div class="hero-inner">
    <div>
      <span class="hero-eyebrow">✦ Ön Talep Dönemi Başladı</span>
      <h1>Yöresel Kürt Kıyafetlerinin <em>En Zarif</em> Adresi</h1>
      <p class="lead">Botan'dan Serhat'a, kadife kirasfistanlardan yün şal û şepiklere… ${products.length} parçalık koleksiyonumuzu keşfedin, beğendiklerinize talep bırakın. Yeterli talep oluştuğunda satışa başlıyoruz.</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg" href="./kirasfistan/">Kirasfistanları Keşfet</a>
        <a class="btn btn-outline btn-lg" href="#talep">Talep Bırak</a>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><b>${byCat.kirasfistan.length}</b><span>Kirasfistan modeli</span></div>
        <div class="hero-stat"><b>${products.length}</b><span>Toplam ürün</span></div>
        <div class="hero-stat"><b>6+</b><span>Yöresel stil</span></div>
      </div>
    </div>
    <div class="hero-visual">
      <figure>
        <img class="hero-photo" src="./assets/img/kultur-kadin-dans.jpg" alt="${esc(photoByFile["kultur-kadin-dans.jpg"].alt)}" width="1280" height="853" fetchpriority="high">
        <figcaption class="figure-credit">${photoCredit("kultur-kadin-dans.jpg")} · <a href="./gorsel-kaynaklari/">Kaynaklar</a></figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="kat-baslik">
  <div class="container">
    <div class="section-head"><div><h2 id="kat-baslik">Koleksiyonlar</h2><p>Yöresine ve tarzına göre keşfet</p></div></div>
    <div class="category-grid">${catCards}</div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="one-cikan">
  <div class="container">
    <div class="section-head">
      <div><h2 id="one-cikan">Öne Çıkan Kirasfistanlar</h2><p>En çok beğenilen el işçiliği modeller</p></div>
      <a class="section-link" href="./kirasfistan/">Tümünü Gör (${byCat.kirasfistan.length}) →</a>
    </div>
    <div class="product-grid">${featured.map(p => productCard(p, ".")).join("\n")}</div>
  </div>
</section>

${demandSection(".", false)}

<section class="section" aria-labelledby="neden">
  <div class="container">
    <div class="section-head"><div><h2 id="neden">Neden Kürt Yöresel?</h2></div></div>
    <div class="feature-strip">
      <div class="feature-item"><div class="f-icon">🧵</div><div><b>El Emeği Üretim</b><span>Yerel atölyelerle çalışıyor, geleneksel dikiş ve işleme tekniklerini yaşatıyoruz.</span></div></div>
      <div class="feature-item"><div class="f-icon">🗺️</div><div><b>Yöreye Sadık Desenler</b><span>Diyarbakır, Mardin, Van, Hakkari… Her modelde yöresinin otantik motifleri.</span></div></div>
      <div class="feature-item"><div class="f-icon">⭐</div><div><b>Ön Sipariş Önceliği</b><span>Talep bırakanlar satış başladığında ilk haber alan ve öncelik tanınan kişiler olacak.</span></div></div>
      <div class="feature-item"><div class="f-icon">📦</div><div><b>Türkiye'ye Kargo (Yakında)</b><span>Satış başladığında tüm Türkiye'ye özenli paketlemeyle gönderim planlıyoruz.</span></div></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="kultur-baslik">
  <div class="container">
    <div class="section-head">
      <div><h2 id="kultur-baslik">Kültürden Kareler</h2><p>Bu kıyafetler vitrinlerde değil, hayatın içinde yaşıyor</p></div>
    </div>
    <div class="culture-grid">
      ${CULTURE_STRIP.map(f => {
        const ph = photoByFile[f];
        return `<figure class="culture-item">
        <img src="./assets/img/${f}" alt="${esc(ph.alt)}" loading="lazy" width="1280" height="853">
        <figcaption class="figure-credit">${esc(ph.title)} — ${photoCredit(f)}</figcaption>
      </figure>`;
      }).join("\n      ")}
    </div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="blog-baslik">
  <div class="container">
    <div class="section-head">
      <div><h2 id="blog-baslik">Kültür &amp; Rehber</h2><p>Kürt kıyafet kültürüne dair yazılar</p></div>
      <a class="section-link" href="./blog/">Tüm Yazılar →</a>
    </div>
    <div class="blog-grid">${blogCards}</div>
  </div>
</section>

<section class="section" aria-label="Kürt yöresel kıyafetleri hakkında">
  <div class="container" style="max-width:860px;">
    <h2 style="font-size:1.35rem;margin-bottom:12px;">Kürt Yöresel Kıyafetleri: Kirasfistan, Şal û Şepik ve Daha Fazlası</h2>
    <p style="color:var(--ink-soft);font-size:0.94rem;margin-bottom:12px;">Kürt yöresel kıyafetleri, bin yıllık bir kültürün renklerini bugüne taşır. Kadınların düğünlerde ve özel günlerde giydiği <a href="./kirasfistan/">kirasfistan</a>; kiras, fistan ve şûtik kuşağından oluşur, yöresine göre kumaşı ve işlemesi değişir. Erkeklerin geleneksel takımı <a href="./sal-u-sepik/">şal û şepik</a> yün dokumasıyla; omuzların vazgeçilmezi <a href="./pusi/">puşi</a> ise püsküllü dokusuyla tanınır.</p>
    <p style="color:var(--ink-soft);font-size:0.94rem;">Kürt Yöresel olarak amacımız, bu kıyafetleri aslına uygun kalitede ve tek adreste buluşturmak. Şu an ön talep dönemindeyiz: koleksiyonu inceleyin, beğendiğiniz ürünlere talep bırakın; yeterli ilgi oluştuğunda üretime ve satışa başlayacağız.</p>
  </div>
</section>`;

  writeFile("index.html", layout({
    root: ".",
    title: `${SITE_NAME} – ${SITE_TAGLINE}`,
    desc: `Kirasfistan, şal û şepik, puşi ve yöresel aksesuarlar. ${products.length}+ ürünlük Kürt yöresel kıyafet koleksiyonunu keşfedin, ön sipariş talebi bırakın.`,
    canonicalPath: "/",
    current: "",
    jsonld: [
      {
        "@context": "https://schema.org", "@type": "Organization",
        "name": SITE_NAME, "url": SITE_URL + "/",
        "logo": SITE_URL + "/favicon.svg",
        "description": "Kirasfistan, şal û şepik ve puşi gibi yöresel kıyafetleri bir araya getiren, ön talep toplama aşamasındaki koleksiyon sitesi.",
        "areaServed": { "@type": "Country", "name": "Türkiye" },
        "knowsAbout": ["Kirasfistan", "Şal û Şepik", "Puşi", "Şûtik", "Kofi", "Yöresel kıyafet", "Kadife elbise", "Geleneksel giyim"],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "availableLanguage": ["Turkish"],
          "url": SITE_URL + "/iletisim/"
        }
      },
      {
        "@context": "https://schema.org", "@type": "WebSite",
        "name": SITE_NAME, "url": SITE_URL + "/",
        "potentialAction": {
          "@type": "SearchAction",
          "target": { "@type": "EntryPoint", "urlTemplate": SITE_URL + "/arama/?q={search_term_string}" },
          "query-input": "required name=search_term_string"
        }
      }
    ],
    content: homeContent
  }));

  /* ---------- Kategori sayfaları ---------- */
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const items = byCat[key];
    const regions = [...new Set(items.map(p => p.region))].sort((a, b) => a.localeCompare(b, "tr"));
    const fabrics = [...new Set(items.map(p => p.fabric))].sort((a, b) => a.localeCompare(b, "tr"));
    const catPhoto = CAT_PHOTOS[key];
    const catBanner = catPhoto ? `
  <figure class="cat-banner">
    <img src="../assets/img/${catPhoto.file}" alt="${esc(photoByFile[catPhoto.file].alt)}" width="1280" height="549" style="object-position:${catPhoto.pos};" fetchpriority="high">
    <figcaption class="figure-credit">${esc(photoByFile[catPhoto.file].title)} — ${photoCredit(catPhoto.file)} · <a href="../gorsel-kaynaklari/">Kaynaklar</a></figcaption>
  </figure>` : "";
    const content = `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], [cat.name, null]])}
    <h1>${cat.name} <span style="font-size:0.55em;color:var(--muted);font-family:var(--font-body);font-weight:600;">(${items.length} ürün)</span></h1>
    <p class="page-intro">${esc(cat.intro)}</p>
  </div>${catBanner}
  <div class="filter-bar">
    <label for="f-region">Yöre:</label>
    <select id="f-region"><option value="">Tümü</option>${regions.map(r => `<option>${esc(r)}</option>`).join("")}</select>
    <label for="f-fabric">Kumaş:</label>
    <select id="f-fabric"><option value="">Tümü</option>${fabrics.map(f => `<option>${esc(f)}</option>`).join("")}</select>
    <label for="f-sort">Sırala:</label>
    <select id="f-sort"><option value="">Önerilen</option><option value="price-asc">Fiyat (Artan)</option><option value="price-desc">Fiyat (Azalan)</option></select>
    <span class="filter-count" aria-live="polite"></span>
  </div>
  <h2 class="visually-hidden">Ürün Listesi</h2>
  <div class="product-grid" data-filterable>${items.map(p => productCard(p, "..")).join("\n")}</div>
</div>
${demandSection("..", true)}`;

    writeFile(`${key}/index.html`, layout({
      root: "..",
      title: `${cat.title} | ${SITE_NAME}`,
      desc: cat.desc,
      canonicalPath: `/${key}/`,
      current: `${key}/`,
      jsonld: [
        breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], [cat.name, SITE_URL + `/${key}/`]]),
        {
          "@context": "https://schema.org", "@type": "CollectionPage",
          "name": cat.title, "url": SITE_URL + `/${key}/`, "description": cat.desc,
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": SITE_URL + "/" },
          "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": items.length,
            "itemListElement": items.map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "Product",
                "name": p.name,
                "url": SITE_URL + "/urun/" + p.slug + "/",
                "image": SITE_URL + "/" + p._img,
                "description": p.shortDesc,
                "sku": "KY-" + p.slug,
                "brand": { "@type": "Brand", "name": SITE_NAME },
                "offers": {
                  "@type": "Offer",
                  "url": SITE_URL + "/urun/" + p.slug + "/",
                  "price": String(p.price),
                  "priceCurrency": "TRY",
                  "availability": "https://schema.org/PreOrder",
                  "itemCondition": "https://schema.org/NewCondition"
                }
              }
            }))
          }
        }
      ],
      content
    }));
  }

  /* ---------- Ürün sayfaları ---------- */
  for (const p of products) {
    const cat = CATEGORIES[p.category];
    const img = `../../${p._img}`;
    const imgAbs = `${SITE_URL}/${p._img}`;
    const pAlt = p._photoFile ? photoByFile[p._photoFile].alt : p.alt;
    const pCredit = p._photoFile
      ? `<div class="pd-credit">Temsili görsel — ${photoCredit(p._photoFile)} · <a href="../../gorsel-kaynaklari/">Kaynaklar</a></div>`
      : "";
    const related = byCat[p.category].filter(x => x.slug !== p.slug).slice(0, 4);
    const sizes = p.category === "aksesuar" ? [] : ["S", "M", "L", "XL", "XXL"];
    const specRows = [
      ["Kategori", cat.name],
      ["Yöre", p.region],
      ["Kumaş", p.fabric],
      ...(p.colorName ? [["Renk", p.colorName]] : []),
      ["Durum", "Ön sipariş (talep toplama aşamasında)"],
      ...(p._photoFile ? [["Görsel", "Temsilidir; satış döneminde gerçek ürün fotoğrafları eklenecek"]] : []),
      ["Ürün Kodu", "KY-" + p.slug.split("-").map(s => s[0]).join("").toUpperCase() + "-" + String(p.price).slice(0, 2)]
    ];

    const content = `
<div class="container">
  <div class="page-head" style="padding-bottom:0;">
    ${breadcrumb("../..", [["Anasayfa", "../../"], [cat.name, `../../${p.category}/`], [p.name, null]])}
  </div>
  <article class="product-detail" data-product-view data-slug="${p.slug}" data-name="${esc(p.name)}" data-price="${p.price}">
    <div class="pd-media">
      <button class="wish-btn" type="button" data-slug="${p.slug}" aria-label="${esc(p.name)} ürününü favorilere ekle" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s-7.5-4.8-10-9.3C.5 8 2.4 4.5 6 4.5c2.2 0 3.7 1.2 4.6 2.6l1.4 2 1.4-2c.9-1.4 2.4-2.6 4.6-2.6 3.6 0 5.5 3.5 4 7.2C19.5 16.2 12 21 12 21z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
      <img src="${img}" alt="${esc(pAlt)}" width="800" height="1000" fetchpriority="high">
      ${pCredit}
    </div>
    <div class="pd-info">
      <span class="p-region">${esc(p.region)} · ${cat.name}</span>
      <h1>${esc(p.name)}</h1>
      <div class="pd-price">
        <span class="price-now">${fmtPrice(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${fmtPrice(p.oldPrice)}</span>` : ""}
      </div>
      <p class="pd-tax">Ön sipariş tahmini fiyatıdır · KDV dahil</p>
      <p class="pd-short">${esc(p.shortDesc)}</p>
      ${sizes.length ? `<div class="pd-options"><div class="opt-label" id="beden-label">Beden Seçimi</div><div class="size-chips" role="group" aria-labelledby="beden-label">${sizes.map((s, i) => `<button type="button" class="size-chip${i === 1 ? " selected" : ""}" aria-pressed="${i === 1 ? "true" : "false"}">${s}</button>`).join("")}</div></div>` : ""}
      <div class="pd-actions">
        <button class="btn btn-primary btn-lg" type="button" data-preorder-btn data-slug="${p.slug}" data-name="${esc(p.name)}" data-price="${p.price}">🧵 Ön Sipariş Talebi Bırak</button>
      </div>
      <div class="pd-note">💡 <span>Henüz satış yapılmıyor. Talep bıraktığınızda bu model, satış başladığında <strong>öncelikli olarak üretilecek</strong> ve size özel erken erişim tanınacak.</span></div>
      <table class="spec-table">
        <caption class="visually-hidden">${esc(p.name)} ürün özellikleri</caption>
        <tbody>
        ${specRows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("\n        ")}
        </tbody>
      </table>
    </div>
  </article>
  <div class="pd-desc">
    <h2>Ürün Açıklaması</h2>
    ${p.longDescHtml}
  </div>
  <section class="section" aria-labelledby="benzer">
    <div class="section-head"><div><h2 id="benzer" style="font-size:1.4rem;">Benzer Ürünler</h2></div><a class="section-link" href="../../${p.category}/">Tüm ${cat.name} →</a></div>
    <div class="product-grid">${related.map(r => productCard(r, "../..")).join("\n")}</div>
  </section>
</div>`;

    writeFile(`urun/${p.slug}/index.html`, layout({
      root: "../..",
      title: p.metaTitle.includes(SITE_NAME) ? p.metaTitle : `${p.metaTitle} | ${SITE_NAME}`,
      desc: p.metaDesc,
      canonicalPath: `/urun/${p.slug}/`,
      ogImage: p._img.endsWith(".svg") ? SITE_URL + "/images/og/og-default.jpg" : imgAbs,
      ogType: "product",
      current: "",
      jsonld: [
        breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], [cat.name, SITE_URL + `/${p.category}/`], [p.name, SITE_URL + `/urun/${p.slug}/`]]),
        {
          "@context": "https://schema.org", "@type": "Product",
          "name": p.name,
          "image": [imgAbs],
          "description": p.metaDesc,
          "sku": "KY-" + p.slug,
          "brand": { "@type": "Brand", "name": SITE_NAME },
          "category": cat.name,
          "material": p.fabric,
          ...(p.colorName ? { "color": p.colorName } : {}),
          ...(sizes.length ? { "size": sizes } : {}),
          "additionalProperty": [
            { "@type": "PropertyValue", "name": "Yöre", "value": p.region },
            { "@type": "PropertyValue", "name": "Kumaş", "value": p.fabric },
            ...(p.colorName ? [{ "@type": "PropertyValue", "name": "Renk", "value": p.colorName }] : [])
          ],
          "offers": {
            "@type": "Offer",
            "url": SITE_URL + `/urun/${p.slug}/`,
            "priceCurrency": "TRY",
            "price": String(p.price),
            "priceValidUntil": `${new Date().getFullYear()}-12-31`,
            "availability": "https://schema.org/PreOrder",
            "itemCondition": "https://schema.org/NewCondition"
          }
        }
      ],
      content
    }));
  }

  /* ---------- Blog ---------- */
  const blogIndexContent = `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["Blog", null]])}
    <h1>Kültür &amp; Rehber</h1>
    <p class="page-intro">Kirasfistandan puşiye, Kürt kıyafet kültürünün hikâyesi, bakım önerileri ve stil rehberleri.</p>
  </div>
  <div class="blog-grid">
  ${blog.map(b => `<article class="blog-card">
    <a href="./${b.slug}/" aria-label="${esc(b.title)}"><div class="blog-art"><img src="${blogCover(b, "..")}" alt="${esc(b.title)}" loading="lazy" width="1200" height="675" style="width:100%;height:100%;object-fit:cover;"></div></a>
    <div class="blog-body"><h3><a href="./${b.slug}/">${esc(b.title)}</a></h3><p>${esc(b.excerpt)}</p></div>
  </article>`).join("\n")}
  </div>
</div>`;
  writeFile("blog/index.html", layout({
    root: "..",
    title: `Blog: Kürt Kıyafet Kültürü Rehberi | ${SITE_NAME}`,
    desc: "Kirasfistan nedir, şal û şepik nasıl giyilir, puşi nasıl bağlanır? Kürt yöresel kıyafet kültürüne dair rehberler ve hikâyeler.",
    canonicalPath: "/blog/",
    current: "blog/",
    jsonld: [breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], ["Blog", SITE_URL + "/blog/"]])],
    content: blogIndexContent
  }));

  for (const b of blog) {
    const cover = blogCover(b, "../..");
    const coverFile = BLOG_COVERS[b.slug];
    const coverCredit = coverFile
      ? `<span class="figure-credit">Kapak — ${photoCredit(coverFile)} · <a href="../../gorsel-kaynaklari/">Kaynaklar</a></span>`
      : "";
    const html = b.html
      .split("{{root}}").join("../..");
    const content = `
<div class="container">
  <div class="page-head">
    ${breadcrumb("../..", [["Anasayfa", "../../"], ["Blog", "../"], [b.title, null]])}
    <h1>${esc(b.title)}</h1>
    <p class="article-meta">Kürt Yöresel · Kültür &amp; Rehber</p>
  </div>
  <div class="article-body">
    <p><img src="${cover}" alt="${esc(coverFile ? photoByFile[coverFile].alt : b.title)}" width="1200" height="675" style="border-radius:14px;">${coverCredit}</p>
    ${html}
    ${(b.sss || []).length ? `<h2>Sıkça Sorulan Sorular</h2>
    <div class="faq-list">
      ${b.sss.map(s => `<details><summary>${esc(s.soru)}</summary><div><p>${esc(s.cevap)}</p></div></details>`).join(String.fromCharCode(10))}
    </div>` : ""}
    ${(BLOG_GALLERY[b.slug] || []).length ? `<h2>Kültürden Kareler</h2>
    <div class="article-gallery">
      ${BLOG_GALLERY[b.slug].map(f => `<figure>
        <img src="../../assets/img/${f}" alt="${esc(photoByFile[f].alt)}" loading="lazy" width="1280" height="960">
        <figcaption class="figure-credit">${esc(photoByFile[f].title)} — ${photoCredit(f)}</figcaption>
      </figure>`).join("\n      ")}
    </div>` : ""}
    <div class="notice" style="margin-top:26px;">Bu yazıyı beğendiyseniz <a href="../../kirasfistan/">kirasfistan koleksiyonumuza</a> göz atabilir, <a href="../../#talep">buradan talep bırakarak</a> sitenin açılmasına destek olabilirsiniz.</div>
  </div>
</div>`;
    writeFile(`blog/${b.slug}/index.html`, layout({
      root: "../..",
      title: `${b.metaTitle} | ${SITE_NAME}`,
      desc: b.metaDesc,
      canonicalPath: `/blog/${b.slug}/`,
      ogImage: BLOG_COVERS[b.slug] ? `${SITE_URL}/assets/img/${BLOG_COVERS[b.slug]}` : SITE_URL + "/images/og/og-default.jpg",
      ogType: "article",
      current: "blog/",
      jsonld: [
        breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], ["Blog", SITE_URL + "/blog/"], [b.title, SITE_URL + `/blog/${b.slug}/`]]),
        {
          "@context": "https://schema.org", "@type": "BlogPosting",
          "headline": b.title, "description": b.metaDesc,
          "image": BLOG_COVERS[b.slug] ? `${SITE_URL}/assets/img/${BLOG_COVERS[b.slug]}` : `${SITE_URL}/images/blog/${b.slug}.svg`,
          "author": { "@type": "Organization", "name": SITE_NAME },
          "publisher": { "@type": "Organization", "name": SITE_NAME, "logo": { "@type": "ImageObject", "url": SITE_URL + "/favicon.svg" } },
          "mainEntityOfPage": SITE_URL + `/blog/${b.slug}/`,
          "datePublished": BUILD_DATE, "dateModified": BUILD_DATE, "inLanguage": "tr"
        },
        ...((b.sss || []).length ? [{
          "@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": b.sss.map(s => ({
            "@type": "Question", "name": s.soru,
            "acceptedAnswer": { "@type": "Answer", "text": s.cevap }
          }))
        }] : [])
      ],
      content
    }));
  }

  /* ---------- Hakkımızda ---------- */
  writeFile("hakkimizda/index.html", layout({
    root: "..",
    title: `Hakkımızda: Kürt Yöresel'in Hikâyesi | ${SITE_NAME}`,
    desc: "Kürt Yöresel; kirasfistan, şal û şepik ve puşi gibi yöresel kıyafetleri tek adreste buluşturmayı hedefleyen yeni bir girişim. Hikâyemizi okuyun.",
    canonicalPath: "/hakkimizda/",
    current: "",
    jsonld: [breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], ["Hakkımızda", SITE_URL + "/hakkimizda/"]])],
    content: `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["Hakkımızda", null]])}
    <h1>Bir Kültürü Giydirmek</h1>
  </div>
  <div class="article-body">
    <p>Kürt Yöresel, basit bir sorudan doğdu: <em>"Neden bir kirasfistan almak bu kadar zor?"</em> Düğüne davetli bir genç kadın, yöresine uygun bir kirasfistan bulmak için ya şehir şehir terzi gezmek ya da gördüğü fotoğrafa güvenip sonucu şansa bırakmak zorunda kalıyor. Şal û şepik diktirmek isteyen biri için de durum farklı değil.</p>
    <figure style="margin:20px 0;">
      <img src="../assets/img/sal-sepik-grup.jpg" alt="${esc(photoByFile["sal-sepik-grup.jpg"].alt)}" width="1280" height="722" loading="lazy" style="border-radius:14px;">
      <figcaption class="figure-credit">${photoCredit("sal-sepik-grup.jpg")} · <a href="../gorsel-kaynaklari/">Kaynaklar</a></figcaption>
    </figure>
    <p>Biz bu dağınıklığı tek bir adreste toplamak istiyoruz: yöresine sadık desenler, aslına uygun kumaşlar, el emeği işçilik ve standart beden seçenekleriyle güvenilir bir yöresel kıyafet mağazası.</p>
    <h2>Şu An Hangi Aşamadayız?</h2>
    <p>Dürüst olalım: henüz satışta değiliz. Bu site, böyle bir mağazaya gerçekten ihtiyaç olup olmadığını anlamak için kurduğumuz bir <strong>ön talep vitrini</strong>. Koleksiyondaki her ürün, satışa başladığımızda üretmeyi planladığımız modelleri temsil ediyor.</p>
    <p>Siz ne yapabilirsiniz? Çok basit: koleksiyonu gezin, beğendiğiniz ürünlerde <strong>"Ön Sipariş Talebi Bırak"</strong> butonuna tıklayın ya da anasayfadaki <strong>"Talep Bırakıyorum"</strong> butonunu kullanın. Yeterli talep oluştuğunda üretime başlayacağız ve talep bırakanlara öncelik tanıyacağız.</p>
    <h2>Sözümüz</h2>
    <ul>
      <li><strong>Aslına saygı:</strong> Desenler ve kesimler yöresel geleneklere sadık kalacak.</li>
      <li><strong>El emeğine değer:</strong> Üretim, yerel atölyeler ve usta terzilerle yapılacak.</li>
      <li><strong>Şeffaflık:</strong> Hangi aşamada olduğumuzu her zaman açıkça paylaşacağız.</li>
    </ul>
    <p>Bu yolculuğa ortak olduğunuz için şimdiden spas — teşekkürler.</p>
  </div>
</div>
${demandSection("..", true)}`
  }));

  /* ---------- İletişim ---------- */
  writeFile("iletisim/index.html", layout({
    root: "..",
    title: `İletişim | ${SITE_NAME}`,
    desc: "Kürt Yöresel ile iletişime geçin: ön talep dönemi, kirasfistan koleksiyonu ve satış takvimi hakkında merak ettikleriniz ile görüş ve önerileriniz için bu sayfayı ziyaret edin.",
    canonicalPath: "/iletisim/",
    current: "",
    jsonld: [breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], ["İletişim", SITE_URL + "/iletisim/"]])],
    content: `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["İletişim", null]])}
    <h1>İletişim</h1>
    <p class="page-intro">Kürt Yöresel şu an ön talep döneminde olduğu için müşteri hizmetleri hattımız henüz aktif değil. Ancak sesinizi duyurmanın en etkili yolu çok basit:</p>
  </div>
  <div class="article-body">
    <div class="notice">📣 <strong>Görüşünüzü iletmenin en iyi yolu talep bırakmak.</strong> Anasayfadaki "Talep Bırakıyorum" butonuna tıkladığınızda bu, bizim için "bu siteyi açın" mesajıdır. Beğendiğiniz ürünlerde "Ön Sipariş Talebi Bırak" butonunu kullandığınızda hangi modellerin önce üretileceğine siz karar vermiş olursunuz.</p></div>
    <h2>Sosyal Medya</h2>
    <p>Instagram ve diğer sosyal medya hesaplarımız satış dönemine geçtiğimizde açılacak ve bu sayfadan duyurulacak.</p>
    <h2>Satış Başladığında</h2>
    <p>Site gerçek mağazaya dönüştüğünde bu sayfada e-posta adresimiz, WhatsApp destek hattımız ve iade/değişim bilgilerimiz yer alacak.</p>
  </div>
</div>
${demandSection("..", true)}`
  }));

  /* ---------- SSS ---------- */
  const faqs = [
    ["Kirasfistan nedir?", "Kirasfistan; kiras adı verilen iç elbise ile fistan adı verilen üst elbiseden oluşan, bele şûtik kuşak bağlanarak tamamlanan geleneksel Kürt kadın kıyafetidir. Düğün, nişan ve özel günlerde giyilir; yöresine göre kumaşı, rengi ve işlemesi değişir."],
    ["Bu siteden şu an satın alma yapabilir miyim?", "Hayır. Kürt Yöresel şu anda ön talep döneminde; ürünler satışta değildir ve sitede ödeme alınmaz. Amacımız hangi ürünlere ne kadar ilgi olduğunu görmek. Yeterli talep oluştuğunda satışa başlayacağız."],
    ["Ön sipariş talebi bırakınca ne oluyor?", "Talebiniz anonim olarak sayılır ve hangi modellere ilgi olduğunu görmemizi sağlar. Satış başladığında talep gören modeller öncelikli üretilir. Talep bırakmak hiçbir ödeme ya da taahhüt gerektirmez."],
    ["Fiyatlar kesin mi?", "Sitedeki fiyatlar ön sipariş dönemi için öngörülen tahmini fiyatlardır. Satışa geçtiğimizde kumaş ve işçilik maliyetlerine göre netleşecek; talep bırakanlara ilk fiyat avantajı tanınacaktır."],
    ["Beden seçenekleri neler olacak?", "Kirasfistan ve şal û şepik takımlarında S, M, L, XL ve XXL standart bedenlerinin yanı sıra ölçüye özel dikim seçeneği sunmayı planlıyoruz."],
    ["Kargo ve teslimat nasıl olacak?", "Satış dönemine geçtiğimizde tüm Türkiye'ye kargo göndermeyi planlıyoruz. El işçiliği ürünlerde üretim süresi modele göre 2-4 hafta olacaktır."],
    ["Talep butonuna neden günde bir kez basabiliyorum?", "Talep sayılarının gerçek ilgiyi yansıtması için her ziyaretçi günde bir kez talep bırakabilir. Ertesi gün tekrar talep bırakarak desteğinizi sürdürebilirsiniz."],
    ["Ürün görselleri gerçek mi?", "Ürün kartlarındaki fotoğraflar temsilidir: geleneksel kıyafet kültürünü yansıtan, serbest lisanslı (Creative Commons) gerçek karelerden seçilmiştir; satın alınacak ürünün birebir fotoğrafı değildir. Satış dönemine geçtiğimizde her modelin kendi ürün fotoğrafı çekilip eklenecektir. Tüm fotoğraf kaynakları ve fotoğrafçı bilgileri Görsel Kaynakları sayfasında listelenir."]
  ];
  writeFile("sss/index.html", layout({
    root: "..",
    title: `Sıkça Sorulan Sorular | ${SITE_NAME}`,
    desc: "Kirasfistan nedir? Ön sipariş talebi nasıl çalışır? Kargo ne zaman başlayacak? Beden, fiyat ve talep sistemiyle ilgili tüm soruların yanıtları bu sayfada.",
    canonicalPath: "/sss/",
    current: "sss/",
    jsonld: [
      breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], ["SSS", SITE_URL + "/sss/"]]),
      {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": faqs.map(([q, a]) => ({
          "@type": "Question", "name": q,
          "acceptedAnswer": { "@type": "Answer", "text": a }
        }))
      }
    ],
    content: `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["Sıkça Sorulan Sorular", null]])}
    <h1>Sıkça Sorulan Sorular</h1>
  </div>
  <div class="faq-list" id="on-siparis">
    ${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><div><p>${esc(a)}</p></div></details>`).join("\n    ")}
  </div>
</div>
${demandSection("..", true)}`
  }));

  /* ---------- Terim Sözlüğü ---------- */
  {
    const kimlik = t => t.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü0-9]+/g, "-").replace(/^-|-$/g, "");
    const gruplar = {};
    for (const t of SOZLUK) (gruplar[t.grup] = gruplar[t.grup] || []).push(t);
    for (const g of Object.keys(gruplar)) gruplar[g].sort((x, y) => x.terim.localeCompare(y.terim, "tr"));
    const grupAdlari = Object.keys(gruplar);

    const gezinme = grupAdlari.map(g =>
      `<a class="sozluk-chip" href="#grup-${kimlik(g)}">${esc(g)} <span>${gruplar[g].length}</span></a>`
    ).join(String.fromCharCode(10) + "      ");

    const bolumler = grupAdlari.map(g => `<section class="sozluk-grup" id="grup-${kimlik(g)}">
    <h2>${esc(g)} <span class="grup-sayi">${gruplar[g].length} terim</span></h2>
    <div class="sozluk">
      ${gruplar[g].map(t => `<article class="sozluk-madde" id="${kimlik(t.terim)}" data-terim="${esc((t.terim + " " + t.tanim + " " + (t.esAnlam || "")).toLocaleLowerCase("tr"))}">
        <h3>${esc(t.terim)}${t.esAnlam ? `<em>${esc(t.esAnlam)}</em>` : ""}</h3>
        <p>${esc(t.tanim)}</p>
      </article>`).join(String.fromCharCode(10) + "      ")}
    </div>
  </section>`).join(String.fromCharCode(10) + "  ");

    writeFile("sozluk/index.html", layout({
      root: "..",
      title: `Yöresel Kıyafet Terimleri Sözlüğü (${SOZLUK.length} Terim) | ${SITE_NAME}`,
      desc: `Kirasfistan, şûtik, kofi, kadife, jakar… Yöresel kıyafet, kumaş ve dikiş terimlerinin ${SOZLUK.length} maddelik açıklamalı sözlüğü. Aradığınız terimi anında bulun.`,
      canonicalPath: "/sozluk/",
      current: "sozluk/",
      jsonld: [
        breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], ["Terimler Sözlüğü", SITE_URL + "/sozluk/"]]),
        {
          "@context": "https://schema.org", "@type": "DefinedTermSet",
          "name": "Yöresel Kıyafet Terimleri Sözlüğü",
          "url": SITE_URL + "/sozluk/",
          "inLanguage": "tr",
          "description": "Yöresel kıyafet, kumaş, işleme ve dikim terimlerinin açıklamalı sözlüğü.",
          "hasDefinedTerm": SOZLUK.map(t => ({
            "@type": "DefinedTerm",
            "name": t.terim,
            "description": t.tanim,
            "termCode": kimlik(t.terim),
            "url": SITE_URL + "/sozluk/#" + kimlik(t.terim),
            "inDefinedTermSet": SITE_URL + "/sozluk/"
          }))
        }
      ],
      content: `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["Terimler Sözlüğü", null]])}
    <h1>Yöresel Kıyafet Terimleri Sözlüğü</h1>
    <p class="page-intro">Kirasfistandan şûtiğe, kadifeden jakara… Yöresel kıyafetlerde sık geçen <strong>${SOZLUK.length} terimin</strong> kısa ve net açıklaması. Aradığınız kelimeyi aşağıdaki kutuya yazarak anında bulabilirsiniz.</p>
  </div>

  <div class="sozluk-arac">
    <label class="visually-hidden" for="sozluk-ara">Terim ara</label>
    <input type="search" id="sozluk-ara" placeholder="Terim ara… (ör. kadife, şûtik, pens)" autocomplete="off">
    <div class="sozluk-nav">
      ${gezinme}
    </div>
    <p class="sozluk-sonuc" id="sozluk-sonuc" aria-live="polite"></p>
  </div>

  ${bolumler}

  <div class="notice" style="margin-top:26px;">Koleksiyonu incelemek için <a href="../kirasfistan/">kirasfistan sayfamıza</a> göz atabilir, ayrıntılı anlatımlar için <a href="../blog/">rehber yazılarımızı</a> okuyabilirsiniz.</div>
</div>`
    }));
  }

  /* ---------- Görsel Kaynakları ---------- */
  writeFile("gorsel-kaynaklari/index.html", layout({
    root: "..",
    title: `Görsel Kaynakları ve Lisanslar | ${SITE_NAME}`,
    desc: "Kürt Yöresel sitesinde kullanılan kültür fotoğraflarının kaynakları, fotoğrafçıları ve Creative Commons lisans bilgileri.",
    canonicalPath: "/gorsel-kaynaklari/",
    current: "",
    jsonld: [breadcrumbJsonld([["Anasayfa", SITE_URL + "/"], ["Görsel Kaynakları", SITE_URL + "/gorsel-kaynaklari/"]])],
    content: `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["Görsel Kaynakları", null]])}
    <h1>Görsel Kaynakları</h1>
    <p class="page-intro">Sitedeki kültür fotoğrafları Wikimedia Commons üzerinden, aşağıda belirtilen serbest lisanslarla kullanılmaktadır. Emeği geçen tüm fotoğrafçılara teşekkür ederiz. Ürün kartlarındaki görseller ise sitemize özel hazırlanmış temsili tasarım çizimleridir.</p>
  </div>
  <div class="credits-list">
    ${[...new Map(PHOTOS.map(p => [p.sourceUrl, p])).values()].map(p => `<figure class="credit-item">
      <img src="../assets/img/${p.file}" alt="${esc(p.alt)}" loading="lazy" width="640" height="427">
      <figcaption>
        <b>${esc(p.title.replace(" (detay)", ""))}</b><br>
        Fotoğraf: ${esc(p.author)} · <a href="${p.licenseUrl}" rel="license nofollow">${esc(p.license)}</a> ·
        <a href="${p.sourceUrl}" rel="nofollow">Wikimedia Commons kaynağı</a>
      </figcaption>
    </figure>`).join("\n    ")}
  </div>
  <p class="page-intro" style="margin-top:6px;">Not: Ürün kartlarındaki bazı görseller, yukarıdaki kaynak fotoğraflardan alınan kıyafet odaklı kesitlerdir; tüm kesitler kaynağındaki lisansla kullanılır.</p>
</div>`
  }));

  /* ---------- Favoriler ---------- */
  writeFile("favoriler/index.html", layout({
    root: "..",
    title: `Favorilerim | ${SITE_NAME}`,
    desc: "Beğendiğiniz kirasfistan ve yöresel kıyafetleri favorilerinizde saklayın.",
    canonicalPath: "/favoriler/",
    noindex: true,
    current: "",
    content: `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["Favorilerim", null]])}
    <h1>Favorilerim</h1>
  </div>
  <div class="empty-state" id="wishlist-empty" hidden>
    <h2>Henüz favoriniz yok</h2>
    <p>Beğendiğiniz ürünlerin kalp simgesine tıklayarak burada saklayabilirsiniz.</p>
    <p style="margin-top:18px;"><a class="btn btn-primary" href="../kirasfistan/">Kirasfistanları Keşfet</a></p>
  </div>
  <div class="product-grid" id="wishlist-grid"></div>
</div>`
  }));

  /* ---------- Arama ---------- */
  writeFile("arama/index.html", layout({
    root: "..",
    title: `Ürün Arama | ${SITE_NAME}`,
    desc: "Kürt Yöresel koleksiyonunda kirasfistan, şal û şepik, puşi ve aksesuar arayın.",
    canonicalPath: "/arama/",
    noindex: true,
    current: "",
    content: `
<div class="container">
  <div class="page-head">
    ${breadcrumb("..", [["Anasayfa", "../"], ["Arama", null]])}
    <h1 id="search-title">Arama</h1>
    <p class="page-intro" id="search-count"></p>
  </div>
  <div class="product-grid" id="search-results"></div>
</div>`
  }));

  /* ---------- 404 ---------- */
  writeFile("404.html", layout({
    root: "",
    title: `Sayfa Bulunamadı | ${SITE_NAME}`,
    desc: "Aradığınız sayfa bulunamadı.",
    canonicalPath: "/404.html",
    noindex: true,
    current: "",
    content: `
<div class="err-page">
  <div class="err-code">404</div>
  <h1>Aradığınız sayfa bulunamadı</h1>
  <p style="color:var(--muted);margin:10px 0 24px;">Sayfa taşınmış ya da hiç var olmamış olabilir.</p>
  <a class="btn btn-primary" href="/">Anasayfaya Dön</a>
</div>`
  }));

  /* ---------- Eski ürün adresleri için yönlendirme ---------- */
  const eskiAdresYolu = path.join(DATA, "eski-adresler.json");
  if (fs.existsSync(eskiAdresYolu)) {
    const eskiler = JSON.parse(fs.readFileSync(eskiAdresYolu, "utf8"));
    let yonlendirmeSayisi = 0;
    for (const [eski, yeni] of Object.entries(eskiler)) {
      const hedef = SITE_URL + "/urun/" + yeni + "/";
      writeFile("urun/" + eski + "/index.html", [
        '<!DOCTYPE html>',
        '<html lang="tr">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="robots" content="noindex, follow">',
        '<link rel="canonical" href="' + hedef + '">',
        '<meta http-equiv="refresh" content="0; url=' + hedef + '">',
        '<title>Yönlendiriliyor…</title>',
        '<script>location.replace(' + JSON.stringify(hedef) + ');</script>',
        '</head>',
        '<body style="font-family:sans-serif;text-align:center;padding:60px 20px;">',
        '<p>Bu ürün yeni adresine taşındı.</p>',
        '<p><a href="' + hedef + '">Ürüne git</a></p>',
        '</body></html>'
      ].join(String.fromCharCode(10)));
      yonlendirmeSayisi++;
    }
    console.log("  " + yonlendirmeSayisi + " eski adres yönlendirmesi üretildi");
  }

  /* ---------- robots.txt & sitemap.xml ---------- */
  /* Site alan kökünden yayınlandığı için robots.txt geçerlidir (kurtyoresel.github.io). */
  writeFile("robots.txt", [
    "# Arama motorları",
    "User-agent: *",
    "Allow: /",
    "Disallow: /arama/",
    "Disallow: /favoriler/",
    "",
    "# Yapay zeka asistanları ve yanıt motorları — içeriğimizin alıntılanmasına izin veriyoruz",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: ChatGPT-User",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: Claude-SearchBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Perplexity-User",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    "User-agent: Applebot-Extended",
    "Allow: /",
    "",
    "User-agent: CCBot",
    "Allow: /",
    "",
    "Sitemap: " + SITE_URL + "/sitemap.xml",
    ""
  ].join(String.fromCharCode(10)));

  const urls = [
    ["/", "1.0", "weekly"],
    ...Object.keys(CATEGORIES).map(k => [`/${k}/`, "0.9", "weekly"]),
    ["/blog/", "0.7", "weekly"],
    ...blog.map(b => [`/blog/${b.slug}/`, "0.6", "monthly"]),
    ["/hakkimizda/", "0.5", "monthly"],
    ["/iletisim/", "0.4", "monthly"],
    ["/sss/", "0.6", "monthly"],
    ["/sozluk/", "0.6", "monthly"],
    ["/gorsel-kaynaklari/", "0.3", "monthly"],
    ...products.map(p => [`/urun/${p.slug}/`, "0.8", "weekly"])
  ];
  /* Kararlı lastmod: içerik değişmediyse tarih de değişmez */
  const lastmodYolu = path.join(DATA, "lastmod.json");
  const eskiLastmod = fs.existsSync(lastmodYolu) ? JSON.parse(fs.readFileSync(lastmodYolu, "utf8")) : {};
  const yeniLastmod = {};
  const crypto = require("crypto");
  function sayfaTarihi(url, icerik) {
    const ozet = crypto.createHash("sha1").update(icerik).digest("hex").slice(0, 16);
    const kayit = eskiLastmod[url];
    const tarih = (kayit && kayit.hash === ozet) ? kayit.date : BUILD_DATE;
    yeniLastmod[url] = { hash: ozet, date: tarih };
    return tarih;
  }
  function sayfaIcerik(yol) {
    const tam = path.join(OUT, yol.replace(/^\//, ""), "index.html");
    try { return fs.readFileSync(tam, "utf8"); } catch (e) { return yol; }
  }
  const urunGorsel = {};
  for (const p of products) urunGorsel["/urun/" + p.slug + "/"] = { src: SITE_URL + "/" + p._img, alt: p._photoFile ? photoByFile[p._photoFile].alt : p.alt };

  writeFile("sitemap.xml",
    '<?xml version="1.0" encoding="UTF-8"?>' + String.fromCharCode(10) +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + String.fromCharCode(10) +
    urls.map(([u]) => {
      const g = urunGorsel[u];
      const gorselEtiketi = g
        ? String.fromCharCode(10) + '    <image:image><image:loc>' + g.src + '</image:loc><image:title>' + esc(g.alt) + '</image:title></image:image>'
        : "";
      return '  <url><loc>' + SITE_URL + u + '</loc><lastmod>' + sayfaTarihi(u, sayfaIcerik(u)) + '</lastmod>' + gorselEtiketi + '</url>';
    }).join(String.fromCharCode(10)) +
    String.fromCharCode(10) + '</urlset>' + String.fromCharCode(10));
  fs.writeFileSync(lastmodYolu, JSON.stringify(yeniLastmod, null, 1), "utf8");

  console.log(`✔ Site üretildi: ${products.length} ürün, ${blog.length} blog yazısı, ${urls.length} sitemap kaydı`);
  console.log(`  Çıktı: ${OUT}`);
}

build();
