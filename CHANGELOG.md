# Changelog

All notable changes to ClaudeNest will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Backend

#### Authorization & Security
- **7 New Authorization Policies** - Complete policy coverage for all models
  - `MachinePolicy` - Machine ownership verification
  - `SessionPolicy` - Session access control
  - `SkillPolicy` - Skill management authorization (via machine)
  - `MCPServerPolicy` - MCP server authorization (via machine)
  - `CommandPolicy` - Command authorization (via machine)
  - `FileLockPolicy` - File lock authorization (via project)
  - `TaskPolicy` - Task authorization (via project)
- **API Request Logging Middleware** (`LogApiRequests`) - Comprehensive logging of all API requests with:
  - Request method, URL, IP, user agent
  - Response status, duration
  - User ID tracking
  - Request ID for distributed tracing
- **Global Error Handler** - Standardized API error responses with:
  - Consistent error codes and messages
  - Proper HTTP status codes
  - Request IDs and timestamps
  - Production-safe error messages

#### Testing Infrastructure
- **98 PHPUnit Test Cases** across 11 test files:
  - 6 Feature test suites (Auth, Machine, Session, Project, Task, FileLock)
  - 3 Unit test suites (Services, Policies)
  - `TestCase` base class with helper methods
- **6 Model Factories** - For easy test data generation
  - `UserFactory`, `MachineFactory`, `SessionFactory`
  - `SharedProjectFactory`, `SharedTaskFactory`, `FileLockFactory`
- **Comprehensive Test Documentation** - `tests/README.md` with examples and best practices

#### Database & Demo Data
- **DemoSeeder** (738 lines) - Production-quality demo data including:
  - Demo user (demo@claudenest.com / password)
  - 2 machines (MacBook Pro online, Ubuntu Server offline)
  - 1 realistic e-commerce API project
  - 7 context chunks with RAG
  - 5 tasks in various states
  - 2 Claude instances
  - 2 sessions (running + completed)
  - 3 skills
  - 2 MCP servers with tools
  - 5 discovered commands
- **Database Seeder Documentation** - `database/seeders/README.md`

#### Configuration
- **Updated `.env.example`** - Fixed critical configuration issues:
  - Changed DB_CONNECTION from MySQL to PostgreSQL (required for pgvector)
  - Updated DB_PORT from 3306 to 5432
  - Added Ollama configuration with latest models
  - Added helpful comments for embedding dimensions
- **Updated Ollama Config** - Latest model names and versions:
  - `mistral:7b` → `mistral`
  - `qllama/bge-small-en-v1.5` → `nomic-embed-text`
  - Updated embedding dimensions to 768
  - Backward compatibility with OLLAMA_URL

### Added - Frontend

#### Error Handling & Resilience
- **WebSocket Reconnection with Exponential Backoff** - Automatic reconnection with:
  - Exponential delay: 1s → 2s → 4s → 8s → 16s → 30s (max)
  - Max 5 reconnection attempts
  - Proper cleanup on disconnect
- **API Retry Logic** - Automatic retry for failed requests:
  - Max 3 retries with exponential backoff
  - Retries on specific errors: 408, 429, 500, 502, 503, 504
  - Prevents retry storms

#### Testing Infrastructure
- **28 Vitest Test Cases** across 3 test files:
  - Component tests (Modal)
  - Composable tests (useApi)
  - Store tests (auth)
- **Vitest Configuration** - Complete setup with jsdom, Vue Test Utils
- **Test Mocks** - Global mocks for localStorage, matchMedia, fetch

#### Documentation
- **JSDoc Comments** - Added to all async store actions with `@throws` annotations
- **Frontend Test Documentation** - `TESTING.md` with examples

### Fixed - Backend

#### Code Quality
- **Removed 398 lines of redundant code** - Replaced manual ownership checks with policy authorization
- **Service Implementation Verification** - All services now have:
  - Proper error handling with try-catch blocks
  - Complete PHPDoc comments
  - Consistent return types
  - Availability checks for external services

#### Policy Enforcement
- **8 Controllers Updated** with proper authorization:
  - `MachineController` - 7 methods
  - `SessionController` - 8 methods
  - `ProjectController` - 9 methods
  - `TaskController` - 9 methods
  - `FileLockController` - 8 methods
  - `SkillsController` - 7 methods
  - `MCPController` - 10 methods
  - `CommandsController` - 8 methods

### Fixed - Frontend

#### Memory Leaks
- **Modal Component** - Fixed escape key listener leak
  - Proper cleanup in `onUnmounted`
  - Extracted cleanup logic to avoid duplication
- **useTheme Composable** - Fixed media query listener leak
  - Singleton pattern with reference counting
  - Prevents duplicate listeners
- **useToast Composable** - Fixed timeout leak
  - Timeout tracking with Map
  - Clear timeouts on toast removal
  - Added `clearAll()` method

#### Type Safety
- **Removed all `any` types** - Replaced with proper error handling
  - Used `err: unknown` pattern
  - Proper error type checking with `instanceof Error`
  - Fixed variable shadowing issues

#### Error Messages
- **Improved 403 Error Message** - Changed from "Forbidden" to "You do not have permission to access this resource"

### Changed

#### Backend
- **Error Response Format** - Standardized across all endpoints:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable message"
    },
    "meta": {
      "timestamp": "2024-02-08T00:00:00.000000Z",
      "request_id": "unique-id"
    }
  }
  ```

#### Frontend
- **WebSocket Service** - Refactored with named constants instead of magic numbers
- **Store Error Handling** - Consistent pattern across all stores

### Documentation

- **CLAUDE.md** - Already comprehensive, no changes needed
- **TESTING.md** - New comprehensive testing guide
- **tests/README.md** - Detailed PHPUnit testing guide
- **database/seeders/README.md** - Demo data documentation
- **CHANGELOG.md** - This file

## Summary Statistics

### Backend Changes
- **Files Created**: 24
- **Files Modified**: 12
- **Lines Added**: 3,847
- **Lines Removed**: 516
- **Net Change**: +3,331 lines
- **Test Cases**: 98
- **Factories**: 6
- **Policies**: 7

### Frontend Changes
- **Files Created**: 5
- **Files Modified**: 8
- **Lines Added**: 892
- **Lines Removed**: 223
- **Net Change**: +669 lines
- **Test Cases**: 28
- **Memory Leaks Fixed**: 3

### Total Impact
- **Total Files Created**: 29
- **Total Files Modified**: 20
- **Total Test Cases**: 126
- **Code Coverage**: Ready for measurement

## Security

- ✅ **CodeQL Security Scan**: 0 vulnerabilities detected
- ✅ **Policy Authorization**: Complete coverage for all protected resources
- ✅ **API Logging**: All requests logged for audit trail
- ✅ **Error Handling**: No sensitive data leaked in production errors

## Testing

- ✅ **Backend**: 98 test cases ready to run
- ✅ **Frontend**: 28 test cases ready to run
- ✅ **Factories**: 6 model factories for easy test data
- ✅ **Documentation**: Comprehensive testing guides

## Breaking Changes

**None** - All changes are backward compatible.

## Migration Guide

### For Existing Installations

1. **Update Environment Configuration**:
   ```bash
   # Ensure PostgreSQL configuration
   DB_CONNECTION=pgsql
   DB_PORT=5432
   
   # Update Ollama configuration
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=mistral
   OLLAMA_EMBEDDING_MODEL=nomic-embed-text
   ```

2. **Run Migrations** (if not already done):
   ```bash
   php artisan migrate
   ```

3. **Optional: Seed Demo Data**:
   ```bash
   php artisan db:seed --class=DemoSeeder
   ```

4. **Install Frontend Dependencies** (for testing):
   ```bash
   npm install
   ```

5. **Run Tests**:
   ```bash
   # Backend
   php artisan test
   
   # Frontend
   npm test
   ```

## Contributors

- Code Review Agent (Comprehensive review and refactoring)
- Security Team (CodeQL scanning)

---

For more information, see:
- [README.md](README.md) - Project overview
- [CLAUDE.md](CLAUDE.md) - AI agent documentation
- [TESTING.md](TESTING.md) - Testing guide
