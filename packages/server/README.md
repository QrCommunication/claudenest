# ClaudeNest Server

A Laravel 11 based server for remote Claude Code orchestration.

## Features

- **Multi-Agent Orchestration**: Coordinate multiple Claude instances on the same project
- **Real-time Terminal Sessions**: WebSocket-powered terminal access via Reverb
- **RAG Context Management**: Vector-based context retrieval with pgvector
- **Task Management**: Distributed task system with claiming and completion tracking
- **File Locking**: Prevent conflicts with distributed file locking
- **OAuth Authentication**: Google and GitHub login support

## Requirements

- PHP 8.3+
- PostgreSQL 16+ with pgvector extension
- Redis 7+ (optional, for caching and queues)
- Ollama (optional, for embeddings and summarization)

## Installation

```bash
# Clone and install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Start the server
php artisan serve

# Start Reverb WebSocket server
php artisan reverb:start
```

## Configuration

### Database

Configure PostgreSQL in `.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### WebSocket (Reverb)

```env
REVERB_APP_ID=claudenest
REVERB_APP_KEY=claudenest-key
REVERB_APP_SECRET=claudenest-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

### OAuth

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
```

## API Endpoints

### Authentication
- `GET /api/auth/{provider}/redirect` - OAuth redirect
- `GET /api/auth/{provider}/callback` - OAuth callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Machines
- `GET /api/machines` - List machines
- `POST /api/machines` - Register machine
- `GET /api/machines/{id}` - Get machine details
- `DELETE /api/machines/{id}` - Delete machine

### Sessions
- `GET /api/machines/{id}/sessions` - List sessions
- `POST /api/machines/{id}/sessions` - Create session
- `GET /api/sessions/{id}` - Get session
- `POST /api/sessions/{id}/attach` - Attach to session

### Projects (Multi-Agent)
- `GET /api/machines/{id}/projects` - List projects
- `POST /api/machines/{id}/projects` - Create project
- `GET /api/projects/{id}` - Get project

### Tasks
- `GET /api/projects/{id}/tasks` - List tasks
- `POST /api/projects/{id}/tasks` - Create task
- `POST /api/tasks/{id}/claim` - Claim task
- `POST /api/tasks/{id}/complete` - Complete task

### File Locks
- `GET /api/projects/{id}/locks` - List locks
- `POST /api/projects/{id}/locks` - Acquire lock
- `POST /api/projects/{id}/locks/release` - Release lock

### Context (RAG)
- `GET /api/projects/{id}/context` - Get context
- `POST /api/projects/{id}/context/query` - Search context
- `POST /api/projects/{id}/context/summarize` - Summarize context

## Brand Colors

- Primary (Purple): `#a855f7`
- Indigo: `#6366f1`
- Cyan: `#22d3ee`
- Background: `#1a1b26`

## License

MIT
