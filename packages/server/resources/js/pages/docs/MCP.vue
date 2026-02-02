<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>MCP API</h1>
      
      <p class="lead">
        Model Context Protocol (MCP) is an open protocol that standardizes how applications 
        provide context to LLMs. ClaudeNest implements MCP for seamless integration with 
        MCP-compatible clients and tools.
      </p>

      <div class="section">
        <h2>What is MCP?</h2>
        <p>
          The Model Context Protocol (MCP) is an open protocol that enables seamless 
          integration between LLM applications and external data sources and tools. 
          ClaudeNest acts as an MCP server, allowing MCP clients to:
        </p>
        <ul>
          <li>Access Claude Code sessions remotely</li>
          <li>Query project context and files</li>
          <li>Execute tools and commands</li>
          <li>Manage multi-agent projects</li>
        </ul>
      </div>

      <div class="section">
        <h2>MCP Endpoints</h2>
        <p>
          ClaudeNest exposes the following MCP endpoints:
        </p>
        <table class="endpoints-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>/mcp/initialize</code></td>
              <td>Initialize MCP connection</td>
            </tr>
            <tr>
              <td><code>/mcp/tools/list</code></td>
              <td>List available tools</td>
            </tr>
            <tr>
              <td><code>/mcp/tools/call</code></td>
              <td>Call a tool</td>
            </tr>
            <tr>
              <td><code>/mcp/resources/list</code></td>
              <td>List available resources</td>
            </tr>
            <tr>
              <td><code>/mcp/resources/read</code></td>
              <td>Read a resource</td>
            </tr>
            <tr>
              <td><code>/mcp/prompts/list</code></td>
              <td>List available prompts</td>
            </tr>
            <tr>
              <td><code>/mcp/prompts/get</code></td>
              <td>Get a prompt</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Initialize -->
      <EndpointCard
        method="POST"
        path="/mcp/initialize"
        description="Initialize an MCP connection and negotiate protocol version."
        :params="initParams"
        :curlExample="initCurl"
        :jsExample="initJs"
        :phpExample="initPhp"
        :responses="initResponses"
      />

      <!-- List Tools -->
      <EndpointCard
        method="GET"
        path="/mcp/tools/list"
        description="List all available MCP tools."
        :curlExample="listToolsCurl"
        :jsExample="listToolsJs"
        :phpExample="listToolsPhp"
        :responses="listToolsResponses"
      />

      <!-- Call Tool -->
      <EndpointCard
        method="POST"
        path="/mcp/tools/call"
        description="Call an MCP tool with parameters."
        :params="callToolParams"
        :curlExample="callToolCurl"
        :jsExample="callToolJs"
        :phpExample="callToolPhp"
        :responses="callToolResponses"
      />

      <!-- List Resources -->
      <EndpointCard
        method="GET"
        path="/mcp/resources/list"
        description="List all available MCP resources."
        :curlExample="listResourcesCurl"
        :jsExample="listResourcesJs"
        :phpExample="listResourcesPhp"
        :responses="listResourcesResponses"
      />

      <!-- Read Resource -->
      <EndpointCard
        method="POST"
        path="/mcp/resources/read"
        description="Read a specific MCP resource."
        :params="readResourceParams"
        :curlExample="readResourceCurl"
        :jsExample="readResourceJs"
        :phpExample="readResourcePhp"
        :responses="readResourceResponses"
      />

      <div class="section">
        <h2>Using MCP with Claude Desktop</h2>
        <p>
          To use ClaudeNest with Claude Desktop via MCP, add the following configuration:
        </p>
        <CodeBlock language="json" :code="claudeDesktopConfig" filename="claude_desktop_config.json" />
      </div>

      <div class="section">
        <h2>Available MCP Tools</h2>
        <div class="tools-list">
          <div class="tool-item">
            <h4>create_session</h4>
            <p>Create a new Claude Code session</p>
          </div>
          <div class="tool-item">
            <h4>send_input</h4>
            <p>Send input to a running session</p>
          </div>
          <div class="tool-item">
            <h4>get_session_output</h4>
            <p>Get output from a session</p>
          </div>
          <div class="tool-item">
            <h4>list_machines</h4>
            <p>List available machines</p>
          </div>
          <div class="tool-item">
            <h4>list_projects</h4>
            <p>List projects on a machine</p>
          </div>
          <div class="tool-item">
            <h4>query_context</h4>
            <p>Query project context using RAG</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>MCP Resources</h2>
        <p>
          MCP resources provide access to project files and context:
        </p>
        <ul>
          <li><code>file://{project_id}/{path}</code> - Access project files</li>
          <li><code>context://{project_id}/summary</code> - Project summary</li>
          <li><code>context://{project_id}/architecture</code> - Architecture documentation</li>
          <li><code>task://{project_id}/pending</code> - Pending tasks</li>
        </ul>
      </div>

      <div class="section">
        <h2>Protocol Version</h2>
        <p>
          ClaudeNest currently supports MCP protocol version <strong>2024-11-05</strong>. 
          The protocol version is negotiated during initialization.
        </p>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocsLayout from '@/layouts/DocsLayout.vue';
import EndpointCard from '@/components/docs/EndpointCard.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

// Initialize
const initParams = [
  { name: 'protocolVersion', type: 'string', required: true, description: 'MCP protocol version' },
  { name: 'capabilities', type: 'object', required: true, description: 'Client capabilities' },
  { name: 'clientInfo', type: 'object', required: true, description: 'Client information (name, version)' },
];

const initCurl = `curl -X POST https://api.claudenest.io/api/mcp/initialize \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true }
    },
    "clientInfo": {
      "name": "claude-desktop",
      "version": "1.0.0"
    }
  }'`;

const initJs = `const response = await fetch('https://api.claudenest.io/api/mcp/initialize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: { listChanged: true },
      resources: { subscribe: true },
    },
    clientInfo: { name: 'claude-desktop', version: '1.0.0' },
  }),
});
const initResult = await response.json();`;

const initPhp = `<?php
$init = Http::withToken($token)
    ->post('https://api.claudenest.io/api/mcp/initialize', [
        'protocolVersion' => '2024-11-05',
        'capabilities' => ['tools' => ['listChanged' => true]],
        'clientInfo' => ['name' => 'claude-desktop', 'version' => '1.0.0'],
    ])['data'];`;

const initResponses = {
  '200': {
    success: true,
    data: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        prompts: { listChanged: true },
      },
      serverInfo: {
        name: 'claudenest-mcp',
        version: '1.0.0',
      },
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_init' },
  },
};

// List Tools
const listToolsCurl = `curl https://api.claudenest.io/api/mcp/tools/list \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const listToolsJs = `const response = await fetch('https://api.claudenest.io/api/mcp/tools/list', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const tools = await response.json();
console.log(tools.data.tools);`;

const listToolsPhp = `<?php
$tools = Http::withToken($token)
    ->get('https://api.claudenest.io/api/mcp/tools/list')['data']['tools'];`;

const listToolsResponses = {
  '200': {
    success: true,
    data: {
      tools: [
        {
          name: 'create_session',
          description: 'Create a new Claude Code session',
          inputSchema: {
            type: 'object',
            properties: {
              machine_id: { type: 'string', description: 'Machine ID' },
              mode: { type: 'string', enum: ['interactive', 'headless'] },
            },
            required: ['machine_id'],
          },
        },
        {
          name: 'list_machines',
          description: 'List available machines',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_tools' },
  },
};

// Call Tool
const callToolParams = [
  { name: 'name', type: 'string', required: true, description: 'Tool name' },
  { name: 'arguments', type: 'object', required: true, description: 'Tool arguments' },
];

const callToolCurl = `curl -X POST https://api.claudenest.io/api/mcp/tools/call \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "create_session",
    "arguments": {
      "machine_id": "550e8400-e29b-41d4-a716-446655440000",
      "mode": "interactive"
    }
  }'`;

const callToolJs = `const response = await fetch('https://api.claudenest.io/api/mcp/tools/call', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'create_session',
    arguments: {
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      mode: 'interactive',
    },
  }),
});
const result = await response.json();`;

const callToolPhp = `<?php
$result = Http::withToken($token)
    ->post('https://api.claudenest.io/api/mcp/tools/call', [
        'name' => 'create_session',
        'arguments' => [
            'machine_id' => '550e8400-e29b-41d4-a716-446655440000',
            'mode' => 'interactive',
        ],
    ])['data'];`;

const callToolResponses = {
  '200': {
    success: true,
    data: {
      content: [
        {
          type: 'text',
          text: '{"id": "550e8400-e29b-41d4-a716-446655440001", "status": "created"}',
        },
      ],
      isError: false,
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_call' },
  },
};

// List Resources
const listResourcesCurl = `curl https://api.claudenest.io/api/mcp/resources/list \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const listResourcesJs = `const response = await fetch('https://api.claudenest.io/api/mcp/resources/list', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const resources = await response.json();
console.log(resources.data.resources);`;

const listResourcesPhp = `<?php
$resources = Http::withToken($token)
    ->get('https://api.claudenest.io/api/mcp/resources/list')['data']['resources'];`;

const listResourcesResponses = {
  '200': {
    success: true,
    data: {
      resources: [
        {
          uri: 'context://550e8400-e29b-41d4-a716-446655440002/summary',
          name: 'Project Summary',
          mimeType: 'text/plain',
        },
        {
          uri: 'task://550e8400-e29b-41d4-a716-446655440002/pending',
          name: 'Pending Tasks',
          mimeType: 'application/json',
        },
      ],
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_res' },
  },
};

// Read Resource
const readResourceParams = [
  { name: 'uri', type: 'string', required: true, description: 'Resource URI' },
];

const readResourceCurl = `curl -X POST https://api.claudenest.io/api/mcp/resources/read \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"uri": "context://550e8400-e29b-41d4-a716-446655440002/summary"}'`;

const readResourceJs = `const response = await fetch('https://api.claudenest.io/api/mcp/resources/read', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    uri: 'context://550e8400-e29b-41d4-a716-446655440002/summary',
  }),
});
const resource = await response.json();`;

const readResourcePhp = `<?php
$resource = Http::withToken($token)
    ->post('https://api.claudenest.io/api/mcp/resources/read', [
        'uri' => 'context://550e8400-e29b-41d4-a716-446655440002/summary',
    ])['data'];`;

const readResourceResponses = {
  '200': {
    success: true,
    data: {
      contents: [
        {
          uri: 'context://550e8400-e29b-41d4-a716-446655440002/summary',
          mimeType: 'text/plain',
          text: 'E-commerce platform with React frontend and Node.js backend',
        },
      ],
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_read' },
  },
};

const claudeDesktopConfig = ref(`{
  "mcpServers": {
    "claudenest": {
      "command": "npx",
      "args": ["-y", "@claudenest/mcp-client"],
      "env": {
        "CLAUDENEST_API_TOKEN": "YOUR_API_TOKEN",
        "CLAUDENEST_API_URL": "https://api.claudenest.io"
      }
    }
  }
}`);
</script>

<style scoped>
.docs-page {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #a855f7, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

h4 {
  font-size: 1rem;
  color: #cbd5e1;
  margin: 0 0 0.25rem 0;
}

p {
  color: #94a3b8;
  line-height: 1.7;
  margin-bottom: 1rem;
}

ul {
  color: #94a3b8;
  line-height: 1.8;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

:deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.endpoints-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.endpoints-table th {
  text-align: left;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.endpoints-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.endpoints-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.tools-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.tool-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.tool-item p {
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }

  .tools-list {
    grid-template-columns: 1fr;
  }
}
</style>
