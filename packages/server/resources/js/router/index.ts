import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb.vue';

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

    // Protected routes
    {
        path: '/dashboard',
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
        path: '/machines',
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
        path: '/machines/:id',
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
        path: '/sessions',
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
        path: '/sessions/:id',
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
    {
        path: '/sessions/new',
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

    // Multi-Agent Project Routes
    {
        path: '/projects',
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
        path: '/projects/:id',
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
        path: '/projects/:id/tasks',
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
        path: '/projects/:id/context',
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
        path: '/projects/:id/locks',
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

    // Global Tasks View
    {
        path: '/tasks',
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
        path: '/skills',
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
        path: '/skills/:id',
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
        path: '/mcp',
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
        path: '/mcp/tools',
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
        path: '/commands',
        name: 'commands',
        component: () => import('@/pages/commands/Index.vue'),
        meta: {
            requiresAuth: true,
            breadcrumb: [
                { label: 'Commands' },
            ],
        },
    },

    // Settings
    {
        path: '/settings',
        name: 'settings',
        component: () => import('@/pages/Settings.vue'),
        meta: {
            requiresAuth: true,
            breadcrumb: [
                { label: 'Settings' },
            ],
        },
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
                path: 'terms',
                name: 'docs.terms',
                component: () => import('@/pages/docs/TermsOfService.vue'),
            },
            {
                path: 'privacy',
                name: 'docs.privacy',
                component: () => import('@/pages/docs/PrivacyPolicy.vue'),
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
