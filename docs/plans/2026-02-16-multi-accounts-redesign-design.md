# Design: Multi-Accounts Integration + Full Redesign

> **Date**: 2026-02-16
> **Status**: Approved
> **Scope**: Claude Nest + claude-accounts CLI standalone

---

## 1. Overview

### Problem
Claude Nest lacks multi-account credential management. Users cannot securely store and switch between multiple Anthropic API keys or OAuth tokens. Additionally, the public-facing pages and documentation need a comprehensive visual redesign with dark/light mode and FR/EN internationalization.

### Solution
1. **Native "Credentials" module** in Claude Nest (Laravel + Vue.js)
2. **Improved CLI standalone** (claude-accounts Python) with bridge to Claude Nest
3. **Full visual redesign** of all public pages, documentation, and dashboard
4. **Dark/Light mode** + **FR/EN i18n** across the entire application
5. **Systemd service** + auto-alias for launching the web interface

---

## 2. Data Model

### New Table: `claude_credentials`

```sql
CREATE TABLE claude_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    auth_type       VARCHAR(20) NOT NULL CHECK (auth_type IN ('api_key', 'oauth')),
    api_key_enc     TEXT DEFAULT NULL,          -- AES-256-CBC via Laravel Crypt
    access_token_enc TEXT DEFAULT NULL,         -- AES-256-CBC via Laravel Crypt
    refresh_token_enc TEXT DEFAULT NULL,        -- AES-256-CBC via Laravel Crypt
    expires_at      TIMESTAMP NULL,
    claude_dir_mode VARCHAR(20) NOT NULL DEFAULT 'shared' CHECK (claude_dir_mode IN ('shared', 'isolated')),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_at    TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, name)
);

CREATE INDEX idx_credentials_user ON claude_credentials(user_id);
CREATE INDEX idx_credentials_default ON claude_credentials(user_id, is_default) WHERE is_default = TRUE;
```

### Encryption
- Uses Laravel's `Crypt::encryptString()` (AES-256-CBC via `APP_KEY`)
- No separate encryption key needed
- Fields: `api_key_enc`, `access_token_enc`, `refresh_token_enc`

### Relationship with Sessions
- `sessions` table gets a new nullable `credential_id` column
- When creating a session, the credential is decrypted and env vars injected
- For `isolated` mode: `CLAUDE_CONFIG_DIR=~/.claude-<credential_name>/`

---

## 3. API Endpoints

### Credentials API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credentials` | List user's credentials (masked) |
| POST | `/api/credentials` | Create credential |
| GET | `/api/credentials/{id}` | Get credential detail (masked) |
| PATCH | `/api/credentials/{id}` | Update credential |
| DELETE | `/api/credentials/{id}` | Delete credential |
| POST | `/api/credentials/{id}/test` | Test credential validity |
| POST | `/api/credentials/{id}/refresh` | Refresh OAuth token |
| POST | `/api/credentials/{id}/capture` | Capture from .credentials.json |
| PATCH | `/api/credentials/{id}/default` | Set as default |

### Modified Endpoints

- `POST /api/machines/{id}/sessions` — accepts optional `credential_id`
- Session creation flow injects decrypted credential env vars into agent

---

## 4. Backend Architecture (Laravel)

### New Files

```
app/
├── Http/Controllers/Api/CredentialController.php
├── Http/Resources/CredentialResource.php
├── Http/Requests/StoreCredentialRequest.php
├── Http/Requests/UpdateCredentialRequest.php
├── Models/ClaudeCredential.php
├── Services/CredentialService.php
├── Events/CredentialUsed.php
└── Policies/ClaudeCredentialPolicy.php

database/migrations/
└── xxxx_create_claude_credentials_table.php
└── xxxx_add_credential_id_to_sessions.php
```

### CredentialService Key Methods

```php
class CredentialService
{
    public function getSessionEnv(ClaudeCredential $credential): array
    {
        // Returns decrypted env vars for session injection
        // ['ANTHROPIC_API_KEY' => '...'] or ['CLAUDE_CODE_OAUTH_TOKEN' => '...']
        // + optional ['CLAUDE_CONFIG_DIR' => '~/.claude-<name>/']
    }

    public function refreshOAuthToken(ClaudeCredential $credential): array
    {
        // Calls Anthropic OAuth endpoint to refresh token
    }

    public function captureFromCredentialsFile(ClaudeCredential $credential, ?string $path = null): array
    {
        // Reads ~/.claude/.credentials.json and stores tokens
    }

    public function testCredential(ClaudeCredential $credential): array
    {
        // Tests if credential is valid (API call or token expiry check)
    }
}
```

### Agent Modification

In `packages/agent/src/handlers/session-handler.ts`:
```typescript
// session:create payload now includes optional credential env vars
interface SessionCreatePayload {
    // ... existing fields
    credentialEnv?: Record<string, string>;  // NEW: injected env vars
}
```

In `packages/agent/src/sessions/claude-process.ts`:
```typescript
// SpawnOptions now merges credential env vars
const env = {
    ...process.env,
    ...this.options.env,
    ...this.options.credentialEnv,  // NEW: from credential
};
```

---

## 5. Dashboard Redesign (IDE-inspired)

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Sidebar (48px collapsed / 240px expanded)               │
│  ┌────────┐ ┌─────────────────────────────────────────┐  │
│  │ Icons  │ │  Tab Bar: [Terminal 1] [Terminal 2] [+]  │  │
│  │        │ ├─────────────────────────────────────────┤  │
│  │ 🏠 Home│ │                                         │  │
│  │ 🔐 Cred│ │  Main Content Area                      │  │
│  │ 💻 Mach│ │  (Terminal / Form / List)                │  │
│  │ 📁 Proj│ │                                         │  │
│  │ 🔧 Sess│ │                                         │  │
│  │ 📋 Task│ │                                         │  │
│  │ ⚙️ Set │ │                                         │  │
│  │        │ ├─────────────────────────────────────────┤  │
│  │        │ │  Status Bar: credential | machine | ... │  │
│  └────────┘ └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Key UI Components

- **Tab System**: Tabs for multiple terminal sessions (like browser/IDE tabs)
- **Split View**: Horizontal/vertical split for parallel terminals
- **Command Palette**: `Ctrl+K` for quick search across everything
- **Sidebar**: Icon-only (collapsed) or full (expanded), VS Code style
- **Status Bar**: Active credential, connected machine, session count
- **Dark/Light Toggle**: In settings + status bar quick toggle

### Terminal Improvements

- Open in new tab within the dashboard (not overlay)
- Multiple tabs simultaneously
- Split view (drag-to-split like VS Code)
- Tab context menu: rename, duplicate, close others
- Terminal persists across page navigation

---

## 6. Theming: Dark/Light Mode

### CSS Variables System

```css
:root {
    /* Dark Theme (default) */
    --bg-primary: #0f0f1a;
    --bg-secondary: #1a1b26;
    --bg-tertiary: #24283b;
    --bg-surface: #2a2b3d;
    --text-primary: #e8eaf0;
    --text-secondary: #9ca3af;
    --text-muted: #6b7280;
    --accent-primary: #a855f7;
    --accent-secondary: #6366f1;
    --accent-tertiary: #22d3ee;
    --border: #2d2f40;
    --success: #22c55e;
    --error: #ef4444;
    --warning: #fbbf24;
}

[data-theme="light"] {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-surface: #e2e8f0;
    --text-primary: #1e293b;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --accent-primary: #7c3aed;
    --accent-secondary: #4f46e5;
    --accent-tertiary: #0891b2;
    --border: #e2e8f0;
    --success: #16a34a;
    --error: #dc2626;
    --warning: #d97706;
}
```

### Implementation
- Toggle saved to `localStorage` + user preference in database
- CSS custom properties consumed by all components
- Tailwind config extended with CSS variable references
- System preference detection: `prefers-color-scheme`

---

## 7. Internationalization (FR/EN)

### Frontend (Vue.js Dashboard)
- **Library**: `vue-i18n` with Composition API
- **Structure**: `resources/js/locales/{fr,en}.json`
- **Lazy loading**: Per-page locale chunks
- **Fallback**: English (default)
- **Language switch**: Dropdown in nav bar + stored in user preferences

### Public Pages (Landing, Docs)
- **Approach**: Blade templates with `@lang()` directives
- **URL structure**: `/fr/docs`, `/en/docs` or toggle without URL change
- **SEO**: `hreflang` tags, lang attribute on `<html>`

### Documentation
- **Structure**: `docs/{en,fr}/` with mirror structure
- **Markdown rendering**: Inline i18n via separate files per language

---

## 8. Public Pages Redesign

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Hero, features, demo, install, pricing |
| Docs Home | `/docs` | Documentation hub with search |
| Docs: Getting Started | `/docs/getting-started` | Step-by-step setup guide |
| Docs: Multi-Accounts | `/docs/multi-accounts` | New section for credential management |
| Docs: API Reference | `/docs/api` | Interactive API reference (OpenAPI) |
| Docs: Architecture | `/docs/architecture` | System diagrams and explanations |
| Docs: Agent Setup | `/docs/agent` | Agent installation and configuration |
| Docs: Mobile App | `/docs/mobile` | Mobile app setup guide |
| Pricing | `/pricing` | Community (free) / Pro / Enterprise |
| Changelog | `/changelog` | Version history |
| Login | `/login` | OAuth + email authentication |
| Register | `/register` | User registration |

### Landing Page Design

**Hero Section:**
- Full-bleed dark gradient background
- Animated terminal preview showing multi-account workflow
- "Remote Claude Code Orchestration" headline
- Two CTAs: "Get Started" (primary) + "View Demo" (secondary)

**Features Section:**
- 6 feature cards in 3x2 grid
- Each with icon, title, description
- Hover animation with subtle glow effect

**Demo Section:**
- Embedded terminal animation (typed.js or custom)
- Shows: `cn add perso --oauth` → `cn launch perso` → terminal output

**Architecture Section:**
- Interactive Mermaid diagram
- Click to expand each component
- Animated data flow lines

**Install Section:**
- One-liner: `curl -fsSL https://claudenest.io/install.sh | bash`
- Copy-to-clipboard button
- Alternative: Docker compose command

**Style References:**
- Vercel.com for clean typography and spacing
- Linear.app for dark mode gradients
- Cursor.com for IDE-like aesthetics
- Tailwind CSS for utility-first styling

---

## 9. CLI Standalone (claude-accounts)

### Improvements

```
claude-accounts add <name> --key <key>              # API key account
claude-accounts add <name> --oauth                   # OAuth account
claude-accounts add <name> --shared-claude           # Uses ~/.claude (default)
claude-accounts add <name> --isolated-claude          # Uses ~/.claude-<name>/
claude-accounts login <name>                          # OAuth login flow
claude-accounts launch <name> [-- args...]            # Launch with credential
claude-accounts web                                   # Start web UI + open browser
claude-accounts install                               # Install aliases + optional systemd
claude-accounts install --systemd                     # Create systemd service
claude-accounts connect <nest-url> --token <token>    # Connect to Claude Nest
claude-accounts sync                                  # Sync credentials with Claude Nest
claude-accounts list / status / refresh / remove      # Existing commands
```

### Bridge to Claude Nest

When connected to a Claude Nest instance:
- `claude-accounts sync push` — Push local credentials to Claude Nest
- `claude-accounts sync pull` — Pull credentials from Claude Nest
- `claude-accounts sync auto` — Auto-sync on launch
- Credentials are transferred encrypted (TLS + re-encrypted with Nest's APP_KEY)

### Systemd Service (for standalone Flask UI)

```ini
# ~/.config/systemd/user/claude-accounts.service
[Unit]
Description=Claude Accounts Manager Web UI

[Service]
Type=simple
WorkingDirectory=/path/to/claude-accounts
ExecStart=/path/to/venv/bin/python server.py
Restart=on-failure

[Install]
WantedBy=default.target
```

Auto-alias `claude-web`:
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

---

## 10. Implementation Priority

### Phase 1: Core Credentials Module
1. Migration + Model `ClaudeCredential`
2. `CredentialController` + `CredentialService`
3. Agent env var injection
4. Basic credential management in Vue dashboard

### Phase 2: Dashboard Redesign
1. New layout system (sidebar + tabs + status bar)
2. Terminal tab system (multi-tab, no overlay)
3. Credential selector in session creation
4. Dark/Light mode toggle

### Phase 3: Public Pages
1. Landing page redesign
2. Documentation pages (updated + new multi-accounts section)
3. Login/Register redesign
4. Pricing/Changelog pages

### Phase 4: i18n + Polish
1. vue-i18n integration
2. FR/EN translations for all pages
3. Documentation in both languages
4. SEO optimization (hreflang, meta tags)

### Phase 5: CLI Standalone Improvements
1. `--shared-claude` / `--isolated-claude` options
2. `claude-accounts web` + systemd service
3. Bridge to Claude Nest (`connect`, `sync`)
4. Updated Flask UI design to match Claude Nest theme

---

## 11. Non-Goals (Already Handled by Claude Nest)

These features already exist in Claude Nest and do not need reimplementation:
- **File locking**: `FileLock` model + `FileLockController`
- **Task orchestration**: `SharedTask` with atomic claiming
- **Remote connection**: WebSocket via Laravel Reverb + agent
- **MCP integration**: `MCPServer` model + `MCPController`
- **Multi-agent coordination**: `ClaudeInstance` + context RAG

---

## 12. Success Criteria

- [ ] User can create, store, and manage multiple Anthropic credentials
- [ ] Credentials are securely encrypted at rest
- [ ] Sessions can be launched with a specific credential
- [ ] Terminal tabs allow multiple simultaneous sessions
- [ ] Dashboard has consistent dark/light mode
- [ ] All pages available in French and English
- [ ] Landing page is modern, responsive, and SEO-optimized
- [ ] CLI standalone works independently and can sync with Claude Nest
- [ ] Documentation is updated with multi-accounts guide
- [ ] Systemd service auto-starts on boot
