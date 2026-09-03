#!/usr/bin/env bash
# GitHub Pages SSL sertifikası hazır olunca HTTPS zorunluluğunu açar.
REPO="kurtyoresel/kurtyoresel.github.io"
ALAN="kurtyoresel.com"
for i in $(seq 1 40); do
  if gh api "repos/$REPO/pages" -X PUT --input - >/dev/null 2>&1 <<< '{"https_enforced": true}'; then
    echo "[$i] ✔ SSL sertifikası hazır, HTTPS zorunlu hale getirildi."
    sleep 10
    echo "https://$ALAN/ → $(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://$ALAN/")"
    echo "https://www.$ALAN/ → $(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://www.$ALAN/")"
    exit 0
  fi
  echo "[$i] ⏳ sertifika bekleniyor..."
  sleep 90
done
echo "✘ 60 dakikada sertifika üretilmedi — elle kontrol gerekiyor."
exit 1
