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
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
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
  // Wait for DOM to update
  nextTick(() => {
    const article = document.querySelector('.doc-content, .api-content');
    if (!article) return;

    const headingElements = article.querySelectorAll('h2, h3, h4');
    headings.value = Array.from(headingElements).map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: parseInt(el.tagName.charAt(1)),
    }));
  });
};

const scrollToHeading = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 100; // Account for fixed header
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
    rootMargin: '-100px 0px -66%',
    threshold: 0,
  });

  headings.value.forEach((heading) => {
    const element = document.getElementById(heading.id);
    if (element) {
      observer?.observe(element);
    }
  });
};

// Watch for route changes to extract new headings
onMounted(() => {
  extractHeadings();
  setupObserver();
});

onUnmounted(() => {
  observer?.disconnect();
});

// Re-extract headings when route changes
import { watch } from 'vue';
watch(() => route.path, () => {
  observer?.disconnect();
  extractHeadings();
  setTimeout(setupObserver, 100);
});
</script>

<style scoped>
.toc {
  position: sticky;
  top: 2rem;
}

.toc-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toc-link {
  display: block;
  padding: 0.375rem 0;
  color: #64748b;
  text-decoration: none;
  font-size: 0.85rem;
  line-height: 1.4;
  border-left: 2px solid transparent;
  padding-left: 0.75rem;
  margin-left: -0.75rem;
  transition: all 0.15s;
}

.toc-link:hover {
  color: #a9b1d6;
}

.toc-link.is-active {
  color: #a855f7;
  border-left-color: #a855f7;
  font-weight: 500;
}

.toc-link.level-2 {
  font-weight: 500;
}

.toc-link.level-3 {
  padding-left: 1.25rem;
  font-size: 0.8rem;
}

.toc-link.level-4 {
  padding-left: 1.75rem;
  font-size: 0.75rem;
}
</style>
