import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// Layouts
const AppLayout = () => import('./layouts/AppLayout.vue');
const DocsLayout = () => import('./layouts/DocsLayout.vue');

// Routes
const routes: RouteRecordRaw[] = [
  // Redirect root to dashboard
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('./pages/Dashboard.vue'),
      },
      // Machines
      {
        path: '/machines',
        name: 'machines',
        component: () => import('./pages/machines/Index.vue'),
      },
      {
        path: '/machines/:id',
        name: 'machine.show',
        component: () => import('./pages/machines/Show.vue'),
      },
      // Sessions
      {
        path: '/sessions',
        name: 'sessions',
        component: () => import('./pages/sessions/Index.vue'),
      },
      {
        path: '/sessions/new',
        name: 'sessions.new',
        component: () => import('./pages/sessions/New.vue'),
      },
      {
        path: '/sessions/:id',
        name: 'sessions.show',
        component: () => import('./pages/sessions/Show.vue'),
      },
      // Projects
      {
        path: '/projects',
        name: 'projects',
        component: () => import('./pages/projects/Index.vue'),
      },
      {
        path: '/projects/:id',
        name: 'projects.show',
        component: () => import('./pages/projects/Show.vue'),
      },
      {
        path: '/projects/:id/tasks',
        name: 'projects.tasks',
        component: () => import('./pages/projects/Tasks.vue'),
      },
      {
        path: '/projects/:id/context',
        name: 'projects.context',
        component: () => import('./pages/projects/Context.vue'),
      },
      {
        path: '/projects/:id/locks',
        name: 'projects.locks',
        component: () => import('./pages/projects/Locks.vue'),
      },
      {
        path: '/projects/:id/orchestration',
        name: 'projects.orchestration',
        component: () => import('./pages/projects/Orchestration.vue'),
      },
      // Credentials
      {
        path: '/credentials',
        name: 'credentials',
        component: () => import('./pages/credentials/Index.vue'),
      },
      // Skills
      {
        path: '/skills',
        name: 'skills',
        component: () => import('./pages/skills/Index.vue'),
      },
      {
        path: '/skills/new',
        name: 'skills.new',
        component: () => import('./pages/skills/SkillEditor.vue'),
      },
      {
        path: '/skills/:path+/edit',
        name: 'skills.edit',
        component: () => import('./pages/skills/SkillEditor.vue'),
      },
      {
        path: '/skills/:path+',
        name: 'skills.show',
        component: () => import('./pages/skills/Show.vue'),
      },
      // MCP Servers
      {
        path: '/mcp',
        name: 'mcp',
        component: () => import('./pages/mcp/Index.vue'),
      },
      {
        path: '/mcp/tools',
        name: 'mcp.tools',
        component: () => import('./pages/mcp/Tools.vue'),
      },
      // Commands
      {
        path: '/commands',
        name: 'commands',
        component: () => import('./pages/commands/Index.vue'),
      },
    ],
  },
  // Documentation routes with dedicated layout
  {
    path: '/docs',
    component: DocsLayout,
    children: [
      {
        path: '',
        name: 'docs',
        component: () => import('./pages/docs/Index.vue'),
      },
      {
        path: 'installation',
        name: 'docs.installation',
        component: () => import('./pages/docs/Installation.vue'),
      },
      {
        path: 'authentication',
        name: 'docs.authentication',
        component: () => import('./pages/docs/Authentication.vue'),
      },
      {
        path: 'quickstart',
        name: 'docs.quickstart',
        component: () => import('./pages/docs/Quickstart.vue'),
      },
      // API Reference
      {
        path: 'api/:category',
        name: 'docs.api',
        component: () => import('./pages/docs/ApiReference.vue'),
      },
      // Webhooks
      {
        path: 'webhooks/websocket',
        name: 'docs.webhooks.websocket',
        component: () => import('./pages/docs/Webhooks.vue'),
      },
      {
        path: 'webhooks/events',
        name: 'docs.webhooks.events',
        component: () => import('./pages/docs/Webhooks.vue'),
      },
      // SDKs
      {
        path: 'sdks/:sdk',
        name: 'docs.sdks',
        component: () => import('./pages/docs/SdkDocs.vue'),
      },
      // Resources
      {
        path: 'resources/error-codes',
        name: 'docs.resources.error-codes',
        component: () => import('./pages/docs/ApiReference.vue'),
      },
      {
        path: 'resources/rate-limits',
        name: 'docs.resources.rate-limits',
        component: () => import('./pages/docs/ApiReference.vue'),
      },
      {
        path: 'resources/changelog',
        name: 'docs.resources.changelog',
        component: () => import('./pages/docs/ApiReference.vue'),
      },
      // Guides
      {
        path: 'guides/getting-started',
        name: 'docs.guides.getting-started',
        component: () => import('./pages/docs/guides/GettingStarted.vue'),
      },
      {
        path: 'guides/first-machine',
        name: 'docs.guides.first-machine',
        component: () => import('./pages/docs/guides/FirstMachine.vue'),
      },
      {
        path: 'guides/remote-sessions',
        name: 'docs.guides.remote-sessions',
        component: () => import('./pages/docs/guides/RemoteSessions.vue'),
      },
      {
        path: 'guides/multi-agent',
        name: 'docs.guides.multi-agent',
        component: () => import('./pages/docs/guides/MultiAgent.vue'),
      },
      {
        path: 'guides/rag-pipeline',
        name: 'docs.guides.rag-pipeline',
        component: () => import('./pages/docs/guides/RagPipeline.vue'),
      },
      {
        path: 'guides/file-locking',
        name: 'docs.guides.file-locking',
        component: () => import('./pages/docs/guides/FileLocking.vue'),
      },
      {
        path: 'guides/task-coordination',
        name: 'docs.guides.task-coordination',
        component: () => import('./pages/docs/guides/TaskCoordination.vue'),
      },
      {
        path: 'guides/agent-setup',
        name: 'docs.guides.agent-setup',
        component: () => import('./pages/docs/guides/AgentSetup.vue'),
      },
      {
        path: 'guides/credentials',
        name: 'docs.guides.credentials',
        component: () => import('./pages/docs/guides/Credentials.vue'),
      },
      // Cookbook
      {
        path: 'cookbook/docker',
        name: 'docs.cookbook.docker',
        component: () => import('./pages/docs/cookbook/Docker.vue'),
      },
      {
        path: 'cookbook/bare-metal',
        name: 'docs.cookbook.bare-metal',
        component: () => import('./pages/docs/cookbook/BareMetal.vue'),
      },
      {
        path: 'cookbook/mcp-setup',
        name: 'docs.cookbook.mcp-setup',
        component: () => import('./pages/docs/cookbook/McpSetup.vue'),
      },
      {
        path: 'cookbook/skills-discovery',
        name: 'docs.cookbook.skills-discovery',
        component: () => import('./pages/docs/cookbook/SkillsDiscovery.vue'),
      },
      {
        path: 'cookbook/websocket',
        name: 'docs.cookbook.websocket',
        component: () => import('./pages/docs/cookbook/WebSocketIntegration.vue'),
      },
      {
        path: 'cookbook/oauth',
        name: 'docs.cookbook.oauth',
        component: () => import('./pages/docs/cookbook/OAuth.vue'),
      },
      {
        path: 'cookbook/mobile',
        name: 'docs.cookbook.mobile',
        component: () => import('./pages/docs/cookbook/Mobile.vue'),
      },
      {
        path: 'cookbook/monitoring',
        name: 'docs.cookbook.monitoring',
        component: () => import('./pages/docs/cookbook/Monitoring.vue'),
      },
      // Concepts
      {
        path: 'concepts/architecture',
        name: 'docs.concepts.architecture',
        component: () => import('./pages/docs/concepts/Architecture.vue'),
      },
      {
        path: 'concepts/security',
        name: 'docs.concepts.security',
        component: () => import('./pages/docs/concepts/Security.vue'),
      },
      {
        path: 'concepts/websocket-protocol',
        name: 'docs.concepts.websocket-protocol',
        component: () => import('./pages/docs/concepts/WebSocketProtocol.vue'),
      },
      {
        path: 'concepts/rag-embeddings',
        name: 'docs.concepts.rag-embeddings',
        component: () => import('./pages/docs/concepts/RagEmbeddings.vue'),
      },
      {
        path: 'concepts/multi-agent-coordination',
        name: 'docs.concepts.multi-agent-coordination',
        component: () => import('./pages/docs/concepts/MultiAgentCoordination.vue'),
      },
      // Legal pages
      {
        path: 'terms',
        name: 'docs.terms',
        component: () => import('./pages/docs/TermsOfService.vue'),
      },
      {
        path: 'privacy',
        name: 'docs.privacy',
        component: () => import('./pages/docs/PrivacyPolicy.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }
    return { top: 0 };
  },
});

export default router;
