/* Ürünlere temsili havuz fotoğrafı atar (renk serisi + kategoriye göre).
   Çıktı: tools/data/product-photo-map.json  { slug: dosyaAdi }
   Kullanım: node tools/assign-product-photos.js */
"use strict";
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "data");
const products = JSON.parse(fs.readFileSync(path.join(DATA, "products.json"), "utf8"));

/* Kirasfistan renk serilerine göre foto listeleri (slug öneki → dosyalar, sırayla döner) */
const KIRAS_POOLS = {
  botan: ["urun-kirmizi-dantel.jpg", "urun-kirmizi-portre.jpg", "kultur-kadin-dans.jpg"],
  serhat: ["urun-elbise-renkli.jpg", "palangan-women.jpg", "urun-manken-vitrin.jpg"],
  merdin: ["urun-manken-vitrin.jpg", "urun-elbise-renkli.jpg", "hawrami-girls.jpg"],
  hekari: ["palangan-women.jpg", "urun-elbise-renkli.jpg", "kultur-kadin-dans.jpg"],
  amed: ["urun-sari-goloni.jpg", "urun-elbise-renkli.jpg", "kultur-tef-gosterisi.jpg"],
  cizir: ["urun-elbise-renkli.jpg", "palangan-women.jpg", "hawrami-girls.jpg"],
  wan: ["urun-manken-vitrin.jpg", "urun-elbise-renkli.jpg", "kultur-kadin-dans.jpg"],
  riha: ["kultur-mesale-ritueli.jpg", "urun-kirmizi-portre.jpg", "urun-elbise-renkli.jpg"],
  semsur: ["kultur-mesale-ritueli.jpg", "urun-kirmizi-dantel.jpg", "urun-elbise-renkli.jpg"]
};

/* Şal û şepik: 8 ürüne 8 farklı fotoğraf */
const SEPIK_POOL = [
  "sal-sepik-ikili.jpg", "urun-sepik-iki-usta.jpg", "urun-sepik-dort-usta.jpg",
  "sal-sepik-cizgili.jpg", "sal-sepik-grup.jpg", "sal-sepik-mavi-pusi.jpg",
  "hawrami-man.jpg", "sal-sepik-halay.jpg"
];

/* Puşi: puşinin görünür olduğu kareler */
const PUSI_POOL = [
  "sal-sepik-mavi-pusi.jpg", "sal-sepik-cizgili.jpg", "hawrami-man.jpg",
  "urun-sepik-iki-usta.jpg", "sal-sepik-ikili.jpg", "urun-sepik-dort-usta.jpg"
];

/* Aksesuar: türe göre */
const AKS_POOLS = {
  kofi: ["urun-kofi-altin.jpg", "hawraman-headdress.jpg"],
  sutik: ["urun-kirmizi-dantel.jpg", "hawrami-man.jpg"],
  corap: ["urun-klash.jpg"],
  heybe: ["senneh-kilim.jpg"]
};

const counters = {};
function next(poolKey, pool) {
  const i = counters[poolKey] = (counters[poolKey] ?? -1) + 1;
  return pool[i % pool.length];
}

const map = {};
for (const p of products) {
  if (p.category === "kirasfistan") {
    const prefix = p.slug.split("-")[0];
    const pool = KIRAS_POOLS[prefix] || KIRAS_POOLS.botan;
    map[p.slug] = next("k-" + prefix, pool);
  } else if (p.category === "sal-u-sepik") {
    map[p.slug] = next("sepik", SEPIK_POOL);
  } else if (p.category === "pusi") {
    map[p.slug] = next("pusi", PUSI_POOL);
  } else {
    const kind = (p.art && p.art.kind) || "kofi";
    map[p.slug] = next("aks-" + kind, AKS_POOLS[kind] || AKS_POOLS.kofi);
  }
}

fs.writeFileSync(path.join(DATA, "product-photo-map.json"), JSON.stringify(map, null, 1), "utf8");
const dist = {};
Object.values(map).forEach(f => dist[f] = (dist[f] || 0) + 1);
console.log(`✔ ${Object.keys(map).length} ürüne fotoğraf atandı. Dağılım:`);
Object.entries(dist).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`  ${String(n).padStart(3)} × ${f}`));
