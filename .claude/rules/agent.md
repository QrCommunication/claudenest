# Règles Agent - Node.js

## Stack Technique
- Node.js 20 LTS
- TypeScript 5.x (strict)
- ws (WebSocket)
- node-pty
- keytar (secure storage)
- pino (logging)

## Standards de Code

### Architecture
```typescript
// Main Agent Class
export class ClaudeRemoteAgent extends EventEmitter {
  private wsClient: WebSocketClient;
  private sessionManager: SessionManager;
  
  async start(): Promise<void> {
    // Initialize
    await this.discovery.initialize();
    await this.contextClient.initialize();
    await this.wsClient.connect();
    
    this.emit('started');
  }
  
  async stop(): Promise<void> {
    // Cleanup
    await this.sessionManager.terminateAll();
    await this.wsClient.disconnect();
    
    this.emit('stopped');
  }
}
```

### WebSocket
- Reconnection automatique avec backoff exponentiel
- Heartbeat toutes les 30s
- Queue des messages pendant déconnexion
- Compression permessage-deflate

### PTY (node-pty)
- xterm-256color
- Gestion des résizes (SIGWINCH)
- Buffer circulaire 10MB
- Streaming chunké (16ms)

### Logging (pino)
- Structured logging
- Levels: debug, info, warn, error
- Rotation des logs
- Pas de logs sensibles

## Patterns Interdits
- ❌ Pas de `any` dans TypeScript
- ❌ Pas de console.log (utiliser pino)
- ❌ Pas de données sensibles dans les logs
- ❌ Pas de blocage du event loop

## Sécurité
- Token stocké dans OS keychain
- TLS 1.3 obligatoire
- Certificate validation
- No credential exposure
