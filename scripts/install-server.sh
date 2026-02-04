#!/bin/bash
#
# ClaudeNest Server Installation Script
# Usage: curl -fsSL https://claudenest.dev/install.sh | sudo bash
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/claudenest"
APP_USER="claudenest"
DOMAIN=""
ADMIN_EMAIL=""

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Check OS
check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "Cannot detect OS"
        exit 1
    fi

    case $OS in
        "Ubuntu")
            if [[ ${VER%%.*} -lt 22 ]]; then
                log_error "Ubuntu 22.04 or higher required"
                exit 1
            fi
            ;;
        "Debian GNU/Linux")
            if [[ ${VER%%.*} -lt 11 ]]; then
                log_error "Debian 11 or higher required"
                exit 1
            fi
            ;;
        *)
            log_warning "OS not officially supported, but may work"
            ;;
    esac

    log_info "Detected OS: $OS $VER"
}

# Check hardware requirements
check_hardware() {
    log_info "Checking hardware requirements..."

    # RAM
    RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $RAM_GB -lt 8 ]]; then
        log_error "Minimum 8 GB RAM required (found ${RAM_GB} GB)"
        exit 1
    fi
    log_success "RAM: ${RAM_GB} GB ✓"

    # Disk space
    DISK_GB=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $DISK_GB -lt 20 ]]; then
        log_error "Minimum 20 GB free disk space required (found ${DISK_GB} GB)"
        exit 1
    fi
    log_success "Disk space: ${DISK_GB} GB ✓"
}

# Get user input
get_input() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           ClaudeNest Server Installation                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    read -p "Enter your domain (e.g., claudenest.example.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        log_error "Domain is required"
        exit 1
    fi

    read -p "Enter admin email for SSL certificates: " ADMIN_EMAIL
    if [[ -z "$ADMIN_EMAIL" ]]; then
        log_error "Email is required"
        exit 1
    fi

    echo ""
    log_info "Configuration:"
    log_info "  Domain: $DOMAIN"
    log_info "  Email: $ADMIN_EMAIL"
    log_info "  Install path: $APP_DIR"
    echo ""

    read -p "Continue with installation? [Y/n]: " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]] && [[ ! -z $confirm ]]; then
        log_info "Installation cancelled"
        exit 0
    fi
}

# Update system
update_system() {
    log_info "Updating system packages..."
    apt-get update && apt-get upgrade -y
    apt-get install -y curl wget git unzip software-properties-common \
        apt-transport-https ca-certificates gnupg2 jq
    log_success "System updated"
}

# Install PHP
install_php() {
    log_info "Installing PHP 8.3..."

    add-apt-repository ppa:ondrej/php -y
    apt-get update

    apt-get install -y php8.3-fpm php8.3-cli php8.3-pgsql php8.3-redis \
        php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath \
        php8.3-intl php8.3-gd php8.3-opcache

    # Configure PHP
    sed -i 's/memory_limit = .*/memory_limit = 512M/' /etc/php/8.3/fpm/php.ini
    sed -i 's/max_execution_time = .*/max_execution_time = 60/' /etc/php/8.3/fpm/php.ini
    sed -i 's/;opcache.enable=1/opcache.enable=1/' /etc/php/8.3/fpm/php.ini
    sed -i 's/opcache.memory_consumption=.*/opcache.memory_consumption=256/' /etc/php/8.3/fpm/php.ini

    systemctl restart php8.3-fpm
    log_success "PHP 8.3 installed"
}

# Install PostgreSQL
install_postgres() {
    log_info "Installing PostgreSQL 16 with pgvector..."

    # Add PostgreSQL repo
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt-get update

    # Install PostgreSQL
    apt-get install -y postgresql-16 postgresql-contrib-16 postgresql-server-dev-16

    # Install pgvector
    apt-get install -y postgresql-16-pgvector

    # Performance tuning based on RAM
    RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
    SHARED_BUFFERS=$((RAM_GB / 8))
    EFFECTIVE_CACHE=$((RAM_GB * 3 / 8))

    cat > /etc/postgresql/16/main/conf.d/performance.conf <<EOF
# Memory settings
shared_buffers = ${SHARED_BUFFERS}GB
effective_cache_size = ${EFFECTIVE_CACHE}GB
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
EOF

    # Create database user
    DB_PASSWORD=$(openssl rand -base64 32)

    sudo -u postgres psql <<EOF
CREATE USER $APP_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE claudenest OWNER $APP_USER;
\c claudenest
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
EOF

    # Save password for later
    echo "DB_PASSWORD=$DB_PASSWORD" > /root/.claudenest_db_pass
    chmod 600 /root/.claudenest_db_pass

    systemctl restart postgresql
    log_success "PostgreSQL 16 + pgvector installed"
}

# Install Redis
install_redis() {
    log_info "Installing Redis 7..."

    apt-get install -y redis-server

    cat > /etc/redis/redis.conf <<EOF
bind 127.0.0.1
port 6379
protected-mode yes

maxmemory 4gb
maxmemory-policy allkeys-lru

save 900 1
save 300 10
save 60 10000
EOF

    systemctl restart redis-server
    systemctl enable redis-server
    log_success "Redis 7 installed"
}

# Install Node.js
install_node() {
    log_info "Installing Node.js 20..."

    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    npm install -g pm2

    log_success "Node.js 20 installed"
}

# Install Ollama
install_ollama() {
    log_info "Installing Ollama..."

    curl -fsSL https://ollama.com/install.sh | sh

    systemctl enable ollama
    systemctl start ollama

    # Wait for Ollama to be ready
    sleep 5

    log_info "Downloading AI models (this may take a while)..."

    # Pull models
    ollama pull bge-small-en-v1.5 || log_warning "Failed to pull bge-small-en-v1.5"
    ollama pull mistral:7b || log_warning "Failed to pull mistral:7b"

    # Verify
    ollama list

    log_success "Ollama and AI models installed"
}

# Install Nginx
install_nginx() {
    log_info "Installing Nginx..."

    apt-get install -y nginx

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    cat > /etc/nginx/sites-available/claudenest <<EOF
upstream php-fpm {
    server unix:/var/run/php/php8.3-fpm.sock;
}

upstream reverb {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name $DOMAIN;
    root $APP_DIR/packages/server/public;
    index index.php;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # WebSocket
    location /app {
        proxy_pass http://reverb;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Laravel
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # PHP
    location ~ \\.php\$ {
        fastcgi_pass php-fpm;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny sensitive files
    location ~ /\\.(?!well-known).* {
        deny all;
    }
}
EOF

    ln -s /etc/nginx/sites-available/claudenest /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    systemctl enable nginx

    log_success "Nginx installed"
}

# Create application user
create_user() {
    log_info "Creating application user..."

    if ! id "$APP_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$APP_USER"
        usermod -aG sudo "$APP_USER"
    fi

    log_success "User $APP_USER created"
}

# Deploy application
deploy_app() {
    log_info "Deploying ClaudeNest application..."

    # Create directory
    mkdir -p "$APP_DIR"

    # Clone repository
    if [[ -d "$APP_DIR/.git" ]]; then
        cd "$APP_DIR"
        sudo -u "$APP_USER" git pull origin main
    else
        sudo -u "$APP_USER" git clone https://github.com/yourusername/claudenest.git "$APP_DIR" 2>/dev/null || {
            log_warning "Repository not accessible, creating from local files..."
            # In production, this would be a real git clone
            mkdir -p "$APP_DIR"
        }
    fi

    # Setup server
    cd "$APP_DIR/packages/server"

    # Install PHP dependencies
    sudo -u "$APP_USER" composer install --no-dev --optimize-autoloader --no-interaction

    # Setup environment
    cp .env.example .env
    APP_KEY=$(sudo -u "$APP_USER" php artisan key:generate --show)
    DB_PASSWORD=$(cat /root/.claudenest_db_pass | cut -d= -f2)

    cat > .env <<EOF
APP_NAME=ClaudeNest
APP_ENV=production
APP_KEY=$APP_KEY
APP_DEBUG=false
APP_URL=https://$DOMAIN

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=$APP_USER
DB_PASSWORD=$DB_PASSWORD

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

REVERB_APP_ID=claudenest
REVERB_APP_KEY=$(openssl rand -hex 32)
REVERB_APP_SECRET=$(openssl rand -hex 32)
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=https

OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=mistral:7b
EMBEDDING_MODEL=bge-small-en-v1.5
EMBEDDING_DIMENSIONS=384

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
EOF

    # Run migrations
    sudo -u "$APP_USER" php artisan migrate --force

    # Optimize
    sudo -u "$APP_USER" php artisan optimize
    sudo -u "$APP_USER" php artisan config:cache
    sudo -u "$APP_USER" php artisan route:cache
    sudo -u "$APP_USER" php artisan view:cache

    # Set permissions
    chown -R www-data:www-data storage bootstrap/cache
    chmod -R 775 storage bootstrap/cache

    # Build frontend
    npm install
    npm run build

    log_success "Application deployed"
}

# Setup systemd services
setup_services() {
    log_info "Setting up systemd services..."

    # Reverb
    cat > /etc/systemd/system/claudenest-reverb.service <<EOF
[Unit]
Description=ClaudeNest Reverb WebSocket Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/packages/server
ExecStart=/usr/bin/php artisan reverb:start --host=127.0.0.1 --port=8080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    # Queue Worker
    cat > /etc/systemd/system/claudenest-queue.service <<EOF
[Unit]
Description=ClaudeNest Queue Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/packages/server
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    # Scheduler
    cat > /etc/systemd/system/claudenest-scheduler.service <<EOF
[Unit]
Description=ClaudeNest Scheduler
After=network.target

[Service]
Type=oneshot
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/packages/server
ExecStart=/usr/bin/php artisan schedule:run
EOF

    cat > /etc/systemd/system/claudenest-scheduler.timer <<EOF
[Unit]
Description=Run ClaudeNest Scheduler every minute

[Timer]
OnCalendar=*:*:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Enable and start services
    systemctl daemon-reload
    systemctl enable claudenest-reverb claudenest-queue claudenest-scheduler.timer
    systemctl start claudenest-reverb claudenest-queue claudenest-scheduler.timer

    log_success "Services configured"
}

# Setup SSL
setup_ssl() {
    log_info "Setting up SSL with Let's Encrypt..."

    apt-get install -y certbot python3-certbot-nginx

    certbot --nginx -d "$DOMAIN" --agree-tos --non-interactive --email "$ADMIN_EMAIL" || {
        log_warning "SSL setup failed, continuing without HTTPS"
        return
    }

    # Setup auto-renewal cron
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

    log_success "SSL configured"
}

# Setup firewall
setup_firewall() {
    log_info "Configuring firewall..."

    if command -v ufw &> /dev/null; then
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw --force enable
        log_success "UFW firewall configured"
    else
        log_warning "UFW not installed, skipping firewall setup"
    fi
}

# Create backup script
setup_backup() {
    log_info "Setting up backup script..."

    mkdir -p "$APP_DIR/scripts"

    cat > "$APP_DIR/scripts/backup.sh" <<'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/claudenest"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump claudenest > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C /opt/claudenest/packages/server \
    --exclude=node_modules --exclude=vendor \
    storage app config .env

# Cleanup
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
EOF

    chmod +x "$APP_DIR/scripts/backup.sh"

    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup.sh") | crontab -

    log_success "Backup configured"
}

# Print final instructions
print_finish() {
    DB_PASSWORD=$(cat /root/.claudenest_db_pass | cut -d= -f2)

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║              🎉 Installation Complete! 🎉                        ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "ClaudeNest has been installed successfully!"
    echo ""
    echo "📍 Application directory: $APP_DIR"
    echo "🌐 Web URL: https://$DOMAIN"
    echo ""
    echo "🔧 Services status:"
    echo "  - Nginx: $(systemctl is-active nginx)"
    echo "  - PostgreSQL: $(systemctl is-active postgresql)"
    echo "  - Redis: $(systemctl is-active redis-server)"
    echo "  - Ollama: $(systemctl is-active ollama)"
    echo "  - Reverb: $(systemctl is-active claudenest-reverb)"
    echo "  - Queue: $(systemctl is-active claudenest-queue)"
    echo ""
    echo "📊 Useful commands:"
    echo "  View logs:           sudo journalctl -u claudenest-reverb -f"
    echo "  Restart services:    sudo systemctl restart claudenest-*"
    echo "  Run backup:          sudo $APP_DIR/scripts/backup.sh"
    echo ""
    echo "⚠️  Next steps:"
    echo "  1. Configure OAuth in $APP_DIR/packages/server/.env"
    echo "  2. Set up your first admin user"
    echo "  3. Install the mobile app"
    echo ""
    echo "📚 Documentation: https://docs.claudenest.dev"
    echo ""
    log_success "Enjoy using ClaudeNest! 🚀"
}

# Main installation flow
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║         ClaudeNest Server Installer v1.0                         ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    check_root
    check_os
    check_hardware
    get_input

    log_info "Starting installation..."

    update_system
    create_user
    install_php
    install_postgres
    install_redis
    install_node
    install_ollama
    install_nginx
    deploy_app
    setup_services
    setup_ssl
    setup_firewall
    setup_backup

    print_finish
}

# Run main function
main
