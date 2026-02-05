<template>
  <div class="min-h-screen bg-dark-1 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <Logo variant="icon" size="xl" class="mx-auto mb-4" />
        <h1 class="text-2xl font-bold gradient-text">{{ $t('auth.sign_up') }}</h1>
        <p class="text-dark-4 mt-2">{{ $t('auth.sign_up_description') }}</p>
      </div>

      <!-- Register Form -->
      <Card>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="authStore.authError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {{ authStore.authError }}
          </div>

          <Input
            v-model="form.name"
            :label="$t('settings.profile.name')"
            type="text"
            placeholder="John Doe"
            required
            autocomplete="name"
            :error="getFieldError('name')"
          >
            <template #left-icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </template>
          </Input>

          <Input
            v-model="form.email"
            :label="$t('auth.email')"
            type="email"
            :placeholder="$t('auth.email_placeholder')"
            required
            autocomplete="email"
            :error="getFieldError('email')"
          >
            <template #left-icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </template>
          </Input>

          <Input
            v-model="form.password"
            :label="$t('auth.password')"
            type="password"
            :placeholder="$t('auth.password_placeholder')"
            required
            autocomplete="new-password"
            :error="getFieldError('password')"
          >
            <template #left-icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </template>
          </Input>

          <Input
            v-model="form.password_confirmation"
            :label="$t('auth.password_confirm')"
            type="password"
            :placeholder="$t('auth.password_placeholder')"
            required
            autocomplete="new-password"
            :error="getFieldError('password_confirmation')"
          >
            <template #left-icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </template>
          </Input>

          <label class="flex items-start gap-2 cursor-pointer">
            <input
              v-model="form.agreeTerms"
              type="checkbox"
              required
              class="mt-1 w-4 h-4 rounded border-dark-4 bg-dark-3 text-brand-purple focus:ring-brand-purple"
            />
            <span class="text-sm text-dark-4">
              {{ $t('auth.terms_agreement') }}
              <router-link to="/docs/terms" class="text-brand-purple hover:text-brand-cyan transition-colors">
                {{ $t('auth.terms_of_service') }}
              </router-link>
              &amp;
              <router-link to="/docs/privacy" class="text-brand-purple hover:text-brand-cyan transition-colors">
                {{ $t('auth.privacy_policy') }}
              </router-link>
            </span>
          </label>

          <Button
            type="submit"
            block
            :loading="authStore.isLoading"
            :disabled="!form.agreeTerms"
          >
            {{ $t('auth.sign_up_button') }}
          </Button>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-dark-4" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-dark-2 text-dark-4">{{ $t('auth.or_continue_with') }}</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <Button variant="secondary" @click="registerWithOAuth('google')">
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button variant="secondary" @click="registerWithOAuth('github')">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </Button>
          </div>
        </div>
      </Card>

      <p class="text-center mt-6 text-sm text-dark-4">
        {{ $t('auth.have_account') }}
        <router-link to="/login" class="text-brand-purple hover:text-brand-cyan transition-colors font-medium">
          {{ $t('auth.sign_in_button') }}
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Card from '@/components/common/Card.vue';
import Logo from '@/components/common/Logo.vue';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  agreeTerms: boolean;
}

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const form = reactive<RegisterForm>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  agreeTerms: false,
});

function getFieldError(field: string): string | undefined {
  const errors = authStore.fieldErrors[field];
  return errors?.[0];
}

async function handleSubmit(): Promise<void> {
  authStore.clearErrors();

  const success = await authStore.register({
    name: form.name,
    email: form.email,
    password: form.password,
    password_confirmation: form.password_confirmation,
  });

  if (success) {
    router.push('/dashboard');
  }
}

function registerWithOAuth(provider: 'google' | 'github'): void {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  const popup = window.open(
    `/api/auth/${provider}/redirect`,
    'OAuth',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'oauth-success' && event.data.token) {
      localStorage.setItem('auth_token', event.data.token);
      authStore.fetchUser().then(() => {
        router.push('/dashboard');
      });
    }
    popup?.close();
  }, { once: true });
}

onMounted(() => {
  authStore.clearErrors();
});
</script>
