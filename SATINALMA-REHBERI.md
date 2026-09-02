# 🛒 Satın Alma Rehberi — kurtyoresel.com

Araştırma tarihi: 3 Eylül 2026 · Kurlar: 1 USD ≈ 48,3 TL · 1 EUR ≈ 56 TL

## Alacağın 2 şey

| | Ne | Nereden | Yıllık |
|---|---|---|---|
| 1 | Alan adı `kurtyoresel.com` | **Cloudflare** | ~505 TL |
| 2 | Sunucu (VPS) | **Hetzner CX23** | ~4.020 TL |
| | | **TOPLAM** | **~4.500 TL/yıl** |

`kurtyoresel.com` şu an **boşta** (Verisign resmi kaydından doğrulandı, 3 Eylül 2026).

---

## ADIM 1 — Alan adı (Cloudflare, ~5 dk)

1. https://dash.cloudflare.com → ücretsiz hesap aç
2. Sol menü: **Domain Registration → Register Domain**
3. `kurtyoresel.com` ara → **Purchase**
4. Fiyat: 10,46 $ (~505 TL). **Yenileme de aynı fiyat** — zam tuzağı yok.

> ⚠️ Natro/Turhost'ta alan adı ilk yıl 2-3 $ ama **yenilemesi 23 $**'a çıkıyor (8 kat). Cloudflare maliyetine satıyor, uzun vadede en ucuz.

## ADIM 2 — Sunucu (Hetzner, ~10 dk)

1. https://www.hetzner.com/cloud → **Sign up**
2. Hesap onaylandıktan sonra: **New Project** → **Add Server**
3. Seçimler:
   - **Location:** Nuremberg (Nürnberg) 🇩🇪
   - **Image:** Ubuntu (en güncel LTS)
   - **Type:** Shared vCPU → **CX23** (yoksa **CAX11**)
   - **SSH keys:** ⚠️ **New SSH key** → aşağıdaki metni yapıştır:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMd8iLmy4YcA5Tp91sb2/0SpOvoq4ImpUsfZXCWfFkHL kurtyoresel-deploy-claude
```

4. **Create & Buy now**

> ⚠️ SSH anahtarını **sunucu kurulurken** eklemek zorunlu — Hetzner sonradan eklemeye izin vermiyor.

## ADIM 3 — Bana haber ver

Sadece **sunucunun IP adresini** yaz (örn. `188.34.x.x`). Başka hiçbir şey gerekmiyor.

---

## 🔒 Güvenlik kuralı

**Bana asla şifre, kart bilgisi veya hesap parolası gönderme.** Yukarıdaki "ssh-ed25519..." metni bir **genel anahtar**; paylaşılması güvenlidir, tek işlevi sunucunun beni tanımasıdır. Gizli yarısı senin bilgisayarında kalır.

---

## Sorun çıkarsa: Plan B

Hetzner yeni hesaplarda kimlik doğrulama isteyebiliyor ve bazı Türk kartları 3D Secure adımında reddedilebiliyor. Böyle bir durumda:

**DigitalOcean** → https://www.digitalocean.com → Create Droplet → Frankfurt → Ubuntu → Basic **$6/ay** → Authentication: **SSH Key** (aynı anahtarı yapıştır) → Create.
Not: DigitalOcean Türkiye'ye %20 KDV ekliyor, gerçek tutar 7,20 $/ay (~348 TL).

---

## Sunucu geldikten sonra ben ne yapacağım

1. `tools/sunucu-kurulum.sh` → Nginx, ücretsiz SSL (Let's Encrypt), güvenlik duvarı, fail2ban, otomatik güncellemeler, root girişini kapatma
2. Cloudflare'de DNS kaydı → `kurtyoresel.com` sunucuya bağlanır
3. `tools/deploy.sh` → 117 sayfalık site yüklenir
4. Google Analytics kurulumu + Google Search Console kaydı + sitemap gönderimi

Senin ek bir işlem yapmana gerek kalmaz.
