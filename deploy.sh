#!/bin/bash
cd /var/www/claudenest

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing backend dependencies..."
cd packages/server
composer install --no-dev --optimize-autoloader --no-interaction

echo "🗄️ Running migrations..."
php artisan migrate --force

echo "🧹 Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo "⚡ Optimizing..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

echo "🎨 Building frontend..."
npm install
npm run build

echo "🔄 Restarting services..."
sudo systemctl restart caddy
sudo systemctl restart php8.3-fpm
sudo systemctl restart claudenest-reverb
sudo supervisorctl restart all

echo "✅ Deployment complete!"