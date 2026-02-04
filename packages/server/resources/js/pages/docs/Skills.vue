<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>Skills API</h1>
      
      <p class="lead">
        Skills extend Claude's capabilities with custom tools and workflows. 
        The Skills API allows you to create, manage, and deploy custom skills for your projects.
      </p>

      <div class="section">
        <h2>What are Skills?</h2>
        <p>
          Skills are modular extensions that add new capabilities to Claude. They can include:
        </p>
        <ul>
          <li><strong>Tools:</strong> Custom functions Claude can call</li>
          <li><strong>Workflows:</strong> Multi-step automated processes</li>
          <li><strong>Knowledge:</strong> Domain-specific information and context</li>
          <li><strong>Integrations:</strong> Connections to external services</li>
        </ul>
      </div>

      <div class="section">
        <h2>Skill Object</h2>
        <CodeBlock language="json" :code="skillObject" />
      </div>

      <div class="section">
        <h2>Skill Structure</h2>
        <p>A skill consists of the following components:</p>
        <CodeBlock language="json" :code="skillStructure" filename="skill.json" />
      </div>

      <!-- List Skills -->
      <EndpointCard
        method="GET"
        path="/skills"
        description="List all available skills for the user."
        :params="listParams"
        :curlExample="listCurl"
        :jsExample="listJs"
        :phpExample="listPhp"
        :responses="listResponses"
      />

      <!-- Get Skill -->
      <EndpointCard
        method="GET"
        path="/skills/{id}"
        description="Get detailed information about a skill."
        :params="getParams"
        :curlExample="getCurl"
        :jsExample="getJs"
        :phpExample="getPhp"
        :responses="getResponses"
      />

      <!-- Install Skill -->
      <EndpointCard
        method="POST"
        path="/machines/{machine}/skills"
        description="Install a skill on a specific machine."
        :params="installParams"
        :curlExample="installCurl"
        :jsExample="installJs"
        :phpExample="installPhp"
        :responses="installResponses"
      />

      <!-- Uninstall Skill -->
      <EndpointCard
        method="DELETE"
        path="/machines/{machine}/skills/{id}"
        description="Uninstall a skill from a machine."
        :params="uninstallParams"
        :curlExample="uninstallCurl"
        :jsExample="uninstallJs"
        :phpExample="uninstallPhp"
        :responses="uninstallResponses"
      />

      <!-- Execute Skill -->
      <EndpointCard
        method="POST"
        path="/skills/{id}/execute"
        description="Execute a skill with given parameters."
        :params="executeParams"
        :curlExample="executeCurl"
        :jsExample="executeJs"
        :phpExample="executePhp"
        :responses="executeResponses"
      />

      <div class="section">
        <h2>Creating Custom Skills</h2>
        <p>
          Custom skills are defined using a JSON manifest file and JavaScript/Python implementation:
        </p>
        <h3>1. Create the Skill Manifest</h3>
        <CodeBlock language="json" :code="customSkillManifest" filename="skill.json" />
        
        <h3>2. Implement the Handler</h3>
        <CodeBlock language="javascript" :code="skillHandler" filename="handler.js" />
        
        <h3>3. Package and Deploy</h3>
        <CodeBlock language="bash" :code="deploySkill" />
      </div>

      <div class="section">
        <h2>Skill Context</h2>
        <p>
          Skills have access to a context object that provides information about the current session:
        </p>
        <CodeBlock language="typescript" :code="skillContext" />
      </div>

      <div class="section">
        <h2>Official Skills Registry</h2>
        <div class="skills-grid">
          <div class="skill-card">
            <h4>Git Integration</h4>
            <p>Advanced Git operations, commit analysis, and PR management</p>
            <code>@claudenest/git</code>
          </div>
          <div class="skill-card">
            <h4>Database Manager</h4>
            <p>SQL query generation and database schema management</p>
            <code>@claudenest/database</code>
          </div>
          <div class="skill-card">
            <h4>Testing Runner</h4>
            <p>Execute and analyze test suites across multiple frameworks</p>
            <code>@claudenest/testing</code>
          </div>
          <div class="skill-card">
            <h4>Documentation</h4>
            <p>Auto-generate and update documentation</p>
            <code>@claudenest/docs</code>
          </div>
          <div class="skill-card">
            <h4>Security Audit</h4>
            <p>Scan code for security vulnerabilities</p>
            <code>@claudenest/security</code>
          </div>
          <div class="skill-card">
            <h4>Performance Profiler</h4>
            <p>Analyze and optimize code performance</p>
            <code>@claudenest/performance</code>
          </div>
        </div>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocsLayout from '@/layouts/DocsLayout.vue';
import EndpointCard from '@/components/docs/EndpointCard.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const skillObject = ref(`{
  "id": "skill-git-v1",
  "name": "Git Integration",
  "description": "Advanced Git operations and commit analysis",
  "version": "1.2.0",
  "author": "ClaudeNest Team",
  "tags": ["git", "version-control", "scm"],
  "capabilities": ["read", "write", "execute"],
  "permissions": ["filesystem.read", "git.execute"],
  "status": "active",
  "installed_at": "2026-02-01T10:00:00Z",
  "updated_at": "2026-02-02T15:30:00Z"
}`);

const skillStructure = ref(`{
  "manifest_version": "1.0",
  "id": "my-custom-skill",
  "name": "My Custom Skill",
  "description": "What this skill does",
  "version": "1.0.0",
  "author": "Your Name",
  "entry_point": "handler.js",
  "capabilities": {
    "tools": [
      {
        "name": "my_tool",
        "description": "What this tool does",
        "parameters": {
          "type": "object",
          "properties": {
            "param1": { "type": "string", "description": "First parameter" }
          },
          "required": ["param1"]
        }
      }
    ],
    "workflows": [],
    "knowledge": []
  },
  "permissions": ["filesystem.read"],
  "dependencies": []
}`);

// List Skills
const listParams = [
  { name: 'tag', type: 'string', required: false, description: 'Filter by tag' },
  { name: 'status', type: 'enum', required: false, description: 'Filter by status', enum: ['active', 'inactive'] },
];

const listCurl = `curl https://api.claudenest.io/api/skills \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -G -d "tag=git"`;

const listJs = `const response = await fetch('https://api.claudenest.io/api/skills?tag=git', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const skills = await response.json();
console.log(skills.data);`;

const listPhp = `<?php
$skills = Http::withToken($token)
    ->get('https://api.claudenest.io/api/skills', ['tag' => 'git'])['data'];`;

const listResponses = {
  '200': {
    success: true,
    data: [
      {
        id: 'skill-git-v1',
        name: 'Git Integration',
        description: 'Advanced Git operations and commit analysis',
        version: '1.2.0',
        tags: ['git', 'version-control'],
        status: 'active',
      },
    ],
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_abc' },
  },
};

// Get Skill
const getParams = [
  { name: 'id', type: 'string', required: true, description: 'Skill ID' },
];

const getCurl = `curl https://api.claudenest.io/api/skills/skill-git-v1 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const getJs = `const response = await fetch('https://api.claudenest.io/api/skills/skill-git-v1', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const skill = await response.json();
console.log(skill.data);`;

const getPhp = `<?php
$skill = Http::withToken($token)
    ->get('https://api.claudenest.io/api/skills/skill-git-v1')['data'];`;

const getResponses = {
  '200': {
    success: true,
    data: {
      id: 'skill-git-v1',
      name: 'Git Integration',
      description: 'Advanced Git operations and commit analysis',
      version: '1.2.0',
      capabilities: {
        tools: [{ name: 'git_status', description: 'Get git status' }],
      },
      permissions: ['filesystem.read', 'git.execute'],
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_123' },
  },
};

// Install Skill
const installParams = [
  { name: 'machine', type: 'uuid', required: true, description: 'Machine ID' },
  { name: 'skill_id', type: 'string', required: true, description: 'Skill ID to install' },
  { name: 'config', type: 'object', required: false, description: 'Skill configuration' },
];

const installCurl = `curl -X POST https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "skill_id": "skill-git-v1",
    "config": { "default_branch": "main" }
  }'`;

const installJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    skill_id: 'skill-git-v1',
    config: { default_branch: 'main' },
  }),
});`;

const installPhp = `<?php
$result = Http::withToken($token)
    ->post('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills', [
        'skill_id' => 'skill-git-v1',
        'config' => ['default_branch' => 'main'],
    ])['data'];`;

const installResponses = {
  '200': {
    success: true,
    data: {
      skill_id: 'skill-git-v1',
      status: 'installed',
      installed_at: '2026-02-02T15:30:00Z',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_install' },
  },
};

// Uninstall Skill
const uninstallParams = [
  { name: 'machine', type: 'uuid', required: true, description: 'Machine ID' },
  { name: 'id', type: 'string', required: true, description: 'Skill ID' },
];

const uninstallCurl = `curl -X DELETE https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills/skill-git-v1 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const uninstallJs = `await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills/skill-git-v1', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});`;

const uninstallPhp = `<?php
Http::withToken($token)
    ->delete('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills/skill-git-v1');`;

const uninstallResponses = {
  '200': {
    success: true,
    data: null,
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_uninstall' },
  },
};

// Execute Skill
const executeParams = [
  { name: 'id', type: 'string', required: true, description: 'Skill ID' },
  { name: 'tool', type: 'string', required: true, description: 'Tool name to execute' },
  { name: 'parameters', type: 'object', required: true, description: 'Tool parameters' },
  { name: 'session_id', type: 'uuid', required: false, description: 'Session context' },
];

const executeCurl = `curl -X POST https://api.claudenest.io/api/skills/skill-git-v1/execute \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "git_status",
    "parameters": { "path": "/Users/dev/project" },
    "session_id": "550e8400-e29b-41d4-a716-446655440001"
  }'`;

const executeJs = `const response = await fetch('https://api.claudenest.io/api/skills/skill-git-v1/execute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tool: 'git_status',
    parameters: { path: '/Users/dev/project' },
    session_id: '550e8400-e29b-41d4-a716-446655440001',
  }),
});
const result = await response.json();
console.log(result.data.output);`;

const executePhp = `<?php
$result = Http::withToken($token)
    ->post('https://api.claudenest.io/api/skills/skill-git-v1/execute', [
        'tool' => 'git_status',
        'parameters' => ['path' => '/Users/dev/project'],
    ])['data'];`;

const executeResponses = {
  '200': {
    success: true,
    data: {
      output: 'On branch main\nYour branch is up to date...',
      exit_code: 0,
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_exec' },
  },
};

const customSkillManifest = ref(`{
  "manifest_version": "1.0",
  "id": "my-api-client",
  "name": "API Client",
  "description": "Make HTTP requests to external APIs",
  "version": "1.0.0",
  "author": "Your Name",
  "entry_point": "handler.js",
  "capabilities": {
    "tools": [
      {
        "name": "http_request",
        "description": "Make an HTTP request",
        "parameters": {
          "type": "object",
          "properties": {
            "method": {
              "type": "string",
              "enum": ["GET", "POST", "PUT", "DELETE"],
              "description": "HTTP method"
            },
            "url": {
              "type": "string",
              "description": "Request URL"
            },
            "headers": {
              "type": "object",
              "description": "Request headers"
            },
            "body": {
              "type": "object",
              "description": "Request body"
            }
          },
          "required": ["method", "url"]
        }
      }
    ]
  },
  "permissions": ["network.http"]
}`);

const skillHandler = ref(`// handler.js
export async function http_request(context, params) {
  const { method, url, headers = {}, body } = params;
  
  // Log the request
  context.log(\`Making \${method} request to \${url}\`);
  
  // Make the HTTP request
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // Return the result
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text(),
  };
}`);

const deploySkill = ref(`# Package your skill
cd my-skill
zip -r ../my-api-client.zip .

# Deploy via CLI (coming soon)
claudenest skills deploy my-api-client.zip

# Or upload via API
curl -X POST https://api.claudenest.io/api/skills \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@my-api-client.zip"`);

const skillContext = ref(`interface SkillContext {
  // Session information
  session: {
    id: string;
    machine_id: string;
    project_path: string;
  };
  
  // Project information
  project: {
    id: string;
    name: string;
    context: Record<string, any>;
  };
  
  // Utility functions
  log(message: string): void;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  execute(command: string): Promise<{ stdout: string; stderr: string }>;
  
  // LLM integration
  prompt(message: string): Promise<string>;
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

h2, h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

h3 {
  font-size: 1.1rem;
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

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.skill-card {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s;
}

.skill-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(168, 85, 247, 0.3);
}

.skill-card h4 {
  margin: 0 0 0.5rem 0;
  color: #e2e8f0;
}

.skill-card p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #94a3b8;
}

.skill-card code {
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }

  .skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
