# SDK Reference

ClaudeNest provides official SDKs for popular programming languages to simplify API integration.

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @claudenest/sdk
# or
yarn add @claudenest/sdk
```

### Quick Start

```typescript
import { ClaudeNestClient } from '@claudenest/sdk';

const client = new ClaudeNestClient({
  token: 'YOUR_API_TOKEN',
  baseURL: 'https://api.claudenest.io/api'
});

// List machines
const machines = await client.machines.list();

// Create a session
const session = await client.sessions.create({
  machineId: 'MACHINE_ID',
  mode: 'interactive',
  projectPath: '/path/to/project'
});

// Connect to WebSocket
const ws = await client.sessions.connect(session.id);
ws.onOutput = (data) => console.log(data);
ws.sendInput('Hello Claude!');
```

## PHP SDK

### Installation

```bash
composer require claudenest/sdk
```

### Quick Start

```php
<?php
use ClaudeNest\SDK\Client;

$client = new Client([
    'token' => 'YOUR_API_TOKEN',
    'base_url' => 'https://api.claudenest.io/api'
]);

// List machines
$machines = $client->machines()->list();

// Create a session
$session = $client->sessions()->create([
    'machine_id' => 'MACHINE_ID',
    'mode' => 'interactive',
    'project_path' => '/path/to/project'
]);
```

## Python SDK

### Installation

```bash
pip install claudenest
```

### Quick Start

```python
from claudenest import Client

client = Client(token='YOUR_API_TOKEN')

# List machines
machines = client.machines.list()

# Create a session
session = client.sessions.create(
    machine_id='MACHINE_ID',
    mode='interactive',
    project_path='/path/to/project'
)

# Connect to WebSocket
ws = client.sessions.connect(session.id)
ws.on_output = lambda data: print(data)
ws.send_input('Hello Claude!')
```

## Go SDK

### Installation

```bash
go get github.com/claudenest/go-sdk
```

### Quick Start

```go
package main

import (
    "context"
    "github.com/claudenest/go-sdk/claudenest"
)

func main() {
    client := claudenest.NewClient("YOUR_API_TOKEN")
    
    // List machines
    machines, err := client.Machines.List(context.Background())
    
    // Create a session
    session, err := client.Sessions.Create(context.Background(), claudenest.CreateSessionRequest{
        MachineID:   "MACHINE_ID",
        Mode:        "interactive",
        ProjectPath: "/path/to/project",
    })
}
```

## Authentication

All SDKs support multiple authentication methods:

### API Token

```javascript
const client = new ClaudeNestClient({
  token: 'YOUR_API_TOKEN'
});
```

### OAuth (for web applications)

```javascript
const client = new ClaudeNestClient();

// Redirect to OAuth provider
const { url } = await client.auth.getOAuthUrl('github');
window.location.href = url;

// After callback, set the token
client.setToken(callbackToken);
```

## Error Handling

All SDKs throw specific error types that you can catch:

```javascript
import { ClaudeNestClient, AuthenticationError, RateLimitError } from '@claudenest/sdk';

try {
  const machines = await client.machines.list();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication error
    console.error('Token expired or invalid');
  } else if (error instanceof RateLimitError) {
    // Handle rate limit
    console.error(`Rate limit resets at ${error.resetTime}`);
  } else {
    // Handle other errors
    console.error(error.message);
  }
}
```

## TypeScript Support

The JavaScript SDK includes TypeScript definitions for all API responses:

```typescript
import { Machine, Session, Project } from '@claudenest/sdk/types';

const machine: Machine = await client.machines.get('MACHINE_ID');
const session: Session = await client.sessions.get('SESSION_ID');
```

## Contributing

SDKs are open source! Contribute on GitHub:

- [JavaScript SDK](https://github.com/claudenest/js-sdk)
- [PHP SDK](https://github.com/claudenest/php-sdk)
- [Python SDK](https://github.com/claudenest/python-sdk)
- [Go SDK](https://github.com/claudenest/go-sdk)
