<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Installation</h1>
      <p class="lead">
        Set up ClaudeNest server and agent. Choose between Docker Compose for easy setup 
        or bare-metal installation for production environments.
      </p>
    </header>

    <section id="prerequisites">
      <h2>Prerequisites</h2>
      <div class="prereq-grid">
        <div class="prereq-item">
          <span class="check">✓</span>
          <div>
            <strong>Node.js 20+</strong>
            <span>Required for the agent</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">✓</span>
          <div>
            <strong>PHP 8.3+</strong>
            <span>Required for the server</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">✓</span>
          <div>
            <strong>PostgreSQL 15+</strong>
            <span>With pgvector extension</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">✓</span>
          <div>
            <strong>Redis 7+</strong>
            <span>For caching and queues</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">✓</span>
          <div>
            <strong>Docker & Docker Compose</strong>
            <span>For containerized setup</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">✓</span>
          <div>
            <strong>Composer</strong>
            <span>PHP package manager</span>
          </div>
        </div>
      </div>
    </section>

    <section id="server-installation">
      <h2>Server Installation</h2>
      
      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'docker' }"
          @click="activeTab = 'docker'"
        >
          Docker Compose
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'baremetal' }"
          @click="activeTab = 'baremetal'"
        >
          Bare-Metal
        </button>
      </div>

      <!-- Docker Installation -->
      <div v-if="activeTab === 'docker'" class="tab-content">
        <h3>Quick Start with Docker</h3>
        <p>The easiest way to get started is using Docker Compose:</p>
        
        <CodeBlock 
          code="# Clone the repository
git clone https://github.com/yourusername/claudenest.git
cd claudenest/packages/server

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec app php artisan migrate

# Create admin user
docker-compose exec app php artisan user:create --admin" 
          language="bash"
          filename="Terminal"
        />

        <h3>Docker Services</h3>
        <p>The Docker Compose setup includes:</p>
        <ul>
          <li><strong>app</strong> - Laravel application server</li>
          <li><strong>web</strong> - Nginx reverse proxy</li>
          <li><strong>postgres</strong> - PostgreSQL database with pgvector</li>
          <li><strong>redis</strong> - Redis cache and queue</li>
          <li><strong>reverb</strong> - Laravel Reverb WebSocket server</li>
          <li><strong>ollama</strong> - Ollama for local AI models (optional)</li>
        </ul>

        <h3>Environment Variables</h3>
        <p>Key configuration options in your <code>.env</code> file:</p>
        
        <CodeBlock 
          :code="envConfigCode" 
          language="bash"
          filename=".env"
        />
      </div>

      <!-- Bare-Metal Installation -->
      <div v-if="activeTab === 'baremetal'" class="tab-content">
        <h3>Production Installation</h3>
        <p>For production environments with dedicated resources, use the automated installer:</p>
        
        <CodeBlock 
          code="# Download and run the installer
curl -fsSL https://claudenest.dev/install.sh | bash

# Or manual installation
cd /opt
sudo git clone https://github.com/yourusername/claudenest.git
sudo chown -R $USER:$USER claudenest
cd claudenest/packages/server

# Run the installation script
./scripts/install-server.sh

# Follow the interactive prompts to configure:
# - Database credentials
# - Redis configuration
# - WebSocket settings
# - SSL certificates" 
          language="bash"
          filename="Terminal"
        />

        <h3>Manual Setup Steps</h3>
        <p>If you prefer to set up manually:</p>
        
        <CodeBlock 
          code="# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Install Node dependencies
npm ci
npm run build

# Set up environment
cp .env.example .env
php artisan key:generate

# Configure database (PostgreSQL with pgvector)
sudo -u postgres psql -c 'CREATE DATABASE claudenest;'
sudo -u postgres psql -c 'CREATE USER claudenest WITH PASSWORD &#39;secure-password&#39;;'
sudo -u postgres psql -c 'GRANT ALL PRIVILEGES ON DATABASE claudenest TO claudenest;'
sudo -u postgres psql -d claudenest -c 'CREATE EXTENSION IF NOT EXISTS vector;'

# Run migrations
php artisan migrate --force

# Set up queues and scheduling
php artisan queue:table
php artisan migrate

# Configure systemd services
sudo cp deploy/claudenest.service /etc/systemd/system/
sudo systemctl enable claudenest
sudo systemctl start claudenest

# Set up Nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/claudenest
sudo ln -s /etc/nginx/sites-available/claudenest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx" 
          language="bash"
          filename="Terminal"
        />
      </div>
    </section>

    <section id="agent-installation">
      <h2>Agent Installation</h2>
      <p>
        The agent runs on your local machines and connects to the ClaudeNest server. 
        Install it on any machine where you want to run Claude Code.
      </p>

      <CodeBlock 
        code="# Install via npm
npm install -g @claudenest/agent

# Or install from source
git clone https://github.com/yourusername/claudenest.git
cd claudenest/packages/agent
npm install
npm run build
npm link

# Configure the agent
claudenest-agent configure
# Enter your server URL and machine token

# Start the agent
claudenest-agent start

# Or run as a service
claudenest-agent install-service
claudenest-agent start-service" 
        language="bash"
        filename="Terminal"
      />

      <h3>Agent Configuration</h3>
      <p>The agent configuration file is located at <code>~/.claudenest/config.json</code>:</p>
      
      <CodeBlock 
        code='{
  "server": {
    "url": "wss://claudenest.yourdomain.com",
    "token": "your-machine-token"
  },
  "machine": {
    "name": "MacBook-Pro",
    "maxSessions": 10,
    "capabilities": [
      "claude_code",
      "git",
      "docker"
    ]
  },
  "claude": {
    "path": "/usr/local/bin/claude",
    "defaultFlags": ["--dangerously-skip-permissions"]
  },
  "logging": {
    "level": "info",
    "file": "~/.claudenest/agent.log"
  }
}' 
        language="json"
        filename="~/.claudenest/config.json"
      />
    </section>

    <section id="verifying">
      <h2>Verifying Installation</h2>
      
      <h3>Check Server Health</h3>
      <CodeBlock 
        code="curl https://claudenest.yourdomain.com/api/health" 
        language="bash"
      />

      <h3>Check Agent Connection</h3>
      <CodeBlock 
        code="# View agent logs
claudenest-agent logs

# Check agent status
claudenest-agent status

# Test connection to server
claudenest-agent ping" 
        language="bash"
      />

      <h3>Access the Dashboard</h3>
      <p>Open your browser and navigate to your server URL:</p>
      <CodeBlock 
        code="https://claudenest.yourdomain.com" 
        language="bash"
      />
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps-grid">
        <router-link to="/docs/authentication" class="next-step-card">
          <span class="step-icon">🔐</span>
          <h3>Configure Authentication</h3>
          <p>Set up OAuth providers and user accounts</p>
        </router-link>
        
        <router-link to="/docs/quickstart" class="next-step-card">
          <span class="step-icon">🚀</span>
          <h3>Quickstart Guide</h3>
          <p>Create your first session and API call</p>
        </router-link>
        
        <router-link to="/docs/api/authentication" class="next-step-card">
          <span class="step-icon">📚</span>
          <h3>API Reference</h3>
          <p>Explore the complete API documentation</p>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const activeTab = ref('docker');

const envConfigCode = `# Application
APP_NAME=ClaudeNest
APP_URL=https://claudenest.yourdomain.com
APP_KEY=your-app-key-here

# Database
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=claudenest
DB_PASSWORD=secure-password

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# WebSocket (Reverb)
REVERB_APP_ID=claudenest
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=claudenest.yourdomain.com
REVERB_PORT=8080

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# AI Models (Optional - for RAG)
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=mistral
OLLAMA_EMBEDDING_MODEL=nomic-embed-text`;
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, #a855f7, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: #a9b1d6;
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
  color: #ffffff;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: #ffffff;
}

p {
  color: #a9b1d6;
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul {
  color: #a9b1d6;
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Prerequisites Grid */
.prereq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.prereq-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #ffffff;
  font-size: 0.95rem;
}

.prereq-item span {
  color: #64748b;
  font-size: 0.8rem;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: #a9b1d6;
}

.tab-btn.active {
  color: #a855f7;
  border-bottom-color: #a855f7;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Next Steps */
.next-steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.next-step-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
}

.next-step-card:hover {
  background: rgba(168, 85, 247, 0.05);
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateY(-2px);
}

.step-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.next-step-card h3 {
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
  color: #ffffff;
}

.next-step-card p {
  font-size: 0.9rem;
  margin: 0;
  color: #64748b;
}

.next-step-card:hover p {
  color: #a9b1d6;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #22d3ee;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
  
  .tabs {
    overflow-x: auto;
  }
  
  .tab-btn {
    white-space: nowrap;
  }
}
</style>
