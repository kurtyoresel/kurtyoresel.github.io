#!/usr/bin/env bash
# Görselleri web için optimize eder (boyut + sıkıştırma).
# Kullanım: bash tools/gorsel-optimize.sh
set -uo pipefail
IMG="tools/assets/img"

# Büyük gösterilen görseller (kategori banner'ı, blog kapağı, hero, hakkımızda)
BUYUK="palangan-women.jpg hawrami-man.jpg sal-sepik-mavi-pusi.jpg hawraman-headdress.jpg
kultur-kadin-dans.jpg dugun-vintage.jpg sal-sepik-ikili.jpg sal-sepik-grup.jpg"

topOnce=0; topSonra=0; sayac=0
for f in "$IMG"/*.jpg; do
  ad=$(basename "$f")
  once=$(stat -c%s "$f")
  if echo "$BUYUK" | grep -qw "$ad"; then GEN=1200; else GEN=760; fi
  ffmpeg -y -loglevel error -i "$f" -vf "scale='min($GEN,iw)':-2" -q:v 6 "/tmp/opt_$ad" 2>/dev/null
  if [ -s "/tmp/opt_$ad" ]; then
    sonra=$(stat -c%s "/tmp/opt_$ad")
    # Sadece gerçekten küçüldüyse değiştir
    if [ "$sonra" -lt "$once" ]; then mv "/tmp/opt_$ad" "$f"; else rm -f "/tmp/opt_$ad"; sonra=$once; fi
  else
    sonra=$once
  fi
  topOnce=$((topOnce+once)); topSonra=$((topSonra+sonra)); sayac=$((sayac+1))
done
echo "✔ $sayac görsel işlendi"
echo "  Önce:  $((topOnce/1048576)) MB"
echo "  Sonra: $((topSonra/1048576)) MB"
echo "  Kazanç: %$(( 100 - (topSonra*100/topOnce) ))"
