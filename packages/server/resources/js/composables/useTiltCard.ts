import { ref, onMounted, onUnmounted } from 'vue';

interface TiltOptions {
  maxTilt?: number;      // degrees (default 8)
  glare?: boolean;       // show glare overlay
  scale?: number;        // scale on hover (default 1.02)
  speed?: number;        // transition speed ms (default 400)
}

export function useTiltCard(options: TiltOptions = {}) {
  const { maxTilt = 8, glare = false, scale = 1.02, speed = 400 } = options;
  const cardRef = ref<HTMLElement | null>(null);
  const tiltX = ref(0);
  const tiltY = ref(0);
  const glareOpacity = ref(0);
  const isHovering = ref(false);

  function handleMouseMove(e: MouseEvent) {
    if (!cardRef.value) return;

    const rect = cardRef.value.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    tiltX.value = (y - 0.5) * maxTilt * -2;
    tiltY.value = (x - 0.5) * maxTilt * 2;

    if (glare) {
      glareOpacity.value = Math.max(x, y) * 0.15;
    }
  }

  function handleMouseEnter() {
    isHovering.value = true;
  }

  function handleMouseLeave() {
    isHovering.value = false;
    tiltX.value = 0;
    tiltY.value = 0;
    glareOpacity.value = 0;
  }

  const tiltStyle = () => ({
    transform: isHovering.value
      ? `perspective(1000px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) scale3d(${scale}, ${scale}, ${scale})`
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
  });

  onMounted(() => {
    if (!cardRef.value) return;

    // Desktop only
    const isTouchDevice = 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouchDevice || prefersReducedMotion) return;

    cardRef.value.addEventListener('mousemove', handleMouseMove);
    cardRef.value.addEventListener('mouseenter', handleMouseEnter);
    cardRef.value.addEventListener('mouseleave', handleMouseLeave);
  });

  onUnmounted(() => {
    if (!cardRef.value) return;
    cardRef.value.removeEventListener('mousemove', handleMouseMove);
    cardRef.value.removeEventListener('mouseenter', handleMouseEnter);
    cardRef.value.removeEventListener('mouseleave', handleMouseLeave);
  });

  return { cardRef, tiltX, tiltY, glareOpacity, isHovering, tiltStyle };
}
