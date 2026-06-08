<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ t('docDocsCookbookDocker.title') }}</h1>
      <p class="lead">
        {{ t('docDocsCookbookDocker.lead') }}
      </p>
    </header>

    <section id="prerequisites">
      <h2>{{ t('docDocsCookbookDocker.prerequisitesHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookDocker.prerequisitesIntro') }}
      </p>
      <div class="prereq-grid">
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Docker 24+</strong>
            <span>{{ t('docDocsCookbookDocker.prereqDockerDesc') }}</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Docker Compose v2</strong>
            <span>{{ t('docDocsCookbookDocker.prereqComposeDesc') }}</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>{{ t('docDocsCookbookDocker.prereqRamTitle') }}</strong>
            <span>{{ t('docDocsCookbookDocker.prereqRamDesc') }}</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>{{ t('docDocsCookbookDocker.prereqDiskTitle') }}</strong>
            <span>{{ t('docDocsCookbookDocker.prereqDiskDesc') }}</span>
          </div>
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>{{ t('docDocsCookbookDocker.tipVerifyDockerTitle') }}</strong>
          <p>{{ t('docDocsCookbookDocker.tipVerifyDockerBody1') }} <code>docker --version</code> {{ t('docDocsCookbookDocker.tipVerifyDockerBody2') }} <code>docker compose version</code> {{ t('docDocsCookbookDocker.tipVerifyDockerBody3') }}</p>
        </div>
      </div>

      <CodeBlock
        code="# Check Docker
docker --version
# Docker version 24.0.7, build afdd53b

# Check Docker Compose
docker compose version
# Docker Compose version v2.24.0"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="docker-compose">
      <h2>{{ t('docDocsCookbookDocker.composeHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookDocker.composeIntro1') }} <code>docker-compose.yml</code> {{ t('docDocsCookbookDocker.composeIntro2') }}
      </p>

      <CodeBlock
        :code="dockerComposeCode"
        language="yaml"
        filename="docker-compose.yml"
      />

      <h3>{{ t('docDocsCookbookDocker.servicesHeading') }}</h3>
      <ul>
        <li><strong>postgres</strong> -- {{ t('docDocsCookbookDocker.servicePostgres') }}</li>
        <li><strong>redis</strong> -- {{ t('docDocsCookbookDocker.serviceRedis') }}</li>
        <li><strong>app</strong> -- {{ t('docDocsCookbookDocker.serviceApp') }}</li>
        <li><strong>reverb</strong> -- {{ t('docDocsCookbookDocker.serviceReverb') }}</li>
        <li><strong>queue</strong> -- {{ t('docDocsCookbookDocker.serviceQueue') }}</li>
        <li><strong>ollama</strong> -- {{ t('docDocsCookbookDocker.serviceOllama') }}</li>
      </ul>
    </section>

    <section id="configuration">
      <h2>{{ t('docDocsCookbookDocker.envHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookDocker.envIntro') }}
      </p>

      <CodeBlock
        code="cp .env.example .env"
        language="bash"
        filename="Terminal"
      />

      <p>
        {{ t('docDocsCookbookDocker.envOpen1') }} <code>.env</code> {{ t('docDocsCookbookDocker.envOpen2') }}
      </p>

      <CodeBlock
        :code="envCode"
        language="bash"
        filename=".env"
      />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>{{ t('docDocsCookbookDocker.tipAppKeyTitle') }}</strong>
          <p>{{ t('docDocsCookbookDocker.tipAppKeyBody1') }} <code>docker compose exec app php artisan key:generate</code> {{ t('docDocsCookbookDocker.tipAppKeyBody2') }}</p>
        </div>
      </div>
    </section>

    <section id="running">
      <h2>{{ t('docDocsCookbookDocker.runningHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookDocker.runningIntro') }}
      </p>

      <CodeBlock
        :code="runCode"
        language="bash"
        filename="Terminal"
      />

      <h3>{{ t('docDocsCookbookDocker.verifyHeading') }}</h3>
      <p>
        {{ t('docDocsCookbookDocker.verifyIntro') }}
      </p>

      <CodeTabs
        :tabs="[
          {
            label: t('docDocsCookbookDocker.tabHealthCheck'),
            language: 'bash',
            code: healthCheckCode,
            filename: 'Terminal'
          },
          {
            label: t('docDocsCookbookDocker.tabContainerStatus'),
            language: 'bash',
            code: containerStatusCode,
            filename: 'Terminal'
          },
          {
            label: t('docDocsCookbookDocker.tabViewLogs'),
            language: 'bash',
            code: logsCode,
            filename: 'Terminal'
          }
        ]"
      />

      <h3>{{ t('docDocsCookbookDocker.stoppingHeading') }}</h3>
      <CodeBlock
        code="# Stop all services (preserve volumes)
docker compose down

# Stop and remove volumes (full reset)
docker compose down -v

# Restart a single service
docker compose restart app"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="troubleshooting">
      <h2>{{ t('docDocsCookbookDocker.troubleshootingHeading') }}</h2>

      <h3>{{ t('docDocsCookbookDocker.tsPostgresHeading') }}</h3>
      <p>
        {{ t('docDocsCookbookDocker.tsPostgresBody') }}
      </p>
      <CodeBlock
        code="# Check for port conflicts
sudo lsof -i :5432

# If another Postgres is running, stop it or change the host port mapping
# in docker-compose.yml to e.g. '5433:5432'"
        language="bash"
        filename="Terminal"
      />

      <h3>{{ t('docDocsCookbookDocker.tsPgvectorHeading') }}</h3>
      <p>
        {{ t('docDocsCookbookDocker.tsPgvectorBody1') }} <code>pgvector/pgvector:pg16</code> {{ t('docDocsCookbookDocker.tsPgvectorBody2') }}
      </p>
      <CodeBlock
        code="docker compose exec postgres psql -U claudenest -d claudenest \
  -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
        language="bash"
        filename="Terminal"
      />

      <h3>{{ t('docDocsCookbookDocker.tsReverbHeading') }}</h3>
      <p>
        {{ t('docDocsCookbookDocker.tsReverbBody1') }} <code>REVERB_SERVER_HOST</code> {{ t('docDocsCookbookDocker.tsReverbBody2') }} <code>0.0.0.0</code> {{ t('docDocsCookbookDocker.tsReverbBody3') }} <code>VITE_REVERB_HOST</code> {{ t('docDocsCookbookDocker.tsReverbBody4') }}
      </p>
      <CodeBlock
        :code="reverbDebugCode"
        language="bash"
        filename="Terminal"
      />

      <h3>{{ t('docDocsCookbookDocker.tsPermissionHeading') }}</h3>
      <CodeBlock
        code="docker compose exec app chmod -R 775 storage bootstrap/cache
docker compose exec app chown -R www-data:www-data storage bootstrap/cache"
        language="bash"
        filename="Terminal"
      />

      <h3>{{ t('docDocsCookbookDocker.tsRebuildHeading') }}</h3>
      <CodeBlock
        code="# Rebuild images and restart
docker compose up -d --build

# Clear Laravel caches
docker compose exec app php artisan optimize:clear"
        language="bash"
        filename="Terminal"
      />
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const { t } = useI18n();

const dockerComposeCode = ref(`version: "3.8"

services:
  postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_DB: claudenest
      POSTGRES_USER: claudenest
      POSTGRES_PASSWORD: \${DB_PASSWORD:-secret}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U claudenest"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
    env_file: .env
    volumes:
      - ./storage:/var/www/html/storage
    ports:
      - "8000:8000"

  reverb:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - redis
    command: php artisan reverb:start --host=0.0.0.0 --port=8080
    env_file: .env
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
    ports:
      - "8080:8080"

  queue:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: php artisan queue:work --sleep=3 --tries=3 --max-time=3600
    env_file: .env
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis

  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    volumes:
      - ollamadata:/root/.ollama
    ports:
      - "11434:11434"
    profiles:
      - ai

volumes:
  pgdata:
  redisdata:
  ollamadata:`);

const envCode = ref(`# Application
APP_NAME=ClaudeNest
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://claudenest.yourdomain.com

# Database (matches docker-compose service name)
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=claudenest
DB_PASSWORD=secure-password-here

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# Broadcasting (Reverb)
BROADCAST_DRIVER=reverb
REVERB_APP_ID=claudenest
REVERB_APP_KEY=your-reverb-key
REVERB_APP_SECRET=your-reverb-secret
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

# Frontend WebSocket (host reachable from browser)
VITE_REVERB_HOST=claudenest.yourdomain.com
VITE_REVERB_PORT=8080

# Queue & Cache
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# AI Models (optional -- enable 'ai' profile)
OLLAMA_HOST=http://ollama:11434
OLLAMA_EMBEDDING_MODEL=bge-small-en-v1.5
OLLAMA_SUMMARIZATION_MODEL=mistral:7b`);

const runCode = ref(`# Clone the repository
git clone https://github.com/yourusername/claudenest.git
cd claudenest/packages/server

# Copy and edit environment
cp .env.example .env
nano .env

# Build and start all services
docker compose up -d

# Generate application key
docker compose exec app php artisan key:generate

# Run database migrations
docker compose exec app php artisan migrate --force

# (Optional) Create the first admin user
docker compose exec app php artisan user:create --admin

# (Optional) Start Ollama for RAG
docker compose --profile ai up -d ollama
docker compose exec ollama ollama pull bge-small-en-v1.5
docker compose exec ollama ollama pull mistral:7b`);

const healthCheckCode = ref(`# Server API health check
curl -s http://localhost:8000/api/health | jq .
# {
#   "status": "ok",
#   "services": {
#     "database": "connected",
#     "redis": "connected",
#     "reverb": "running"
#   }
# }

# WebSocket health
curl -s http://localhost:8080/`);

const containerStatusCode = ref(`docker compose ps

# NAME         STATUS          PORTS
# app          Up (healthy)    0.0.0.0:8000->8000/tcp
# postgres     Up (healthy)    0.0.0.0:5432->5432/tcp
# redis        Up (healthy)    0.0.0.0:6379->6379/tcp
# reverb       Up              0.0.0.0:8080->8080/tcp
# queue        Up`);

const logsCode = ref(`# Follow all service logs
docker compose logs -f

# Follow a specific service
docker compose logs -f app

# Last 100 lines of the queue worker
docker compose logs --tail=100 queue`);

const reverbDebugCode = ref(`# Verify Reverb is listening
docker compose exec reverb ss -tlnp | grep 8080

# Test WebSocket from the host
curl -i -N \\
  -H "Connection: Upgrade" \\
  -H "Upgrade: websocket" \\
  -H "Sec-WebSocket-Version: 13" \\
  -H "Sec-WebSocket-Key: dGVzdA==" \\
  http://localhost:8080/app/your-reverb-key`);
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
