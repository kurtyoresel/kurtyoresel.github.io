# 🔧 Natro'da yapman gereken tek ayar (5 dakika)

Site hazır ve bekliyor. Sadece alan adını siteye bağlaman gerekiyor.

## Nereye gireceksin

1. **https://www.natro.com** → sağ üst **Müşteri Girişi**
2. **Alan Adlarım** (veya "Domainlerim") → **kurtyoresel.com** → **DNS Yönetimi**
   *(bazı panellerde "DNS Kayıtları" veya "Advanced DNS" yazar)*

## Ekleyeceğin 5 kayıt

Varsa hazır gelen `A` ve `CNAME` kayıtlarını **sil**, sonra bunları ekle:

| Tip | İsim / Host | Değer / Hedef |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `kurtyoresel.github.io` |

> **`@` ne demek?** Alan adının kendisi (kurtyoresel.com). Bazı panellerde `@` yerine boş bırakılır veya `kurtyoresel.com` yazılır.
>
> **TTL** sorarsa: varsayılanı bırak (veya 3600).

## Sonra

Bana **"DNS ayarladım"** yaz. Gerisini ben kontrol edip bitiriyorum:
- Adresin çalıştığını doğrulama
- Ücretsiz SSL sertifikası (🔒 yeşil kilit)
- Google Analytics + Google'a kayıt

DNS değişikliği genelde **15 dakika – 2 saat** içinde aktif olur.

---

## Takılırsan

Panelde bu ekranı bulamazsan Natro destek hattını arayabilirsin: **0 212 213 1 213**
Onlara şunu söylemen yeterli: *"kurtyoresel.com için DNS A kayıtlarını değiştirmek istiyorum."*

Ya da ekranın fotoğrafını/yazısını bana gönder, adım adım söyleyeyim.
