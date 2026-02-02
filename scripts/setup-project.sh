#!/bin/bash

# ClaudeNest Project Setup Script
# Usage: ./scripts/setup-project.sh

set -e

echo "🚀 ClaudeNest - Project Setup"
echo "=============================="

# Colors
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${CYAN}Checking prerequisites...${NC}"

commands=("node" "npm" "docker" "docker-compose" "git")
for cmd in "${commands[@]}"; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${YELLOW}⚠️  $cmd is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ $cmd found${NC}"
done

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠️  Node.js 20+ required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Setup monorepo
echo -e "\n${CYAN}Setting up monorepo...${NC}"
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "claudenest",
  "version": "1.0.0",
  "description": "Remote Claude Code Orchestration Platform",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF
    echo -e "${GREEN}✓ Created root package.json${NC}"
fi

# Setup Turbo
echo -e "\n${CYAN}Setting up Turbo...${NC}"
if [ ! -f "turbo.json" ]; then
    cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "typecheck": {}
  }
}
EOF
    echo -e "${GREEN}✓ Created turbo.json${NC}"
fi

# Setup Docker Compose
echo -e "\n${CYAN}Setting up Docker...${NC}"
mkdir -p docker
if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL with pgvector
  postgres:
    image: ankane/pgvector:latest
    container_name: claudenest-postgres
    environment:
      POSTGRES_USER: claudenest
      POSTGRES_PASSWORD: claudenest
      POSTGRES_DB: claudenest
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U claudenest"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: claudenest-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Ollama (for RAG)
  ollama:
    image: ollama/ollama:latest
    container_name: claudenest-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  postgres_data:
  redis_data:
  ollama_data:
EOF
    echo -e "${GREEN}✓ Created docker-compose.yml${NC}"
fi

# Create directory structure
echo -e "\n${CYAN}Creating directory structure...${NC}"

mkdir -p packages/server/{app/{Http/{Controllers/{Api,Web},Middleware,Requests},Models,Services,Events,Broadcasting},config,database/migrations,resources/js/{components,pages,stores,composables,utils,types},routes,tests}
mkdir -p packages/agent/src/{websocket,sessions,handlers,discovery,context,types,utils}
mkdir -p packages/mobile/src/{screens/{auth,machines,sessions,multiagent,config,settings},components/{common,machines,sessions,multiagent},navigation,stores,services,theme,utils}
mkdir -p docs
mkdir -p branding/{logos,favicons,social,banners}
mkdir -p .github/workflows

echo -e "${GREEN}✓ Directory structure created${NC}"

# Copy branding assets
echo -e "\n${CYAN}Copying branding assets...${NC}"
if [ -d "/home/rony/Téléchargements/claudenest/Branding/claudenest-branding" ]; then
    cp -r /home/rony/Téléchargements/claudenest/Branding/claudenest-branding/* branding/ 2>/dev/null || true
    echo -e "${GREEN}✓ Branding assets copied${NC}"
else
    echo -e "${YELLOW}⚠️  Branding assets not found - copy manually from /home/rony/Téléchargements/claudenest/Branding/${NC}"
fi

# Create .env.example
echo -e "\n${CYAN}Creating environment files...${NC}"
if [ ! -f ".env.example" ]; then
    cat > .env.example << 'EOF'
# Application
APP_NAME=ClaudeNest
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=claudenest
DB_PASSWORD=claudenest

# Redis
REDIS_HOST=localhost
REDIS_PASSWORD=null
REDIS_PORT=6379

# WebSocket (Reverb)
REVERB_APP_ID=claudenest
REVERB_APP_KEY=local
REVERB_APP_SECRET=secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI Services (Ollama)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral:7b

# Embeddings
EMBEDDING_MODEL=bge-small-en
EMBEDDING_DIMENSIONS=384
EOF
    echo -e "${GREEN}✓ Created .env.example${NC}"
fi

# Create CLAUDE.md
echo -e "\n${CYAN}Creating CLAUDE.md...${NC}"
if [ ! -f "CLAUDE.md" ]; then
    cat > CLAUDE.md << 'EOF'
# ClaudeNest - Contexte pour Claude Code

## Vue d'Ensemble
ClaudeNest est une plateforme complète d'orchestration à distance des instances Claude Code.

## Architecture
- **Server**: Laravel 11 + Vue.js 3 + PostgreSQL + Reverb
- **Agent**: Node.js + TypeScript + node-pty
- **Mobile**: React Native + Zustand

## Fonctionnalité Clé: Multi-Agent avec RAG
- Plusieurs Claude instances partagent un contexte via le serveur
- RAG avec pgvector pour la recherche sémantique
- Auto-summarization avec Mistral 7B
- File locking pour éviter les conflits
- Task coordination via MCP tools

## Couleurs (NE PAS MODIFIER)
- Primary Purple: #a855f7
- Indigo: #6366f1
- Cyan: #22d3ee
- Background: #1a1b26
- Surface: #24283b

## Commandes Utiles
- `npm run dev` - Démarrer tous les serveurs
- `docker-compose up -d` - Démarrer les services
- `php artisan migrate` - Migrations DB

## Documentation
Voir `/docs/ORCHESTRATION-CLAUDENEST.md` pour le plan complet.
EOF
    echo -e "${GREEN}✓ Created CLAUDE.md${NC}"
fi

echo -e "\n${GREEN}==============================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "\n${CYAN}Next steps:${NC}"
echo "1. cp .env.example .env"
echo "2. docker-compose up -d"
echo "3. cd packages/server && composer install"
echo "4. npm install"
echo "5. npm run dev"
echo -e "\n${PURPLE}Happy coding! 🚀${NC}"
