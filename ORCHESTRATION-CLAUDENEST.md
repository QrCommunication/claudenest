# 🎯 CLAUDENEST - PLAN D'ORCHESTRATION COMPLÈTE

> **Mode Swarm Architecture** | Multi-Équipes Sénior | Delivery Ultra-Détaillé  
> *Version: 1.0.0* | *Date: Février 2026*

---

## 📊 TABLE DES MATIÈRES

1. [Vue d'Ensemble du Projet](#1-vue-densemble)
2. [Structure d'Équipe (Mode Swarm)](#2-structure-déquipe)
3. [Architecture Technique](#3-architecture-technique)
4. [Règles & Standards](#4-règles--standards)
5. [Backlog Détaillé par Sprint](#5-backlog-détaillé)
6. [Intégration des Assets de Branding](#6-intégration-branding)
7. [Checklist de Validation](#7-checklist-validation)

---

## 1. VUE D'ENSEMBLE

### 1.1 Mission

**ClaudeNest** est une plateforme complète d'orchestration à distance des instances Claude Code, composée de 3 packages interconnectés :

| Package | Technologie | Rôle |
|---------|-------------|------|
| `@claude-remote/server` | Laravel 11 + Vue.js 3 + xterm.js | Hub central, WebSocket relay, dashboard web |
| `@claude-remote/agent` | Node.js + TypeScript + node-pty | Daemon local, gestion des processus Claude |
| `@claude-remote/mobile` | React Native + Zustand | App iOS/Android pour contrôle mobile |

### 1.2 Stack Technologique Global

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STACK TECHNOLOGIQUE CLAUDENEST                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BACKEND (Server)                                                            │
│  ─────────────────                                                           │
│  • Laravel 11 (PHP 8.3+)           • Laravel Reverb (WebSocket)             │
│  • PostgreSQL 16 + pgvector        • Redis 7 (cache/queues)                 │
│  • Ollama (Mistral 7B)             • bge-small-en (embeddings)              │
│                                                                              │
│  FRONTEND WEB (Dashboard)                                                    │
│  ─────────────────────────                                                   │
│  • Vue.js 3 (Composition API)      • Pinia (state management)               │
│  • xterm.js + WebGL renderer       • Tailwind CSS                           │
│  • Laravel Echo                    • Vite                                   │
│                                                                              │
│  AGENT (Local Machine)                                                       │
│  ─────────────────────                                                       │
│  • Node.js 20 LTS                  • TypeScript 5.x                         │
│  • node-pty (PTY management)       • ws (WebSocket client)                  │
│  • keytar (secure storage)         • pino (logging)                         │
│                                                                              │
│  MOBILE (iOS/Android)                                                        │
│  ────────────────────                                                        │
│  • React Native 0.73+              • Zustand (state)                        │
│  • TanStack Query                  • Socket.io client                       │
│  • React Navigation 6              • Reanimated 3                           │
│                                                                              │
│  INFRASTRUCTURE                                                              │
│  ──────────────                                                              │
│  • Docker + Docker Compose         • Nginx (reverse proxy)                  │
│  • Cloudflare (CDN/DDoS)           • EM-A410X-SSD (64GB RAM)                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Architecture Multi-Agent (Fonctionnalité Clé)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT ORCHESTRATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │  Claude 1   │     │  Claude 2   │     │  Claude N   │                   │
│   │  (Auth)     │     │  (API)      │     │  (Tests)    │                   │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│          │                   │                   │                           │
│          └───────────────────┼───────────────────┘                           │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    CLAUDENEST SERVER (RAG Engine)                    │   │
│   │                                                                      │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │   Context    │  │    Tasks     │  │   File Locks │               │   │
│   │  │   Store      │  │   Manager    │  │   Registry   │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   │                                                                      │   │
│   │  ┌──────────────────────────────────────────────────────────────┐   │   │
│   │  │  RAG Pipeline: Embed → Search → Rerank → Assemble → Deliver  │   │   │
│   │  │  • bge-small-en (384d vectors)                              │   │   │
│   │  │  • pgvector (cosine similarity)                             │   │   │
│   │  │  • Mistral 7B (auto-summarization)                          │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      MCP TOOLS (Available to All)                    │   │
│   │                                                                      │   │
│   │  context_get()  context_query()  context_update()  tasks_list()     │   │
│   │  task_claim()   task_complete()  file_lock()       file_unlock()    │   │
│   │  broadcast()    get_changes()    get_instances()                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. STRUCTURE D'ÉQUIPE (MODE SWARM)

### 2.1 Organigramme d'Équipe

```
                         ┌─────────────────────┐
                         │   🎯 ARCHITECTE     │
                         │     TECHNIQUE       │
                         │   (Decision Maker)  │
                         └──────────┬──────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  👑 LEAD BACKEND │    │ 👑 LEAD FRONTEND │    │  👑 LEAD MOBILE  │
│    (Laravel)     │    │   (Vue.js/Web)   │    │ (React Native)   │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
    ┌────┴────┐             ┌────┴────┐             ┌────┴────┐
    │         │             │         │             │         │
    ▼         ▼             ▼         ▼             ▼         ▼
┌───────┐ ┌───────┐     ┌───────┐ ┌───────┐     ┌───────┐ ┌───────┐
│Dev 1  │ │Dev 2  │     │Dev 3  │ │Dev 4  │     │Dev 5  │ │Dev 6  │
│API    │ │WS     │     │UI     │ │Term   │     │iOS    │ │Android│
└───────┘ └───────┘     └───────┘ └───────┘     └───────┘ └───────┘

         ┌─────────────────────────────────────────────────┐
         │              ÉQUIPES TRANSVERSES                 │
         ├─────────────────────────────────────────────────┤
         │                                                 │
         │  🐳 DEVOPS (2 pers.)    🔍 QA (2 pers.)        │
         │  • Docker/K8s           • E2E Testing          │
         │  • CI/CD                • Performance          │
         │  • Monitoring           • Security             │
         │                                                 │
         │  🎨 UI/UX (2 pers.)     📝 TECH WRITER (1)     │
         │  • Design System        • Documentation        │
         │  • Prototyping          • API Docs             │
         │  • Accessibility                             │
         │                                                 │
         └─────────────────────────────────────────────────┘
```

### 2.2 Rôles et Responsabilités

#### 🎯 ARCHITECTE TECHNIQUE (1 personne)
**Responsabilités:**
- Architecture globale et cohérence technique
- Review et validation des PRs critiques
- Décisions sur les trade-offs techniques
- Interface avec les stakeholders
- Gestion des dépendances inter-équipes

**Livrables:**
- Architecture Decision Records (ADRs)
- Diagrammes d'architecture actualisés
- Guidelines techniques cross-équipes
- Plan de migration et évolution

---

#### 👑 LEAD BACKEND - Laravel (1 personne)
**Responsabilités:**
- Architecture du serveur Laravel
- WebSocket (Reverb) implementation
- API design et documentation
- Intégration RAG (pgvector, Ollama)
- Performance et scalabilité backend

**Livrables:**
- Structure de base de données
- Endpoints API documentés
- WebSocket protocol specification
- Tests d'intégration backend

**Équipe:**
- **Dev 1 - API Specialist:** REST API, OAuth, CRUD operations
- **Dev 2 - WebSocket Specialist:** Reverb, real-time events, broadcasting

---

#### 👑 LEAD FRONTEND - Vue.js (1 personne)
**Responsabilités:**
- Architecture Vue.js 3 (Composition API)
- Intégration xterm.js (terminal web)
- State management (Pinia)
- Design system et composants réutilisables
- Performance frontend

**Livrables:**
- Component library
- Terminal integration (xterm.js)
- Dashboard layouts
- Frontend tests (Vitest)

**Équipe:**
- **Dev 3 - UI Components:** Design system, forms, tables, charts
- **Dev 4 - Terminal Specialist:** xterm.js, WebGL, terminal features

---

#### 👑 LEAD MOBILE - React Native (1 personne)
**Responsabilités:**
- Architecture React Native
- Navigation et state management
- Push notifications (FCM/APNs)
- QR code scanning
- Offline support

**Livrables:**
- iOS app (App Store ready)
- Android app (Play Store ready)
- Shared components
- Mobile-specific tests

**Équipe:**
- **Dev 5 - iOS Specialist:** iOS-specific features, Swift bridges if needed
- **Dev 6 - Android Specialist:** Android-specific features, Kotlin bridges if needed

---

#### 🔧 AGENT DEVELOPER (1 personne - spécialisé)
**Responsabilités:**
- Node.js daemon architecture
- PTY management (node-pty)
- Process Claude Code management
- Skills/MCP discovery
- Context sync client

**Livrables:**
- Agent CLI tool
- WebSocket client implementation
- PTY handler
- Discovery services

---

#### 🐳 DEVOPS TEAM (2 personnes)
**Responsabilités:**
- Infrastructure as Code
- Docker/Docker Compose setup
- CI/CD pipelines
- Monitoring et alerting
- Security hardening

**Livrables:**
- Docker configurations
- GitHub Actions workflows
- Terraform/Pulumi configs
- Monitoring dashboards

---

#### 🔍 QA TEAM (2 personnes)
**Responsabilités:**
- Test strategy
- E2E testing (Playwright/Cypress)
- Performance testing
- Security testing
- Mobile testing

**Livrables:**
- Test plans
- Automated test suites
- Performance benchmarks
- Security audit reports

---

#### 🎨 UI/UX TEAM (2 personnes)
**Responsabilités:**
- User research et personas
- Wireframes et prototypes
- Design system (Figma)
- Accessibility compliance
- Animations et micro-interactions

**Livrables:**
- Figma designs
- Design tokens
- Prototypes interactifs
- Accessibility audit

---

## 3. ARCHITECTURE TECHNIQUE DÉTAILLÉE

### 3.1 Structure du Monorepo

```
claudenest/
├── 📁 packages/
│   ├── 📁 server/                          # @claude-remote/server
│   │   ├── 📁 app/
│   │   │   ├── 📁 Console/Commands/
│   │   │   ├── 📁 Events/
│   │   │   ├── 📁 Http/
│   │   │   │   ├── 📁 Controllers/
│   │   │   │   │   ├── 📁 Api/
│   │   │   │   │   │   ├── AuthController.php
│   │   │   │   │   │   ├── MachineController.php
│   │   │   │   │   │   ├── SessionController.php
│   │   │   │   │   │   ├── ProjectController.php
│   │   │   │   │   │   ├── ContextController.php
│   │   │   │   │   │   ├── TaskController.php
│   │   │   │   │   │   ├── SkillsController.php
│   │   │   │   │   │   ├── MCPController.php
│   │   │   │   │   │   └── FileLockController.php
│   │   │   │   │   └── 📁 Web/
│   │   │   │   │       ├── DashboardController.php
│   │   │   │   │       └── TerminalController.php
│   │   │   │   ├── 📁 Middleware/
│   │   │   │   │   ├── Authenticate.php
│   │   │   │   │   ├── EnsureMachineOwner.php
│   │   │   │   │   └── RateLimitApi.php
│   │   │   │   └── 📁 Requests/
│   │   │   ├── 📁 Models/
│   │   │   │   ├── User.php
│   │   │   │   ├── Machine.php
│   │   │   │   ├── Session.php
│   │   │   │   ├── SharedProject.php
│   │   │   │   ├── ContextChunk.php
│   │   │   │   ├── SharedTask.php
│   │   │   │   ├── ClaudeInstance.php
│   │   │   │   ├── FileLock.php
│   │   │   │   ├── ActivityLog.php
│   │   │   │   └── PersonalAccessToken.php
│   │   │   ├── 📁 Services/
│   │   │   │   ├── ContextRAGService.php
│   │   │   │   ├── EmbeddingService.php
│   │   │   │   ├── SummarizationService.php
│   │   │   │   ├── AgentMessageService.php
│   │   │   │   └── WebSocketRelayService.php
│   │   │   └── 📁 Broadcasting/
│   │   ├── 📁 config/
│   │   ├── 📁 database/
│   │   │   └── 📁 migrations/
│   │   ├── 📁 resources/
│   │   │   ├── 📁 js/
│   │   │   │   ├── 📁 components/
│   │   │   │   │   ├── 📁 common/
│   │   │   │   │   │   ├── Button.vue
│   │   │   │   │   │   ├── Card.vue
│   │   │   │   │   │   ├── Badge.vue
│   │   │   │   │   │   ├── Modal.vue
│   │   │   │   │   │   └── Toast.vue
│   │   │   │   │   ├── 📁 machines/
│   │   │   │   │   │   ├── MachineCard.vue
│   │   │   │   │   │   ├── MachineList.vue
│   │   │   │   │   │   └── MachineStatus.vue
│   │   │   │   │   ├── 📁 sessions/
│   │   │   │   │   │   ├── SessionList.vue
│   │   │   │   │   │   ├── Terminal.vue
│   │   │   │   │   │   └── OutputStream.vue
│   │   │   │   │   ├── 📁 multiagent/
│   │   │   │   │   │   ├── InstanceCard.vue
│   │   │   │   │   │   ├── TaskBoard.vue
│   │   │   │   │   │   ├── ContextViewer.vue
│   │   │   │   │   │   ├── FileLockMap.vue
│   │   │   │   │   │   └── MultiTerminalGrid.vue
│   │   │   │   │   └── 📁 config/
│   │   │   │   │       ├── SkillsBrowser.vue
│   │   │   │   │       ├── MCPServerList.vue
│   │   │   │   │       └── CommandsList.vue
│   │   │   │   ├── 📁 pages/
│   │   │   │   │   ├── Dashboard.vue
│   │   │   │   │   ├── MachineDetail.vue
│   │   │   │   │   ├── TerminalView.vue
│   │   │   │   │   ├── MultiAgentProject.vue
│   │   │   │   │   ├── Settings.vue
│   │   │   │   │   └── Login.vue
│   │   │   │   ├── 📁 stores/
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── machines.ts
│   │   │   │   │   ├── sessions.ts
│   │   │   │   │   ├── projects.ts
│   │   │   │   │   └── terminal.ts
│   │   │   │   ├── 📁 composables/
│   │   │   │   │   ├── useWebSocket.ts
│   │   │   │   │   ├── useTerminal.ts
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   └── useRAG.ts
│   │   │   │   ├── 📁 utils/
│   │   │   │   ├── 📁 types/
│   │   │   │   └── app.ts
│   │   │   └── 📁 css/
│   │   ├── 📁 routes/
│   │   ├── 📁 tests/
│   │   └── composer.json
│   │
│   ├── 📁 agent/                           # @claude-remote/agent
│   │   ├── 📁 src/
│   │   │   ├── index.ts
│   │   │   ├── cli.ts
│   │   │   ├── 📁 websocket/
│   │   │   │   ├── client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── reconnect.ts
│   │   │   │   └── protocol.ts
│   │   │   ├── 📁 sessions/
│   │   │   │   ├── manager.ts
│   │   │   │   ├── claude-process.ts
│   │   │   │   ├── pty-handler.ts
│   │   │   │   └── output-buffer.ts
│   │   │   ├── 📁 handlers/
│   │   │   │   ├── session-handler.ts
│   │   │   │   ├── config-handler.ts
│   │   │   │   └── terminal-handler.ts
│   │   │   ├── 📁 discovery/
│   │   │   │   ├── index.ts
│   │   │   │   ├── skills.ts
│   │   │   │   ├── mcp.ts
│   │   │   │   ├── commands.ts
│   │   │   │   └── projects.ts
│   │   │   ├── 📁 context/
│   │   │   │   ├── client.ts
│   │   │   │   ├── cache.ts
│   │   │   │   ├── subscriber.ts
│   │   │   │   ├── mcp-tools.ts
│   │   │   │   └── sync.ts
│   │   │   ├── 📁 types/
│   │   │   └── 📁 utils/
│   │   └── package.json
│   │
│   └── 📁 mobile/                          # @claude-remote/mobile
│       ├── 📁 src/
│       │   ├── App.tsx
│       │   ├── 📁 screens/
│       │   │   ├── 📁 auth/
│       │   │   │   ├── LoginScreen.tsx
│       │   │   │   ├── OAuthCallback.tsx
│       │   │   │   └── OnboardingScreen.tsx
│       │   │   ├── 📁 machines/
│       │   │   │   ├── MachinesListScreen.tsx
│       │   │   │   ├── MachineDetailScreen.tsx
│       │   │   │   └── PairMachineScreen.tsx
│       │   │   ├── 📁 sessions/
│       │   │   │   ├── SessionsListScreen.tsx
│       │   │   │   ├── SessionScreen.tsx
│       │   │   │   └── NewSessionScreen.tsx
│       │   │   ├── 📁 multiagent/
│       │   │   │   ├── ProjectScreen.tsx
│       │   │   │   ├── TasksScreen.tsx
│       │   │   │   ├── ContextScreen.tsx
│       │   │   │   └── LocksScreen.tsx
│       │   │   ├── 📁 config/
│       │   │   │   ├── SkillsScreen.tsx
│       │   │   │   ├── MCPServersScreen.tsx
│       │   │   │   └── CommandsScreen.tsx
│       │   │   └── 📁 settings/
│       │   ├── 📁 components/
│       │   │   ├── 📁 common/
│       │   │   ├── 📁 machines/
│       │   │   ├── 📁 sessions/
│       │   │   └── 📁 multiagent/
│       │   ├── 📁 navigation/
│       │   ├── 📁 stores/
│       │   ├── 📁 services/
│       │   ├── 📁 theme/
│       │   └── 📁 utils/
│       ├── ios/
│       └── android/
│
├── 📁 docs/
│   ├── PRD-SERVER.md
│   ├── PRD-AGENT.md
│   ├── PRD-MOBILE.md
│   └── API-SPECIFICATION.md
│
├── 📁 branding/                            # ASSETS FOURNIS (OBLIGATOIRE)
│   ├── logos/
│   │   ├── claudenest-logo-dark.svg
│   │   ├── claudenest-logo-light.svg
│   │   └── claudenest-icon.svg
│   ├── favicons/
│   │   └── favicon.svg
│   ├── social/
│   │   ├── og-image.svg
│   │   ├── twitter-card.svg
│   │   ├── github-social-preview.svg
│   │   └── app-store-feature.svg
│   ├── banners/
│   │   └── readme-banner.svg
│   └── BRAND-GUIDELINES.md
│
├── 📁 docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── 📁 images/
│
├── 📁 .github/
│   └── 📁 workflows/
│
├── package.json
├── turbo.json
└── README.md
```

### 3.2 Schéma de Base de Données Complet

```sql
-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar_url VARCHAR(512),
    google_id VARCHAR(255) UNIQUE,
    github_id VARCHAR(255) UNIQUE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MACHINES
-- =====================================================
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('darwin', 'win32', 'linux')),
    hostname VARCHAR(255),
    arch VARCHAR(50),
    node_version VARCHAR(50),
    agent_version VARCHAR(50),
    claude_version VARCHAR(50),
    claude_path VARCHAR(512),
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'connecting')),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE,
    capabilities JSONB DEFAULT '{}',
    max_sessions INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

CREATE INDEX idx_machines_user_id ON machines(user_id);
CREATE INDEX idx_machines_status ON machines(status);

-- =====================================================
-- SESSIONS
-- =====================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(50) NOT NULL DEFAULT 'interactive' 
        CHECK (mode IN ('interactive', 'headless', 'oneshot')),
    project_path VARCHAR(512),
    initial_prompt TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'created'
        CHECK (status IN ('created', 'starting', 'running', 'waiting_input', 'completed', 'error', 'terminated')),
    pid INTEGER,
    exit_code INTEGER,
    pty_size JSONB DEFAULT '{"cols": 120, "rows": 40}',
    total_tokens INTEGER,
    total_cost DECIMAL(10, 4),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_machine_id ON sessions(machine_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- =====================================================
-- SESSION LOGS (OUTPUT HISTORY)
-- =====================================================
CREATE TABLE session_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('output', 'input', 'status', 'error')),
    data TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_logs_session_id ON session_logs(session_id);
CREATE INDEX idx_session_logs_created_at ON session_logs(created_at);

-- =====================================================
-- SHARED PROJECTS (MULTI-AGENT)
-- =====================================================
CREATE TABLE shared_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    project_path VARCHAR(1024) NOT NULL,
    
    -- Structured Context
    summary TEXT DEFAULT '',
    architecture TEXT DEFAULT '',
    conventions TEXT DEFAULT '',
    current_focus TEXT DEFAULT '',
    recent_changes TEXT DEFAULT '',
    
    -- Token Management
    total_tokens INTEGER DEFAULT 0,
    max_tokens INTEGER DEFAULT 8000,
    
    -- Settings
    settings JSONB DEFAULT '{
        "maxContextTokens": 8000,
        "summarizeThreshold": 0.8,
        "contextRetentionDays": 30,
        "taskTimeoutMinutes": 60,
        "lockTimeoutMinutes": 30,
        "broadcastLevel": "all"
    }',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(machine_id, project_path)
);

CREATE INDEX idx_shared_projects_user_id ON shared_projects(user_id);
CREATE INDEX idx_shared_projects_machine_id ON shared_projects(machine_id);

-- =====================================================
-- CONTEXT CHUNKS (RAG - VECTOR SEARCH)
-- =====================================================
CREATE TABLE context_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL 
        CHECK (type IN ('task_completion', 'context_update', 'file_change', 'decision', 'summary', 'broadcast')),
    
    -- Vector Embedding (384 dimensions for bge-small-en)
    embedding vector(384),
    
    -- Metadata
    instance_id VARCHAR(255),
    task_id UUID,
    files TEXT[],
    importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Vector index for fast similarity search
CREATE INDEX idx_context_chunks_embedding ON context_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_context_chunks_project_id ON context_chunks(project_id);
CREATE INDEX idx_context_chunks_created_at ON context_chunks(created_at);
CREATE INDEX idx_context_chunks_type ON context_chunks(type);

-- =====================================================
-- SHARED TASKS
-- =====================================================
CREATE TABLE shared_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
    
    -- Task Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'blocked', 'review', 'done')),
    
    -- Assignment
    assigned_to VARCHAR(255),
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Dependencies
    dependencies UUID[],
    blocked_by TEXT,
    
    -- Scope
    files TEXT[],
    estimated_tokens INTEGER,
    
    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_summary TEXT,
    files_modified TEXT[],
    
    -- Metadata
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shared_tasks_project_id ON shared_tasks(project_id);
CREATE INDEX idx_shared_tasks_status ON shared_tasks(status);
CREATE INDEX idx_shared_tasks_assigned_to ON shared_tasks(assigned_to);

-- =====================================================
-- CLAUDE INSTANCES
-- =====================================================
CREATE TABLE claude_instances (
    id VARCHAR(255) PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    
    -- State
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'idle', 'busy', 'disconnected')),
    current_task_id UUID REFERENCES shared_tasks(id) ON DELETE SET NULL,
    
    -- Context Usage
    context_tokens INTEGER DEFAULT 0,
    max_context_tokens INTEGER DEFAULT 8000,
    
    -- Tracking
    tasks_completed INTEGER DEFAULT 0,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_claude_instances_project_id ON claude_instances(project_id);
CREATE INDEX idx_claude_instances_status ON claude_instances(status);

-- =====================================================
-- FILE LOCKS
-- =====================================================
CREATE TABLE file_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
    
    path VARCHAR(1024) NOT NULL,
    locked_by VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    UNIQUE(project_id, path)
);

CREATE INDEX idx_file_locks_project_id ON file_locks(project_id);
CREATE INDEX idx_file_locks_expires_at ON file_locks(expires_at);

-- =====================================================
-- ACTIVITY LOG
-- =====================================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
    
    instance_id VARCHAR(255),
    type VARCHAR(50) NOT NULL 
        CHECK (type IN ('task_claimed', 'task_completed', 'context_updated', 'file_locked', 'file_unlocked', 'broadcast', 'conflict', 'instance_connected', 'instance_disconnected')),
    details JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX idx_activity_log_type ON activity_log(type);

-- =====================================================
-- PERSONAL ACCESS TOKENS
-- =====================================================
CREATE TABLE personal_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    abilities JSONB DEFAULT '["*"]',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_personal_access_tokens_user_id ON personal_access_tokens(user_id);
CREATE INDEX idx_personal_access_tokens_token_hash ON personal_access_tokens(token_hash);

-- =====================================================
-- PUSH NOTIFICATION TOKENS (MOBILE)
-- =====================================================
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
    device_info JSONB DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- =====================================================
-- CLEANUP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired file locks
    DELETE FROM file_locks WHERE expires_at < NOW();
    
    -- Delete expired context chunks
    DELETE FROM context_chunks WHERE expires_at < NOW();
    
    -- Delete old activity logs (30 days)
    DELETE FROM activity_log WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old session logs (90 days)
    DELETE FROM session_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

*La suite du document continue avec les sections 4, 5, 6 et 7...*
#### 4.1.3 API Response Standards

```typescript
// Standard Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    pagination?: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
    timestamp: string;
    request_id: string;
  };
}

// HTTP Status Codes Usage
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

// Error Codes
const ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  
  // Machine
  MACHINE_NOT_FOUND: 'MCH_001',
  MACHINE_OFFLINE: 'MCH_002',
  MACHINE_UNAUTHORIZED: 'MCH_003',
  
  // Session
  SESSION_NOT_FOUND: 'SES_001',
  SESSION_CREATION_FAILED: 'SES_002',
  SESSION_TERMINATION_FAILED: 'SES_003',
  
  // Context
  CONTEXT_NOT_FOUND: 'CTX_001',
  CONTEXT_UPDATE_FAILED: 'CTX_002',
  
  // Task
  TASK_NOT_FOUND: 'TSK_001',
  TASK_ALREADY_CLAIMED: 'TSK_002',
  TASK_INVALID_STATUS: 'TSK_003',
  
  // File Lock
  FILE_ALREADY_LOCKED: 'LCK_001',
  FILE_LOCK_EXPIRED: 'LCK_002',
  
  // Validation
  VALIDATION_ERROR: 'VAL_001',
  
  // Rate Limit
  RATE_LIMIT_EXCEEDED: 'RAT_001',
} as const;
```

#### 4.1.4 Laravel Route Organization

```php
<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes require authentication via Sanctum
*/

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    
    // ==================== AUTH ====================
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/tokens', [AuthController::class, 'createToken']);
        Route::delete('/tokens/{id}', [AuthController::class, 'revokeToken']);
    });
    
    // ==================== MACHINES ====================
    Route::apiResource('machines', MachineController::class);
    Route::post('machines/{machine}/wake', [MachineController::class, 'wake']);
    Route::get('machines/{machine}/environment', [MachineController::class, 'environment']);
    
    // ==================== SESSIONS ====================
    Route::get('machines/{machine}/sessions', [SessionController::class, 'index']);
    Route::post('machines/{machine}/sessions', [SessionController::class, 'store']);
    Route::get('sessions/{session}', [SessionController::class, 'show']);
    Route::delete('sessions/{session}', [SessionController::class, 'destroy']);
    Route::get('sessions/{session}/logs', [SessionController::class, 'logs']);
    Route::post('sessions/{session}/attach', [SessionController::class, 'attach']);
    
    // ==================== SHARED PROJECTS (MULTI-AGENT) ====================
    Route::get('machines/{machine}/projects', [ProjectController::class, 'index']);
    Route::post('machines/{machine}/projects', [ProjectController::class, 'store']);
    Route::get('projects/{project}', [ProjectController::class, 'show']);
    Route::patch('projects/{project}', [ProjectController::class, 'update']);
    Route::delete('projects/{project}', [ProjectController::class, 'destroy']);
    
    // ==================== CONTEXT (RAG) ====================
    Route::get('projects/{project}/context', [ContextController::class, 'show']);
    Route::post('projects/{project}/context', [ContextController::class, 'query']);
    Route::patch('projects/{project}/context', [ContextController::class, 'update']);
    Route::get('projects/{project}/context/chunks', [ContextController::class, 'chunks']);
    Route::post('projects/{project}/context/summarize', [ContextController::class, 'summarize']);
    
    // ==================== TASKS ====================
    Route::get('projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('projects/{project}/tasks', [TaskController::class, 'store']);
    Route::get('tasks/{task}', [TaskController::class, 'show']);
    Route::patch('tasks/{task}', [TaskController::class, 'update']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
    Route::post('tasks/{task}/claim', [TaskController::class, 'claim']);
    Route::post('tasks/{task}/release', [TaskController::class, 'release']);
    Route::post('tasks/{task}/complete', [TaskController::class, 'complete']);
    
    // ==================== FILE LOCKS ====================
    Route::get('projects/{project}/locks', [FileLockController::class, 'index']);
    Route::post('projects/{project}/locks', [FileLockController::class, 'store']);
    Route::delete('projects/{project}/locks/{path}', [FileLockController::class, 'destroy'])
        ->where('path', '.*');
    Route::delete('projects/{project}/locks/{path}/force', [FileLockController::class, 'forceDestroy'])
        ->where('path', '.*');
    
    // ==================== INSTANCES & ACTIVITY ====================
    Route::get('projects/{project}/instances', [ProjectController::class, 'instances']);
    Route::get('projects/{project}/activity', [ProjectController::class, 'activity']);
    Route::post('projects/{project}/broadcast', [ProjectController::class, 'broadcast']);
    
    // ==================== SKILLS ====================
    Route::get('machines/{machine}/skills', [SkillsController::class, 'index']);
    Route::get('machines/{machine}/skills/{path}', [SkillsController::class, 'show'])
        ->where('path', '.*');
    Route::post('machines/{machine}/skills', [SkillsController::class, 'store']);
    Route::delete('machines/{machine}/skills/{path}', [SkillsController::class, 'destroy'])
        ->where('path', '.*');
    
    // ==================== MCP SERVERS ====================
    Route::get('machines/{machine}/mcp', [MCPController::class, 'index']);
    Route::post('machines/{machine}/mcp/{name}/start', [MCPController::class, 'start']);
    Route::post('machines/{machine}/mcp/{name}/stop', [MCPController::class, 'stop']);
    Route::get('machines/{machine}/mcp/{name}/tools', [MCPController::class, 'tools']);
    
    // ==================== COMMANDS ====================
    Route::get('machines/{machine}/commands', [CommandsController::class, 'index']);
});

// Public routes
Route::post('/auth/magic-link', [AuthController::class, 'sendMagicLink']);
Route::get('/auth/magic-link/verify', [AuthController::class, 'verifyMagicLink']);
```

---

### 4.2 RÈGLES FRONTEND (Vue.js 3 + TypeScript)

#### 4.2.1 Architecture des Composants

```typescript
// Composition API Pattern
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import type { PropType } from 'vue';

// ✅ DO: Use script setup with TypeScript
// ComponentName.vue
<script setup lang="ts">
import { useMachineStore } from '@/stores/machines';
import type { Machine } from '@/types';

// Props interface
interface Props {
  machine: Machine;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
});

// Emits
const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'delete', id: string): void;
}>();

// Store
const machineStore = useMachineStore();

// Local state
const isExpanded = ref(false);
const isLoading = ref(false);

// Computed
const statusColor = computed(() => {
  const colors = {
    online: 'text-green-500',
    offline: 'text-red-500',
    connecting: 'text-yellow-500',
  };
  return colors[props.machine.status];
});

// Methods
async function handleDelete() {
  isLoading.value = true;
  try {
    await machineStore.deleteMachine(props.machine.id);
    emit('delete', props.machine.id);
  } finally {
    isLoading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  console.log('MachineCard mounted:', props.machine.id);
});
</script>

<template>
  <div 
    class="machine-card bg-surface border border-border rounded-xl p-4"
    :class="{ 'opacity-50': isLoading }"
  >
    <!-- Content -->
  </div>
</template>
```

#### 4.2.2 Store Pattern (Pinia)

```typescript
// stores/machines.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Machine, MachineStatus } from '@/types';
import { api } from '@/services/api';

export const useMachineStore = defineStore('machines', () => {
  // State
  const machines = ref<Machine[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const selectedMachineId = ref<string | null>(null);

  // Getters
  const onlineMachines = computed(() => 
    machines.value.filter(m => m.status === 'online')
  );
  
  const offlineMachines = computed(() => 
    machines.value.filter(m => m.status === 'offline')
  );
  
  const selectedMachine = computed(() => 
    machines.value.find(m => m.id === selectedMachineId.value)
  );

  // Actions
  async function fetchMachines() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get('/machines');
      machines.value = response.data.data;
    } catch (err) {
      error.value = 'Failed to fetch machines';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteMachine(id: string) {
    await api.delete(`/machines/${id}`);
    machines.value = machines.value.filter(m => m.id !== id);
  }

  function updateMachineStatus(id: string, status: MachineStatus) {
    const machine = machines.value.find(m => m.id === id);
    if (machine) {
      machine.status = status;
    }
  }

  function selectMachine(id: string | null) {
    selectedMachineId.value = id;
  }

  return {
    // State
    machines,
    isLoading,
    error,
    selectedMachineId,
    // Getters
    onlineMachines,
    offlineMachines,
    selectedMachine,
    // Actions
    fetchMachines,
    deleteMachine,
    updateMachineStatus,
    selectMachine,
  };
});
```

#### 4.2.3 xterm.js Integration Standards

```typescript
// composables/useTerminal.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';

import { useWebSocket } from './useWebSocket';

const CLAUDENEST_THEME = {
  background: '#1a1b26',
  foreground: '#c0caf5',
  cursor: '#22d3ee',
  cursorAccent: '#1a1b26',
  selectionBackground: 'rgba(168, 85, 247, 0.3)',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
  brightBlack: '#414868',
  brightRed: '#ff899d',
  brightGreen: '#9fe044',
  brightYellow: '#faba4a',
  brightBlue: '#8db0ff',
  brightMagenta: '#c7a9ff',
  brightCyan: '#7ee1ff',
  brightWhite: '#c0caf5',
};

export function useTerminal(sessionId: string) {
  const terminal = ref<Terminal | null>(null);
  const container = ref<HTMLElement | null>(null);
  const fitAddon = ref<FitAddon | null>(null);
  const { sendMessage, onMessage } = useWebSocket();

  function initTerminal(element: HTMLElement) {
    container.value = element;
    
    // Create terminal with custom theme
    terminal.value = new Terminal({
      theme: CLAUDENEST_THEME,
      fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
      macOptionIsMeta: true,
    });

    // Add addons
    fitAddon.value = new FitAddon();
    terminal.value.loadAddon(fitAddon.value);
    terminal.value.loadAddon(new WebglAddon());
    terminal.value.loadAddon(new SearchAddon());
    terminal.value.loadAddon(new WebLinksAddon());

    // Open terminal
    terminal.value.open(element);
    fitAddon.value.fit();

    // Handle input
    terminal.value.onData((data) => {
      sendMessage(`session.${sessionId}`, 'input', { data });
    });

    // Handle resize
    terminal.value.onResize(({ cols, rows }) => {
      sendMessage(`session.${sessionId}`, 'resize', { cols, rows });
    });

    // Listen for output
    onMessage(`session.${sessionId}`, 'output', (payload) => {
      terminal.value?.write(payload.data);
    });

    // Initial resize
    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    fitAddon.value?.fit();
  }

  function dispose() {
    window.removeEventListener('resize', handleResize);
    terminal.value?.dispose();
  }

  onUnmounted(dispose);

  return {
    terminal,
    initTerminal,
    dispose,
    fit: () => fitAddon.value?.fit(),
    search: (query: string) => {
      const searchAddon = terminal.value?.addons?.search as SearchAddon;
      searchAddon?.findNext(query);
    },
  };
}
```

---

### 4.3 RÈGLES MOBILE (React Native + TypeScript)

#### 4.3.1 Component Architecture

```typescript
// screens/machines/MachineCard.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import type { Machine } from '@/types';
import { StatusDot } from '@/components/common';

interface MachineCardProps {
  machine: Machine;
  onPress: (machine: Machine) => void;
  onLongPress?: (machine: Machine) => void;
}

// ✅ DO: Use memo for performance
export const MachineCard = memo(function MachineCard({
  machine,
  onPress,
  onLongPress,
}: MachineCardProps) {
  const { colors, spacing, borderRadius, typography } = useTheme();

  const handlePress = useCallback(() => {
    onPress(machine);
  }, [machine, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(machine);
  }, [machine, onLongPress]);

  const statusColor = {
    online: colors.semantic.success,
    offline: colors.semantic.error,
    connecting: colors.semantic.warning,
  }[machine.status];

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        style={[
          styles.container,
          {
            backgroundColor: colors.background.card,
            borderRadius: borderRadius.lg,
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
            padding: spacing.md,
          },
        ]}
      >
        <View style={styles.header}>
          <StatusDot color={statusColor} size={12} />
          <Text
            style={[
              styles.name,
              { color: colors.text.primary, fontSize: typography.h3 },
            ]}
            numberOfLines={1}
          >
            {machine.name}
          </Text>
        </View>

        <View style={styles.details}>
          <Text style={{ color: colors.text.secondary }}>
            {machine.platform} • {machine.claudeVersion}
          </Text>
          <Text style={{ color: colors.text.secondary }}>
            {machine.activeSessions} active session
            {machine.activeSessions !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(59, 66, 97, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  details: {
    marginTop: 4,
  },
});
```

#### 4.3.2 State Management (Zustand)

```typescript
// stores/machinesStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Machine, MachineStatus } from '@/types';
import { api } from '@/services/api';

interface MachinesState {
  // State
  machines: Machine[];
  isLoading: boolean;
  error: string | null;
  selectedMachineId: string | null;
  lastUpdated: number;

  // Getters (computed in selectors)
  onlineMachines: () => Machine[];
  offlineMachines: () => Machine[];
  selectedMachine: () => Machine | undefined;

  // Actions
  fetchMachines: () => Promise<void>;
  refreshMachines: () => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
  updateMachineStatus: (id: string, status: MachineStatus) => void;
  selectMachine: (id: string | null) => void;
  clearError: () => void;
}

export const useMachinesStore = create<MachinesState>()(
  persist(
    (set, get) => ({
      // Initial state
      machines: [],
      isLoading: false,
      error: null,
      selectedMachineId: null,
      lastUpdated: 0,

      // Getters
      onlineMachines: () => get().machines.filter(m => m.status === 'online'),
      offlineMachines: () => get().machines.filter(m => m.status === 'offline'),
      selectedMachine: () =>
        get().machines.find(m => m.id === get().selectedMachineId),

      // Actions
      fetchMachines: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.get('/machines');
          set({
            machines: response.data.data,
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to fetch machines',
          });
          throw err;
        }
      },

      refreshMachines: async () => {
        // Skip if recently updated (30s cache)
        if (Date.now() - get().lastUpdated < 30000) {
          return;
        }
        return get().fetchMachines();
      },

      deleteMachine: async (id: string) => {
        await api.delete(`/machines/${id}`);
        set(state => ({
          machines: state.machines.filter(m => m.id !== id),
        }));
      },

      updateMachineStatus: (id: string, status: MachineStatus) => {
        set(state => ({
          machines: state.machines.map(m =>
            m.id === id ? { ...m, status } : m
          ),
        }));
      },

      selectMachine: (id: string | null) => {
        set({ selectedMachineId: id });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'machines-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        machines: state.machines,
        selectedMachineId: state.selectedMachineId,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
```

#### 4.3.3 Theme Configuration (Brand Colors)

```typescript
// theme/colors.ts
// ⚠️ UTILISER UNIQUEMENT LES COULEURS DU BRAND GUIDE

export const colors = {
  // Primary (NE PAS MODIFIER)
  primary: {
    purple: '#a855f7',
    indigo: '#6366f1',
    cyan: '#22d3ee',
  },

  // Backgrounds (NE PAS MODIFIER)
  background: {
    dark1: '#0f0f1a',      // Deepest background
    dark2: '#1a1b26',      // Primary background
    dark3: '#24283b',      // Cards, surfaces
    dark4: '#3b4261',      // Borders, dividers
    card: '#24283b',
  },

  // Text (NE PAS MODIFIER)
  text: {
    primary: '#ffffff',
    secondary: '#a9b1d6',
    muted: '#64748b',
    disabled: '#888888',
  },

  // Semantic (NE PAS MODIFIER)
  semantic: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#fbbf24',
    info: '#22d3ee',
  },

  // Gradients
  gradients: {
    primary: ['#a855f7', '#6366f1'] as const,
    accent: ['#22d3ee', '#a855f7'] as const,
    background: ['#0f0f1a', '#1a1b26', '#24283b'] as const,
  },
} as const;

// Type export
export type Colors = typeof colors;
```

---

### 4.4 RÈGLES AGENT (Node.js + TypeScript)

#### 4.4.1 Agent Architecture

```typescript
// src/agent.ts
import { EventEmitter } from 'events';
import { WebSocketClient } from './websocket/client';
import { SessionManager } from './sessions/manager';
import { DiscoveryService } from './discovery';
import { ContextClient } from './context/client';
import { Logger } from './utils/logger';
import type { AgentConfig, MachineInfo } from './types';

export class ClaudeRemoteAgent extends EventEmitter {
  private wsClient: WebSocketClient;
  private sessionManager: SessionManager;
  private discovery: DiscoveryService;
  private contextClient: ContextClient;
  private logger: Logger;
  private config: AgentConfig;
  private isRunning = false;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.logger = new Logger(config.logLevel);
    
    this.wsClient = new WebSocketClient({
      serverUrl: config.serverUrl,
      token: config.machineToken,
      logger: this.logger,
    });

    this.sessionManager = new SessionManager({
      claudePath: config.claudePath,
      logger: this.logger,
    });

    this.discovery = new DiscoveryService({
      projectPaths: config.projectPaths,
      logger: this.logger,
    });

    this.contextClient = new ContextClient({
      serverUrl: config.serverUrl,
      token: config.machineToken,
      cachePath: config.cachePath,
      logger: this.logger,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // WebSocket events
    this.wsClient.on('connected', () => {
      this.logger.info('Connected to ClaudeNest server');
      this.emit('connected');
    });

    this.wsClient.on('disconnected', () => {
      this.logger.warn('Disconnected from server');
      this.emit('disconnected');
    });

    this.wsClient.on('message', this.handleMessage.bind(this));

    // Session events
    this.sessionManager.on('output', (data) => {
      this.wsClient.send('session:output', data);
    });

    this.sessionManager.on('status', (data) => {
      this.wsClient.send('session:status', data);
    });
  }

  private async handleMessage(type: string, payload: unknown): Promise<void> {
    this.logger.debug('Received message:', { type, payload });

    const handlers: Record<string, (p: unknown) => Promise<void>> = {
      'session:create': this.handleCreateSession.bind(this),
      'session:terminate': this.handleTerminateSession.bind(this),
      'session:input': this.handleSessionInput.bind(this),
      'session:resize': this.handleSessionResize.bind(this),
      'skills:list': this.handleListSkills.bind(this),
      'mcp:list': this.handleListMCP.bind(this),
      'mcp:start': this.handleStartMCP.bind(this),
      'mcp:stop': this.handleStopMCP.bind(this),
      'context:get': this.handleContextGet.bind(this),
      'context:update': this.handleContextUpdate.bind(this),
      'task:claim': this.handleTaskClaim.bind(this),
      'task:complete': this.handleTaskComplete.bind(this),
      'file:lock': this.handleFileLock.bind(this),
      'file:unlock': this.handleFileUnlock.bind(this),
    };

    const handler = handlers[type];
    if (handler) {
      try {
        await handler(payload);
      } catch (error) {
        this.logger.error(`Handler error for ${type}:`, error);
        this.wsClient.send('error', {
          originalType: type,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      this.logger.warn(`No handler for message type: ${type}`);
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.logger.info('Starting Claude Remote Agent...');
    
    // Initialize components
    await this.discovery.initialize();
    await this.contextClient.initialize();
    
    // Connect to server
    await this.wsClient.connect();
    
    this.isRunning = true;
    this.emit('started');
    
    this.logger.info('Agent started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.logger.info('Stopping agent...');
    
    // Terminate all sessions
    await this.sessionManager.terminateAll();
    
    // Disconnect
    await this.wsClient.disconnect();
    
    this.isRunning = false;
    this.emit('stopped');
    
    this.logger.info('Agent stopped');
  }

  // ... handlers implementation
}
```

#### 4.4.2 Session Manager

```typescript
// src/sessions/manager.ts
import { EventEmitter } from 'events';
import { ClaudeProcess } from './claude-process';
import { Logger } from '../utils/logger';
import type { Session, SessionConfig, SessionStatus } from '../types';

interface SessionManagerConfig {
  claudePath: string;
  maxSessions?: number;
  logger: Logger;
}

export class SessionManager extends EventEmitter {
  private sessions = new Map<string, ClaudeProcess>();
  private config: SessionManagerConfig;
  private logger: Logger;

  constructor(config: SessionManagerConfig) {
    super();
    this.config = { maxSessions: 10, ...config };
    this.logger = config.logger;
  }

  async createSession(id: string, config: SessionConfig): Promise<Session> {
    // Check session limit
    if (this.sessions.size >= this.config.maxSessions!) {
      throw new Error(`Maximum sessions (${this.config.maxSessions}) reached`);
    }

    this.logger.info(`Creating session ${id}`, config);

    const process = new ClaudeProcess({
      claudePath: this.config.claudePath,
      ...config,
    });

    // Setup event forwarding
    process.on('output', (data) => {
      this.emit('output', { sessionId: id, ...data });
    });

    process.on('status', (status) => {
      this.emit('status', { sessionId: id, status });
    });

    process.on('exit', (code) => {
      this.logger.info(`Session ${id} exited with code ${code}`);
      this.sessions.delete(id);
      this.emit('sessionEnded', { sessionId: id, exitCode: code });
    });

    // Start process
    await process.start();
    this.sessions.set(id, process);

    return {
      id,
      status: 'running',
      pid: process.pid,
    };
  }

  async terminateSession(id: string): Promise<void> {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }

    this.logger.info(`Terminating session ${id}`);
    await process.terminate();
    this.sessions.delete(id);
  }

  sendInput(id: string, data: string): void {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }
    process.write(data);
  }

  resize(id: string, cols: number, rows: number): void {
    const process = this.sessions.get(id);
    if (!process) {
      throw new Error(`Session ${id} not found`);
    }
    process.resize(cols, rows);
  }

  async terminateAll(): Promise<void> {
    this.logger.info(`Terminating all ${this.sessions.size} sessions`);
    
    const terminations = Array.from(this.sessions.entries()).map(
      async ([id, process]) => {
        try {
          await process.terminate();
        } catch (error) {
          this.logger.error(`Failed to terminate session ${id}:`, error);
        }
      }
    );

    await Promise.all(terminations);
    this.sessions.clear();
  }

  getSession(id: string): ClaudeProcess | undefined {
    return this.sessions.get(id);
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}
```

---

### 4.5 RÈGLES BASE DE DONNÉES

#### 4.5.1 Migration Standards

```php
<?php
// database/migrations/YYYY_MM_DD_HHMMSS_create_feature_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('example_table', function (Blueprint $table) {
            // Primary key - always UUID
            $table->uuid('id')->primary();
            
            // Foreign keys - cascade on delete for user data
            $table->foreignUuid('user_id')
                ->constrained()
                ->onDelete('cascade');
            
            // Enums as strings with check constraint
            $table->string('status', 50)->default('pending');
            
            // JSON for flexible data
            $table->jsonb('metadata')->default('{}');
            
            // Timestamps - always include
            $table->timestamps();
            
            // Soft deletes if needed
            // $table->softDeletes();
            
            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });

        // Add check constraint for enum-like behavior
        DB::statement("
            ALTER TABLE example_table 
            ADD CONSTRAINT chk_status 
            CHECK (status IN ('pending', 'active', 'completed'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('example_table');
    }
};
```

#### 4.5.2 Model Standards

```php
<?php
// app/Models/Example.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Example extends Model
{
    use HasFactory;
    use HasUuids;

    /**
     * The table associated with the model.
     */
    protected $table = 'examples';

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'name',
        'status',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        // sensitive fields
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    // ==================== RELATIONSHIPS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ==================== ACCESSORS ====================

    protected function name(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn (string $value) => ucfirst($value),
        );
    }

    // ==================== METHODS ====================

    public function activate(): void
    {
        $this->update(['status' => 'active']);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
```

---

## 5. BACKLOG DÉTAILLÉ PAR SPRINT

### 5.1 Phase 1: Fondation (Semaines 1-4)

#### Sprint 1: Infrastructure & Setup

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S1-001 | Setup monorepo avec Turborepo | DevOps | 1j | - |
| S1-002 | Configuration Docker development | DevOps | 2j | S1-001 |
| S1-003 | Setup CI/CD GitHub Actions | DevOps | 2j | S1-001 |
| S1-004 | Configuration PostgreSQL + pgvector | DevOps | 1j | S1-002 |
| S1-005 | Setup Redis | DevOps | 0.5j | S1-002 |
| S1-006 | Initialisation Laravel 11 | Backend | 1j | S1-004 |
| S1-007 | Configuration Laravel Reverb | Backend | 2j | S1-006 |
| S1-008 | Setup Laravel Sanctum | Backend | 1j | S1-006 |
| S1-009 | Initialisation Vue.js 3 + Vite | Frontend | 1j | S1-001 |
| S1-010 | Configuration Tailwind CSS (brand colors) | Frontend | 1j | S1-009 |
| S1-011 | Setup TypeScript strict mode | Frontend | 0.5j | S1-009 |
| S1-012 | Initialisation React Native | Mobile | 1j | S1-001 |
| S1-013 | Configuration React Navigation | Mobile | 1j | S1-012 |
| S1-014 | Setup Zustand stores | Mobile | 1j | S1-012 |
| S1-015 | Initialisation Agent Node.js | Agent | 1j | S1-001 |
| S1-016 | Configuration TypeScript agent | Agent | 0.5j | S1-015 |

#### Sprint 2: Authentification

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S2-001 | Migration users table | Backend | 0.5j | - |
| S2-002 | OAuth Google implementation | Backend | 2j | S2-001 |
| S2-003 | OAuth GitHub implementation | Backend | 2j | S2-001 |
| S2-004 | Magic link authentication | Backend | 2j | S2-001 |
| S2-005 | JWT token management | Backend | 1j | S2-001 |
| S2-006 | API tokens (personal access) | Backend | 1j | S2-005 |
| S2-007 | Login page Vue.js | Frontend | 2j | S2-002 |
| S2-008 | OAuth callback handling | Frontend | 1j | S2-007 |
| S2-009 | Auth store Pinia | Frontend | 1j | S2-007 |
| S2-010 | Protected routes | Frontend | 0.5j | S2-009 |
| S2-011 | Login screen React Native | Mobile | 2j | S2-002 |
| S2-012 | OAuth in-app browser | Mobile | 1j | S2-011 |
| S2-013 | Biometric authentication | Mobile | 1j | S2-011 |
| S2-014 | Secure token storage | Mobile | 1j | S2-011 |
| S2-015 | Auth store Zustand | Mobile | 1j | S2-011 |

#### Sprint 3: Machines & Base Données

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S3-001 | Migration machines table | Backend | 0.5j | S2-001 |
| S3-002 | Migration sessions table | Backend | 0.5j | S3-001 |
| S3-003 | CRUD Machines API | Backend | 2j | S3-001 |
| S3-004 | Machine status tracking | Backend | 1j | S3-001 |
| S3-005 | Agent pairing flow | Backend | 2j | S3-001 |
| S3-006 | Machines list page | Frontend | 2j | S3-003 |
| S3-007 | Machine card component | Frontend | 1j | S3-006 |
| S3-008 | Machine detail page | Frontend | 2j | S3-006 |
| S3-009 | Machines store | Frontend | 1j | S3-006 |
| S3-010 | Machines list screen | Mobile | 2j | S3-003 |
| S3-011 | Machine card component | Mobile | 1j | S3-010 |
| S3-012 | Pull to refresh | Mobile | 0.5j | S3-010 |
| S3-013 | Machine detail screen | Mobile | 2j | S3-010 |
| S3-014 | Agent WebSocket client | Agent | 2j | - |
| S3-015 | Agent authentication | Agent | 2j | S3-005, S3-014 |
| S3-016 | QR code generation | Agent | 1j | S3-015 |

#### Sprint 4: WebSocket & Communication

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S4-001 | WebSocket channel definitions | Backend | 1j | S1-007 |
| S4-002 | Agent connection handler | Backend | 2j | S4-001 |
| S4-003 | Client connection handler | Backend | 1j | S4-001 |
| S4-004 | Message relay implementation | Backend | 2j | S4-002, S4-003 |
| S4-005 | Presence channels | Backend | 1j | S4-001 |
| S4-006 | Laravel Echo integration | Frontend | 1j | S4-003 |
| S4-007 | useWebSocket composable | Frontend | 1j | S4-006 |
| S4-008 | Socket.io client setup | Mobile | 1j | S4-003 |
| S4-009 | WebSocket service | Mobile | 1j | S4-008 |
| S4-010 | Agent reconnection logic | Agent | 2j | S3-014 |
| S4-011 | Heartbeat mechanism | Agent | 1j | S4-010 |
| S4-012 | Message queuing offline | Agent | 2j | S4-010 |

---

### 5.2 Phase 2: Core Features (Semaines 5-10)

#### Sprint 5: Sessions Base

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S5-001 | Session controller API | Backend | 2j | S3-002 |
| S5-002 | Session lifecycle management | Backend | 2j | S5-001 |
| S5-003 | Session logs table | Backend | 0.5j | S3-002 |
| S5-004 | Sessions list component | Frontend | 1j | S5-001 |
| S5-005 | Create session modal | Frontend | 2j | S5-004 |
| S5-006 | Session store | Frontend | 1j | S5-004 |
| S5-007 | Sessions list screen | Mobile | 1j | S5-001 |
| S5-008 | New session screen | Mobile | 2j | S5-007 |
| S5-009 | Sessions store | Mobile | 1j | S5-007 |
| S5-010 | Session manager agent | Agent | 2j | S4-010 |
| S5-011 | Claude process wrapper | Agent | 2j | S5-010 |

#### Sprint 6: Terminal (Web)

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S6-001 | xterm.js integration | Frontend | 3j | S5-004 |
| S6-002 | Terminal Vue component | Frontend | 2j | S6-001 |
| S6-003 | WebGL addon setup | Frontend | 1j | S6-001 |
| S6-004 | Fit addon integration | Frontend | 0.5j | S6-001 |
| S6-005 | Search addon integration | Frontend | 1j | S6-001 |
| S6-006 | Terminal resize handling | Frontend | 1j | S6-002 |
| S6-007 | Terminal theme (brand colors) | Frontend | 1j | S6-001 |
| S6-008 | Terminal view page | Frontend | 2j | S6-002 |
| S6-009 | Multi-tab terminals | Frontend | 2j | S6-008 |
| S6-010 | useTerminal composable | Frontend | 2j | S6-002 |

#### Sprint 7: Output Streaming (Mobile)

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S7-001 | Output view component | Mobile | 2j | S5-007 |
| S7-002 | Output stream buffering | Mobile | 2j | S7-001 |
| S7-003 | Auto-scroll toggle | Mobile | 0.5j | S7-001 |
| S7-004 | Session detail screen | Mobile | 2j | S7-001 |
| S7-005 | Quick reply buttons | Mobile | 1j | S7-004 |
| S7-006 | Input bar component | Mobile | 2j | S7-004 |
| S7-007 | Keyboard handling | Mobile | 1j | S7-006 |

#### Sprint 8: PTY & Process Management (Agent)

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S8-001 | node-pty integration | Agent | 3j | S5-011 |
| S8-002 | PTY resize handling | Agent | 1j | S8-001 |
| S8-003 | Output streaming | Agent | 2j | S8-001 |
| S8-004 | Input handling | Agent | 1j | S8-001 |
| S8-005 | Process lifecycle states | Agent | 2j | S8-001 |
| S8-006 | Session restoration | Agent | 2j | S8-005 |
| S8-007 | Output buffer (circular) | Agent | 2j | S8-003 |

#### Sprint 9: Notifications

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S9-001 | FCM integration | Mobile | 2j | - |
| S9-002 | APNs integration | Mobile | 2j | - |
| S9-003 | Push token registration | Mobile | 1j | S9-001, S9-002 |
| S9-004 | Notification handlers | Mobile | 2j | S9-003 |
| S9-005 | Rich notifications | Mobile | 2j | S9-004 |
| S9-006 | Deep linking | Mobile | 2j | S9-004 |
| S9-007 | Push service backend | Backend | 2j | S9-001 |
| S9-008 | Notification triggers | Backend | 2j | S9-007 |

#### Sprint 10: Skills & MCP

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S10-001 | Skills discovery API | Backend | 2j | - |
| S10-002 | MCP server management API | Backend | 2j | - |
| S10-003 | Skills browser page | Frontend | 2j | S10-001 |
| S10-004 | MCP servers page | Frontend | 2j | S10-002 |
| S10-005 | Skills screen mobile | Mobile | 2j | S10-001 |
| S10-006 | MCP toggle mobile | Mobile | 2j | S10-002 |
| S10-007 | Skills discovery agent | Agent | 2j | - |
| S10-008 | MCP management agent | Agent | 2j | - |
| S10-009 | Commands discovery | Agent | 1j | S10-007 |

---

### 5.3 Phase 3: Multi-Agent & RAG (Semaines 11-16)

#### Sprint 11: Context Store Schema

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S11-001 | shared_projects table | Backend | 0.5j | S3-001 |
| S11-002 | context_chunks table (vector) | Backend | 1j | S11-001 |
| S11-003 | shared_tasks table | Backend | 0.5j | S11-001 |
| S11-004 | claude_instances table | Backend | 0.5j | S11-001 |
| S11-005 | file_locks table | Backend | 0.5j | S11-001 |
| S11-006 | activity_log table | Backend | 0.5j | S11-001 |
| S11-007 | pgvector index optimization | Backend | 1j | S11-002 |

#### Sprint 12: RAG Engine

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S12-001 | Embedding service (bge-small-en) | Backend | 3j | S11-002 |
| S12-002 | Context RAG service | Backend | 3j | S12-001 |
| S12-003 | Vector search implementation | Backend | 2j | S12-001 |
| S12-004 | Reranking service | Backend | 2j | S12-002 |
| S12-005 | Context compression (Mistral) | Backend | 3j | S11-002 |
| S12-006 | Context API endpoints | Backend | 2j | S12-002 |
| S12-007 | Ollama integration | Backend | 2j | S12-005 |

#### Sprint 13: Multi-Agent API

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S13-001 | Task management API | Backend | 2j | S11-003 |
| S13-002 | File lock API | Backend | 2j | S11-005 |
| S13-003 | Instance tracking API | Backend | 2j | S11-004 |
| S13-004 | Activity log API | Backend | 1j | S11-006 |
| S13-005 | Broadcast messaging API | Backend | 1j | S13-003 |
| S13-006 | Project initialization API | Backend | 2j | S11-001 |
| S13-007 | Context WebSocket events | Backend | 2j | S4-001 |

#### Sprint 14: Multi-Agent Dashboard (Web)

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S14-001 | Multi-agent project page | Frontend | 2j | S13-006 |
| S14-002 | Instances grid component | Frontend | 2j | S13-003 |
| S14-003 | Task board (Kanban) | Frontend | 3j | S13-001 |
| S14-004 | Context viewer component | Frontend | 2j | S12-006 |
| S14-005 | File lock map | Frontend | 2j | S13-002 |
| S14-006 | Activity timeline | Frontend | 2j | S13-004 |
| S14-007 | Multi-terminal grid (2x2, 3x3) | Frontend | 3j | S6-009 |
| S14-008 | Context editor (Monaco) | Frontend | 2j | S14-004 |

#### Sprint 15: Multi-Agent Mobile

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S15-001 | Project screen | Mobile | 2j | S13-006 |
| S15-002 | Instances list | Mobile | 1j | S13-003 |
| S15-003 | Task list screen | Mobile | 2j | S13-001 |
| S15-004 | Task claim/complete | Mobile | 2j | S15-003 |
| S15-005 | Context summary view | Mobile | 1j | S12-006 |
| S15-006 | File locks screen | Mobile | 1j | S13-002 |
| S15-007 | Conflict alerts | Mobile | 1j | S13-005 |

#### Sprint 16: Agent Context Sync

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S16-001 | Context client implementation | Agent | 3j | S12-006 |
| S16-002 | Local SQLite cache | Agent | 2j | S16-001 |
| S16-003 | Context sync offline queue | Agent | 2j | S16-001 |
| S16-004 | MCP tools implementation | Agent | 3j | S16-001 |
| S16-005 | Task coordination tools | Agent | 2j | S16-004 |
| S16-006 | File locking tools | Agent | 2j | S16-004 |
| S16-007 | Broadcast listener | Agent | 1j | S16-004 |

---

### 5.4 Phase 4: Polish & Launch (Semaines 17-20)

#### Sprint 17: Testing & QA

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S17-001 | Backend unit tests | Backend | 3j | - |
| S17-002 | API integration tests | Backend | 3j | S17-001 |
| S17-003 | WebSocket tests | Backend | 2j | S17-001 |
| S17-004 | Frontend component tests | Frontend | 3j | - |
| S17-005 | E2E tests (Playwright) | QA | 5j | - |
| S17-006 | Mobile unit tests | Mobile | 3j | - |
| S17-007 | Agent unit tests | Agent | 3j | - |
| S17-008 | Security audit | QA | 2j | - |

#### Sprint 18: Performance & Optimization

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S18-001 | Database query optimization | Backend | 2j | - |
| S18-002 | Redis caching layer | Backend | 2j | S18-001 |
| S18-003 | WebSocket performance tuning | Backend | 2j | - |
| S18-004 | Frontend bundle optimization | Frontend | 2j | - |
| S18-005 | Virtual scrolling (lists) | Frontend | 2j | - |
| S18-006 | Mobile app size optimization | Mobile | 2j | - |
| S18-007 | Agent memory optimization | Agent | 2j | - |
| S18-008 | Load testing | DevOps | 3j | - |

#### Sprint 19: Documentation

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S19-001 | API documentation (OpenAPI) | Backend | 2j | - |
| S19-002 | Architecture documentation | Architecte | 2j | - |
| S19-003 | Setup guides | Tech Writer | 3j | - |
| S19-004 | User documentation | Tech Writer | 3j | - |
| S19-005 | README packages | All | 2j | - |
| S19-006 | Contributing guidelines | Tech Writer | 1j | - |

#### Sprint 20: Launch

| ID | Tâche | Équipe | Estimation | Dépendances |
|----|-------|--------|------------|-------------|
| S20-001 | Production deployment | DevOps | 2j | - |
| S20-002 | Monitoring setup | DevOps | 2j | S20-001 |
| S20-003 | SSL certificates | DevOps | 0.5j | S20-001 |
| S20-004 | CDN configuration | DevOps | 1j | S20-001 |
| S20-005 | App Store submission | Mobile | 2j | - |
| S20-006 | Play Store submission | Mobile | 2j | - |
| S20-007 | NPM package publication | Agent | 1j | - |
| S20-008 | Launch announcement | All | 1j | - |

---

## 6. INTÉGRATION DES ASSETS DE BRANDING

### 6.1 Utilisation Obligatoire des Assets

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ASSETS DE BRANDING - UTILISATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LOGOS (depuis /branding/logos/)                                            │
│  ─────────────────────────────                                              │
│  • claudenest-logo-dark.svg     → Dashboard (header, sidebar)               │
│  • claudenest-logo-light.svg    → Documentation, landing page               │
│  • claudenest-icon.svg          → Favicon, app icon, loading spinner        │
│                                                                              │
│  FAVICONS (depuis /branding/favicons/)                                      │
│  ───────────────────────────────────                                        │
│  • favicon.svg                  → Convertir en 16x16, 32x32, 180x180       │
│                                   pour web et PWA                           │
│                                                                              │
│  SOCIAL (depuis /branding/social/)                                          │
│  ─────────────────────────────────                                          │
│  • github-social-preview.svg    → GitHub repository                         │
│  • twitter-card.svg             → Twitter/X sharing                         │
│  • og-image.svg                 → OpenGraph meta tags                       │
│  • app-store-feature.svg        → App Store / Play Store feature graphic    │
│                                                                              │
│  BANNERS (depuis /branding/banners/)                                        │
│  ───────────────────────────────────                                        │
│  • readme-banner.svg            → README.md principal                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Configuration Tailwind (Brand Colors)

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.vue",
    "./resources/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        // Primary (EXACTEMENT comme le brand guide)
        primary: {
          DEFAULT: '#a855f7',
          dark: '#9333ea',
          light: '#c084fc',
        },
        indigo: '#6366f1',
        cyan: '#22d3ee',
        
        // Backgrounds (EXACTEMENT comme le brand guide)
        background: {
          1: '#0f0f1a',
          2: '#1a1b26',
          3: '#24283b',
        },
        surface: '#24283b',
        border: '#3b4261',
        
        // Text (EXACTEMENT comme le brand guide)
        text: {
          primary: '#ffffff',
          secondary: '#a9b1d6',
          muted: '#64748b',
        },
        
        // Semantic (EXACTEMENT comme le brand guide)
        success: '#22c55e',
        error: '#ef4444',
        warning: '#fbbf24',
        info: '#22d3ee',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'Monaco', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        'gradient-accent': 'linear-gradient(90deg, #22d3ee 0%, #a855f7 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f0f1a 0%, #1a1b26 50%, #24283b 100%)',
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
    },
  },
  plugins: [],
};
```

### 6.3 React Native Theme (Brand Colors)

```typescript
// mobile/src/theme/index.ts
export const theme = {
  colors: {
    // Primary
    primary: '#a855f7',
    indigo: '#6366f1',
    cyan: '#22d3ee',
    
    // Backgrounds
    background: {
      dark1: '#0f0f1a',
      dark2: '#1a1b26',
      card: '#24283b',
      border: '#3b4261',
    },
    
    // Text
    text: {
      primary: '#ffffff',
      secondary: '#a9b1d6',
      muted: '#64748b',
    },
    
    // Semantic
    success: '#22c55e',
    error: '#ef4444',
    warning: '#fbbf24',
    info: '#22d3ee',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  typography: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    bodySmall: 14,
    caption: 12,
    mono: 14,
  },
} as const;

export type Theme = typeof theme;
```

---

## 7. CHECKLIST DE VALIDATION

### 7.1 Avant Chaque PR

- [ ] Code suit les standards définis
- [ ] Tests passent (unit + integration)
- [ ] Linting passe (ESLint, PHP_CodeSniffer)
- [ ] Type checking passe (TypeScript strict)
- [ ] Pas de console.log en production
- [ ] Documentation mise à jour
- [ ] Migration de base de données si nécessaire
- [ ] Changements reviewés par au moins 1 senior

### 7.2 Avant Chaque Release

- [ ] Tous les tests passent
- [ ] E2E tests passent
- [ ] Performance benchmarks OK
- [ ] Security audit OK
- [ ] Documentation complète
- [ ] Changelog mis à jour
- [ ] Assets de branding intégrés
- [ ] Version bumpée correctement

### 7.3 Critères d'Acceptance par Feature

| Feature | Critères d'Acceptance |
|---------|----------------------|
| Authentification | OAuth Google/GitHub fonctionnel, magic link < 5s, session persistante 30j |
| Terminal Web | Latence < 100ms, xterm.js avec WebGL, copy/paste fonctionnel |
| Sessions | Création < 3s, streaming < 500ms, 10k lignes scrollback |
| Multi-Agent | Sync context < 1s, RAG search < 2s, task claim atomique |
| Mobile App | Launch < 2s, 60fps scrolling, push delivery > 99% |
| Agent | Startup < 2s, reconnection < 30s, < 50MB RAM idle |

---

## ANNEXE: COMMANDES UTILES

```bash
# Development
npm run dev          # Start all dev servers
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Run all linters

# Backend (Server)
cd packages/server
composer install
php artisan migrate
php artisan serve
php artisan reverb:start

# Frontend (Web)
cd packages/server
npm run dev

# Mobile
cd packages/mobile
npx react-native run-ios
npx react-native run-android

# Agent
cd packages/agent
npm run build
npm run start:dev

# Docker
docker-compose up -d
docker-compose logs -f
```

---

**Document créé par l'Architecte Technique ClaudeNest**  
*Mode Swarm Architecture - Version 1.0.0*
