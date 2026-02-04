# Getting Started with ClaudeNest API

Welcome to ClaudeNest! This guide will help you get up and running with the ClaudeNest API in minutes.

## Prerequisites

Before you begin, make sure you have:

- A ClaudeNest account (sign up at [claudenest.io](https://claudenest.io))
- An API token (generate one from your dashboard)
- A tool for making HTTP requests (curl, Postman, or your preferred HTTP client)

## Quick Start

### 1. Authentication

All API requests require authentication. Include your token in the Authorization header:

```bash
curl https://api.claudenest.io/api/auth/me \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### 2. List Your Machines

See all machines connected to your account:

```bash
curl https://api.claudenest.io/api/machines \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### 3. Create a Session

Start a new Claude Code session on a machine:

```bash
curl -X POST https://api.claudenest.io/api/machines/YOUR_MACHINE_ID/sessions \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "interactive",
    "project_path": "/path/to/project"
  }'
```

### 4. Connect via WebSocket

For real-time interaction, connect to the session via WebSocket:

```javascript
// First, get a WebSocket token
const response = await fetch('/api/sessions/SESSION_ID/attach', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
const { ws_token, ws_url } = await response.json();

// Connect to WebSocket
const ws = new WebSocket(ws_url);
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token: ws_token }));
};
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.data); // Session output
};
```

## Next Steps

- Explore the [API Reference](/docs) for complete endpoint documentation
- Learn about [Multi-Agent Projects](/docs/projects) for collaborative development
- Check out [WebSocket Protocol](/docs/websocket) for real-time communication
- View [Error Codes](/docs/errors) for troubleshooting

## SDKs and Libraries

We offer official SDKs for popular languages:

- **JavaScript/TypeScript**: `npm install @claudenest/sdk`
- **PHP**: `composer require claudenest/sdk`
- **Python**: `pip install claudenest`
- **Go**: `go get github.com/claudenest/go-sdk`

## Support

Need help? We're here to assist:

- [GitHub Issues](https://github.com/claudenest/claudenest/issues)
- [Discord Community](https://discord.gg/claudenest)
- [Email Support](mailto:support@claudenest.io)
