<template>
    <div class="auth-page">
        <div class="auth-container">
            <div class="auth-header">
                <LogoIcon class="logo" />
                <h1>Create account</h1>
                <p>Start your ClaudeNest journey today</p>
            </div>

            <form class="auth-form" @submit.prevent="handleSubmit">
                <div v-if="authStore.authError" class="alert alert--error">
                    {{ authStore.authError }}
                </div>

                <Input
                    v-model="form.name"
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    required
                    autocomplete="name"
                    :error="getFieldError('name')"
                />

                <Input
                    v-model="form.email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autocomplete="email"
                    :error="getFieldError('email')"
                />

                <Input
                    v-model="form.password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autocomplete="new-password"
                    :error="getFieldError('password')"
                    hint="At least 8 characters with letters and numbers"
                />

                <Input
                    v-model="form.password_confirmation"
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autocomplete="new-password"
                    :error="getFieldError('password_confirmation')"
                />

                <label class="checkbox">
                    <input v-model="form.agreeTerms" type="checkbox" required />
                    <span>
                        I agree to the
                        <a href="/docs/terms" class="link" target="_blank">Terms of Service</a>
                        and
                        <a href="/docs/privacy" class="link" target="_blank">Privacy Policy</a>
                    </span>
                </label>

                <Button
                    type="submit"
                    variant="primary"
                    full-width
                    :loading="authStore.isLoading"
                    :disabled="!form.agreeTerms"
                >
                    Create Account
                </Button>
            </form>

            <div class="auth-divider">
                <span>or sign up with</span>
            </div>

            <div class="social-buttons">
                <Button variant="secondary" @click="registerWithOAuth('google')">
                    <GoogleIcon />
                    Google
                </Button>
                <Button variant="secondary" @click="registerWithOAuth('github')">
                    <GithubIcon />
                    GitHub
                </Button>
            </div>

            <p class="auth-footer">
                Already have an account?
                <router-link to="/login" class="link">Sign in</router-link>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import LogoIcon from '@/components/common/LogoIcon.vue';
import GoogleIcon from '@/components/common/GoogleIcon.vue';
import GithubIcon from '@/components/common/GithubIcon.vue';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    agreeTerms: boolean;
}

const router = useRouter();
const authStore = useAuthStore();

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

<style scoped>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f0f1a;
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
    color: #ffffff;
    margin: 0 0 8px;
}

.auth-header p {
    font-size: 15px;
    color: #888888;
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

.checkbox {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: #888888;
    font-size: 14px;
    cursor: pointer;
}

.checkbox input {
    margin-top: 2px;
    accent-color: #a855f7;
}

.link {
    color: #a855f7;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
}

.link:hover {
    color: #c084fc;
    text-decoration: underline;
}

.auth-divider {
    display: flex;
    align-items: center;
    margin: 24px 0;
    color: #64748b;
    font-size: 14px;
}

.auth-divider::before,
.auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
}

.auth-divider span {
    padding: 0 16px;
}

.social-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.auth-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 14px;
    color: #888888;
}
</style>
