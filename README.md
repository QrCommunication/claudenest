# 🪺 ClaudeNest

<a href="https://polyformproject.org/licenses/noncommercial/1.0.0/"><img src="https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-blue.svg"></a>
<a href="https://claude.ai"><img src="https://img.shields.io/badge/Built%20for-Claude%20Code-orange.svg"></a>
<a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18%2B-green.svg"></a>

**ClaudeNest** is an open-source orchestration layer for Claude Code that enables multi-agent parallel development workflows. Spawn, coordinate, and monitor multiple Claude Code instances working simultaneously on different parts of your codebase.

Perfect for complex refactoring, large-scale migrations, or any development task that benefits from divide-and-conquer parallelism.

---

## ✨ Features

- **Multi-Agent Orchestration** — Spawn and manage multiple Claude Code instances in parallel
- **Task Distribution** — Automatically split complex tasks into subtasks for parallel execution
- **Context Sharing** — Share relevant context between agents without token duplication
- **Conflict Prevention** — Built-in file locking and merge conflict detection
- **Real-time Monitoring** — Dashboard to track agent progress and status
- **Session Management** — Save, restore, and replay orchestration sessions
- **Extensible Architecture** — Plugin system for custom workflows and integrations

---

## 📋 Requirements

- **Node.js** 18.0 or higher
- **Claude Code CLI** installed and configured
- **Anthropic API Key** with appropriate permissions
- **Git** (for conflict detection features)

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/ronylicha/claudenest.git
cd claudenest

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your API keys
nano .env
```

---

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_api_key_here

# ClaudeNest Settings
CLAUDENEST_MAX_AGENTS=5
CLAUDENEST_WORKSPACE=/path/to/your/workspace
CLAUDENEST_LOG_LEVEL=info

# Optional: Custom Claude Code path
CLAUDE_CODE_PATH=/usr/local/bin/claude
```

---

## 📖 Usage

### Basic Usage

```bash
# Start ClaudeNest with a task description
npx claudenest "Refactor the authentication module and add unit tests"

# Start with a specific configuration file
npx claudenest --config ./tasks/migration.yaml

# Start in interactive mode
npx claudenest --interactive
```

### Task Configuration (YAML)

```yaml
# tasks/example.yaml
name: "Feature Implementation"
description: "Implement user dashboard with charts"

agents:
  - name: backend
    focus: "API endpoints and database queries"
    files:
      - src/api/**
      - src/models/**
    
  - name: frontend
    focus: "React components and styling"
    files:
      - src/components/**
      - src/styles/**
    
  - name: tests
    focus: "Unit and integration tests"
    files:
      - tests/**
    depends_on:
      - backend
      - frontend

settings:
  max_parallel: 3
  conflict_strategy: "queue"  # or "abort", "merge"
```

### Programmatic API

```typescript
import { ClaudeNest, Agent, Task } from 'claudenest';

const nest = new ClaudeNest({
  maxAgents: 5,
  workspace: './my-project',
});

// Define agents
const backendAgent = new Agent({
  name: 'backend',
  focus: 'API development',
  filePatterns: ['src/api/**', 'src/models/**'],
});

const frontendAgent = new Agent({
  name: 'frontend', 
  focus: 'UI components',
  filePatterns: ['src/components/**'],
});

// Create and run task
const task = new Task({
  description: 'Implement user authentication flow',
  agents: [backendAgent, frontendAgent],
});

await nest.execute(task);
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ClaudeNest Core                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Orchestrator │  │   Router    │  │  Monitor    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│  ┌──────▼────────────────▼────────────────▼──────┐     │
│  │              Task Queue Manager                │     │
│  └──────┬────────────────┬────────────────┬──────┘     │
│         │                │                │             │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐     │
│  │   Agent 1   │  │   Agent 2   │  │   Agent N   │     │
│  │ (Claude CC) │  │ (Claude CC) │  │ (Claude CC) │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Project Workspace   │
              │   (Git Repository)    │
              └───────────────────────┘
```

---

## 📁 Project Structure

```
claudenest/
├── src/
│   ├── core/
│   │   ├── orchestrator.ts    # Main orchestration logic
│   │   ├── agent.ts           # Agent class definition
│   │   ├── task.ts            # Task management
│   │   └── queue.ts           # Task queue implementation
│   ├── utils/
│   │   ├── file-lock.ts       # File locking mechanism
│   │   ├── context-share.ts   # Context sharing between agents
│   │   └── git-utils.ts       # Git operations helper
│   ├── plugins/
│   │   └── index.ts           # Plugin system
│   └── index.ts               # Main entry point
├── bin/
│   └── claudenest.js          # CLI entry point
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── getting-started.md
│   ├── configuration.md
│   └── api-reference.md
├── examples/
│   ├── basic-usage/
│   ├── complex-refactor/
│   └── multi-repo/
├── .env.example
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

---

## 🔌 Plugins

ClaudeNest supports plugins to extend functionality:

```typescript
// plugins/slack-notifier.ts
import { Plugin, HookContext } from 'claudenest';

export const slackNotifier: Plugin = {
  name: 'slack-notifier',
  
  hooks: {
    onTaskComplete: async (ctx: HookContext) => {
      await sendSlackMessage(`Task "${ctx.task.name}" completed!`);
    },
    
    onAgentError: async (ctx: HookContext) => {
      await sendSlackMessage(`⚠️ Agent error: ${ctx.error.message}`);
    },
  },
};
```

---

## 🛡️ Conflict Prevention

ClaudeNest includes built-in mechanisms to prevent agents from conflicting:

| Strategy | Description |
|----------|-------------|
| `file-lock` | Agents acquire locks before modifying files |
| `queue` | Changes to shared files are queued and applied sequentially |
| `branch` | Each agent works on a separate git branch |
| `review` | Changes are staged for human review before merge |

---

## 📊 Monitoring Dashboard

Start the monitoring dashboard:

```bash
npx claudenest --dashboard

# Dashboard available at http://localhost:3333
```

Features:
- Real-time agent status and progress
- Task queue visualization
- Token usage tracking
- Error logs and debugging info

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚠️ License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

- ✅ Free for personal use, research, education, and non-commercial purposes
- ✅ Modifications and forks allowed for non-commercial use
- ❌ **Commercial use is prohibited**

See the <a>LICENSE</a> file for full details.

---

## 💼 Commercial Licensing

This project is free for non-commercial use under the PolyForm Noncommercial License.

**Need to use ClaudeNest in a commercial product or SaaS?**

Commercial licenses are available. Contact us to discuss your needs:

📧 **contact@qr-communication.com**

---

## 🙏 Acknowledgments

- <a href="https://anthropic.com">Anthropic</a> for Claude and Claude Code
- The open-source community for inspiration and tooling

---

## 📬 Contact

**Rony Licha** — Founder &amp; CTO @ QR Communication

- GitHub: <a href="https://github.com/ronylicha">@ronylicha</a>
- Website: <a href="https://qr-communication.com">qr-communication.com</a>

---

<p>
  Made with 🪺 by <a href="https://qr-communication.com">QR Communication</a>
</p>
