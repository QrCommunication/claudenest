<template>
  <footer class="py-16 px-4 sm:px-6 lg:px-8" style="border-top: 1px solid var(--border); background-color: var(--surface-1)">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <!-- Brand -->
        <div class="col-span-2 md:col-span-1">
          <Logo variant="full" size="sm" />
          <p class="text-sm mt-3 max-w-xs leading-relaxed" style="color: var(--text-secondary)">
            {{ $t('landing.footer.description') }}
          </p>
        </div>

        <!-- Product -->
        <div>
          <h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary)">{{ $t('landing.footer.product') }}</h4>
          <ul class="space-y-2.5">
            <li><a href="#features" class="nav-link text-sm cursor-pointer">{{ $t('landing.nav.features') }}</a></li>
            <li><a href="#how-it-works" class="nav-link text-sm cursor-pointer">{{ $t('landing.nav.how_it_works') }}</a></li>
            <li><a href="#comparison" class="nav-link text-sm cursor-pointer">{{ $t('landing.nav.compare') }}</a></li>
            <li><a href="#pricing" class="nav-link text-sm cursor-pointer">{{ $t('landing.nav.pricing') }}</a></li>
            <li><router-link to="/docs/resources/changelog" class="nav-link text-sm cursor-pointer">{{ $t('landing.footer.changelog') }}</router-link></li>
          </ul>
        </div>

        <!-- Resources -->
        <div>
          <h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary)">{{ $t('landing.footer.resources') }}</h4>
          <ul class="space-y-2.5">
            <li><router-link to="/docs" class="nav-link text-sm cursor-pointer">{{ $t('docs.title') }}</router-link></li>
            <li><router-link to="/docs/api/authentication" class="nav-link text-sm cursor-pointer">{{ $t('landing.footer.api_reference') }}</router-link></li>
            <li><a href="https://github.com/claudenest/claudenest" target="_blank" rel="noopener noreferrer" class="nav-link text-sm cursor-pointer">GitHub</a></li>
            <li><a href="https://status.claudenest.io" target="_blank" rel="noopener noreferrer" class="nav-link text-sm cursor-pointer">{{ $t('landing.footer.status') }}</a></li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary)">{{ $t('landing.footer.legal') }}</h4>
          <ul class="space-y-2.5">
            <li><router-link to="/docs/terms" class="nav-link text-sm cursor-pointer">{{ $t('auth.terms_of_service') }}</router-link></li>
            <li><router-link to="/docs/privacy" class="nav-link text-sm cursor-pointer">{{ $t('auth.privacy_policy') }}</router-link></li>
          </ul>
        </div>
      </div>

      <!-- Bottom -->
      <div style="border-top: 1px solid var(--border)" class="pt-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <p class="text-sm" style="color: var(--text-muted)">
            {{ $t('landing.footer.copyright', { year: new Date().getFullYear() }) }}<span class="terminal-cursor ml-0.5">_</span>
          </p>

          <div class="flex items-center gap-4">
            <a href="https://github.com/claudenest/claudenest" target="_blank" rel="noopener noreferrer" class="nav-link cursor-pointer hover:text-brand-purple transition-colors" aria-label="GitHub">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="https://x.com/claudenest" target="_blank" rel="noopener noreferrer" class="nav-link cursor-pointer hover:text-brand-purple transition-colors" aria-label="X (Twitter)">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          <div class="flex items-center gap-2 text-xs" style="color: var(--text-muted); opacity: 0.5">
            <span>{{ $t('landing.footer.built_with') }}</span>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-label="Laravel">
              <path d="M23.642 5.43a.364.364 0 01.014.1v5.149c0 .135-.073.26-.189.326l-4.323 2.49v4.934c0 .135-.073.26-.189.327l-9.03 5.2a.32.32 0 01-.085.042.199.199 0 01-.024.007.373.373 0 01-.19 0 .116.116 0 01-.024-.007.32.32 0 01-.086-.042l-9.03-5.2a.376.376 0 01-.188-.326V3.545c0-.033.005-.066.014-.098a.178.178 0 01.017-.052c.007-.015.017-.028.027-.042a.22.22 0 01.028-.037c.012-.012.025-.023.038-.033a.252.252 0 01.039-.028l4.512-2.6a.374.374 0 01.376 0l4.513 2.6a.252.252 0 01.038.028c.014.01.027.02.039.033a.22.22 0 01.028.037c.01.014.02.027.027.042a.178.178 0 01.017.052c.01.032.014.065.014.098v9.652l3.756-2.164V5.529c0-.033.004-.066.013-.098a.178.178 0 01.018-.052c.007-.015.017-.028.027-.042a.22.22 0 01.028-.037c.012-.012.025-.023.038-.033a.252.252 0 01.039-.028l4.513-2.6a.374.374 0 01.376 0l4.513 2.6c.014.008.027.018.038.028.014.01.027.02.039.033a.22.22 0 01.028.037z"/>
            </svg>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-label="Vue.js">
              <path d="M24 1.61h-9.94L12 5.16 9.94 1.61H0l12 20.78zM12 14.08L5.16 2.23h4.43L12 6.41l2.41-4.18h4.43z"/>
            </svg>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-label="PostgreSQL">
              <path d="M17.128 0a10.134 10.134 0 00-2.755.403l-.063.02A10.922 10.922 0 0012.6.258C11.422.238 10.41.524 9.594 1 8.79.721 7.122.24 5.364.336 4.14.403 2.804.775 1.814 1.82.827 2.865.305 4.482.415 6.682c.03.607.203 1.597.49 2.879s.69 2.783 1.193 4.152c.503 1.37 1.054 2.6 1.915 3.436.43.419 1.022.771 1.72.742.49-.02.933-.235 1.315-.552.186.245.385.352.566.451.228.125.45.21.68.266.413.103.861.143 1.37.06a2.94 2.94 0 001.002-.39v.286c-.042.96-.074 1.7.093 2.522.166.823.509 1.727 1.322 2.374.405.322.94.551 1.547.603.608.052 1.252-.07 1.862-.36 1.04-.495 2.028-1.402 2.897-2.866a.477.477 0 00.049-.136c.148-.589.188-1.072.192-1.647l.003-.066c.382-.31.622-.65.812-1.024.265-.52.413-1.11.512-1.755a4.498 4.498 0 00-.034-1.607c-.088-.378-.231-.674-.37-.963.082-.142.16-.285.232-.437.353-.748.483-1.56.397-2.368-.088-.823-.39-1.63-.89-2.287a.478.478 0 00-.038-.048c-1.095-1.216-2.376-1.645-3.543-1.844a7.83 7.83 0 00-1.576-.145z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Logo from '@/components/common/Logo.vue';

const { t } = useI18n();
</script>

<style scoped>
.terminal-cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .terminal-cursor {
    animation: none !important;
    opacity: 1;
  }
}
</style>
