import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import DashboardLayout from './layouts/DashboardLayout.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/Landing.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('./pages/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('./pages/Dashboard.vue')
      },
      {
        path: 'machines',
        name: 'machines',
        component: () => import('./pages/machines/Index.vue')
      },
      {
        path: 'machines/:id',
        name: 'machine.show',
        component: () => import('./pages/machines/Show.vue')
      },
      {
        path: 'sessions',
        name: 'sessions',
        component: () => import('./pages/sessions/Index.vue')
      },
      {
        path: 'sessions/:id',
        name: 'session.terminal',
        component: () => import('./pages/sessions/Terminal.vue')
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('./pages/projects/Index.vue')
      },
      {
        path: 'projects/:id',
        name: 'project.show',
        component: () => import('./pages/projects/Show.vue')
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('./pages/tasks/Index.vue')
      },
      {
        path: 'skills',
        name: 'skills',
        component: () => import('./pages/skills/Index.vue')
      },
      {
        path: 'mcp',
        name: 'mcp',
        component: () => import('./pages/mcp/Index.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('./pages/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
