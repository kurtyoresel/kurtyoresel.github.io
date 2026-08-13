/* docs/ içindeki tüm HTML dosyalarında yerel link/görsel hedeflerini doğrular.
   Kullanım: node tools/check-links.js */
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "docs");
const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith(".html")) htmlFiles.push(full);
  }
})(OUT);

let errors = 0, checked = 0;
const attrRe = /(?:href|src)="([^"]+)"/g;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  let m;
  while ((m = attrRe.exec(html))) {
    let url = m[1];
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(url)) continue;
    url = url.split("#")[0].split("?")[0];
    if (!url) continue;
    let target = url.startsWith("/")
      ? path.join(OUT, url.replace(/^\/kurt-yoresel\/?/, ""))
      : path.resolve(dir, url);
    checked++;
    let ok = fs.existsSync(target);
    if (ok && fs.statSync(target).isDirectory()) ok = fs.existsSync(path.join(target, "index.html"));
    if (!ok) {
      errors++;
      console.error(`KIRIK: ${path.relative(OUT, file)} -> ${m[1]}`);
    }
  }
}
console.log(`${htmlFiles.length} sayfa, ${checked} bağlantı denetlendi, ${errors} kırık.`);
process.exit(errors ? 1 : 0);
