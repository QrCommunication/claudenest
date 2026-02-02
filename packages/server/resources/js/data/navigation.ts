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
