<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Authentication</h1>
      <p class="lead">
        ClaudeNest supports multiple authentication methods including OAuth (Google, GitHub), 
        email/password, and API tokens for machine-to-machine communication.
      </p>
    </header>

    <section id="oauth-setup">
      <h2>OAuth Setup</h2>
      <p>Configure OAuth providers to allow users to sign in with their existing accounts.</p>

      <h3>Google OAuth</h3>
      <ol class="steps-list">
        <li>Go to the <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
        <li>Create a new project or select an existing one</li>
        <li>Navigate to "APIs & Services" → "Credentials"</li>
        <li>Click "Create Credentials" → "OAuth client ID"</li>
        <li>Configure the OAuth consent screen if not already done</li>
        <li>Select "Web application" as the application type</li>
        <li>Add your domain to "Authorized JavaScript origins"</li>
        <li>Add <code>https://yourdomain.com/api/auth/google/callback</code> to "Authorized redirect URIs"</li>
        <li>Copy the Client ID and Client Secret</li>
      </ol>

      <h3>GitHub OAuth</h3>
      <ol class="steps-list">
        <li>Go to GitHub Settings → Developer settings → OAuth Apps</li>
        <li>Click "New OAuth App"</li>
        <li>Fill in the application name and homepage URL</li>
        <li>Set Authorization callback URL to <code>https://yourdomain.com/api/auth/github/callback</code></li>
        <li>Register the application</li>
        <li>Copy the Client ID and generate a Client Secret</li>
      </ol>

      <h3>Configure Environment Variables</h3>
      <CodeBlock 
        :code="`# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://claudenest.yourdomain.com/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://claudenest.yourdomain.com/api/auth/github/callback`" 
        language="bash"
        filename=".env"
      />
    </section>

    <section id="authentication-flow">
      <h2>Authentication Flow</h2>
      
      <h3>OAuth Flow</h3>
      <div class="flow-diagram">
        <div class="flow-step">
          <span class="step-num">1</span>
          <p>Client requests auth URL</p>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <span class="step-num">2</span>
          <p>User authorizes with provider</p>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <span class="step-num">3</span>
          <p>Provider redirects with code</p>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <span class="step-num">4</span>
          <p>Server exchanges code for token</p>
        </div>
      </div>

      <h3>Step 1: Get OAuth URL</h3>
      <CodeBlock 
        code='# Get Google OAuth URL
curl https://claudenest.yourdomain.com/api/auth/google/redirect

# Response
{
  "success": true,
  "data": {
    "redirect_url": "https://accounts.google.com/o/oauth2/auth?..."
  }
}' 
        language="bash"
      />

      <h3>Step 2: Handle Callback</h3>
      <p>After the user authorizes, they are redirected to your callback URL with a code. Exchange it for a token:</p>
      <CodeBlock 
        code='# The callback is handled automatically by the server
# The user receives an API token in the response

GET /api/auth/google/callback?code=auth-code-from-google

# Response
{
  "success": true,
  "data": {
    "user": { /* user info */ },
    "token": "1|laravel_sanctum_token_here",
    "expires_at": "2026-03-04T17:00:00Z"
  }
}' 
        language="bash"
      />
    </section>

    <section id="api-tokens">
      <h2>API Tokens</h2>
      <p>Use API tokens for programmatic access and machine-to-machine communication.</p>

      <h3>Create a Personal Access Token</h3>
      <CodeBlock 
        :code="createTokenCode" 
        language="bash"
      />

      <h3>Token Abilities</h3>
      <p>Tokens can be scoped to specific abilities for security:</p>
      <ul>
        <li><code>*</code> - Full access</li>
        <li><code>machines:read</code> - Read machine information</li>
        <li><code>machines:write</code> - Create/update machines</li>
        <li><code>sessions:read</code> - Read session data</li>
        <li><code>sessions:write</code> - Create and manage sessions</li>
        <li><code>projects:read</code> - Read project data</li>
        <li><code>projects:write</code> - Create and manage projects</li>
      </ul>

      <h3>Using Tokens</h3>
      <p>Include the token in the Authorization header:</p>
      <CodeBlock 
        :code="useTokenCode" 
        language="bash"
      />

      <h3>List and Revoke Tokens</h3>
      <CodeBlock 
        :code="listRevokeTokensCode" 
        language="bash"
      />
    </section>

    <section id="machine-tokens">
      <h2>Machine Tokens</h2>
      <p>Machine tokens are used by the agent to authenticate with the server.</p>

      <h3>Register a Machine</h3>
      <CodeBlock 
        :code="registerMachineCode" 
        language="bash"
      />

      <h3>Regenerate Machine Token</h3>
      <p>If a machine token is compromised, regenerate it:</p>
      <CodeBlock 
        :code="regenerateTokenCode" 
        language="bash"
      />
    </section>

    <section id="security">
      <h2>Security Best Practices</h2>
      
      <div class="security-tips">
        <div class="tip">
          <span class="tip-icon">🔒</span>
          <div>
            <h4>Use HTTPS</h4>
            <p>Always use HTTPS in production to protect tokens in transit</p>
          </div>
        </div>
        
        <div class="tip">
          <span class="tip-icon">⏱️</span>
          <div>
            <h4>Set Token Expiration</h4>
            <p>Use short-lived tokens and implement token rotation</p>
          </div>
        </div>
        
        <div class="tip">
          <span class="tip-icon">🎯</span>
          <div>
            <h4>Scope Your Tokens</h4>
            <p>Only grant the minimum required abilities for each token</p>
          </div>
        </div>
        
        <div class="tip">
          <span class="tip-icon">🔍</span>
          <div>
            <h4>Monitor Token Usage</h4>
            <p>Regularly review and revoke unused tokens</p>
          </div>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import CodeBlock from '@/components/docs/CodeBlock.vue';

const createTokenCode = `curl -X POST https://claudenest.yourdomain.com/api/auth/tokens \\
  -H 'Authorization: Bearer your-existing-token' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "CLI Tool Token",
    "abilities": ["machines:read", "sessions:write"],
    "expires_in_days": 90
  }'`;

const useTokenCode = `curl https://claudenest.yourdomain.com/api/machines \\
  -H 'Authorization: Bearer your-api-token' \\
  -H 'Accept: application/json'`;

const listRevokeTokensCode = `# List all tokens
curl https://claudenest.yourdomain.com/api/auth/tokens \\
  -H 'Authorization: Bearer your-token'

# Revoke a token
curl -X DELETE https://claudenest.yourdomain.com/api/auth/tokens/123 \\
  -H 'Authorization: Bearer your-token'`;

const registerMachineCode = `curl -X POST https://claudenest.yourdomain.com/api/machines \\
  -H 'Authorization: Bearer your-user-token' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "MacBook-Pro-Work",
    "platform": "darwin",
    "hostname": "macbook-pro.local",
    "capabilities": ["claude_code", "git", "docker"]
  }'`;

const regenerateTokenCode = `curl -X POST https://claudenest.yourdomain.com/api/machines/123/regenerate-token \\
  -H 'Authorization: Bearer your-user-token'`;
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

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  color: #ffffff;
}

p {
  color: #a9b1d6;
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul, ol {
  color: #a9b1d6;
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

a {
  color: #a855f7;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Steps List */
.steps-list {
  counter-reset: step;
  list-style: none;
  padding: 0;
}

.steps-list li {
  position: relative;
  padding-left: 2.5rem;
  margin-bottom: 1rem;
}

.steps-list li::before {
  counter-increment: step;
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #ffffff;
}

/* Flow Diagram */
.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.flow-step {
  text-align: center;
  padding: 0.75rem;
}

.flow-step .step-num {
  width: 32px;
  height: 32px;
  background: rgba(168, 85, 247, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #a855f7;
  margin: 0 auto 0.5rem;
}

.flow-step p {
  font-size: 0.85rem;
  margin: 0;
  color: #a9b1d6;
}

.flow-arrow {
  color: #64748b;
  font-size: 1.5rem;
}

/* Security Tips */
.security-tips {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.tip-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tip h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.tip p {
  margin: 0;
  font-size: 0.9rem;
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
  
  .flow-diagram {
    flex-direction: column;
  }
  
  .flow-arrow {
    transform: rotate(90deg);
  }
}
</style>
