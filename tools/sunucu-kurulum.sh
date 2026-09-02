#!/usr/bin/env bash
# Kürt Yöresel — sıfır sunucuyu yayına hazırlar (Ubuntu 24.04 LTS)
# Sunucuda root olarak çalıştırılır. Nginx + SSL + güvenlik sertleştirme.
set -euo pipefail

ALAN="${1:-kurtyoresel.com}"
EPOSTA="${2:-ahmethttp1@gmail.com}"
DEPLOY_KEY="${3:-}"   # deploy kullanıcısı için SSH public key

echo "== 1/7 Sistem güncelleniyor"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get upgrade -y -qq

echo "== 2/7 Paketler kuruluyor (nginx, certbot, ufw, fail2ban)"
apt-get install -y -qq nginx certbot python3-certbot-nginx ufw fail2ban unattended-upgrades

echo "== 3/7 deploy kullanıcısı oluşturuluyor"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy
if [ -n "$DEPLOY_KEY" ]; then
  mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
  echo "$DEPLOY_KEY" > /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
  chown -R deploy:deploy /home/deploy/.ssh
fi

echo "== 4/7 Site dizini ve Nginx yapılandırması"
mkdir -p "/var/www/kurtyoresel"
chown -R www-data:www-data /var/www/kurtyoresel
cat > /etc/nginx/sites-available/kurtyoresel <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $ALAN www.$ALAN;
    root /var/www/kurtyoresel;
    index index.html;

    # Temiz URL'ler: /kirasfistan/ -> /kirasfistan/index.html
    location / { try_files \$uri \$uri/ \$uri/index.html =404; }
    error_page 404 /404.html;

    # Statik dosya önbelleği (hız + Core Web Vitals)
    location ~* \.(jpg|jpeg|png|svg|webp|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location ~* \.(css|js)$ { expires 7d; add_header Cache-Control "public"; }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json text/plain;
    gzip_min_length 1024;

    # Güvenlik başlıkları
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINX
ln -sf /etc/nginx/sites-available/kurtyoresel /etc/nginx/sites-enabled/kurtyoresel
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "== 5/7 Güvenlik duvarı"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null

echo "== 6/7 SSH sertleştirme (parola girişi kapalı, sadece anahtar)"
if [ -n "$DEPLOY_KEY" ]; then
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
  systemctl restart ssh || systemctl restart sshd
fi
systemctl enable --now fail2ban >/dev/null 2>&1 || true
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true

echo "== 7/7 Ücretsiz SSL sertifikası (Let's Encrypt)"
echo "NOT: Bu adım için $ALAN alan adının bu sunucuya yönlendirilmiş olması gerekir."
certbot --nginx -d "$ALAN" -d "www.$ALAN" --non-interactive --agree-tos -m "$EPOSTA" --redirect || \
  echo "UYARI: SSL kurulamadı (DNS henüz yayılmamış olabilir). Sonra tekrar: certbot --nginx -d $ALAN -d www.$ALAN"

systemctl reload nginx
echo "✔ Sunucu hazır. Site dizini: /var/www/kurtyoresel"
