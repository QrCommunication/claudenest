<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Skills Discovery</h1>
      <p class="lead">
        Learn how the ClaudeNest agent discovers skills on your machine, how to register them
        via the API, and how to manage categories, toggling, and bulk operations.
      </p>
    </header>

    <section id="overview">
      <h2>Overview</h2>
      <p>
        Skills are modular capabilities that extend what Claude Code can do on a machine.
        They are discovered automatically by the agent or registered manually through the API.
        Each skill has a unique path identifier, a category, and can be enabled or disabled
        per machine.
      </p>

      <p>The skill lifecycle follows this flow:</p>

      <CodeBlock
        :code="lifecycleCode"
        language="bash"
        filename="Skill Lifecycle"
      />

      <h3>Skill object</h3>
      <CodeBlock
        :code="skillObjectCode"
        language="json"
        filename="Skill"
      />
    </section>

    <section id="agent-discovery">
      <h2>Agent Discovery</h2>
      <p>
        When the agent starts, it automatically scans pre-configured directories and the system
        PATH for known tools and runtimes. Discovered capabilities are reported to the server
        as skills.
      </p>

      <h3>What gets discovered</h3>
      <ul>
        <li><strong>CLI tools</strong> -- git, docker, kubectl, terraform, aws, gcloud, and more.</li>
        <li><strong>Language runtimes</strong> -- node, python, php, ruby, go, rust (cargo), java.</li>
        <li><strong>Package managers</strong> -- npm, yarn, pnpm, pip, composer, cargo, gem.</li>
        <li><strong>Database clients</strong> -- psql, mysql, redis-cli, mongosh.</li>
        <li><strong>Custom skills</strong> -- any executable in <code>~/.claudenest/skills/</code>.</li>
      </ul>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>Discovery interval</strong>
          <p>The agent re-scans for new skills every 5 minutes. You can also trigger a manual scan from the dashboard or via the API.</p>
        </div>
      </div>

      <h3>Agent configuration for discovery</h3>
      <CodeBlock
        :code="agentConfigCode"
        language="json"
        filename="~/.claudenest/config.json"
      />

      <h3>Discovery log output</h3>
      <CodeBlock
        :code="discoveryLogCode"
        language="bash"
        filename="Agent Log"
      />
    </section>

    <section id="registering">
      <h2>Registering Skills via API</h2>
      <p>
        In addition to automatic discovery, you can register skills manually through the API.
        This is useful for custom scripts or tools that the agent cannot auto-detect.
      </p>

      <CodeTabs
        :tabs="[
          {
            label: 'cURL',
            language: 'bash',
            code: registerCurl,
            filename: 'Terminal'
          },
          {
            label: 'JavaScript',
            language: 'javascript',
            code: registerJs,
            filename: 'register-skill.js'
          },
          {
            label: 'PHP',
            language: 'php',
            code: registerPhp,
            filename: 'register-skill.php'
          }
        ]"
      />

      <h3>Registration response</h3>
      <CodeBlock
        :code="registerResponseCode"
        language="json"
        filename="Response"
      />
    </section>

    <section id="categories">
      <h2>Skill Categories</h2>
      <p>
        Skills are organized into categories for easier management. The agent assigns categories
        automatically during discovery, but you can override them when registering manually.
      </p>

      <div class="category-grid">
        <div class="category-card">
          <div class="category-icon">VCS</div>
          <div>
            <strong>version_control</strong>
            <span>Git, SVN, Mercurial</span>
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">RT</div>
          <div>
            <strong>runtime</strong>
            <span>Node.js, Python, PHP, Go</span>
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">PKG</div>
          <div>
            <strong>package_manager</strong>
            <span>npm, pip, composer, cargo</span>
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">DB</div>
          <div>
            <strong>database</strong>
            <span>psql, mysql, redis-cli</span>
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">INF</div>
          <div>
            <strong>infrastructure</strong>
            <span>Docker, kubectl, terraform</span>
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">CLD</div>
          <div>
            <strong>cloud</strong>
            <span>AWS CLI, gcloud, az</span>
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">TST</div>
          <div>
            <strong>testing</strong>
            <span>jest, pytest, phpunit</span>
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">USR</div>
          <div>
            <strong>custom</strong>
            <span>User-defined skills</span>
          </div>
        </div>
      </div>

      <h3>Listing skills by category</h3>
      <CodeBlock
        :code="listByCategoryCode"
        language="bash"
        filename="Terminal"
      />
    </section>

    <section id="toggling">
      <h2>Enabling and Disabling Skills</h2>
      <p>
        Each skill can be individually enabled or disabled. Disabled skills are not made available
        to Claude Code sessions. This is useful for restricting access to certain tools in
        production environments.
      </p>

      <h3>Toggle a single skill</h3>
      <CodeTabs
        :tabs="[
          {
            label: 'cURL',
            language: 'bash',
            code: toggleCurl,
            filename: 'Terminal'
          },
          {
            label: 'JavaScript',
            language: 'javascript',
            code: toggleJs,
            filename: 'toggle-skill.js'
          }
        ]"
      />

      <h3>Bulk operations</h3>
      <p>
        Update multiple skills at once using the bulk endpoint. This supports enabling, disabling,
        or updating metadata for many skills in a single request.
      </p>

      <CodeBlock
        :code="bulkCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Bulk response</h3>
      <CodeBlock
        :code="bulkResponseCode"
        language="json"
        filename="Response"
      />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <strong>Category-wide toggling</strong>
          <p>To disable all skills in a category, use the bulk endpoint with a filter:
            pass <code>"category": "infrastructure"</code> and <code>"enabled": false</code> to disable every infrastructure skill at once.</p>
        </div>
      </div>

      <h3>Deleting a skill</h3>
      <p>
        Remove a manually registered skill. Auto-discovered skills will reappear on the next scan
        unless the underlying tool is uninstalled from the machine.
      </p>
      <CodeBlock
        code='curl -X DELETE https://api.claudenest.io/api/machines/{machine_id}/skills/custom%2Fdeploy-script \
  -H "Authorization: Bearer YOUR_TOKEN"'
        language="bash"
        filename="Terminal"
      />
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const lifecycleCode = ref(`1. Agent starts
   |
2. Discovery scan (PATH + configured directories)
   |
3. Skills reported to ClaudeNest server via API
   |
4. Skills visible in dashboard & API
   |
5. Enable / disable per machine
   |
6. Available to Claude Code sessions`);

const skillObjectCode = ref(`{
  "path": "git",
  "name": "Git",
  "description": "Distributed version control system",
  "category": "version_control",
  "version": "2.43.0",
  "binary_path": "/usr/bin/git",
  "enabled": true,
  "discovered_at": "2026-02-17T08:00:00Z",
  "source": "auto",
  "machine_id": "550e8400-e29b-41d4-a716-446655440000"
}`);

const agentConfigCode = ref(`{
  "discovery": {
    "enabled": true,
    "interval_minutes": 5,
    "scan_paths": [
      "/usr/local/bin",
      "/usr/bin",
      "$HOME/.local/bin",
      "$HOME/.claudenest/skills"
    ],
    "ignore_patterns": [
      "*.bak",
      "*.tmp"
    ]
  }
}`);

const discoveryLogCode = ref(`[INFO]  Starting skill discovery scan...
[INFO]  Found: git v2.43.0 at /usr/bin/git
[INFO]  Found: node v20.11.0 at /usr/local/bin/node
[INFO]  Found: docker v24.0.7 at /usr/bin/docker
[INFO]  Found: psql v16.1 at /usr/bin/psql
[INFO]  Found: python3 v3.12.1 at /usr/bin/python3
[INFO]  Found: composer v2.7.1 at /usr/local/bin/composer
[INFO]  Custom: deploy-script at ~/.claudenest/skills/deploy-script
[INFO]  Discovery complete: 7 skills found (1 new, 6 unchanged)`);

const registerCurl = ref(`curl -X POST https://api.claudenest.io/api/machines/{machine_id}/skills \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "custom/deploy-script",
    "name": "Deploy Script",
    "description": "Custom deployment automation for staging and production",
    "category": "custom",
    "version": "1.0.0",
    "binary_path": "/home/user/.claudenest/skills/deploy-script",
    "enabled": true,
    "metadata": {
      "author": "DevOps Team",
      "requires_sudo": false
    }
  }'`);

const registerJs = ref(`const response = await fetch(
  \`https://api.claudenest.io/api/machines/\${machineId}/skills\`,
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: 'custom/deploy-script',
      name: 'Deploy Script',
      description: 'Custom deployment automation for staging and production',
      category: 'custom',
      version: '1.0.0',
      binary_path: '/home/user/.claudenest/skills/deploy-script',
      enabled: true,
      metadata: {
        author: 'DevOps Team',
        requires_sudo: false,
      },
    }),
  }
);

const result = await response.json();
console.log(result.data);`);

const registerPhp = ref(`<?php
$result = Http::withToken($token)
    ->post("https://api.claudenest.io/api/machines/{$machineId}/skills", [
        'path' => 'custom/deploy-script',
        'name' => 'Deploy Script',
        'description' => 'Custom deployment automation for staging and production',
        'category' => 'custom',
        'version' => '1.0.0',
        'binary_path' => '/home/user/.claudenest/skills/deploy-script',
        'enabled' => true,
        'metadata' => [
            'author' => 'DevOps Team',
            'requires_sudo' => false,
        ],
    ]);

$skill = $result['data'];`);

const registerResponseCode = ref(`{
  "success": true,
  "data": {
    "path": "custom/deploy-script",
    "name": "Deploy Script",
    "description": "Custom deployment automation for staging and production",
    "category": "custom",
    "version": "1.0.0",
    "enabled": true,
    "source": "manual",
    "created_at": "2026-02-17T12:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T12:00:00Z",
    "request_id": "req_skill_001"
  }
}`);

const listByCategoryCode = ref(`# List all skills on a machine
curl https://api.claudenest.io/api/machines/{machine_id}/skills \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by category (query parameter)
curl "https://api.claudenest.io/api/machines/{machine_id}/skills?category=database" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by enabled status
curl "https://api.claudenest.io/api/machines/{machine_id}/skills?enabled=true" \\
  -H "Authorization: Bearer YOUR_TOKEN"`);

const toggleCurl = ref(`# Toggle a skill on or off
curl -X POST https://api.claudenest.io/api/machines/{machine_id}/skills/docker/toggle \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
# {
#   "success": true,
#   "data": {
#     "path": "docker",
#     "name": "Docker",
#     "enabled": false,
#     "toggled_at": "2026-02-17T12:30:00Z"
#   }
# }`);

const toggleJs = ref(`// Toggle a skill
const response = await fetch(
  \`https://api.claudenest.io/api/machines/\${machineId}/skills/docker/toggle\`,
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  }
);

const result = await response.json();
console.log(\`Docker is now \${result.data.enabled ? 'enabled' : 'disabled'}\`);`);

const bulkCode = ref(`# Bulk update multiple skills at once
curl -X POST https://api.claudenest.io/api/machines/{machine_id}/skills/bulk \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operations": [
      {
        "path": "docker",
        "enabled": false
      },
      {
        "path": "kubectl",
        "enabled": false
      },
      {
        "path": "terraform",
        "enabled": false
      },
      {
        "path": "custom/deploy-script",
        "enabled": true,
        "metadata": { "priority": "high" }
      }
    ]
  }'`);

const bulkResponseCode = ref(`{
  "success": true,
  "data": {
    "updated": 4,
    "failed": 0,
    "results": [
      { "path": "docker", "enabled": false, "status": "updated" },
      { "path": "kubectl", "enabled": false, "status": "updated" },
      { "path": "terraform", "enabled": false, "status": "updated" },
      { "path": "custom/deploy-script", "enabled": true, "status": "updated" }
    ]
  },
  "meta": {
    "timestamp": "2026-02-17T12:35:00Z",
    "request_id": "req_bulk_001"
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

/* Category Grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
  transition: all 0.2s;
}

.category-card:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent);
}

.category-icon {
  width: 36px;
  height: 36px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.category-card div:last-child {
  display: flex;
  flex-direction: column;
}

.category-card strong {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', monospace;
}

.category-card span {
  color: var(--text-muted);
  font-size: 0.8rem;
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

  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
