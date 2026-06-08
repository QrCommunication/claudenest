<template>
  <article class="api-content">
    <header class="doc-header">
      <h1>{{ category?.title || $t('docDocsApireference.headerTitle') }}</h1>
      <p class="lead">{{ category?.description || $t('docDocsApireference.headerLead') }}</p>
    </header>

    <!-- Category Navigation -->
    <nav class="category-nav" aria-label="API categories">
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
        :method="endpoint.method"
        :path="endpoint.path"
        :description="endpoint.description"
        :params="endpoint.params"
        :responses="endpoint.response ? [{ status: 200, description: 'Success', body: endpoint.response }] : undefined"
      />
    </div>

    <!-- Error Codes Reference -->
    <section v-if="currentCategory === 'health'" class="error-codes-section">
      <h2 id="error-codes">{{ $t('docDocsApireference.errorCodesTitle') }}</h2>
      <p>{{ $t('docDocsApireference.errorCodesIntro') }}</p>

      <div class="error-table-wrapper">
        <table class="error-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsApireference.thCode') }}</th>
              <th>{{ $t('docDocsApireference.thMessage') }}</th>
              <th>{{ $t('docDocsApireference.thHttp') }}</th>
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
      </div>
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
  max-width: 720px;
}

/* Header */
.doc-header {
  margin-bottom: 1.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.doc-header h1 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.lead {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
  max-width: 65ch;
}

/* Category Navigation */
.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 1.5rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border-color);
}

.category-link {
  padding: 0.35rem 0.65rem;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 5px;
  font-size: 0.82rem;
  transition: color 0.15s ease, background 0.15s ease;
  white-space: nowrap;
}

.category-link:hover {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
}

.category-link.is-active {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  font-weight: 500;
}

/* Endpoints */
.endpoints {
  margin-top: 0.5rem;
}

/* Error Codes Section */
.error-codes-section {
  margin-top: 2.5rem;
  padding-top: 1.75rem;
  border-top: 1px solid var(--border-color);
}

.error-codes-section h2 {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.error-codes-section p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.7;
}

.error-table-wrapper {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.error-table th,
.error-table td {
  padding: 0.6rem 0.85rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.error-table tr:last-child td {
  border-bottom: none;
}

.error-table th {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-color);
}

.error-table td {
  color: var(--text-secondary);
}

.error-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: #f87171;
  background: rgba(239, 68, 68, 0.08);
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
}

.http-badge {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  background: rgba(59, 130, 246, 0.08);
  color: #60a5fa;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 1.5rem;
  }

  .category-nav {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 0.5rem 0;
  }

  .error-table {
    font-size: 0.75rem;
  }

  .error-table th,
  .error-table td {
    padding: 0.45rem 0.6rem;
  }
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .category-link {
    transition: none;
  }
}
</style>
