<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Bare Metal Installation</h1>
      <p class="lead">
        Install ClaudeNest directly on a server for maximum control and performance.
        This guide targets Ubuntu 22.04+ with production-ready configuration.
      </p>
    </header>

    <section id="requirements">
      <h2>System Requirements</h2>
      <div class="prereq-grid">
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Ubuntu 22.04+ / Debian 12+</strong>
            <span>64-bit server edition</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>PHP 8.3+</strong>
            <span>With required extensions</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>PostgreSQL 16+</strong>
            <span>With pgvector extension</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Redis 7+</strong>
            <span>Cache, queues, broadcasting</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Node.js 20 LTS</strong>
            <span>Frontend build tooling</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Nginx</strong>
            <span>Reverse proxy with WebSocket support</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Composer 2</strong>
            <span>PHP package manager</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>2 vCPU / 4 GB RAM</strong>
            <span>Minimum recommended hardware</span>
          </div>
        </div>
      </div>
    </section>

    <section id="install-dependencies">
      <h2>Install Dependencies</h2>
      <p>
        Add required repositories and install all system packages in one go.
      </p>

      <CodeTabs
        :tabs="[
          {
            label: 'Ubuntu 22.04',
            language: 'bash',
            code: ubuntuDepsCode,
            filename: 'Terminal'
          },
          {
            label: 'Debian 12',
            language: 'bash',
            code: debianDepsCode,
            filename: 'Terminal'
          }
        ]"
      />

      <h3>Install Composer</h3>
      <CodeBlock
        :code="composerInstallCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Install Node.js 20</h3>
      <CodeBlock
        code="curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="setup-database">
      <h2>Set Up the Database</h2>
      <p>
        Create the PostgreSQL database, user, and install the pgvector extension for RAG embeddings.
      </p>

      <CodeBlock
        :code="dbSetupCode"
        language="bash"
        filename="Terminal"
      />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>pgvector installation</strong>
          <p>On Ubuntu 22.04+, pgvector is available via <code>apt install postgresql-16-pgvector</code>. On older systems you may need to compile from source.</p>
        </div>
      </div>
    </section>

    <section id="configure-server">
      <h2>Configure the Server</h2>
      <p>
        Clone the repository, install dependencies, and configure the Laravel application.
      </p>

      <CodeBlock
        :code="serverSetupCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Environment file</h3>
      <p>
        Edit <code>/opt/claudenest/packages/server/.env</code> with your production values.
      </p>

      <CodeBlock
        :code="envCode"
        language="bash"
        filename=".env"
      />

      <h3>Run migrations and optimize</h3>
      <CodeBlock
        :code="migrateCode"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="systemd-services">
      <h2>Systemd Services</h2>
      <p>
        Create systemd unit files so that the application server, WebSocket relay, and queue worker
        start automatically on boot and restart on failure.
      </p>

      <CodeTabs
        :tabs="[
          {
            label: 'App Server',
            language: 'bash',
            code: systemdAppCode,
            filename: '/etc/systemd/system/claudenest.service'
          },
          {
            label: 'Reverb WebSocket',
            language: 'bash',
            code: systemdReverbCode,
            filename: '/etc/systemd/system/claudenest-reverb.service'
          },
          {
            label: 'Queue Worker',
            language: 'bash',
            code: systemdQueueCode,
            filename: '/etc/systemd/system/claudenest-queue.service'
          }
        ]"
      />

      <h3>Enable and start services</h3>
      <CodeBlock
        :code="systemdEnableCode"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="nginx">
      <h2>Nginx Reverse Proxy</h2>
      <p>
        Configure Nginx to serve the application over HTTPS, proxy WebSocket connections
        to Reverb, and handle static assets.
      </p>

      <CodeBlock
        :code="nginxCode"
        language="bash"
        filename="/etc/nginx/sites-available/claudenest"
      />

      <h3>Enable the site</h3>
      <CodeBlock
        code="sudo ln -s /etc/nginx/sites-available/claudenest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx"
        language="bash"
        filename="Terminal"
      />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>SSL with Certbot</strong>
          <p>Install Certbot and obtain a free Let's Encrypt certificate: <code>sudo certbot --nginx -d claudenest.yourdomain.com</code></p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const ubuntuDepsCode = ref(`# Add PHP 8.3 PPA
sudo add-apt-repository ppa:ondrej/php -y
sudo apt-get update

# Install PHP 8.3 and extensions
sudo apt-get install -y \\
  php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring \\
  php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath \\
  php8.3-intl php8.3-readline php8.3-redis

# Install PostgreSQL 16 with pgvector
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \\
  > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-16 postgresql-16-pgvector

# Install Redis 7
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx`);

const debianDepsCode = ref(`# Add PHP 8.3 repository (Sury)
sudo apt-get install -y lsb-release ca-certificates apt-transport-https software-properties-common
sudo wget -qO /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | \\
  sudo tee /etc/apt/sources.list.d/sury-php.list
sudo apt-get update

# Install PHP 8.3 and extensions
sudo apt-get install -y \\
  php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring \\
  php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath \\
  php8.3-intl php8.3-readline php8.3-redis

# Install PostgreSQL 16 with pgvector
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \\
  > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-16 postgresql-16-pgvector

# Install Redis 7 and Nginx
sudo apt-get install -y redis-server nginx`);

const composerInstallCode = ref(`php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"
composer --version`);

const dbSetupCode = ref(`# Start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql <<SQL
CREATE USER claudenest WITH PASSWORD 'your-secure-password';
CREATE DATABASE claudenest OWNER claudenest;
GRANT ALL PRIVILEGES ON DATABASE claudenest TO claudenest;
\\c claudenest
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SQL

# Verify pgvector is installed
sudo -u postgres psql -d claudenest -c "SELECT extversion FROM pg_extension WHERE extname = 'vector';"
# Should return: 0.7.0 (or similar)`);

const serverSetupCode = ref(`# Clone the repository
sudo mkdir -p /opt/claudenest
sudo chown $USER:$USER /opt/claudenest
git clone https://github.com/yourusername/claudenest.git /opt/claudenest
cd /opt/claudenest/packages/server

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Install Node dependencies and build frontend
npm ci
npm run build

# Set permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Copy and configure environment
cp .env.example .env
php artisan key:generate`);

const envCode = ref(`APP_NAME=ClaudeNest
APP_ENV=production
APP_DEBUG=false
APP_URL=https://claudenest.yourdomain.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=claudenest
DB_PASSWORD=your-secure-password

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

BROADCAST_DRIVER=reverb
REVERB_APP_ID=claudenest
REVERB_APP_KEY=your-reverb-key
REVERB_APP_SECRET=your-reverb-secret
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

OLLAMA_HOST=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=bge-small-en-v1.5
OLLAMA_SUMMARIZATION_MODEL=mistral:7b`);

const migrateCode = ref(`cd /opt/claudenest/packages/server

# Run migrations
php artisan migrate --force

# Cache configuration for performance
php artisan optimize
php artisan view:cache
php artisan route:cache
php artisan config:cache

# Create the first admin user
php artisan user:create --admin`);

const systemdAppCode = ref(`[Unit]
Description=ClaudeNest Application Server
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/claudenest/packages/server
ExecStart=/usr/bin/php artisan serve --host=127.0.0.1 --port=8000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target`);

const systemdReverbCode = ref(`[Unit]
Description=ClaudeNest Reverb WebSocket Server
After=network.target redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/claudenest/packages/server
ExecStart=/usr/bin/php artisan reverb:start --host=0.0.0.0 --port=8080
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target`);

const systemdQueueCode = ref(`[Unit]
Description=ClaudeNest Queue Worker
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/claudenest/packages/server
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target`);

const systemdEnableCode = ref(`# Reload systemd daemon
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable claudenest
sudo systemctl enable claudenest-reverb
sudo systemctl enable claudenest-queue

# Start all services
sudo systemctl start claudenest
sudo systemctl start claudenest-reverb
sudo systemctl start claudenest-queue

# Verify status
sudo systemctl status claudenest
sudo systemctl status claudenest-reverb
sudo systemctl status claudenest-queue`);

const nginxCode = ref(`server {
    listen 80;
    server_name claudenest.yourdomain.com;
    root /opt/claudenest/packages/server/public;
    index index.php;

    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # WebSocket proxy for Laravel Reverb
    location /app {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # PHP-FPM
    location ~ \\.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    # Static assets with caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Laravel routing
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Deny access to hidden files
    location ~ /\\. {
        deny all;
    }
}`);
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* Prerequisites Grid */
.prereq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

.prereq-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
}

.prereq-item .check {
  width: 28px;
  height: 28px;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.prereq-item div {
  display: flex;
  flex-direction: column;
}

.prereq-item strong {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.prereq-item span {
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Tip Box */
.tip {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
  border-radius: 10px;
  margin: 1.5rem 0;
}

.tip-icon {
  width: 24px;
  height: 24px;
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
  color: var(--accent-cyan, #22d3ee);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.tip strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.tip p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .prereq-grid {
    grid-template-columns: 1fr;
  }
}
</style>
