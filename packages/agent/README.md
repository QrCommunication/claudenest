# @claude-remote/agent

Agent Node.js pour ClaudeNest - Daemon local permettant l'orchestration à distance des instances Claude Code.

## Fonctionnalités

- 🔗 **WebSocket Client** - Connexion temps réel au serveur ClaudeNest avec auto-reconnexion
- 🖥️ **Gestion PTY** - Terminal pseudo-tty via node-pty pour Claude Code
- 🔍 **Discovery** - Découverte automatique des skills, MCP servers et commandes
- 🔄 **Context Sync** - Synchronisation du contexte multi-agent avec le serveur
- 👥 **Multi-Sessions** - Gestion simultanée de plusieurs sessions Claude Code
- 🔐 **Sécurité** - Stockage sécurisé des tokens via keytar

## Installation

```bash
# Via npm
npm install -g @claudenest/agent

# Via le repo
cd packages/agent
npm install
npm run build
npm link
```

## Utilisation

### Démarrage rapide

```bash
# Appairage avec le compte ClaudeNest
claudenest-agent pair

# Démarrage de l'agent
claudenest-agent start

# Ou avec options
claudenest-agent start \
  --server https://api.claudenest.io \
  --claude-path /usr/local/bin/claude \
  --log-level debug \
  --project-path ~/projects
```

### Commandes CLI

```bash
# Démarrer l'agent
claudenest-agent start [options]

# Arrêter l'agent
claudenest-agent stop

# Voir le statut
claudenest-agent status

# Appairer une machine
claudenest-agent pair

# Configuration
claudenest-agent config --list
claudenest-agent config --get serverUrl
claudenest-agent config --set logLevel=debug

# Logs
claudenest-agent logs --follow --lines 100
```

### Options de démarrage

| Option | Description | Défaut |
|--------|-------------|--------|
| `-s, --server <url>` | URL du serveur ClaudeNest | https://api.claudenest.io |
| `-t, --token <token>` | Token d'authentification | (depuis keychain) |
| `-c, --claude-path <path>` | Chemin vers Claude Code | (auto-détecté) |
| `-l, --log-level <level>` | Niveau de log | info |
| `-p, --project-path <path>` | Chemins de projets (multiples) | [cwd] |
| `-d, --daemon` | Mode daemon | false |

## Configuration

### Fichier de configuration

```json
// ~/.config/claudenest/config.json
{
  "serverUrl": "https://api.claudenest.io",
  "claudePath": "/usr/local/bin/claude",
  "projectPaths": ["~/projects", "~/work"],
  "logLevel": "info",
  "sessions": {
    "maxSessions": 10
  },
  "websocket": {
    "reconnectDelay": 1000,
    "maxReconnectDelay": 30000,
    "heartbeatInterval": 30000
  }
}
```

### Variables d'environnement

```bash
CLAUDENEST_SERVER_URL=https://api.claudenest.io
CLAUDENEST_TOKEN=your-machine-token
CLAUDENEST_LOG_LEVEL=debug
CLAUDENEST_CLAUDE_PATH=/usr/local/bin/claude
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ClaudeNest Agent                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   WebSocket  │  │   Sessions   │  │   Discovery  │       │
│  │    Client    │◄─┤   Manager    │◄─┤   Services   │       │
│  │              │  │              │  │              │       │
│  │ • Auto-rec   │  │ • PTY mgmt   │  │ • Skills     │       │
│  │ • Heartbeat  │  │ • Multi-sess │  │ • MCP        │       │
│  │ • Queue      │  │ • Lifecycle  │  │ • Commands   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                  ┌────────▼────────┐                        │
│                  │   Context Client │                        │
│                  │                  │                        │
│                  │ • Sync           │                        │
│                  │ • Cache local    │                        │
│                  │ • Tasks          │                        │
│                  │ • File locks     │                        │
│                  └─────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  ClaudeNest     │
                   │    Server       │
                   └─────────────────┘
```

## API Programmatique

```typescript
import { ClaudeNestAgent, generateMachineId } from '@claude-remote/agent';

const agent = new ClaudeNestAgent({
  config: {
    serverUrl: 'https://api.claudenest.io',
    machineToken: 'your-token',
    claudePath: '/usr/local/bin/claude',
    projectPaths: ['~/projects'],
    cachePath: '~/.cache/claudenest/context.json',
    logLevel: 'info',
  },
  machineId: generateMachineId(),
});

await agent.initialize();
await agent.start();

// Accès aux composants
const sessionManager = agent.getSessionManager();
const skillsDiscovery = agent.getSkillsDiscovery();
const mcpManager = agent.getMCPManager();
const contextClient = agent.getContextClient();

// Événements
agent.on('connected', () => console.log('Connected!'));
agent.on('sessionCreated', (session) => console.log('New session:', session.id));

// Arrêt
await agent.stop();
```

## Messages WebSocket

### Entrants (serveur → agent)

| Type | Description |
|------|-------------|
| `session:create` | Créer une nouvelle session |
| `session:terminate` | Terminer une session |
| `session:input` | Envoyer une entrée |
| `session:resize` | Redimensionner le PTY |
| `skills:list` | Lister les skills |
| `mcp:start` | Démarrer un serveur MCP |
| `mcp:stop` | Arrêter un serveur MCP |
| `task:claim` | Réclamer une tâche |
| `task:complete` | Marquer une tâche comme terminée |
| `file:lock` | Verrouiller un fichier |
| `file:unlock` | Déverrouiller un fichier |

### Sortants (agent → serveur)

| Type | Description |
|------|-------------|
| `session:output` | Sortie du terminal |
| `session:status` | Changement de statut |
| `session:exited` | Session terminée |
| `machine:info` | Informations machine |
| `skills:discovered` | Skills découverts |
| `mcp:status` | Statut MCP |
| `context:sync` | Mise à jour contexte |

## Développement

```bash
# Installation des dépendances
npm install

# Build
npm run build

# Mode développement avec hot reload
npm run dev

# Tests
npm run test

# Lint
npm run lint

# Type checking
npm run typecheck
```

## License

MIT
