<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Credential Management</h1>
      <p class="lead">
        Securely manage Claude API keys and OAuth tokens. Credentials are encrypted
        at rest with AES-256-CBC and can be bound to specific sessions for fine-grained
        access control.
      </p>
    </header>

    <section id="overview">
      <h2>Overview</h2>
      <p>
        ClaudeNest stores credentials in an encrypted format so that raw secrets never
        appear in logs, API responses, or database exports. Two credential types are
        supported:
      </p>
      <ul>
        <li>
          <strong>API Key</strong> &mdash; A static Claude API key that is stored
          encrypted and decrypted only when the agent needs it to start a session.
        </li>
        <li>
          <strong>OAuth Token</strong> &mdash; An access / refresh token pair. The
          server handles automatic token refresh before expiration.
        </li>
      </ul>

      <div class="encryption-note">
        <span class="note-icon">&#128274;</span>
        <div>
          <strong>Encryption details</strong>
          <p>
            All sensitive fields (<code>api_key</code>, <code>oauth_token</code>,
            <code>oauth_refresh_token</code>) are encrypted with Laravel's
            <code>Crypt::encryptString()</code> which uses <strong>AES-256-CBC</strong>
            with the application key. Encrypted values are never returned in API
            responses.
          </p>
        </div>
      </div>
    </section>

    <section id="api-keys">
      <h2>Storing API Keys</h2>
      <p>
        Create a credential of type <code>api_key</code> to store a Claude API key.
        The key is encrypted before being written to the database.
      </p>

      <CodeTabs :tabs="createApiKeyTabs" />

      <p>The response confirms creation but <strong>never</strong> returns the raw key:</p>

      <CodeBlock
        :code="createApiKeyResponse"
        language="json"
        filename="Response (201)"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        You can validate that a stored key is still accepted by the Claude API using the
        <code>/validate</code> endpoint, which performs a lightweight test request.
      </p>

      <CodeBlock
        :code="validateKeyCode"
        language="bash"
        filename="Validate"
      />
    </section>

    <section id="oauth-tokens">
      <h2>OAuth Tokens</h2>
      <p>
        For OAuth-based authentication, store both the access token and the refresh
        token. ClaudeNest will automatically refresh expired tokens in the background.
      </p>

      <CodeTabs :tabs="createOAuthTabs" />

      <CodeBlock
        :code="createOAuthResponse"
        language="json"
        filename="Response (201)"
      />

      <h3>Refreshing Tokens</h3>
      <p>
        The server automatically refreshes tokens before they expire. You can also
        trigger a manual refresh:
      </p>

      <CodeBlock
        :code="refreshTokenCode"
        language="bash"
        filename="Manual Refresh"
      />

      <h3>Token Statuses</h3>
      <ul>
        <li><code>active</code> &mdash; Token is valid and ready for use</li>
        <li><code>expired</code> &mdash; Token has expired; will be refreshed automatically if a refresh token exists</li>
        <li><code>revoked</code> &mdash; Token was manually revoked and cannot be used</li>
      </ul>
    </section>

    <section id="default-credential">
      <h2>Default Credential</h2>
      <p>
        Each user can mark one credential as the <strong>default</strong>. When a session
        is created without an explicit <code>credential_id</code>, the default credential
        is used automatically.
      </p>

      <CodeTabs :tabs="setDefaultTabs" />

      <CodeBlock
        :code="setDefaultResponse"
        language="json"
        filename="Response"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Setting a new default automatically removes the default flag from the previous
        credential. Only one credential per user can be the default at any time.
      </p>
    </section>

    <section id="session-binding">
      <h2>Binding Credentials to Sessions</h2>
      <p>
        When creating a session you can optionally pass a <code>credential_id</code> to
        override the default credential. This is useful when different projects require
        different API keys or organizational accounts.
      </p>

      <CodeTabs :tabs="sessionBindingTabs" />

      <p>
        The session object reflects the bound credential (ID only, never the secret):
      </p>

      <CodeBlock
        :code="sessionBindingResponse"
        language="json"
        filename="Response"
      />

      <h3>Credential Lifecycle with Sessions</h3>
      <ol>
        <li>Session is created with an explicit or default credential</li>
        <li>The agent requests the decrypted key from the server via a secure channel</li>
        <li>The key is injected into the Claude Code process environment</li>
        <li>When the session ends, the key is wiped from the agent's memory</li>
      </ol>
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps">
        <router-link to="/docs/api/credentials" class="next-step">
          <strong>Credentials API Reference</strong>
          <span>Full endpoint documentation for credential management &#8594;</span>
        </router-link>
        <router-link to="/docs/authentication" class="next-step">
          <strong>Authentication Guide</strong>
          <span>OAuth setup and API token management &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/agent-setup" class="next-step">
          <strong>Agent Setup</strong>
          <span>Install and configure the ClaudeNest agent &#8594;</span>
        </router-link>
        <router-link to="/docs/api/sessions" class="next-step">
          <strong>Sessions API</strong>
          <span>Create sessions with credential binding &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

// --- API Key Creation ---

const createApiKeyTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/credentials \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Production API Key",
    "auth_type": "api_key",
    "api_key": "sk-ant-api03-xxxxxxxxxxxxxxxxxxxx",
    "is_default": true
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/credentials',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Production API Key',
      auth_type: 'api_key',
      api_key: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxx',
      is_default: true,
    }),
  }
);
const credential = await response.json();
console.log(credential.data.id);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$credential = Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/credentials', [
        'name' => 'Production API Key',
        'auth_type' => 'api_key',
        'api_key' => 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxx',
        'is_default' => true,
    ])['data'];`,
  },
]);

const createApiKeyResponse = ref(`{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Production API Key",
    "auth_type": "api_key",
    "token_status": "active",
    "is_default": true,
    "last_used_at": null,
    "last_validated_at": null,
    "created_at": "2026-02-17T10:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:00:00Z",
    "request_id": "req_cred_01"
  }
}`);

const validateKeyCode = ref(`curl -X POST https://claudenest.yourdomain.com/api/credentials/CREDENTIAL_ID/validate \\
  -H 'Authorization: Bearer YOUR_TOKEN'

# Response: { "success": true, "data": { "valid": true, "last_validated_at": "..." } }`);

// --- OAuth Token Creation ---

const createOAuthTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/credentials \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Team OAuth Token",
    "auth_type": "oauth",
    "oauth_token": "oa-xxxxxxxxxxxxxxxxxxxx",
    "oauth_refresh_token": "rt-xxxxxxxxxxxxxxxxxxxx",
    "oauth_expires_at": "2026-03-17T10:00:00Z"
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/credentials',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Team OAuth Token',
      auth_type: 'oauth',
      oauth_token: 'oa-xxxxxxxxxxxxxxxxxxxx',
      oauth_refresh_token: 'rt-xxxxxxxxxxxxxxxxxxxx',
      oauth_expires_at: '2026-03-17T10:00:00Z',
    }),
  }
);
const credential = await response.json();
console.log(credential.data.id);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$credential = Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/credentials', [
        'name' => 'Team OAuth Token',
        'auth_type' => 'oauth',
        'oauth_token' => 'oa-xxxxxxxxxxxxxxxxxxxx',
        'oauth_refresh_token' => 'rt-xxxxxxxxxxxxxxxxxxxx',
        'oauth_expires_at' => '2026-03-17T10:00:00Z',
    ])['data'];`,
  },
]);

const createOAuthResponse = ref(`{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "name": "Team OAuth Token",
    "auth_type": "oauth",
    "token_status": "active",
    "is_default": false,
    "oauth_expires_at": "2026-03-17T10:00:00Z",
    "created_at": "2026-02-17T10:05:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:05:00Z",
    "request_id": "req_cred_02"
  }
}`);

const refreshTokenCode = ref(`curl -X POST https://claudenest.yourdomain.com/api/credentials/CREDENTIAL_ID/refresh \\
  -H 'Authorization: Bearer YOUR_TOKEN'

# Response: { "success": true, "data": { "token_status": "active", "oauth_expires_at": "2026-04-17T10:00:00Z" } }`);

// --- Default Credential ---

const setDefaultTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/credentials/CREDENTIAL_ID/set-default \\
  -H 'Authorization: Bearer YOUR_TOKEN'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `await fetch(
  'https://claudenest.yourdomain.com/api/credentials/CREDENTIAL_ID/set-default',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  }
);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/credentials/CREDENTIAL_ID/set-default');`,
  },
]);

const setDefaultResponse = ref(`{
  "success": true,
  "data": {
    "id": "CREDENTIAL_ID",
    "name": "Production API Key",
    "is_default": true,
    "token_status": "active"
  },
  "meta": {
    "timestamp": "2026-02-17T10:10:00Z",
    "request_id": "req_default_01"
  }
}`);

// --- Session Binding ---

const sessionBindingTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "mode": "interactive",
    "project_path": "/home/user/myproject",
    "credential_id": "550e8400-e29b-41d4-a716-446655440011"
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'interactive',
      project_path: '/home/user/myproject',
      credential_id: '550e8400-e29b-41d4-a716-446655440011',
    }),
  }
);
const session = await response.json();
console.log(session.data.credential_id);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$session = Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions', [
        'mode' => 'interactive',
        'project_path' => '/home/user/myproject',
        'credential_id' => '550e8400-e29b-41d4-a716-446655440011',
    ])['data'];`,
  },
]);

const sessionBindingResponse = ref(`{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "machine_id": "MACHINE_ID",
    "mode": "interactive",
    "project_path": "/home/user/myproject",
    "credential_id": "550e8400-e29b-41d4-a716-446655440011",
    "status": "created",
    "created_at": "2026-02-17T10:15:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:15:00Z",
    "request_id": "req_session_01"
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

ul, ol {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Encryption Note */
.encryption-note {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.note-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.encryption-note strong {
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.encryption-note p {
  margin: 0;
  font-size: 0.95rem;
}

/* Tip */
.tip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 10px;
  margin: 1rem 0;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip p {
  margin: 0;
  font-size: 0.95rem;
}

/* Next Steps */
.next-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.next-step {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.next-step:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
}

.next-step strong {
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.next-step span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.next-step:hover span {
  color: var(--text-secondary);
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .encryption-note {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
