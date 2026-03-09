/**
 * Documentation Navigation Structure
 */

export interface NavItem {
  id: string;
  title: string;
  path?: string;
  children?: NavItem[];
  description?: string;
}

export interface NavSection {
  id: string;
  title: string;
  icon?: string;
  items: NavItem[];
}

export const docsNavigation: NavSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket',
    items: [
      {
        id: 'introduction',
        title: 'Introduction',
        path: '/docs',
        description: 'Overview of ClaudeNest and its features'
      },
      {
        id: 'installation',
        title: 'Installation',
        path: '/docs/installation',
        description: 'Install ClaudeNest server and agent'
      },
      {
        id: 'authentication',
        title: 'Authentication',
        path: '/docs/authentication',
        description: 'Set up API authentication'
      },
      {
        id: 'quickstart',
        title: 'Quickstart',
        path: '/docs/quickstart',
        description: 'Make your first API call'
      }
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: 'code',
    items: [
      {
        id: 'auth-api',
        title: 'Authentication',
        path: '/docs/api/authentication',
        description: 'Login, tokens, and OAuth'
      },
      {
        id: 'machines-api',
        title: 'Machines',
        path: '/docs/api/machines',
        description: 'Manage registered machines'
      },
      {
        id: 'sessions-api',
        title: 'Sessions',
        path: '/docs/api/sessions',
        description: 'Claude Code sessions'
      },
      {
        id: 'projects-api',
        title: 'Projects',
        path: '/docs/api/projects',
        description: 'Shared projects'
      },
      {
        id: 'tasks-api',
        title: 'Tasks',
        path: '/docs/api/tasks',
        description: 'Task management'
      },
      {
        id: 'context-api',
        title: 'Context (RAG)',
        path: '/docs/api/context',
        description: 'Context and RAG queries'
      },
      {
        id: 'file-locks-api',
        title: 'File Locks',
        path: '/docs/api/file-locks',
        description: 'File locking for conflict prevention'
      },
      {
        id: 'skills-api',
        title: 'Skills',
        path: '/docs/api/skills',
        description: 'Discovered skills'
      },
      {
        id: 'mcp-api',
        title: 'MCP Servers',
        path: '/docs/api/mcp',
        description: 'Model Context Protocol servers'
      },
      {
        id: 'commands-api',
        title: 'Commands',
        path: '/docs/api/commands',
        description: 'Discovered commands'
      },
      {
        id: 'health-api',
        title: 'Health',
        path: '/docs/api/health',
        description: 'Health check endpoint'
      }
    ]
  },
  {
    id: 'webhooks',
    title: 'Webhooks & Events',
    icon: 'bell',
    items: [
      {
        id: 'websocket-events',
        title: 'WebSocket Events',
        path: '/docs/webhooks/websocket',
        description: 'Real-time event streaming'
      },
      {
        id: 'webhook-events',
        title: 'Webhook Events',
        path: '/docs/webhooks/events',
        description: 'HTTP webhook configuration'
      }
    ]
  },
  {
    id: 'sdks',
    title: 'SDKs',
    icon: 'package',
    items: [
      {
        id: 'javascript-sdk',
        title: 'JavaScript SDK',
        path: '/docs/sdks/javascript',
        description: 'Node.js and browser SDK'
      },
      {
        id: 'cli',
        title: 'CLI Reference',
        path: '/docs/sdks/cli',
        description: 'Command line interface'
      },
      {
        id: 'php-sdk',
        title: 'PHP SDK',
        path: '/docs/sdks/php',
        description: 'PHP client library'
      },
      {
        id: 'python-sdk',
        title: 'Python SDK',
        path: '/docs/sdks/python',
        description: 'Python client library'
      }
    ]
  },
  {
    id: 'guides',
    title: 'Guides',
    icon: 'map',
    items: [
      {
        id: 'guide-getting-started',
        title: 'Getting Started',
        path: '/docs/guides/getting-started',
        description: 'Set up ClaudeNest from scratch'
      },
      {
        id: 'guide-first-machine',
        title: 'First Machine',
        path: '/docs/guides/first-machine',
        description: 'Register and connect your first machine'
      },
      {
        id: 'guide-remote-sessions',
        title: 'Remote Sessions',
        path: '/docs/guides/remote-sessions',
        description: 'Run Claude Code sessions remotely'
      },
      {
        id: 'guide-multi-agent',
        title: 'Multi-Agent',
        path: '/docs/guides/multi-agent',
        description: 'Coordinate multiple Claude instances'
      },
      {
        id: 'guide-rag-pipeline',
        title: 'RAG Pipeline',
        path: '/docs/guides/rag-pipeline',
        description: 'Set up context retrieval with pgvector'
      },
      {
        id: 'guide-file-locking',
        title: 'File Locking',
        path: '/docs/guides/file-locking',
        description: 'Prevent conflicts between agents'
      },
      {
        id: 'guide-task-coordination',
        title: 'Task Coordination',
        path: '/docs/guides/task-coordination',
        description: 'Manage and assign tasks to agents'
      },
      {
        id: 'guide-agent-setup',
        title: 'Agent Setup',
        path: '/docs/guides/agent-setup',
        description: 'Install and configure the local agent'
      },
      {
        id: 'guide-credentials',
        title: 'Credentials',
        path: '/docs/guides/credentials',
        description: 'Manage Claude API keys and OAuth tokens'
      }
    ]
  },
  {
    id: 'cookbook',
    title: 'Cookbook',
    icon: 'chef',
    items: [
      {
        id: 'cookbook-docker',
        title: 'Docker Setup',
        path: '/docs/cookbook/docker',
        description: 'Deploy with Docker Compose'
      },
      {
        id: 'cookbook-bare-metal',
        title: 'Bare Metal',
        path: '/docs/cookbook/bare-metal',
        description: 'Production deployment on bare metal'
      },
      {
        id: 'cookbook-mcp-setup',
        title: 'MCP Setup',
        path: '/docs/cookbook/mcp-setup',
        description: 'Configure Model Context Protocol servers'
      },
      {
        id: 'cookbook-skills-discovery',
        title: 'Skills Discovery',
        path: '/docs/cookbook/skills-discovery',
        description: 'Auto-discover and manage skills'
      },
      {
        id: 'cookbook-websocket',
        title: 'WebSocket Integration',
        path: '/docs/cookbook/websocket',
        description: 'Real-time communication patterns'
      },
      {
        id: 'cookbook-oauth',
        title: 'OAuth Setup',
        path: '/docs/cookbook/oauth',
        description: 'Configure Google and GitHub OAuth'
      },
      {
        id: 'cookbook-mobile',
        title: 'Mobile App',
        path: '/docs/cookbook/mobile',
        description: 'Set up the React Native mobile app'
      },
      {
        id: 'cookbook-monitoring',
        title: 'Monitoring',
        path: '/docs/cookbook/monitoring',
        description: 'Monitor agents, sessions, and performance'
      }
    ]
  },
  {
    id: 'concepts',
    title: 'Concepts',
    icon: 'brain',
    items: [
      {
        id: 'concept-architecture',
        title: 'Architecture',
        path: '/docs/concepts/architecture',
        description: 'System architecture and data flow'
      },
      {
        id: 'concept-security',
        title: 'Security',
        path: '/docs/concepts/security',
        description: 'Security model and encryption'
      },
      {
        id: 'concept-websocket-protocol',
        title: 'WebSocket Protocol',
        path: '/docs/concepts/websocket-protocol',
        description: 'Real-time communication protocol'
      },
      {
        id: 'concept-rag-embeddings',
        title: 'RAG & Embeddings',
        path: '/docs/concepts/rag-embeddings',
        description: 'How context retrieval works'
      },
      {
        id: 'concept-multi-agent',
        title: 'Multi-Agent Coordination',
        path: '/docs/concepts/multi-agent-coordination',
        description: 'How multiple agents collaborate'
      }
    ]
  },
  {
    id: 'resources',
    title: 'Resources',
    icon: 'book',
    items: [
      {
        id: 'error-codes',
        title: 'Error Codes',
        path: '/docs/resources/error-codes',
        description: 'Complete error code reference'
      },
      {
        id: 'rate-limits',
        title: 'Rate Limits',
        path: '/docs/resources/rate-limits',
        description: 'API rate limiting information'
      },
      {
        id: 'changelog',
        title: 'Changelog',
        path: '/docs/resources/changelog',
        description: 'API version history'
      },
      {
        id: 'terms',
        title: 'Terms of Service',
        path: '/docs/terms',
        description: 'Terms and conditions'
      },
      {
        id: 'privacy',
        title: 'Privacy Policy',
        path: '/docs/privacy',
        description: 'GDPR-compliant privacy policy'
      }
    ]
  }
];

// Flatten navigation for search
export const flattenNavigation = (): Array<{ section: NavSection; item: NavItem }> => {
  const flattened: Array<{ section: NavSection; item: NavItem }> = [];
  
  for (const section of docsNavigation) {
    for (const item of section.items) {
      flattened.push({ section, item });
    }
  }
  
  return flattened;
};

// Find navigation item by path
export const findNavItemByPath = (path: string): { section: NavSection; item: NavItem } | null => {
  for (const section of docsNavigation) {
    for (const item of section.items) {
      if (item.path === path) {
        return { section, item };
      }
    }
  }
  return null;
};

// Get previous and next navigation items
export const getPrevNext = (currentPath: string): { prev: NavItem | null; next: NavItem | null } => {
  const flattened = flattenNavigation();
  const currentIndex = flattened.findIndex(({ item }) => item.path === currentPath);
  
  if (currentIndex === -1) {
    return { prev: null, next: null };
  }
  
  return {
    prev: currentIndex > 0 ? flattened[currentIndex - 1].item : null,
    next: currentIndex < flattened.length - 1 ? flattened[currentIndex + 1].item : null
  };
};

// Search navigation
export const searchNavigation = (query: string): Array<{ section: NavSection; item: NavItem }> => {
  const lowerQuery = query.toLowerCase();
  const results: Array<{ section: NavSection; item: NavItem }> = [];
  
  for (const section of docsNavigation) {
    for (const item of section.items) {
      if (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ section, item });
      }
    }
  }
  
  return results;
};
