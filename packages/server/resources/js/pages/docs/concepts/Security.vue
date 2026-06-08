<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsConceptsSecurity.title') }}</h1>
      <p class="lead">
        {{ $t('docDocsConceptsSecurity.lead') }}
      </p>
    </header>

    <section id="authentication">
      <h2>{{ $t('docDocsConceptsSecurity.authenticationHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsSecurity.authenticationPara1Pre') }} <strong>Laravel Sanctum</strong> {{ $t('docDocsConceptsSecurity.authenticationPara1Post') }}
      </p>

      <h3>{{ $t('docDocsConceptsSecurity.tokenTypesHeading') }}</h3>
      <div class="feature-grid">
        <div class="feature-card">
          <h4>{{ $t('docDocsConceptsSecurity.personalAccessTokensTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsSecurity.personalAccessTokensDescPre') }}
            <code>machines:read</code>, <code>sessions:write</code>. {{ $t('docDocsConceptsSecurity.personalAccessTokensDescMid') }}
            <code>personal_access_tokens</code> {{ $t('docDocsConceptsSecurity.personalAccessTokensDescPost') }}
          </p>
        </div>
        <div class="feature-card">
          <h4>{{ $t('docDocsConceptsSecurity.machineTokensTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsSecurity.machineTokensDesc') }}
          </p>
        </div>
        <div class="feature-card">
          <h4>{{ $t('docDocsConceptsSecurity.sessionCookiesTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsSecurity.sessionCookiesDesc') }}
          </p>
        </div>
      </div>

      <h3>{{ $t('docDocsConceptsSecurity.authenticationFlowHeading') }}</h3>
      <CodeTabs :tabs="authFlowTabs" />

      <div class="tip">
        <span class="tip-icon">!</span>
        <div>
          <h4>{{ $t('docDocsConceptsSecurity.tokenExpirationTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsSecurity.tokenExpirationDesc') }}
          </p>
        </div>
      </div>
    </section>

    <section id="authorization">
      <h2>{{ $t('docDocsConceptsSecurity.authorizationHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsSecurity.authorizationPara1Pre') }} <strong>{{ $t('docDocsConceptsSecurity.authorizationPara1Strong') }}</strong>{{ $t('docDocsConceptsSecurity.authorizationPara1Post') }}
      </p>

      <h3>{{ $t('docDocsConceptsSecurity.resourceScopingHeading') }}</h3>
      <CodeBlock :code="resourceScoping" language="php" :filename="$t('docDocsConceptsSecurity.perUserIsolationFilename')" />

      <h3>{{ $t('docDocsConceptsSecurity.tokenAbilitiesHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsSecurity.tokenAbilitiesPara') }}
      </p>
      <CodeBlock :code="tokenAbilities" language="php" :filename="$t('docDocsConceptsSecurity.abilityCheckFilename')" />

      <div class="abilities-table">
        <table>
          <thead>
            <tr>
              <th>{{ $t('docDocsConceptsSecurity.abilityColumn') }}</th>
              <th>{{ $t('docDocsConceptsSecurity.descriptionColumn') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>*</code></td>
              <td>{{ $t('docDocsConceptsSecurity.abilityFullAccess') }}</td>
            </tr>
            <tr>
              <td><code>machines:read</code></td>
              <td>{{ $t('docDocsConceptsSecurity.abilityMachinesRead') }}</td>
            </tr>
            <tr>
              <td><code>machines:write</code></td>
              <td>{{ $t('docDocsConceptsSecurity.abilityMachinesWrite') }}</td>
            </tr>
            <tr>
              <td><code>sessions:read</code></td>
              <td>{{ $t('docDocsConceptsSecurity.abilitySessionsRead') }}</td>
            </tr>
            <tr>
              <td><code>sessions:write</code></td>
              <td>{{ $t('docDocsConceptsSecurity.abilitySessionsWrite') }}</td>
            </tr>
            <tr>
              <td><code>projects:read</code></td>
              <td>{{ $t('docDocsConceptsSecurity.abilityProjectsRead') }}</td>
            </tr>
            <tr>
              <td><code>projects:write</code></td>
              <td>{{ $t('docDocsConceptsSecurity.abilityProjectsWrite') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="encryption">
      <h2>{{ $t('docDocsConceptsSecurity.encryptionHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsSecurity.encryptionPara1Pre') }} <strong>AES-256-CBC</strong>
        {{ $t('docDocsConceptsSecurity.encryptionPara1Mid') }} <code>Crypt::encryptString()</code>. {{ $t('docDocsConceptsSecurity.encryptionPara1Mid2') }}
        <code>APP_KEY</code> {{ $t('docDocsConceptsSecurity.encryptionPara1Post') }}
      </p>

      <h3>{{ $t('docDocsConceptsSecurity.encryptionAtRestHeading') }}</h3>
      <CodeBlock :code="encryptionAtRest" language="php" filename="CredentialService.php" />

      <h3>{{ $t('docDocsConceptsSecurity.decryptionForUseHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsSecurity.decryptionPara') }}
      </p>
      <CodeBlock :code="decryptionUsage" language="php" :filename="$t('docDocsConceptsSecurity.sessionStartupFilename')" />

      <div class="tip">
        <span class="tip-icon">!</span>
        <div>
          <h4>{{ $t('docDocsConceptsSecurity.keyRotationTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsSecurity.keyRotationDescPre') }} <code>APP_KEY</code> {{ $t('docDocsConceptsSecurity.keyRotationDescMid') }}
            <code>php artisan claudenest:reencrypt-credentials</code> {{ $t('docDocsConceptsSecurity.keyRotationDescPost') }}
          </p>
        </div>
      </div>
    </section>

    <section id="machine-tokens">
      <h2>{{ $t('docDocsConceptsSecurity.machineTokenSecurityHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsSecurity.machineTokenSecurityPara1Pre') }} <strong>{{ $t('docDocsConceptsSecurity.machineTokenSecurityPara1Strong') }}</strong>
        {{ $t('docDocsConceptsSecurity.machineTokenSecurityPara1Post') }}
      </p>

      <h3>{{ $t('docDocsConceptsSecurity.tokenLifecycleHeading') }}</h3>
      <CodeBlock :code="machineTokenLifecycle" language="php" filename="MachineController.php" />

      <h3>{{ $t('docDocsConceptsSecurity.agentAuthenticationHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsSecurity.agentAuthenticationParaPre') }} <code>Authorization</code> {{ $t('docDocsConceptsSecurity.agentAuthenticationParaPost') }}
      </p>
      <CodeTabs :tabs="agentAuthTabs" />
    </section>

    <section id="best-practices">
      <h2>{{ $t('docDocsConceptsSecurity.bestPracticesHeading') }}</h2>

      <div class="practices-grid">
        <div class="practice-card">
          <div class="practice-header">
            <span class="practice-icon secure">S</span>
            <h4>{{ $t('docDocsConceptsSecurity.alwaysUseHttpsTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsConceptsSecurity.alwaysUseHttpsDescPre') }} <code>FORCE_HTTPS=true</code> {{ $t('docDocsConceptsSecurity.alwaysUseHttpsDescPost') }}
          </p>
        </div>

        <div class="practice-card">
          <div class="practice-header">
            <span class="practice-icon secure">S</span>
            <h4>{{ $t('docDocsConceptsSecurity.scopeTokensMinimallyTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsConceptsSecurity.scopeTokensMinimallyDescPre') }} <code>sessions:write</code>{{ $t('docDocsConceptsSecurity.scopeTokensMinimallyDescMid') }} <code>*</code> {{ $t('docDocsConceptsSecurity.scopeTokensMinimallyDescPost') }}
          </p>
        </div>

        <div class="practice-card">
          <div class="practice-header">
            <span class="practice-icon secure">S</span>
            <h4>{{ $t('docDocsConceptsSecurity.rotateMachineTokensTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsConceptsSecurity.rotateMachineTokensDescPre') }}
            <code>POST /machines/{id}/regenerate-token</code> {{ $t('docDocsConceptsSecurity.rotateMachineTokensDescPost') }}
          </p>
        </div>

        <div class="practice-card">
          <div class="practice-header">
            <span class="practice-icon secure">S</span>
            <h4>{{ $t('docDocsConceptsSecurity.setTokenExpirationTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsConceptsSecurity.setTokenExpirationDesc') }}
          </p>
        </div>

        <div class="practice-card">
          <div class="practice-header">
            <span class="practice-icon secure">S</span>
            <h4>{{ $t('docDocsConceptsSecurity.auditTokenUsageTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsConceptsSecurity.auditTokenUsageDescPre') }} <code>last_used_at</code> {{ $t('docDocsConceptsSecurity.auditTokenUsageDescPost') }}
          </p>
        </div>

        <div class="practice-card">
          <div class="practice-header">
            <span class="practice-icon secure">S</span>
            <h4>{{ $t('docDocsConceptsSecurity.protectAppKeyTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsConceptsSecurity.protectAppKeyDescPre') }} <code>APP_KEY</code> {{ $t('docDocsConceptsSecurity.protectAppKeyDescPost') }}
          </p>
        </div>
      </div>

      <h3>{{ $t('docDocsConceptsSecurity.rateLimitingHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsSecurity.rateLimitingPara') }}
      </p>
      <CodeBlock :code="rateLimiting" language="php" filename="RouteServiceProvider.php" />
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const authFlowTabs = ref([
  {
    label: 'Bearer Token',
    language: 'bash',
    code: `# 1. Login to obtain a token
curl -X POST https://claudenest.example.com/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "user@example.com", "password": "secret"}'

# Response: { "data": { "token": "1|abc123..." } }

# 2. Use token in subsequent requests
curl https://claudenest.example.com/api/machines \\
  -H 'Authorization: Bearer 1|abc123...' \\
  -H 'Accept: application/json'`,
  },
  {
    label: 'OAuth (Google)',
    language: 'bash',
    code: `# 1. Get redirect URL
curl https://claudenest.example.com/api/auth/google/redirect

# 2. User authorizes in browser, then callback is handled:
GET /api/auth/google/callback?code=google-auth-code

# 3. Server returns Sanctum token
# Response: {
#   "data": {
#     "user": { "id": "...", "name": "...", "email": "..." },
#     "token": "1|xyz789...",
#     "expires_at": "2026-05-17T00:00:00Z"
#   }
# }`,
  },
  {
    label: 'SPA (Cookie)',
    language: 'javascript',
    code: `// 1. Fetch CSRF cookie
await fetch('/sanctum/csrf-cookie', { credentials: 'include' });

// 2. Login with credentials
const response = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secret',
  }),
});

// 3. Subsequent requests use session cookie automatically
const machines = await fetch('/api/machines', {
  credentials: 'include',
  headers: { 'Accept': 'application/json' },
});`,
  },
]);

const resourceScoping = ref(`// Every query is scoped to the authenticated user
public function index(Request $request): JsonResponse
{
    // Only returns machines owned by the current user
    $machines = $request->user()->machines()->paginate(15);

    // NEVER do: Machine::all() — would leak other users' data
    // NEVER do: Machine::find($id) — must verify ownership

    return response()->json([
        'success' => true,
        'data' => MachineResource::collection($machines),
    ]);
}

// For single-resource endpoints, verify ownership via policy
public function show(Request $request, Machine $machine): JsonResponse
{
    $this->authorize('view', $machine); // MachinePolicy checks user_id

    return response()->json([
        'success' => true,
        'data' => new MachineResource($machine),
    ]);
}`);

const tokenAbilities = ref(`// Creating a scoped token
$token = $user->createToken('ci-deploy', [
    'sessions:write',
    'machines:read',
]);

// Checking abilities in a controller
public function store(Request $request): JsonResponse
{
    if (!$request->user()->tokenCan('sessions:write')) {
        abort(403, 'Token does not have sessions:write ability');
    }

    // Proceed with session creation...
}`);

const encryptionAtRest = ref(`use Illuminate\Support\Facades\Crypt;

class CredentialService
{
    public function store(User $user, array $data): ClaudeCredential
    {
        return ClaudeCredential::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'auth_type' => $data['auth_type'],
            // Encrypted with AES-256-CBC using APP_KEY
            'api_key' => isset($data['api_key'])
                ? Crypt::encryptString($data['api_key'])
                : null,
            'oauth_token' => isset($data['oauth_token'])
                ? Crypt::encryptString($data['oauth_token'])
                : null,
            'oauth_refresh_token' => isset($data['oauth_refresh_token'])
                ? Crypt::encryptString($data['oauth_refresh_token'])
                : null,
            'is_default' => $data['is_default'] ?? false,
        ]);
    }
}`);

const decryptionUsage = ref(`// Decrypt only when needed, never cache plaintext
public function getApiKeyForSession(Session $session): string
{
    $credential = $session->credential
        ?? $session->user->credentials()->where('is_default', true)->first();

    if (!$credential) {
        throw new \\RuntimeException('No credential available for session');
    }

    // Decrypt at point of use
    $apiKey = Crypt::decryptString($credential->api_key);

    // Update last_used_at
    $credential->update(['last_used_at' => now()]);

    return $apiKey;
    // $apiKey goes out of scope and is garbage collected
}`);

const machineTokenLifecycle = ref(`// Registration: generate and return token, store only the hash
public function store(Request $request): JsonResponse
{
    $rawToken = Str::random(64);

    $machine = Machine::create([
        'user_id' => $request->user()->id,
        'name' => $request->input('name'),
        'token_hash' => hash('sha256', $rawToken),
        'platform' => $request->input('platform'),
    ]);

    // The raw token is returned ONCE and never stored
    return response()->json([
        'success' => true,
        'data' => [
            'machine' => new MachineResource($machine),
            'token' => 'mn_' . $rawToken,  // Prefixed for identification
        ],
    ], 201);
}

// Regeneration: invalidates old token, issues new one
public function regenerateToken(Machine $machine): JsonResponse
{
    $rawToken = Str::random(64);
    $machine->update(['token_hash' => hash('sha256', $rawToken)]);

    return response()->json([
        'success' => true,
        'data' => ['token' => 'mn_' . $rawToken],
    ]);
}`);

const agentAuthTabs = ref([
  {
    label: 'Agent (TypeScript)',
    language: 'typescript',
    code: `// Agent includes token in WebSocket handshake
const ws = new WebSocket(serverUrl, {
  headers: {
    'Authorization': \`Bearer \${config.machineToken}\`,
    'X-Machine-ID': config.machineId,
  },
});

// Token is stored securely in OS keychain via keytar
import * as keytar from 'keytar';

const token = await keytar.getPassword('claudenest', 'machine-token');`,
  },
  {
    label: 'Server (PHP)',
    language: 'php',
    code: `// Server validates machine token by hashing and comparing
public function authenticateMachine(Request $request): ?Machine
{
    $token = $request->bearerToken();
    if (!$token || !str_starts_with($token, 'mn_')) {
        return null;
    }

    $rawToken = substr($token, 3); // Remove 'mn_' prefix
    $hash = hash('sha256', $rawToken);

    return Machine::where('token_hash', $hash)->first();
}`,
  },
]);

const rateLimiting = ref(`// Rate limiting configuration
RateLimiter::for('api', function (Request $request) {
    return $request->user()
        ? Limit::perMinute(120)->by($request->user()->id)
        : Limit::perMinute(30)->by($request->ip());
});

// Auth endpoints have stricter limits
RateLimiter::for('auth', function (Request $request) {
    return Limit::perMinute(10)->by(
        $request->input('email') . '|' . $request->ip()
    );
});`);
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

ul {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

strong {
  color: var(--text-primary);
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

/* Feature Grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.feature-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.feature-card h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.feature-card p {
  margin: 0;
  font-size: 0.9rem;
}

/* Tip Box */
.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.tip-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
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

/* Abilities Table */
.abilities-table {
  margin: 1.5rem 0;
  overflow-x: auto;
}

.abilities-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.abilities-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  border-bottom: 2px solid var(--border-color, var(--border));
  color: var(--text-primary);
  font-weight: 600;
}

.abilities-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, var(--border));
  color: var(--text-secondary);
}

/* Practices Grid */
.practices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.practice-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.practice-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.practice-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.practice-icon.secure {
  background: color-mix(in srgb, #22c55e 15%, transparent);
  color: #22c55e;
}

.practice-card h4 {
  margin: 0;
  font-size: 1rem;
}

.practice-card p {
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .practices-grid {
    grid-template-columns: 1fr;
  }
}
</style>
