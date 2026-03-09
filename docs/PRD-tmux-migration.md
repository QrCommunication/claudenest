# PRD: Migration node-pty vers tmux

> **Status**: Draft
> **Date**: 2026-02-18
> **Auteur**: Claude / Rony
> **Package**: `@claudenest/agent`

---

## 1. Probleme

L'input terminal est lent. Chaque frappe clavier suit ce chemin:

```
Browser keystroke
  -> WebSocket (internet)
  -> AgentServe (ReactPHP, port 6001)
  -> WebSocket forward
  -> Agent Node.js
  -> node-pty (N-API bridge)  <-- overhead ici
  -> bash shell
  -> claude
```

**Problemes concrets :**

| Probleme | Impact |
|----------|--------|
| **node-pty = module natif** | Compilation par plateforme, bindings N-API, overhead sur chaque write/read |
| **Pas de persistance** | Si l'agent crash, toutes les sessions Claude sont perdues |
| **Double shell** | On spawn bash puis on injecte `claude` dedans (hack avec `setTimeout(300ms)`) |
| **Dependance lourde** | node-pty tire node-gyp, python, make, compilateur C++ |
| **Un seul viewer** | Impossible d'avoir 2 navigateurs sur la meme session |

---

## 2. Solution: tmux

Remplacer `node-pty` par `tmux` pour gerer les sessions terminal.

### Pourquoi tmux

| Avantage | Detail |
|----------|--------|
| **Zero module natif** | Pure `child_process.spawn()`, pas de N-API |
| **Sessions persistantes** | Survivent aux crashes agent, deconnexions reseau |
| **Control mode** | I/O structure via `tmux -C attach` (stdin/stdout pipes) |
| **Multi-attach** | Plusieurs viewers sur la meme session nativement |
| **Resize natif** | `tmux resize-window` sans PTY manipulation |
| **Preinstalle** | Disponible sur tout serveur Linux/macOS |
| **Battle-tested** | Des decennies de stabilite en production |

### Architecture cible

```
Browser keystroke
  -> WebSocket (internet)
  -> AgentServe (port 6001)
  -> WebSocket forward
  -> Agent Node.js
  -> write to tmux control mode stdin (pure JS pipe)
  -> tmux -> PTY natif -> claude
```

**Difference cle**: On elimine le bridge N-API node-pty. Le I/O passe par des pipes Unix standards via `child_process`.

---

## 3. Design technique

### 3.1 Classe `TmuxSession` (remplace `ClaudeProcess`)

```typescript
// packages/agent/src/sessions/tmux-session.ts

import { spawn, execFileSync, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export class TmuxSession extends EventEmitter {
  private controller: ChildProcess | null = null;
  private tmuxSessionName: string;
  private outputParser: TmuxOutputParser;

  async start(): Promise<void> {
    // 1. Creer session tmux detachee (execFileSync = safe, pas de shell)
    execFileSync('tmux', [
      'new-session', '-d',
      '-s', this.tmuxSessionName,
      '-x', String(cols),
      '-y', String(rows),
    ]);

    // 2. Envoyer la commande claude
    const claudeCmd = [this.claudePath, ...this.buildArgs()].join(' ');
    execFileSync('tmux', ['send-keys', '-t', this.tmuxSessionName, claudeCmd, 'Enter']);

    // 3. Attacher en control mode pour I/O temps reel
    this.controller = spawn('tmux', ['-C', 'attach-session', '-t', this.tmuxSessionName], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // 4. Parser les output events
    this.controller.stdout.on('data', (chunk) => {
      this.outputParser.feed(chunk.toString());
    });

    this.controller.on('exit', (code) => {
      this.emit('exit', { exitCode: code });
    });
  }

  write(data: string): void {
    // Envoyer via send-keys en control mode (pas de spawn a chaque frappe)
    this.controller?.stdin?.write(
      `send-keys -t ${this.tmuxSessionName} -l -- ${escapeForTmux(data)}\n`
    );
  }

  resize(cols: number, rows: number): void {
    this.controller?.stdin?.write(
      `resize-window -t ${this.tmuxSessionName} -x ${cols} -y ${rows}\n`
    );
  }

  async terminate(): Promise<void> {
    this.controller?.stdin?.write(`kill-session -t ${this.tmuxSessionName}\n`);
    this.controller?.kill();
  }

  // Reattacher a une session existante (apres crash agent)
  async reattach(): Promise<void> {
    this.controller = spawn('tmux', ['-C', 'attach-session', '-t', this.tmuxSessionName], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // ... setup handlers
  }
}
```

### 3.2 Control Mode Protocol

tmux control mode (`tmux -C`) communique via stdout avec des messages structures:

```
%begin <timestamp> <flags>        -> debut de reponse a une commande
%end <timestamp> <flags>          -> fin de reponse
%output %<pane-id> <data>         -> output du terminal (ce qu'on veut!)
%session-changed $<id> <name>     -> changement de session
%window-pane-changed @<wid> %<pid>-> changement de pane
%exit                             -> session terminee
```

**Ce qui nous interesse**: `%output %<pane-id> <data>` pour le streaming terminal.

### 3.3 Parser de sortie

```typescript
// packages/agent/src/sessions/tmux-parser.ts

export class TmuxOutputParser extends EventEmitter {
  private buffer = '';

  feed(chunk: string): void {
    this.buffer += chunk;

    let newlineIdx: number;
    while ((newlineIdx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIdx);
      this.buffer = this.buffer.slice(newlineIdx + 1);
      this.parseLine(line);
    }
  }

  private parseLine(line: string): void {
    if (line.startsWith('%output ')) {
      // Format: %output %<pane-id> <data>
      const match = line.match(/^%output %(\d+) (.*)$/);
      if (match) {
        this.emit('output', { paneId: match[1], data: match[2] });
      }
    } else if (line.startsWith('%exit')) {
      this.emit('exit');
    } else if (line.startsWith('%session-changed')) {
      this.emit('session-changed', line);
    }
    // %begin/%end pour les reponses aux commandes (on peut ignorer)
  }
}
```

### 3.4 SessionManager adapte

Le `SessionManager` change peu. On remplace `ClaudeProcess` par `TmuxSession`:

```typescript
// Avant
const process = new ClaudeProcess({ claudePath, sessionId, logger, ...config });

// Apres
const session = new TmuxSession({ claudePath, sessionId, logger, ...config });
```

L'interface EventEmitter reste identique (`output`, `status`, `exit`).

### 3.5 Reattachement apres crash

**Nouveau feature**: Au demarrage, l'agent detecte les sessions tmux orphelines.

```typescript
async recoverSessions(): Promise<void> {
  // Lister les sessions tmux existantes avec prefixe claudenest-
  const { stdout } = await execFileAsync('tmux', [
    'list-sessions', '-F', '#{session_name}'
  ]);
  const orphans = stdout.split('\n')
    .filter(name => name.startsWith('cn-'))  // prefixe ClaudeNest
    .filter(name => !this.sessions.has(name));

  for (const name of orphans) {
    const session = new TmuxSession({ /* ... */ });
    await session.reattach();
    this.sessions.set(name, session);
    this.emit('sessionRecovered', { sessionId: name });
  }
}
```

---

## 4. Fichiers impactes

### Agent (`packages/agent/`)

| Fichier | Action | Detail |
|---------|--------|--------|
| `src/sessions/claude-process.ts` | **Supprimer** | Remplace par tmux-session.ts |
| `src/sessions/tmux-session.ts` | **Creer** | Nouvelle classe TmuxSession |
| `src/sessions/tmux-parser.ts` | **Creer** | Parser du control mode |
| `src/sessions/manager.ts` | **Modifier** | Utiliser TmuxSession + recoverSessions() |
| `src/types/index.ts` | **Modifier** | Ajouter types tmux, session recovery |
| `src/agent.ts` | **Modifier** | Appeler recoverSessions() au start |
| `package.json` | **Modifier** | Retirer `node-pty`, ajouter rien (child_process est natif) |

### Server (`packages/server/`)

| Fichier | Action | Detail |
|---------|--------|--------|
| `app/Console/Commands/AgentServe.php` | **Modifier** | Gerer `session:recovered` event |
| `app/Models/Machine.php` | **Modifier** | Capability `supportsTmux` |
| `resources/js/types/index.ts` | **Modifier** | Type session recovery |

---

## 5. Migration

### Phase 1: TmuxSession (remplace ClaudeProcess)

1. Creer `tmux-session.ts` avec meme interface EventEmitter
2. Creer `tmux-parser.ts` pour le control mode
3. Tests unitaires du parser
4. Modifier `manager.ts` pour utiliser TmuxSession
5. Garder `claude-process.ts` en fallback (feature flag)

### Phase 2: Session Recovery

1. Prefixe `cn-<sessionId>` pour les sessions tmux
2. `recoverSessions()` au demarrage agent
3. Notification serveur des sessions retrouvees
4. UI: indicateur "session recovered" dans le dashboard

### Phase 3: Nettoyage

1. Retirer `node-pty` de package.json
2. Retirer `claude-process.ts`
3. Retirer le feature flag
4. Mettre a jour `MachineCapabilities` (supporte tmux au lieu de PTY)
5. Republier npm (version majeure car breaking change de deps)

---

## 6. Prerequis machine

| Prerequis | Minimum | Verification |
|-----------|---------|-------------|
| tmux | >= 3.0 (control mode stable) | `tmux -V` |
| OS | Linux, macOS | `process.platform !== 'win32'` |

**Windows**: Non supporte par tmux. Garder `ClaudeProcess` (node-pty) en fallback pour Windows, ou documenter WSL2 comme requis.

---

## 7. Risques

| Risque | Probabilite | Mitigation |
|--------|-------------|------------|
| Control mode output encoding | Moyenne | Tests intensifs, fallback capture-pane |
| tmux pas installe sur la machine | Faible | Check au demarrage + message d'erreur clair |
| Fuite de sessions tmux | Moyenne | Cleanup cron + `tmux kill-server` en dernier recours |
| Incompatibilite tmux < 3.0 | Faible | Check version au demarrage |
| Windows non supporte | Faible | Fallback node-pty ou WSL2 documente |

---

## 8. Metriques de succes

| Metrique | Avant (node-pty) | Cible (tmux) |
|----------|-----------------|--------------|
| Input latency (keystroke -> echo) | A mesurer | < 50ms local |
| Deps natives a compiler | 1 (node-pty) | 0 |
| Session recovery apres crash | Impossible | Automatique |
| Taille node_modules | ~15MB (node-pty bindings) | -15MB |
| Multi-viewer meme session | Non | Oui |

---

## 9. Hors scope

- Migration du frontend (xterm.js reste)
- Changement du protocole WebSocket AgentServe <-> Agent
- Support Windows natif (garde node-pty en fallback)
- Refactoring de AgentServe.php
