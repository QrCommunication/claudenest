<template>
  <div class="toc">
    <h3 class="toc-title">On this page</h3>
    <nav class="toc-nav">
      <a
        v-for="heading in headings"
        :key="heading.id"
        :href="`#${heading.id}`"
        class="toc-link"
        :class="{
          'is-active': activeHeading === heading.id,
          [`level-${heading.level}`]: true
        }"
        @click.prevent="scrollToHeading(heading.id)"
      >
        {{ heading.text }}
      </a>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';

interface Heading {
  id: string;
  text: string;
  level: number;
}

const route = useRoute();
const headings = ref<Heading[]>([]);
const activeHeading = ref<string>('');

const extractHeadings = () => {
  nextTick(() => {
    const article = document.querySelector('.doc-content, .api-content');
    if (!article) return;

    const headingElements = article.querySelectorAll('h2, h3');
    headings.value = Array.from(headingElements)
      .filter(el => el.id)
      .map((el) => ({
        id: el.id,
        text: el.textContent || '',
        level: parseInt(el.tagName.charAt(1)),
      }));
  });
};

const scrollToHeading = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80;
    const top = element.offsetTop - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    activeHeading.value = id;
  }
};

const observerCallback: IntersectionObserverCallback = (entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      activeHeading.value = entry.target.id;
    }
  });
};

let observer: IntersectionObserver | null = null;

const setupObserver = () => {
  observer = new IntersectionObserver(observerCallback, {
    rootMargin: '-80px 0px -66%',
    threshold: 0,
  });

  headings.value.forEach((heading) => {
    const element = document.getElementById(heading.id);
    if (element) {
      observer?.observe(element);
    }
  });
};

onMounted(() => {
  extractHeadings();
  setupObserver();
});

onUnmounted(() => {
  observer?.disconnect();
});

watch(() => route.path, () => {
  observer?.disconnect();
  extractHeadings();
  setTimeout(setupObserver, 100);
});
</script>

<style scoped>
.toc {
  position: sticky;
  top: 76px;
}

.toc-title {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toc-link {
  display: block;
  padding: 0.25rem 0 0.25rem 0.65rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.78rem;
  line-height: 1.4;
  border-left: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.toc-link:hover {
  color: var(--text-secondary);
}

.toc-link.is-active {
  color: #3b82f6;
  border-left-color: #3b82f6;
}

.toc-link.level-2 {
  font-weight: 500;
}

.toc-link.level-3 {
  padding-left: 1.15rem;
  font-size: 0.75rem;
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .toc-link {
    transition: none;
  }
}
</style>
