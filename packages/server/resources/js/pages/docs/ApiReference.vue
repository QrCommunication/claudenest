<template>
  <article class="api-content">
    <header class="doc-header">
      <h1>{{ category?.title || 'API Reference' }}</h1>
      <p class="lead">{{ category?.description || 'Complete API documentation' }}</p>
    </header>

    <!-- Category Navigation -->
    <nav class="category-nav">
      <router-link
        v-for="cat in apiCategories"
        :key="cat.id"
        :to="`/docs/api/${cat.id}`"
        class="category-link"
        :class="{ 'is-active': cat.id === currentCategory }"
      >
        {{ cat.title }}
      </router-link>
    </nav>

    <!-- Endpoints -->
    <div v-if="category" class="endpoints">
      <EndpointCard
        v-for="(endpoint, index) in category.endpoints"
        :key="index"
        :endpoint="endpoint"
      />
    </div>

    <!-- Error Codes Reference -->
    <section v-if="currentCategory === 'health'" class="error-codes-section">
      <h2>Error Codes Reference</h2>
      <p>All API errors follow a consistent format with error codes:</p>
      
      <table class="error-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Message</th>
            <th>HTTP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="error in errorCodes" :key="error.code">
            <td><code>{{ error.code }}</code></td>
            <td>{{ error.message }}</td>
            <td><span class="http-badge">{{ error.http }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDocs } from '@/composables/useDocs';
import EndpointCard from '@/components/docs/EndpointCard.vue';

const route = useRoute();
const { apiCategories, errorCodes, getCategoryById } = useDocs();

const currentCategory = computed(() => route.params.category as string);

const category = computed(() => {
  return getCategoryById(currentCategory.value);
});
</script>

<style scoped>
.api-content {
  max-width: 900px;
}

.doc-header {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Category Navigation */
.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.category-link {
  padding: 0.5rem 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.15s;
  white-space: nowrap;
}

.category-link:hover {
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  color: var(--text-primary);
}

.category-link.is-active {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  font-weight: 500;
}

/* Endpoints */
.endpoints {
  margin-top: 2rem;
}

/* Error Codes Section */
.error-codes-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color, var(--border));
}

.error-codes-section h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
}

.error-codes-section p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.error-table th,
.error-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.error-table th {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.error-table td {
  color: var(--text-secondary);
}

.error-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.http-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
  
  .category-nav {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 0.75rem;
  }
  
  .error-table {
    font-size: 0.8rem;
  }
  
  .error-table th,
  .error-table td {
    padding: 0.5rem;
  }
}
</style>
