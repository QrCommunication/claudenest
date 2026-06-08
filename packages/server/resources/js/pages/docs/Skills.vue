<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>{{ $t('docDocsSkills.heading') }}</h1>

      <p class="lead">
        {{ $t('docDocsSkills.lead') }}
      </p>

      <div class="section">
        <h2>{{ $t('docDocsSkills.whatAreSkillsTitle') }}</h2>
        <p>
          {{ $t('docDocsSkills.whatAreSkillsIntro') }}
        </p>
        <ul>
          <li><strong>{{ $t('docDocsSkills.toolsLabel') }}</strong> {{ $t('docDocsSkills.toolsDesc') }}</li>
          <li><strong>{{ $t('docDocsSkills.workflowsLabel') }}</strong> {{ $t('docDocsSkills.workflowsDesc') }}</li>
          <li><strong>{{ $t('docDocsSkills.knowledgeLabel') }}</strong> {{ $t('docDocsSkills.knowledgeDesc') }}</li>
          <li><strong>{{ $t('docDocsSkills.integrationsLabel') }}</strong> {{ $t('docDocsSkills.integrationsDesc') }}</li>
        </ul>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsSkills.skillObjectTitle') }}</h2>
        <CodeBlock language="json" :code="skillObject" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsSkills.skillStructureTitle') }}</h2>
        <p>{{ $t('docDocsSkills.skillStructureIntro') }}</p>
        <CodeBlock language="json" :code="skillStructure" filename="skill.json" />
      </div>

      <!-- List Skills -->
      <EndpointCard
        method="GET"
        path="/skills"
        :description="$t('docDocsSkills.listDescription')"
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
        :description="$t('docDocsSkills.getDescription')"
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
        :description="$t('docDocsSkills.installDescription')"
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
        :description="$t('docDocsSkills.uninstallDescription')"
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
        :description="$t('docDocsSkills.executeDescription')"
        :params="executeParams"
        :curlExample="executeCurl"
        :jsExample="executeJs"
        :phpExample="executePhp"
        :responses="executeResponses"
      />

      <div class="section">
        <h2>{{ $t('docDocsSkills.creatingTitle') }}</h2>
        <p>
          {{ $t('docDocsSkills.creatingIntro') }}
        </p>
        <h3>{{ $t('docDocsSkills.creatingStep1') }}</h3>
        <CodeBlock language="json" :code="customSkillManifest" filename="skill.json" />

        <h3>{{ $t('docDocsSkills.creatingStep2') }}</h3>
        <CodeBlock language="javascript" :code="skillHandler" filename="handler.js" />

        <h3>{{ $t('docDocsSkills.creatingStep3') }}</h3>
        <CodeBlock language="bash" :code="deploySkill" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsSkills.skillContextTitle') }}</h2>
        <p>
          {{ $t('docDocsSkills.skillContextIntro') }}
        </p>
        <CodeBlock language="typescript" :code="skillContext" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsSkills.registryTitle') }}</h2>
        <div class="skills-grid">
          <div class="skill-card">
            <h4>{{ $t('docDocsSkills.registryGitTitle') }}</h4>
            <p>{{ $t('docDocsSkills.registryGitDesc') }}</p>
            <code>@claudenest/git</code>
          </div>
          <div class="skill-card">
            <h4>{{ $t('docDocsSkills.registryDatabaseTitle') }}</h4>
            <p>{{ $t('docDocsSkills.registryDatabaseDesc') }}</p>
            <code>@claudenest/database</code>
          </div>
          <div class="skill-card">
            <h4>{{ $t('docDocsSkills.registryTestingTitle') }}</h4>
            <p>{{ $t('docDocsSkills.registryTestingDesc') }}</p>
            <code>@claudenest/testing</code>
          </div>
          <div class="skill-card">
            <h4>{{ $t('docDocsSkills.registryDocsTitle') }}</h4>
            <p>{{ $t('docDocsSkills.registryDocsDesc') }}</p>
            <code>@claudenest/docs</code>
          </div>
          <div class="skill-card">
            <h4>{{ $t('docDocsSkills.registrySecurityTitle') }}</h4>
            <p>{{ $t('docDocsSkills.registrySecurityDesc') }}</p>
            <code>@claudenest/security</code>
          </div>
          <div class="skill-card">
            <h4>{{ $t('docDocsSkills.registryPerformanceTitle') }}</h4>
            <p>{{ $t('docDocsSkills.registryPerformanceDesc') }}</p>
            <code>@claudenest/performance</code>
          </div>
        </div>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DocsLayout from '@/layouts/DocsLayout.vue';
import EndpointCard from '@/components/docs/EndpointCard.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const { t } = useI18n();

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
const listParams = computed(() => [
  { name: 'tag', type: 'string', required: false, description: t('docDocsSkills.paramFilterByTag') },
  { name: 'status', type: 'enum', required: false, description: t('docDocsSkills.paramFilterByStatus'), enum: ['active', 'inactive'] },
]);

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

const listResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

// Get Skill
const getParams = computed(() => [
  { name: 'id', type: 'string', required: true, description: t('docDocsSkills.paramSkillId') },
]);

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

const getResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

// Install Skill
const installParams = computed(() => [
  { name: 'machine', type: 'uuid', required: true, description: t('docDocsSkills.paramMachineId') },
  { name: 'skill_id', type: 'string', required: true, description: t('docDocsSkills.paramSkillIdToInstall') },
  { name: 'config', type: 'object', required: false, description: t('docDocsSkills.paramSkillConfig') },
]);

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

const installResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: {
        skill_id: 'skill-git-v1',
        status: 'installed',
        installed_at: '2026-02-02T15:30:00Z',
      },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_install' },
    }, null, 2),
  },
];

// Uninstall Skill
const uninstallParams = computed(() => [
  { name: 'machine', type: 'uuid', required: true, description: t('docDocsSkills.paramMachineId') },
  { name: 'id', type: 'string', required: true, description: t('docDocsSkills.paramSkillId') },
]);

const uninstallCurl = `curl -X DELETE https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills/skill-git-v1 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const uninstallJs = `await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills/skill-git-v1', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});`;

const uninstallPhp = `<?php
Http::withToken($token)
    ->delete('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/skills/skill-git-v1');`;

const uninstallResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: null,
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_uninstall' },
    }, null, 2),
  },
];

// Execute Skill
const executeParams = computed(() => [
  { name: 'id', type: 'string', required: true, description: t('docDocsSkills.paramSkillId') },
  { name: 'tool', type: 'string', required: true, description: t('docDocsSkills.paramToolName') },
  { name: 'parameters', type: 'object', required: true, description: t('docDocsSkills.paramToolParameters') },
  { name: 'session_id', type: 'uuid', required: false, description: t('docDocsSkills.paramSessionContext') },
]);

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

const executeResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: {
        output: 'On branch main\nYour branch is up to date...',
        exit_code: 0,
      },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_exec' },
    }, null, 2),
  },
];

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
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2.5rem;
}

h2, h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

h3 {
  font-size: 1.1rem;
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

ul {
  color: var(--text-secondary);
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
  color: var(--accent-purple-light, #c084fc);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
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
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  transition: all 0.2s;
}

.skill-card:hover {
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
}

.skill-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.skill-card p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.skill-card code {
  font-size: 0.8rem;
  color: var(--text-muted);
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
