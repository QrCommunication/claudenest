<template>
  <div class="min-h-screen bg-surface-1">
    <!-- Navigation (sticky, transparent) -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-surface-1/80 backdrop-blur-xl border-b border-skin transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <Logo variant="full" size="md" to="/" />

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-8">
            <a href="#features" class="nav-link cursor-pointer text-sm font-medium">Features</a>
            <router-link to="/docs" class="nav-link cursor-pointer text-sm font-medium">Docs</router-link>
            <a href="#pricing" class="nav-link cursor-pointer text-sm font-medium">Pricing</a>
          </div>

          <!-- Right Side -->
          <div class="flex items-center gap-4">
            <ThemeToggle variant="ghost" />

            <!-- Mobile Menu Button -->
            <button
              class="md:hidden p-2 text-skin-secondary hover:text-skin-primary transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="hidden sm:flex items-center gap-3">
              <router-link to="/login" class="text-skin-secondary hover:text-skin-primary transition-colors font-medium cursor-pointer text-sm">
                Login
              </router-link>
              <router-link
                to="/register"
                class="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-brand-purple/25 cursor-pointer text-sm"
              >
                Get Started
              </router-link>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-skin mt-2 pt-4">
            <div class="flex flex-col gap-3">
              <a href="#features" class="nav-link px-2 py-1 cursor-pointer" @click="mobileMenuOpen = false">Features</a>
              <router-link to="/docs" class="nav-link px-2 py-1 cursor-pointer" @click="mobileMenuOpen = false">Docs</router-link>
              <a href="#pricing" class="nav-link px-2 py-1 cursor-pointer" @click="mobileMenuOpen = false">Pricing</a>
              <div class="flex items-center gap-3 pt-3 border-t border-skin sm:hidden">
                <router-link to="/login" class="text-skin-secondary hover:text-skin-primary transition-colors font-medium cursor-pointer">
                  Login
                </router-link>
                <router-link to="/register" class="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-medium transition-colors cursor-pointer flex-1 text-center">
                  Get Started
                </router-link>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <!-- Hero Section -->
      <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-screen flex items-center">
        <!-- Background Gradient -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="hero-orb hero-orb--purple"></div>
          <div class="hero-orb hero-orb--indigo"></div>
          <div class="hero-orb hero-orb--cyan"></div>
          <div class="absolute inset-0 dark:bg-grid-pattern bg-dot-pattern opacity-[0.03]"></div>
        </div>

        <div class="max-w-7xl mx-auto relative w-full">
          <div class="text-center max-w-4xl mx-auto">
            <!-- Headline -->
            <h1
              v-motion
              :initial="{ opacity: 0, y: 30 }"
              :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 100, duration: 600 } }"
              class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
              style="color: var(--text-primary)"
            >
              Remote Claude Code
              <span class="gradient-text block mt-2">Orchestration</span>
            </h1>

            <!-- Sub-headline -->
            <p
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 300, duration: 600 } }"
              class="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed"
              style="color: var(--text-secondary)"
            >
              Control Claude Code from anywhere. Multi-agent coordination with context RAG, file locking, and real-time sync.
            </p>

            <!-- CTAs -->
            <div
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 400, duration: 600 } }"
              class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <router-link
                to="/register"
                class="w-full sm:w-auto px-8 py-4 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-semibold transition-all hover:scale-[1.03] shadow-lg shadow-brand-purple/25 hover:shadow-xl hover:shadow-brand-purple/30 cursor-pointer text-lg"
              >
                Get Started Free
              </router-link>
              <router-link
                to="/docs"
                class="w-full sm:w-auto px-8 py-4 rounded-lg font-semibold transition-all cursor-pointer text-lg"
                style="background-color: var(--glass-bg); border: 1px solid var(--border); color: var(--text-primary); backdrop-filter: blur(16px)"
              >
                View Documentation
              </router-link>
            </div>

            <!-- Terminal Preview with CSS Animation -->
            <div
              v-motion
              :initial="{ opacity: 0, y: 40, scale: 0.95 }"
              :visibleOnce="{ opacity: 1, y: 0, scale: 1, transition: { delay: 600, duration: 800 } }"
              class="relative max-w-4xl mx-auto"
            >
              <div
                class="absolute -inset-4 bg-gradient-to-r from-brand-purple/20 via-brand-indigo/10 to-brand-cyan/20 rounded-2xl blur-2xl opacity-50"
                aria-hidden="true"
              ></div>
              <div class="relative terminal-block shadow-2xl">
                <div class="terminal-header">
                  <div class="flex gap-1.5">
                    <div class="terminal-dot terminal-dot--red"></div>
                    <div class="terminal-dot terminal-dot--yellow"></div>
                    <div class="terminal-dot terminal-dot--green"></div>
                  </div>
                  <span class="text-sm font-mono ml-2" style="color: var(--text-muted)">claude@remote ~ </span>
                </div>
                <div class="terminal-content font-mono text-sm">
                  <div class="terminal-line">
                    <span class="text-green-400">$</span>
                    <span class="typing-text ml-2" style="color: var(--text-primary)">claudenest connect my-server</span>
                  </div>
                  <div class="terminal-line" style="animation-delay: 2s">
                    <span style="color: var(--text-secondary)">Connecting to my-server...</span>
                  </div>
                  <div class="terminal-line" style="animation-delay: 3s">
                    <span class="text-brand-cyan">✓ Connected! Starting Claude Code session...</span>
                  </div>
                  <div class="terminal-line" style="animation-delay: 4s">
                    <span class="text-brand-purple">[Agent-1]</span>
                    <span style="color: var(--text-primary)"> Working on: src/api/auth.ts</span>
                  </div>
                  <div class="terminal-line" style="animation-delay: 4.5s">
                    <span class="text-brand-indigo">[Agent-2]</span>
                    <span style="color: var(--text-primary)"> Working on: src/components/Dashboard.vue</span>
                  </div>
                  <div class="terminal-line flex items-center" style="animation-delay: 5s">
                    <span class="text-green-400">All agents synced. Ready.</span>
                    <span class="ml-1 terminal-cursor" style="color: var(--text-primary)">_</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-24 px-4 sm:px-6 lg:px-8 section-alt relative">
        <div class="absolute top-8 left-4 lg:left-12 font-mono text-6xl font-bold opacity-[0.03]" style="color: var(--text-primary)">{</div>
        <div class="absolute bottom-8 right-4 lg:right-12 font-mono text-6xl font-bold opacity-[0.03]" style="color: var(--text-primary)">}</div>

        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">FEATURES</p>
            <h2 class="text-4xl sm:text-5xl font-bold mb-4" style="color: var(--text-primary)">
              Everything you need for
              <span class="gradient-text">remote AI orchestration</span>
            </h2>
            <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary)">
              Production-ready platform for coordinating multiple Claude instances across distributed teams.
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="(feature, idx) in features"
              :key="feature.key"
              v-motion
              :initial="{ opacity: 0, y: 30 }"
              :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 100, duration: 500 } }"
              class="group landing-card p-6"
            >
              <div class="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors" :class="feature.bgClass">
                <svg class="w-6 h-6" :class="feature.iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="feature.iconPath" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary)">{{ feature.title }}</h3>
              <p class="leading-relaxed" style="color: var(--text-secondary)">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="py-24 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <p class="text-sm font-semibold text-brand-cyan uppercase tracking-wider mb-3">HOW IT WORKS</p>
            <h2 class="text-4xl sm:text-5xl font-bold mb-4" style="color: var(--text-primary)">
              Get started in
              <span class="gradient-text">3 simple steps</span>
            </h2>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <div
              v-for="(step, idx) in howItWorksSteps"
              :key="step.number"
              v-motion
              :initial="{ opacity: 0, y: 30 }"
              :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 150, duration: 500 } }"
              class="relative"
            >
              <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-r from-brand-purple to-brand-indigo flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-lg shadow-brand-purple/30">
                  {{ step.number }}
                </div>
                <h3 class="text-xl font-semibold mb-3" style="color: var(--text-primary)">{{ step.title }}</h3>
                <p class="leading-relaxed" style="color: var(--text-secondary)">{{ step.description }}</p>
              </div>
              <div v-if="idx < 2" class="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-brand-purple/50 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Install Section -->
      <section class="py-24 px-4 sm:px-6 lg:px-8 section-alt">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="text-3xl sm:text-4xl font-bold mb-4" style="color: var(--text-primary)">
              Install in <span class="gradient-text">one command</span>
            </h2>
            <p class="text-lg" style="color: var(--text-secondary)">Works on macOS, Linux, and Windows (WSL)</p>
          </div>

          <div class="relative">
            <div class="terminal-block">
              <div class="terminal-header">
                <div class="flex gap-1.5">
                  <div class="terminal-dot terminal-dot--red"></div>
                  <div class="terminal-dot terminal-dot--yellow"></div>
                  <div class="terminal-dot terminal-dot--green"></div>
                </div>
                <span class="text-sm font-mono ml-2" style="color: var(--text-muted)">install-agent.sh</span>
                <button
                  class="ml-auto px-3 py-1 text-xs bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple rounded transition-colors cursor-pointer"
                  @click="copyInstallCommand"
                >
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <div class="terminal-content font-mono text-sm">
                <code class="text-brand-cyan">curl -fsSL https://claudenest.io/install-agent.sh | bash</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-16 px-4 sm:px-6 lg:px-8" style="border-top: 1px solid var(--border)">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <!-- Brand -->
            <div class="col-span-2 md:col-span-1">
              <Logo variant="full" size="sm" />
              <p class="text-sm mt-3 max-w-xs leading-relaxed" style="color: var(--text-secondary)">
                Remote Claude Code orchestration platform. Open source, self-hosted, production-ready.
              </p>
            </div>

            <!-- Product -->
            <div>
              <h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary)">Product</h4>
              <ul class="space-y-2.5">
                <li><a href="#features" class="nav-link text-sm cursor-pointer">Features</a></li>
                <li><a href="#pricing" class="nav-link text-sm cursor-pointer">Pricing</a></li>
                <li><router-link to="/changelog" class="nav-link text-sm cursor-pointer">Changelog</router-link></li>
              </ul>
            </div>

            <!-- Resources -->
            <div>
              <h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary)">Resources</h4>
              <ul class="space-y-2.5">
                <li><router-link to="/docs" class="nav-link text-sm cursor-pointer">Documentation</router-link></li>
                <li><a href="https://github.com/claudenest/claudenest" target="_blank" rel="noopener noreferrer" class="nav-link text-sm cursor-pointer">GitHub</a></li>
              </ul>
            </div>

            <!-- Legal -->
            <div>
              <h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary)">Legal</h4>
              <ul class="space-y-2.5">
                <li><router-link to="/docs/terms" class="nav-link text-sm cursor-pointer">Terms</router-link></li>
                <li><router-link to="/docs/privacy" class="nav-link text-sm cursor-pointer">Privacy</router-link></li>
              </ul>
            </div>
          </div>

          <!-- Bottom -->
          <div style="border-top: 1px solid var(--border)" class="pt-8">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6">
              <p class="text-sm" style="color: var(--text-muted)">
                © {{ new Date().getFullYear() }} ClaudeNest. MIT License.<span class="terminal-cursor ml-0.5">_</span>
              </p>

              <a href="https://github.com/claudenest/claudenest" target="_blank" rel="noopener noreferrer" class="nav-link cursor-pointer hover:text-brand-purple transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';

const mobileMenuOpen = ref(false);
const copied = ref(false);

interface Feature {
  key: string;
  title: string;
  description: string;
  bgClass: string;
  iconClass: string;
  iconPath: string;
}

const features: Feature[] = [
  {
    key: 'remote_access',
    title: 'Remote Access',
    description: 'Control Claude Code instances from anywhere with secure WebSocket connections and end-to-end encryption.',
    bgClass: 'bg-brand-purple/10 group-hover:bg-brand-purple/20',
    iconClass: 'text-brand-purple',
    iconPath: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  },
  {
    key: 'multi_agent',
    title: 'Multi-Agent Coordination',
    description: 'Run multiple Claude instances on the same project with intelligent task distribution and conflict prevention.',
    bgClass: 'bg-brand-cyan/10 group-hover:bg-brand-cyan/20',
    iconClass: 'text-brand-cyan',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    key: 'context_rag',
    title: 'Context RAG with pgvector',
    description: '384-dimensional embeddings for semantic search across project context. Powered by PostgreSQL and BGE models.',
    bgClass: 'bg-brand-indigo/10 group-hover:bg-brand-indigo/20',
    iconClass: 'text-brand-indigo',
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    key: 'file_locking',
    title: 'File Locking',
    description: 'Automatic file locking prevents conflicts when multiple agents work on the same codebase simultaneously.',
    bgClass: 'bg-yellow-500/10 group-hover:bg-yellow-500/20',
    iconClass: 'text-yellow-500',
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    key: 'task_coordination',
    title: 'Task Coordination',
    description: 'Atomic task claiming system ensures work is distributed efficiently across agents without duplication.',
    bgClass: 'bg-green-500/10 group-hover:bg-green-500/20',
    iconClass: 'text-green-500',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    key: 'mcp_support',
    title: 'MCP Support',
    description: 'Full Model Context Protocol integration with automatic discovery of local MCP servers and tools.',
    bgClass: 'bg-pink-500/10 group-hover:bg-pink-500/20',
    iconClass: 'text-pink-500',
    iconPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
];

interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
}

const howItWorksSteps: HowItWorksStep[] = [
  {
    number: 1,
    title: 'Install Agent',
    description: 'Run our one-line installer on your development machine. Works on macOS, Linux, and Windows WSL.',
  },
  {
    number: 2,
    title: 'Connect Machine',
    description: 'Register your machine with the platform. The agent will automatically discover Claude Code and MCP servers.',
  },
  {
    number: 3,
    title: 'Control from Anywhere',
    description: 'Access your remote sessions from the web dashboard or mobile app. Work seamlessly across devices.',
  },
];

function copyInstallCommand(): void {
  navigator.clipboard.writeText('curl -fsSL https://claudenest.io/install-agent.sh | bash');
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<style scoped>
/* Hero Orbs */
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

.hero-orb--purple {
  width: 500px;
  height: 500px;
  top: 10%;
  left: 15%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%);
  animation: float-purple 8s ease-in-out infinite;
}

.hero-orb--indigo {
  width: 400px;
  height: 400px;
  bottom: 20%;
  right: 10%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
  animation: float-indigo 10s ease-in-out infinite;
}

.hero-orb--cyan {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%);
  animation: float-cyan 12s ease-in-out infinite;
}

@keyframes float-purple {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

@keyframes float-indigo {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-25px, 20px) scale(1.08); }
  66% { transform: translate(15px, -25px) scale(0.92); }
}

@keyframes float-cyan {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) translate(20px, -15px) scale(1.1); }
}

/* Terminal Typing Animation */
.terminal-line {
  opacity: 0;
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.typing-text {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid transparent;
  animation: typing 1.5s steps(30) 0.5s forwards;
}

@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.terminal-cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-orb,
  .terminal-cursor,
  .typing-text {
    animation: none !important;
  }

  .terminal-line {
    opacity: 1;
    animation: none !important;
  }

  .typing-text {
    width: 100%;
  }
}
</style>
