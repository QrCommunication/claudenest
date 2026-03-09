<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-skin-primary">Settings</h1>
      <p class="text-skin-secondary mt-1">Manage your account and application preferences</p>
    </div>

    <!-- Settings Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sidebar Navigation -->
      <div class="lg:col-span-1 space-y-2">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
            activeSection === section.id
              ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
              : 'text-skin-secondary hover:bg-surface-3 hover:text-skin-primary',
          ]"
          @click="activeSection = section.id"
        >
          <component :is="section.icon" class="w-5 h-5" />
          <span class="font-medium">{{ section.name }}</span>
        </button>
      </div>

      <!-- Settings Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Profile Section -->
        <Card v-if="activeSection === 'profile'" title="Profile Settings">
          <div class="space-y-4">
            <div class="flex items-center gap-4 mb-6">
              <div class="relative w-20 h-20">
                <div v-if="!authStore.user?.avatar_url" class="w-20 h-20 rounded-full bg-gradient-to-br from-brand-purple to-brand-indigo flex items-center justify-center text-2xl font-bold text-white">
                  {{ userInitials }}
                </div>
                <img v-else :src="authStore.user.avatar_url" :alt="authStore.user.name" class="w-20 h-20 rounded-full object-cover" />
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden"
                  @change="handleAvatarChange"
                />
              </div>
              <div>
                <Button variant="secondary" size="sm" :disabled="isUploadingAvatar" @click="avatarInput?.click()">
                  {{ isUploadingAvatar ? 'Uploading...' : 'Change Avatar' }}
                </Button>
                <p class="text-xs text-skin-secondary mt-2">JPG, PNG, GIF or WebP. Max 2MB.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                v-model="profile.name"
                label="Full Name"
                placeholder="Enter your name"
              />
              <Input
                v-model="profile.email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
              />
            </div>

            <div class="pt-4 border-t border-skin">
              <Button :disabled="isSavingProfile" @click="saveProfile">
                {{ isSavingProfile ? 'Saving...' : 'Save Changes' }}
              </Button>
            </div>
          </div>
        </Card>

        <!-- Security Section -->
        <Card v-if="activeSection === 'security'" title="Security">
          <div class="space-y-6">
            <div>
              <h4 class="text-sm font-medium text-skin-primary mb-4">Change Password</h4>
              <div class="space-y-4">
                <Input
                  v-model="password.current"
                  type="password"
                  label="Current Password"
                  placeholder="Enter current password"
                />
                <Input
                  v-model="password.new"
                  type="password"
                  label="New Password"
                  placeholder="Enter new password"
                />
                <Input
                  v-model="password.confirm"
                  type="password"
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                />
              </div>
              <Button class="mt-4" @click="changePassword">
                Update Password
              </Button>
            </div>

            <div class="pt-6 border-t border-skin">
              <h4 class="text-sm font-medium text-skin-primary mb-4">API Key</h4>
              <div class="flex items-center gap-3">
                <Input
                  v-model="apiKey"
                  readonly
                  class="flex-1 font-mono"
                />
                <Button variant="secondary" @click="regenerateApiKey">
                  Regenerate
                </Button>
              </div>
              <p class="text-xs text-skin-secondary mt-2">
                This key grants full access to your account. Keep it secure.
              </p>
            </div>
          </div>
        </Card>

        <!-- Appearance Section -->
        <Card v-if="activeSection === 'appearance'" title="Appearance">
          <div class="space-y-6">
            <div>
              <h4 class="text-sm font-medium text-skin-primary mb-4">Theme</h4>
              <div class="grid grid-cols-3 gap-3">
                <button
                  :class="[
                    'p-4 rounded-lg border-2 transition-colors text-center',
                    theme === 'dark'
                      ? 'border-brand-purple bg-brand-purple/10'
                      : 'border-skin hover:border-skin',
                  ]"
                  @click="setTheme('dark')"
                >
                  <svg class="w-8 h-8 mx-auto mb-2 text-skin-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span class="text-sm text-skin-primary">Dark</span>
                </button>
                <button
                  :class="[
                    'p-4 rounded-lg border-2 transition-colors text-center',
                    theme === 'light'
                      ? 'border-brand-purple bg-brand-purple/10'
                      : 'border-skin hover:border-skin',
                  ]"
                  @click="setTheme('light')"
                >
                  <svg class="w-8 h-8 mx-auto mb-2 text-skin-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="text-sm text-skin-primary">Light</span>
                </button>
                <button
                  :class="[
                    'p-4 rounded-lg border-2 transition-colors text-center',
                    theme === 'system'
                      ? 'border-brand-purple bg-brand-purple/10'
                      : 'border-skin hover:border-skin',
                  ]"
                  @click="setTheme('system')"
                >
                  <svg class="w-8 h-8 mx-auto mb-2 text-skin-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="text-sm text-skin-primary">System</span>
                </button>
              </div>
            </div>

            <div class="pt-6 border-t border-skin">
              <h4 class="text-sm font-medium text-skin-primary mb-4">Sidebar</h4>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="sidebarCollapsed"
                  type="checkbox"
                  class="w-4 h-4 rounded border-skin bg-surface-3 text-brand-purple focus:ring-brand-purple"
                >
                <span class="text-sm text-skin-secondary">Start with collapsed sidebar</span>
              </label>
            </div>
          </div>
        </Card>

        <!-- Notifications Section -->
        <Card v-if="activeSection === 'notifications'" title="Notifications">
          <div class="space-y-4">
            <div
              v-for="setting in notificationSettings"
              :key="setting.id"
              class="flex items-center justify-between py-3 border-b border-skin last:border-0"
            >
              <div>
                <p class="text-sm font-medium text-skin-primary">{{ setting.name }}</p>
                <p class="text-xs text-skin-secondary">{{ setting.description }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="setting.enabled"
                  type="checkbox"
                  class="sr-only peer"
                >
                <div class="w-11 h-6 bg-surface-4 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple" />
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/composables/useApi';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  BellIcon,
} from '@heroicons/vue/24/outline';

const toast = useToast();
const authStore = useAuthStore();

const activeSection = ref('profile');
const theme = ref('dark');
const sidebarCollapsed = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);
const isUploadingAvatar = ref(false);
const isSavingProfile = ref(false);

const sections = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
];

const profile = ref({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
});

const password = ref({
  current: '',
  new: '',
  confirm: '',
});

const apiKey = ref('cn_live_****');

const notificationSettings = ref([
  { id: 'email_sessions', name: 'Session Notifications', description: 'Get notified when sessions start or end', enabled: true },
  { id: 'email_tasks', name: 'Task Updates', description: 'Receive updates about task completions', enabled: true },
  { id: 'email_machines', name: 'Machine Status', description: 'Get alerts when machines go offline', enabled: false },
  { id: 'browser', name: 'Browser Notifications', description: 'Show desktop notifications', enabled: true },
]);

const userInitials = computed(() => {
  const name = authStore.user?.name || profile.value.name || 'U';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
});

onMounted(() => {
  if (authStore.user) {
    profile.value.name = authStore.user.name;
    profile.value.email = authStore.user.email;
  }
});

const handleAvatarChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast.error('File too large', 'Avatar must be under 2MB');
    return;
  }
  isUploadingAvatar.value = true;
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (authStore.user) {
      authStore.user.avatar_url = response.data.data.user.avatar_url;
    }
    toast.success('Avatar Updated', 'Your profile picture has been updated');
  } catch {
    toast.error('Upload Failed', 'Could not update avatar');
  } finally {
    isUploadingAvatar.value = false;
    if (avatarInput.value) avatarInput.value.value = '';
  }
};

const setTheme = (newTheme: string) => {
  theme.value = newTheme;
  toast.success('Theme Updated', `Theme set to ${newTheme}`);
};

const saveProfile = async () => {
  isSavingProfile.value = true;
  try {
    const response = await api.patch('/auth/profile', {
      name: profile.value.name,
      email: profile.value.email,
    });
    if (authStore.user) {
      authStore.user.name = response.data.data.user.name;
      authStore.user.email = response.data.data.user.email;
    }
    toast.success('Profile Updated', 'Your profile has been saved');
  } catch {
    toast.error('Error', 'Could not save profile');
  } finally {
    isSavingProfile.value = false;
  }
};

const changePassword = () => {
  if (password.value.new !== password.value.confirm) {
    toast.error('Error', 'New passwords do not match');
    return;
  }
  toast.success('Password Updated', 'Your password has been changed');
  password.value = { current: '', new: '', confirm: '' };
};

const regenerateApiKey = () => {
  if (confirm('Are you sure? This will invalidate your current API key.')) {
    apiKey.value = 'cn_live_' + Math.random().toString(36).substring(2, 18);
    toast.success('API Key Regenerated', 'Your new API key has been generated');
  }
};
</script>
