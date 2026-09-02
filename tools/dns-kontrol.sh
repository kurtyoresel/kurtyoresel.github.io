#!/usr/bin/env bash
# DNS ve site durumunu kontrol eder. Kullanım: bash tools/dns-kontrol.sh
ALAN="${1:-kurtyoresel.com}"
BEKLENEN="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"

echo "=== 1) Alan adı kaydı (RDAP) ==="
KOD=$(curl -s -o /dev/null -w '%{http_code}' "https://rdap.verisign.com/com/v1/domain/$ALAN")
[ "$KOD" = "200" ] && echo "  ✔ $ALAN kayıtlı" || echo "  ⏳ Kayıt henüz global sisteme yayılmadı (HTTP $KOD)"

echo "=== 2) A kayıtları ==="
BULUNAN=$(nslookup "$ALAN" 8.8.8.8 2>/dev/null | sed -n '/^Name:/,$p' | awk '/^Address(es)?: /{print $NF}')
if [ -z "$BULUNAN" ]; then
  echo "  ⏳ Henüz DNS kaydı yok"
else
  for ip in $BULUNAN; do
    echo "$BEKLENEN" | grep -q "$ip" && echo "  ✔ $ip (GitHub Pages)" || echo "  ? $ip (beklenmeyen)"
  done
fi

echo "=== 3) Site erişimi ==="
for u in "http://$ALAN/" "https://$ALAN/" "https://www.$ALAN/"; do
  K=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$u" 2>/dev/null || echo "---")
  echo "  $K  $u"
done
