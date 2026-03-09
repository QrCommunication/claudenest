import { ref, onMounted, onUnmounted } from 'vue';

export function useActiveSection(sectionIds: string[]) {
  const activeSection = ref(sectionIds[0] || '');
  let observer: IntersectionObserver | null = null;

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            activeSection.value = entry.target.id;
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer!.observe(element);
    });
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return { activeSection, scrollToSection };
}
