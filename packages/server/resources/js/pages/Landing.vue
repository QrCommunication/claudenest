<template>
  <div class="min-h-screen bg-dark-1">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-dark-1/80 backdrop-blur-xl border-b border-dark-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <Logo variant="full" size="md" to="/" />

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-6">
            <a href="#features" class="text-dark-4 hover:text-white transition-colors">
              {{ $t('landing.features.title_highlight') }}
            </a>
            <router-link to="/docs" class="text-dark-4 hover:text-white transition-colors">
              {{ $t('docs.title') }}
            </router-link>
            <a 
              href="https://github.com/claudenest/claudenest" 
              target="_blank"
              class="text-dark-4 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>

          <!-- Right Side -->
          <div class="flex items-center gap-3">
            <ThemeToggle variant="ghost" />
            <LanguageSwitcher variant="ghost" :show-label="false" />
            
            <div class="hidden sm:flex items-center gap-3 ml-4">
              <router-link 
                to="/login" 
                class="text-dark-4 hover:text-white transition-colors font-medium"
              >
                {{ $t('common.login') }}
              </router-link>
              <router-link 
                to="/register" 
                class="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-medium transition-colors"
              >
                {{ $t('landing.hero.cta_primary') }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-indigo/20 rounded-full blur-3xl"></div>
      </div>

      <div class="max-w-7xl mx-auto relative">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            {{ $t('landing.hero.title') }}
            <span class="gradient-text block">{{ $t('landing.hero.title_highlight') }}</span>
          </h1>
          <p class="text-xl text-dark-4 mb-8 max-w-2xl mx-auto">
            {{ $t('landing.hero.subtitle') }}
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <router-link 
              to="/register" 
              class="w-full sm:w-auto px-8 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-brand-purple/25"
            >
              {{ $t('landing.hero.cta_primary') }}
            </router-link>
            <router-link 
              to="/docs" 
              class="w-full sm:w-auto px-8 py-3 bg-dark-3 hover:bg-dark-4 text-white rounded-lg font-semibold transition-colors border border-dark-4"
            >
              {{ $t('landing.hero.cta_secondary') }}
            </router-link>
          </div>
        </div>

        <!-- Hero Image/Terminal -->
        <div class="mt-16 relative">
          <div class="bg-dark-2 rounded-xl border border-dark-4 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            <!-- Terminal Header -->
            <div class="flex items-center gap-2 px-4 py-3 bg-dark-3 border-b border-dark-4">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span class="text-sm text-dark-4 ml-2 font-mono">claude@remote ~ </span>
            </div>
            <!-- Terminal Content -->
            <div class="p-6 font-mono text-sm">
              <div class="text-green-400">$ claudenest connect my-server</div>
              <div class="text-dark-4 mt-2">Connecting to my-server...</div>
              <div class="text-brand-cyan mt-1">Connected! Starting Claude Code session...</div>
              <div class="mt-4 text-white">
                <span class="text-brand-purple">Claude</span> &gt; Hello! I'm ready to help with your project.
              </div>
              <div class="mt-2 text-dark-4">
                Working directory: ~/projects/my-app
              </div>
              <div class="mt-4 flex items-center">
                <span class="text-brand-purple">You</span>
                <span class="text-white ml-2">&gt;</span>
                <span class="ml-2 text-white animate-pulse">|</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 px-4 sm:px-6 lg:px-8 bg-dark-2/50">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            {{ $t('landing.features.title') }}
            <span class="gradient-text">{{ $t('landing.features.title_highlight') }}</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1: Remote Access -->
          <div class="bg-dark-2 p-6 rounded-xl border border-dark-4 hover:border-brand-purple/50 transition-colors group">
            <div class="w-12 h-12 bg-brand-purple/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-purple/20 transition-colors">
              <svg class="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.remote_access.title') }}</h3>
            <p class="text-dark-4">{{ $t('landing.features.remote_access.description') }}</p>
          </div>

          <!-- Feature 2: Multi-Agent -->
          <div class="bg-dark-2 p-6 rounded-xl border border-dark-4 hover:border-brand-cyan/50 transition-colors group">
            <div class="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-cyan/20 transition-colors">
              <svg class="w-6 h-6 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.multi_agent.title') }}</h3>
            <p class="text-dark-4">{{ $t('landing.features.multi_agent.description') }}</p>
          </div>

          <!-- Feature 3: Context RAG -->
          <div class="bg-dark-2 p-6 rounded-xl border border-dark-4 hover:border-brand-indigo/50 transition-colors group">
            <div class="w-12 h-12 bg-brand-indigo/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-indigo/20 transition-colors">
              <svg class="w-6 h-6 text-brand-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.context_rag.title') }}</h3>
            <p class="text-dark-4">{{ $t('landing.features.context_rag.description') }}</p>
          </div>

          <!-- Feature 4: Real-time -->
          <div class="bg-dark-2 p-6 rounded-xl border border-dark-4 hover:border-green-500/50 transition-colors group">
            <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.real_time.title') }}</h3>
            <p class="text-dark-4">{{ $t('landing.features.real_time.description') }}</p>
          </div>

          <!-- Feature 5: File Locking -->
          <div class="bg-dark-2 p-6 rounded-xl border border-dark-4 hover:border-yellow-500/50 transition-colors group">
            <div class="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
              <svg class="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.file_locking.title') }}</h3>
            <p class="text-dark-4">{{ $t('landing.features.file_locking.description') }}</p>
          </div>

          <!-- Feature 6: MCP Support -->
          <div class="bg-dark-2 p-6 rounded-xl border border-dark-4 hover:border-pink-500/50 transition-colors group">
            <div class="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
              <svg class="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.mcp_support.title') }}</h3>
            <p class="text-dark-4">{{ $t('landing.features.mcp_support.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Open Source Section -->
    <section class="py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-dark-3 rounded-full border border-dark-4 mb-6">
          <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span class="text-white font-medium">{{ $t('landing.open_source.title') }}</span>
        </div>
        <h2 class="text-3xl font-bold text-white mb-4">
          {{ $t('landing.open_source.description') }}
        </h2>
        <a 
          href="https://github.com/claudenest/claudenest" 
          target="_blank"
          class="inline-flex items-center gap-2 px-6 py-3 bg-dark-3 hover:bg-dark-4 text-white rounded-lg font-medium transition-colors border border-dark-4 mt-4"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          {{ $t('landing.open_source.github') }}
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-4 sm:px-6 lg:px-8 border-t border-dark-4">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="full" size="sm" />
          <div class="flex items-center gap-6 text-sm text-dark-4">
            <router-link to="/docs" class="hover:text-white transition-colors">
              {{ $t('docs.title') }}
            </router-link>
            <a href="https://github.com/claudenest/claudenest" target="_blank" class="hover:text-white transition-colors">
              GitHub
            </a>
            <router-link to="/docs/terms" class="hover:text-white transition-colors">
              {{ $t('auth.terms_of_service') }}
            </router-link>
            <router-link to="/docs/privacy" class="hover:text-white transition-colors">
              {{ $t('auth.privacy_policy') }}
            </router-link>
          </div>
        </div>
        <div class="mt-8 text-center text-sm text-dark-4">
          {{ $t('landing.footer.copyright', { year: new Date().getFullYear() }) }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';

const { t } = useI18n();
</script>

<style scoped>
.gradient-text {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
