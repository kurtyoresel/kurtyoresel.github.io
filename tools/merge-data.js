/* Parça JSON dosyalarını products.json ve blog.json olarak birleştirir.
   Kullanım: node tools/merge-data.js */
"use strict";
const fs = require("fs");
const path = require("path");

const PARTS = path.join(__dirname, "data", "parts");
const DATA = path.join(__dirname, "data");

const PRODUCT_ORDER = [
  "botan.json", "serhat.json", "merdin.json", "hekari.json",
  "amed.json", "cizir.json", "wan.json", "riha.json",
  "salsepik-pusi.json", "aksesuar.json"
];
const BLOG_ORDER = ["blog-a.json", "blog-b.json"];

function readPart(file) {
  const full = path.join(PARTS, file);
  if (!fs.existsSync(full)) {
    console.error(`EKSİK PARÇA: ${file}`);
    process.exitCode = 1;
    return [];
  }
  let raw = fs.readFileSync(full, "utf8").replace(/^﻿/, "");
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("kök eleman dizi değil");
    return data;
  } catch (e) {
    console.error(`BOZUK JSON (${file}): ${e.message}`);
    process.exitCode = 1;
    return [];
  }
}

const products = PRODUCT_ORDER.flatMap(readPart);
const blog = BLOG_ORDER.flatMap(readPart);

/* Ürünleri karışık ama deterministik sırala: kategoriler kendi içinde korunur,
   kirasfistanlar yöreler arasında dönüşümlü dizilir ki liste tekdüze görünmesin */
const kiras = products.filter(p => p.category === "kirasfistan");
const rest = products.filter(p => p.category !== "kirasfistan");
const byPrefix = {};
for (const p of kiras) {
  const pre = p.slug.split("-")[0];
  (byPrefix[pre] = byPrefix[pre] || []).push(p);
}
const interleaved = [];
const lists = Object.values(byPrefix);
let added = true;
for (let i = 0; added; i++) {
  added = false;
  for (const list of lists) {
    if (list[i]) { interleaved.push(list[i]); added = true; }
  }
}
const finalProducts = [...interleaved, ...rest];

fs.writeFileSync(path.join(DATA, "products.json"), JSON.stringify(finalProducts, null, 1), "utf8");
fs.writeFileSync(path.join(DATA, "blog.json"), JSON.stringify(blog, null, 1), "utf8");

const kCount = finalProducts.filter(p => p.category === "kirasfistan").length;
console.log(`✔ ${finalProducts.length} ürün (${kCount} kirasfistan), ${blog.length} blog yazısı birleştirildi.`);
if (process.exitCode) console.error("⚠ Hatalar var, yukarıyı kontrol et.");
