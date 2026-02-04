# 🐳 Docker Deployment Guide

Deploy ClaudeNest using Docker Compose. Recommended for development and small-scale production.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Production Setup](#production-setup)
3. [Docker Compose Configuration](#docker-compose-configuration)
4. [Environment Variables](#environment-variables)
5. [SSL/HTTPS](#sslhttps)
6. [Updates](#updates)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Docker 24.0+
- Docker Compose 2.20+
- 8 GB RAM minimum (16 GB recommended)
- 50 GB disk space

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/claudenest.git
cd claudenest
```

### 2. Configure Environment

```bash
cp .env.example .env

# Edit .env with your settings
nano .env
```

Required changes:
```bash
APP_URL=https://your-domain.com
APP_KEY=base64:your-random-key-here

# Database (will be created by Docker)
DB_PASSWORD=secure-password-here

# OAuth credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

### 3. Start Services

```bash
# Production
docker-compose -f docker-compose.prod.yml up -d

# Or development
docker-compose up -d
```

### 4. Initialize Application

```bash
# Run migrations
docker-compose exec server php artisan migrate --force

# Generate app key
docker-compose exec server php artisan key:generate

# Create admin user (optional)
docker-compose exec server php artisan tinker
>>> User::create(['email' => 'admin@example.com', 'name' => 'Admin'])
```

### 5. Access Application

- Web: http://localhost (or your domain)
- API: http://localhost/api
- WebSocket: ws://localhost:8080

---

## Production Setup

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: claudenest-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - ./packages/server/public:/var/www/html/public:ro
    depends_on:
      - server
      - reverb
    networks:
      - claudenest
    restart: unless-stopped

  # Laravel Application
  server:
    build:
      context: ./packages/server
      dockerfile: ../../docker/Dockerfile.server
    container_name: claudenest-server
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_URL=${APP_URL}
      - DB_CONNECTION=pgsql
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=claudenest
      - DB_USERNAME=claudenest
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REVERB_HOST=0.0.0.0
      - REVERB_PORT=8080
      - OLLAMA_HOST=http://ollama:11434
    volumes:
      - ./packages/server:/var/www/html
      - server-storage:/var/www/html/storage
      - server-cache:/var/www/html/bootstrap/cache
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ollama:
        condition: service_started
    networks:
      - claudenest
    restart: unless-stopped

  # Queue Worker
  queue:
    build:
      context: ./packages/server
      dockerfile: ../../docker/Dockerfile.server
    container_name: claudenest-queue
    command: php artisan queue:work --sleep=3 --tries=3
    environment:
      - APP_ENV=production
      - DB_CONNECTION=pgsql
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./packages/server:/var/www/html
      - server-storage:/var/www/html/storage
    depends_on:
      - postgres
      - redis
    networks:
      - claudenest
    restart: unless-stopped

  # Scheduler
  scheduler:
    build:
      context: ./packages/server
      dockerfile: ../../docker/Dockerfile.server
    container_name: claudenest-scheduler
    command: >
      sh -c "while true; do
        php artisan schedule:run;
        sleep 60;
      done"
    environment:
      - APP_ENV=production
      - DB_CONNECTION=pgsql
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./packages/server:/var/www/html
      - server-storage:/var/www/html/storage
    depends_on:
      - postgres
      - redis
    networks:
      - claudenest
    restart: unless-stopped

  # Reverb WebSocket Server
  reverb:
    build:
      context: ./packages/server
      dockerfile: ../../docker/Dockerfile.server
    container_name: claudenest-reverb
    command: php artisan reverb:start --host=0.0.0.0 --port=8080
    environment:
      - APP_ENV=production
      - DB_CONNECTION=pgsql
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - REVERB_HOST=0.0.0.0
      - REVERB_PORT=8080
    ports:
      - "8080:8080"
    volumes:
      - ./packages/server:/var/www/html
      - server-storage:/var/www/html/storage
    depends_on:
      - postgres
      - redis
    networks:
      - claudenest
    restart: unless-stopped

  # PostgreSQL with pgvector
  postgres:
    image: ankane/pgvector:latest
    container_name: claudenest-postgres
    environment:
      POSTGRES_USER: claudenest
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: claudenest
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U claudenest"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - claudenest
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    container_name: claudenest-redis
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - claudenest
    restart: unless-stopped

  # Ollama (AI Models)
  ollama:
    image: ollama/ollama:latest
    container_name: claudenest-ollama
    volumes:
      - ollama-data:/root/.ollama
    ports:
      - "127.0.0.1:11434:11434"
    environment:
      - OLLAMA_NUM_THREADS=4
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
    networks:
      - claudenest
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
  ollama-data:
  server-storage:
  server-cache:

networks:
  claudenest:
    driver: bridge
```

### Dockerfile for Server

```dockerfile
# docker/Dockerfile.server
FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    nodejs \
    npm \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies and build
RUN npm install && npm run build

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage \
    && chown -R www-data:www-data /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Expose port
EXPOSE 9000

CMD ["php-fpm"]
```

### Nginx Configuration

```nginx
# docker/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    upstream php-fpm {
        server server:9000;
    }

    upstream reverb {
        server reverb:8080;
    }

    server {
        listen 80;
        server_name _;
        root /var/www/html/public;
        index index.php;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # WebSocket (Reverb)
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

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            try_files $uri $uri/ /index.php?$query_string;
        }

        # Login rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            try_files $uri $uri/ /index.php?$query_string;
        }

        # Laravel
        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        # PHP
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

        location ~ ^/(\.env|\.git) {
            deny all;
        }

        # Static file caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_URL` | Your domain | `https://claudenest.example.com` |
| `APP_KEY` | Laravel app key | `base64:xxxxx` |
| `DB_PASSWORD` | PostgreSQL password | `secure-password` |

### OAuth (Optional)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret |

### AI Models

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_MODEL` | `mistral:7b` | LLM for summarization |
| `EMBEDDING_MODEL` | `bge-small-en-v1.5` | Model for embeddings |

---

## SSL/HTTPS

### Using Let's Encrypt

```bash
# Install Certbot
docker run -it --rm \
  -v "$(pwd)/docker/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/docker/nginx/www:/var/www/certbot" \
  certbot/certbot certonly \
  --standalone \
  -d your-domain.com

# Update nginx.conf to use SSL certificates
# Then restart
docker-compose restart nginx
```

### Auto-renewal

```bash
# Add to crontab
0 12 * * * docker run -it --rm \
  -v "/path/to/ssl:/etc/letsencrypt" \
  certbot/certbot renew --quiet && \
  docker-compose restart nginx
```

---

## Updates

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose -f docker-compose.prod.yml build --no-cache

# Run migrations
docker-compose -f docker-compose.prod.yml exec server php artisan migrate --force

# Clear caches
docker-compose -f docker-compose.prod.yml exec server php artisan optimize

# Restart
docker-compose -f docker-compose.prod.yml restart
```

### Update AI Models

```bash
# Pull latest model versions
docker-compose exec ollama ollama pull mistral:7b
docker-compose exec ollama ollama pull bge-small-en-v1.5
```

---

## Troubleshooting

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f postgres
docker-compose logs -f ollama
```

### Common Issues

**Permission denied:**
```bash
docker-compose exec server chown -R www-data:www-data storage bootstrap/cache
```

**Database connection failed:**
```bash
# Check if postgres is healthy
docker-compose ps

# Check logs
docker-compose logs postgres
```

**Out of memory:**
```bash
# Increase Docker memory limit
# Or reduce OLLAMA_NUM_THREADS
docker-compose exec ollama sh -c 'export OLLAMA_NUM_THREADS=2'
```

---

## Performance Tuning

### For High Traffic

```yaml
# Scale PHP-FPM workers
# In docker-compose.prod.yml, add to server service:
deploy:
  replicas: 2
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

### Database Optimization

```bash
# Run inside postgres container
docker-compose exec postgres psql -U claudenest -d claudenest

# Create indexes
CREATE INDEX CONCURRENTLY idx_context_chunks_project_id ON context_chunks(project_id);
```

---

## Backup

### Automated Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U claudenest claudenest > $BACKUP_DIR/db_$DATE.sql

# Backup Redis
docker-compose exec -T redis redis-cli BGSAVE
docker cp claudenest-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup uploads
docker cp claudenest-server:/var/www/html/storage/app $BACKUP_DIR/storage_$DATE

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh
```

---

For more details, see:
- [AI Models Configuration](AI-MODELS.md)
- [Bare-Metal Deployment](DEPLOYMENT-BAREMETAL.md)
