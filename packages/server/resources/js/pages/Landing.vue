<template>
  <div class="min-h-screen bg-dark-1">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-dark-1/80 backdrop-blur-xl border-b border-dark-4/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <Logo variant="full" size="md" to="/" />

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-6">
            <a href="#features" class="text-dark-4 hover:text-white transition-colors cursor-pointer">
              {{ $t('landing.features.title_highlight') }}
            </a>
            <a href="#how-it-works" class="text-dark-4 hover:text-white transition-colors cursor-pointer">
              How It Works
            </a>
            <a href="#comparison" class="text-dark-4 hover:text-white transition-colors cursor-pointer">
              Compare
            </a>
            <router-link to="/docs" class="text-dark-4 hover:text-white transition-colors cursor-pointer">
              {{ $t('docs.title') }}
            </router-link>
            <a
              href="https://github.com/claudenest/claudenest"
              target="_blank"
              rel="noopener noreferrer"
              class="text-dark-4 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>

          <!-- Right Side -->
          <div class="flex items-center gap-3">
            <ThemeToggle variant="ghost" />
            <LanguageSwitcher variant="ghost" :show-label="false" />

            <!-- Mobile Menu Button -->
            <button
              class="md:hidden p-2 text-dark-4 hover:text-white transition-colors cursor-pointer"
              @click="mobileMenuOpen = !mobileMenuOpen"
              aria-label="Toggle mobile menu"
            >
              <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="hidden sm:flex items-center gap-3 ml-4">
              <router-link
                to="/login"
                class="text-dark-4 hover:text-white transition-colors font-medium cursor-pointer"
              >
                {{ $t('common.login') }}
              </router-link>
              <router-link
                to="/register"
                class="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-brand-purple/25 cursor-pointer"
              >
                {{ $t('landing.hero.cta_primary') }}
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
          <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-dark-4/50 mt-2 pt-4">
            <div class="flex flex-col gap-3">
              <a href="#features" class="text-dark-4 hover:text-white transition-colors px-2 py-1 cursor-pointer" @click="mobileMenuOpen = false">
                {{ $t('landing.features.title_highlight') }}
              </a>
              <a href="#how-it-works" class="text-dark-4 hover:text-white transition-colors px-2 py-1 cursor-pointer" @click="mobileMenuOpen = false">
                How It Works
              </a>
              <a href="#comparison" class="text-dark-4 hover:text-white transition-colors px-2 py-1 cursor-pointer" @click="mobileMenuOpen = false">
                Compare
              </a>
              <router-link to="/docs" class="text-dark-4 hover:text-white transition-colors px-2 py-1 cursor-pointer">
                {{ $t('docs.title') }}
              </router-link>
              <div class="flex items-center gap-3 pt-3 border-t border-dark-4/50 sm:hidden">
                <router-link to="/login" class="text-dark-4 hover:text-white transition-colors font-medium cursor-pointer">
                  {{ $t('common.login') }}
                </router-link>
                <router-link to="/register" class="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-medium transition-colors cursor-pointer">
                  {{ $t('landing.hero.cta_primary') }}
                </router-link>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </nav>

    <main>
    <!-- Hero Section -->
    <section ref="heroSectionRef" class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Animated Background Orbs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div class="hero-orb hero-orb--purple"></div>
        <div class="hero-orb hero-orb--indigo"></div>
        <div class="hero-orb hero-orb--cyan"></div>
        <!-- Grid pattern overlay -->
        <div class="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>

      <div class="max-w-7xl mx-auto relative">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-dark-2/80 backdrop-blur-xl border border-dark-4/50 rounded-full mb-8 animate-fade-in">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span class="text-sm text-dark-4">Open Source &middot; Self-Hosted &middot; Free</span>
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            {{ $t('landing.hero.title') }}
            <span class="gradient-text block mt-2">{{ $t('landing.hero.title_highlight') }}</span>
          </h1>
          <p class="text-lg sm:text-xl text-dark-4 mb-10 max-w-2xl mx-auto leading-relaxed">
            {{ $t('landing.hero.subtitle') }}
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <router-link
              to="/register"
              class="w-full sm:w-auto px-8 py-3.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-semibold transition-all hover:scale-[1.03] shadow-lg shadow-brand-purple/25 hover:shadow-xl hover:shadow-brand-purple/30 cursor-pointer"
            >
              {{ $t('landing.hero.cta_primary') }}
            </router-link>
            <router-link
              to="/docs"
              class="w-full sm:w-auto px-8 py-3.5 bg-dark-2/80 backdrop-blur-xl hover:bg-dark-3 text-white rounded-lg font-semibold transition-all border border-dark-4 hover:border-dark-4/80 cursor-pointer"
            >
              {{ $t('landing.hero.cta_secondary') }}
            </router-link>
          </div>

          <!-- Social Proof -->
          <p class="text-sm text-dark-4/70 mb-12">
            Trusted by developers building with Claude Code worldwide
          </p>

          <!-- Animated Stats -->
          <div class="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-16">
            <div
              v-for="stat in heroStats"
              :key="stat.label"
              class="flex flex-col items-center"
            >
              <span class="text-2xl sm:text-3xl font-bold gradient-text tabular-nums">
                {{ stat.value }}
              </span>
              <span class="text-xs sm:text-sm text-dark-4 mt-1">{{ stat.label }}</span>
            </div>
            <div class="hidden sm:block w-px h-10 bg-dark-4/30" aria-hidden="true"></div>
            <div class="flex flex-col items-center">
              <span class="text-2xl sm:text-3xl font-bold text-green-400">100%</span>
              <span class="text-xs sm:text-sm text-dark-4 mt-1">Open Source</span>
            </div>
          </div>
        </div>

        <!-- Hero Terminal -->
        <div class="relative max-w-4xl mx-auto">
          <!-- Glow effect behind terminal -->
          <div class="absolute -inset-4 bg-gradient-to-r from-brand-purple/20 via-brand-indigo/10 to-brand-cyan/20 rounded-2xl blur-2xl opacity-50" aria-hidden="true"></div>
          <div class="relative bg-dark-2/80 backdrop-blur-xl rounded-xl border border-dark-4/50 shadow-2xl overflow-hidden">
            <!-- Terminal Header -->
            <div class="flex items-center gap-2 px-4 py-3 bg-dark-3/80 border-b border-dark-4/50">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span class="text-sm text-dark-4 ml-2 font-mono">claude@remote ~ </span>
            </div>
            <!-- Terminal Content -->
            <div class="p-6 font-mono text-sm leading-relaxed">
              <div class="text-green-400">$ claudenest connect my-server</div>
              <div class="text-dark-4 mt-2">Connecting to my-server...</div>
              <div class="text-brand-cyan mt-1">Connected! Starting Claude Code session...</div>
              <div class="mt-4 text-white">
                <span class="text-brand-purple">Claude</span> &gt; Hello! I'm ready to help with your project.
              </div>
              <div class="mt-2 text-dark-4">
                Working directory: ~/projects/my-app
              </div>
              <div class="text-dark-4 mt-1">
                Context: 384D vector embeddings loaded (pgvector)
              </div>
              <div class="text-dark-4 mt-1">
                Agents online: 3 &middot; File locks: 2 active
              </div>
              <div class="mt-4 flex items-center">
                <span class="text-brand-purple">You</span>
                <span class="text-white ml-2">&gt;</span>
                <span class="ml-2 text-white terminal-cursor">|</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 px-4 sm:px-6 lg:px-8 bg-dark-2/50 relative">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">Capabilities</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {{ $t('landing.features.title') }}
            <span class="gradient-text">{{ $t('landing.features.title_highlight') }}</span>
          </h2>
          <p class="text-lg text-dark-4 max-w-2xl mx-auto">
            Everything you need to orchestrate AI agents at scale, from a single dashboard.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Feature 1: Remote Access -->
          <div class="group bg-dark-2/80 backdrop-blur-xl p-6 rounded-xl border border-dark-4/50 hover:border-brand-purple/50 transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 bg-brand-purple/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-purple/20 transition-colors">
              <svg class="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.remote_access.title') }}</h3>
            <p class="text-dark-4 leading-relaxed">{{ $t('landing.features.remote_access.description') }}</p>
          </div>

          <!-- Feature 2: Multi-Agent -->
          <div class="group bg-dark-2/80 backdrop-blur-xl p-6 rounded-xl border border-dark-4/50 hover:border-brand-cyan/50 transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-cyan/20 transition-colors">
              <svg class="w-6 h-6 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.multi_agent.title') }}</h3>
            <p class="text-dark-4 leading-relaxed">{{ $t('landing.features.multi_agent.description') }}</p>
          </div>

          <!-- Feature 3: Context RAG -->
          <div class="group bg-dark-2/80 backdrop-blur-xl p-6 rounded-xl border border-dark-4/50 hover:border-brand-indigo/50 transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 bg-brand-indigo/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-indigo/20 transition-colors">
              <svg class="w-6 h-6 text-brand-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.context_rag.title') }}</h3>
            <p class="text-dark-4 leading-relaxed">{{ $t('landing.features.context_rag.description') }}</p>
          </div>

          <!-- Feature 4: Real-time -->
          <div class="group bg-dark-2/80 backdrop-blur-xl p-6 rounded-xl border border-dark-4/50 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.real_time.title') }}</h3>
            <p class="text-dark-4 leading-relaxed">{{ $t('landing.features.real_time.description') }}</p>
          </div>

          <!-- Feature 5: File Locking -->
          <div class="group bg-dark-2/80 backdrop-blur-xl p-6 rounded-xl border border-dark-4/50 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
              <svg class="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.file_locking.title') }}</h3>
            <p class="text-dark-4 leading-relaxed">{{ $t('landing.features.file_locking.description') }}</p>
          </div>

          <!-- Feature 6: MCP Support -->
          <div class="group bg-dark-2/80 backdrop-blur-xl p-6 rounded-xl border border-dark-4/50 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
              <svg class="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ $t('landing.features.mcp_support.title') }}</h3>
            <p class="text-dark-4 leading-relaxed">{{ $t('landing.features.mcp_support.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-brand-cyan uppercase tracking-wider mb-3">Getting Started</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Up and running in
            <span class="gradient-text">three steps</span>
          </h2>
          <p class="text-lg text-dark-4 max-w-2xl mx-auto">
            From installation to full multi-agent orchestration in minutes, not hours.
          </p>
        </div>

        <div class="relative">
          <!-- Connecting Line (Desktop) -->
          <div class="hidden lg:block absolute top-24 left-[16.66%] right-[16.66%] h-px" aria-hidden="true">
            <div class="w-full h-full bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-cyan opacity-30"></div>
          </div>

          <div class="grid lg:grid-cols-3 gap-12 lg:gap-8">
            <!-- Step 1 -->
            <div class="relative text-center group">
              <div class="relative z-10 w-16 h-16 mx-auto mb-6 bg-dark-2/80 backdrop-blur-xl rounded-2xl border border-dark-4/50 flex items-center justify-center group-hover:border-brand-purple/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand-purple/10">
                <!-- Terminal Icon -->
                <svg class="w-7 h-7 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="absolute -top-2 -right-2 w-6 h-6 bg-brand-purple text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
              </div>
              <h3 class="text-xl font-semibold text-white mb-3">Install the Agent</h3>
              <p class="text-dark-4 leading-relaxed mb-4">
                One command to connect your machine to the ClaudeNest platform.
              </p>
              <div class="inline-block bg-dark-2/80 backdrop-blur-xl rounded-lg border border-dark-4/50 px-4 py-2 font-mono text-sm text-brand-cyan">
                npm i -g @claudenest/agent
              </div>
            </div>

            <!-- Step 2 -->
            <div class="relative text-center group">
              <div class="relative z-10 w-16 h-16 mx-auto mb-6 bg-dark-2/80 backdrop-blur-xl rounded-2xl border border-dark-4/50 flex items-center justify-center group-hover:border-brand-indigo/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand-indigo/10">
                <!-- Screen Icon -->
                <svg class="w-7 h-7 text-brand-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span class="absolute -top-2 -right-2 w-6 h-6 bg-brand-indigo text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
              </div>
              <h3 class="text-xl font-semibold text-white mb-3">Start a Session</h3>
              <p class="text-dark-4 leading-relaxed mb-4">
                Launch Claude Code remotely from any device -- web, mobile, or CLI.
              </p>
              <div class="inline-flex items-center gap-2 bg-dark-2/80 backdrop-blur-xl rounded-lg border border-dark-4/50 px-4 py-2">
                <span class="relative flex h-2 w-2">
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span class="font-mono text-sm text-green-400">Session active</span>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="relative text-center group">
              <div class="relative z-10 w-16 h-16 mx-auto mb-6 bg-dark-2/80 backdrop-blur-xl rounded-2xl border border-dark-4/50 flex items-center justify-center group-hover:border-brand-cyan/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand-cyan/10">
                <!-- Network Icon -->
                <svg class="w-7 h-7 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span class="absolute -top-2 -right-2 w-6 h-6 bg-brand-cyan text-dark-1 text-xs font-bold rounded-full flex items-center justify-center">3</span>
              </div>
              <h3 class="text-xl font-semibold text-white mb-3">Orchestrate</h3>
              <p class="text-dark-4 leading-relaxed mb-4">
                Coordinate multiple agents with shared context, task claiming, and file locks.
              </p>
              <div class="inline-flex items-center gap-3 bg-dark-2/80 backdrop-blur-xl rounded-lg border border-dark-4/50 px-4 py-2">
                <div class="flex -space-x-2" aria-hidden="true">
                  <div class="w-6 h-6 rounded-full bg-brand-purple/30 border-2 border-dark-2 flex items-center justify-center">
                    <span class="text-[10px] text-brand-purple font-bold">A</span>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-brand-indigo/30 border-2 border-dark-2 flex items-center justify-center">
                    <span class="text-[10px] text-brand-indigo font-bold">B</span>
                  </div>
                  <div class="w-6 h-6 rounded-full bg-brand-cyan/30 border-2 border-dark-2 flex items-center justify-center">
                    <span class="text-[10px] text-brand-cyan font-bold">C</span>
                  </div>
                </div>
                <span class="font-mono text-sm text-dark-4">3 agents synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Table Section -->
    <section id="comparison" class="py-24 px-4 sm:px-6 lg:px-8 bg-dark-2/50 relative">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-brand-indigo uppercase tracking-wider mb-3">Why ClaudeNest</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            See how we
            <span class="gradient-text">compare</span>
          </h2>
          <p class="text-lg text-dark-4 max-w-2xl mx-auto">
            The most complete orchestration platform built specifically for Claude Code.
          </p>
        </div>

        <!-- Mobile comparison (cards) -->
        <div class="lg:hidden space-y-4">
          <div
            v-for="feature in comparisonFeatures"
            :key="feature.name"
            class="bg-dark-2/80 backdrop-blur-xl rounded-xl border border-dark-4/50 p-4"
          >
            <h4 class="text-white font-medium mb-3">{{ feature.name }}</h4>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="tool in comparisonTools"
                :key="tool.name"
                class="flex items-center justify-between px-3 py-2 rounded-lg"
                :class="tool.name === 'ClaudeNest' ? 'bg-brand-purple/10 border border-brand-purple/30' : 'bg-dark-3/50'"
              >
                <span class="text-sm" :class="tool.name === 'ClaudeNest' ? 'text-brand-purple font-medium' : 'text-dark-4'">{{ tool.name }}</span>
                <component
                  :is="getComparisonIcon(feature.values[tool.key])"
                  class="w-5 h-5 flex-shrink-0"
                  :class="getComparisonColor(feature.values[tool.key])"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop comparison table -->
        <div class="hidden lg:block">
          <div class="bg-dark-2/80 backdrop-blur-xl rounded-xl border border-dark-4/50 overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="border-b border-dark-4/50">
                  <th class="text-left py-4 px-6 text-sm font-medium text-dark-4">Feature</th>
                  <th
                    v-for="tool in comparisonTools"
                    :key="tool.name"
                    class="py-4 px-6 text-sm font-medium text-center"
                    :class="tool.name === 'ClaudeNest' ? 'text-brand-purple bg-brand-purple/5 border-x border-brand-purple/20' : 'text-dark-4'"
                  >
                    <span :class="tool.name === 'ClaudeNest' ? 'font-bold text-base' : ''">{{ tool.name }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(feature, idx) in comparisonFeatures"
                  :key="feature.name"
                  :class="idx !== comparisonFeatures.length - 1 ? 'border-b border-dark-4/30' : ''"
                  class="hover:bg-dark-3/30 transition-colors"
                >
                  <td class="py-4 px-6 text-sm text-white font-medium">{{ feature.name }}</td>
                  <td
                    v-for="tool in comparisonTools"
                    :key="tool.name"
                    class="py-4 px-6 text-center"
                    :class="tool.name === 'ClaudeNest' ? 'bg-brand-purple/5 border-x border-brand-purple/20' : ''"
                  >
                    <div class="flex justify-center">
                      <component
                        :is="getComparisonIcon(feature.values[tool.key])"
                        class="w-5 h-5"
                        :class="getComparisonColor(feature.values[tool.key])"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">What Developers Say</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Loved by
            <span class="gradient-text">developers</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="testimonial in testimonials"
            :key="testimonial.name"
            class="bg-dark-2/80 backdrop-blur-xl p-6 rounded-xl border border-dark-4/50 hover:border-brand-purple/30 transition-all duration-300"
          >
            <!-- Quote mark -->
            <svg class="w-8 h-8 text-brand-purple/30 mb-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z"/>
            </svg>
            <p class="text-white leading-relaxed mb-6">{{ testimonial.quote }}</p>
            <div class="flex items-center gap-3">
              <!-- Avatar placeholder -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                :class="testimonial.avatarClass"
              >
                {{ testimonial.initials }}
              </div>
              <div>
                <p class="text-white text-sm font-medium">{{ testimonial.name }}</p>
                <p class="text-dark-4 text-xs">{{ testimonial.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Open Source Section -->
    <section class="py-24 px-4 sm:px-6 lg:px-8 bg-dark-2/50">
      <div class="max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-dark-3/80 rounded-full border border-dark-4/50 mb-6">
          <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span class="text-white font-medium">{{ $t('landing.open_source.title') }}</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          {{ $t('landing.open_source.description') }}
        </h2>
        <p class="text-lg text-dark-4 mb-8 max-w-2xl mx-auto">
          Inspect every line, contribute features, and self-host on your own infrastructure. No vendor lock-in, ever.
        </p>
        <a
          href="https://github.com/claudenest/claudenest"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-dark-3/80 hover:bg-dark-4 text-white rounded-lg font-medium transition-all border border-dark-4/50 hover:border-dark-4 cursor-pointer"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          {{ $t('landing.open_source.github') }}
        </a>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-brand-indigo/5 to-brand-cyan/10"></div>
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-purple/10 rounded-full blur-[120px]"></div>
      </div>

      <div class="max-w-4xl mx-auto text-center relative">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to orchestrate your
          <span class="gradient-text block sm:inline">AI agents?</span>
        </h2>
        <p class="text-lg text-dark-4 mb-10 max-w-2xl mx-auto">
          Deploy ClaudeNest in minutes. Control Claude Code from anywhere. Coordinate teams of AI agents on a single project.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <router-link
            to="/register"
            class="w-full sm:w-auto px-10 py-4 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-semibold text-lg transition-all hover:scale-[1.03] shadow-lg shadow-brand-purple/25 hover:shadow-xl hover:shadow-brand-purple/30 cursor-pointer"
          >
            Get Started Free
          </router-link>
          <router-link
            to="/docs"
            class="w-full sm:w-auto px-10 py-4 bg-dark-2/80 backdrop-blur-xl hover:bg-dark-3 text-white rounded-lg font-semibold text-lg transition-all border border-dark-4 hover:border-dark-4/80 cursor-pointer"
          >
            Read the Docs
          </router-link>
        </div>
      </div>
    </section>
    </main>

    <!-- Footer -->
    <footer class="py-16 px-4 sm:px-6 lg:px-8 border-t border-dark-4/50 bg-dark-1">
      <div class="max-w-7xl mx-auto">
        <!-- Top: Logo + Link Columns -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <!-- Brand Column -->
          <div class="col-span-2 md:col-span-1">
            <Logo variant="full" size="sm" />
            <p class="text-dark-4 text-sm mt-3 max-w-xs leading-relaxed">
              Remote Claude Code orchestration platform. Open source and self-hosted.
            </p>
          </div>

          <!-- Product Links -->
          <div>
            <h4 class="text-white text-sm font-semibold mb-4">Product</h4>
            <ul class="space-y-2.5">
              <li>
                <a href="#features" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">Features</a>
              </li>
              <li>
                <a href="#how-it-works" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">How It Works</a>
              </li>
              <li>
                <a href="#comparison" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">Compare</a>
              </li>
              <li>
                <router-link to="/docs/resources/changelog" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">Changelog</router-link>
              </li>
            </ul>
          </div>

          <!-- Resources Links -->
          <div>
            <h4 class="text-white text-sm font-semibold mb-4">Resources</h4>
            <ul class="space-y-2.5">
              <li>
                <router-link to="/docs" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">
                  {{ $t('docs.title') }}
                </router-link>
              </li>
              <li>
                <router-link to="/docs/api/authentication" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">API Reference</router-link>
              </li>
              <li>
                <a href="https://github.com/claudenest/claudenest" target="_blank" rel="noopener noreferrer" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">GitHub</a>
              </li>
              <li>
                <a href="https://status.claudenest.dev" target="_blank" rel="noopener noreferrer" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">Status</a>
              </li>
            </ul>
          </div>

          <!-- Legal Links -->
          <div>
            <h4 class="text-white text-sm font-semibold mb-4">Legal</h4>
            <ul class="space-y-2.5">
              <li>
                <router-link to="/docs/terms" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">
                  {{ $t('auth.terms_of_service') }}
                </router-link>
              </li>
              <li>
                <router-link to="/docs/privacy" class="text-dark-4 text-sm hover:text-white transition-colors cursor-pointer">
                  {{ $t('auth.privacy_policy') }}
                </router-link>
              </li>
            </ul>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-dark-4/30 pt-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <!-- Copyright -->
            <p class="text-sm text-dark-4">
              {{ $t('landing.footer.copyright', { year: new Date().getFullYear() }) }}
            </p>

            <!-- Social Links -->
            <div class="flex items-center gap-4">
              <a
                href="https://github.com/claudenest/claudenest"
                target="_blank"
                rel="noopener noreferrer"
                class="text-dark-4 hover:text-white transition-colors cursor-pointer"
                aria-label="GitHub"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="https://x.com/claudenest"
                target="_blank"
                rel="noopener noreferrer"
                class="text-dark-4 hover:text-white transition-colors cursor-pointer"
                aria-label="X (Twitter)"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>

            <!-- Built With -->
            <div class="flex items-center gap-2 text-dark-4/50 text-xs">
              <span>Built with</span>
              <!-- Laravel -->
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-label="Laravel">
                <path d="M23.642 5.43a.364.364 0 01.014.1v5.149c0 .135-.073.26-.189.326l-4.323 2.49v4.934c0 .135-.073.26-.189.327l-9.03 5.2a.32.32 0 01-.085.042.199.199 0 01-.024.007.373.373 0 01-.19 0 .116.116 0 01-.024-.007.32.32 0 01-.086-.042l-9.03-5.2a.376.376 0 01-.188-.326V3.545c0-.033.005-.066.014-.098a.178.178 0 01.017-.052c.007-.015.017-.028.027-.042a.22.22 0 01.028-.037c.012-.012.025-.023.038-.033a.252.252 0 01.039-.028l4.512-2.6a.374.374 0 01.376 0l4.513 2.6a.252.252 0 01.038.028c.014.01.027.02.039.033a.22.22 0 01.028.037c.01.014.02.027.027.042a.178.178 0 01.017.052c.01.032.014.065.014.098v9.652l3.756-2.164V5.529c0-.033.004-.066.013-.098a.178.178 0 01.018-.052c.007-.015.017-.028.027-.042a.22.22 0 01.028-.037c.012-.012.025-.023.038-.033a.252.252 0 01.039-.028l4.513-2.6a.374.374 0 01.376 0l4.513 2.6c.014.008.027.018.038.028.014.01.027.02.039.033a.22.22 0 01.028.037z"/>
              </svg>
              <!-- Vue -->
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-label="Vue.js">
                <path d="M24 1.61h-9.94L12 5.16 9.94 1.61H0l12 20.78zM12 14.08L5.16 2.23h4.43L12 6.41l2.41-4.18h4.43z"/>
              </svg>
              <!-- PostgreSQL -->
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-label="PostgreSQL">
                <path d="M17.128 0a10.134 10.134 0 00-2.755.403l-.063.02A10.922 10.922 0 0012.6.258C11.422.238 10.41.524 9.594 1 8.79.721 7.122.24 5.364.336 4.14.403 2.804.775 1.814 1.82.827 2.865.305 4.482.415 6.682c.03.607.203 1.597.49 2.879s.69 2.783 1.193 4.152c.503 1.37 1.054 2.6 1.915 3.436.43.419 1.022.771 1.72.742.49-.02.933-.235 1.315-.552.186.245.385.352.566.451.228.125.45.21.68.266.413.103.861.143 1.37.06a2.94 2.94 0 001.002-.39v.286c-.042.96-.074 1.7.093 2.522.166.823.509 1.727 1.322 2.374.405.322.94.551 1.547.603.608.052 1.252-.07 1.862-.36 1.04-.495 2.028-1.402 2.897-2.866a.477.477 0 00.049-.136c.148-.589.188-1.072.192-1.647l.003-.066c.382-.31.622-.65.812-1.024.265-.52.413-1.11.512-1.755a4.498 4.498 0 00-.034-1.607c-.088-.378-.231-.674-.37-.963.082-.142.16-.285.232-.437.353-.748.483-1.56.397-2.368-.088-.823-.39-1.63-.89-2.287a.478.478 0 00-.038-.048c-1.095-1.216-2.376-1.645-3.543-1.844a7.83 7.83 0 00-1.576-.145z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';

const { t } = useI18n();

const mobileMenuOpen = ref(false);
const heroSectionRef = ref<HTMLElement | null>(null);

// ====================== HERO STATS ======================

interface HeroStat {
  value: string;
  label: string;
  target: number;
  suffix: string;
  prefix: string;
}

const heroStats = ref<HeroStat[]>([
  { value: '5+', label: 'Concurrent Agents', target: 5, suffix: '+', prefix: '' },
  { value: '384D', label: 'Vector Embeddings', target: 384, suffix: 'D', prefix: '' },
  { value: '<50ms', label: 'WebSocket Latency', target: 50, suffix: 'ms', prefix: '<' },
]);

let statsAnimated = false;
let animationFrameId: number | null = null;

function animateStats(): void {
  if (statsAnimated) return;
  statsAnimated = true;

  const duration = 1500;
  const start = performance.now();

  function step(timestamp: number): void {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

    heroStats.value = heroStats.value.map((stat) => ({
      ...stat,
      value: `${stat.prefix}${Math.round(stat.target * eased)}${stat.suffix}`,
    }));

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step);
    }
  }

  animationFrameId = requestAnimationFrame(step);
}

// Intersection observer for stats animation
let statsObserver: IntersectionObserver | null = null;

onMounted(() => {
  // Trigger stats animation when hero section is in view
  statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStats();
        }
      });
    },
    { threshold: 0.3 }
  );

  // Observe the hero section via template ref
  if (heroSectionRef.value) {
    statsObserver.observe(heroSectionRef.value);
  }
});

onUnmounted(() => {
  if (statsObserver) {
    statsObserver.disconnect();
  }
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});

// ====================== COMPARISON TABLE ======================

interface ComparisonTool {
  name: string;
  key: string;
}

const comparisonTools: ComparisonTool[] = [
  { name: 'ClaudeNest', key: 'claudenest' },
  { name: 'Claude-Flow', key: 'claudeflow' },
  { name: 'CrewAI', key: 'crewai' },
  { name: 'Remote-Code', key: 'remotecode' },
];

type ComparisonValue = 'yes' | 'no' | 'partial';

interface ComparisonFeature {
  name: string;
  values: Record<string, ComparisonValue>;
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    name: 'Multi-Agent Orchestration',
    values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'yes', remotecode: 'yes' },
  },
  {
    name: 'Web Dashboard',
    values: { claudenest: 'yes', claudeflow: 'no', crewai: 'yes', remotecode: 'yes' },
  },
  {
    name: 'Native Mobile App',
    values: { claudenest: 'yes', claudeflow: 'no', crewai: 'no', remotecode: 'yes' },
  },
  {
    name: 'pgvector RAG Context',
    values: { claudenest: 'yes', claudeflow: 'partial', crewai: 'no', remotecode: 'no' },
  },
  {
    name: 'File Locking System',
    values: { claudenest: 'yes', claudeflow: 'no', crewai: 'no', remotecode: 'yes' },
  },
  {
    name: 'Claude Code Specific',
    values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'no', remotecode: 'no' },
  },
  {
    name: 'WebSocket Real-time',
    values: { claudenest: 'yes', claudeflow: 'partial', crewai: 'no', remotecode: 'yes' },
  },
  {
    name: 'MCP Protocol Support',
    values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'no', remotecode: 'no' },
  },
  {
    name: 'Self-Hosted / Open Source',
    values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'partial', remotecode: 'no' },
  },
];

// SVG icon components for comparison
const CheckIcon = {
  render() {
    return h(
      'svg',
      { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'aria-label': 'Yes' },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2.5',
          d: 'M5 13l4 4L19 7',
        }),
      ]
    );
  },
};

const XIcon = {
  render() {
    return h(
      'svg',
      { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'aria-label': 'No' },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2.5',
          d: 'M6 18L18 6M6 6l12 12',
        }),
      ]
    );
  },
};

const PartialIcon = {
  render() {
    return h(
      'svg',
      { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'aria-label': 'Partial' },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2.5',
          d: 'M5 12h14',
        }),
      ]
    );
  },
};

function getComparisonIcon(value: ComparisonValue): typeof CheckIcon {
  if (value === 'yes') return CheckIcon;
  if (value === 'partial') return PartialIcon;
  return XIcon;
}

function getComparisonColor(value: ComparisonValue): string {
  if (value === 'yes') return 'text-green-400';
  if (value === 'partial') return 'text-yellow-400';
  return 'text-red-400/60';
}

// ====================== TESTIMONIALS ======================

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarClass: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'ClaudeNest changed how our team works with AI agents. Having multiple Claude instances coordinate on the same codebase with shared context is incredibly powerful.',
    name: 'Sarah M.',
    role: 'Staff Engineer at a Fortune 500 tech company',
    initials: 'SM',
    avatarClass: 'bg-brand-purple/20 text-brand-purple',
  },
  {
    quote:
      'Finally, real orchestration for Claude Code. The file locking and task coordination system means our agents never step on each other. A game-changer for our CI pipeline.',
    name: 'James K.',
    role: 'DevOps Lead at a fast-growing startup',
    initials: 'JK',
    avatarClass: 'bg-brand-indigo/20 text-brand-indigo',
  },
  {
    quote:
      'The RAG context system with pgvector is a game-changer. Each agent understands the full project context without us manually feeding it information. Self-hosting was trivial.',
    name: 'Alex R.',
    role: 'CTO at a DevOps-focused team',
    initials: 'AR',
    avatarClass: 'bg-brand-cyan/20 text-brand-cyan',
  },
];
</script>

<style scoped>
/* ====================== GRADIENT TEXT ====================== */
.gradient-text {
  background: linear-gradient(135deg, #a855f7 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ====================== ANIMATED GRADIENT ORBS ====================== */
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
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -20px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 15px) scale(0.95);
  }
}

@keyframes float-indigo {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-25px, 20px) scale(1.08);
  }
  66% {
    transform: translate(15px, -25px) scale(0.92);
  }
}

@keyframes float-cyan {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) translate(20px, -15px) scale(1.1);
  }
}

/* ====================== GRID PATTERN ====================== */
.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ====================== TERMINAL CURSOR ====================== */
.terminal-cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ====================== TABULAR NUMS ====================== */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* ====================== REDUCED MOTION ====================== */
@media (prefers-reduced-motion: reduce) {
  .hero-orb {
    animation: none !important;
  }

  .terminal-cursor {
    animation: none !important;
    opacity: 1;
  }

  .animate-ping {
    animation: none !important;
  }

  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
