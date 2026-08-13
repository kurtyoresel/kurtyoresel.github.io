# 📖 Kürt Yöresel — Sahip Rehberi (Basit Anlatım)

## 1) Google Analytics'e kayıt (5 dakika)

1. https://analytics.google.com adresine git, Google hesabınla giriş yap.
2. **"Ölçmeye başlayın"** → hesap adı olarak `Kurt Yoresel` yaz → İleri.
3. Mülk (property) adı: `Kurt Yoresel Site` → saat dilimi **Türkiye**, para birimi **TRY** → İleri.
4. Sektör ve boyut sorularını istediğin gibi geç → **Oluştur** → sözleşmeyi kabul et.
5. Platform olarak **Web**'i seç.
6. Site adresi: `https://ahmethttp.github.io` — akış adı: `Kurt Yoresel` → **Oluştur**.
7. Ekranda **"G-" ile başlayan Ölçüm Kimliği** göreceksin (örn `G-AB12CD34EF`). **Bunu kopyala.**

Sonra iki seçenek:
- **Kolay yol:** Bu kimliği bana yaz ("GA kimliğim G-XXXX" de), gerisini ben hallederim.
- **Kendin yapmak istersen:** `tools/assets/js/config.js` dosyasını aç, `gaId: ""` yerine `gaId: "G-XXXX"` yaz, sonra terminalde `node tools/build.js` çalıştır ve değişiklikleri GitHub'a gönder.

## 2) Ziyaretçileri nereden takip edeceksin?

Google Analytics'e giriş yap → sol menüde **Raporlar**:
- **Gerçek zamanlı**: Şu an sitede kaç kişi var.
- **Raporlar → Etkileşim → Sayfalar**: Hangi sayfalara/ürünlere bakılmış.
- **Raporlar → Edinme**: Ziyaretçiler nereden gelmiş (Google, sosyal medya…).

## 3) "Talep Topla" istatistikleri nerede?

Sitedeki butonlar Analytics'e özel sinyal (etkinlik) gönderir:

| Etkinlik adı | Anlamı |
|---|---|
| `talep_topla` | "Bu sitenin açılmasını ister misiniz?" butonuna basanlar |
| `urun_talep` | Bir ürün sayfasında "Ön Sipariş Talebi Bırak" diyenler |
| `add_to_wishlist` | Favorilere eklenen ürünler |
| `search` | Sitede arama yapanlar |

Görmek için: Analytics → **Raporlar → Etkileşim → Etkinlikler**. `talep_topla` sayısı = sitenin açılmasını isteyen kişi sayısı. `urun_talep` etkinliğine tıklayıp `item_name` detayına bakarsan **hangi ürünün** ne kadar talep aldığını görürsün.

Not: Aynı ziyaretçi aynı gün içinde tekrar talep bırakamaz (tarayıcı bazlı engel). GitHub Pages'te sunucu olmadığı için IP bazlı engel teknik olarak mümkün değil; Analytics zaten "toplam tıklama" ve "tekil kullanıcı" sayılarını ayrı ayrı gösterir, gerçek ilgiyi oradan okuyacağız.

## 4) Google'da çıkmak için (önemli, 5 dakika)

1. https://search.google.com/search-console adresine git.
2. **"URL öneki"** seç, `https://ahmethttp.github.io/kurt-yoresel/` yaz.
3. Doğrulama için **Google Analytics** seçeneğini kullan (GA'yı kurduysan otomatik doğrular).
4. Soldan **Site Haritaları** → `sitemap.xml` yaz → Gönder.

Bu yapılmazsa Google siteyi geç bulur; yapılırsa birkaç gün içinde taranır. Ziyaretçi trafiği zamanla oluşur, ilk haftalarda düşük olması normaldir — sosyal medyada (Instagram, TikTok, Facebook grupları) linki paylaşmak trafiği en hızlı büyüten yoldur.

## 5) İleride .com alan adı alınca

1. Alan adını satın al (örn `kurtyoresel.com`).
2. Bana "alan adı aldım: kurtyoresel.com" yaz — ayarları ben yaparım.
   (Teknik özet: `tools/build.js` içindeki `SITE_URL` güncellenir, `docs/CNAME` dosyası eklenir, alan adı sağlayıcısında GitHub Pages DNS kayıtları girilir.)

## 6) Siteyi güncellemek

Her değişiklikten sonra sırayla:
```bash
node tools/build.js
```
```bash
git add -A
```
```bash
git commit -m "Site güncellendi"
```
```bash
git push
```
1-2 dakika içinde canlı site güncellenir.
