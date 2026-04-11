<template>
  <AuthShell>
    <div class="auth-card">
      <div class="auth-heading">
        <h1 class="auth-title">{{ t('auth.reset_password_title') }}</h1>
        <p class="auth-subtitle">{{ t('auth.reset_password_description') }}</p>
      </div>

      <div v-if="success" class="success-panel">
        <div class="success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 class="success-title">{{ t('auth.password_reset_success') }}</h2>
        <p class="success-text">{{ t('auth.welcome_back') }}</p>
        <button type="button" class="btn-primary" @click="goToLogin">{{ t('auth.sign_in_button') }}</button>
      </div>

      <form v-else class="auth-form" @submit.prevent="handleSubmit" novalidate>
        <div v-if="authStore.authError" class="alert alert-error">
          {{ authStore.authError }}
        </div>

        <div class="field">
          <label for="reset-email" class="field-label">{{ t('auth.email') }}</label>
          <input
            id="reset-email"
            v-model="form.email"
            type="email"
            disabled
            class="field-input is-locked"
          />
        </div>

        <div class="field">
          <label for="reset-password" class="field-label">{{ t('auth.new_password') }}</label>
          <input
            id="reset-password"
            v-model="form.password"
            type="password"
            required
            autocomplete="new-password"
            :placeholder="t('auth.password_placeholder')"
            class="field-input"
            :class="{ 'has-error': getFieldError('password') }"
            :disabled="authStore.isLoading"
          />
          <span v-if="getFieldError('password')" class="field-error">{{ getFieldError('password') }}</span>
        </div>

        <div class="field">
          <label for="reset-confirm" class="field-label">{{ t('auth.password_confirm') }}</label>
          <input
            id="reset-confirm"
            v-model="form.password_confirmation"
            type="password"
            required
            autocomplete="new-password"
            :placeholder="t('auth.password_placeholder')"
            class="field-input"
            :disabled="authStore.isLoading"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="authStore.isLoading">
          <span v-if="!authStore.isLoading">{{ t('auth.reset_password') }}</span>
          <span v-else class="spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        </button>

        <router-link to="/login" class="form-link back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          {{ t('auth.back_to_login') }}
        </router-link>
      </form>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AuthShell from '@/components/public/AuthShell.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

interface ResetForm {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

const form = reactive<ResetForm>({
  token: '',
  email: '',
  password: '',
  password_confirmation: '',
});

const success = ref(false);

function getFieldError(field: string): string | undefined {
  const errs = authStore.fieldErrors?.[field];
  return errs?.[0];
}

async function handleSubmit(): Promise<void> {
  authStore.clearErrors();
  const result = await authStore.resetPassword({
    token: form.token,
    email: form.email,
    password: form.password,
    password_confirmation: form.password_confirmation,
  });
  if (result.success) success.value = true;
}

function goToLogin(): void {
  router.push('/login');
}

onMounted(() => {
  authStore.clearErrors();
  const token = route.query.token as string;
  const email = route.query.email as string;
  if (!token || !email) {
    router.push('/forgot-password');
    return;
  }
  form.token = token;
  form.email = email;
});
</script>

<style scoped>
.auth-card {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.auth-heading {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.auth-title {
  font-size: clamp(1.6rem, 3vw, 2rem);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.alert {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  border-radius: 0.6rem;
}

.alert-error {
  color: var(--status-error);
  background: color-mix(in srgb, var(--status-error) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-error) 26%, transparent);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
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

.field-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent-purple) 55%, var(--border-color));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-purple) 16%, transparent);
}

.field-input.has-error {
  border-color: var(--status-error);
}

.field-input.is-locked {
  color: var(--text-muted);
  background: var(--bg-secondary);
  cursor: not-allowed;
}

.field-error {
  font-size: 0.76rem;
  color: var(--status-error);
}

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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 10px 24px -10px rgba(168, 85, 247, 0.6);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 14px 30px -10px rgba(168, 85, 247, 0.7);
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

@keyframes spin { to { transform: rotate(360deg); } }

.form-link {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--accent-purple);
  transition: color 0.2s;
}

.form-link:hover { color: var(--accent-indigo); }

.back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.back-link svg {
  width: 14px;
  height: 14px;
}

.success-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  text-align: center;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-success) 30%, transparent);
}

.success-icon svg { width: 24px; height: 24px; }

.success-title {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.success-text {
  max-width: 22rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
}
</style>
