#!/usr/bin/env bash
# Kürt Yöresel — sunucuya yayınlama betiği (rsync gerektirmez, ssh+tar kullanır)
# Kullanım: KY_HOST=1.2.3.4 bash tools/deploy.sh
set -euo pipefail

SUNUCU="${KY_HOST:-}"
KULLANICI="${KY_USER:-deploy}"
HEDEF="${KY_PATH:-/var/www/kurtyoresel}"
ANAHTAR="${KY_KEY:-$HOME/.ssh/kurtyoresel_deploy}"
ALAN="${KY_DOMAIN:-kurtyoresel.com}"

[ -z "$SUNUCU" ] && { echo "HATA: KY_HOST tanımlı değil."; exit 1; }
SSH_OPTS=(-i "$ANAHTAR" -o StrictHostKeyChecking=accept-new)

echo "1/4 Site yeniden üretiliyor..."
node tools/build.js
node tools/check-links.js

echo "2/4 Paketleniyor..."
tar -czf /tmp/ky-site.tar.gz -C docs .

echo "3/4 Sunucuya gönderiliyor ($SUNUCU)..."
scp "${SSH_OPTS[@]}" /tmp/ky-site.tar.gz "$KULLANICI@$SUNUCU:/tmp/ky-site.tar.gz"
ssh "${SSH_OPTS[@]}" "$KULLANICI@$SUNUCU" bash -s <<REMOTE
set -e
sudo mkdir -p "$HEDEF"
sudo rm -rf "$HEDEF".yeni && sudo mkdir -p "$HEDEF".yeni
sudo tar -xzf /tmp/ky-site.tar.gz -C "$HEDEF".yeni
sudo rm -rf "$HEDEF".eski
[ -d "$HEDEF" ] && sudo mv "$HEDEF" "$HEDEF".eski
sudo mv "$HEDEF".yeni "$HEDEF"
sudo chown -R www-data:www-data "$HEDEF"
sudo rm -rf "$HEDEF".eski /tmp/ky-site.tar.gz
REMOTE
rm -f /tmp/ky-site.tar.gz

echo "4/4 Doğrulanıyor..."
for yol in "/" "/kirasfistan/" "/sitemap.xml"; do
  KOD=$(curl -s -o /dev/null -w '%{http_code}' "https://$ALAN$yol" || echo "yok")
  echo "  $KOD  $yol"
done
echo "✔ Yayınlama tamamlandı: https://$ALAN/"
