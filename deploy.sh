#!/bin/bash
set -e

cd /var/www/claudenest

echo "Pulling latest changes..."
git pull origin main

echo "Updating infrastructure configs..."
sudo cp infrastructure/supervisor/claudenest-worker.conf /etc/supervisor/conf.d/claudenest-worker.conf
sudo cp infrastructure/supervisor/claudenest-agent-ws.conf /etc/supervisor/conf.d/claudenest-agent-ws.conf
sudo cp infrastructure/caddy/Caddyfile /etc/caddy/Caddyfile

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
sudo systemctl restart php8.3-fpm
sudo systemctl reload caddy
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart claudenest-worker:*
sudo supervisorctl restart claudenest-agent-ws
sudo systemctl restart claudenest-reverb

echo "Deployment complete!"
