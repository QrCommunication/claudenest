<template>
    <div class="auth-page">
        <div class="auth-container">
            <div class="auth-header">
                <LogoIcon class="logo" />
                <h1>New password</h1>
                <p>Create a new password for your account</p>
            </div>

            <div v-if="success" class="success-container">
                <div class="success-icon">✓</div>
                <h2>Password reset!</h2>
                <p>Your password has been successfully reset.</p>
                <Button variant="primary" full-width @click="goToLogin">
                    Sign In with New Password
                </Button>
            </div>

            <form v-else class="auth-form" @submit.prevent="handleSubmit">
                <div v-if="authStore.authError" class="alert alert--error">
                    {{ authStore.authError }}
                </div>

                <input type="hidden" :value="form.token" />

                <Input
                    v-model="form.email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autocomplete="email"
                    :disabled="true"
                    :error="getFieldError('email')"
                />

                <Input
                    v-model="form.password"
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autocomplete="new-password"
                    :error="getFieldError('password')"
                    hint="At least 8 characters with letters and numbers"
                />

                <Input
                    v-model="form.password_confirmation"
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autocomplete="new-password"
                    :error="getFieldError('password_confirmation')"
                />

                <Button
                    type="submit"
                    variant="primary"
                    full-width
                    :loading="authStore.isLoading"
                >
                    Reset Password
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
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import LogoIcon from '@/components/common/LogoIcon.vue';

interface ResetPasswordForm {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const success = ref<boolean>(false);

const form = reactive<ResetPasswordForm>({
    token: '',
    email: '',
    password: '',
    password_confirmation: '',
});

function getFieldError(field: string): string | undefined {
    const errors = authStore.fieldErrors[field];
    return errors?.[0];
}

async function handleSubmit(): Promise<void> {
    authStore.clearErrors();

    const result = await authStore.resetPassword({
        token: form.token,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
    });

    if (result.success) {
        success.value = true;
    }
}

function goToLogin(): void {
    router.push('/login');
}

onMounted(() => {
    authStore.clearErrors();

    // Get token and email from query params
    const token = route.query.token as string;
    const email = route.query.email as string;

    if (!token || !email) {
        // Invalid reset link - redirect to forgot password
        router.push('/forgot-password');
        return;
    }

    form.token = token;
    form.email = email;
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
    margin: 0 0 24px;
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
