<template>
  <div class="status-bar">
    <!-- Left Section -->
    <div class="status-section left">
      <!-- Credential Status -->
      <div class="status-item" title="Active Credential">
        <KeyIcon class="status-icon" />
        <span class="status-text">{{ activeCredentialName || 'No credential' }}</span>
      </div>

      <!-- Machine Status -->
      <div class="status-item" title="Connected Machine">
        <ServerIcon class="status-icon" />
        <span class="status-text">{{ connectedMachine || 'No machine' }}</span>
        <span
          :class="['status-dot', machineStatus]"
          :title="machineStatus === 'online' ? 'Online' : 'Offline'"
        />
      </div>

      <!-- Session Count -->
      <div class="status-item" title="Active Sessions">
        <CommandLineIcon class="status-icon" />
        <span class="status-text">{{ sessionCount }} session{{ sessionCount !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Right Section -->
    <div class="status-section right">
      <!-- Language Toggle -->
      <button class="status-btn" @click="toggleLanguage" title="Change Language">
        <span class="status-text">{{ currentLanguage }}</span>
      </button>

      <!-- Theme Toggle -->
      <button class="status-btn" @click="handleToggleTheme" :title="themeTooltip">
        <component :is="themeIcon" class="status-icon" />
      </button>

      <!-- Settings Link -->
      <button class="status-btn" @click="navigateToSettings" title="Settings">
        <Cog6ToothIcon class="status-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/composables/useTheme';
import { useMachinesStore } from '@/stores/machines';
import { useCredentialsStore } from '@/stores/credentials';
import { setLocale, type SupportedLocale } from '@/i18n';
import {
  KeyIcon,
  ServerIcon,
  CommandLineIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const { theme, toggleTheme } = useTheme();
const { locale } = useI18n();
const machinesStore = useMachinesStore();
const credentialsStore = useCredentialsStore();

// Real data from stores
const activeCredentialName = computed(() => credentialsStore.defaultCredential?.name ?? null);
const connectedMachine = computed(() => machinesStore.machines[0]?.name ?? null);
const machineStatus = computed<'online' | 'offline'>(() =>
  machinesStore.onlineMachines.length > 0 ? 'online' : 'offline'
);
const sessionCount = computed(() => machinesStore.totalActiveSessions);
const currentLanguage = computed(() => (locale.value as string).toUpperCase());

onMounted(async () => {
  if (machinesStore.machines.length === 0) {
    machinesStore.fetchMachines().catch(() => {});
  }
  if (credentialsStore.credentials.length === 0) {
    credentialsStore.fetchCredentials().catch(() => {});
  }
});

const themeIcon = computed(() => {
  if (theme.value === 'dark') return MoonIcon;
  if (theme.value === 'light') return SunIcon;
  return ComputerDesktopIcon;
});

const themeTooltip = computed(() => {
  if (theme.value === 'dark') return 'Dark Mode';
  if (theme.value === 'light') return 'Light Mode';
  return 'System Theme';
});

const handleToggleTheme = () => {
  toggleTheme();
};

const toggleLanguage = () => {
  const next: SupportedLocale = locale.value === 'en' ? 'fr' : 'en';
  setLocale(next);
};

const navigateToSettings = () => {
  router.push('/settings');
};
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 12px;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-section.left {
  flex: 1;
}

.status-section.right {
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.status-text {
  font-weight: 500;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.online {
  background-color: var(--status-success);
}

.status-dot.offline {
  background-color: var(--text-muted);
}

.status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.status-btn .status-icon {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .status-item .status-text {
    display: none;
  }
}
</style>
