<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-skin-primary">{{ t('settings.title') }}</h1>
      <p class="text-skin-secondary mt-1">{{ t('settings.subtitle') }}</p>
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
        <Card v-if="activeSection === 'profile'" :title="t('settings.profileSettings')">
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
                  {{ isUploadingAvatar ? t('settings.uploading') : t('settings.changeAvatar') }}
                </Button>
                <p class="text-xs text-skin-secondary mt-2">{{ t('settings.avatarHint') }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                v-model="profile.name"
                :label="t('settings.fullName')"
                :placeholder="t('settings.fullNamePlaceholder')"
              />
              <Input
                v-model="profile.email"
                :label="t('settings.emailAddress')"
                type="email"
                :placeholder="t('settings.emailPlaceholder')"
              />
            </div>

            <div class="pt-4 border-t border-skin">
              <Button :disabled="isSavingProfile" @click="saveProfile">
                {{ isSavingProfile ? t('settings.saving') : t('settings.saveChanges') }}
              </Button>
            </div>
          </div>
        </Card>

        <!-- Security Section -->
        <Card v-if="activeSection === 'security'" :title="t('settings.security')">
          <div class="space-y-6">
            <div>
              <h4 class="text-sm font-medium text-skin-primary mb-4">{{ t('settings.changePassword') }}</h4>
              <div class="space-y-4">
                <Input
                  v-model="password.current"
                  type="password"
                  :label="t('settings.currentPassword')"
                  :placeholder="t('settings.currentPasswordPlaceholder')"
                />
                <Input
                  v-model="password.new"
                  type="password"
                  :label="t('settings.newPassword')"
                  :placeholder="t('settings.newPasswordPlaceholder')"
                />
                <Input
                  v-model="password.confirm"
                  type="password"
                  :label="t('settings.confirmNewPassword')"
                  :placeholder="t('settings.confirmNewPasswordPlaceholder')"
                />
              </div>
              <Button class="mt-4" :disabled="isChangingPassword" @click="changePassword">
                {{ t('settings.updatePassword') }}
              </Button>
            </div>
          </div>
        </Card>

        <!-- Appearance Section -->
        <Card v-if="activeSection === 'appearance'" :title="t('settings.appearance')">
          <div class="space-y-6">
            <div>
              <h4 class="text-sm font-medium text-skin-primary mb-4">{{ t('settings.theme') }}</h4>
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
                  <span class="text-sm text-skin-primary">{{ t('settings.themeDark') }}</span>
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
                  <span class="text-sm text-skin-primary">{{ t('settings.themeLight') }}</span>
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
                  <span class="text-sm text-skin-primary">{{ t('settings.themeSystem') }}</span>
                </button>
              </div>
            </div>

            <div class="pt-6 border-t border-skin">
              <h4 class="text-sm font-medium text-skin-primary mb-4">{{ t('settings.sidebar') }}</h4>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="sidebarCollapsed"
                  type="checkbox"
                  class="w-4 h-4 rounded border-skin bg-surface-3 text-brand-purple focus:ring-brand-purple"
                >
                <span class="text-sm text-skin-secondary">{{ t('settings.collapsedSidebar') }}</span>
              </label>
            </div>
          </div>
        </Card>

        <!-- Notifications Section -->
        <Card v-if="activeSection === 'notifications'" :title="t('settings.notifications')">
          <div class="space-y-4">
            <div
              v-for="setting in notificationSettings"
              :key="setting.id"
              class="flex items-center justify-between py-3 border-b border-skin last:border-0"
            >
              <div>
                <p class="text-sm font-medium text-skin-primary">{{ t(setting.nameKey) }}</p>
                <p class="text-xs text-skin-secondary">{{ t(setting.descriptionKey) }}</p>
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
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();
const toast = useToast();
const authStore = useAuthStore();

const activeSection = ref('profile');
const theme = ref('dark');
const sidebarCollapsed = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);
const isUploadingAvatar = ref(false);
const isSavingProfile = ref(false);
const isChangingPassword = ref(false);

const sections = computed(() => [
  { id: 'profile', name: t('settings.sectionProfile'), icon: UserCircleIcon },
  { id: 'security', name: t('settings.sectionSecurity'), icon: ShieldCheckIcon },
  { id: 'appearance', name: t('settings.sectionAppearance'), icon: PaintBrushIcon },
  { id: 'notifications', name: t('settings.sectionNotifications'), icon: BellIcon },
]);

const profile = ref({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
});

const password = ref({
  current: '',
  new: '',
  confirm: '',
});

const notificationSettings = ref([
  { id: 'email_sessions', nameKey: 'settings.notifSessionsName', descriptionKey: 'settings.notifSessionsDescription', enabled: true },
  { id: 'email_tasks', nameKey: 'settings.notifTasksName', descriptionKey: 'settings.notifTasksDescription', enabled: true },
  { id: 'email_machines', nameKey: 'settings.notifMachinesName', descriptionKey: 'settings.notifMachinesDescription', enabled: false },
  { id: 'browser', nameKey: 'settings.notifBrowserName', descriptionKey: 'settings.notifBrowserDescription', enabled: true },
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
    toast.error(t('settings.toastFileTooLargeTitle'), t('settings.toastFileTooLargeBody'));
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
    toast.success(t('settings.toastAvatarUpdatedTitle'), t('settings.toastAvatarUpdatedBody'));
  } catch {
    toast.error(t('settings.toastUploadFailedTitle'), t('settings.toastUploadFailedBody'));
  } finally {
    isUploadingAvatar.value = false;
    if (avatarInput.value) avatarInput.value.value = '';
  }
};

const setTheme = (newTheme: string) => {
  theme.value = newTheme;
  toast.success(t('settings.toastThemeUpdatedTitle'), t('settings.toastThemeUpdatedBody', { theme: newTheme }));
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
    toast.success(t('settings.toastProfileUpdatedTitle'), t('settings.toastProfileUpdatedBody'));
  } catch {
    toast.error(t('settings.toastErrorTitle'), t('settings.toastProfileErrorBody'));
  } finally {
    isSavingProfile.value = false;
  }
};

const changePassword = async () => {
  if (password.value.new !== password.value.confirm) {
    toast.error(t('settings.toastErrorTitle'), t('settings.toastPasswordMismatchBody'));
    return;
  }
  isChangingPassword.value = true;
  try {
    await api.patch('/auth/password', {
      current_password: password.value.current,
      password: password.value.new,
      password_confirmation: password.value.confirm,
    });
    toast.success(t('settings.toastPasswordUpdatedTitle'), t('settings.toastPasswordUpdatedBody'));
    password.value = { current: '', new: '', confirm: '' };
  } catch (err: unknown) {
    const detail =
      (err as { response?: { data?: { errors?: Record<string, string[]> } } })
        ?.response?.data?.errors;
    const firstError = detail ? Object.values(detail)[0]?.[0] : undefined;
    toast.error(t('settings.toastErrorTitle'), firstError || t('settings.toastPasswordErrorBody'));
  } finally {
    isChangingPassword.value = false;
  }
};
</script>
