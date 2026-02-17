<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" class="logo-container" :class="containerClass">
    <!-- Icon Only -->
    <svg
      v-if="variant === 'icon'"
      :class="sizeClass"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`bgGrad-${uid}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${isDarkTheme ? '#1a1b26' : '#f8fafc'}`"/>
          <stop offset="100%" :style="`stop-color:${isDarkTheme ? '#24283b' : '#f1f5f9'}`"/>
        </linearGradient>
        <linearGradient :id="`nestGrad-${uid}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${isDarkTheme ? '#a855f7' : '#9333ea'}`"/>
          <stop offset="100%" :style="`stop-color:${isDarkTheme ? '#6366f1' : '#4f46e5'}`"/>
        </linearGradient>
        <linearGradient :id="`accentGrad-${uid}`" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" :style="`stop-color:${isDarkTheme ? '#22d3ee' : '#0891b2'}`"/>
          <stop offset="100%" :style="`stop-color:${isDarkTheme ? '#a855f7' : '#9333ea'}`"/>
        </linearGradient>
      </defs>
      <rect v-if="showBackground" x="0" y="0" width="512" height="512" rx="96" :fill="`url(#bgGrad-${uid})`"/>
      <g transform="translate(256, 256)">
        <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" :stroke="`url(#nestGrad-${uid})`" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" :stroke="`url(#nestGrad-${uid})`" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M-60 -70 Q-130 -70 -130 0 Q-130 70 -60 70" :stroke="`url(#nestGrad-${uid})`" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
        <path d="M60 -70 Q130 -70 130 0 Q130 70 60 70" :stroke="`url(#nestGrad-${uid})`" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
        <circle cx="-35" cy="0" r="18" :fill="isDarkTheme ? '#22d3ee' : '#0891b2'"/>
        <circle cx="0" cy="0" r="18" :fill="`url(#nestGrad-${uid})`"/>
        <circle cx="35" cy="0" r="18" :fill="isDarkTheme ? '#22d3ee' : '#0891b2'"/>
        <line x1="-17" y1="0" x2="17" y2="0" :stroke="`url(#accentGrad-${uid})`" stroke-width="6" opacity="0.8"/>
      </g>
    </svg>

    <!-- Full Logo with Text -->
    <template v-else>
      <svg
        :class="iconSizeClass"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient :id="`bgGrad-${uid}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :style="`stop-color:${isDarkTheme ? '#1a1b26' : '#f8fafc'}`"/>
            <stop offset="100%" :style="`stop-color:${isDarkTheme ? '#24283b' : '#f1f5f9'}`"/>
          </linearGradient>
          <linearGradient :id="`nestGrad-${uid}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :style="`stop-color:${isDarkTheme ? '#a855f7' : '#9333ea'}`"/>
            <stop offset="100%" :style="`stop-color:${isDarkTheme ? '#6366f1' : '#4f46e5'}`"/>
          </linearGradient>
          <linearGradient :id="`accentGrad-${uid}`" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :style="`stop-color:${isDarkTheme ? '#22d3ee' : '#0891b2'}`"/>
            <stop offset="100%" :style="`stop-color:${isDarkTheme ? '#a855f7' : '#9333ea'}`"/>
          </linearGradient>
        </defs>
        <rect v-if="showBackground" x="0" y="0" width="512" height="512" rx="96" :fill="`url(#bgGrad-${uid})`"/>
        <g transform="translate(256, 256)">
          <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" :stroke="`url(#nestGrad-${uid})`" stroke-width="16" fill="none" stroke-linecap="round"/>
          <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" :stroke="`url(#nestGrad-${uid})`" stroke-width="16" fill="none" stroke-linecap="round"/>
          <path d="M-60 -70 Q-130 -70 -130 0 Q-130 70 -60 70" :stroke="`url(#nestGrad-${uid})`" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
          <path d="M60 -70 Q130 -70 130 0 Q130 70 60 70" :stroke="`url(#nestGrad-${uid})`" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
          <circle cx="-35" cy="0" r="18" :fill="isDarkTheme ? '#22d3ee' : '#0891b2'"/>
          <circle cx="0" cy="0" r="18" :fill="`url(#nestGrad-${uid})`"/>
          <circle cx="35" cy="0" r="18" :fill="isDarkTheme ? '#22d3ee' : '#0891b2'"/>
          <line x1="-17" y1="0" x2="17" y2="0" :stroke="`url(#accentGrad-${uid})`" stroke-width="6" opacity="0.8"/>
        </g>
      </svg>
      <div class="logo-text">
        <span class="logo-name">
          <span :class="isDarkTheme ? 'text-white' : 'text-dark-2'">Claude</span><span class="gradient-text">Nest</span>
        </span>
        <span v-if="showTagline" class="logo-tagline">{{ tagline }}</span>
      </div>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';

interface Props {
  variant?: 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light' | 'auto';
  showTagline?: boolean;
  tagline?: string;
  showBackground?: boolean;
  to?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'full',
  size: 'md',
  theme: 'auto',
  showTagline: false,
  tagline: 'Remote Claude Code Orchestration',
  showBackground: true,
  to: undefined,
});

const { isDark } = useTheme();

const uid = Math.random().toString(36).substring(2, 9);

const isDarkTheme = computed(() => {
  if (props.theme === 'auto') return isDark.value;
  return props.theme === 'dark';
});

const sizeClass = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  return sizes[props.size];
});

const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };
  return sizes[props.size];
});

const containerClass = computed(() => {
  return props.variant === 'full' ? 'flex items-center gap-2' : '';
});
</script>

<style scoped>
.logo-container {
  display: inline-flex;
  text-decoration: none;
}

.logo-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-name {
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1.2;
}

.logo-tagline {
  font-size: 0.75rem;
  color: #888888;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7) 0%, var(--accent-indigo, #6366f1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Size variants for text */
.logo-container[class*="xs"] .logo-name,
.logo-container[class*="sm"] .logo-name {
  font-size: 1rem;
}

.logo-container[class*="lg"] .logo-name {
  font-size: 1.5rem;
}

.logo-container[class*="xl"] .logo-name {
  font-size: 2rem;
}
</style>
