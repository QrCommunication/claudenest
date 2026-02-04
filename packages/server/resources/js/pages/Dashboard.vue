<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1>Dashboard</h1>
      <p class="subtitle">Welcome to ClaudeNest</p>
    </div>
    
    <div class="quick-links">
      <router-link to="/machines" class="quick-card">
        <div class="quick-icon machines">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
        </div>
        <h3>Machines</h3>
        <p>Manage your connected machines</p>
      </router-link>
      
      <router-link to="/sessions" class="quick-card">
        <div class="quick-icon sessions">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <h3>Sessions</h3>
        <p>View active sessions</p>
      </router-link>
      
      <router-link to="/projects" class="quick-card">
        <div class="quick-icon projects">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <h3>Projects</h3>
        <p>Manage shared projects</p>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  @apply p-6;
}

.page-header {
  @apply mb-8;
}

.page-header h1 {
  @apply text-3xl font-bold text-white;
}

.subtitle {
  @apply text-gray-400 mt-1;
}

.quick-links {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.quick-card {
  @apply flex flex-col items-center text-center p-6 bg-dark-2 rounded-xl border border-dark-4;
  @apply hover:border-brand-purple/50 transition-all duration-200;
  text-decoration: none;
}

.quick-icon {
  @apply w-16 h-16 rounded-2xl flex items-center justify-center mb-4;
}

.quick-icon svg {
  @apply w-8 h-8;
}

.quick-icon.machines {
  @apply bg-brand-purple/10 text-brand-purple;
}

.quick-icon.sessions {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.quick-icon.projects {
  @apply bg-brand-indigo/10 text-brand-indigo;
}

.quick-card h3 {
  @apply text-xl font-semibold text-white mb-2;
}

.quick-card p {
  @apply text-gray-400;
}
</style>
