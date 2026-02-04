# ClaudeNest API Documentation

> **Complete REST API reference for ClaudeNest**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Machines](#3-machines)
4. [Sessions](#4-sessions)
5. [Projects](#5-projects)
6. [Tasks](#6-tasks)
7. [Context (RAG)](#7-context-rag)
8. [File Locks](#8-file-locks)
9. [Skills](#9-skills)
10. [MCP](#10-mcp)
11. [WebSocket](#11-websocket)
12. [Error Reference](#12-error-reference)

---

## 1. Overview

### 1.1 Base URL

```
Production:  https://api.claudenest.dev/api
Development: http://localhost:8000/api
```

### 1.2 Response Format

All responses follow a consistent envelope format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-02T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "MCH_001",
    "message": "Machine not found"
  },
  "meta": {
    "timestamp": "2026-02-02T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### 1.3 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Server Error |

---

## 2. Authentication

### 2.1 OAuth Login

#### Redirect to Provider

```http
GET /api/auth/{provider}/redirect
```

**Parameters:**
- `provider` (path): `google` or `github`

**Response:**
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://accounts.google.com/o/oauth2/auth?..."
  },
  "meta": { ... }
}
```

#### OAuth Callback

```http
GET /api/auth/{provider}/callback?code={authorization_code}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://..."
    },
    "token": "cn_...",
    "expires_at": "2026-03-04T12:00:00Z"
  },
  "meta": { ... }
}
```

### 2.2 Email/Password Login

```http
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "remember": false
}
```

**Response:** Same as OAuth callback

### 2.3 Register

```http
POST /api/auth/register
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword",
  "password_confirmation": "securepassword"
}
```

### 2.4 Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "meta": { ... }
}
```

### 2.5 Get Current User

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://...",
      "email_verified_at": "2026-01-01T00:00:00Z"
    }
  },
  "meta": { ... }
}
```

### 2.6 Token Management

#### List Tokens

```http
GET /api/auth/tokens
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "API Access Token",
      "abilities": ["*"],
      "last_used_at": "2026-02-02T10:00:00Z",
      "expires_at": "2026-03-04T12:00:00Z",
      "is_active": true,
      "created_at": "2026-02-02T12:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### Create Token

```http
POST /api/auth/tokens
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Mobile App Token",
  "abilities": ["*"],
  "expires_in_days": 90
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "cn_...",
    "name": "Mobile App Token",
    "abilities": ["*"],
    "expires_at": "2026-05-02T12:00:00Z"
  },
  "meta": { ... }
}
```

#### Revoke Token

```http
DELETE /api/auth/tokens/{id}
Authorization: Bearer {token}
```

---

## 3. Machines

### 3.1 List Machines

```http
GET /api/machines
Authorization: Bearer {token}
```

**Query Parameters:**
- `search` (optional): Search by name or hostname
- `status` (optional): Filter by status (`online`, `offline`, `connecting`)
- `per_page` (optional): Items per page (default: 15)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "MacBook Pro",
      "platform": "darwin",
      "hostname": "macbook.local",
      "arch": "arm64",
      "status": "online",
      "active_sessions_count": 2,
      "max_sessions": 10,
      "capabilities": ["wake_on_lan", "gpu"],
      "last_seen_at": "2026-02-02T11:59:00Z",
      "connected_at": "2026-02-02T09:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "...",
    "request_id": "...",
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}
```

### 3.2 Register Machine

```http
POST /api/machines
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "MacBook Pro",
  "platform": "darwin",
  "hostname": "macbook.local",
  "arch": "arm64",
  "node_version": "20.11.0",
  "agent_version": "1.0.0",
  "claude_version": "1.0.0",
  "claude_path": "/usr/local/bin/claude",
  "capabilities": ["wake_on_lan", "gpu"],
  "max_sessions": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "machine": { ... },
    "token": "mn_..."
  },
  "meta": { ... }
}
```

### 3.3 Get Machine

```http
GET /api/machines/{id}
Authorization: Bearer {token}
```

### 3.4 Update Machine

```http
PATCH /api/machines/{id}
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "MacBook Pro Work",
  "max_sessions": 15,
  "capabilities": ["wake_on_lan", "gpu", "mcp"]
}
```

### 3.5 Delete Machine

```http
DELETE /api/machines/{id}
Authorization: Bearer {token}
```

### 3.6 Regenerate Token

```http
POST /api/machines/{id}/regenerate-token
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "mn_..."
  },
  "meta": { ... }
}
```

### 3.7 Get Environment

```http
GET /api/machines/{id}/environment
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": "darwin",
    "hostname": "macbook.local",
    "arch": "arm64",
    "node_version": "20.11.0",
    "agent_version": "1.0.0",
    "claude_version": "1.0.0",
    "claude_path": "/usr/local/bin/claude",
    "capabilities": ["wake_on_lan", "gpu"],
    "max_sessions": 10
  },
  "meta": { ... }
}
```

### 3.8 Wake-on-LAN

```http
POST /api/machines/{id}/wake
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Wake-on-LAN signal sent",
    "machine": { ... }
  },
  "meta": { ... }
}
```

---

## 4. Sessions

### 4.1 List Sessions

```http
GET /api/machines/{machine}/sessions
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by status
- `per_page` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "machine_id": "uuid",
      "mode": "interactive",
      "project_path": "/home/user/project",
      "status": "running",
      "pty_size": {"cols": 120, "rows": 40},
      "total_tokens": 15000,
      "total_cost": 0.45,
      "started_at": "2026-02-02T10:00:00Z",
      "duration": 3600,
      "formatted_duration": "1h 0m"
    }
  ],
  "meta": { ... }
}
```

### 4.2 Create Session

```http
POST /api/machines/{machine}/sessions
Authorization: Bearer {token}
```

**Request:**
```json
{
  "mode": "interactive",
  "project_path": "/home/user/project",
  "initial_prompt": "Refactor the auth module",
  "pty_size": {"cols": 120, "rows": 40}
}
```

**Modes:** `interactive`, `headless`, `oneshot`

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "status": "created",
      "mode": "interactive",
      ...
    },
    "websocket_token": "ws_..."
  },
  "meta": { ... }
}
```

### 4.3 Get Session

```http
GET /api/sessions/{id}
Authorization: Bearer {token}
```

### 4.4 Delete Session

```http
DELETE /api/sessions/{id}
Authorization: Bearer {token}
```

### 4.5 Get Session Logs

```http
GET /api/sessions/{id}/logs
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of logs (default: 1000)
- `type` (optional): Filter by type (`input`, `output`, `error`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "output",
      "data": "file.txt\n",
      "metadata": {},
      "created_at": "2026-02-02T10:00:01Z"
    }
  ],
  "meta": { ... }
}
```

### 4.6 Attach to Session

```http
POST /api/sessions/{id}/attach
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "websocket_token": "ws_...",
    "session": { ... }
  },
  "meta": { ... }
}
```

### 4.7 Send Input

```http
POST /api/sessions/{id}/input
Authorization: Bearer {token}
```

**Request:**
```json
{
  "data": "ls -la\n"
}
```

### 4.8 Resize PTY

```http
POST /api/sessions/{id}/resize
Authorization: Bearer {token}
```

**Request:**
```json
{
  "cols": 160,
  "rows": 50
}
```

---

## 5. Projects

### 5.1 List Projects

```http
GET /api/machines/{machine}/projects
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Project",
      "project_path": "/home/user/project",
      "summary": "A web application...",
      "token_usage_percent": 45.5,
      "active_instances_count": 3,
      "pending_tasks_count": 5,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### 5.2 Create Project

```http
POST /api/machines/{machine}/projects
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "My Project",
  "project_path": "/home/user/project",
  "summary": "Initial project description",
  "architecture": "MVC pattern with Laravel",
  "conventions": "PSR-12 coding standards",
  "settings": {
    "maxContextTokens": 8000,
    "taskTimeoutMinutes": 60
  }
}
```

### 5.3 Get Project

```http
GET /api/projects/{id}
Authorization: Bearer {token}
```

### 5.4 Update Project

```http
PATCH /api/projects/{id}
Authorization: Bearer {token}
```

**Request:**
```json
{
  "summary": "Updated description",
  "current_focus": "Implementing auth",
  "recent_changes": "Added JWT authentication"
}
```

### 5.5 Delete Project

```http
DELETE /api/projects/{id}
Authorization: Bearer {token}
```

### 5.6 Get Project Stats

```http
GET /api/projects/{id}/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tokens": 50000,
    "max_tokens": 100000,
    "token_usage_percent": 50.0,
    "active_instances": 3,
    "total_tasks": 20,
    "completed_tasks": 10,
    "pending_tasks": 5,
    "in_progress_tasks": 5,
    "active_locks": 2
  },
  "meta": { ... }
}
```

### 5.7 Get Instances

```http
GET /api/projects/{id}/instances
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "instance_1",
      "status": "busy",
      "context_usage": 65.5,
      "tasks_completed": 3,
      "current_task_id": "uuid",
      "uptime": 7200
    }
  ],
  "meta": { ... }
}
```

### 5.8 Get Activity Log

```http
GET /api/projects/{id}/activity
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of activities (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "instance_id": "instance_1",
      "type": "task_claimed",
      "details": {
        "task_id": "uuid",
        "task_title": "Implement auth"
      },
      "created_at": "2026-02-02T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### 5.9 Broadcast Message

```http
POST /api/projects/{id}/broadcast
Authorization: Bearer {token}
```

**Request:**
```json
{
  "type": "announcement",
  "content": "Restarting server in 5 minutes",
  "target": "all"
}
```

---

## 6. Tasks

### 6.1 List Tasks

```http
GET /api/projects/{project}/tasks
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Implement authentication",
      "description": "Add JWT-based auth",
      "priority": "high",
      "status": "in_progress",
      "assigned_to": "instance_1",
      "is_claimed": true,
      "is_blocked": false,
      "files": ["auth.php", "User.php"],
      "estimated_tokens": 2000,
      "created_at": "2026-02-02T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### 6.2 Create Task

```http
POST /api/projects/{project}/tasks
Authorization: Bearer {token}
```

**Request:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based authentication system",
  "priority": "high",
  "files": ["auth.php", "User.php"],
  "dependencies": [],
  "estimated_tokens": 2000
}
```

**Priorities:** `low`, `medium`, `high`, `critical`

### 6.3 Get Next Available Task

```http
GET /api/projects/{project}/tasks/next-available
Authorization: Bearer {token}
```

Returns the highest priority unclaimed task with no uncompleted dependencies.

### 6.4 Get Task

```http
GET /api/tasks/{id}
Authorization: Bearer {token}
```

### 6.5 Update Task

```http
PATCH /api/tasks/{id}
Authorization: Bearer {token}
```

### 6.6 Delete Task

```http
DELETE /api/tasks/{id}
Authorization: Bearer {token}
```

### 6.7 Claim Task

```http
POST /api/tasks/{id}/claim
Authorization: Bearer {token}
```

**Request:**
```json
{
  "instance_id": "instance_1"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "task": { ... },
    "message": "Task claimed successfully"
  },
  "meta": { ... }
}
```

**Response (Already Claimed):**
```json
{
  "success": false,
  "error": {
    "code": "TSK_002",
    "message": "Task already claimed by another instance"
  },
  "meta": { ... }
}
```

### 6.8 Release Task

```http
POST /api/tasks/{id}/release
Authorization: Bearer {token}
```

**Request:**
```json
{
  "reason": "Blocked by dependency"
}
```

### 6.9 Complete Task

```http
POST /api/tasks/{id}/complete
Authorization: Bearer {token}
```

**Request:**
```json
{
  "summary": "Implemented JWT auth with refresh tokens",
  "files_modified": ["auth.php", "User.php", "config/auth.php"]
}
```

---

## 7. Context (RAG)

### 7.1 Get Project Context

```http
GET /api/projects/{project}/context
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Project description...",
    "architecture": "Architecture overview...",
    "conventions": "Coding conventions...",
    "current_focus": "Current development focus...",
    "recent_changes": "Recent changes summary...",
    "compiled_context": "# Project Summary\n...\n\n---\n\n# Architecture\n...",
    "token_usage": {
      "total": 50000,
      "max": 100000,
      "percent": 50
    }
  },
  "meta": { ... }
}
```

### 7.2 Query Context (RAG Search)

```http
POST /api/projects/{project}/context/query
Authorization: Bearer {token}
```

**Request:**
```json
{
  "query": "How is authentication implemented?",
  "limit": 10,
  "min_similarity": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "How is authentication implemented?",
    "results": [
      {
        "id": "uuid",
        "content": "JWT authentication is implemented using...",
        "type": "context_update",
        "similarity": 0.92,
        "files": ["auth.php"],
        "created_at": "2026-02-01T10:00:00Z"
      }
    ],
    "total_results": 5,
    "search_method": "vector"
  },
  "meta": { ... }
}
```

### 7.3 Update Context

```http
PATCH /api/projects/{project}/context
Authorization: Bearer {token}
```

**Request:**
```json
{
  "summary": "Updated summary",
  "architecture": "Updated architecture",
  "conventions": "Updated conventions",
  "current_focus": "New focus",
  "recent_changes": "Latest changes"
}
```

### 7.4 Summarize Context

```http
POST /api/projects/{project}/context/summarize
Authorization: Bearer {token}
```

Triggers AI summarization of recent context chunks.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "AI-generated summary...",
    "chunks_processed": 50,
    "tokens_used": 1500
  },
  "meta": { ... }
}
```

### 7.5 List Context Chunks

```http
GET /api/projects/{project}/context/chunks
Authorization: Bearer {token}
```

**Query Parameters:**
- `type` (optional): Filter by type
- `instance_id` (optional): Filter by instance

### 7.6 Add Context Chunk

```http
POST /api/projects/{project}/context/chunks
Authorization: Bearer {token}
```

**Request:**
```json
{
  "content": "Important decision: Using JWT for auth",
  "type": "decision",
  "instance_id": "instance_1",
  "task_id": "uuid",
  "files": ["auth.php"],
  "importance_score": 0.9,
  "expires_at": "2026-03-02T00:00:00Z"
}
```

**Types:** `task_completion`, `context_update`, `file_change`, `decision`, `summary`, `broadcast`

### 7.7 Delete Context Chunk

```http
DELETE /api/projects/{project}/context/chunks/{chunkId}
Authorization: Bearer {token}
```

---

## 8. File Locks

### 8.1 List Locks

```http
GET /api/projects/{project}/locks
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "path": "src/auth.php",
      "locked_by": "instance_1",
      "reason": "Refactoring authentication",
      "locked_at": "2026-02-02T10:00:00Z",
      "expires_at": "2026-02-02T10:30:00Z",
      "remaining_seconds": 1500
    }
  ],
  "meta": { ... }
}
```

### 8.2 Acquire Lock

```http
POST /api/projects/{project}/locks
Authorization: Bearer {token}
```

**Request:**
```json
{
  "path": "src/auth.php",
  "instance_id": "instance_1",
  "reason": "Refactoring authentication",
  "duration_minutes": 30
}
```

### 8.3 Check Lock Status

```http
POST /api/projects/{project}/locks/check
Authorization: Bearer {token}
```

**Request:**
```json
{
  "path": "src/auth.php"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "locked": true,
    "locked_by": "instance_1",
    "reason": "Refactoring authentication",
    "expires_at": "2026-02-02T10:30:00Z"
  },
  "meta": { ... }
}
```

### 8.4 Extend Lock

```http
POST /api/projects/{project}/locks/extend
Authorization: Bearer {token}
```

**Request:**
```json
{
  "path": "src/auth.php",
  "instance_id": "instance_1",
  "additional_minutes": 15
}
```

### 8.5 Bulk Lock

```http
POST /api/projects/{project}/locks/bulk
Authorization: Bearer {token}
```

**Request:**
```json
{
  "paths": ["src/auth.php", "src/User.php"],
  "instance_id": "instance_1",
  "reason": "Auth refactor",
  "duration_minutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "acquired": ["src/auth.php"],
    "failed": ["src/User.php"],
    "failed_details": {
      "src/User.php": {
        "locked_by": "instance_2",
        "reason": "Adding fields"
      }
    }
  },
  "meta": { ... }
}
```

### 8.6 Release Lock

```http
POST /api/projects/{project}/locks/release
Authorization: Bearer {token}
```

**Request:**
```json
{
  "path": "src/auth.php",
  "instance_id": "instance_1"
}
```

### 8.7 Force Release (Admin)

```http
POST /api/projects/{project}/locks/force-release
Authorization: Bearer {token}
```

**Request:**
```json
{
  "path": "src/auth.php"
}
```

### 8.8 Release by Instance

```http
POST /api/projects/{project}/locks/release-by-instance
Authorization: Bearer {token}
```

**Request:**
```json
{
  "instance_id": "instance_1"
}
```

---

## 9. Skills

### 9.1 List Skills

```http
GET /api/machines/{machine}/skills
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "path": "debugging",
      "name": "Debugging",
      "description": "Advanced debugging techniques",
      "enabled": true,
      "priority": 10,
      "size_bytes": 15234,
      "last_modified": "2026-02-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### 9.2 Get Skill

```http
GET /api/machines/{machine}/skills/{path}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "path": "debugging",
    "name": "Debugging",
    "content": "# Debugging\n\n## Overview...",
    "enabled": true,
    "metadata": {
      "tags": ["debugging", "troubleshooting"],
      "version": "1.0"
    }
  },
  "meta": { ... }
}
```

### 9.3 Create/Update Skill

```http
POST /api/machines/{machine}/skills
Authorization: Bearer {token}
```

**Request:**
```json
{
  "path": "custom-skill",
  "name": "Custom Skill",
  "content": "# Custom Skill\n\nInstructions...",
  "description": "Description of the skill",
  "priority": 5,
  "metadata": {
    "tags": ["custom"]
  }
}
```

### 9.4 Update Skill

```http
PATCH /api/machines/{machine}/skills/{path}
Authorization: Bearer {token}
```

### 9.5 Toggle Skill

```http
POST /api/machines/{machine}/skills/{path}/toggle
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "debugging",
    "enabled": false
  },
  "meta": { ... }
}
```

### 9.6 Delete Skill

```http
DELETE /api/machines/{machine}/skills/{path}
Authorization: Bearer {token}
```

### 9.7 Bulk Update

```http
POST /api/machines/{machine}/skills/bulk
Authorization: Bearer {token}
```

**Request:**
```json
{
  "updates": [
    {"path": "debugging", "enabled": false},
    {"path": "testing", "priority": 20}
  ]
}
```

---

## 10. MCP

### 10.1 List MCP Servers

```http
GET /api/machines/{machine}/mcp
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "filesystem",
      "display_name": "File System",
      "status": "running",
      "transport": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/path"],
      "tools_count": 5,
      "last_started_at": "2026-02-02T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### 10.2 Get MCP Server

```http
GET /api/machines/{machine}/mcp/{name}
Authorization: Bearer {token}
```

### 10.3 Add MCP Server

```http
POST /api/machines/{machine}/mcp
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "fetch",
  "display_name": "Web Fetch",
  "command": "uvx",
  "args": ["mcp-server-fetch"],
  "env": {
    "HTTP_PROXY": "..."
  },
  "auto_start": true
}
```

### 10.4 Update MCP Server

```http
PATCH /api/machines/{machine}/mcp/{name}
Authorization: Bearer {token}
```

### 10.5 Start MCP Server

```http
POST /api/machines/{machine}/mcp/{name}/start
Authorization: Bearer {token}
```

### 10.6 Stop MCP Server

```http
POST /api/machines/{machine}/mcp/{name}/stop
Authorization: Bearer {token}
```

### 10.7 List Tools

```http
GET /api/machines/{machine}/mcp/{name}/tools
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "read_file",
      "description": "Read contents of a file",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {"type": "string"}
        },
        "required": ["path"]
      }
    }
  ],
  "meta": { ... }
}
```

### 10.8 Execute Tool

```http
POST /api/machines/{machine}/mcp/{name}/execute
Authorization: Bearer {token}
```

**Request:**
```json
{
  "tool": "read_file",
  "parameters": {
    "path": "/home/user/file.txt"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "File contents...",
    "mimeType": "text/plain"
  },
  "meta": { ... }
}
```

### 10.9 Get All Tools

```http
GET /api/machines/{machine}/mcp/all-tools
Authorization: Bearer {token}
```

Returns aggregated tools from all running MCP servers.

### 10.10 Delete MCP Server

```http
DELETE /api/machines/{machine}/mcp/{name}
Authorization: Bearer {token}
```

---

## 11. WebSocket

### 11.1 Connection

```javascript
// Connect to Laravel Reverb
const ws = new WebSocket('wss://api.claudenest.dev:8080/app/{app_key}');
```

### 11.2 Authentication

```javascript
// Subscribe to private channel
ws.send(JSON.stringify({
  event: 'pusher:subscribe',
  data: {
    channel: 'private-session.{sessionId}',
    auth: {
      headers: {
        'Authorization': 'Bearer {token}'
      }
    }
  }
}));
```

### 11.3 Events

#### Session Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `session:input` | Client → Server | `{data: string}` |
| `session:output` | Server → Client | `{data: string}` |
| `session:resize` | Client → Server | `{cols: number, rows: number}` |
| `session:terminate` | Client → Server | `{}` |
| `session:terminated` | Server → Client | `{}` |

#### Task Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `task:claimed` | Server → Client | `{task, instanceId}` |
| `task:released` | Server → Client | `{task, reason}` |
| `task:completed` | Server → Client | `{task, summary}` |

#### File Lock Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `file:locked` | Server → Client | `{path, lockedBy, reason}` |
| `file:unlocked` | Server → Client | `{path}` |

### 11.4 Example: Terminal Session

```javascript
const sessionId = 'uuid';
const wsToken = 'ws_...';

// Connect
const ws = new WebSocket(`wss://api.claudenest.dev:8080/app/${appKey}`);

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    event: 'pusher:subscribe',
    data: {
      channel: `private-session.${sessionId}`,
      auth: { token: wsToken }
    }
  }));
};

// Handle output
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'session:output') {
    terminal.write(data.data.data);
  }
};

// Send input
function sendInput(input) {
  ws.send(JSON.stringify({
    event: 'client-session:input',
    channel: `private-session.${sessionId}`,
    data: { data: input }
  }));
}
```

---

## 12. Error Reference

### 12.1 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_001` | Invalid provider | 400 |
| `AUTH_002` | Invalid credentials | 401 |
| `AUTH_003` | Unable to send reset link | 400 |
| `AUTH_004` | Invalid or expired reset token | 400 |
| `MCH_001` | Machine not found | 404 |
| `MCH_002` | Machine is offline | 400 |
| `MCH_003` | Machine does not support Wake-on-LAN | 400 |
| `MCH_004` | Machine is already online | 400 |
| `SES_001` | Session not found | 404 |
| `SES_002` | Session already terminated | 400 |
| `PRJ_001` | Project not found | 404 |
| `PRJ_002` | Project path already exists | 409 |
| `TSK_001` | Task not found | 404 |
| `TSK_002` | Task already claimed | 409 |
| `TSK_003` | Task not claimed by this instance | 403 |
| `LCK_001` | File is locked by another instance | 409 |
| `CTX_001` | Context chunk not found | 404 |
| `SKL_001` | Skill not found | 404 |
| `MCP_001` | MCP server not found | 404 |
| `MCP_002` | MCP server failed to start | 500 |
| `MCP_003` | Tool execution failed | 500 |
| `VAL_001` | Validation error | 422 |
| `RTE_001` | Rate limit exceeded | 429 |
| `SRV_001` | Internal server error | 500 |

### 12.2 Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "The given data was invalid.",
    "errors": {
      "email": ["The email field is required."],
      "name": ["The name must be at least 3 characters."]
    }
  },
  "meta": { ... }
}
```

---

## 13. Rate Limiting

| Endpoint Group | Limit |
|----------------|-------|
| Authentication | 10 requests/minute |
| API (authenticated) | 1000 requests/minute |
| WebSocket connections | 10 connections/minute |

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706880000
```

---

## 14. Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "2026-02-02T12:00:00Z"
  }
}
```

---

*API Version: 1.0.0 | Last Updated: 2026-02-02*
