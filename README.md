# Kürt Yöresel

Kirasfistan, Şal û Şepik, Puşi ve yöresel aksesuarlar için **ön talep toplama** amaçlı e-ticaret vitrini.

🌐 **Canlı site:** https://kurtyoresel.com/

## Nasıl çalışır?

Bu, sunucu gerektirmeyen tamamen statik bir sitedir (GitHub Pages). Site `docs/` klasöründen yayınlanır.

```
tools/
  build.js        → Siteyi üreten script (şablonlar + SVG görsel motoru + SEO)
  merge-data.js   → Ajan parçalarını products.json / blog.json'a birleştirir
  data/           → Ürün ve blog verileri
  assets/         → CSS ve JS kaynakları
  photos/         → (opsiyonel) <slug>.jpg koyarsan SVG yerine gerçek fotoğraf kullanılır
docs/             → ÜRETİLEN site (elle düzenleme!)
```

## Siteyi yeniden üretmek

```bash
node tools/build.js
```

Sonra commit + push yeterli; GitHub Pages otomatik günceller.

## Google Analytics

`tools/assets/js/config.js` içindeki `gaId` alanına `G-XXXXXXXXXX` ölçüm kimliğini yaz, `node tools/build.js` çalıştır, push et. Ayrıntılar: [REHBER.md](REHBER.md)

## Gerçek fotoğraflara geçiş

`tools/photos/` klasörüne ürün slug'ı ile aynı isimde `.jpg` koy (örn `botan-kadife-kirasfistan-bordo.jpg`), build'i çalıştır — o ürün otomatik fotoğrafa geçer.

## Özel alan adı (.com)

`tools/build.js` başındaki `SITE_URL` değerini yeni alan adıyla değiştir, `docs/CNAME` dosyası oluştur, build + push. Ayrıntılar: [REHBER.md](REHBER.md)
