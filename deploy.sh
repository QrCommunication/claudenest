#!/bin/bash
set -e

cd /var/www/claudenest

echo "Pulling latest changes..."
git pull origin main

echo "Updating infrastructure configs..."
sudo cp infrastructure/supervisor/claudenest-worker.conf /etc/supervisor/conf.d/claudenest-worker.conf
sudo cp infrastructure/supervisor/claudenest-agent-ws.conf /etc/supervisor/conf.d/claudenest-agent-ws.conf
sudo cp infrastructure/caddy/Caddyfile /etc/caddy/Caddyfile

echo "Ensuring Laravel scheduler cron..."
sudo cp infrastructure/cron/claudenest-scheduler /etc/cron.d/claudenest-scheduler
sudo chown root:root /etc/cron.d/claudenest-scheduler
sudo chmod 644 /etc/cron.d/claudenest-scheduler

echo "Installing backend dependencies..."
cd packages/server
composer install --no-dev --optimize-autoloader --no-interaction

echo "Running migrations..."
php artisan migrate --force

echo "Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo "Optimizing..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

echo "Building frontend..."
npm install
npm run build

echo "Restarting services..."
# Caddy sert via php8.4-fpm (migration 2026-06-11) — redémarrer le bon FPM,
# sinon l'opcache continue de servir l'ancien code après deploy.
sudo systemctl restart php8.4-fpm
sudo systemctl reload caddy
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart claudenest-worker:*
sudo supervisorctl restart claudenest-agent-ws
# enable = survit aux reboots (le reboot kernel du 2026-06-11 avait laissé
# Reverb éteint car l'unit n'était pas enabled → temps réel UI mort).
sudo systemctl enable claudenest-reverb
sudo systemctl restart claudenest-reverb

echo "Deployment complete!"
