/**
 * OAuth message handlers
 *
 * Implements the Agent-Relay OAuth flow:
 * 1. Backend sends 'oauth:start' with credentialId + clientId
 * 2. Agent generates PKCE, starts a temporary HTTP server on localhost
 * 3. Agent sends auth URL back to backend via 'oauth:auth-url'
 * 4. User authorizes in browser popup → redirected to localhost callback
 * 5. Agent captures code, exchanges for tokens, sends to backend via 'oauth:tokens'
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';
import { randomBytes, createHash } from 'crypto';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';

interface HandlerContext {
  wsClient: WebSocketClient;
  logger: Logger;
}

interface OAuthStartPayload {
  credentialId: string;
  clientId: string;
}

const OAUTH_AUTHORIZE_URL = 'https://claude.ai/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://platform.claude.com/v1/oauth/token';
const OAUTH_SCOPE = 'user:inference';
const PORT_MIN = 49152;
const PORT_MAX = 65535;
const SERVER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const verifierBytes = randomBytes(32);
  const codeVerifier = verifierBytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const challengeHash = createHash('sha256').update(codeVerifier).digest('base64');
  const codeChallenge = challengeHash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { codeVerifier, codeChallenge };
}

function randomPort(): number {
  return PORT_MIN + Math.floor(Math.random() * (PORT_MAX - PORT_MIN));
}

function tryListen(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(err);
      } else {
        reject(err);
      }
    });
    server.listen(port, '127.0.0.1', () => resolve(port));
  });
}

async function startServerOnRandomPort(server: Server, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await tryListen(server, randomPort());
    } catch {
      // Port in use, try another
    }
  }
  throw new Error('Could not find an available port after multiple attempts');
}

async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    let detail: string;
    try {
      const json = JSON.parse(text);
      detail = json.error_description || json.error || text;
    } catch {
      detail = text;
    }
    throw new Error(`Token exchange failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }>;
}

const SUCCESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ClaudeNest</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f1a; color: #c0caf5; }
  .card { text-align: center; padding: 2rem; }
  .check { font-size: 3rem; margin-bottom: 1rem; }
  h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
  p { color: #6b7280; font-size: 0.875rem; }
</style></head>
<body><div class="card">
  <div class="check">&#10003;</div>
  <h1>Connected to ClaudeNest!</h1>
  <p>You can close this window.</p>
</div>
<script>setTimeout(function(){window.close()},2000)</script>
</body></html>`;

const ERROR_HTML = (msg: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ClaudeNest - Error</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f1a; color: #c0caf5; }
  .card { text-align: center; padding: 2rem; max-width: 400px; }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #ef4444; }
  p { color: #6b7280; font-size: 0.875rem; }
</style></head>
<body><div class="card">
  <div class="icon">&#10007;</div>
  <h1>Connection Failed</h1>
  <p>${msg}</p>
</div></body></html>`;

export function createOAuthHandlers(context: HandlerContext) {
  const { wsClient, logger } = context;

  // Track active OAuth servers to allow cleanup
  const activeServers = new Map<string, Server>();

  async function handleOAuthStart(payload: OAuthStartPayload): Promise<void> {
    const { credentialId, clientId } = payload;
    logger.info({ credentialId }, 'Starting OAuth relay flow');

    // Clean up any existing server for this credential
    const existing = activeServers.get(credentialId);
    if (existing) {
      existing.close();
      activeServers.delete(credentialId);
    }

    const { codeVerifier, codeChallenge } = generatePKCE();
    const state = randomBytes(20).toString('hex');

    let resolved = false;

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (resolved) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(SUCCESS_HTML);
        return;
      }

      const url = new URL(req.url || '/', `http://127.0.0.1`);

      if (url.pathname !== '/oauth/callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        resolved = true;
        logger.warn({ credentialId, error }, 'OAuth authorization denied by user');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML(error));

        wsClient.send('oauth:error', { credentialId, error });
        cleanup();
        return;
      }

      if (!code || returnedState !== state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('Invalid callback parameters'));
        return;
      }

      resolved = true;
      const port = (server.address() as { port: number })?.port;
      const redirectUri = `http://localhost:${port}/oauth/callback`;

      // Exchange code for tokens
      exchangeCodeForTokens(code, clientId, codeVerifier, redirectUri)
        .then((tokens) => {
          logger.info({ credentialId }, 'OAuth tokens obtained successfully');

          wsClient.send('oauth:tokens', {
            credentialId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresIn: tokens.expires_in || null,
          });

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(SUCCESS_HTML);
          cleanup();
        })
        .catch((err) => {
          logger.error({ credentialId, err }, 'OAuth token exchange failed');

          wsClient.send('oauth:error', {
            credentialId,
            error: err instanceof Error ? err.message : 'Token exchange failed',
          });

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML('Token exchange failed. Please try again.'));
          cleanup();
        });
    });

    function cleanup(): void {
      activeServers.delete(credentialId);
      // Give the response time to flush before closing
      setTimeout(() => {
        server.close();
      }, 1000);
    }

    try {
      const port = await startServerOnRandomPort(server);
      activeServers.set(credentialId, server);

      const redirectUri = `http://localhost:${port}/oauth/callback`;

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: OAUTH_SCOPE,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;

      logger.info({ credentialId, port }, 'OAuth relay server started');

      wsClient.send('oauth:auth-url', { credentialId, authUrl });

      // Auto-close after timeout
      setTimeout(() => {
        if (activeServers.has(credentialId)) {
          logger.warn({ credentialId }, 'OAuth relay server timed out');
          wsClient.send('oauth:error', {
            credentialId,
            error: 'OAuth flow timed out (5 minutes)',
          });
          activeServers.delete(credentialId);
          server.close();
        }
      }, SERVER_TIMEOUT_MS);
    } catch (err) {
      logger.error({ credentialId, err }, 'Failed to start OAuth relay server');

      wsClient.send('oauth:error', {
        credentialId,
        error: err instanceof Error ? err.message : 'Failed to start OAuth server',
      });
    }
  }

  return {
    'oauth:start': handleOAuthStart,
  };
}
