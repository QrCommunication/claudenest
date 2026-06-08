<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsCookbookMcpsetup.headerTitle') }}</h1>
      <p class="lead">
        {{ $t('docDocsCookbookMcpsetup.headerLead') }}
      </p>
    </header>

    <section id="what-is-mcp">
      <h2>{{ $t('docDocsCookbookMcpsetup.whatIsTitle') }}</h2>
      <p>
        <strong>{{ $t('docDocsCookbookMcpsetup.mcpFullName') }}</strong> {{ $t('docDocsCookbookMcpsetup.whatIsPara1') }}
      </p>

      <p>{{ $t('docDocsCookbookMcpsetup.canProvide') }}</p>
      <ul>
        <li><strong>{{ $t('docDocsCookbookMcpsetup.toolsLabel') }}</strong> {{ $t('docDocsCookbookMcpsetup.toolsDesc') }}</li>
        <li><strong>{{ $t('docDocsCookbookMcpsetup.resourcesLabel') }}</strong> {{ $t('docDocsCookbookMcpsetup.resourcesDesc') }}</li>
        <li><strong>{{ $t('docDocsCookbookMcpsetup.promptsLabel') }}</strong> {{ $t('docDocsCookbookMcpsetup.promptsDesc') }}</li>
      </ul>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>{{ $t('docDocsCookbookMcpsetup.transportModesTitle') }}</strong>
          <p>{{ $t('docDocsCookbookMcpsetup.transportModesPara1') }} <code>stdio</code> {{ $t('docDocsCookbookMcpsetup.transportModesPara2') }} <code>sse</code> {{ $t('docDocsCookbookMcpsetup.transportModesPara3') }}</p>
        </div>
      </div>

      <h3>{{ $t('docDocsCookbookMcpsetup.howItWorksTitle') }}</h3>
      <p>
        {{ $t('docDocsCookbookMcpsetup.howItWorksPara1') }}
      </p>
      <CodeBlock
        :code="architectureCode"
        language="bash"
        filename="Architecture"
      />
    </section>

    <section id="registering">
      <h2>{{ $t('docDocsCookbookMcpsetup.registeringTitle') }}</h2>
      <p>
        {{ $t('docDocsCookbookMcpsetup.registeringPara1') }}
      </p>

      <h3>{{ $t('docDocsCookbookMcpsetup.stdioTransportTitle') }}</h3>
      <p>
        {{ $t('docDocsCookbookMcpsetup.stdioTransportPara1') }}
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

      <h3>{{ $t('docDocsCookbookMcpsetup.sseTransportTitle') }}</h3>
      <p>
        {{ $t('docDocsCookbookMcpsetup.sseTransportPara1') }}
      </p>
      <CodeBlock
        :code="registerSseCode"
        language="bash"
        filename="Terminal"
      />

      <h3>{{ $t('docDocsCookbookMcpsetup.registrationResponseTitle') }}</h3>
      <CodeBlock
        :code="registerResponseCode"
        language="json"
        filename="Response"
      />
    </section>

    <section id="starting">
      <h2>{{ $t('docDocsCookbookMcpsetup.startingTitle') }}</h2>
      <p>
        {{ $t('docDocsCookbookMcpsetup.startingPara1') }}
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
          <strong>{{ $t('docDocsCookbookMcpsetup.autoRestartTitle') }}</strong>
          <p>{{ $t('docDocsCookbookMcpsetup.autoRestartPara1') }}</p>
        </div>
      </div>
    </section>

    <section id="tools">
      <h2>{{ $t('docDocsCookbookMcpsetup.listingToolsTitle') }}</h2>
      <p>
        {{ $t('docDocsCookbookMcpsetup.listingToolsPara1') }}
      </p>

      <CodeBlock
        :code="listToolsCurl"
        language="bash"
        filename="Terminal"
      />

      <h3>{{ $t('docDocsCookbookMcpsetup.toolsResponseTitle') }}</h3>
      <CodeBlock
        :code="listToolsResponse"
        language="json"
        filename="Response"
      />

      <h3>{{ $t('docDocsCookbookMcpsetup.allServersTitle') }}</h3>
      <p>
        {{ $t('docDocsCookbookMcpsetup.allServersPara1') }}
      </p>
      <CodeBlock
        :code="allToolsCode"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="executing">
      <h2>{{ $t('docDocsCookbookMcpsetup.executingTitle') }}</h2>
      <p>
        {{ $t('docDocsCookbookMcpsetup.executingPara1') }}
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

      <h3>{{ $t('docDocsCookbookMcpsetup.executionResponseTitle') }}</h3>
      <CodeBlock
        :code="executeResponse"
        language="json"
        filename="Response"
      />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>{{ $t('docDocsCookbookMcpsetup.timeoutsTitle') }}</strong>
          <p>{{ $t('docDocsCookbookMcpsetup.timeoutsPara1') }} <code>"timeout": 120</code> {{ $t('docDocsCookbookMcpsetup.timeoutsPara2') }}</p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const { t } = useI18n();

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
