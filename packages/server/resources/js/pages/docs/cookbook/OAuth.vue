<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ t('docDocsCookbookOauth.title') }}</h1>
      <p class="lead">
        {{ t('docDocsCookbookOauth.lead') }}
      </p>
    </header>

    <section id="providers">
      <h2>{{ t('docDocsCookbookOauth.supportedProvidersHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsCookbookOauth.supportedProvidersIntro" tag="span">
          <template #socialite><strong>Laravel Socialite</strong></template>
        </i18n-t>
      </p>

      <div class="providers-grid">
        <div class="provider-card">
          <div class="provider-icon google">G</div>
          <div>
            <h4>{{ t('docDocsCookbookOauth.googleName') }}</h4>
            <p>{{ t('docDocsCookbookOauth.googleDesc') }}</p>
            <ul>
              <li>{{ t('docDocsCookbookOauth.oauth2Protocol') }}</li>
              <li>{{ t('docDocsCookbookOauth.googleRequires') }}</li>
              <li><i18n-t keypath="docDocsCookbookOauth.googleScopes" tag="span"><template #openid><code>openid</code></template><template #email><code>email</code></template><template #profile><code>profile</code></template></i18n-t></li>
            </ul>
          </div>
        </div>
        <div class="provider-card">
          <div class="provider-icon github">GH</div>
          <div>
            <h4>{{ t('docDocsCookbookOauth.githubName') }}</h4>
            <p>{{ t('docDocsCookbookOauth.githubDesc') }}</p>
            <ul>
              <li>{{ t('docDocsCookbookOauth.oauth2Protocol') }}</li>
              <li>{{ t('docDocsCookbookOauth.githubRequires') }}</li>
              <li><i18n-t keypath="docDocsCookbookOauth.githubScopes" tag="span"><template #userEmail><code>user:email</code></template><template #readUser><code>read:user</code></template></i18n-t></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="google-setup">
      <h2>{{ t('docDocsCookbookOauth.googleSetupHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookOauth.googleSetupIntro') }}
      </p>

      <ol class="steps-list">
        <li><i18n-t keypath="docDocsCookbookOauth.googleStep1" tag="span"><template #link><a href="https://console.cloud.google.com/" target="_blank">{{ t('docDocsCookbookOauth.googleCloudConsole') }}</a></template></i18n-t></li>
        <li>{{ t('docDocsCookbookOauth.googleStep2') }}</li>
        <li>{{ t('docDocsCookbookOauth.googleStep3') }}</li>
        <li>{{ t('docDocsCookbookOauth.googleStep4') }}</li>
        <li>{{ t('docDocsCookbookOauth.googleStep5') }}</li>
        <li>{{ t('docDocsCookbookOauth.googleStep6') }}</li>
        <li>{{ t('docDocsCookbookOauth.googleStep7') }}</li>
        <li>{{ t('docDocsCookbookOauth.googleStep8') }}</li>
        <li>{{ t('docDocsCookbookOauth.googleStep9') }}</li>
      </ol>

      <h3>{{ t('docDocsCookbookOauth.environmentConfiguration') }}</h3>
      <CodeBlock :code="googleEnvCode" language="bash" filename=".env" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ t('docDocsCookbookOauth.callbackUrlFormatHeading') }}</h4>
          <p>
            <i18n-t keypath="docDocsCookbookOauth.callbackUrlFormatBody" tag="span">
              <template #path><code>/api/auth/google/callback</code></template>
            </i18n-t>
          </p>
        </div>
      </div>
    </section>

    <section id="github-setup">
      <h2>{{ t('docDocsCookbookOauth.githubSetupHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookOauth.githubSetupIntro') }}
      </p>

      <ol class="steps-list">
        <li>{{ t('docDocsCookbookOauth.githubStep1') }}</li>
        <li>{{ t('docDocsCookbookOauth.githubStep2') }}</li>
        <li>{{ t('docDocsCookbookOauth.githubStep3') }}</li>
        <li>{{ t('docDocsCookbookOauth.githubStep4') }}</li>
        <li>{{ t('docDocsCookbookOauth.githubStep5') }}</li>
        <li>{{ t('docDocsCookbookOauth.githubStep6') }}</li>
        <li>{{ t('docDocsCookbookOauth.githubStep7') }}</li>
      </ol>

      <h3>{{ t('docDocsCookbookOauth.environmentConfiguration') }}</h3>
      <CodeBlock :code="githubEnvCode" language="bash" filename=".env" />
    </section>

    <section id="flow">
      <h2>{{ t('docDocsCookbookOauth.flowHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookOauth.flowIntro') }}
      </p>

      <div class="flow-diagram">
        <div class="flow-step">
          <span class="step-num">1</span>
          <p>{{ t('docDocsCookbookOauth.flowStep1') }}</p>
        </div>
        <div class="flow-arrow">-></div>
        <div class="flow-step">
          <span class="step-num">2</span>
          <p>{{ t('docDocsCookbookOauth.flowStep2') }}</p>
        </div>
        <div class="flow-arrow">-></div>
        <div class="flow-step">
          <span class="step-num">3</span>
          <p>{{ t('docDocsCookbookOauth.flowStep3') }}</p>
        </div>
        <div class="flow-arrow">-></div>
        <div class="flow-step">
          <span class="step-num">4</span>
          <p>{{ t('docDocsCookbookOauth.flowStep4') }}</p>
        </div>
      </div>

      <h3>{{ t('docDocsCookbookOauth.step1Heading') }}</h3>
      <p>{{ t('docDocsCookbookOauth.step1Body') }}</p>
      <CodeTabs :tabs="initiateOAuthTabs" />

      <h3>{{ t('docDocsCookbookOauth.step2Heading') }}</h3>
      <p>
        {{ t('docDocsCookbookOauth.step2Body') }}
      </p>
      <CodeBlock :code="callbackCode" language="bash" />

      <h3>{{ t('docDocsCookbookOauth.step3Heading') }}</h3>
      <p>
        {{ t('docDocsCookbookOauth.step3Body') }}
      </p>
      <CodeBlock :code="useTokenCode" language="typescript" filename="api-client.ts" />

      <h3>{{ t('docDocsCookbookOauth.controllerHeading') }}</h3>
      <p>
        {{ t('docDocsCookbookOauth.controllerBody') }}
      </p>
      <CodeBlock :code="controllerCode" language="php" filename="AuthController.php" />
    </section>

    <section id="tokens">
      <h2>{{ t('docDocsCookbookOauth.tokenManagementHeading') }}</h2>
      <p>
        {{ t('docDocsCookbookOauth.tokenManagementIntro') }}
      </p>

      <h3>{{ t('docDocsCookbookOauth.tokenLifecycleHeading') }}</h3>
      <table class="tokens-table">
        <thead>
          <tr>
            <th>{{ t('docDocsCookbookOauth.tableAction') }}</th>
            <th>{{ t('docDocsCookbookOauth.tableEndpoint') }}</th>
            <th>{{ t('docDocsCookbookOauth.tableDescription') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ t('docDocsCookbookOauth.actionCreate') }}</td>
            <td><code>POST /api/auth/login</code></td>
            <td>{{ t('docDocsCookbookOauth.actionCreateDesc') }}</td>
          </tr>
          <tr>
            <td>{{ t('docDocsCookbookOauth.actionRefresh') }}</td>
            <td><code>POST /api/auth/refresh</code></td>
            <td>{{ t('docDocsCookbookOauth.actionRefreshDesc') }}</td>
          </tr>
          <tr>
            <td>{{ t('docDocsCookbookOauth.actionRevoke') }}</td>
            <td><code>POST /api/auth/logout</code></td>
            <td>{{ t('docDocsCookbookOauth.actionRevokeDesc') }}</td>
          </tr>
          <tr>
            <td>{{ t('docDocsCookbookOauth.actionInspect') }}</td>
            <td><code>GET /api/auth/me</code></td>
            <td>{{ t('docDocsCookbookOauth.actionInspectDesc') }}</td>
          </tr>
        </tbody>
      </table>

      <h3>{{ t('docDocsCookbookOauth.tokenScopingHeading') }}</h3>
      <p>
        {{ t('docDocsCookbookOauth.tokenScopingBody') }}
      </p>
      <CodeBlock :code="tokenScopingCode" language="php" filename="token-creation.php" />

      <h3>{{ t('docDocsCookbookOauth.credentialStorageHeading') }}</h3>
      <p>
        {{ t('docDocsCookbookOauth.credentialStorageBody') }}
      </p>
      <CodeBlock :code="credentialCode" language="typescript" filename="credentials.ts" />

      <div class="tip">
        <span class="tip-icon">!</span>
        <div>
          <h4>{{ t('docDocsCookbookOauth.securityNoteHeading') }}</h4>
          <p>
            <i18n-t keypath="docDocsCookbookOauth.securityNoteBody" tag="span">
              <template #httpOnly><code>httpOnly</code></template>
            </i18n-t>
          </p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const { t } = useI18n();

const googleEnvCode = ref(`# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=https://claudenest.yourdomain.com/api/auth/google/callback`);

const githubEnvCode = ref(`# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.abcdef1234567890
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://claudenest.yourdomain.com/api/auth/github/callback`);

const initiateOAuthTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `# Get Google OAuth redirect URL
curl https://claudenest.yourdomain.com/api/auth/google/redirect

# Response
{
  "success": true,
  "data": {
    "redirect_url": "https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...&scope=openid+email+profile&state=..."
  }
}

# Get GitHub OAuth redirect URL
curl https://claudenest.yourdomain.com/api/auth/github/redirect`,
  },
  {
    label: 'JavaScript',
    language: 'typescript',
    filename: 'oauth-flow.ts',
    code: `import api from '@/utils/api';

async function loginWithGoogle() {
  // Get the redirect URL from the API
  const response = await api.get('/auth/google/redirect');
  const { redirect_url } = response.data.data;

  // Redirect the user to Google's consent screen
  window.location.href = redirect_url;
}

async function loginWithGitHub() {
  const response = await api.get('/auth/github/redirect');
  const { redirect_url } = response.data.data;
  window.location.href = redirect_url;
}`,
  },
  {
    label: 'Vue Component',
    language: 'typescript',
    filename: 'LoginPage.vue',
    code: `<script setup lang="ts">
import api from '@/utils/api';

const loginWithProvider = async (provider: 'google' | 'github') => {
  const response = await api.get(\`/auth/\${provider}/redirect\`);
  window.location.href = response.data.data.redirect_url;
};
<\/script>

<template>
  <div class="login-buttons">
    <button @click="loginWithProvider('google')">
      Sign in with Google
    </button>
    <button @click="loginWithProvider('github')">
      Sign in with GitHub
    </button>
  </div>
</template>`,
  },
]);

const callbackCode = ref(`# The callback is handled server-side automatically.
# After user authorizes, they are redirected to:
GET /api/auth/google/callback?code=4/0AX4XfWj...&state=abc123

# The server responds with a Sanctum token:
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar_url": "https://lh3.googleusercontent.com/..."
    },
    "token": "1|laravel_sanctum_token_here",
    "expires_at": "2026-05-17T10:00:00Z"
  }
}`);

const useTokenCode = ref(`import axios from 'axios';

const api = axios.create({
  baseURL: 'https://claudenest.yourdomain.com/api',
  headers: {
    'Accept': 'application/json',
  },
});

// Set the token after OAuth callback
function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;

  // Persist securely (example: httpOnly cookie via server,
  // or localStorage for SPAs)
  localStorage.setItem('auth_token', token);
}

// Restore token on app startup
function restoreToken() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
  }
}

export { api, setAuthToken, restoreToken };`);

const controllerCode = ref(`<?php
// Simplified OAuth callback handler

public function handleProviderCallback(string $provider): JsonResponse
{
    $socialUser = Socialite::driver($provider)->stateless()->user();

    // Find or create user by provider ID
    $user = User::where("{$provider}_id", $socialUser->getId())->first();

    if (!$user) {
        // Check if email already exists (link accounts)
        $user = User::where('email', $socialUser->getEmail())->first();

        if ($user) {
            $user->update(["{$provider}_id" => $socialUser->getId()]);
        } else {
            $user = User::create([
                'name' => $socialUser->getName(),
                'email' => $socialUser->getEmail(),
                'avatar_url' => $socialUser->getAvatar(),
                "{$provider}_id" => $socialUser->getId(),
                'email_verified_at' => now(),
            ]);
        }
    }

    // Update avatar if changed
    if ($socialUser->getAvatar() !== $user->avatar_url) {
        $user->update(['avatar_url' => $socialUser->getAvatar()]);
    }

    // Create Sanctum token
    $token = $user->createToken('oauth-token', ['*'], now()->addDays(90));

    return response()->json([
        'success' => true,
        'data' => [
            'user' => $user,
            'token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at,
        ],
    ]);
}`);

const tokenScopingCode = ref(`<?php
// Create a full-access token
$token = $user->createToken('full-access', ['*']);

// Create a read-only token
$token = $user->createToken('read-only', [
    'machines:read',
    'sessions:read',
    'projects:read',
]);

// Create a machine-specific token
$token = $user->createToken('agent-token', [
    'sessions:write',
    'sessions:read',
    'machines:read',
]);

// Check token abilities in middleware or controller
if ($request->user()->tokenCan('sessions:write')) {
    // Allowed to create sessions
}`);

const credentialCode = ref(`import api from '@/utils/api';

// Store a Claude API key (encrypted server-side)
await api.post('/credentials', {
  name: 'Production API Key',
  auth_type: 'api_key',
  api_key: 'sk-ant-api03-...',
  is_default: true,
});

// Store an OAuth credential
await api.post('/credentials', {
  name: 'Claude OAuth',
  auth_type: 'oauth',
  oauth_token: 'oauth-access-token',
  oauth_refresh_token: 'oauth-refresh-token',
  oauth_expires_at: '2026-05-17T00:00:00Z',
});

// List credentials (API keys are never returned in plaintext)
const credentials = await api.get('/credentials');

// Set a credential as default for new sessions
await api.post(\`/credentials/\${credentialId}/set-default\`);

// Validate a credential
const validation = await api.post(\`/credentials/\${credentialId}/validate\`);`);
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

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* Providers Grid */
.providers-grid {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.provider-card {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.provider-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.provider-icon.google {
  background: color-mix(in srgb, #4285f4 20%, transparent);
  color: #4285f4;
}

.provider-icon.github {
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  color: var(--text-primary);
}

.provider-card h4 {
  margin: 0 0 0.25rem;
}

.provider-card p {
  font-size: 0.9rem;
  margin: 0 0 0.5rem;
}

.provider-card ul {
  font-size: 0.85rem;
  margin: 0;
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

/* Tokens Table */
.tokens-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.tokens-table th {
  text-align: left;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.tokens-table td {
  padding: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  color: var(--text-secondary);
}

.tokens-table tr:hover td {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

/* Tip Box */
.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  margin: 1.5rem 0;
}

.tip-icon {
  width: 28px;
  height: 28px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
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
