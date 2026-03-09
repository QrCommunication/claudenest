<template>
  <div class="landing" :class="{ 'is-scrolled': isScrolled }">
    <!-- ================================================================
         NAVIGATION
         ================================================================ -->
    <nav class="nav" :class="{ scrolled: isScrolled }">
      <div class="nav-inner">
        <Logo variant="full" size="md" to="/" />

        <div class="nav-links">
          <a href="#features" class="nav-link">Features</a>
          <a href="#how" class="nav-link">How it works</a>
          <router-link to="/docs" class="nav-link">Docs</router-link>
          <a href="#pricing" class="nav-link">Pricing</a>
        </div>

        <div class="nav-right">
          <ThemeToggle variant="ghost" />
          <LanguageSwitcher v-if="false" />
          <router-link to="/login" class="nav-link hidden sm:inline-flex">Login</router-link>
          <router-link to="/register" class="btn-primary-sm">Get Started</router-link>

          <button class="mobile-menu-btn" @click="mobileOpen = !mobileOpen" aria-label="Menu">
            <svg v-if="!mobileOpen" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition name="slide-down">
        <div v-if="mobileOpen" class="mobile-menu">
          <a href="#features" class="mobile-link" @click="mobileOpen = false">Features</a>
          <a href="#how" class="mobile-link" @click="mobileOpen = false">How it works</a>
          <router-link to="/docs" class="mobile-link" @click="mobileOpen = false">Docs</router-link>
          <a href="#pricing" class="mobile-link" @click="mobileOpen = false">Pricing</a>
          <div class="mobile-ctas">
            <router-link to="/login" class="mobile-link">Login</router-link>
            <router-link to="/register" class="btn-primary-sm w-full text-center">Get Started</router-link>
          </div>
        </div>
      </Transition>
    </nav>

    <!-- ================================================================
         HERO - Full bleed, split layout
         ================================================================ -->
    <section class="hero">
      <!-- Animated Mesh Background -->
      <div class="hero-bg" aria-hidden="true">
        <div class="mesh-gradient"></div>
        <div class="grid-overlay"></div>
      </div>

      <div class="hero-content">
        <!-- Left: Copy -->
        <div class="hero-copy">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            <span>Open Source & Self-Hosted</span>
          </div>

          <h1 class="hero-title">
            Your AI fleet,<br />
            <span class="gradient-text">one command away.</span>
          </h1>

          <p class="hero-subtitle">
            Deploy, orchestrate and monitor multiple Claude Code agents across your machines. Remote terminal access, shared context with RAG, file locking &mdash; all from a single dashboard.
          </p>

          <!-- Install Command - THE prominent element -->
          <div class="install-block">
            <div class="install-header">
              <span class="install-label">Install the agent</span>
              <button class="copy-btn" @click="copyInstall" :title="copied ? 'Copied!' : 'Copy'">
                <svg v-if="!copied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <svg v-else class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
            <code class="install-cmd">curl -fsSL https://claudenest.io/install-agent.sh | bash</code>
          </div>

          <div class="hero-ctas">
            <router-link to="/register" class="btn-primary">
              Start Free
              <svg class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </router-link>
            <router-link to="/docs" class="btn-ghost">
              Read the docs
            </router-link>
          </div>

          <p class="hero-micro">macOS, Linux & Windows (WSL). Node.js 20+. MIT Licensed.</p>
        </div>

        <!-- Right: Live Terminal Demo -->
        <div class="hero-terminal">
          <div class="terminal-glow" aria-hidden="true"></div>
          <div class="terminal-window">
            <div class="terminal-chrome">
              <div class="terminal-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="terminal-title">claude@remote ~ </span>
            </div>
            <div class="terminal-body" ref="terminalBody">
              <div v-for="(line, i) in terminalLines" :key="i" class="term-line" :style="{ animationDelay: `${line.delay}s` }">
                <span v-if="line.prefix" :class="line.prefixClass">{{ line.prefix }}</span>
                <span :class="line.class">{{ line.text }}</span>
              </div>
              <div class="cursor-line" :style="{ animationDelay: '6s' }">
                <span class="text-green-400">$</span>
                <span class="cursor-blink">_</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================
         TRUSTED BY / STATS BAR
         ================================================================ -->
    <section class="stats-bar">
      <div class="stats-inner">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- ================================================================
         FEATURES - Bento Grid
         ================================================================ -->
    <section id="features" class="section">
      <div class="section-header">
        <span class="section-badge">Features</span>
        <h2 class="section-title">Everything for <span class="gradient-text">remote AI orchestration</span></h2>
        <p class="section-desc">Production-ready tools to coordinate your Claude Code fleet.</p>
      </div>

      <div class="bento-grid">
        <!-- Feature 1: Remote Access (Large) -->
        <div class="bento-card bento-lg">
          <div class="bento-icon bento-icon--purple">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          </div>
          <h3 class="bento-title">Remote Access</h3>
          <p class="bento-desc">Control Claude Code from your browser, phone, or any device. Secure WebSocket tunnels with end-to-end encryption. No VPN needed.</p>
          <div class="bento-visual bento-visual--terminal">
            <div class="mini-terminal">
              <div class="mini-line"><span class="text-green-400">$</span> <span style="color:var(--text-primary)">claudenest connect macbook-pro</span></div>
              <div class="mini-line"><span class="text-brand-cyan">Connected via WSS</span></div>
              <div class="mini-line"><span class="text-brand-purple">Session active - 2 agents running</span></div>
            </div>
          </div>
        </div>

        <!-- Feature 2: Multi-Agent (Large) -->
        <div class="bento-card bento-lg">
          <div class="bento-icon bento-icon--cyan">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h3 class="bento-title">Multi-Agent Coordination</h3>
          <p class="bento-desc">Run 5+ Claude agents on the same project. Automatic task claiming, file locking, and shared context ensure zero conflicts.</p>
          <div class="bento-visual bento-visual--agents">
            <div class="agent-row" v-for="a in agents" :key="a.name">
              <span class="agent-dot" :style="{ background: a.color }"></span>
              <span class="agent-name">{{ a.name }}</span>
              <span class="agent-file">{{ a.file }}</span>
              <span class="agent-status" :style="{ color: a.color }">{{ a.status }}</span>
            </div>
          </div>
        </div>

        <!-- Feature 3: Context RAG -->
        <div class="bento-card">
          <div class="bento-icon bento-icon--indigo">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <h3 class="bento-title">Context RAG</h3>
          <p class="bento-desc">384D vector embeddings with pgvector. Agents share project understanding through semantic search.</p>
        </div>

        <!-- Feature 4: File Locking -->
        <div class="bento-card">
          <div class="bento-icon bento-icon--yellow">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h3 class="bento-title">File Locking</h3>
          <p class="bento-desc">Automatic locks prevent edit conflicts across agents. Expire after 30min or release manually.</p>
        </div>

        <!-- Feature 5: Task System -->
        <div class="bento-card">
          <div class="bento-icon bento-icon--green">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <h3 class="bento-title">Task Coordination</h3>
          <p class="bento-desc">Atomic task claiming. Distribute work across agents with priority queues and dependency tracking.</p>
        </div>

        <!-- Feature 6: MCP Support -->
        <div class="bento-card">
          <div class="bento-icon bento-icon--pink">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </div>
          <h3 class="bento-title">MCP Protocol</h3>
          <p class="bento-desc">Auto-discover and manage MCP servers. Execute tools remotely through the orchestration layer.</p>
        </div>
      </div>
    </section>

    <!-- ================================================================
         HOW IT WORKS
         ================================================================ -->
    <section id="how" class="section section-alt">
      <div class="section-header">
        <span class="section-badge">Setup</span>
        <h2 class="section-title">Running in <span class="gradient-text">under 2 minutes</span></h2>
      </div>

      <div class="steps-row">
        <div class="step" v-for="(step, idx) in steps" :key="step.num">
          <div class="step-num">{{ step.num }}</div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.desc }}</p>
          <code v-if="step.cmd" class="step-cmd">{{ step.cmd }}</code>
          <div v-if="idx < steps.length - 1" class="step-connector" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <!-- ================================================================
         OPEN SOURCE CTA
         ================================================================ -->
    <section class="section cta-section">
      <div class="cta-card">
        <div class="cta-bg" aria-hidden="true"></div>
        <div class="cta-content">
          <h2 class="cta-title">Open source. Self-hosted. <span class="gradient-text">Yours forever.</span></h2>
          <p class="cta-desc">
            No vendor lock-in. Deploy on your infrastructure. Full MIT license. Contribute on GitHub.
          </p>
          <div class="cta-actions">
            <router-link to="/register" class="btn-primary btn-lg">
              Deploy Now
              <svg class="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </router-link>
            <a href="https://github.com/QrCommunication/claudenest" target="_blank" rel="noopener noreferrer" class="btn-ghost btn-lg">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================
         FOOTER
         ================================================================ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <Logo variant="full" size="sm" />
          <p class="footer-tagline">Remote Claude Code orchestration.<br>Open source. Self-hosted.</p>
        </div>

        <div class="footer-links">
          <div class="footer-col">
            <h4 class="footer-heading">Product</h4>
            <a href="#features">Features</a>
            <router-link to="/changelog">Changelog</router-link>
            <a href="#pricing">Pricing</a>
          </div>
          <div class="footer-col">
            <h4 class="footer-heading">Resources</h4>
            <router-link to="/docs">Documentation</router-link>
            <router-link to="/docs/quickstart">Quick Start</router-link>
            <a href="https://github.com/QrCommunication/claudenest" target="_blank" rel="noopener">GitHub</a>
          </div>
          <div class="footer-col">
            <h4 class="footer-heading">Legal</h4>
            <router-link to="/docs/terms">Terms</router-link>
            <router-link to="/docs/privacy">Privacy</router-link>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; {{ new Date().getFullYear() }} ClaudeNest. MIT License.</span>
        <a href="https://github.com/QrCommunication/claudenest" target="_blank" rel="noopener noreferrer" class="footer-github">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';

const mobileOpen = ref(false);
const copied = ref(false);
const isScrolled = ref(false);

const INSTALL_CMD = 'curl -fsSL https://claudenest.io/install-agent.sh | bash';

function copyInstall() {
  navigator.clipboard.writeText(INSTALL_CMD);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

function onScroll() {
  isScrolled.value = window.scrollY > 32;
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));

// Terminal animation lines
const terminalLines = [
  { delay: 0.3, prefix: '$ ', prefixClass: 'text-green-400', text: 'curl -fsSL https://claudenest.io/install-agent.sh | bash', class: '' },
  { delay: 1.2, prefix: '', prefixClass: '', text: 'Installing @claudenest/agent...', class: 'text-muted' },
  { delay: 2.0, prefix: '', prefixClass: '', text: 'Agent v1.0.0 installed successfully!', class: 'text-green-400' },
  { delay: 2.8, prefix: '$ ', prefixClass: 'text-green-400', text: 'claudenest-agent pair', class: '' },
  { delay: 3.5, prefix: '', prefixClass: '', text: 'Pairing code: A7K2M9', class: 'text-brand-cyan' },
  { delay: 4.2, prefix: '', prefixClass: '', text: 'Machine paired! Starting agent...', class: 'text-brand-purple' },
  { delay: 5.0, prefix: '', prefixClass: '', text: '[Agent-1] auth.ts   [Agent-2] api.ts   [Agent-3] tests/', class: 'text-brand-indigo' },
  { delay: 5.5, prefix: '', prefixClass: '', text: 'All agents synced. Ready.', class: 'text-green-400' },
];

const stats = [
  { value: '5+', label: 'Concurrent agents' },
  { value: '384D', label: 'RAG embeddings' },
  { value: '<50ms', label: 'WebSocket latency' },
  { value: '100%', label: 'Open source' },
];

const agents = [
  { name: 'Agent-1', file: 'src/auth.ts', status: 'writing', color: '#a855f7' },
  { name: 'Agent-2', file: 'src/api/routes.ts', status: 'reading', color: '#22d3ee' },
  { name: 'Agent-3', file: 'tests/auth.test.ts', status: 'testing', color: '#6366f1' },
];

const steps = [
  { num: 1, title: 'Install', desc: 'One command installs the agent on macOS, Linux, or Windows WSL.', cmd: 'curl -fsSL https://claudenest.io/install-agent.sh | bash' },
  { num: 2, title: 'Pair', desc: 'Link your machine with a 6-character code. Secure, instant.', cmd: 'claudenest-agent pair' },
  { num: 3, title: 'Control', desc: 'Open the dashboard. Launch sessions, coordinate agents, ship code.', cmd: null },
];
</script>

<style scoped>
/* ================================================================
   DESIGN TOKENS (scoped)
   ================================================================ */
.landing {
  --nav-h: 64px;
  --section-px: clamp(1rem, 5vw, 4rem);
  --section-py: clamp(4rem, 8vw, 8rem);
  --max-w: 1400px;
  background-color: var(--bg-primary, #0f0f1a);
  color: var(--text-primary, #e2e8f0);
  overflow-x: hidden;
}

/* ================================================================
   NAVIGATION
   ================================================================ */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--nav-h);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.nav.scrolled {
  background-color: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border, rgba(59, 66, 97, 0.5));
}

.nav-inner {
  width: 100%;
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 var(--section-px);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-links {
  display: none;
  gap: 2rem;
}

@media (min-width: 768px) {
  .nav-links { display: flex; }
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #94a3b8);
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.nav-link:hover {
  color: var(--text-primary, #e2e8f0);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-primary-sm {
  padding: 0.5rem 1.25rem;
  background: var(--accent-purple, #a855f7);
  color: white;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-primary-sm:hover {
  background: rgba(168, 85, 247, 0.9);
  box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);
}

.mobile-menu-btn {
  display: flex;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

@media (min-width: 768px) {
  .mobile-menu-btn { display: none; }
}

.mobile-menu {
  position: absolute;
  top: var(--nav-h);
  left: 0;
  right: 0;
  background: rgba(15, 15, 26, 0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  padding: 1rem var(--section-px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mobile-link {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.5rem 0;
}

.mobile-ctas {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.slide-down-enter-active { transition: all 0.2s ease-out; }
.slide-down-leave-active { transition: all 0.15s ease-in; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ================================================================
   HERO
   ================================================================ */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: calc(var(--nav-h) + 2rem) var(--section-px) 4rem;
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.mesh-gradient {
  position: absolute;
  width: 150%;
  height: 150%;
  top: -25%;
  left: -25%;
  background:
    radial-gradient(ellipse 600px 400px at 20% 30%, rgba(168, 85, 247, 0.15), transparent),
    radial-gradient(ellipse 500px 500px at 80% 60%, rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(ellipse 400px 300px at 60% 20%, rgba(34, 211, 238, 0.08), transparent);
  animation: mesh-drift 20s ease-in-out infinite alternate;
}

@keyframes mesh-drift {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-30px, 20px) rotate(2deg); }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.hero-content {
  max-width: var(--max-w);
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }
}

.hero-copy {
  display: flex;
  flex-direction: column;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  background: var(--glass-bg, rgba(255,255,255,0.05));
  border: 1px solid var(--border, rgba(59, 66, 97, 0.5));
  font-size: 0.8rem;
  color: var(--text-secondary);
  width: fit-content;
  margin-bottom: 1.5rem;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1.5rem;
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 520px;
}

/* Install Block */
.install-block {
  background: rgba(15, 15, 26, 0.6);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 2rem;
}

.install-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
  background: rgba(36, 40, 59, 0.3);
}

.install-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.copy-btn {
  display: flex;
  padding: 0.25rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  color: var(--text-primary);
  background: rgba(168, 85, 247, 0.1);
}

.install-cmd {
  display: block;
  padding: 0.875rem 1rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  color: #22d3ee;
  word-break: break-all;
}

/* Hero CTAs */
.hero-ctas {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.875rem 2rem;
  background: var(--accent-purple, #a855f7);
  color: white;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-primary:hover {
  background: rgba(168, 85, 247, 0.9);
  box-shadow: 0 8px 30px rgba(168, 85, 247, 0.3);
  transform: translateY(-1px);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 0.875rem 2rem;
  background: var(--glass-bg, rgba(255,255,255,0.05));
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-ghost:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(168, 85, 247, 0.3);
}

.btn-lg {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.hero-micro {
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.7;
}

/* Hero Terminal */
.hero-terminal {
  position: relative;
}

.terminal-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(ellipse at center, rgba(168, 85, 247, 0.12), transparent 70%);
  filter: blur(40px);
  border-radius: 2rem;
}

.terminal-window {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--border);
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  background: rgba(26, 27, 38, 0.8);
}

.terminal-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.terminal-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.terminal-body {
  padding: 1.25rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  line-height: 1.8;
  min-height: 280px;
}

.term-line {
  opacity: 0;
  animation: line-appear 0.4s ease-out forwards;
}

.text-muted {
  color: var(--text-muted, #64748b);
}

@keyframes line-appear {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.cursor-line {
  opacity: 0;
  animation: line-appear 0.3s ease-out forwards;
  display: flex;
  gap: 0.5rem;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
  color: var(--text-primary);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ================================================================
   STATS BAR
   ================================================================ */
.stats-bar {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: rgba(26, 27, 38, 0.4);
  padding: 2rem var(--section-px);
}

.stats-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 3rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a855f7, #6366f1, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* ================================================================
   SECTIONS SHARED
   ================================================================ */
.section {
  padding: var(--section-py) var(--section-px);
}

.section-alt {
  background: rgba(26, 27, 38, 0.3);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.section-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--accent-purple, #a855f7);
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.section-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ================================================================
   BENTO GRID
   ================================================================ */
.bento-grid {
  max-width: var(--max-w);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento-lg {
    grid-row: span 1;
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .bento-lg {
    grid-column: span 2;
  }
}

.bento-card {
  background: rgba(26, 27, 38, 0.6);
  border: 1px solid var(--border, rgba(59, 66, 97, 0.5));
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  overflow: hidden;
}

.bento-card:hover {
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.bento-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.bento-icon--purple { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
.bento-icon--cyan { background: rgba(34, 211, 238, 0.12); color: #22d3ee; }
.bento-icon--indigo { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.bento-icon--yellow { background: rgba(251, 191, 36, 0.12); color: #fbbf24; }
.bento-icon--green { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.bento-icon--pink { background: rgba(236, 72, 153, 0.12); color: #ec4899; }

.bento-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.bento-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.bento-visual {
  margin-top: 1.25rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.bento-visual--terminal {
  background: rgba(15, 15, 26, 0.6);
  border: 1px solid var(--border);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.mini-terminal {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.8;
}

.mini-line {
  color: var(--text-secondary);
}

.bento-visual--agents {
  background: rgba(15, 15, 26, 0.6);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}

.agent-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  padding: 0.35rem 0;
  font-family: 'JetBrains Mono', monospace;
}

.agent-row + .agent-row {
  border-top: 1px solid rgba(59, 66, 97, 0.3);
}

.agent-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.agent-name {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 60px;
}

.agent-file {
  color: var(--text-secondary);
  flex: 1;
}

.agent-status {
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
}

/* ================================================================
   STEPS
   ================================================================ */
.steps-row {
  max-width: var(--max-w);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .steps-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 3rem;
  }
}

.step {
  position: relative;
  text-align: center;
}

.step-num {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: white;
  font-size: 1.25rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);
}

.step-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.step-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.step-cmd {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(15, 15, 26, 0.6);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #22d3ee;
}

.step-connector {
  display: none;
}

@media (min-width: 768px) {
  .step-connector {
    display: block;
    position: absolute;
    top: 28px;
    left: calc(50% + 36px);
    width: calc(100% - 72px);
    height: 2px;
    background: linear-gradient(90deg, rgba(168, 85, 247, 0.4), rgba(99, 102, 241, 0.1));
  }
}

/* ================================================================
   CTA SECTION
   ================================================================ */
.cta-section {
  padding: var(--section-py) var(--section-px);
}

.cta-card {
  position: relative;
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 4rem 2rem;
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, 0.2);
  text-align: center;
}

.cta-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(168, 85, 247, 0.1), transparent 60%),
    radial-gradient(ellipse at 70% 50%, rgba(99, 102, 241, 0.08), transparent 60%);
}

.cta-content {
  position: relative;
}

.cta-title {
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.cta-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* ================================================================
   FOOTER
   ================================================================ */
.footer {
  border-top: 1px solid var(--border);
  padding: 3rem var(--section-px) 1.5rem;
}

.footer-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .footer-inner {
    grid-template-columns: 2fr 3fr;
  }
}

.footer-brand {
  max-width: 280px;
}

.footer-tagline {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.75rem;
  line-height: 1.6;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-heading {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.footer-col a {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.footer-col a:hover {
  color: var(--text-primary);
}

.footer-bottom {
  max-width: var(--max-w);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.footer-github {
  color: var(--text-secondary);
  transition: color 0.2s;
}

.footer-github:hover {
  color: var(--accent-purple, #a855f7);
}

/* ================================================================
   SHARED UTILITIES
   ================================================================ */
.gradient-text {
  background: linear-gradient(135deg, #a855f7, #6366f1, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .mesh-gradient,
  .term-line,
  .cursor-blink,
  .badge-dot {
    animation: none !important;
  }

  .term-line {
    opacity: 1;
  }
}
</style>
