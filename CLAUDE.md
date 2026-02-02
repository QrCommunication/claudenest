# ClaudeNest - Contexte pour Claude Code

## 🎯 Vue d'Ensemble

ClaudeNest est une plateforme complète d'orchestration à distance des instances Claude Code, permettant :
- Contrôle de Claude Code depuis mobile/web
- Multi-agent : plusieurs instances partagent un contexte
- RAG avec pgvector pour recherche sémantique
- File locking pour éviter les conflits

## 🏗️ Architecture

### 3 Packages

```
packages/
├── server/          # Laravel 11 + Vue.js 3 + PostgreSQL + Reverb
├── agent/           # Node.js + TypeScript + node-pty
└── mobile/          # React Native + Zustand
```

### Stack Complète

**Backend (Server)**
- Laravel 11 (PHP 8.3+)
- Laravel Reverb (WebSocket)
- PostgreSQL 16 + pgvector
- Redis 7
- Ollama (Mistral 7B)

**Frontend (Web)**
- Vue.js 3 (Composition API)
- xterm.js + WebGL
- Pinia
- Tailwind CSS (brand colors)

**Agent (Local)**
- Node.js 20 LTS
- TypeScript 5.x
- node-pty
- ws (WebSocket)

**Mobile**
- React Native 0.73+
- Zustand
- Socket.io client

## 🗄️ Database Schema

### Tables Principales
- `users` - Utilisateurs OAuth
- `machines` - Machines avec agent
- `claude_sessions` - Sessions PTY
- `shared_projects` - Projets multi-agent
- `context_chunks` - Vecteurs RAG (384d)
- `shared_tasks` - Tâches distribuées
- `claude_instances` - Instances connectées
- `file_locks` - Verrous distribués

## 🎨 Brand Colors (OBLIGATOIRE)

```css
--primary: #a855f7;      /* Purple */
--indigo: #6366f1;       /* Indigo */
--cyan: #22d3ee;         /* Cyan accent */
--bg-1: #0f0f1a;         /* Dark 1 */
--bg-2: #1a1b26;         /* Dark 2 */
--bg-3: #24283b;         /* Surface */
--success: #22c55e;
--error: #ef4444;
```

## 🚀 Commandes de Démarrage

```bash
# Infrastructure
docker-compose up -d

# Server
cd packages/server
composer install
php artisan migrate
php artisan serve

# Agent
cd packages/agent
npm install
npm run dev

# Mobile
cd packages/mobile
npm install
npx react-native run-ios
```

## 🔧 Développement

### Règles Backend (Laravel)
- UUID pour toutes les PK
- Form Requests pour validation
- Policies pour authorization
- Eloquent strict

### Règles Frontend (Vue.js)
- Composition API obligatoire
- Script setup + TypeScript
- Pinia pour state
- Pas de `any`

### Règles Mobile (React Native)
- Fonctionnal components + memo
- Zustand avec persistance
- TypeScript strict

### Règles Agent (Node.js)
- TypeScript strict
- Pino pour logging
- Reconnexion WebSocket
- PTY avec node-pty

## 📊 Fonctionnalités Clés

### Multi-Agent Flow
1. User crée un projet
2. Lance N instances Claude
3. Chaque instance appelle `context_query()`
4. Serveur RAG : embed → search → rerank → assemble
5. Context frais retourné à chaque Claude
6. Tasks atomically claimable
7. File locks pour éviter conflits

### RAG Pipeline
```
Query → bge-small-en (384d) → pgvector search → 
bge-reranker → Top 5 chunks → Assemble context → 
Return to Agent
```

## 🔐 Sécurité

- OAuth 2.0 (Google/GitHub)
- Machine tokens (Ed25519)
- TLS 1.3 (WSS)
- OS keychain pour tokens
- Rate limiting

## 📚 Documentation

- `ORCHESTRATION-CLAUDENEST.md` - Plan complet
- `ARCHITECTURE-VISUELLE.md` - Diagrammes
- `.claude/rules/*.md` - Règles par équipe

## 🐳 Docker Services

- `claudenest-postgres` - PostgreSQL 16 + pgvector
- `claudenest-redis` - Redis 7
- `claudenest-ollama` - Mistral 7B for RAG

## ⚠️ Points d'Attention

1. **Jamais modifier les couleurs du brand**
2. **Toujours utiliser TypeScript strict**
3. **Pas de credentials dans les logs**
4. **Migrations testées avant commit**
5. **WebSocket auth obligatoire**

## 📝 TODO Next

- [ ] Configurer OAuth Google/GitHub
- [ ] Tester le flux Multi-Agent
- [ ] Optimiser les requêtes vectorielles
- [ ] Setup CI/CD GitHub Actions
- [ ] Documentation API (OpenAPI)
