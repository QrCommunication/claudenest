<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsAuthentication.title') }}</h1>
      <p class="lead">
        {{ $t('docDocsAuthentication.lead') }}
      </p>
    </header>

    <section id="oauth-setup">
      <h2>{{ $t('docDocsAuthentication.oauthSetupTitle') }}</h2>
      <p>{{ $t('docDocsAuthentication.oauthSetupIntro') }}</p>

      <h3>{{ $t('docDocsAuthentication.googleOauthTitle') }}</h3>
      <ol class="steps-list">
        <li>{{ $t('docDocsAuthentication.googleStep1Prefix') }} <a href="https://console.cloud.google.com/" target="_blank">{{ $t('docDocsAuthentication.googleCloudConsole') }}</a></li>
        <li>{{ $t('docDocsAuthentication.googleStep2') }}</li>
        <li>{{ $t('docDocsAuthentication.googleStep3') }}</li>
        <li>{{ $t('docDocsAuthentication.googleStep4') }}</li>
        <li>{{ $t('docDocsAuthentication.googleStep5') }}</li>
        <li>{{ $t('docDocsAuthentication.googleStep6') }}</li>
        <li>{{ $t('docDocsAuthentication.googleStep7') }}</li>
        <li>{{ $t('docDocsAuthentication.googleStep8Prefix') }} <code>https://yourdomain.com/api/auth/google/callback</code> {{ $t('docDocsAuthentication.googleStep8Suffix') }}</li>
        <li>{{ $t('docDocsAuthentication.googleStep9') }}</li>
      </ol>

      <h3>{{ $t('docDocsAuthentication.githubOauthTitle') }}</h3>
      <ol class="steps-list">
        <li>{{ $t('docDocsAuthentication.githubStep1') }}</li>
        <li>{{ $t('docDocsAuthentication.githubStep2') }}</li>
        <li>{{ $t('docDocsAuthentication.githubStep3') }}</li>
        <li>{{ $t('docDocsAuthentication.githubStep4Prefix') }} <code>https://yourdomain.com/api/auth/github/callback</code></li>
        <li>{{ $t('docDocsAuthentication.githubStep5') }}</li>
        <li>{{ $t('docDocsAuthentication.githubStep6') }}</li>
      </ol>

      <h3>{{ $t('docDocsAuthentication.configureEnvTitle') }}</h3>
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
      <h2>{{ $t('docDocsAuthentication.authFlowTitle') }}</h2>

      <h3>{{ $t('docDocsAuthentication.oauthFlowTitle') }}</h3>
      <div class="flow-diagram">
        <div class="flow-step">
          <span class="step-num">1</span>
          <p>{{ $t('docDocsAuthentication.flowStep1') }}</p>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <span class="step-num">2</span>
          <p>{{ $t('docDocsAuthentication.flowStep2') }}</p>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <span class="step-num">3</span>
          <p>{{ $t('docDocsAuthentication.flowStep3') }}</p>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <span class="step-num">4</span>
          <p>{{ $t('docDocsAuthentication.flowStep4') }}</p>
        </div>
      </div>

      <h3>{{ $t('docDocsAuthentication.step1Title') }}</h3>
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

      <h3>{{ $t('docDocsAuthentication.step2Title') }}</h3>
      <p>{{ $t('docDocsAuthentication.step2Intro') }}</p>
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
      <h2>{{ $t('docDocsAuthentication.apiTokensTitle') }}</h2>
      <p>{{ $t('docDocsAuthentication.apiTokensIntro') }}</p>

      <h3>{{ $t('docDocsAuthentication.createPatTitle') }}</h3>
      <CodeBlock
        :code="createTokenCode"
        language="bash"
      />

      <h3>{{ $t('docDocsAuthentication.tokenAbilitiesTitle') }}</h3>
      <p>{{ $t('docDocsAuthentication.tokenAbilitiesIntro') }}</p>
      <ul>
        <li><code>*</code> - {{ $t('docDocsAuthentication.abilityFull') }}</li>
        <li><code>machines:read</code> - {{ $t('docDocsAuthentication.abilityMachinesRead') }}</li>
        <li><code>machines:write</code> - {{ $t('docDocsAuthentication.abilityMachinesWrite') }}</li>
        <li><code>sessions:read</code> - {{ $t('docDocsAuthentication.abilitySessionsRead') }}</li>
        <li><code>sessions:write</code> - {{ $t('docDocsAuthentication.abilitySessionsWrite') }}</li>
        <li><code>projects:read</code> - {{ $t('docDocsAuthentication.abilityProjectsRead') }}</li>
        <li><code>projects:write</code> - {{ $t('docDocsAuthentication.abilityProjectsWrite') }}</li>
      </ul>

      <h3>{{ $t('docDocsAuthentication.usingTokensTitle') }}</h3>
      <p>{{ $t('docDocsAuthentication.usingTokensIntro') }}</p>
      <CodeBlock 
        :code="useTokenCode" 
        language="bash"
      />

      <h3>{{ $t('docDocsAuthentication.listRevokeTitle') }}</h3>
      <CodeBlock 
        :code="listRevokeTokensCode" 
        language="bash"
      />
    </section>

    <section id="machine-tokens">
      <h2>{{ $t('docDocsAuthentication.machineTokensTitle') }}</h2>
      <p>{{ $t('docDocsAuthentication.machineTokensIntro') }}</p>

      <h3>{{ $t('docDocsAuthentication.registerMachineTitle') }}</h3>
      <CodeBlock
        :code="registerMachineCode"
        language="bash"
      />

      <h3>{{ $t('docDocsAuthentication.regenerateTokenTitle') }}</h3>
      <p>{{ $t('docDocsAuthentication.regenerateTokenIntro') }}</p>
      <CodeBlock 
        :code="regenerateTokenCode" 
        language="bash"
      />
    </section>

    <section id="magic-link">
      <h2>{{ $t('docDocsAuthentication.magicLinkTitle') }}</h2>
      <p>
        {{ $t('docDocsAuthentication.magicLinkIntro') }}
      </p>

      <h3>{{ $t('docDocsAuthentication.requestMagicLinkTitle') }}</h3>
      <CodeBlock
        :code="magicLinkCode"
        language="bash"
      />

      <p>
        {{ $t('docDocsAuthentication.magicLinkExplain') }}
      </p>
    </section>

    <section id="credentials">
      <h2>{{ $t('docDocsAuthentication.credentialsTitle') }}</h2>
      <p>
        {{ $t('docDocsAuthentication.credentialsIntroPrefix') }} <code>Crypt::encryptString()</code>.
        {{ $t('docDocsAuthentication.credentialsIntroSuffix') }}
      </p>

      <h3>{{ $t('docDocsAuthentication.supportedAuthTypesTitle') }}</h3>
      <ul>
        <li><code>api_key</code> - {{ $t('docDocsAuthentication.authTypeApiKey') }}</li>
        <li><code>oauth</code> - {{ $t('docDocsAuthentication.authTypeOauth') }}</li>
      </ul>

      <h3>{{ $t('docDocsAuthentication.createCredentialTitle') }}</h3>
      <CodeBlock
        :code="createCredentialCode"
        language="bash"
      />

      <h3>{{ $t('docDocsAuthentication.setDefaultCredentialTitle') }}</h3>
      <CodeBlock
        :code="setDefaultCredentialCode"
        language="bash"
      />

      <h3>{{ $t('docDocsAuthentication.validateKeyTitle') }}</h3>
      <p>{{ $t('docDocsAuthentication.validateKeyIntro') }}</p>
      <CodeBlock
        :code="validateCredentialCode"
        language="bash"
      />

      <p>
        {{ $t('docDocsAuthentication.credentialsBindingPrefix') }} <code>credential_id</code>
        {{ $t('docDocsAuthentication.credentialsBindingSuffix') }}
      </p>
    </section>

    <section id="security">
      <h2>{{ $t('docDocsAuthentication.securityTitle') }}</h2>

      <div class="security-tips">
        <div class="tip">
          <span class="tip-icon">🔒</span>
          <div>
            <h4>{{ $t('docDocsAuthentication.tipHttpsTitle') }}</h4>
            <p>{{ $t('docDocsAuthentication.tipHttpsText') }}</p>
          </div>
        </div>

        <div class="tip">
          <span class="tip-icon">⏱️</span>
          <div>
            <h4>{{ $t('docDocsAuthentication.tipExpirationTitle') }}</h4>
            <p>{{ $t('docDocsAuthentication.tipExpirationText') }}</p>
          </div>
        </div>

        <div class="tip">
          <span class="tip-icon">🎯</span>
          <div>
            <h4>{{ $t('docDocsAuthentication.tipScopeTitle') }}</h4>
            <p>{{ $t('docDocsAuthentication.tipScopeText') }}</p>
          </div>
        </div>

        <div class="tip">
          <span class="tip-icon">🔍</span>
          <div>
            <h4>{{ $t('docDocsAuthentication.tipMonitorTitle') }}</h4>
            <p>{{ $t('docDocsAuthentication.tipMonitorText') }}</p>
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

const magicLinkCode = `# Request a magic link
curl -X POST https://claudenest.yourdomain.com/api/auth/magic-link \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "user@example.com"
  }'

# Response
{
  "success": true,
  "data": {
    "message": "Magic link sent to user@example.com",
    "expires_in": 900
  }
}`;

const createCredentialCode = `curl -X POST https://claudenest.yourdomain.com/api/credentials \\
  -H 'Authorization: Bearer your-user-token' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Production API Key",
    "auth_type": "api_key",
    "api_key": "sk-ant-api03-your-key-here",
    "is_default": true
  }'

# Response
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "name": "Production API Key",
    "auth_type": "api_key",
    "is_default": true,
    "token_status": "active"
  }
}`;

const setDefaultCredentialCode = `curl -X POST https://claudenest.yourdomain.com/api/credentials/550e8400-.../set-default \\
  -H 'Authorization: Bearer your-user-token'`;

const validateCredentialCode = `curl -X POST https://claudenest.yourdomain.com/api/credentials/550e8400-.../validate \\
  -H 'Authorization: Bearer your-user-token'

# Response
{
  "success": true,
  "data": {
    "valid": true,
    "token_status": "active"
  }
}`;
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

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
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

a {
  color: var(--accent-purple, #a855f7);
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
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Flow Diagram */
.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
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
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--accent-purple, #a855f7);
  margin: 0 auto 0.5rem;
}

.flow-step p {
  font-size: 0.85rem;
  margin: 0;
  color: var(--text-secondary);
}

.flow-arrow {
  color: var(--text-muted);
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
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
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
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
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
