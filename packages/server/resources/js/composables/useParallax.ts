import { ref, onMounted, onUnmounted } from 'vue';

interface ParallaxOptions {
  speed?: number;    // -1 to 1, negative = opposite direction
  disabled?: boolean;
}

export function useParallax(options: ParallaxOptions = {}) {
  const { speed = 0.3, disabled = false } = options;
  const offset = ref(0);
  const elementRef = ref<HTMLElement | null>(null);
  let ticking = false;

  function handleScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      if (!elementRef.value) {
        ticking = false;
        return;
      }

      const rect = elementRef.value.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = elementCenter - viewportCenter;

      offset.value = distanceFromCenter * speed * -0.1;
      ticking = false;
    });
  }

  onMounted(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    if (disabled || prefersReducedMotion || isMobile) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });

  return { offset, elementRef };
}
