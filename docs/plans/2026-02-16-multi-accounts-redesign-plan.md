# Multi-Accounts + Full Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-account credential management to ClaudeNest, redesign the entire dashboard and public pages with IDE-like layout, dark/light mode, FR/EN i18n, and improve the standalone CLI.

**Architecture:** Native Laravel module (ClaudeCredential model + CredentialService) integrated with the existing session system. Vue.js dashboard gets an IDE-style layout with tabs, sidebar, and status bar. All public pages redesigned with Tailwind CSS. CLI standalone gets bridge to ClaudeNest API.

**Tech Stack:** Laravel 11, Vue 3 + Pinia + vue-i18n, Tailwind CSS, xterm.js, node-pty (agent), Python 3 (CLI standalone)

---

## Phase 1: Core Credentials Module (Backend)

### Task 1.1: Create the database migration

**Files:**
- Create: `database/migrations/2026_02_16_000001_create_claude_credentials_table.php`

**Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('claude_credentials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('auth_type', 20); // 'api_key' or 'oauth'
            $table->text('api_key_enc')->nullable();
            $table->text('access_token_enc')->nullable();
            $table->text('refresh_token_enc')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('claude_dir_mode', 20)->default('shared'); // 'shared' or 'isolated'
            $table->boolean('is_default')->default(false);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'name']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('claude_credentials');
    }
};
```

**Step 2: Create the sessions credential_id migration**

Create: `database/migrations/2026_02_16_000002_add_credential_id_to_sessions.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claude_sessions', function (Blueprint $table) {
            $table->foreignUuid('credential_id')->nullable()->constrained('claude_credentials')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('claude_sessions', function (Blueprint $table) {
            $table->dropForeign(['credential_id']);
            $table->dropColumn('credential_id');
        });
    }
};
```

**Step 3: Run migrations**

```bash
cd /home/rony/Projets/claudenest
php artisan migrate
```

**Step 4: Commit**

```bash
git add database/migrations/2026_02_16_*
git commit -m "feat: add claude_credentials table and credential_id to sessions"
```

---

### Task 1.2: Create the ClaudeCredential model

**Files:**
- Create: `app/Models/ClaudeCredential.php`
- Reference: `app/Models/Session.php` (pattern), `app/Models/Machine.php` (pattern)

**Step 1: Write the model**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class ClaudeCredential extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'claude_credentials';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id', 'name', 'auth_type',
        'api_key_enc', 'access_token_enc', 'refresh_token_enc',
        'expires_at', 'claude_dir_mode', 'is_default', 'last_used_at',
    ];

    protected $hidden = [
        'api_key_enc', 'access_token_enc', 'refresh_token_enc',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
        'is_default' => 'boolean',
    ];

    // ==================== CONSTANTS ====================

    public const AUTH_TYPES = ['api_key', 'oauth'];
    public const DIR_MODES = ['shared', 'isolated'];

    // ==================== RELATIONSHIPS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class, 'credential_id');
    }

    // ==================== ENCRYPTION HELPERS ====================

    public function setApiKey(string $key): void
    {
        $this->api_key_enc = Crypt::encryptString($key);
        $this->save();
    }

    public function getApiKey(): ?string
    {
        return $this->api_key_enc ? Crypt::decryptString($this->api_key_enc) : null;
    }

    public function setAccessToken(string $token): void
    {
        $this->access_token_enc = Crypt::encryptString($token);
        $this->save();
    }

    public function getAccessToken(): ?string
    {
        return $this->access_token_enc ? Crypt::decryptString($this->access_token_enc) : null;
    }

    public function setRefreshToken(string $token): void
    {
        $this->refresh_token_enc = Crypt::encryptString($token);
        $this->save();
    }

    public function getRefreshToken(): ?string
    {
        return $this->refresh_token_enc ? Crypt::decryptString($this->refresh_token_enc) : null;
    }

    // ==================== SCOPES ====================

    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeApiKey($query)
    {
        return $query->where('auth_type', 'api_key');
    }

    public function scopeOAuth($query)
    {
        return $query->where('auth_type', 'oauth');
    }

    // ==================== ACCESSORS ====================

    public function getMaskedKeyAttribute(): ?string
    {
        if ($this->auth_type === 'api_key' && $this->api_key_enc) {
            $key = $this->getApiKey();
            return $key ? 'sk-ant-...'.substr($key, -6) : null;
        }
        if ($this->auth_type === 'oauth' && $this->access_token_enc) {
            $token = $this->getAccessToken();
            return $token ? 'oat01-...'.substr($token, -6) : null;
        }
        return null;
    }

    public function getIsExpiredAttribute(): bool
    {
        if ($this->auth_type !== 'oauth' || !$this->expires_at) {
            return false;
        }
        return now()->isAfter($this->expires_at);
    }

    public function getTokenStatusAttribute(): string
    {
        if ($this->auth_type === 'api_key') {
            return $this->api_key_enc ? 'ok' : 'missing';
        }
        if (!$this->access_token_enc) {
            return 'needs_login';
        }
        if ($this->is_expired) {
            return 'expired';
        }
        return 'ok';
    }

    public function getHasRefreshTokenAttribute(): bool
    {
        return (bool) $this->refresh_token_enc;
    }

    // ==================== HELPERS ====================

    public function markUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    public function setAsDefault(): void
    {
        // Unset all defaults for this user
        static::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
```

**Step 2: Add credential relationship to Session model**

Modify: `app/Models/Session.php` — add inside the relationships section:

```php
public function credential(): BelongsTo
{
    return $this->belongsTo(ClaudeCredential::class, 'credential_id');
}
```

**Step 3: Add credentials relationship to User model**

Modify: `app/Models/User.php` — add:

```php
public function credentials(): HasMany
{
    return $this->hasMany(ClaudeCredential::class);
}
```

**Step 4: Commit**

```bash
git add app/Models/ClaudeCredential.php app/Models/Session.php app/Models/User.php
git commit -m "feat: add ClaudeCredential model with encryption helpers"
```

---

### Task 1.3: Create the CredentialService

**Files:**
- Create: `app/Services/CredentialService.php`
- Reference: `app/Services/ContextRAGService.php` (pattern)

**Step 1: Write the service**

```php
<?php

namespace App\Services;

use App\Models\ClaudeCredential;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

class CredentialService
{
    private const OAUTH_TOKEN_URL = 'https://platform.claude.com/v1/oauth/token';
    private const OAUTH_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';

    /**
     * Get environment variables to inject into a Claude Code session.
     */
    public function getSessionEnv(ClaudeCredential $credential): array
    {
        $env = [];

        if ($credential->auth_type === 'api_key') {
            $key = $credential->getApiKey();
            if (!$key) {
                throw new \RuntimeException("No API key stored for credential '{$credential->name}'");
            }
            $env['ANTHROPIC_API_KEY'] = $key;
        } else {
            $token = $credential->getAccessToken();
            if (!$token) {
                throw new \RuntimeException(
                    "No OAuth token for credential '{$credential->name}'. Capture tokens first."
                );
            }

            // Auto-refresh if expired
            if ($credential->is_expired && $credential->has_refresh_token) {
                $this->refreshOAuthToken($credential);
                $credential->refresh();
                $token = $credential->getAccessToken();
            }

            $env['CLAUDE_CODE_OAUTH_TOKEN'] = $token;
        }

        // Handle isolated .claude directory
        if ($credential->claude_dir_mode === 'isolated') {
            $env['CLAUDE_CONFIG_DIR'] = '$HOME/.claude-' . $credential->name;
        }

        $credential->markUsed();

        return $env;
    }

    /**
     * Refresh an expired OAuth token.
     */
    public function refreshOAuthToken(ClaudeCredential $credential): array
    {
        if ($credential->auth_type !== 'oauth') {
            throw new \InvalidArgumentException("Credential '{$credential->name}' is not OAuth");
        }

        $refreshToken = $credential->getRefreshToken();
        if (!$refreshToken) {
            throw new \RuntimeException(
                "No refresh token for '{$credential->name}'. Re-authenticate."
            );
        }

        $response = Http::timeout(15)->post(self::OAUTH_TOKEN_URL, [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => self::OAUTH_CLIENT_ID,
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException(
                "OAuth refresh failed ({$response->status()}): " . $response->body()
            );
        }

        $data = $response->json();
        $newAccess = $data['access_token'] ?? '';
        $newRefresh = $data['refresh_token'] ?? '';
        $expiresIn = $data['expires_in'] ?? 0;

        if (!$newAccess) {
            throw new \RuntimeException('OAuth refresh response missing access_token');
        }

        $credential->update([
            'access_token_enc' => Crypt::encryptString($newAccess),
            'refresh_token_enc' => $newRefresh ? Crypt::encryptString($newRefresh) : $credential->refresh_token_enc,
            'expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
        ]);

        return [
            'refreshed' => true,
            'token_preview' => 'oat01-...' . substr($newAccess, -6),
            'expires_in_min' => $expiresIn ? intdiv($expiresIn, 60) : null,
        ];
    }

    /**
     * Capture OAuth tokens from ~/.claude/.credentials.json
     */
    public function captureFromCredentialsFile(ClaudeCredential $credential, ?string $path = null): array
    {
        $credPath = $path ?? (getenv('HOME') ?: '/root') . '/.claude/.credentials.json';

        if (!file_exists($credPath)) {
            throw new \RuntimeException(
                "Credentials file not found: {$credPath}. Run 'claude' first to authenticate."
            );
        }

        $data = json_decode(file_get_contents($credPath), true);
        $oauth = $data['claudeAiOauth'] ?? [];

        $accessToken = $oauth['accessToken'] ?? '';
        $refreshToken = $oauth['refreshToken'] ?? '';
        $expiresAt = $oauth['expiresAt'] ?? 0;

        if (!$accessToken) {
            throw new \RuntimeException('No accessToken found in credentials file.');
        }

        $credential->update([
            'access_token_enc' => Crypt::encryptString($accessToken),
            'refresh_token_enc' => $refreshToken ? Crypt::encryptString($refreshToken) : null,
            'expires_at' => $expiresAt > 0 ? \Carbon\Carbon::createFromTimestampMs($expiresAt) : null,
        ]);

        $remainingMin = null;
        if ($expiresAt > 0) {
            $remainingMin = intdiv($expiresAt - (int)(microtime(true) * 1000), 60000);
        }

        return [
            'captured' => true,
            'token_preview' => 'oat01-...' . substr($accessToken, -6),
            'has_refresh' => (bool) $refreshToken,
            'expires_in_min' => $remainingMin,
        ];
    }

    /**
     * Test if a credential is valid.
     */
    public function testCredential(ClaudeCredential $credential): array
    {
        if ($credential->auth_type === 'api_key') {
            $key = $credential->getApiKey();
            if (!$key) {
                return ['valid' => false, 'reason' => 'No API key stored'];
            }
            // Test with a minimal API call
            $response = Http::timeout(10)
                ->withHeaders(['x-api-key' => $key, 'anthropic-version' => '2023-06-01'])
                ->post('https://api.anthropic.com/v1/messages', [
                    'model' => 'claude-haiku-4-5-20251001',
                    'max_tokens' => 1,
                    'messages' => [['role' => 'user', 'content' => 'hi']],
                ]);
            return [
                'valid' => $response->successful(),
                'status' => $response->status(),
            ];
        }

        // OAuth: check expiry
        return [
            'valid' => !$credential->is_expired,
            'token_status' => $credential->token_status,
            'expires_at' => $credential->expires_at?->toIso8601String(),
        ];
    }
}
```

**Step 2: Register in service container (optional, auto-resolved)**

Laravel auto-resolves concrete classes. No registration needed.

**Step 3: Commit**

```bash
git add app/Services/CredentialService.php
git commit -m "feat: add CredentialService for session env injection and OAuth refresh"
```

---

### Task 1.4: Create CredentialResource + FormRequests

**Files:**
- Create: `app/Http/Resources/CredentialResource.php`
- Create: `app/Http/Requests/StoreCredentialRequest.php`
- Create: `app/Http/Requests/UpdateCredentialRequest.php`

**Step 1: Write CredentialResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CredentialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'auth_type' => $this->auth_type,
            'claude_dir_mode' => $this->claude_dir_mode,
            'is_default' => $this->is_default,
            'masked_key' => $this->masked_key,
            'token_status' => $this->token_status,
            'is_expired' => $this->is_expired,
            'has_refresh_token' => $this->has_refresh_token,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'last_used_at' => $this->last_used_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'sessions_count' => $this->whenCounted('sessions'),
        ];
    }
}
```

**Step 2: Write StoreCredentialRequest**

```php
<?php

namespace App\Http\Requests;

use App\Models\ClaudeCredential;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'auth_type' => ['required', Rule::in(ClaudeCredential::AUTH_TYPES)],
            'api_key' => ['required_if:auth_type,api_key', 'nullable', 'string'],
            'access_token' => ['nullable', 'string'],
            'refresh_token' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'integer'],
            'claude_dir_mode' => ['nullable', Rule::in(ClaudeCredential::DIR_MODES)],
        ];
    }
}
```

**Step 3: Write UpdateCredentialRequest**

```php
<?php

namespace App\Http\Requests;

use App\Models\ClaudeCredential;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'auth_type' => ['sometimes', Rule::in(ClaudeCredential::AUTH_TYPES)],
            'api_key' => ['nullable', 'string'],
            'access_token' => ['nullable', 'string'],
            'refresh_token' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'integer'],
            'claude_dir_mode' => ['sometimes', Rule::in(ClaudeCredential::DIR_MODES)],
        ];
    }
}
```

**Step 4: Commit**

```bash
git add app/Http/Resources/CredentialResource.php app/Http/Requests/StoreCredentialRequest.php app/Http/Requests/UpdateCredentialRequest.php
git commit -m "feat: add CredentialResource and form request validators"
```

---

### Task 1.5: Create CredentialController

**Files:**
- Create: `app/Http/Controllers/Api/CredentialController.php`
- Modify: `routes/api.php`
- Reference: `app/Http/Controllers/Api/SessionController.php` (pattern)

**Step 1: Write the controller**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCredentialRequest;
use App\Http\Requests\UpdateCredentialRequest;
use App\Http\Resources\CredentialResource;
use App\Models\ClaudeCredential;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class CredentialController extends Controller
{
    public function __construct(
        private CredentialService $credentialService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $credentials = $request->user()
            ->credentials()
            ->withCount('sessions')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => CredentialResource::collection($credentials),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    public function store(StoreCredentialRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        // Check unique name for user
        if ($user->credentials()->where('name', $data['name'])->exists()) {
            return $this->errorResponse('DUPLICATE_NAME', "Credential '{$data['name']}' already exists", 409);
        }

        $credential = new ClaudeCredential([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'name' => $data['name'],
            'auth_type' => $data['auth_type'],
            'claude_dir_mode' => $data['claude_dir_mode'] ?? 'shared',
        ]);

        // Encrypt secrets
        if (!empty($data['api_key'])) {
            $credential->api_key_enc = Crypt::encryptString($data['api_key']);
        }
        if (!empty($data['access_token'])) {
            $credential->access_token_enc = Crypt::encryptString($data['access_token']);
        }
        if (!empty($data['refresh_token'])) {
            $credential->refresh_token_enc = Crypt::encryptString($data['refresh_token']);
        }
        if (!empty($data['expires_at'])) {
            $credential->expires_at = \Carbon\Carbon::createFromTimestampMs($data['expires_at']);
        }

        // First credential becomes default
        if ($user->credentials()->count() === 0) {
            $credential->is_default = true;
        }

        $credential->save();

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential->loadCount('sessions')),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    public function update(UpdateCredentialRequest $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $data = $request->validated();

        if (isset($data['name'])) $credential->name = $data['name'];
        if (isset($data['auth_type'])) $credential->auth_type = $data['auth_type'];
        if (isset($data['claude_dir_mode'])) $credential->claude_dir_mode = $data['claude_dir_mode'];

        if (!empty($data['api_key'])) {
            $credential->api_key_enc = Crypt::encryptString($data['api_key']);
        }
        if (!empty($data['access_token'])) {
            $credential->access_token_enc = Crypt::encryptString($data['access_token']);
        }
        if (!empty($data['refresh_token'])) {
            $credential->refresh_token_enc = Crypt::encryptString($data['refresh_token']);
        }
        if (isset($data['expires_at'])) {
            $credential->expires_at = $data['expires_at']
                ? \Carbon\Carbon::createFromTimestampMs($data['expires_at'])
                : null;
        }

        $credential->save();

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $credential->delete();

        return response()->json([
            'success' => true,
            'data' => ['deleted' => true],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    public function test(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        try {
            $result = $this->credentialService->testCredential($credential);
            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('TEST_FAILED', $e->getMessage(), 400);
        }
    }

    public function refresh(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        try {
            $result = $this->credentialService->refreshOAuthToken($credential);
            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('REFRESH_FAILED', $e->getMessage(), 400);
        }
    }

    public function capture(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $path = $request->input('credentials_path');

        try {
            $result = $this->credentialService->captureFromCredentialsFile($credential, $path);
            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('CAPTURE_FAILED', $e->getMessage(), 400);
        }
    }

    public function setDefault(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $credential->setAsDefault();

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential->fresh()),
            'meta' => ['timestamp' => now()->toIso8601String()],
        ]);
    }

    private function errorResponse(string $code, string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => ['code' => $code, 'message' => $message],
            'meta' => ['timestamp' => now()->toIso8601String()],
        ], $status);
    }
}
```

**Step 2: Add routes to `routes/api.php`**

Add inside the `auth:sanctum` middleware group:

```php
// Credentials
Route::prefix('credentials')->group(function () {
    Route::get('/', [Api\CredentialController::class, 'index']);
    Route::post('/', [Api\CredentialController::class, 'store']);
    Route::get('/{id}', [Api\CredentialController::class, 'show']);
    Route::patch('/{id}', [Api\CredentialController::class, 'update']);
    Route::delete('/{id}', [Api\CredentialController::class, 'destroy']);
    Route::post('/{id}/test', [Api\CredentialController::class, 'test']);
    Route::post('/{id}/refresh', [Api\CredentialController::class, 'refresh']);
    Route::post('/{id}/capture', [Api\CredentialController::class, 'capture']);
    Route::patch('/{id}/default', [Api\CredentialController::class, 'setDefault']);
});
```

**Step 3: Commit**

```bash
git add app/Http/Controllers/Api/CredentialController.php routes/api.php
git commit -m "feat: add CredentialController with full CRUD + refresh/capture/test"
```

---

### Task 1.6: Modify agent to accept credential env vars

**Files:**
- Modify: `packages/agent/src/handlers/session-handler.ts`
- Modify: `packages/agent/src/sessions/claude-process.ts`
- Modify: `packages/agent/src/types/index.ts`

**Step 1: Add credentialEnv to types**

In `packages/agent/src/types/index.ts`, add to `SessionConfig`:

```typescript
export interface SessionConfig {
    // ... existing fields
    credentialEnv?: Record<string, string>;
}
```

**Step 2: Modify session-handler.ts**

In the `handleCreateSession` function, pass `credentialEnv` from the payload to the session config:

```typescript
// In the session:create handler, add:
const config: SessionConfig = {
    // ... existing config from payload
    credentialEnv: payload.credentialEnv,
};
```

**Step 3: Modify claude-process.ts**

In the `start()` method, merge `credentialEnv` into the process environment:

```typescript
const env = {
    ...process.env,
    ...this.options.env,
    ...(this.options.credentialEnv || {}),
    CLAUDE_SESSION_ID: this.options.sessionId,
    FORCE_COLOR: '1',
};
```

**Step 4: Modify SessionController to inject credentials**

Back in `app/Http/Controllers/Api/SessionController.php`, modify the `store` method to resolve credential env vars before broadcasting the session:create event to the agent:

```php
// In store() method, after creating the session:
if ($request->has('credential_id')) {
    $credential = $request->user()->credentials()->find($request->input('credential_id'));
    if ($credential) {
        $credentialService = app(CredentialService::class);
        $credentialEnv = $credentialService->getSessionEnv($credential);
        // Include in the WebSocket payload to the agent
        $sessionConfig['credentialEnv'] = $credentialEnv;
    }
}
```

**Step 5: Commit**

```bash
git add packages/agent/src/types/index.ts packages/agent/src/handlers/session-handler.ts packages/agent/src/sessions/claude-process.ts app/Http/Controllers/Api/SessionController.php
git commit -m "feat: inject credential env vars into Claude Code sessions via agent"
```

---

## Phase 2: Dashboard Redesign (IDE-style)

### Task 2.1: Add TypeScript types for credentials

**Files:**
- Modify: `resources/js/types/index.ts`

**Step 1: Add credential types**

```typescript
// ==================== CREDENTIALS ====================

export type AuthType = 'api_key' | 'oauth';
export type ClaudeDirMode = 'shared' | 'isolated';
export type TokenStatus = 'ok' | 'missing' | 'needs_login' | 'expired';

export interface Credential {
    id: string;
    name: string;
    auth_type: AuthType;
    claude_dir_mode: ClaudeDirMode;
    is_default: boolean;
    masked_key: string | null;
    token_status: TokenStatus;
    is_expired: boolean;
    has_refresh_token: boolean;
    expires_at: string | null;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
    sessions_count?: number;
}

export interface CreateCredentialForm {
    name: string;
    auth_type: AuthType;
    api_key?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    claude_dir_mode?: ClaudeDirMode;
}

export interface UpdateCredentialForm {
    name?: string;
    auth_type?: AuthType;
    api_key?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    claude_dir_mode?: ClaudeDirMode;
}
```

**Step 2: Commit**

```bash
git add resources/js/types/index.ts
git commit -m "feat: add Credential TypeScript types"
```

---

### Task 2.2: Create credentials Pinia store

**Files:**
- Create: `resources/js/stores/credentials.ts`
- Reference: `resources/js/stores/machines.ts` (pattern)

**Step 1: Write the store**

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api';
import type { Credential, CreateCredentialForm, UpdateCredentialForm, ApiResponse } from '@/types';

export const useCredentialsStore = defineStore('credentials', () => {
    // ==================== STATE ====================
    const credentials = ref<Credential[]>([]);
    const selectedCredential = ref<Credential | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // ==================== GETTERS ====================
    const defaultCredential = computed(() =>
        credentials.value.find(c => c.is_default) || credentials.value[0] || null
    );

    const apiKeyCredentials = computed(() =>
        credentials.value.filter(c => c.auth_type === 'api_key')
    );

    const oauthCredentials = computed(() =>
        credentials.value.filter(c => c.auth_type === 'oauth')
    );

    const expiredCredentials = computed(() =>
        credentials.value.filter(c => c.token_status === 'expired')
    );

    // ==================== ACTIONS ====================
    async function fetchCredentials(): Promise<void> {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.get<ApiResponse<Credential[]>>('/credentials');
            credentials.value = response.data.data;
        } catch (err: any) {
            error.value = err.response?.data?.error?.message || 'Failed to fetch credentials';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function createCredential(form: CreateCredentialForm): Promise<Credential> {
        const response = await api.post<ApiResponse<Credential>>('/credentials', form);
        const created = response.data.data;
        credentials.value.push(created);
        return created;
    }

    async function updateCredential(id: string, form: UpdateCredentialForm): Promise<void> {
        const response = await api.patch<ApiResponse<Credential>>(`/credentials/${id}`, form);
        const idx = credentials.value.findIndex(c => c.id === id);
        if (idx >= 0) credentials.value[idx] = response.data.data;
    }

    async function deleteCredential(id: string): Promise<void> {
        await api.delete(`/credentials/${id}`);
        credentials.value = credentials.value.filter(c => c.id !== id);
        if (selectedCredential.value?.id === id) selectedCredential.value = null;
    }

    async function testCredential(id: string): Promise<any> {
        const response = await api.post(`/credentials/${id}/test`);
        return response.data.data;
    }

    async function refreshCredential(id: string): Promise<any> {
        const response = await api.post(`/credentials/${id}/refresh`);
        await fetchCredentials();
        return response.data.data;
    }

    async function captureOAuth(id: string): Promise<any> {
        const response = await api.post(`/credentials/${id}/capture`);
        await fetchCredentials();
        return response.data.data;
    }

    async function setDefault(id: string): Promise<void> {
        await api.patch(`/credentials/${id}/default`);
        await fetchCredentials();
    }

    return {
        credentials, selectedCredential, isLoading, error,
        defaultCredential, apiKeyCredentials, oauthCredentials, expiredCredentials,
        fetchCredentials, createCredential, updateCredential, deleteCredential,
        testCredential, refreshCredential, captureOAuth, setDefault,
    };
});
```

**Step 2: Commit**

```bash
git add resources/js/stores/credentials.ts
git commit -m "feat: add credentials Pinia store"
```

---

### Task 2.3: Create Credentials page and components

**Files:**
- Create: `resources/js/pages/credentials/Index.vue`
- Create: `resources/js/pages/credentials/CredentialCard.vue`
- Create: `resources/js/pages/credentials/AddCredentialModal.vue`

> **Note:** These are scaffold files. The actual implementation with full IDE-style layout, dark/light mode, and i18n will be done in Tasks 2.4-2.7. For now, create functional components following the existing page patterns.

**Step 1: Write Index.vue** (following the pattern from `resources/js/pages/machines/Index.vue`)

Create a page that:
- Lists all credentials in a card grid
- Shows status badges (ok/expired/needs_login)
- Has add/edit/delete buttons
- Shows credential type (API Key vs OAuth)
- Has a "Refresh All" button for OAuth tokens

**Step 2: Write CredentialCard.vue** (following `resources/js/components/machines/MachineCard.vue` pattern)

Card component showing:
- Credential name + alias (`claude-<name>`)
- Auth type badge
- Token status with color coding
- Masked key preview
- Action buttons: test, refresh, capture, edit, delete
- Default indicator star

**Step 3: Write AddCredentialModal.vue**

Modal with:
- Name input (validated: lowercase, alphanumeric, min 2)
- Auth type selector (API Key / OAuth tabs)
- API key input (password field) for api_key
- OAuth flow instructions + optional manual token input for oauth
- Claude dir mode toggle (shared / isolated)

**Step 4: Add route to Vue Router**

In `resources/js/router.ts` or equivalent:

```typescript
{
    path: '/credentials',
    name: 'credentials',
    component: () => import('@/pages/credentials/Index.vue'),
    meta: { requiresAuth: true },
}
```

**Step 5: Commit**

```bash
git add resources/js/pages/credentials/ resources/js/router.ts
git commit -m "feat: add Credentials page with card grid and add modal"
```

---

### Task 2.4: Implement dark/light mode system

**Files:**
- Modify: `tailwind.config.js` — extend theme with CSS variable references
- Create: `resources/js/composables/useTheme.ts`
- Modify: `resources/js/layouts/` — add theme toggle
- Create: `resources/css/themes.css`

**Step 1: Create theme composable**

```typescript
import { ref, watch, onMounted } from 'vue';

type Theme = 'dark' | 'light' | 'system';

const theme = ref<Theme>('system');
const resolvedTheme = ref<'dark' | 'light'>('dark');

export function useTheme() {
    function setTheme(t: Theme) {
        theme.value = t;
        localStorage.setItem('theme', t);
        applyTheme();
    }

    function applyTheme() {
        const isDark = theme.value === 'dark' ||
            (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        resolvedTheme.value = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolvedTheme.value);
        document.documentElement.classList.toggle('dark', isDark);
    }

    onMounted(() => {
        theme.value = (localStorage.getItem('theme') as Theme) || 'system';
        applyTheme();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    });

    return { theme, resolvedTheme, setTheme };
}
```

**Step 2: Create themes.css with CSS variables** (from design doc section 6)

**Step 3: Add theme toggle button to layout**

**Step 4: Commit**

```bash
git add tailwind.config.js resources/js/composables/useTheme.ts resources/css/themes.css
git commit -m "feat: add dark/light mode system with CSS variables and composable"
```

---

### Task 2.5: Implement IDE-style layout with sidebar + tabs

**Files:**
- Create: `resources/js/layouts/AppLayout.vue` — sidebar + main content + status bar
- Create: `resources/js/components/layout/Sidebar.vue`
- Create: `resources/js/components/layout/TabBar.vue`
- Create: `resources/js/components/layout/StatusBar.vue`
- Create: `resources/js/composables/useTabs.ts` — tab state management

**Key behavior:**
- Sidebar: 48px collapsed (icons only) / 240px expanded, toggle with hamburger
- TabBar: Manages open tabs (terminals, pages), close/reorder, context menu
- StatusBar: Shows active credential, connected machine, session count, theme toggle
- Tabs persist across navigation (terminal tabs stay open)

**Step 1-4: Implement each component following the design layout from Section 5**

**Step 5: Commit**

```bash
git add resources/js/layouts/ resources/js/components/layout/ resources/js/composables/useTabs.ts
git commit -m "feat: IDE-style layout with sidebar, tab bar, and status bar"
```

---

### Task 2.6: Implement multi-tab terminal system

**Files:**
- Modify: `resources/js/pages/sessions/Terminal.vue` — support opening in tab (not overlay)
- Modify: `resources/js/composables/useTabs.ts` — add terminal tab type
- Create: `resources/js/components/terminal/TerminalTab.vue`

**Key changes:**
- Terminals open as tabs in the TabBar, not as full-screen overlays
- Each tab has its own xterm instance and WebSocket connection
- Tabs can be renamed, duplicated, closed
- Split view support (horizontal/vertical) is stretch goal

**Step 1-4: Implement terminal tab system**

**Step 5: Commit**

```bash
git add resources/js/pages/sessions/Terminal.vue resources/js/components/terminal/
git commit -m "feat: multi-tab terminal system in IDE layout"
```

---

### Task 2.7: Add credential selector to session creation

**Files:**
- Modify: `resources/js/pages/sessions/New.vue` — add credential dropdown
- Modify: `resources/js/stores/sessions.ts` — include credential_id in createSession

**Step 1: Add credential dropdown to session creation form**

```vue
<!-- In New.vue template, add: -->
<div class="form-group">
    <label>Credential</label>
    <select v-model="form.credential_id">
        <option value="">Default</option>
        <option v-for="c in credentials" :key="c.id" :value="c.id">
            {{ c.name }} ({{ c.auth_type }}) - {{ c.masked_key }}
        </option>
    </select>
</div>
```

**Step 2: Modify sessions store to pass credential_id**

**Step 3: Commit**

```bash
git add resources/js/pages/sessions/New.vue resources/js/stores/sessions.ts
git commit -m "feat: credential selector in session creation"
```

---

## Phase 3: Public Pages Redesign

### Task 3.1: Redesign landing page

**Files:**
- Modify: `resources/views/landing.blade.php` (or `index.html` at root)
- Create: `resources/css/landing.css`

**Sections to implement:**
1. **Nav** — Logo, links (Features, Docs, Pricing), dark/light toggle, language switch, CTA
2. **Hero** — Headline, sub-headline, 2 CTAs, animated terminal preview
3. **Features** — 6 cards in 3x2 grid with icons
4. **Demo** — Terminal animation showing workflow
5. **Architecture** — Mermaid diagram or SVG illustration
6. **Install** — One-liner with copy button
7. **Footer** — Links, GitHub, license

**Style:** Dark gradient background, Tailwind CSS, responsive, inspired by Vercel/Linear/Cursor

**Step 1-7: Implement each section**

**Step 8: Commit**

```bash
git add resources/views/landing.blade.php resources/css/landing.css
git commit -m "feat: redesign landing page with modern dark theme"
```

---

### Task 3.2: Redesign documentation pages

**Files:**
- Create/Modify: `resources/views/docs/` — documentation layout with sidebar
- Create: `docs/en/getting-started.md`, `docs/en/multi-accounts.md`, etc.
- Create: `docs/fr/getting-started.md`, `docs/fr/multi-accounts.md`, etc.

**Structure:**
- Sidebar navigation with collapsible sections
- Search bar with instant results
- Code blocks with syntax highlighting + copy button
- Dark/Light mode support
- FR/EN language switch

**New documentation sections:**
1. Getting Started (updated)
2. Multi-Accounts (NEW — how to use the credentials system)
3. API Reference (updated with credential endpoints)
4. Architecture (updated diagram)
5. Agent Setup (existing)
6. Mobile App (existing)

**Step 1-6: Create each doc section**

**Step 7: Commit**

```bash
git add resources/views/docs/ docs/en/ docs/fr/
git commit -m "feat: redesign documentation with sidebar, search, and multi-accounts guide"
```

---

### Task 3.3: Redesign auth pages (Login/Register)

**Files:**
- Modify: `resources/js/pages/Login.vue`
- Modify: `resources/js/pages/Register.vue`

**Design:**
- Clean centered card on gradient background
- OAuth buttons (Google, GitHub) prominently displayed
- Email/password form below
- Dark/Light mode compatible
- Logo + tagline at top

**Step 1-3: Implement redesign**

**Step 4: Commit**

```bash
git add resources/js/pages/Login.vue resources/js/pages/Register.vue
git commit -m "feat: redesign login/register pages"
```

---

### Task 3.4: Create pricing and changelog pages

**Files:**
- Create: `resources/js/pages/Pricing.vue`
- Create: `resources/js/pages/Changelog.vue`

**Pricing tiers:**
- Community: Free, open-source, self-hosted
- Pro: Hosted, priority support, advanced features
- Enterprise: Custom, SLA, dedicated support

**Step 1-3: Implement pages**

**Step 4: Commit**

```bash
git add resources/js/pages/Pricing.vue resources/js/pages/Changelog.vue
git commit -m "feat: add pricing and changelog pages"
```

---

## Phase 4: Internationalization (FR/EN)

### Task 4.1: Setup vue-i18n

**Files:**
- Create: `resources/js/i18n/index.ts`
- Create: `resources/js/i18n/locales/en.json`
- Create: `resources/js/i18n/locales/fr.json`
- Modify: `resources/js/app.ts` — register i18n plugin

> **Note:** `vue-i18n` is already in `package.json` dependencies.

**Step 1: Create i18n config**

```typescript
import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('locale') || 'en',
    fallbackLocale: 'en',
    messages: { en, fr },
});
```

**Step 2: Create locale files with all UI strings**

Organize by page/component:
```json
{
    "nav": { "home": "Home", "credentials": "Credentials", ... },
    "credentials": { "title": "Credentials", "add": "Add Credential", ... },
    "terminal": { "launch": "Launch", "close": "Close", ... },
    ...
}
```

**Step 3: Register in app.ts**

```typescript
import { i18n } from './i18n';
app.use(i18n);
```

**Step 4: Commit**

```bash
git add resources/js/i18n/ resources/js/app.ts
git commit -m "feat: setup vue-i18n with EN/FR locale files"
```

---

### Task 4.2: Apply i18n to all Vue components

**Files:**
- Modify: All `.vue` files in `resources/js/pages/` and `resources/js/components/`

**Pattern:** Replace all hardcoded strings with `{{ $t('key') }}`:

```vue
<!-- Before -->
<h1>Credentials</h1>

<!-- After -->
<h1>{{ $t('credentials.title') }}</h1>
```

**Step 1-4: Go through each page systematically**

**Step 5: Add language switch component to nav**

**Step 6: Commit**

```bash
git add resources/js/
git commit -m "feat: apply FR/EN i18n to all Vue components"
```

---

### Task 4.3: Add SEO meta tags

**Files:**
- Modify: `resources/views/` — add hreflang, Open Graph, meta descriptions

**Step 1: Add to each public page:**
```html
<html lang="{{ app()->getLocale() }}">
<link rel="alternate" hreflang="en" href="...">
<link rel="alternate" hreflang="fr" href="...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
```

**Step 2: Commit**

```bash
git add resources/views/
git commit -m "feat: add SEO meta tags and hreflang for FR/EN"
```

---

## Phase 5: CLI Standalone Improvements

### Task 5.1: Add .claude dir mode to CLI

**Files:**
- Modify: `/home/rony/Projets/claude-accounts/db.py` — add `claude_dir_mode` column
- Modify: `/home/rony/Projets/claude-accounts/cli.py` — add `--shared-claude` / `--isolated-claude` flags

**Step 1: Add column to SQLite schema**

In `init_db()`, add `claude_dir_mode TEXT NOT NULL DEFAULT 'shared'` to the accounts table.

**Step 2: Modify `cmd_add` to accept dir mode flag**

**Step 3: Modify `get_launch_env` to set `CLAUDE_CONFIG_DIR` for isolated mode**

**Step 4: Commit**

```bash
cd /home/rony/Projets/claude-accounts
git add db.py cli.py
git commit -m "feat: add --shared-claude / --isolated-claude options"
```

---

### Task 5.2: Add `web` command + systemd service

**Files:**
- Modify: `/home/rony/Projets/claude-accounts/cli.py` — add `web` and `install --systemd` commands
- Create: `/home/rony/Projets/claude-accounts/claude-accounts.service` — systemd unit template

**Step 1: Add `cmd_web` function**

```python
def cmd_web(args):
    """Start web UI and open browser."""
    port = args.port or 5111
    import webbrowser
    import threading
    threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{port}")).start()
    cmd_serve(args)
```

**Step 2: Add systemd install to `cmd_install`**

When `--systemd` flag is passed:
1. Generate a user systemd service file at `~/.config/systemd/user/claude-accounts.service`
2. Run `systemctl --user daemon-reload`
3. Run `systemctl --user enable claude-accounts`
4. Add `claude-web` function to aliases.sh

**Step 3: Add `claude-web` alias**

```bash
claude-web() {
    if systemctl --user is-active claude-accounts >/dev/null 2>&1; then
        xdg-open "http://localhost:5111"
    else
        systemctl --user start claude-accounts
        sleep 1
        xdg-open "http://localhost:5111"
    fi
}
```

**Step 4: Commit**

```bash
cd /home/rony/Projets/claude-accounts
git add cli.py claude-accounts.service
git commit -m "feat: add web command + systemd service + claude-web alias"
```

---

### Task 5.3: Add Claude Nest bridge

**Files:**
- Create: `/home/rony/Projets/claude-accounts/nest_bridge.py`
- Modify: `/home/rony/Projets/claude-accounts/cli.py` — add `connect` and `sync` commands

**Step 1: Write nest_bridge.py**

Functions:
- `connect(nest_url, token)` — store connection info in SQLite
- `sync_push()` — POST local credentials to Claude Nest API
- `sync_pull()` — GET credentials from Claude Nest API and store locally
- `sync_auto()` — Push + Pull

**Step 2: Add CLI commands**

```python
s = sub.add_parser("connect", help="Connect to Claude Nest")
s.add_argument("url")
s.add_argument("--token", "-t", required=True)

s = sub.add_parser("sync", help="Sync with Claude Nest")
s.add_argument("direction", choices=["push", "pull", "auto"], default="auto", nargs="?")
```

**Step 3: Commit**

```bash
cd /home/rony/Projets/claude-accounts
git add nest_bridge.py cli.py
git commit -m "feat: add Claude Nest bridge for credential sync"
```

---

## Summary

| Phase | Tasks | Estimated Commits |
|-------|-------|------------------|
| Phase 1: Backend | 1.1-1.6 | 6 commits |
| Phase 2: Dashboard | 2.1-2.7 | 7 commits |
| Phase 3: Public Pages | 3.1-3.4 | 4 commits |
| Phase 4: i18n | 4.1-4.3 | 3 commits |
| Phase 5: CLI | 5.1-5.3 | 3 commits |
| **Total** | **23 tasks** | **23 commits** |

Each task is independent enough to be a single PR or part of a feature branch. Phase 1 must be completed before Phase 2 (frontend needs the API). Phases 3-5 can run in parallel.
