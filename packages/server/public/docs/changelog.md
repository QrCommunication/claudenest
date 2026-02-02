# API Changelog

All notable changes to the ClaudeNest API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-02

### Added
- Initial stable release of ClaudeNest API
- **Authentication**: OAuth (Google, GitHub) and email/password authentication
- **Machines API**: Full CRUD operations, Wake-on-LAN support, environment info
- **Sessions API**: Create and manage Claude Code sessions, WebSocket support
- **Projects API**: Multi-agent project management with shared context
- **Tasks API**: Task distribution system for multi-agent coordination
- **Context API**: RAG-powered context querying and management
- **File Locks API**: Distributed file locking for conflict prevention
- **WebSocket Protocol**: Real-time bidirectional communication
- **MCP Support**: Model Context Protocol implementation
- **Rate Limiting**: Configurable rate limits per endpoint
- **Pagination**: Offset-based pagination for list endpoints

### Security
- Bearer token authentication required for all endpoints
- Token expiration with refresh capability
- Rate limiting to prevent abuse
- HTTPS required for all API calls

### Documentation
- Complete API reference documentation
- Interactive API tester
- Code examples in curl, JavaScript, and PHP
- OpenAPI 3.0 specification

## [0.9.0] - 2026-01-15

### Added
- Beta release of WebSocket protocol
- Session log streaming
- Project activity tracking
- Instance coordination features

### Changed
- Improved error response format with error codes
- Enhanced rate limit headers

### Fixed
- WebSocket reconnection stability
- Session termination edge cases

## [0.8.0] - 2026-01-01

### Added
- Multi-agent project support
- Task claiming and completion system
- File lock management
- Project broadcast messaging

### Changed
- Updated machine registration flow
- Improved context chunk storage

## [0.7.0] - 2025-12-15

### Added
- Wake-on-LAN support for machines
- Machine capabilities system
- Environment information endpoint

### Deprecated
- Legacy session creation endpoint (replaced in 0.9.0)

## [0.6.0] - 2025-12-01

### Added
- OAuth authentication (Google, GitHub)
- Personal access tokens
- Token management endpoints

### Changed
- Enhanced password reset flow

## [0.5.0] - 2025-11-15

### Added
- Session management
- Machine registration
- Basic authentication

### Notes
This was the first public alpha release of the ClaudeNest API.

---

## Upcoming Changes

### Planned for 1.1.0
- **Skills API**: Deploy and execute custom skills
- **Advanced RAG**: Vector-based semantic search
- **Webhooks**: Event notifications
- **API Key management**: Granular permissions

### Planned for 1.2.0
- **Organizations**: Multi-user team support
- **Audit Logs**: Complete activity history
- **Metrics API**: Usage analytics
- **Custom Integrations**: Plugin system

---

## Version Compatibility

| API Version | Client SDK Version | Support Status |
|-------------|-------------------|----------------|
| 1.0.x       | 1.0.x             | ✅ Supported   |
| 0.9.x       | 0.9.x             | ⚠️ Deprecated  |
| 0.8.x       | 0.8.x             | ❌ End of Life |

---

## Deprecation Policy

- **Minor versions**: Supported for 6 months after next minor release
- **Major versions**: Supported for 12 months after next major release
- **Deprecations**: Announced 3 months in advance

---

For questions or issues, contact [support@claudenest.io](mailto:support@claudenest.io).
