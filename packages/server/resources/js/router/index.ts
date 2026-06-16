import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { BreadcrumbItem } from '@/types';

// Augment RouteMeta to include breadcrumb
declare module 'vue-router' {
    interface RouteMeta {
        public?: boolean;
        guestOnly?: boolean;
        requiresAuth?: boolean;
        breadcrumb?: BreadcrumbItem[];
    }
}

// Lazy load components
const Landing = () => import('@/pages/Landing.vue');
const Login = () => import('@/pages/Login.vue');
const Register = () => import('@/pages/Register.vue');
const ForgotPassword = () => import('@/pages/ForgotPassword.vue');
const ResetPassword = () => import('@/pages/ResetPassword.vue');
const Dashboard = () => import('@/pages/Dashboard.vue');

const routes: RouteRecordRaw[] = [
    // Landing page (public)
    {
        path: '/',
        name: 'landing',
        component: Landing,
        meta: { public: true },
    },

    // Public routes
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { public: true, guestOnly: true },
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
        meta: { public: true, guestOnly: true },
    },
    {
        path: '/forgot-password',
        name: 'forgot-password',
        component: ForgotPassword,
        meta: { public: true, guestOnly: true },
    },
    {
        path: '/reset-password',
        name: 'reset-password',
        component: ResetPassword,
        meta: { public: true, guestOnly: true },
    },

    // Protected routes — wrapped in AppLayout
    {
        path: '/',
        component: () => import('@/layouts/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                name: 'dashboard',
                component: Dashboard,
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Dashboard' },
                    ],
                },
            },
            {
                path: 'machines',
                name: 'machines',
                component: () => import('@/pages/Machines.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Machines' },
                    ],
                },
            },
            {
                path: 'machines/:id',
                name: 'machines.show',
                component: () => import('@/pages/machines/Show.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Machines', to: '/machines' },
                        { label: 'Details' },
                    ],
                },
            },
            {
                path: 'sessions',
                name: 'sessions',
                component: () => import('@/pages/sessions/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Sessions' },
                    ],
                },
            },
            {
                path: 'claude-sessions',
                name: 'claude-sessions',
                component: () => import('@/pages/claude-sessions/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Claude Sessions' },
                    ],
                },
            },
            {
                path: 'sessions/new',
                name: 'sessions.new',
                component: () => import('@/pages/sessions/New.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Sessions', to: '/sessions' },
                        { label: 'New Session' },
                    ],
                },
            },
            {
                path: 'sessions/:id',
                name: 'session.terminal',
                component: () => import('@/pages/sessions/Terminal.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Sessions', to: '/sessions' },
                        { label: 'Terminal' },
                    ],
                },
            },

            // Multi-Agent Project Routes
            {
                path: 'projects',
                name: 'projects',
                component: () => import('@/pages/projects/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects' },
                    ],
                },
            },
            {
                path: 'projects/new',
                name: 'projects.new',
                component: () => import('@/pages/projects/New.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects', to: '/projects' },
                        { label: 'New Project' },
                    ],
                },
            },
            {
                path: 'projects/:id',
                name: 'projects.show',
                component: () => import('@/pages/projects/Show.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects', to: '/projects' },
                        { label: 'Details' },
                    ],
                },
            },
            {
                path: 'projects/:id/workspace',
                name: 'projects.workspace',
                component: () => import('@/pages/projects/Workspace.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects', to: '/projects' },
                        { label: 'Project', to: '/projects/:id' },
                        { label: 'Workspace' },
                    ],
                },
            },
            {
                path: 'projects/:id/tasks',
                name: 'projects.tasks',
                component: () => import('@/pages/projects/Tasks.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects', to: '/projects' },
                        { label: 'Project', to: '/projects/:id' },
                        { label: 'Tasks' },
                    ],
                },
            },
            {
                path: 'projects/:id/context',
                name: 'projects.context',
                component: () => import('@/pages/projects/Context.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects', to: '/projects' },
                        { label: 'Project', to: '/projects/:id' },
                        { label: 'Context' },
                    ],
                },
            },
            {
                path: 'projects/:id/locks',
                name: 'projects.locks',
                component: () => import('@/pages/projects/Locks.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects', to: '/projects' },
                        { label: 'Project', to: '/projects/:id' },
                        { label: 'File Locks' },
                    ],
                },
            },
            {
                path: 'projects/:id/orchestration',
                name: 'projects.orchestration',
                component: () => import('@/pages/projects/Orchestration.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Projects', to: '/projects' },
                        { label: 'Project', to: '/projects/:id' },
                        { label: 'Orchestration' },
                    ],
                },
            },

            // Global Tasks View
            {
                path: 'tasks',
                name: 'tasks',
                component: () => import('@/pages/tasks/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Tasks' },
                    ],
                },
            },

            // Skills Routes
            {
                path: 'skills',
                name: 'skills',
                component: () => import('@/pages/skills/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Skills' },
                    ],
                },
            },
            {
                path: 'skills/:id',
                name: 'skill.detail',
                component: () => import('@/pages/skills/Show.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Skills', to: '/skills' },
                        { label: 'Details' },
                    ],
                },
            },

            // MCP Routes
            {
                path: 'mcp',
                name: 'mcp',
                component: () => import('@/pages/mcp/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'MCP Servers' },
                    ],
                },
            },
            {
                path: 'mcp/tools',
                name: 'mcp.tools',
                component: () => import('@/pages/mcp/Tools.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'MCP Servers', to: '/mcp' },
                        { label: 'Tools' },
                    ],
                },
            },

            // Commands Routes
            {
                path: 'commands',
                name: 'commands',
                component: () => import('@/pages/commands/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Commands' },
                    ],
                },
            },

            // Credentials
            {
                path: 'credentials',
                name: 'credentials',
                component: () => import('@/pages/credentials/Index.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Credentials' },
                    ],
                },
            },

            // Settings
            {
                path: 'settings',
                name: 'settings',
                component: () => import('@/pages/Settings.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: [
                        { label: 'Settings' },
                    ],
                },
            },
        ],
    },

    // Public pages
    {
        path: '/pricing',
        name: 'pricing',
        component: () => import('@/pages/Pricing.vue'),
        meta: { public: true },
    },
    {
        path: '/changelog',
        name: 'changelog',
        component: () => import('@/pages/Changelog.vue'),
        meta: { public: true },
    },

    // Documentation routes (public)
    {
        path: '/docs',
        component: () => import('@/layouts/DocsLayout.vue'),
        meta: { public: true },
        children: [
            {
                path: '',
                name: 'docs',
                component: () => import('@/pages/docs/Index.vue'),
            },
            {
                path: 'installation',
                name: 'docs.installation',
                component: () => import('@/pages/docs/Installation.vue'),
            },
            {
                path: 'authentication',
                name: 'docs.authentication',
                component: () => import('@/pages/docs/Authentication.vue'),
            },
            {
                path: 'quickstart',
                name: 'docs.quickstart',
                component: () => import('@/pages/docs/Quickstart.vue'),
            },
            {
                path: 'api/:category',
                name: 'docs.api',
                component: () => import('@/pages/docs/ApiReference.vue'),
            },
            {
                path: 'webhooks/websocket',
                name: 'docs.webhooks.websocket',
                component: () => import('@/pages/docs/Webhooks.vue'),
            },
            {
                path: 'webhooks/events',
                name: 'docs.webhooks.events',
                component: () => import('@/pages/docs/Webhooks.vue'),
            },
            {
                path: 'sdks/:sdk',
                name: 'docs.sdks',
                component: () => import('@/pages/docs/SdkDocs.vue'),
            },
            {
                path: 'resources/error-codes',
                name: 'docs.resources.error-codes',
                component: () => import('@/pages/docs/ApiReference.vue'),
            },
            {
                path: 'resources/rate-limits',
                name: 'docs.resources.rate-limits',
                component: () => import('@/pages/docs/ApiReference.vue'),
            },
            {
                path: 'resources/changelog',
                name: 'docs.resources.changelog',
                component: () => import('@/pages/docs/ApiReference.vue'),
            },
            {
                path: 'guides/agent-update',
                name: 'docs.guides.agent-update',
                component: () => import('@/pages/docs/guides/AgentUpdate.vue'),
            },
            // Guides — pages présentes dans la nav (data/navigation.ts) mais
            // jusqu'ici non routées (liens morts → catch-all). Branchées 2026-06-16.
            {
                path: 'guides/getting-started',
                name: 'docs.guides.getting-started',
                component: () => import('@/pages/docs/guides/GettingStarted.vue'),
            },
            {
                path: 'guides/first-machine',
                name: 'docs.guides.first-machine',
                component: () => import('@/pages/docs/guides/FirstMachine.vue'),
            },
            {
                path: 'guides/agent-setup',
                name: 'docs.guides.agent-setup',
                component: () => import('@/pages/docs/guides/AgentSetup.vue'),
            },
            {
                path: 'guides/remote-sessions',
                name: 'docs.guides.remote-sessions',
                component: () => import('@/pages/docs/guides/RemoteSessions.vue'),
            },
            {
                path: 'guides/multi-agent',
                name: 'docs.guides.multi-agent',
                component: () => import('@/pages/docs/guides/MultiAgent.vue'),
            },
            {
                path: 'guides/rag-pipeline',
                name: 'docs.guides.rag-pipeline',
                component: () => import('@/pages/docs/guides/RagPipeline.vue'),
            },
            {
                path: 'guides/file-locking',
                name: 'docs.guides.file-locking',
                component: () => import('@/pages/docs/guides/FileLocking.vue'),
            },
            {
                path: 'guides/task-coordination',
                name: 'docs.guides.task-coordination',
                component: () => import('@/pages/docs/guides/TaskCoordination.vue'),
            },
            {
                path: 'guides/credentials',
                name: 'docs.guides.credentials',
                component: () => import('@/pages/docs/guides/Credentials.vue'),
            },
            // Cookbook
            {
                path: 'cookbook/docker',
                name: 'docs.cookbook.docker',
                component: () => import('@/pages/docs/cookbook/Docker.vue'),
            },
            {
                path: 'cookbook/bare-metal',
                name: 'docs.cookbook.bare-metal',
                component: () => import('@/pages/docs/cookbook/BareMetal.vue'),
            },
            {
                path: 'cookbook/mcp-setup',
                name: 'docs.cookbook.mcp-setup',
                component: () => import('@/pages/docs/cookbook/McpSetup.vue'),
            },
            {
                path: 'cookbook/skills-discovery',
                name: 'docs.cookbook.skills-discovery',
                component: () => import('@/pages/docs/cookbook/SkillsDiscovery.vue'),
            },
            {
                path: 'cookbook/websocket',
                name: 'docs.cookbook.websocket',
                component: () => import('@/pages/docs/cookbook/WebSocketIntegration.vue'),
            },
            {
                path: 'cookbook/oauth',
                name: 'docs.cookbook.oauth',
                component: () => import('@/pages/docs/cookbook/OAuth.vue'),
            },
            {
                path: 'cookbook/mobile',
                name: 'docs.cookbook.mobile',
                component: () => import('@/pages/docs/cookbook/Mobile.vue'),
            },
            {
                path: 'cookbook/monitoring',
                name: 'docs.cookbook.monitoring',
                component: () => import('@/pages/docs/cookbook/Monitoring.vue'),
            },
            // Concepts
            {
                path: 'concepts/architecture',
                name: 'docs.concepts.architecture',
                component: () => import('@/pages/docs/concepts/Architecture.vue'),
            },
            {
                path: 'concepts/security',
                name: 'docs.concepts.security',
                component: () => import('@/pages/docs/concepts/Security.vue'),
            },
            {
                path: 'concepts/websocket-protocol',
                name: 'docs.concepts.websocket-protocol',
                component: () => import('@/pages/docs/concepts/WebSocketProtocol.vue'),
            },
            {
                path: 'concepts/rag-embeddings',
                name: 'docs.concepts.rag-embeddings',
                component: () => import('@/pages/docs/concepts/RagEmbeddings.vue'),
            },
            {
                path: 'concepts/multi-agent-coordination',
                name: 'docs.concepts.multi-agent-coordination',
                component: () => import('@/pages/docs/concepts/MultiAgentCoordination.vue'),
            },
            // Legal pages moved to /legal — keep old URLs alive.
            { path: 'terms', redirect: '/legal/terms' },
            { path: 'privacy', redirect: '/legal/privacy' },
            { path: 'mentions-legales', redirect: '/legal/mentions-legales' },
            { path: 'cookies', redirect: '/legal/cookies' },
        ],
    },

    // Legal pages: public chrome WITHOUT the documentation sidebar (the docs
    // menu has no business framing legal content).
    {
        path: '/legal',
        component: () => import('@/layouts/LegalLayout.vue'),
        meta: { public: true },
        children: [
            { path: '', redirect: '/legal/mentions-legales' },
            {
                path: 'mentions-legales',
                name: 'legal.mentions-legales',
                component: () => import('@/pages/docs/MentionsLegales.vue'),
                meta: { public: true },
            },
            {
                path: 'privacy',
                name: 'legal.privacy',
                component: () => import('@/pages/docs/PrivacyPolicy.vue'),
                meta: { public: true },
            },
            {
                path: 'terms',
                name: 'legal.terms',
                component: () => import('@/pages/docs/TermsOfService.vue'),
                meta: { public: true },
            },
            {
                path: 'cookies',
                name: 'legal.cookies',
                component: () => import('@/pages/docs/CookiePolicy.vue'),
                meta: { public: true },
            },
        ],
    },

    // Catch-all redirect
    {
        path: '/:pathMatch(.*)*',
        redirect: '/dashboard',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation guards
router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const authStore = useAuthStore();

    // Wait for auth store to initialize
    if (authStore.token && !authStore.user) {
        await authStore.fetchUser();
    }

    const isAuthenticated = authStore.isAuthenticated;

    // Handle guest-only routes (login, register, etc.)
    if (to.meta.guestOnly && isAuthenticated) {
        return next({ name: 'dashboard' });
    }

    // Handle protected routes
    if (to.meta.requiresAuth && !isAuthenticated) {
        return next({ name: 'login', query: { redirect: to.fullPath } });
    }

    next();
});

export default router;
