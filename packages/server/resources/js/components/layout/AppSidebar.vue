<template>
  <aside :class="['app-sidebar', collapsed ? 'collapsed' : 'expanded']">
    <!-- Logo Section -->
    <div class="sidebar-header">
      <button class="logo-section" @click="navigateToDashboard">
        <svg class="logo-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: var(--accent-purple)" />
              <stop offset="100%" style="stop-color: var(--accent-indigo)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="512" height="512" rx="96" :fill="isDark ? '#1a1b26' : '#f8fafc'" />
          <g transform="translate(256, 256)">
            <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round" />
            <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round" />
            <circle cx="-35" cy="0" r="18" :fill="isDark ? '#22d3ee' : '#0891b2'" />
            <circle cx="0" cy="0" r="18" fill="url(#nestGrad)" />
            <circle cx="35" cy="0" r="18" :fill="isDark ? '#22d3ee' : '#0891b2'" />
          </g>
        </svg>
        <span v-if="!collapsed" class="logo-text gradient-text">ClaudeNest</span>
      </button>

      <!-- Collapse Button (Desktop) -->
      <button v-if="!collapsed" class="collapse-btn" @click="$emit('toggle')">
        <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <template v-for="group in navGroups" :key="group.label || group.items[0]?.path || 'group'">
        <!-- Group Label -->
        <div v-if="group.label" :class="['nav-group-label', { 'nav-group-label--hidden': collapsed }]">
          <span v-if="!collapsed">{{ group.label }}</span>
          <span v-else class="nav-group-divider" />
        </div>

        <!-- Collapsible Projects submenu (Multi-Agent group) -->
        <template v-if="group.projectsSubmenu">
          <div class="nav-collapsible-row">
            <router-link
              to="/projects"
              :class="['nav-item', 'nav-item--collapsible', { active: isActive('/projects') }]"
              :title="collapsed ? t('layoutAppsidebar.projects') : ''"
            >
              <FolderIcon class="nav-icon" />
              <span v-if="!collapsed" class="nav-label">{{ t('layoutAppsidebar.projects') }}</span>
              <span v-if="!collapsed && projectCount > 0" class="nav-count">{{ projectCount }}</span>
              <div v-if="isActive('/projects')" class="active-indicator" />
            </router-link>
            <button
              v-if="!collapsed"
              type="button"
              class="nav-chevron-btn"
              :aria-expanded="projectsExpanded"
              :aria-label="t('layoutAppsidebar.projects')"
              @click="toggleProjects"
            >
              <ChevronDownIcon :class="['chevron', { 'chevron--open': projectsExpanded }]" />
            </button>
          </div>

          <template v-if="projectsExpanded && !collapsed">
            <div
              v-for="project in sidebarProjects"
              :key="project.id"
              class="nav-project-row"
            >
              <router-link
                :to="`/projects/${project.id}`"
                :class="['nav-subitem', 'nav-subitem--project', { active: isProjectPathActive(project.id) }]"
                :title="project.name"
              >
                {{ project.name }}
              </router-link>
              <ProjectArchiveMenu
                :project-id="project.id"
                :project-name="project.name"
                :archived="false"
                @archive="handleArchive"
              />
            </div>
          </template>

          <!-- Archived section: secondary flow, collapsed by default, only shown
               when there is at least one archived project. -->
          <template v-if="!collapsed && archivedProjects.length > 0">
            <button
              type="button"
              class="nav-item nav-item--collapsible nav-archived-header"
              :aria-expanded="archivedExpanded"
              @click="toggleArchived"
            >
              <ArchiveBoxIcon class="nav-icon" />
              <span class="nav-label">{{ t('layoutAppsidebar.archived') }}</span>
              <span class="nav-count">{{ archivedProjects.length }}</span>
              <ChevronDownIcon :class="['chevron', 'chevron--trailing', { 'chevron--open': archivedExpanded }]" />
            </button>

            <template v-if="archivedExpanded">
              <div
                v-for="project in archivedProjects"
                :key="project.id"
                class="nav-project-row"
              >
                <router-link
                  :to="`/projects/${project.id}`"
                  :class="['nav-subitem', 'nav-subitem--project', 'nav-subitem--archived', { active: isProjectPathActive(project.id) }]"
                  :title="project.name"
                >
                  {{ project.name }}
                </router-link>
                <ProjectArchiveMenu
                  :project-id="project.id"
                  :project-name="project.name"
                  :archived="true"
                  @unarchive="handleUnarchive"
                />
              </div>
            </template>
          </template>
        </template>

        <!-- Group Items -->
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
          :title="collapsed ? item.name : ''"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-if="!collapsed" class="nav-label">{{ item.name }}</span>
          <div v-if="isActive(item.path)" class="active-indicator" />
        </router-link>

        <!-- Pinned last project (Multi-Agent group) -->
        <template v-if="group.pinnedProject && lastProject">
          <router-link
            :to="`/projects/${lastProject.id}`"
            :class="['nav-item', 'nav-item--pinned', { active: isProjectActive('') }]"
            :title="collapsed ? lastProject.name : ''"
          >
            <BookmarkIcon class="nav-icon" />
            <span v-if="!collapsed" class="nav-label">{{ lastProject.name }}</span>
          </router-link>
          <template v-if="!collapsed">
            <router-link
              :to="`/projects/${lastProject.id}/workspace`"
              :class="['nav-subitem', { active: isProjectActive('/workspace') }]"
            >
              {{ t('layoutAppsidebar.workspace') }}
            </router-link>
            <router-link
              :to="`/projects/${lastProject.id}/tasks`"
              :class="['nav-subitem', { active: isProjectActive('/tasks') }]"
            >
              {{ t('layoutAppsidebar.board') }}
            </router-link>
          </template>
        </template>
      </template>
    </nav>

    <!-- Expand Button (Collapsed State) -->
    <div v-if="collapsed" class="sidebar-footer">
      <button class="expand-btn" @click="$emit('toggle')" :title="t('layoutAppsidebar.expandSidebar')">
        <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from '@/composables/useTheme';
import { useLastProject } from '@/composables/useLastProject';
import { useProjectsStore } from '@/stores/projects';
import { useToast } from '@/composables/useToast';
import ProjectArchiveMenu from '@/components/projects/ProjectArchiveMenu.vue';
import {
  HomeIcon,
  CommandLineIcon,
  ServerIcon,
  FolderIcon,
  CheckCircleIcon,
  KeyIcon,
  SparklesIcon,
  CubeIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
  EyeIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ArchiveBoxIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  collapsed?: boolean;
}

withDefaults(defineProps<Props>(), {
  collapsed: false,
});

defineEmits<{
  toggle: [];
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { isDark } = useTheme();
const { lastProject } = useLastProject();
const projectsStore = useProjectsStore();

// ==================== COLLAPSIBLE PROJECTS SUBMENU ====================

const PROJECTS_OPEN_KEY = 'claudenest-sidebar-projects-open';

/** Read the persisted expand state (defaults to open on first visit). */
function readProjectsOpen(): boolean {
  try {
    const stored = localStorage.getItem(PROJECTS_OPEN_KEY);
    return stored === null ? true : stored === '1';
  } catch {
    return true;
  }
}

const projectsExpanded = ref<boolean>(readProjectsOpen());

function toggleProjects(): void {
  projectsExpanded.value = !projectsExpanded.value;
  try {
    localStorage.setItem(PROJECTS_OPEN_KEY, projectsExpanded.value ? '1' : '0');
  } catch {
    // localStorage unavailable (private mode) — keep the in-memory state.
  }
}

// Projects currently loaded in the store (populated by the projects/machine
// views). The submenu reflects this list; the count badge shows its size.
const sidebarProjects = computed(() => projectsStore.projects);
const projectCount = computed(() => sidebarProjects.value.length);

/** Active state for an individual project link in the submenu. */
const isProjectPathActive = (projectId: string): boolean =>
  route.path.startsWith(`/projects/${projectId}`);

// ==================== ARCHIVED PROJECTS SECTION ====================

const ARCHIVED_OPEN_KEY = 'claudenest-sidebar-archived-open';

function readArchivedOpen(): boolean {
  try {
    // Archived section defaults to COLLAPSED (it is a secondary flow).
    return localStorage.getItem(ARCHIVED_OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

const archivedExpanded = ref<boolean>(readArchivedOpen());

function toggleArchived(): void {
  archivedExpanded.value = !archivedExpanded.value;
  try {
    localStorage.setItem(ARCHIVED_OPEN_KEY, archivedExpanded.value ? '1' : '0');
  } catch {
    // localStorage unavailable — keep the in-memory state.
  }
}

const archivedProjects = computed(() => projectsStore.archivedProjects);

const { success: toastSuccess, error: toastError } = useToast();

/** Archive an active project (moves it to the Archivés section, deletes nothing). */
async function handleArchive(projectId: string): Promise<void> {
  try {
    await projectsStore.archiveProject(projectId);
    toastSuccess(t('layoutAppsidebar.archiveSuccess'));
  } catch {
    toastError(t('layoutAppsidebar.archiveError'));
  }
}

/** Restore an archived project (moves it back to the active flow). */
async function handleUnarchive(projectId: string): Promise<void> {
  try {
    await projectsStore.unarchiveProject(projectId);
    toastSuccess(t('layoutAppsidebar.unarchiveSuccess'));
  } catch {
    toastError(t('layoutAppsidebar.unarchiveError'));
  }
}

interface NavItem {
  name: string;
  path: string;
  icon: Component;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  /** Render the pinned last-project entry (Workspace/Board) under this group. */
  pinnedProject?: boolean;
  /** Render the collapsible Projects submenu (full project list) above items. */
  projectsSubmenu?: boolean;
}

// Built inside a computed so t() is re-evaluated whenever the locale changes.
// Calling t() in a plain top-level const snapshots the current language for the
// component's lifetime, which is why the menu never updated on language switch.
const navGroups = computed<NavGroup[]>(() => [
  {
    label: '',
    items: [
      { name: t('layoutAppsidebar.dashboard'), path: '/dashboard', icon: HomeIcon },
    ],
  },
  {
    label: t('layoutAppsidebar.infrastructure'),
    items: [
      { name: t('layoutAppsidebar.machines'), path: '/machines', icon: ServerIcon },
      { name: t('layoutAppsidebar.sessions'), path: '/sessions', icon: CommandLineIcon },
      { name: t('layoutAppsidebar.claudeSessions'), path: '/claude-sessions', icon: EyeIcon },
    ],
  },
  {
    label: t('layoutAppsidebar.multiAgent'),
    // Projects are rendered as a collapsible submenu (projectsSubmenu) above the
    // items; only Tasks remains a flat link here.
    items: [
      { name: t('layoutAppsidebar.tasks'), path: '/tasks', icon: CheckCircleIcon },
    ],
    projectsSubmenu: true,
    pinnedProject: true,
  },
  {
    label: t('layoutAppsidebar.configuration'),
    items: [
      { name: t('layoutAppsidebar.credentials'), path: '/credentials', icon: KeyIcon },
      { name: t('layoutAppsidebar.skills'), path: '/skills', icon: SparklesIcon },
      { name: t('layoutAppsidebar.mcp'), path: '/mcp', icon: CubeIcon },
      { name: t('layoutAppsidebar.commands'), path: '/commands', icon: Squares2X2Icon },
    ],
  },
  {
    label: '',
    items: [
      { name: t('layoutAppsidebar.settings'), path: '/settings', icon: Cog6ToothIcon },
    ],
  },
]);

const isActive = (path: string) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard';
  }
  return route.path.startsWith(path);
};

/** Active state of the pinned project entry / its sub-links. */
const isProjectActive = (suffix: string): boolean => {
  if (!lastProject.value) return false;
  const base = `/projects/${lastProject.value.id}`;
  if (suffix === '') {
    return route.path === base;
  }
  return route.path.startsWith(base + suffix);
};

const navigateToDashboard = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s ease;
  position: relative;
  z-index: 50;
}

.app-sidebar.expanded {
  width: 240px;
}

.app-sidebar.collapsed {
  width: 48px;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  overflow: hidden;
  flex: 1;
}

.logo-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.collapse-btn,
.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-btn:hover,
.expand-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.icon {
  width: 18px;
  height: 18px;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}

/* Group labels */
.nav-group-label {
  padding: 16px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
}

.nav-group-label--hidden {
  padding: 8px 4px;
  display: flex;
  justify-content: center;
}

.nav-group-divider {
  display: block;
  width: 16px;
  height: 1px;
  background-color: var(--border-color);
}

/* First group (Dashboard) has no top padding */
.nav-group-label:first-child {
  padding-top: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 2px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 10px 0;
}

.nav-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--accent-purple, #a855f7);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.collapsed .nav-label {
  display: none;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: var(--accent-purple);
  border-radius: 0 2px 2px 0;
}

/* Collapsible Projects submenu */
.nav-collapsible-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-collapsible-row .nav-item--collapsible {
  flex: 1;
  min-width: 0;
}

.nav-count {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  border-radius: 9px;
  color: var(--accent-purple, #a855f7);
  background-color: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
}

.nav-chevron-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-chevron-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.chevron {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.chevron--trailing {
  margin-left: 4px;
}

.chevron--open {
  transform: rotate(180deg);
}

/* Project rows (link + contextual archive menu) */
.nav-project-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-project-row .nav-subitem--project {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
}

.nav-project-row .archive-menu {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.nav-project-row:hover .archive-menu,
.nav-project-row:focus-within .archive-menu {
  opacity: 1;
}

/* Archived section header (button styled like a collapsible nav item) */
.nav-archived-header {
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  font: inherit;
  margin-top: 4px;
}

.nav-subitem--archived {
  color: var(--text-muted);
  font-style: italic;
}

/* Pinned last project + its quick links */
.nav-item--pinned .nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.nav-subitem {
  display: block;
  padding: 6px 12px 6px 44px;
  margin-bottom: 2px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.nav-subitem:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-subitem.active {
  color: var(--accent-purple, #a855f7);
  background-color: color-mix(in srgb, var(--accent-purple, #a855f7) 8%, transparent);
}

/* Footer */
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--border-color);
}

.expand-btn {
  width: 100%;
}

/* Scrollbar */
.sidebar-nav {
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background-color: var(--border-hover);
}

/* Mobile */
@media (max-width: 1024px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
  }
}
</style>
