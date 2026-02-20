import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// Layouts
const DashboardLayout = {
  template: `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="logo">
          <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1a1b26"/>
                <stop offset="100%" style="stop-color:#24283b"/>
              </linearGradient>
              <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#a855f7"/>
                <stop offset="100%" style="stop-color:#6366f1"/>
              </linearGradient>
              <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#22d3ee"/>
                <stop offset="100%" style="stop-color:#a855f7"/>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="512" height="512" rx="96" fill="url(#bgGrad)"/>
            <g transform="translate(256, 256)">
              <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
              <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
              <path d="M-60 -70 Q-130 -70 -130 0 Q-130 70 -60 70" stroke="url(#nestGrad)" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
              <path d="M60 -70 Q130 -70 130 0 Q130 70 60 70" stroke="url(#nestGrad)" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
              <circle cx="-35" cy="0" r="18" fill="#22d3ee"/>
              <circle cx="0" cy="0" r="18" fill="url(#nestGrad)"/>
              <circle cx="35" cy="0" r="18" fill="#22d3ee"/>
              <line x1="-17" y1="0" x2="17" y2="0" stroke="url(#accentGrad)" stroke-width="6" opacity="0.8"/>
            </g>
          </svg>
          <span>ClaudeNest</span>
        </div>
        <nav class="nav-menu">
          <router-link to="/" class="nav-link" exact>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Dashboard
          </router-link>
          <router-link to="/machines" class="nav-link">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
            </svg>
            Machines
          </router-link>
          <router-link to="/sessions" class="nav-link">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            Sessions
          </router-link>
          <router-link to="/projects" class="nav-link">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Projects
          </router-link>
          <div class="nav-divider"></div>
          <router-link to="/docs" class="nav-link">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            API Docs
          </router-link>
        </nav>
      </aside>
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  `,
};

// Documentation Layout
const DocsLayout = () => import('./layouts/DocsLayout.vue');

// Routes
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('./pages/Dashboard.vue'),
      },
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
      {
        path: '/sessions',
        name: 'sessions',
        component: () => import('./pages/sessions/Index.vue'),
      },
      {
        path: '/sessions/:id',
        name: 'sessions.show',
        component: () => import('./pages/sessions/Show.vue'),
      },
      {
        path: '/sessions/new',
        name: 'sessions.new',
        component: () => import('./pages/sessions/New.vue'),
      },
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
