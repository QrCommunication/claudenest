import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Lazy load components
const Login = () => import('@/pages/Login.vue');
const Register = () => import('@/pages/Register.vue');
const ForgotPassword = () => import('@/pages/ForgotPassword.vue');
const ResetPassword = () => import('@/pages/ResetPassword.vue');
const Dashboard = () => import('@/pages/Dashboard.vue');

const routes: RouteRecordRaw[] = [
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
        path: '/',
        name: 'dashboard',
        component: Dashboard,
        meta: { requiresAuth: true },
    },
    {
        path: '/machines',
        name: 'machines',
        component: () => import('@/pages/Machines.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/machines/:id',
        name: 'machines.show',
        component: () => import('@/pages/machines/Show.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/sessions',
        name: 'sessions',
        component: () => import('@/pages/sessions/Index.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/sessions/:id',
        name: 'session.terminal',
        component: () => import('@/pages/sessions/Terminal.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/sessions/new',
        name: 'sessions.new',
        component: () => import('@/pages/sessions/New.vue'),
        meta: { requiresAuth: true },
    },

    // Multi-Agent Project Routes
    {
        path: '/projects',
        name: 'projects',
        component: () => import('@/pages/projects/Index.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/projects/:id',
        name: 'projects.show',
        component: () => import('@/pages/projects/Show.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/projects/:id/tasks',
        name: 'projects.tasks',
        component: () => import('@/pages/projects/Tasks.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/projects/:id/context',
        name: 'projects.context',
        component: () => import('@/pages/projects/Context.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/projects/:id/locks',
        name: 'projects.locks',
        component: () => import('@/pages/projects/Locks.vue'),
        meta: { requiresAuth: true },
    },

    // Global Tasks View
    {
        path: '/tasks',
        name: 'tasks',
        component: () => import('@/pages/tasks/Index.vue'),
        meta: { requiresAuth: true },
    },

    // Skills Routes
    {
        path: '/skills',
        name: 'skills',
        component: () => import('@/pages/skills/Index.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/skills/:id',
        name: 'skill.detail',
        component: () => import('@/pages/skills/Show.vue'),
        meta: { requiresAuth: true },
    },

    // MCP Routes
    {
        path: '/mcp',
        name: 'mcp',
        component: () => import('@/pages/mcp/Index.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/mcp/tools',
        name: 'mcp.tools',
        component: () => import('@/pages/mcp/Tools.vue'),
        meta: { requiresAuth: true },
    },

    // Commands Routes
    {
        path: '/commands',
        name: 'commands',
        component: () => import('@/pages/commands/Index.vue'),
        meta: { requiresAuth: true },
    },

    // Settings
    {
        path: '/settings',
        name: 'settings',
        component: () => import('@/pages/Settings.vue'),
        meta: { requiresAuth: true },
    },

    // Catch-all redirect
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
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
