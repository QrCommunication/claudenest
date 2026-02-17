<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>MCP Server Setup</h1>
      <p class="lead">
        Register, configure, and use Model Context Protocol servers with ClaudeNest
        to extend Claude's capabilities with custom tools and integrations.
      </p>
    </header>

    <section id="what-is-mcp">
      <h2>What is MCP?</h2>
      <p>
        The <strong>Model Context Protocol (MCP)</strong> is an open standard that lets LLM applications
        interact with external tools, data sources, and services through a unified interface.
        ClaudeNest supports managing MCP servers on your machines, making their tools available
        to Claude Code sessions.
      </p>

      <p>MCP servers can provide:</p>
      <ul>
        <li><strong>Tools</strong> -- Callable functions such as database queries, API calls, or file operations.</li>
        <li><strong>Resources</strong> -- Read-only data sources like documentation, config files, or knowledge bases.</li>
        <li><strong>Prompts</strong> -- Pre-defined prompt templates for common workflows.</li>
      </ul>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>Transport modes</strong>
          <p>ClaudeNest supports both <code>stdio</code> (local process) and <code>sse</code> (HTTP Server-Sent Events) transports for MCP servers.</p>
        </div>
      </div>

      <h3>How it works</h3>
      <p>
        The ClaudeNest agent running on your machine manages MCP server lifecycle. You register
        servers via the API, and the agent starts, monitors, and routes tool calls to them.
      </p>
      <CodeBlock
        :code="architectureCode"
        language="bash"
        filename="Architecture"
      />
    </section>

    <section id="registering">
      <h2>Registering an MCP Server</h2>
      <p>
        Register an MCP server on a specific machine via the API. You need to provide the server
        name, transport type, and the command or URL to connect to it.
      </p>

      <h3>stdio transport (local process)</h3>
      <p>
        For servers that run as local processes, specify the command and arguments to launch them.
      </p>
      <CodeTabs
        :tabs="[
          {
            label: 'cURL',
            language: 'bash',
            code: registerStdioCurl,
            filename: 'Terminal'
          },
          {
            label: 'JavaScript',
            language: 'javascript',
            code: registerStdioJs,
            filename: 'register-mcp.js'
          },
          {
            label: 'PHP',
            language: 'php',
            code: registerStdioPhp,
            filename: 'register-mcp.php'
          }
        ]"
      />

      <h3>SSE transport (remote HTTP)</h3>
      <p>
        For remote MCP servers accessible over HTTP, provide the SSE endpoint URL.
      </p>
      <CodeBlock
        :code="registerSseCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Registration response</h3>
      <CodeBlock
        :code="registerResponseCode"
        language="json"
        filename="Response"
      />
    </section>

    <section id="starting">
      <h2>Starting and Stopping Servers</h2>
      <p>
        After registration, start the MCP server to make its tools available. The agent will
        launch the process (stdio) or connect to the endpoint (SSE).
      </p>

      <CodeTabs
        :tabs="[
          {
            label: 'Start',
            language: 'bash',
            code: startCode,
            filename: 'Terminal'
          },
          {
            label: 'Stop',
            language: 'bash',
            code: stopCode,
            filename: 'Terminal'
          },
          {
            label: 'Status',
            language: 'bash',
            code: statusCode,
            filename: 'Terminal'
          }
        ]"
      />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>Auto-restart</strong>
          <p>If a stdio MCP server crashes, the agent will automatically attempt to restart it up to 3 times within a 60-second window.</p>
        </div>
      </div>
    </section>

    <section id="tools">
      <h2>Listing Tools</h2>
      <p>
        Once a server is running, query the available tools it provides. Each tool has a name,
        description, and a JSON Schema defining its parameters.
      </p>

      <CodeBlock
        :code="listToolsCurl"
        language="bash"
        filename="Terminal"
      />

      <h3>Tools response</h3>
      <CodeBlock
        :code="listToolsResponse"
        language="json"
        filename="Response"
      />

      <h3>List tools across all servers</h3>
      <p>
        You can also retrieve every tool available on a machine, aggregated from all running MCP servers.
      </p>
      <CodeBlock
        :code="allToolsCode"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="executing">
      <h2>Executing Tools</h2>
      <p>
        Call a tool on a specific MCP server by providing the tool name and its parameters.
        The agent forwards the call to the MCP server and returns the result.
      </p>

      <CodeTabs
        :tabs="[
          {
            label: 'cURL',
            language: 'bash',
            code: executeCurl,
            filename: 'Terminal'
          },
          {
            label: 'JavaScript',
            language: 'javascript',
            code: executeJs,
            filename: 'execute-tool.js'
          },
          {
            label: 'PHP',
            language: 'php',
            code: executePhp,
            filename: 'execute-tool.php'
          }
        ]"
      />

      <h3>Execution response</h3>
      <CodeBlock
        :code="executeResponse"
        language="json"
        filename="Response"
      />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>Timeouts</strong>
          <p>Tool execution has a default timeout of 30 seconds. For long-running operations, pass <code>"timeout": 120</code> in the request body to extend it up to 120 seconds.</p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const architectureCode = ref(`Claude Code Session
  |
  |  tool_call("db_query", { sql: "SELECT ..." })
  v
ClaudeNest Agent
  |
  |  stdio / SSE
  v
MCP Server (e.g. postgres-mcp)
  |
  |  executes query
  v
PostgreSQL Database`);

const registerStdioCurl = ref(`curl -X POST https://api.claudenest.io/api/machines/{machine_id}/mcp \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "postgres-mcp",
    "transport": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
    },
    "description": "PostgreSQL MCP server for database operations",
    "auto_start": true
  }'`);

const registerStdioJs = ref(`const response = await fetch(
  \`https://api.claudenest.io/api/machines/\${machineId}/mcp\`,
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'postgres-mcp',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      env: {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
      },
      description: 'PostgreSQL MCP server for database operations',
      auto_start: true,
    }),
  }
);

const result = await response.json();
console.log(result.data);`);

const registerStdioPhp = ref(`<?php
$result = Http::withToken($token)
    ->post("https://api.claudenest.io/api/machines/{$machineId}/mcp", [
        'name' => 'postgres-mcp',
        'transport' => 'stdio',
        'command' => 'npx',
        'args' => ['-y', '@modelcontextprotocol/server-postgres'],
        'env' => [
            'DATABASE_URL' => 'postgresql://user:pass@localhost:5432/mydb',
        ],
        'description' => 'PostgreSQL MCP server for database operations',
        'auto_start' => true,
    ]);

$server = $result['data'];`);

const registerSseCode = ref(`curl -X POST https://api.claudenest.io/api/machines/{machine_id}/mcp \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "remote-tools",
    "transport": "sse",
    "url": "https://mcp.example.com/sse",
    "headers": {
      "X-API-Key": "your-api-key"
    },
    "description": "Remote tooling server via SSE",
    "auto_start": true
  }'`);

const registerResponseCode = ref(`{
  "success": true,
  "data": {
    "name": "postgres-mcp",
    "transport": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "status": "stopped",
    "auto_start": true,
    "tools_count": 0,
    "created_at": "2026-02-17T10:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:00:00Z",
    "request_id": "req_mcp_001"
  }
}`);

const startCode = ref(`# Start an MCP server
curl -X POST https://api.claudenest.io/api/machines/{machine_id}/mcp/postgres-mcp/start \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
# {
#   "success": true,
#   "data": {
#     "name": "postgres-mcp",
#     "status": "running",
#     "pid": 12345,
#     "started_at": "2026-02-17T10:01:00Z"
#   }
# }`);

const stopCode = ref(`# Stop an MCP server
curl -X POST https://api.claudenest.io/api/machines/{machine_id}/mcp/postgres-mcp/stop \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
# {
#   "success": true,
#   "data": {
#     "name": "postgres-mcp",
#     "status": "stopped"
#   }
# }`);

const statusCode = ref(`# Get server status and details
curl https://api.claudenest.io/api/machines/{machine_id}/mcp/postgres-mcp \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
# {
#   "success": true,
#   "data": {
#     "name": "postgres-mcp",
#     "transport": "stdio",
#     "status": "running",
#     "pid": 12345,
#     "tools_count": 4,
#     "uptime_seconds": 3600,
#     "started_at": "2026-02-17T10:01:00Z"
#   }
# }`);

const listToolsCurl = ref(`curl https://api.claudenest.io/api/machines/{machine_id}/mcp/postgres-mcp/tools \\
  -H "Authorization: Bearer YOUR_TOKEN"`);

const listToolsResponse = ref(`{
  "success": true,
  "data": [
    {
      "name": "query",
      "description": "Execute a read-only SQL query against the database",
      "inputSchema": {
        "type": "object",
        "properties": {
          "sql": {
            "type": "string",
            "description": "The SQL query to execute"
          }
        },
        "required": ["sql"]
      }
    },
    {
      "name": "list_tables",
      "description": "List all tables in the database",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "describe_table",
      "description": "Get the schema of a specific table",
      "inputSchema": {
        "type": "object",
        "properties": {
          "table_name": {
            "type": "string",
            "description": "Name of the table to describe"
          }
        },
        "required": ["table_name"]
      }
    }
  ],
  "meta": {
    "timestamp": "2026-02-17T10:05:00Z",
    "request_id": "req_tools_001"
  }
}`);

const allToolsCode = ref(`# List all tools across every running MCP server on this machine
curl https://api.claudenest.io/api/machines/{machine_id}/mcp/all-tools \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Returns tools grouped by server name`);

const executeCurl = ref(`curl -X POST https://api.claudenest.io/api/machines/{machine_id}/mcp/postgres-mcp/execute \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "query",
    "arguments": {
      "sql": "SELECT id, name, status FROM machines LIMIT 5"
    }
  }'`);

const executeJs = ref(`const response = await fetch(
  \`https://api.claudenest.io/api/machines/\${machineId}/mcp/postgres-mcp/execute\`,
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'query',
      arguments: {
        sql: 'SELECT id, name, status FROM machines LIMIT 5',
      },
    }),
  }
);

const result = await response.json();
console.log(result.data.content);`);

const executePhp = ref(`<?php
$result = Http::withToken($token)
    ->post("https://api.claudenest.io/api/machines/{$machineId}/mcp/postgres-mcp/execute", [
        'tool' => 'query',
        'arguments' => [
            'sql' => 'SELECT id, name, status FROM machines LIMIT 5',
        ],
    ]);

$content = $result['data']['content'];`);

const executeResponse = ref(`{
  "success": true,
  "data": {
    "content": [
      {
        "type": "text",
        "text": "id | name | status\\n--- | --- | ---\\n1 | dev-laptop | online\\n2 | ci-server | offline\\n3 | staging | online"
      }
    ],
    "isError": false
  },
  "meta": {
    "timestamp": "2026-02-17T10:10:00Z",
    "request_id": "req_exec_001",
    "duration_ms": 45
  }
}`);
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

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* Tip Box */
.tip {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
  border-radius: 10px;
  margin: 1.5rem 0;
}

.tip-icon {
  width: 24px;
  height: 24px;
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
  color: var(--accent-cyan, #22d3ee);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.tip strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.tip p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
}
</style>
