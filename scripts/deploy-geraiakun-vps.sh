#!/usr/bin/env bash
set -euo pipefail

archive_path="${1:-/tmp/geraiakun-store-deploy.tgz}"
app_root="/opt/geraiakun-store"
release="$app_root/releases/$(date +%Y%m%d%H%M%S)"

sudo mkdir -p "$release" "$app_root/shared"
sudo tar -xzf "$archive_path" -C "$release"
sudo chown -R awidyaproject:awidyaproject "$app_root"

if [ ! -f "$app_root/shared/.env" ]; then
  auth_secret="$(openssl rand -base64 48)"
  vault_key="$(openssl rand -base64 48)"
  sudo tee "$app_root/shared/.env" >/dev/null <<ENV
APP_URL=https://geraiakun.store
AUTH_URL=https://geraiakun.store
AUTH_SECRET=$auth_secret
CREDENTIAL_ENCRYPTION_KEY=$vault_key
MIDTRANS_IS_PRODUCTION=false
SEED_ADMIN_EMAIL=admin@geraiakun.id
SEED_ADMIN_PASSWORD=change-before-production
ENV
  sudo chown awidyaproject:awidyaproject "$app_root/shared/.env"
  sudo chmod 600 "$app_root/shared/.env"
fi

sudo ln -sfn "$release" "$app_root/current"

sudo tee /etc/systemd/system/geraiakun-store.service >/dev/null <<'UNIT'
[Unit]
Description=Geraiakun Store
After=network.target

[Service]
Type=simple
User=awidyaproject
Group=awidyaproject
WorkingDirectory=/opt/geraiakun-store/current
EnvironmentFile=-/opt/geraiakun-store/shared/.env
Environment=NODE_ENV=production
Environment=PORT=4300
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/opt/geraiakun-store

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable geraiakun-store.service >/dev/null
sudo systemctl restart geraiakun-store.service
systemctl is-active geraiakun-store.service
