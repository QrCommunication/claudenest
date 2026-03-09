<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>OAuth Authentication</h1>
      <p class="lead">
        Enable social login with Google and GitHub OAuth providers.
        ClaudeNest handles the full redirect/callback flow and issues
        Sanctum tokens for authenticated API access.
      </p>
    </header>

    <section id="providers">
      <h2>Supported Providers</h2>
      <p>
        ClaudeNest supports two OAuth providers out of the box, powered by
        <strong>Laravel Socialite</strong>. Each provider can be enabled independently
        by setting the appropriate environment variables.
      </p>

      <div class="providers-grid">
        <div class="provider-card">
          <div class="provider-icon google">G</div>
          <div>
            <h4>Google</h4>
            <p>Sign in with Google accounts. Provides email, name, and avatar.</p>
            <ul>
              <li>OAuth 2.0 protocol</li>
              <li>Requires Google Cloud Console project</li>
              <li>Scopes: <code>openid</code>, <code>email</code>, <code>profile</code></li>
            </ul>
          </div>
        </div>
        <div class="provider-card">
          <div class="provider-icon github">GH</div>
          <div>
            <h4>GitHub</h4>
            <p>Sign in with GitHub accounts. Provides username, email, and avatar.</p>
            <ul>
              <li>OAuth 2.0 protocol</li>
              <li>Requires GitHub OAuth App</li>
              <li>Scopes: <code>user:email</code>, <code>read:user</code></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="google-setup">
      <h2>Google OAuth Setup</h2>
      <p>
        Create an OAuth 2.0 client in the Google Cloud Console and configure
        the redirect URI to point to your ClaudeNest server.
      </p>

      <ol class="steps-list">
        <li>Go to the <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
        <li>Create a new project or select an existing one</li>
        <li>Navigate to "APIs & Services" then "Credentials"</li>
        <li>Click "Create Credentials" and select "OAuth client ID"</li>
        <li>Configure the OAuth consent screen if prompted</li>
        <li>Select "Web application" as the application type</li>
        <li>Add your domain to "Authorized JavaScript origins"</li>
        <li>Add the callback URL to "Authorized redirect URIs"</li>
        <li>Copy the Client ID and Client Secret</li>
      </ol>

      <h3>Environment Configuration</h3>
      <CodeBlock :code="googleEnvCode" language="bash" filename=".env" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Callback URL format</h4>
          <p>
            The redirect URI must exactly match what you configure in the Google Cloud Console.
            Use HTTPS in production. The path is always <code>/api/auth/google/callback</code>.
          </p>
        </div>
      </div>
    </section>

    <section id="github-setup">
      <h2>GitHub OAuth Setup</h2>
      <p>
        Register an OAuth App in your GitHub settings. You can create the app
        under your personal account or an organization.
      </p>

      <ol class="steps-list">
        <li>Go to GitHub Settings, then Developer settings, then OAuth Apps</li>
        <li>Click "New OAuth App"</li>
        <li>Enter the application name (e.g., "ClaudeNest")</li>
        <li>Set the homepage URL to your ClaudeNest domain</li>
        <li>Set the authorization callback URL</li>
        <li>Register the application</li>
        <li>Copy the Client ID and generate a Client Secret</li>
      </ol>

      <h3>Environment Configuration</h3>
      <CodeBlock :code="githubEnvCode" language="bash" filename=".env" />
    </section>

    <section id="flow">
      <h2>OAuth Flow</h2>
      <p>
        The OAuth flow follows the standard Authorization Code Grant. ClaudeNest
        handles the server-side exchange and creates or updates the user record
        automatically.
      </p>

      <div class="flow-diagram">
        <div class="flow-step">
          <span class="step-num">1</span>
          <p>Client requests redirect URL</p>
        </div>
        <div class="flow-arrow">-></div>
        <div class="flow-step">
          <span class="step-num">2</span>
          <p>User authorizes with provider</p>
        </div>
        <div class="flow-arrow">-></div>
        <div class="flow-step">
          <span class="step-num">3</span>
          <p>Provider redirects with code</p>
        </div>
        <div class="flow-arrow">-></div>
        <div class="flow-step">
          <span class="step-num">4</span>
          <p>Server exchanges code for token</p>
        </div>
      </div>

      <h3>Step 1: Initiate OAuth</h3>
      <p>Request the OAuth redirect URL from the API. The server generates a state parameter for CSRF protection.</p>
      <CodeTabs :tabs="initiateOAuthTabs" />

      <h3>Step 2: Handle Callback</h3>
      <p>
        After the user authorizes your app, the provider redirects to the callback
        URL with an authorization code. The server exchanges this code for user
        information and creates a Sanctum token.
      </p>
      <CodeBlock :code="callbackCode" language="bash" />

      <h3>Step 3: Use the Token</h3>
      <p>
        The callback response includes a Sanctum token. Store it securely and
        include it in subsequent API requests.
      </p>
      <CodeBlock :code="useTokenCode" language="typescript" filename="api-client.ts" />

      <h3>Server-Side Controller</h3>
      <p>
        The controller handles user creation/lookup, avatar syncing, and token
        generation. Users are matched by their provider ID, with email as a fallback.
      </p>
      <CodeBlock :code="controllerCode" language="php" filename="AuthController.php" />
    </section>

    <section id="tokens">
      <h2>Token Management</h2>
      <p>
        ClaudeNest uses Laravel Sanctum for API token management. Tokens can
        be scoped, expired, and revoked.
      </p>

      <h3>Token Lifecycle</h3>
      <table class="tokens-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Create</td>
            <td><code>POST /api/auth/login</code></td>
            <td>Returns a new Sanctum token on successful authentication</td>
          </tr>
          <tr>
            <td>Refresh</td>
            <td><code>POST /api/auth/refresh</code></td>
            <td>Issues a new token and revokes the current one</td>
          </tr>
          <tr>
            <td>Revoke</td>
            <td><code>POST /api/auth/logout</code></td>
            <td>Revokes the current token</td>
          </tr>
          <tr>
            <td>Inspect</td>
            <td><code>GET /api/auth/me</code></td>
            <td>Returns user info and token metadata</td>
          </tr>
        </tbody>
      </table>

      <h3>Token Scoping</h3>
      <p>
        Tokens can be scoped to limit access. This is especially useful for
        machine tokens that only need specific permissions.
      </p>
      <CodeBlock :code="tokenScopingCode" language="php" filename="token-creation.php" />

      <h3>Credential Storage</h3>
      <p>
        For Claude API keys and OAuth tokens used by sessions, ClaudeNest provides
        encrypted credential storage with AES-256-CBC encryption.
      </p>
      <CodeBlock :code="credentialCode" language="typescript" filename="credentials.ts" />

      <div class="tip">
        <span class="tip-icon">!</span>
        <div>
          <h4>Security Note</h4>
          <p>
            Never expose tokens in client-side code or URLs. Store them in
            <code>httpOnly</code> cookies or secure storage (Keychain on iOS,
            Keystore on Android). Rotate tokens regularly.
          </p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

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
