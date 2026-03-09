<template>
    <div class="auth-page">
        <div class="auth-container">
            <div class="auth-header">
                <LogoIcon class="logo" />
                <h1>Reset password</h1>
                <p>Enter your email to receive a reset link</p>
            </div>

            <div v-if="success" class="success-container">
                <div class="success-icon">✓</div>
                <h2>Check your email</h2>
                <p>We've sent a password reset link to <strong>{{ form.email }}</strong></p>
                <p class="hint">Didn't receive it? Check your spam folder or try again.</p>
                <Button variant="primary" full-width @click="resetForm">
                    Try Again
                </Button>
                <router-link to="/login" class="back-link">
                    ← Back to sign in
                </router-link>
            </div>

            <form v-else class="auth-form" @submit.prevent="handleSubmit">
                <div v-if="authStore.authError" class="alert alert--error">
                    {{ authStore.authError }}
                </div>

                <Input
                    v-model="form.email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autocomplete="email"
                    :error="getFieldError('email')"
                />

                <Button
                    type="submit"
                    variant="primary"
                    full-width
                    :loading="authStore.isLoading"
                >
                    Send Reset Link
                </Button>

                <router-link to="/login" class="back-link">
                    ← Back to sign in
                </router-link>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import LogoIcon from '@/components/common/LogoIcon.vue';

interface ForgotPasswordForm {
    email: string;
}

const authStore = useAuthStore();
const success = ref<boolean>(false);

const form = reactive<ForgotPasswordForm>({
    email: '',
});

function getFieldError(field: string): string | undefined {
    const errors = authStore.fieldErrors[field];
    return errors?.[0];
}

async function handleSubmit(): Promise<void> {
    authStore.clearErrors();

    const result = await authStore.forgotPassword({
        email: form.email,
    });

    if (result.success) {
        success.value = true;
    }
}

function resetForm(): void {
    success.value = false;
    form.email = '';
    authStore.clearErrors();
}

onMounted(() => {
    authStore.clearErrors();
});
</script>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary, var(--surface-1));
    padding: 24px;
}

.auth-container {
    width: 100%;
    max-width: 420px;
}

.auth-header {
    text-align: center;
    margin-bottom: 32px;
}

.logo {
    width: 64px;
    height: 64px;
    margin: 0 auto 24px;
}

.auth-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px;
}

.auth-header p {
    font-size: 15px;
    color: var(--text-secondary);
    margin: 0;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.alert {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
}

.alert--error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
}

.success-container {
    text-align: center;
    padding: 24px 0;
}

.success-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--accent-purple, #a855f7) 0%, var(--accent-indigo, #6366f1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: white;
    margin: 0 auto 24px;
}

.success-container h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 12px;
}

.success-container p {
    font-size: 15px;
    color: var(--text-secondary);
    margin: 0 0 8px;
}

.success-container .hint {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 24px;
}

.success-container strong {
    color: var(--text-primary);
}

.back-link {
    display: block;
    text-align: center;
    color: var(--accent-purple, #a855f7);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    margin-top: 16px;
    transition: color 0.2s;
}

.back-link:hover {
    color: var(--accent-purple-light, #c084fc);
}
</style>
