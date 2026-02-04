# 🖥️ Bare-Metal Deployment Guide

Guide for deploying ClaudeNest directly on Ubuntu/Debian server without Docker.

**Recommended for:** Production servers with dedicated resources (e.g., EM-A410X-SSD 64GB)

---

## 📋 Table of Contents

1. [Requirements](#requirements)
2. [Quick Install](#quick-install)
3. [Manual Installation](#manual-installation)
4. [AI Models Setup](#ai-models-setup)
5. [Service Configuration](#service-configuration)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring](#monitoring)
8. [Backup](#backup)
9. [Troubleshooting](#troubleshooting)

---

## Requirements

### Hardware (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER SPECIFICATIONS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CPU:     Intel Xeon E5 1650 6C/12T 3.2GHz (or equivalent)  │
│  RAM:     64 GB                                             │
│  Storage: 2× 1.02 TB SSD (RAID 1)                          │
│  Network: 1 Gbps                                            │
│                                                              │
│  Example: EM-A410X-SSD from Pulseheberg                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### RAM Allocation

| Service | RAM | Purpose |
|---------|-----|---------|
| PostgreSQL + pgvector | 16 GB | Database, vector search |
| Redis | 4 GB | Cache, sessions, queues |
| Ollama (Mistral 7B) | 6 GB | Summarization |
| Embedding Service | 1 GB | bge-small-en |
| PHP-FPM | 4 GB | Laravel application |
| Laravel Reverb | 2 GB | WebSocket server |
| OS + Buffer | 30 GB | System, file cache |
| **Total** | **~64 GB** | |

### Software

- Ubuntu 22.04 LTS or Debian 12
- Nginx 1.24+
- PHP 8.3 with FPM
- PostgreSQL 16 with pgvector
- Redis 7
- Node.js 20 LTS
- Ollama

---

## Quick Install

### Automated Installation

```bash
# Download and run installer
curl -fsSL https://raw.githubusercontent.com/yourusername/claudenest/main/scripts/install-server.sh | sudo bash

# Or with wget
wget -qO- https://raw.githubusercontent.com/yourusername/claudenest/main/scripts/install-server.sh | sudo bash
```

### What the installer does:

1. Updates system packages
2. Installs all dependencies (PHP, Node, PostgreSQL, Redis, Nginx)
3. Configures PostgreSQL with pgvector
4. Installs Ollama and AI models
5. Sets up the application directory
6. Creates systemd services
7. Configures Nginx
8. Sets up SSL with Let's Encrypt (optional)

---

## Manual Installation

### Step 1: System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install basic tools
sudo apt install -y curl wget git unzip software-properties-common \
    apt-transport-https ca-certificates gnupg2

# Set hostname
sudo hostnamectl set-hostname claudenest-server

# Create application user
sudo useradd -m -s /bin/bash claudenest
sudo usermod -aG sudo claudenest
```

### Step 2: Install PHP 8.3

```bash
# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP and extensions
sudo apt install -y php8.3-fpm php8.3-cli php8.3-pgsql php8.3-redis \
    php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath \
    php8.3-intl php8.3-gd php8.3-opcache

# Configure PHP-FPM
sudo sed -i 's/memory_limit = .*/memory_limit = 512M/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/max_execution_time = .*/max_execution_time = 60/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/;opcache.enable=1/opcache.enable=1/' /etc/php/8.3/fpm/php.ini

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm
```

### Step 3: Install PostgreSQL 16 + pgvector

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql-16 postgresql-contrib-16 postgresql-server-dev-16

# Install pgvector
sudo apt install -y postgresql-16-pgvector

# Configure PostgreSQL for performance
sudo tee /etc/postgresql/16/main/conf.d/performance.conf > /dev/null <<EOF
# Memory settings
shared_buffers = 8GB
effective_cache_size = 24GB
work_mem = 32MB
maintenance_work_mem = 1GB

# Connection settings
max_connections = 200

# WAL settings
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Query planner
effective_io_concurrency = 200
random_page_cost = 1.1

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
EOF

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER claudenest WITH PASSWORD 'claudenest_secure_password';
CREATE DATABASE claudenest OWNER claudenest;
\c claudenest
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
EOF

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 4: Install Redis 7

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo tee /etc/redis/redis.conf > /dev/null <<EOF
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Memory
maxmemory 4gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
EOF

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### Step 5: Install Node.js 20

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should be v20.x.x
npm -v

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 6: Install Ollama + AI Models

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull AI models (see AI-MODELS.md for details)
ollama pull mistral:7b
ollama pull nomic-embed-text  # Alternative to bge-small-en

# Verify models
ollama list
```

**Note:** First model download takes time:
- Mistral 7B: ~4.4 GB
- nomic-embed-text: ~274 MB

### Step 7: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Create ClaudeNest configuration
sudo tee /etc/nginx/sites-available/claudenest > /dev/null <<'EOF'
upstream php-fpm {
    server unix:/var/run/php/php8.3-fpm.sock;
}

upstream reverb {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    listen [::]:80;
    server_name claudenest.example.com;
    root /opt/claudenest/packages/server/public;
    index index.php;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Laravel WebSocket (Reverb)
    location /app {
        proxy_pass http://reverb;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Laravel API
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP handling
    location ~ \.php$ {
        fastcgi_pass php-fpm;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~ ^/(\.env|\.git|\.htaccess|composer\.(json|lock)) {
        deny all;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/claudenest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Deploy Application

```bash
# Create application directory
sudo mkdir -p /opt/claudenest
sudo chown claudenest:claudenest /opt/claudenest

# Clone repository (as claudenest user)
sudo -u claudenest git clone https://github.com/yourusername/claudenest.git /opt/claudenest

# Setup Server
cd /opt/claudenest/packages/server

# Install PHP dependencies
sudo -u claudenest composer install --no-dev --optimize-autoloader

# Copy and configure environment
cp .env.example .env

# Generate app key
sudo -u claudenest php artisan key:generate

# Update .env
cat > .env <<EOF
APP_NAME=ClaudeNest
APP_ENV=production
APP_KEY=$(grep APP_KEY .env | cut -d= -f2)
APP_DEBUG=false
APP_URL=https://claudenest.example.com

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=claudenest
DB_PASSWORD=claudenest_secure_password

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Reverb (WebSocket)
REVERB_APP_ID=claudenest
REVERB_APP_KEY=production_key
REVERB_APP_SECRET=production_secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=https

# Ollama
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=mistral:7b
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSIONS=768

# OAuth (configure these)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
EOF

# Run migrations
sudo -u claudenest php artisan migrate --force

# Optimize for production
sudo -u claudenest php artisan optimize
sudo -u claudenest php artisan config:cache
sudo -u claudenest php artisan route:cache
sudo -u claudenest php artisan view:cache

# Set permissions
sudo chown -R www-data:www-data /opt/claudenest/packages/server/storage
sudo chown -R www-data:www-data /opt/claudenest/packages/server/bootstrap/cache
sudo chmod -R 775 /opt/claudenest/packages/server/storage
sudo chmod -R 775 /opt/claudenest/packages/server/bootstrap/cache

# Build frontend assets
cd /opt/claudenest/packages/server
npm install
npm run build
```

---

## Service Configuration

### Create Systemd Services

```bash
# Laravel Reverb (WebSocket)
sudo tee /etc/systemd/system/claudenest-reverb.service > /dev/null <<EOF
[Unit]
Description=ClaudeNest Reverb WebSocket Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=claudenest
Group=claudenest
WorkingDirectory=/opt/claudenest/packages/server
ExecStart=/usr/bin/php artisan reverb:start --host=127.0.0.1 --port=8080
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal
SyslogIdentifier=claudenest-reverb

[Install]
WantedBy=multi-user.target
EOF

# Laravel Queue Worker
sudo tee /etc/systemd/system/claudenest-queue.service > /dev/null <<EOF
[Unit]
Description=ClaudeNest Queue Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=claudenest
Group=claudenest
WorkingDirectory=/opt/claudenest/packages/server
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal
SyslogIdentifier=claudenest-queue

[Install]
WantedBy=multi-user.target
EOF

# Laravel Scheduler
sudo tee /etc/systemd/system/claudenest-scheduler.service > /dev/null <<EOF
[Unit]
Description=ClaudeNest Scheduler
After=network.target

[Service]
Type=oneshot
User=claudenest
Group=claudenest
WorkingDirectory=/opt/claudenest/packages/server
ExecStart=/usr/bin/php artisan schedule:run
EOF

sudo tee /etc/systemd/system/claudenest-scheduler.timer > /dev/null <<EOF
[Unit]
Description=Run ClaudeNest Scheduler every minute

[Timer]
OnCalendar=*:*:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable claudenest-reverb
sudo systemctl enable claudenest-queue
sudo systemctl enable claudenest-scheduler.timer

sudo systemctl start claudenest-reverb
sudo systemctl start claudenest-queue
sudo systemctl start claudenest-scheduler.timer

# Check status
sudo systemctl status claudenest-reverb
sudo systemctl status claudenest-queue
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d claudenest.example.com --agree-tos --non-interactive --email admin@example.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Manual SSL Configuration

If you have your own certificates:

```bash
# Update Nginx config
sudo tee /etc/nginx/sites-available/claudenest > /dev/null <<EOF
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name claudenest.example.com;
    root /opt/claudenest/packages/server/public;
    index index.php;

    # SSL
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # ... rest of config same as above
}

server {
    listen 80;
    listen [::]:80;
    server_name claudenest.example.com;
    return 301 https://$server_name$request_uri;
}
EOF

sudo nginx -t
sudo systemctl restart nginx
```

---

## Monitoring

### Install Node Exporter + Prometheus (Optional)

```bash
# Install Prometheus Node Exporter
sudo apt install -y prometheus-node-exporter

# View metrics
curl http://localhost:9100/metrics
```

### Log Monitoring

```bash
# View application logs
sudo journalctl -u claudenest-reverb -f
sudo journalctl -u claudenest-queue -f

# View Nginx logs
sudo tail -f /var/log/nginx/claudenest-error.log
sudo tail -f /var/log/nginx/claudenest-access.log

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## Backup

### Automated Backup Script

```bash
sudo tee /opt/claudenest/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/claudenest"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
sudo -u postgres pg_dump claudenest > $BACKUP_DIR/db_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C /opt/claudenest/packages/server \
    --exclude=node_modules --exclude=vendor \
    storage app config .env

# Backup Redis
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Cleanup old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /opt/claudenest/scripts/backup.sh

# Add to crontab (daily at 2 AM)
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /opt/claudenest/scripts/backup.sh") | sudo crontab -
```

---

## Troubleshooting

### Common Issues

**PostgreSQL connection refused:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

**Redis connection issues:**
```bash
redis-cli ping  # Should return PONG
sudo systemctl status redis-server
```

**Ollama not responding:**
```bash
sudo systemctl status ollama
curl http://localhost:11434/api/tags
```

**Permission denied on storage:**
```bash
sudo chown -R www-data:www-data /opt/claudenest/packages/server/storage
sudo chmod -R 775 /opt/claudenest/packages/server/storage
```

**Queue not processing:**
```bash
sudo systemctl restart claudenest-queue
sudo journalctl -u claudenest-queue -f
```

---

## Updates

### Update Application

```bash
cd /opt/claudenest

# Pull latest code
sudo -u claudenest git pull origin main

# Update PHP dependencies
sudo -u claudenest composer install --no-dev --optimize-autoloader

# Update frontend
sudo -u claudenest npm install
sudo -u claudenest npm run build

# Run migrations
sudo -u claudenest php artisan migrate --force

# Clear caches
sudo -u claudenest php artisan optimize
sudo -u claudenest php artisan config:cache
sudo -u claudenest php artisan route:cache
sudo -u claudenest php artisan view:cache

# Restart services
sudo systemctl restart claudenest-reverb
sudo systemctl restart claudenest-queue
```

---

For more details on AI models configuration, see [AI-MODELS.md](AI-MODELS.md).
