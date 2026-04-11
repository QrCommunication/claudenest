<template>
  <AuthShell>
    <div class="auth-card">
      <div class="auth-heading">
        <h1 class="auth-title">{{ t('auth.welcome_back') }}</h1>
        <p class="auth-subtitle">{{ t('auth.sign_in') }}</p>
      </div>

      <div class="oauth-row">
        <button type="button" class="oauth-btn" @click="socialLogin('google')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.8 0-.7-.1-1.2-.2-1.7H12z" />
          </svg>
          <span>Google</span>
        </button>
        <button type="button" class="oauth-btn" @click="socialLogin('github')">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </button>
      </div>

      <div class="divider">
        <span class="divider-label">{{ t('auth.or_continue_with') }}</span>
      </div>

      <form class="auth-form" @submit.prevent="handleLogin" novalidate>
        <div class="field">
          <label for="login-email" class="field-label">{{ t('auth.email') }}</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            :placeholder="t('auth.email_placeholder')"
            class="field-input"
            :class="{ 'has-error': errors.email }"
            :disabled="isLoading"
          />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <div class="field">
          <label for="login-password" class="field-label">{{ t('auth.password') }}</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            :placeholder="t('auth.password_placeholder')"
            class="field-input"
            :class="{ 'has-error': errors.password }"
            :disabled="isLoading"
          />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <div class="form-row">
          <label class="remember">
            <input v-model="rememberMe" type="checkbox" />
            <span>{{ t('auth.remember_me') }}</span>
          </label>
          <router-link to="/forgot-password" class="form-link">{{ t('auth.forgot_password') }}</router-link>
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          <span v-if="!isLoading">
            {{ t('auth.sign_in_button') }}
          </span>
          <span v-else class="spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        </button>
      </form>

      <p class="auth-footer-text">
        {{ t('auth.no_account') }}
        <router-link to="/register" class="form-link">{{ t('auth.sign_up') }}</router-link>
      </p>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import AuthShell from '@/components/public/AuthShell.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const isLoading = ref(false);
const errors = ref<{ email?: string; password?: string }>({});

async function handleLogin(): Promise<void> {
  errors.value = {};

  if (!email.value) {
    errors.value.email = t('auth.email_required');
    return;
  }
  if (!password.value) {
    errors.value.password = t('auth.password_required');
    return;
  }

  isLoading.value = true;
  try {
    await authStore.login(email.value, password.value);
    toast.success(t('auth.welcome_back'), t('auth.login_success'));
    router.push('/dashboard');
  } catch {
    toast.error(t('common.error'), t('auth.login_failed'));
  } finally {
    isLoading.value = false;
  }
}

function socialLogin(provider: 'google' | 'github'): void {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    `/api/auth/${provider}/redirect`,
    'OAuth',
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  window.addEventListener(
    'message',
    (event: MessageEvent) => {
      if (event.data?.type === 'oauth-success' && event.data.token) {
        authStore.setToken(event.data.token);
        authStore.fetchUser().then(() => {
          router.push('/dashboard');
        });
      }
      popup?.close();
    },
    { once: true },
  );
}
</script>

<style scoped>
.auth-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-heading {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
}

.auth-title {
  font-size: clamp(1.6rem, 3vw, 2rem);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  padding-bottom: 0.1em;
}

.auth-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.oauth-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}

.oauth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.7rem 0.9rem;
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.65rem;
  transition: background 0.2s, border-color 0.2s, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.oauth-btn svg {
  width: 17px;
  height: 17px;
}

.oauth-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.oauth-btn:active { transform: translateY(0); }

.divider {
  position: relative;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-color);
}

.divider-label {
  position: relative;
  display: inline-block;
  padding: 0 0.75rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  background: var(--bg-primary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

.field-input {
  padding: 0.78rem 0.95rem;
  font-size: 0.92rem;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.65rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field-input::placeholder { color: var(--text-muted); }

.field-input:hover {
  border-color: var(--border-hover);
}

.field-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent-purple) 55%, var(--border-color));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-purple) 16%, transparent);
}

.field-input.has-error {
  border-color: var(--status-error);
}

.field-input.has-error:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-error) 16%, transparent);
}

.field-error {
  font-size: 0.76rem;
  color: var(--status-error);
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: -0.25rem;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.remember input {
  width: 15px;
  height: 15px;
  accent-color: var(--accent-purple);
}

.form-link {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-purple);
  transition: color 0.2s;
}

.form-link:hover { color: var(--accent-indigo); }

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 24px -10px rgba(168, 85, 247, 0.6);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 14px 30px -10px rgba(168, 85, 247, 0.7);
}

.btn-primary:active:not(:disabled) { transform: translateY(0); }

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner svg {
  width: 18px;
  height: 18px;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
}
</style>
